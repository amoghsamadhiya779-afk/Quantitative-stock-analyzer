"""Pytest checks for feature engineering logic."""
import pytest
import pandas as pd
import numpy as np
from src.feature_engineering import FeatureEngineering


def _dummy_ohlcv(n=100):
    dates = pd.date_range(start='1/1/2023', periods=n)
    # NumPy arrays, not a pandas Series - a Series carries its own default RangeIndex,
    # and building a DataFrame with a different explicit `index=` would align (and NaN)
    # every value against that mismatched index.
    close = np.linspace(100, 200, n)
    return pd.DataFrame({
        'Open': close - 0.5,
        'High': close + 1.0,
        'Low': close - 1.0,
        'Close': close,
        'Volume': np.linspace(1_000_000, 2_000_000, n),
    }, index=dates)


def test_engineer_features():
    """Test if the feature engineering logic calculates indicators correctly."""
    # 220 rows so MA_200's 200-row warmup actually completes within the sample.
    df = _dummy_ohlcv(220)

    df_engineered = FeatureEngineering.engineer_features(df)

    # 1. Check if all required columns were created
    expected_columns = ['Close', 'MA_20', 'MA_50', 'Volatility_20', 'Daily_Return', 'RSI_14']
    for col in expected_columns:
        assert col in df_engineered.columns, f"Missing feature column: {col}"

    # 2. Row count is preserved. Indicators with a long warmup (MA_50, MA_200, ...) are
    # zero-filled for their first N rows rather than dropped - the caller only ever needs
    # the most recent rows, and dropping would also silently discard training history.
    assert len(df_engineered) == len(df), (
        f"engineer_features should preserve row count, got {len(df_engineered)} from {len(df)}"
    )

    # 3. Verify that there are no remaining missing values
    assert df_engineered.isnull().sum().sum() == 0, "There should be no NaN values remaining in the dataset."

    # 4. The long-window indicators should be genuinely zero during their warmup period,
    # not back-filled from later rows (that would leak future data into early training rows).
    assert (df_engineered['MA_200'].iloc[:199] == 0).all(), (
        "MA_200 should be 0 during its warmup window, not back-filled from future rows."
    )
    assert df_engineered['MA_200'].iloc[199] != 0, "MA_200 should be populated once 200 rows are available."
