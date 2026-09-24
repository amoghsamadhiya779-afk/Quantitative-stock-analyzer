"""Build the model report card (reports/report_card.json and reports/REPORT_CARD.md).

Usage:
    python build_report_card.py                          # every market, every model
    python build_report_card.py --baselines-only         # minutes instead of hours
    python build_report_card.py --markets SP500 DAX40 --folds 5

Data comes from data/raw/<market file> when present, otherwise from Yahoo Finance
(cached in data/cache/). See src/report_card.py for what is measured.
"""

import argparse
import json
import os
import time
import warnings

os.environ.setdefault("TF_CPP_MIN_LOG_LEVEL", "3")
warnings.filterwarnings("ignore")

from src.config import MARKET_CONFIG, MARKET_FILES  # noqa: E402
from src.report_card import build_report, render_markdown, score_market, walk_forward_forecasts  # noqa: E402
from src.strategy import DEFAULT_COST_BPS, DEFAULT_DEADBAND  # noqa: E402
from src.walkforward import BASELINES, DEEP_MODELS, load_price_history, make_forecaster, prepare_frame  # noqa: E402

MARKET_NAMES = {m["index_key"]: name for name, m in MARKET_CONFIG.items()}


def main():
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("--markets", nargs="+", default=list(MARKET_FILES), choices=list(MARKET_FILES))
    parser.add_argument("--models", nargs="+", default=list(BASELINES + DEEP_MODELS),
                        choices=list(BASELINES + DEEP_MODELS))
    parser.add_argument("--baselines-only", action="store_true", help="skip the deep models")
    parser.add_argument("--folds", type=int, default=4)
    parser.add_argument("--epochs", type=int, default=30)
    parser.add_argument("--seq-length", type=int, default=60)
    parser.add_argument("--deadband", type=float, default=DEFAULT_DEADBAND)
    parser.add_argument("--cost-bps", type=float, default=DEFAULT_COST_BPS)
    parser.add_argument("--data-dir", default="data")
    parser.add_argument("--out-dir", default="reports")
    args = parser.parse_args()

    models = [m for m in args.models if not (args.baselines_only and m in DEEP_MODELS)]
    results = {}
    for key in args.markets:
        started = time.time()
        try:
            prices, ticker, source = load_price_history(key, data_dir=args.data_dir)
        except Exception as e:  # one unreachable market shouldn't sink the whole report
            print(f"[{key}] skipped: {e}")
            continue

        frame = prepare_frame(prices)
        print(f"[{key}] {ticker}: {len(frame)} bars from {source}")
        rows, forecasts = walk_forward_forecasts(
            frame, models, n_folds=args.folds, seq_length=args.seq_length, epochs=args.epochs,
        )
        scored, buy_and_hold, meta = score_market(frame, rows, forecasts, args.deadband, args.cost_bps)

        dates = frame.index  # engineer_features indexes by Date
        results[MARKET_NAMES[key]] = {
            "index_key": key,
            "ticker": ticker,
            "source": source,
            "start": str(dates[rows[0]])[:10],
            "end": str(dates[rows[-1]])[:10],
            "n_test_bars": int(len(rows)),
            "models": scored,
            "buy_and_hold": buy_and_hold,
            **meta,
        }
        print(f"[{key}] done in {time.time() - started:.0f}s")

    if not results:
        raise SystemExit("No markets could be evaluated.")

    config = {
        "n_folds": args.folds, "epochs": args.epochs, "seq_length": args.seq_length,
        "deadband": args.deadband, "cost_bps": args.cost_bps, "models": models,
    }
    report = build_report(results, config)
    descriptions = {m: make_forecaster(m).description for m in models}

    os.makedirs(args.out_dir, exist_ok=True)
    with open(os.path.join(args.out_dir, "report_card.json"), "w") as f:
        json.dump(report, f, indent=2)
    with open(os.path.join(args.out_dir, "REPORT_CARD.md"), "w") as f:
        f.write(render_markdown(report, descriptions))
    print(f"\nWrote {args.out_dir}/report_card.json and {args.out_dir}/REPORT_CARD.md")


if __name__ == "__main__":
    main()
