import pandas as pd
import numpy as np

class FeatureEngineering:
    """Advanced Institutional Quantitative Indicators Engine"""
    @staticmethod
    def engineer_features(df):
        df = df.copy()
        if 'Close' in df.columns:
            df = df.dropna(subset=['Close'])
        if 'Date' in df.columns:
            df = df.set_index('Date')
            
        close = df['Close']
        high = df['High']
        low = df['Low']
        volume = df['Volume']
        
        # Base Returns
        df['Daily_Return'] = close.pct_change()
        df['Log_Return'] = np.log(close / close.shift(1))
        df['Ret_1D'] = df['Log_Return'] # Switch to log returns for stationarity
        df['Ret_5D'] = close.pct_change(5)
        df['Ret_20D'] = close.pct_change(20)

        # Simple Moving Averages
        df['MA_20'] = close.rolling(window=20).mean()
        df['MA_50'] = close.rolling(window=50).mean()
        df['MA_200'] = close.rolling(window=200).mean()
        
        # Exponential Moving Averages (Trend)
        df['EMA_20'] = close.ewm(span=20, adjust=False).mean()
        df['EMA_50'] = close.ewm(span=50, adjust=False).mean()
        df['EMA_200'] = close.ewm(span=200, adjust=False).mean()
        
        # Price Structure (Distance from MAs)
        df['Dist_MA_20'] = (close - df['MA_20']) / df['MA_20']
        df['Dist_MA_50'] = (close - df['MA_50']) / df['MA_50']
        df['Dist_MA_200'] = (close - df['MA_200']) / df['MA_200']

        # Momentum: Rate of Change (ROC)
        df['ROC_5'] = close.pct_change(periods=5) * 100
        df['ROC_10'] = close.pct_change(periods=10) * 100
        df['ROC_20'] = close.pct_change(periods=20) * 100

        # MACD
        exp1 = close.ewm(span=12, adjust=False).mean()
        exp2 = close.ewm(span=26, adjust=False).mean()
        df['MACD'] = exp1 - exp2
        df['Signal_Line'] = df['MACD'].ewm(span=9, adjust=False).mean()
        df['MACD_Hist'] = df['MACD'] - df['Signal_Line']

        # RSI 14
        delta = close.diff()
        gain = (delta.where(delta > 0, 0)).rolling(window=14).mean()
        loss = (-delta.where(delta < 0, 0)).rolling(window=14).mean()
        rs = gain / (loss + 1e-9)
        df['RSI_14'] = 100 - (100 / (1 + rs))

        # Stochastic RSI
        rsi_min = df['RSI_14'].rolling(window=14).min()
        rsi_max = df['RSI_14'].rolling(window=14).max()
        df['Stoch_RSI'] = (df['RSI_14'] - rsi_min) / (rsi_max - rsi_min + 1e-9)

        # Volatility (Standard & Garman-Klass)
        df['Volatility_20'] = df['Log_Return'].rolling(window=20).std()
        
        # Garman-Klass Volatility (More efficient OHLC estimator)
        log_hl = np.log(high / low) ** 2
        log_co = np.log(close / df['Open']) ** 2
        gk_daily = 0.5 * log_hl - (2 * np.log(2) - 1) * log_co
        df['GK_Vol_20'] = np.sqrt(gk_daily.rolling(window=20).mean()) * np.sqrt(252)
        
        # Average True Range (ATR)
        tr1 = high - low
        tr2 = (high - close.shift()).abs()
        tr3 = (low - close.shift()).abs()
        tr = pd.concat([tr1, tr2, tr3], axis=1).max(axis=1)
        df['ATR_14'] = tr.rolling(window=14).mean()
        df['ATR_30'] = tr.rolling(window=30).mean()

        # Bollinger Bands & Width
        bb_std = close.rolling(window=20).std()
        df['BB_Upper'] = df['MA_20'] + (bb_std * 2)
        df['BB_Lower'] = df['MA_20'] - (bb_std * 2)
        df['BB_Width'] = (df['BB_Upper'] - df['BB_Lower']) / df['MA_20']

        # Volume Features
        df['Volume_MA_20'] = volume.rolling(window=20).mean()
        df['Volume_Ratio'] = volume / (df['Volume_MA_20'] + 1e-9)
        
        # On-Balance Volume (OBV) & Price-Volume Trend (PVT)
        obv_direction = np.sign(delta).fillna(0)
        df['OBV'] = (volume * obv_direction).cumsum()
        
        # Price-Volume Trend (multiplies volume by % change, better than OBV)
        df['PVT'] = (volume * df['Daily_Return'].fillna(0)).cumsum()

        # VWAP
        df['VWAP_20'] = (close * volume).rolling(20).sum() / (volume.rolling(20).sum() + 1e-9)

        # Risk Features
        # Rolling Sharpe Ratio (assuming 0% risk-free rate, annualized)
        df['Rolling_Sharpe'] = (df['Daily_Return'].rolling(window=20).mean() / (df['Volatility_20'] + 1e-9)) * np.sqrt(252)
        
        # Rolling Beta Approximation (Asset Volatility / Reference Volatility)
        # Since we lack a benchmark index in a single-ticker df, we approximate relative to its own 200-day long-term variance.
        long_term_vol = df['Daily_Return'].rolling(window=200).std()
        df['Rolling_Beta'] = df['Volatility_20'] / (long_term_vol + 1e-9)

        # Cleanup
        df = df.bfill().fillna(0)
        return df