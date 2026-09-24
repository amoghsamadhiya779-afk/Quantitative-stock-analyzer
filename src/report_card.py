"""Model report card: every forecaster, every market, scored strictly out-of-sample.

For each market, all forecasters are evaluated on the SAME walk-forward test bars. Each
forecast is scored twice:

1. As a forecast: directional accuracy (binomial test vs a coin flip), out-of-sample R^2
   and a Diebold-Mariano test, both against the random-walk (zero-return) forecast.
2. As the strategy the API serves (src/strategy.py: deadband, trend filter, costs):
   Sharpe with a block-bootstrap CI, return, drawdown, and the Deflated Sharpe Ratio,
   which accounts for having tried every model on this market.
"""

from datetime import datetime, timezone

import numpy as np

from src import significance as sig
from src.strategy import DEFAULT_COST_BPS, DEFAULT_DEADBAND, apply_costs, build_signals
from src.walkforward import expanding_folds, feature_columns, make_forecaster

REPORT_VERSION = 1

# A forecaster "shows skill" when it beats the random walk at this significance level.
SKILL_ALPHA = 0.05
# Deflated Sharpe above this is treated as a strategy edge that survives selection bias.
DSR_THRESHOLD = 0.95


def walk_forward_forecasts(frame, model_names, n_folds=4, seq_length=60, epochs=30, log=print):
    """Out-of-sample forecasts for each model over the concatenated test folds.

    Returns (test_rows, {model_name: forecasts}). Rows are aligned across models.
    """
    features = feature_columns(frame)
    folds = expanding_folds(len(frame), n_folds)
    rows = np.concatenate([np.arange(a, b) for a, b in folds])
    forecasts = {name: [] for name in model_names}

    for k, (train_end, test_end) in enumerate(folds, start=1):
        fold_rows = np.arange(train_end, test_end)
        for name in model_names:
            model = make_forecaster(name, seq_length=seq_length, epochs=epochs)
            model.fit(frame, features, train_end)
            forecasts[name].append(model.predict(frame, features, fold_rows))
            log(f"  fold {k}/{len(folds)}  {name:<22} done")

    return rows, {name: np.concatenate(parts) for name, parts in forecasts.items()}


def _strategy_returns(forecast, frame, rows, deadband, cost_bps):
    signals = build_signals(
        forecast,
        ma20=frame["_next_ma20"].values[rows],
        ma50=frame["_next_ma50"].values[rows],
        deadband=deadband,
    )
    asset = frame["_next_simple_return"].values[rows]
    return apply_costs(signals, asset, cost_bps=cost_bps), signals


def _pct(x):
    return None if x is None or not np.isfinite(x) else round(float(x) * 100, 2)


def _num(x, digits=3):
    return None if x is None or not np.isfinite(x) else round(float(x), digits)


def score_market(frame, rows, forecasts, deadband=DEFAULT_DEADBAND, cost_bps=DEFAULT_COST_BPS):
    """Metrics for every model on one market, plus a buy-and-hold reference."""
    actual = frame["Target_Return"].values[rows]
    asset = frame["_next_simple_return"].values[rows]
    zero = np.zeros_like(actual)

    strategies = {name: _strategy_returns(f, frame, rows, deadband, cost_bps) for name, f in forecasts.items()}

    # Selection-bias correction: every model tried on this market counts as a trial.
    per_period_sharpes = []
    for returns, _ in strategies.values():
        sd = returns.std(ddof=1)
        per_period_sharpes.append(returns.mean() / sd if sd > 0 else 0.0)
    n_trials = len(per_period_sharpes)
    trial_std = float(np.std(per_period_sharpes, ddof=1)) if n_trials > 1 else 0.0

    models = {}
    for name, forecast in forecasts.items():
        returns, signals = strategies[name]
        da, da_n, da_p = sig.directional_accuracy(forecast, actual)
        dm_stat, dm_p = sig.diebold_mariano(actual, forecast, zero)
        ci_lo, ci_hi = sig.block_bootstrap_sharpe_ci(returns)
        models[name] = {
            "directional_accuracy": _pct(da),
            "directional_bars": da_n,
            "directional_p_value": _num(da_p, 4),
            "oos_r2_vs_random_walk": _pct(sig.oos_r2(actual, forecast, zero)),
            "dm_stat_vs_random_walk": _num(dm_stat),
            "dm_p_value_vs_random_walk": _num(dm_p, 4),
            "sharpe": _num(sig.sharpe_ratio(returns)),
            "sharpe_ci_95": [_num(ci_lo), _num(ci_hi)],
            "total_return": _pct(np.prod(1 + returns) - 1),
            "max_drawdown": _pct(sig.max_drawdown(returns)),
            "exposure": _pct(np.mean(signals != 0)),
            "psr": _num(sig.probabilistic_sharpe_ratio(returns)),
            "dsr": _num(sig.deflated_sharpe_ratio(returns, n_trials, trial_std)),
        }
        models[name]["forecast_skill"] = bool(np.isfinite(dm_p) and dm_p < SKILL_ALPHA)
        dsr = models[name]["dsr"]
        models[name]["strategy_edge"] = bool(dsr is not None and dsr > DSR_THRESHOLD)

    bh_lo, bh_hi = sig.block_bootstrap_sharpe_ci(asset)
    buy_and_hold = {
        "sharpe": _num(sig.sharpe_ratio(asset)),
        "sharpe_ci_95": [_num(bh_lo), _num(bh_hi)],
        "total_return": _pct(np.prod(1 + asset) - 1),
        "max_drawdown": _pct(sig.max_drawdown(asset)),
    }
    return models, buy_and_hold, {"n_trials": n_trials}


def summarize(markets, model_order):
    """Cross-market tallies per model, in `model_order`."""
    present = {m for market in markets.values() for m in market["models"]}
    names = [m for m in model_order if m in present]
    summary = {}
    for name in names:
        rows = [market["models"][name] for market in markets.values() if name in market["models"]]
        bh = [market["buy_and_hold"]["sharpe"] for market in markets.values() if name in market["models"]]
        sharpes = [r["sharpe"] for r in rows if r["sharpe"] is not None]
        das = [r["directional_accuracy"] for r in rows if r["directional_accuracy"] is not None]
        summary[name] = {
            "markets": len(rows),
            "markets_with_forecast_skill": sum(r["forecast_skill"] for r in rows),
            "markets_with_strategy_edge": sum(r["strategy_edge"] for r in rows),
            "markets_beating_buy_and_hold": sum(
                1 for r, b in zip(rows, bh) if r["sharpe"] is not None and b is not None and r["sharpe"] > b
            ),
            "median_sharpe": _num(np.median(sharpes)) if sharpes else None,
            "median_directional_accuracy": _num(np.median(das), 2) if das else None,
        }
    return summary


def build_report(market_results, config):
    return {
        "version": REPORT_VERSION,
        "generated_at": datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
        "config": config,
        "markets": market_results,
        "summary": summarize(market_results, config["models"]),
    }


# ---------------------------------------------------------------------------------------
# Markdown rendering
# ---------------------------------------------------------------------------------------

def _fmt(x, suffix="", digits=2):
    return "–" if x is None else f"{x:.{digits}f}{suffix}"


def _fmt_p(p):
    if p is None:
        return "–"
    return "<0.001" if p < 0.001 else f"{p:.3f}"


def render_markdown(report, descriptions=None):
    descriptions = descriptions or {}
    cfg = report["config"]
    out = [
        "# Model Report Card",
        "",
        f"Generated {report['generated_at']} by `build_report_card.py`. "
        f"{cfg['n_folds']} expanding walk-forward folds, {cfg['cost_bps']:g} bps cost per unit of "
        f"notional traded, {cfg['deadband'] * 100:g}% deadband, deep models trained for up to "
        f"{cfg['epochs']} epochs.",
        "",
        "Every model is scored on the same out-of-sample bars. Nothing in a test fold is seen "
        "during training, scaling or early stopping.",
        "",
        "## Summary across markets",
        "",
        "| Model | Markets | Forecast skill¹ | Strategy edge² | Beats buy & hold (Sharpe) | Median Sharpe | Median directional accuracy |",
        "|---|---|---|---|---|---|---|",
    ]
    for name, s in report["summary"].items():
        n = s["markets"]
        out.append(
            f"| {name} | {n} | {s['markets_with_forecast_skill']}/{n} | {s['markets_with_strategy_edge']}/{n} "
            f"| {s['markets_beating_buy_and_hold']}/{n} | {_fmt(s['median_sharpe'])} "
            f"| {_fmt(s['median_directional_accuracy'], '%')} |"
        )
    out += [
        "",
        f"¹ Diebold-Mariano test against the random-walk forecast, one-sided p < {SKILL_ALPHA}.  ",
        f"² Deflated Sharpe Ratio > {DSR_THRESHOLD}, correcting for every model tried on that market.",
        "",
    ]

    for market, m in report["markets"].items():
        bh = m["buy_and_hold"]
        out += [
            f"## {market}",
            "",
            f"{m['ticker']} · {m['start']} to {m['end']} · {m['n_test_bars']} out-of-sample bars · "
            f"data: {m['source']}",
            "",
            "| Model | Directional acc. (p) | OOS R² vs RW | DM p vs RW | Sharpe [95% CI] | Return | Max DD | Exposure | DSR |",
            "|---|---|---|---|---|---|---|---|---|",
        ]
        for name, r in m["models"].items():
            lo, hi = r["sharpe_ci_95"]
            da = "–" if r["directional_accuracy"] is None else f"{r['directional_accuracy']:.1f}% ({_fmt_p(r['directional_p_value'])})"
            dm = "benchmark" if name == "RandomWalk" else _fmt_p(r["dm_p_value_vs_random_walk"])
            out.append(
                f"| {name} | {da} | {_fmt(r['oos_r2_vs_random_walk'], '%', 3)} | {dm} "
                f"| {_fmt(r['sharpe'])} [{_fmt(lo)}, {_fmt(hi)}] | {_fmt(r['total_return'], '%', 1)} "
                f"| {_fmt(r['max_drawdown'], '%', 1)} | {_fmt(r['exposure'], '%', 0)} | {_fmt(r['dsr'])} |"
            )
        lo, hi = bh["sharpe_ci_95"]
        out += [
            f"| *Buy & hold* | | | | {_fmt(bh['sharpe'])} [{_fmt(lo)}, {_fmt(hi)}] | {_fmt(bh['total_return'], '%', 1)} "
            f"| {_fmt(bh['max_drawdown'], '%', 1)} | 100% | |",
            "",
        ]

    out += ["## Models", ""]
    for name in report["summary"]:
        out.append(f"- **{name}**: {descriptions.get(name, '')}")
    out += [
        "",
        "## How to read this",
        "",
        "- **RandomWalk** forecasts zero, so its strategy row is the trend filter (MA20 vs MA50) "
        "on its own. A model only adds value if it beats that row.",
        "- **Directional accuracy** excludes bars where the forecast is exactly zero; the p-value "
        "tests it against a coin flip.",
        "- **OOS R²** is relative to the random walk. Slightly negative is normal for daily returns.",
        "- **Exposure** is the share of bars with a position. Forecasts inside the deadband keep the "
        "neural leg flat, so a model that rarely clears it behaves like the trend filter.",
        "- **DSR** is the probability that the Sharpe ratio is real after accounting for trying "
        "every model in the table on the same data.",
        "",
    ]
    return "\n".join(out)
