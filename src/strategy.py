"""Shared trading-signal construction and backtest metrics.

Both the served API (`api/main.py`) and the offline walk-forward validation harness
(`validate_strategy.py`) call into here, so a strategy validated offline is provably the
same strategy that gets served - no drift between the two implementations.
"""

import numpy as np

# Minimum predicted next-bar log return (~0.1%) before taking a position. Below this the
# forecast is inside the noise floor and trading it just churns commission.
DEFAULT_DEADBAND = 0.001

# Per-unit-of-notional-traded cost in basis points. A +1 -> -1 flip is a 200% notional
# turn and is charged as such.
DEFAULT_COST_BPS = 5.0


def build_signals(preds_returns, ma20=None, ma50=None, deadband=DEFAULT_DEADBAND):
    """Build per-bar target positions in [-1, 1] from predicted next-bar log returns.

    `preds_returns[i]` must be the model's forecast for bar `i`, produced using only data
    through bar `i-1` (i.e. already lag-correct - it is NOT shifted again here).

    `ma20`/`ma50` are same-bar indicator values, so the trend leg IS shifted by one bar
    internally before being combined. Lag alignment happens per-leg, before combination;
    applying a single shift to the combined signal would leave the NN leg a bar too stale.

    Returns a float array where 0.0 is a genuine flat (no position) state.
    """
    n = len(preds_returns)

    # NN leg - the sign of the predicted return is the directional call.
    nn_signal = np.zeros(n)
    nn_signal[preds_returns > deadband] = 1.0
    nn_signal[preds_returns < -deadband] = -1.0

    # Trend leg - needs its own 1-bar shift to avoid lookahead.
    if ma20 is not None and ma50 is not None:
        trend_raw = np.where(np.asarray(ma20) > np.asarray(ma50), 1.0, -1.0)
    else:
        trend_raw = np.zeros(n)  # no filter available -> neutral, not force-long
    trend_signal = np.roll(trend_raw, 1)
    trend_signal[0] = 0.0

    # Graduated combination: both legs agree -> full size; one leg neutral -> half size;
    # legs disagree -> flat.
    combined = nn_signal + trend_signal
    return np.select(
        [combined >= 2, combined <= -2, combined == 1, combined == -1],
        [1.0, -1.0, 0.5, -0.5],
        default=0.0,
    )


def apply_costs(signals, asset_returns, cost_bps=DEFAULT_COST_BPS):
    """Net strategy returns after charging for position changes."""
    gross = signals * asset_returns
    position_changes = np.abs(np.diff(signals, prepend=0.0))
    costs = position_changes * (cost_bps / 10000.0)
    return gross - costs


def compute_metrics(strategy_returns, asset_returns, start_capital=100000.0):
    """Standard backtest metrics for a strategy vs buy-and-hold."""
    strat_equity = start_capital * np.cumprod(1 + strategy_returns)
    bh_equity = start_capital * np.cumprod(1 + asset_returns)

    std_dev = np.std(strategy_returns)
    sharpe = float(np.mean(strategy_returns) / std_dev * np.sqrt(252)) if std_dev > 0 else 0.0

    bh_std = np.std(asset_returns)
    bh_sharpe = float(np.mean(asset_returns) / bh_std * np.sqrt(252)) if bh_std > 0 else 0.0

    roll_max = np.maximum.accumulate(strat_equity)
    max_dd = float(np.min(strat_equity / roll_max - 1.0) * 100)

    traded = strategy_returns[signals_nonzero_mask(strategy_returns)]
    win_rate = float(np.mean(traded > 0) * 100) if len(traded) > 0 else 0.0

    return {
        "strat_equity": strat_equity,
        "bh_equity": bh_equity,
        "total_return": float((strat_equity[-1] - start_capital) / start_capital * 100),
        "bh_return": float((bh_equity[-1] - start_capital) / start_capital * 100),
        "sharpe": sharpe,
        "bh_sharpe": bh_sharpe,
        "max_drawdown": max_dd,
        "win_rate": win_rate,
    }


def signals_nonzero_mask(returns):
    """Mask of bars where the strategy actually had exposure (non-zero P&L)."""
    return returns != 0.0
