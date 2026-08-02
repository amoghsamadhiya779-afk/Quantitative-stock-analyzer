import os
import pandas as pd
import numpy as np
import joblib
import warnings
from sklearn.preprocessing import MinMaxScaler, StandardScaler
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
    "SP500": "SP500_DATASET.csv",
    "NIFTY50": "NIFTY50_India.csv",
    "Nikkei225": "Nikkei225_Japan.csv",
    "FTSE100": "FTSE100_UK.csv",
    "DAX40": "DAX40_Germany.csv",
    "BIST100": "BIST100_Turkey.csv",
    "Bovespa": "Bovespa_Brazil.csv",
    "IDX": "IDX_Indonesia.csv"
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
    subset = FeatureEngineering.engineer_features(subset)

    # Target = next-bar LOG RETURN, not the raw next-bar price level. Close stays a
    # valid input feature (today's price), but predicting tomorrow's price level while
    # Close is already in the feature set trains the model to trivially copy yesterday's
    # close (near-zero loss, zero directional signal) instead of learning anything real.
    subset['Target_Return'] = np.log(subset['Close'].shift(-1) / subset['Close'])
    subset = subset.dropna(subset=['Target_Return'])

    if len(subset) < 200:
        print(f"[SKIPPED] Not enough historical data for {index_key}.")
        return

    # Filter out non-numeric cols
    features = [c for c in subset.columns if c not in ['Date', 'Ticker', 'Dollar_Volume', 'Target_Return']]

    # 3. Scale Features - fit scalers on the TRAIN split only, then transform both splits.
    # Fitting on the full (train+test) series before splitting leaks the test period's
    # distribution (e.g. the test-period all-time-high) into training.
    print(f"[INFO] Scaling {len(features)} Tensors...")
    raw_features = subset[features].values
    raw_target = subset[['Target_Return']].values
    split_idx = int(len(raw_features) * 0.8)

    feature_scaler = MinMaxScaler()
    target_scaler = StandardScaler()  # returns are ~zero-centered; min/max is fragile to outlier days

    feature_scaler.fit(raw_features[:split_idx])
    target_scaler.fit(raw_target[:split_idx])

    scaled_features = feature_scaler.transform(raw_features)
    scaled_target = target_scaler.transform(raw_target)

    # 4. Prepare Sequences
    X, y = create_sequences(scaled_features, scaled_target, SEQ_LENGTH)

    # create_sequences shortens the array by SEQ_LENGTH, so re-anchor the split in
    # sequence-space to the same point in time the scalers were fit up to (zero leakage).
    seq_split_idx = split_idx - SEQ_LENGTH
    X_train, X_test = X[:seq_split_idx], X[seq_split_idx:]
    y_train, y_test = y[:seq_split_idx], y[seq_split_idx:]

    input_shape = (SEQ_LENGTH, len(features))

    # Define models to train. Built lazily (builder callables, not instances) so an
    # already-trained architecture is skipped without even constructing it.
    model_builders = {
        "CNN_BiLSTM_Attention": lambda: ModelFactory.build_cnn_bilstm_attention(input_shape),
        "TimeSeriesTransformer": lambda: ModelFactory.build_transformer_forecaster(input_shape),
        "AdvancedBiLSTM": lambda: ModelFactory.build_advanced_bilstm(input_shape),
    }

    # Save scalers (shared across models)
    scaler_save_path = os.path.join(MODEL_DIR, f"{index_key}_feature_scaler.pkl")
    joblib.dump(feature_scaler, scaler_save_path)
    # Target scaler is required at inference to invert a predicted return back to a price -
    # previously computed but never persisted, so serving reused the feature scaler instead.
    joblib.dump(target_scaler, os.path.join(MODEL_DIR, f"{index_key}_target_scaler.pkl"))
    # Also save the features list for inference mapping
    joblib.dump(features, os.path.join(MODEL_DIR, f"{index_key}_features_list.pkl"))

    # 5. Train all models. Skip any architecture whose .keras file already exists (lets an
    # interrupted/crashed multi-market run resume without redoing completed work), and log
    # + continue on a per-model training failure instead of aborting every remaining market.
    for model_name, build_model in model_builders.items():
        model_save_path = os.path.join(MODEL_DIR, f"{index_key}_{model_name}.keras")

        if os.path.exists(model_save_path):
            print(f"\n[SKIP] {model_name} for {index_key} already trained at {model_save_path}")
            continue

        print(f"\n[TRAIN] Training {model_name}...")
        model = build_model()

        callbacks = [
            EarlyStopping(monitor='val_loss', patience=10, restore_best_weights=True),
            ModelCheckpoint(filepath=model_save_path, monitor='val_loss', save_best_only=True),
            tf.keras.callbacks.ReduceLROnPlateau(monitor='val_loss', factor=0.5, patience=5, min_lr=1e-5)
        ]

        try:
            model.fit(
                X_train, y_train,
                validation_data=(X_test, y_test),
                epochs=50,
                batch_size=64,
                callbacks=callbacks,
                verbose=2
            )
            print(f"[SUCCESS] {model_name} saved for {index_key}!")
        except Exception as e:
            print(f"[ERROR] Training {model_name} for {index_key} failed: {e}")

if __name__ == "__main__":
    for key, filename in MARKET_REGISTRY.items():
        train_market(key, filename)
    print("\n[DONE] ALL MARKETS TRAINED SUCCESSFULLY!")