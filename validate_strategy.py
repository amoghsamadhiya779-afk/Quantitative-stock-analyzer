"""Per-fold walk-forward validation of one model on one market.

A quick, verbose view of a single model. For the full comparison against baselines,
with significance tests, run build_report_card.py.

Trains on an expanding window and evaluates each subsequent fold strictly out-of-sample,
using the SAME signal construction the API serves (src/strategy.py).

Usage:
    python validate_strategy.py                       # DAX40, CNN_BiLSTM_Attention
    python validate_strategy.py --market FTSE100 --folds 5
    python validate_strategy.py --model Ridge --cost-bps 0
"""

import argparse
import os
import warnings

import numpy as np

warnings.filterwarnings('ignore')
os.environ.setdefault('TF_CPP_MIN_LOG_LEVEL', '3')

from src.config import MARKET_FILES  # noqa: E402
from src.significance import directional_accuracy  # noqa: E402
from src.strategy import DEFAULT_COST_BPS, DEFAULT_DEADBAND, apply_costs, build_signals, compute_metrics  # noqa: E402
from src.walkforward import (  # noqa: E402
    BASELINES, DEEP_MODELS, expanding_folds, feature_columns, load_price_history, make_forecaster, prepare_frame,
)


def run_fold(frame, features, train_end, test_end, model_name, seq_length, epochs, deadband, cost_bps):
    """Train on rows [0, train_end) and evaluate strictly out-of-sample on [train_end, test_end)."""
    rows = np.arange(train_end, test_end)
    model = make_forecaster(model_name, seq_length=seq_length, epochs=epochs).fit(frame, features, train_end)
    forecasts = model.predict(frame, features, rows)

    signals = build_signals(
        forecasts,
        ma20=frame['_next_ma20'].values[rows],
        ma50=frame['_next_ma50'].values[rows],
        deadband=deadband,
    )
    asset_returns = frame['_next_simple_return'].values[rows]
    metrics = compute_metrics(apply_costs(signals, asset_returns, cost_bps=cost_bps), asset_returns)

    da, _, _ = directional_accuracy(forecasts, frame['Target_Return'].values[rows])
    metrics['directional_accuracy'] = da * 100 if np.isfinite(da) else float('nan')
    metrics['flips'] = int(np.sum(np.abs(np.diff(signals, prepend=0.0)) > 0))
    metrics['pct_flat'] = float(np.mean(signals == 0.0) * 100)
    metrics['n_bars'] = len(rows)
    return metrics


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--market", default="DAX40", choices=list(MARKET_FILES))
    parser.add_argument("--model", default="CNN_BiLSTM_Attention", choices=list(DEEP_MODELS + BASELINES))
    parser.add_argument("--folds", type=int, default=4)
    parser.add_argument("--seq-length", type=int, default=60)
    parser.add_argument("--epochs", type=int, default=30)
    parser.add_argument("--deadband", type=float, default=DEFAULT_DEADBAND)
    parser.add_argument("--cost-bps", type=float, default=DEFAULT_COST_BPS)
    args = parser.parse_args()

    prices, ticker, source = load_price_history(args.market)
    frame = prepare_frame(prices)
    features = feature_columns(frame)

    print(f"\n{'=' * 72}")
    print(f" WALK-FORWARD VALIDATION - {args.market} / {ticker} / {args.model}")
    print(f" {len(frame)} bars ({source}) | {len(features)} features | "
          f"deadband={args.deadband} | cost={args.cost_bps}bps")
    print(f"{'=' * 72}\n")

    results = []
    for k, (train_end, test_end) in enumerate(expanding_folds(len(frame), args.folds), start=1):
        m = run_fold(frame, features, train_end, test_end, args.model,
                     args.seq_length, args.epochs, args.deadband, args.cost_bps)
        results.append(m)
        print(f"[fold {k}] bars={m['n_bars']:>4}  "
              f"DA={m['directional_accuracy']:>5.1f}%  "
              f"ret={m['total_return']:>7.2f}% (BH {m['bh_return']:>7.2f}%)  "
              f"Sharpe={m['sharpe']:>6.2f} (BH {m['bh_sharpe']:>6.2f})  "
              f"maxDD={m['max_drawdown']:>7.2f}%  "
              f"flips={m['flips']:>3}  flat={m['pct_flat']:>4.1f}%")

    mean_sharpe = np.mean([m['sharpe'] for m in results])
    mean_bh_sharpe = np.mean([m['bh_sharpe'] for m in results])
    beat = sum(1 for m in results if m['sharpe'] > m['bh_sharpe'])

    print(f"\n{'-' * 72}")
    print(f" AGGREGATE over {len(results)} folds")
    print(f"   Mean directional accuracy : {np.nanmean([m['directional_accuracy'] for m in results]):.2f}%   (coin flip = 50%)")
    print(f"   Mean strategy Sharpe      : {mean_sharpe:.3f}")
    print(f"   Mean buy-and-hold Sharpe  : {mean_bh_sharpe:.3f}")
    print(f"   Mean strategy return      : {np.mean([m['total_return'] for m in results]):.2f}%")
    print(f"   Mean buy-and-hold return  : {np.mean([m['bh_return'] for m in results]):.2f}%")
    print(f"   Folds beating buy-and-hold: {beat}/{len(results)}")
    print(f"{'-' * 72}")

    if mean_sharpe > 0 and mean_sharpe > mean_bh_sharpe:
        print(" PASS - positive out-of-sample Sharpe, beats buy-and-hold on average.\n")
    elif mean_sharpe > 0:
        print(" PARTIAL - positive Sharpe but does not beat buy-and-hold on average.\n")
    else:
        print(" FAIL - no positive out-of-sample edge.\n")


if __name__ == "__main__":
    main()
