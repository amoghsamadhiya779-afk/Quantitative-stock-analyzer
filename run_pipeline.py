import os
import pandas as pd
import numpy as np
import joblib
import warnings
from sklearn.preprocessing import MinMaxScaler
import tensorflow as tf

warnings.filterwarnings('ignore')
os.environ['TF_CPP_MIN_LOG_LEVEL'] = '3'

from tensorflow.keras.callbacks import EarlyStopping, ModelCheckpoint
from src.feature_engineering import FeatureEngineering
from src.advanced_models import ModelFactory

# ==========================================
# 1. CONFIGURATION
# ==========================================
MARKET_REGISTRY = {
    "SP500": "SP500_DATASET.csv"
}

SEQ_LENGTH = 60
MODEL_DIR = os.path.join("mlops_artifacts", "models")
os.makedirs(MODEL_DIR, exist_ok=True)

# Remove mixed precision for standard CPU/accuracy
# tf.keras.mixed_precision.set_global_policy('mixed_float16')

# ==========================================
# 2. CORE TRAINING LOGIC
# ==========================================

def create_sequences(data, target, seq_length):
    xs, ys = [], []
    for i in range(len(data) - seq_length):
        xs.append(data[i:(i + seq_length)])
        ys.append(target[i + seq_length])
    return np.array(xs), np.array(ys)

def train_market(index_key, filename):
    print(f"\n{'='*50}\n INITIATING TRAINING FOR: {index_key}\n{'='*50}")
    
    file_path = os.path.join("data", "raw", filename)
    if not os.path.exists(file_path):
        print(f"[SKIPPED] Data file {file_path} not found.")
        return

    # 1. Load Data
    df = pd.read_csv(file_path, parse_dates=['Date'])
    df['Dollar_Volume'] = df['Close'] * df['Volume']
    top_ticker = df.groupby('Ticker')['Dollar_Volume'].median().idxmax()
    print(f"[INFO] Top Asset: {top_ticker}")
    
    # 2. Engineer Features
    subset = df[df['Ticker'] == top_ticker].sort_values('Date')
    subset = FeatureEngineering.engineer_features(subset).dropna()
    
    if len(subset) < 200:
        print(f"[SKIPPED] Not enough historical data for {index_key}.")
        return

    # Filter out non-numeric cols
    features = [c for c in subset.columns if c not in ['Date', 'Ticker', 'Dollar_Volume']]

    # 3. Scale Features
    print(f"[INFO] Scaling {len(features)} Tensors...")
    feature_scaler = MinMaxScaler()
    target_scaler = MinMaxScaler()
    
    scaled_features = feature_scaler.fit_transform(subset[features].values)
    scaled_target = target_scaler.fit_transform(subset[['Close']].values)
    
    # 4. Prepare Sequences
    X, y = create_sequences(scaled_features, scaled_target, SEQ_LENGTH)
    
    split_idx = int(len(X) * 0.8)
    X_train, X_test = X[:split_idx], X[split_idx:]
    y_train, y_test = y[:split_idx], y[split_idx:]
    
    input_shape = (SEQ_LENGTH, len(features))
    
    # Define models to train
    models_to_train = {
        "CNN_BiLSTM_Attention": ModelFactory.build_cnn_bilstm_attention(input_shape),
        "TimeSeriesTransformer": ModelFactory.build_transformer_forecaster(input_shape),
        "AdvancedBiLSTM": ModelFactory.build_advanced_bilstm(input_shape)
    }

    # Save scaler (shared across models)
    scaler_save_path = os.path.join(MODEL_DIR, f"{index_key}_feature_scaler.pkl")
    joblib.dump(feature_scaler, scaler_save_path)
    # Also save the features list for inference mapping
    joblib.dump(features, os.path.join(MODEL_DIR, f"{index_key}_features_list.pkl"))

    # 5. Train all models
    for model_name, model in models_to_train.items():
        print(f"\n[TRAIN] Training {model_name}...")
        
        model_save_path = os.path.join(MODEL_DIR, f"{index_key}_{model_name}.keras")
        
        callbacks = [
            EarlyStopping(monitor='val_loss', patience=10, restore_best_weights=True),
            ModelCheckpoint(filepath=model_save_path, monitor='val_loss', save_best_only=True),
            tf.keras.callbacks.ReduceLROnPlateau(monitor='val_loss', factor=0.5, patience=5, min_lr=1e-5)
        ]
        
        model.fit(
            X_train, y_train,
            validation_data=(X_test, y_test),
            epochs=50,
            batch_size=64,
            callbacks=callbacks,
            verbose=2
        )
        print(f"[SUCCESS] {model_name} saved for {index_key}!")

if __name__ == "__main__":
    for key, filename in MARKET_REGISTRY.items():
        train_market(key, filename)
    print("\n[DONE] ALL MARKETS TRAINED SUCCESSFULLY!")