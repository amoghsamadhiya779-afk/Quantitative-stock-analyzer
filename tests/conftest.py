import numpy as np
import pandas as pd
import pytest


def make_prices(n=1200, phi=0.0, seed=0):
    """Synthetic OHLCV. With phi != 0, daily log returns follow an AR(1) process, which
    makes the next return partly predictable from today's."""
    rng = np.random.default_rng(seed)
    shocks = rng.normal(0.0002, 0.012, n)
    returns = np.empty(n)
    returns[0] = shocks[0]
    for t in range(1, n):
        returns[t] = phi * returns[t - 1] + shocks[t]
    close = 100 * np.exp(np.cumsum(returns))
    open_ = close * np.exp(rng.normal(0, 0.002, n))
    return pd.DataFrame({
        "Date": pd.bdate_range("2010-01-01", periods=n),
        "Open": open_,
        "High": np.maximum(open_, close) * 1.004,
        "Low": np.minimum(open_, close) * 0.996,
        "Close": close,
        "Volume": rng.integers(800_000, 1_200_000, n).astype(float),
    })


@pytest.fixture
def prices():
    return make_prices()
