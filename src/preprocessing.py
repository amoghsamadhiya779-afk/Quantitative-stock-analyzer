import os
import joblib
import numpy as np
from sklearn.preprocessing import MinMaxScaler
import logging
from src.config import PipelineConfig

logger = logging.getLogger("SP500_MLOps")

class DataPreprocessor:
    def __init__(self, seq_length):
        self.seq_length = seq_length
        self.scaler = MinMaxScaler(feature_range=(0, 1))
        self.target_scaler = MinMaxScaler(feature_range=(0, 1))

    def prepare_data(self, df):
        logger.info("Scaling and preparing data sequences...")
        features = ['Open', 'High', 'Low', 'Close', 'Volume', 'MA_20', 'MA_50', 'Volatility_20', 'RSI_14']
        data_filtered = df[features].values
        target_data = df[['Close']].values

        scaled_data = self.scaler.fit_transform(data_filtered)
        self.target_scaler.fit(target_data)

        joblib.dump(self.scaler, os.path.join(PipelineConfig.MODEL_DIR, 'feature_scaler.pkl'))
        joblib.dump(self.target_scaler, os.path.join(PipelineConfig.MODEL_DIR, 'target_scaler.pkl'))

        X, y = [], []
        for i in range(self.seq_length, len(scaled_data)):
            X.append(scaled_data[i-self.seq_length:i])
            y.append(scaled_data[i, 3])

        X, y = np.array(X), np.array(y)
        test_len = int(len(X) * PipelineConfig.TEST_SIZE)
        val_len = int(len(X) * PipelineConfig.VAL_SIZE)
        train_len = len(X) - test_len - val_len

        X_train, y_train = X[:train_len], y[:train_len]
        X_val, y_val = X[train_len:train_len+val_len], y[train_len:train_len+val_len]
        X_test, y_test = X[train_len+val_len:], y[train_len+val_len:]
        
        return X_train, y_train, X_val, y_val, X_test, y_test, df.index[train_len+val_len+self.seq_length:]