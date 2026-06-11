import os
import optuna
import pandas as pd
import numpy as np
import tensorflow as tf
from optuna.integration import TFKerasPruningCallback
from sklearn.metrics import root_mean_squared_error
from sklearn.preprocessing import MinMaxScaler

from src.advanced_models import ModelFactory
from src.feature_engineering import FeatureEngineering

# Ensure GPU memory growth
gpus = tf.config.list_physical_devices('GPU')
if gpus:
    try:
        for gpu in gpus:
            tf.config.experimental.set_memory_growth(gpu, True)
    except RuntimeError as e:
        print(e)

# Enable mixed precision for faster training on Tensor Cores
tf.keras.mixed_precision.set_global_policy('mixed_float16')

def calculate_directional_accuracy(y_true, y_pred, y_prev):
    """
    Directional Accuracy: Percentage of times the predicted movement direction 
    matches the actual movement direction.
    """
    actual_direction = np.sign(y_true - y_prev)
    pred_direction = np.sign(y_pred - y_prev)
    # Ignore flat movements (0) or count them as mismatch
    matches = (actual_direction == pred_direction)
    return np.mean(matches)

def create_sequences(data, target, seq_length):
    xs, ys = [], []
    for i in range(len(data) - seq_length):
        xs.append(data[i:(i + seq_length)])
        ys.append(target[i + seq_length])
    return np.array(xs), np.array(ys)

def load_and_prepare_data(file_path, seq_length):
    df = pd.read_csv(file_path, parse_dates=['Date'])
    df['Dollar_Volume'] = df['Close'] * df['Volume']
    top_ticker = df.groupby('Ticker')['Dollar_Volume'].median().idxmax()
    subset = df[df['Ticker'] == top_ticker].sort_values('Date')
    
    subset = FeatureEngineering.engineer_features(subset).dropna()
    
    # We need to keep track of unscaled 'Close' for directional accuracy
    # But for optimization, scaled metrics are also fine.
    
    features = [c for c in subset.columns if c not in ['Date', 'Ticker', 'Dollar_Volume']]
    
    feature_scaler = MinMaxScaler()
    target_scaler = MinMaxScaler()
    
    scaled_features = feature_scaler.fit_transform(subset[features].values)
    scaled_target = target_scaler.fit_transform(subset[['Close']].values)
    
    X, y = create_sequences(scaled_features, scaled_target, seq_length)
    
    # Split 80/20
    split_idx = int(len(X) * 0.8)
    X_train, X_val = X[:split_idx], X[split_idx:]
    y_train, y_val = y[:split_idx], y[split_idx:]
    
    # To calculate directional accuracy, we need the "previous" close for the validation set
    # The previous close for y[i] is the last element of X[i] if Close is a feature.
    # Let's find the index of 'Close'
    close_idx = features.index('Close')
    y_prev_val = X_val[:, -1, close_idx] # The close price at the last timestep of the sequence
    
    return X_train, y_train, X_val, y_val, y_prev_val, target_scaler, len(features)

class Objective:
    def __init__(self, data_path):
        self.data_path = data_path

    def __call__(self, trial):
        # 1. Hyperparameter Search Space
        learning_rate = trial.suggest_float("learning_rate", 1e-5, 1e-2, log=True)
        dropout = trial.suggest_float("dropout", 0.1, 0.5)
        lstm_units = trial.suggest_int("lstm_units", 32, 512, log=True)
        conv_filters = trial.suggest_int("conv_filters", 16, 256, log=True)
        kernel_size = trial.suggest_int("kernel_size", 2, 10)
        batch_size = trial.suggest_categorical("batch_size", [16, 32, 64, 128, 256])
        attention_heads = trial.suggest_int("attention_heads", 2, 16)
        sequence_length = trial.suggest_int("sequence_length", 30, 180, step=30)

        # 2. Prepare Data (with dynamic sequence length)
        X_train, y_train, X_val, y_val, y_prev_val, target_scaler, num_features = load_and_prepare_data(self.data_path, sequence_length)

        # 3. Build Model
        input_shape = (sequence_length, num_features)
        model = ModelFactory.build_cnn_bilstm_attention(
            input_shape=input_shape,
            learning_rate=learning_rate,
            filters=conv_filters,
            kernel_size=kernel_size,
            lstm_units=lstm_units,
            dropout=dropout,
            attention_heads=attention_heads
        )

        # 4. Callbacks
        log_dir = f"mlops_artifacts/logs/optuna/trial_{trial.number}"
        callbacks = [
            tf.keras.callbacks.EarlyStopping(monitor='val_loss', patience=5, restore_best_weights=True),
            tf.keras.callbacks.ReduceLROnPlateau(monitor='val_loss', factor=0.5, patience=3, min_lr=1e-6),
            TFKerasPruningCallback(trial, "val_loss"),
            tf.keras.callbacks.TensorBoard(log_dir=log_dir),
            tf.keras.callbacks.CSVLogger(f"{log_dir}/history.csv")
        ]

        # 5. Train Model
        model.fit(
            X_train, y_train,
            validation_data=(X_val, y_val),
            epochs=30, # Capped for tuning speed
            batch_size=batch_size,
            callbacks=callbacks,
            verbose=0
        )

        # 6. Evaluate
        y_pred_scaled = model.predict(X_val, verbose=0).flatten()
        y_val_scaled = y_val.flatten()
        
        # Calculate RMSE on scaled data as secondary
        rmse = root_mean_squared_error(y_val_scaled, y_pred_scaled)

        # Calculate Directional Accuracy
        # y_prev_val is already scaled, which is fine since sign(a-b) == sign(scale(a)-scale(b)) for MinMax
        da = calculate_directional_accuracy(y_val_scaled, y_pred_scaled, y_prev_val)

        # Optuna supports multi-objective optimization
        return da, rmse

def run_optimization(study_name="cnn_bilstm_attention_study", n_trials=50):
    data_path = os.path.join("data", "raw", "SP500_DATASET.csv") # Use SP500 as baseline for tuning
    
    # Use SQLite for parallel trial support
    os.makedirs("mlops_artifacts/optuna", exist_ok=True)
    storage = f"sqlite:///mlops_artifacts/optuna/{study_name}.db"
    
    # Multi-objective: Maximize DA, Minimize RMSE
    study = optuna.create_study(
        study_name=study_name,
        storage=storage,
        directions=["maximize", "minimize"],
        load_if_exists=True
    )
    
    objective = Objective(data_path)
    study.optimize(objective, n_trials=n_trials, gc_after_trial=True)
    
    print("\nOptimization Finished.")
    print("Number of finished trials: ", len(study.trials))
    
    # Get Pareto front (best trade-offs between DA and RMSE)
    best_trials = study.best_trials
    print(f"\nFound {len(best_trials)} optimal models on the Pareto front.")
    
    for i, trial in enumerate(best_trials):
        print(f"\nBest Trial #{i}")
        print(f"  Directional Accuracy: {trial.values[0]:.4f}")
        print(f"  RMSE: {trial.values[1]:.4f}")
        print("  Params: ")
        for key, value in trial.params.items():
            print(f"    {key}: {value}")

if __name__ == "__main__":
    run_optimization(n_trials=5) # Defaulting to 5 for test run
