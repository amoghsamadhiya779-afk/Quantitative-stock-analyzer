from src.report_card import build_report, render_markdown, score_market, walk_forward_forecasts
from src.walkforward import prepare_frame

from tests.conftest import make_prices

MODELS = ["RandomWalk", "Ridge"]


def _score(prices):
    frame = prepare_frame(prices)
    rows, forecasts = walk_forward_forecasts(frame, MODELS, n_folds=3, log=lambda *_: None)
    return score_market(frame, rows, forecasts)


def test_detects_a_planted_edge():
    """Strongly autocorrelated returns ARE predictable; the report card must say so."""
    models, _, _ = _score(make_prices(n=1500, phi=0.3, seed=5))
    assert models["Ridge"]["forecast_skill"]
    assert models["Ridge"]["directional_accuracy"] > 55


def test_finds_no_edge_in_a_random_walk():
    models, _, _ = _score(make_prices(n=1500, phi=0.0, seed=6))
    assert not models["Ridge"]["forecast_skill"]
    assert not models["RandomWalk"]["forecast_skill"]


def test_report_renders():
    models, bh, meta = _score(make_prices(n=900, seed=7))
    market = {
        "ticker": "SYN", "source": "synthetic", "start": "2012-01-01", "end": "2013-06-01",
        "n_test_bars": 450, "models": models, "buy_and_hold": bh, **meta,
    }
    report = build_report(
        {"Testland": market},
        {"n_folds": 3, "epochs": 1, "seq_length": 60, "deadband": 0.001, "cost_bps": 5.0, "models": MODELS},
    )
    assert list(report["summary"]) == MODELS
    md = render_markdown(report)
    assert "## Testland" in md and "| Ridge |" in md and "*Buy & hold*" in md
