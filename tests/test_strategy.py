"""Checks for the shared signal / backtest logic in src/strategy.py."""
import numpy as np

from src.strategy import apply_costs, build_signals, compute_metrics


def test_signals_do_not_use_future_data():
    """Changing the future must never change past positions (no lookahead)."""
    rng = np.random.default_rng(0)
    n = 200
    preds = rng.normal(0, 0.005, n)
    ma20 = 100 + rng.normal(0, 1, n).cumsum()
    ma50 = 100 + rng.normal(0, 1, n).cumsum()

    base = build_signals(preds, ma20, ma50)

    cut = 120
    preds2, ma20_2, ma50_2 = preds.copy(), ma20.copy(), ma50.copy()
    preds2[cut:] = -preds2[cut:]
    ma20_2[cut:], ma50_2[cut:] = ma50[cut:], ma20[cut:]
    changed = build_signals(preds2, ma20_2, ma50_2)

    np.testing.assert_array_equal(base[:cut], changed[:cut])


def test_trend_leg_is_lagged_one_bar():
    """A same-bar MA crossover must only affect the NEXT bar's position."""
    preds = np.zeros(5)  # NN leg neutral, so position comes from trend alone
    ma20 = np.array([1, 1, 3, 3, 3])
    ma50 = np.array([2, 2, 2, 2, 2])
    signals = build_signals(preds, ma20, ma50, long_only=False)
    # Crossover happens at bar 2, so it shows up at bar 3.
    np.testing.assert_array_equal(signals, [0.0, -0.5, -0.5, 0.5, 0.5])


def test_deadband_keeps_small_forecasts_flat():
    preds = np.array([0.0005, -0.0005, 0.002, -0.002])
    signals = build_signals(preds, long_only=False)
    np.testing.assert_array_equal(signals, [0.0, 0.0, 0.5, -0.5])


def test_long_only_is_default_and_never_shorts():
    rng = np.random.default_rng(1)
    preds = rng.normal(0, 0.005, 300)
    ma20 = 100 + rng.normal(0, 1, 300).cumsum()
    ma50 = 100 + rng.normal(0, 1, 300).cumsum()

    long_short = build_signals(preds, ma20, ma50, long_only=False)
    default = build_signals(preds, ma20, ma50)
    assert (long_short < 0).any()
    np.testing.assert_array_equal(default, np.maximum(long_short, 0.0))


def test_costs_charge_position_changes():
    signals = np.array([1.0, 1.0, -1.0, 0.0])
    returns = np.zeros(4)
    net = apply_costs(signals, returns, cost_bps=10)
    # Entering long (1.0), holding (0), flipping (2.0), closing (1.0) notional turns.
    np.testing.assert_allclose(net, [-0.001, 0.0, -0.002, -0.001])


def test_metrics_on_flat_returns():
    zeros = np.zeros(10)
    m = compute_metrics(zeros, zeros)
    assert m["total_return"] == 0.0
    assert m["sharpe"] == 0.0
    assert m["max_drawdown"] == 0.0
