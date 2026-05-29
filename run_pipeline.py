import os
import pandas as pd
import numpy as np
import joblib
import warnings
from sklearn.preprocessing import MinMaxScaler

# Suppress TensorFlow warnings for clean output
warnings.filterwarnings('ignore')
os.environ['TF_CPP_MIN_LOG_LEVEL'] = '3'

from tensorflow.keras.models import Sequential
from tensorflow.keras.layers import LSTM, Dense, Dropout, Bidirectional
from tensorflow.keras.callbacks import EarlyStopping, ModelCheckpoint

# Import your existing feature engineering logic
from src.feature_engineering import FeatureEngineering

# ==========================================
# 1. CONFIGURATION
# ==========================================
# Add or remove markets here to control what gets trained
MARKET_REGISTRY = {
    "SP500": "SP500_DATASET.csv",
    "NIFTY50": "NIFTY50_India.csv",
    "Nikkei225": "Nikkei225_Japan.csv",
    "FTSE100": "FTSE100_UK.csv",
    "DAX40": "DAX40_Germany.csv",
    "TASI": "Tawadul_SaudiArabia.csv",    # New Market
    "SSE": "SSE_China.csv",            # New Market
    "BIST100": "BIST100_Turkey.csv",
    "Bovespa": "Bovespa_Brazil.csv",
    "IDX": "IDX_Indonesia.csv"

}

SEQ_LENGTH = 60
FEATURES = ['Open', 'High', 'Low', 'Close', 'Volume', 'MA_20', 'MA_50', 'Volatility_20', 'RSI_14']
MODEL_DIR = os.path.join("mlops_artifacts", "models")
os.makedirs(MODEL_DIR, exist_ok=True)

# ==========================================
# 2. CORE TRAINING LOGIC
# ==========================================
def build_bilstm_model(input_shape):
    """Builds a robust Institutional-Grade BiLSTM Architecture."""
    model = Sequential([
        Bidirectional(LSTM(64, return_sequences=True), input_shape=input_shape),
        Dropout(0.2),
        Bidirectional(LSTM(32, return_sequences=False)),
        Dropout(0.2),
        Dense(16, activation='relu'),
        Dense(1) # Predicting the next day's close price
    ])
    model.compile(optimizer='adam', loss='mse', metrics=['mae'])
    return model

def create_sequences(data, target, seq_length):
    """Formats sequential data for LSTM ingestion."""
    xs, ys = [], []
    for i in range(len(data) - seq_length):
        xs.append(data[i:(i + seq_length)])
        ys.append(target[i + seq_length])
    return np.array(xs), np.array(ys)

def train_market(index_key, filename):
    print(f"\n{'='*50}\n🚀 INITIATING TRAINING FOR: {index_key}\n{'='*50}")
    
    file_path = os.path.join("data", "raw", filename)
    if not os.path.exists(file_path):
        print(f"❌ SKIPPED: Data file {file_path} not found.")
        return

    # 1. Load Data & Find Top Valued Stock
    df = pd.read_csv(file_path, parse_dates=['Date'])
    df['Dollar_Volume'] = df['Close'] * df['Volume']
    top_ticker = df.groupby('Ticker')['Dollar_Volume'].median().idxmax()
    print(f"📊 Extracted Top Liquidity Asset for Baseline: {top_ticker}")
    
    # 2. Engineer Features
    subset = df[df['Ticker'] == top_ticker].sort_values('Date')
    subset = FeatureEngineering.engineer_features(subset).dropna()
    
    if len(subset) < 200:
        print(f"❌ SKIPPED: Not enough historical data for {index_key}.")
        return

    # 3. Scale Features
    print("⚙️ Scaling Tensors...")
    feature_scaler = MinMaxScaler()
    target_scaler = MinMaxScaler()
    
    scaled_features = feature_scaler.fit_transform(subset[FEATURES].values)
    scaled_target = target_scaler.fit_transform(subset[['Close']].values)
    
    # 4. Prepare Sequences
    X, y = create_sequences(scaled_features, scaled_target, SEQ_LENGTH)
    
    # Split Train/Test (80/20)
    split_idx = int(len(X) * 0.8)
    X_train, X_test = X[:split_idx], X[split_idx:]
    y_train, y_test = y[:split_idx], y[split_idx:]
    
    # 5. Build & Train Model
    print("🧠 Building BiLSTM Architecture...")
    model = build_bilstm_model((SEQ_LENGTH, len(FEATURES)))
    
    model_save_path = os.path.join(MODEL_DIR, f"best_{index_key}_model.h5")
    scaler_save_path = os.path.join(MODEL_DIR, f"{index_key}_feature_scaler.pkl")
    
    callbacks = [
        EarlyStopping(monitor='val_loss', patience=8, restore_best_weights=True),
        ModelCheckpoint(filepath=model_save_path, monitor='val_loss', save_best_only=True)
    ]
    
    print("🔥 Executing Neural Training Loop...")
    model.fit(
        X_train, y_train,
        validation_data=(X_test, y_test),
        epochs=30, # Set to 30 for speed, increase to 50+ for deep accuracy
        batch_size=32,
        callbacks=callbacks,
        verbose=1
    )
    
    # 6. Save Artifacts
    joblib.dump(feature_scaler, scaler_save_path)
    print(f"✅ SUCCESS: Model and Scaler saved for {index_key}!")

if __name__ == "__main__":
    for key, filename in MARKET_REGISTRY.items():
        train_market(key, filename)
    print("\n🎉 ALL MARKETS TRAINED SUCCESSFULLY!")