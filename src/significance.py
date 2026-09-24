"""Statistical tests for out-of-sample forecasts and strategy returns.

Everything here answers some version of "is this result distinguishable from luck?":

- directional accuracy with a binomial test against a coin flip,
- out-of-sample R^2 against a benchmark forecast (Campbell & Thompson, 2008),
- the Diebold-Mariano test for equal predictive accuracy, with the
  Harvey-Leybourne-Newbold small-sample correction,
- a block-bootstrap confidence interval for the Sharpe ratio (daily returns are
  autocorrelated, so an i.i.d. bootstrap would understate the interval),
- the Probabilistic and Deflated Sharpe Ratios (Bailey & Lopez de Prado, 2012/2014),
  the latter correcting for how many strategies were tried before picking one.

Sharpe ratios passed between these functions are PER-PERIOD (not annualised) unless a
name says otherwise; that is the unit the PSR/DSR formulas are derived in.
"""

import numpy as np
from scipy import stats

TRADING_DAYS = 252
EULER_GAMMA = 0.5772156649015329


def directional_accuracy(forecasts, actuals):
    """Share of bars where the forecast sign matched the realised sign.

    Bars where either side is exactly zero carry no directional call and are excluded.
    Returns (accuracy in [0, 1], number of bars scored, one-sided binomial p-value for
    H0: accuracy <= 0.5).
    """
    f = np.sign(np.asarray(forecasts, dtype=float))
    a = np.sign(np.asarray(actuals, dtype=float))
    mask = (f != 0) & (a != 0)
    n = int(mask.sum())
    if n == 0:
        return float("nan"), 0, float("nan")
    hits = int((f[mask] == a[mask]).sum())
    p_value = stats.binomtest(hits, n, 0.5, alternative="greater").pvalue
    return hits / n, n, float(p_value)


def oos_r2(actuals, forecasts, benchmark):
    """Out-of-sample R^2 of `forecasts` relative to `benchmark` forecasts.

    Positive means lower squared error than the benchmark. For daily returns, values of
    even +0.5% are economically meaningful; most models land slightly below zero.
    """
    a = np.asarray(actuals, dtype=float)
    sse_model = np.sum((a - np.asarray(forecasts, dtype=float)) ** 2)
    sse_bench = np.sum((a - np.asarray(benchmark, dtype=float)) ** 2)
    if sse_bench == 0:
        return float("nan")
    return float(1.0 - sse_model / sse_bench)


def diebold_mariano(actuals, forecasts, benchmark, horizon=1):
    """Diebold-Mariano test that `forecasts` beat `benchmark` under squared-error loss.

    Returns (statistic, one-sided p-value). A positive statistic means the model's
    losses are lower than the benchmark's; a small p-value means that is unlikely to be
    chance. Uses a Newey-West long-run variance with `horizon - 1` lags and the
    Harvey-Leybourne-Newbold (1997) correction, compared against Student-t(n-1).
    """
    a = np.asarray(actuals, dtype=float)
    d = (a - np.asarray(benchmark, dtype=float)) ** 2 - (a - np.asarray(forecasts, dtype=float)) ** 2
    n = len(d)
    if n < 3:
        return float("nan"), float("nan")

    d_mean = d.mean()
    centered = d - d_mean
    long_run_var = np.dot(centered, centered) / n
    for lag in range(1, horizon):
        weight = 1.0 - lag / horizon
        long_run_var += 2 * weight * np.dot(centered[lag:], centered[:-lag]) / n
    if long_run_var <= 0:
        return 0.0, 0.5

    dm = d_mean / np.sqrt(long_run_var / n)
    hln = np.sqrt((n + 1 - 2 * horizon + horizon * (horizon - 1) / n) / n)
    stat = float(dm * hln)
    return stat, float(stats.t.sf(stat, df=n - 1))


def sharpe_ratio(returns, periods_per_year=TRADING_DAYS):
    """Annualised Sharpe ratio (zero risk-free rate)."""
    r = np.asarray(returns, dtype=float)
    sd = r.std(ddof=1) if len(r) > 1 else 0.0
    if sd == 0:
        return 0.0
    return float(r.mean() / sd * np.sqrt(periods_per_year))


def block_bootstrap_sharpe_ci(returns, n_boot=2000, block_size=20, alpha=0.05, seed=0,
                              periods_per_year=TRADING_DAYS):
    """(lower, upper) confidence interval for the annualised Sharpe ratio.

    Circular block bootstrap: resamples contiguous blocks so volatility clustering and
    short-range autocorrelation survive resampling.
    """
    r = np.asarray(returns, dtype=float)
    n = len(r)
    if n < 2 * block_size:
        return float("nan"), float("nan")

    rng = np.random.default_rng(seed)
    n_blocks = int(np.ceil(n / block_size))
    starts = rng.integers(0, n, size=(n_boot, n_blocks))
    offsets = np.arange(block_size)
    idx = ((starts[:, :, None] + offsets) % n).reshape(n_boot, -1)[:, :n]
    samples = r[idx]

    sd = samples.std(axis=1, ddof=1)
    with np.errstate(divide="ignore", invalid="ignore"):
        sharpes = np.where(sd > 0, samples.mean(axis=1) / sd, 0.0) * np.sqrt(periods_per_year)
    lo, hi = np.quantile(sharpes, [alpha / 2, 1 - alpha / 2])
    return float(lo), float(hi)


def probabilistic_sharpe_ratio(returns, sr_benchmark=0.0):
    """Probability that the true per-period Sharpe exceeds `sr_benchmark`.

    Adjusts for sample length, skewness and fat tails: the same observed Sharpe is less
    convincing over fewer bars or with negatively skewed, fat-tailed returns.
    """
    r = np.asarray(returns, dtype=float)
    n = len(r)
    sd = r.std(ddof=1) if n > 1 else 0.0
    if n < 3 or sd == 0:
        return float("nan")
    sr = r.mean() / sd
    skew = stats.skew(r)
    kurt = stats.kurtosis(r, fisher=False)  # raw kurtosis, 3 for a normal
    denom = 1.0 - skew * sr + (kurt - 1.0) / 4.0 * sr ** 2
    if denom <= 0:
        return float("nan")
    z = (sr - sr_benchmark) * np.sqrt(n - 1) / np.sqrt(denom)
    return float(stats.norm.cdf(z))


def expected_max_sharpe(n_trials, trial_sharpe_std):
    """Expected maximum per-period Sharpe among `n_trials` strategies with no true edge.

    This is the bar a selected strategy has to clear: picking the best of many
    zero-skill strategies still yields a positive Sharpe on average.
    """
    if n_trials <= 1:
        return 0.0
    return float(trial_sharpe_std * (
        (1 - EULER_GAMMA) * stats.norm.ppf(1 - 1.0 / n_trials)
        + EULER_GAMMA * stats.norm.ppf(1 - 1.0 / (n_trials * np.e))
    ))


def deflated_sharpe_ratio(returns, n_trials, trial_sharpe_std):
    """PSR measured against the Sharpe you would expect from the best of `n_trials`
    skill-less strategies. `trial_sharpe_std` is the per-period Sharpe dispersion across
    the strategies that were tried."""
    return probabilistic_sharpe_ratio(returns, expected_max_sharpe(n_trials, trial_sharpe_std))


def max_drawdown(returns):
    """Maximum peak-to-trough decline of the compounded equity curve, as a negative fraction."""
    equity = np.cumprod(1 + np.asarray(returns, dtype=float))
    peak = np.maximum.accumulate(equity)
    return float(np.min(equity / peak - 1.0)) if len(equity) else 0.0
