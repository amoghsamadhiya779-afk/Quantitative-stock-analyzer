"""Pytest checks for feature engineering logic."""
import pytest
import pandas as pd
import numpy as np
from src.feature_engineering import FeatureEngineering

def test_engineer_features():
    """Test if the feature engineering logic calculates indicators correctly."""
    
    # Generate 100 days of dummy sequential data
    dates = pd.date_range(start='1/1/2023', periods=100)
    df = pd.DataFrame({
        'Close': np.linspace(100, 200, 100)  # Steadily increasing prices
    }, index=dates)
    
    # Run the feature engineering step
    df_engineered = FeatureEngineering.engineer_features(df)
    
    # 1. Check if all required columns were created
    expected_columns = ['Close', 'MA_20', 'MA_50', 'Volatility_20', 'Daily_Return', 'RSI_14']
    for col in expected_columns:
        assert col in df_engineered.columns, f"Missing feature column: {col}"
        
    # 2. Check if NaN values were dropped correctly
    # Because MA_50 requires 50 days of lookback, the first 49 rows will contain NaNs and should be dropped.
    expected_length = 100 - 49
    assert len(df_engineered) == expected_length, f"Expected {expected_length} rows after dropna(), got {len(df_engineered)}"
    
    # 3. Verify that there are no remaining missing values
    assert df_engineered.isnull().sum().sum() == 0, "There should be no NaN values remaining in the dataset."