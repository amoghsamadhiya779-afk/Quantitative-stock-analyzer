import os
import optuna
import pandas as pd
import numpy as np
import tensorflow as tf
from optuna.integration import TFKerasPruningCallback
from sklearn.metrics import root_mean_squared_error
from sklearn.preprocessing import MinMaxScaler, StandardScaler

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

# NOTE: mixed_float16 was previously enabled here and is what produced the
# 'quantization_config' Keras deserialization failures seen in production (api/main.py's
# monkey-patch was a hotfix for exactly this). Keep training precision matched to serving.
# tf.keras.mixed_precision.set_global_policy('mixed_float16')

def calculate_directional_accuracy(y_true, y_pred):
    """Directional accuracy on RETURNS: fraction of samples where the predicted return
    has the same sign as the actual return. (Previously computed against a reference
    'previous close' price, which made sense only when the target was a price level.)"""
    return np.mean(np.sign(y_true) == np.sign(y_pred))

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

    subset = FeatureEngineering.engineer_features(subset)

    # Target = next-bar log return (matches run_pipeline.py's training target), not the
    # raw price level Close already sits in the feature set as.
    subset['Target_Return'] = np.log(subset['Close'].shift(-1) / subset['Close'])
    subset = subset.dropna(subset=['Target_Return'])

    features = [c for c in subset.columns if c not in ['Date', 'Ticker', 'Dollar_Volume', 'Target_Return']]

    # Fit scalers on the TRAIN split only (see below), then transform both splits -
    # fitting on the full series first leaks the validation period's distribution into training.
    raw_features = subset[features].values
    raw_target = subset[['Target_Return']].values
    split_idx = int(len(raw_features) * 0.8)

    feature_scaler = MinMaxScaler()
    target_scaler = StandardScaler()

    feature_scaler.fit(raw_features[:split_idx])
    target_scaler.fit(raw_target[:split_idx])

    scaled_features = feature_scaler.transform(raw_features)
    scaled_target = target_scaler.transform(raw_target)

    X, y = create_sequences(scaled_features, scaled_target, seq_length)

    # Re-anchor the split in sequence-space to where the scalers stopped seeing data.
    seq_split_idx = split_idx - seq_length
    X_train, X_val = X[:seq_split_idx], X[seq_split_idx:]
    y_train, y_val = y[:seq_split_idx], y[seq_split_idx:]

    return X_train, y_train, X_val, y_val, target_scaler, len(features)

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
        X_train, y_train, X_val, y_val, target_scaler, num_features = load_and_prepare_data(self.data_path, sequence_length)

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
        os.makedirs(log_dir, exist_ok=True)
        callbacks = [
            tf.keras.callbacks.EarlyStopping(monitor='val_loss', patience=8, restore_best_weights=True),
            tf.keras.callbacks.ReduceLROnPlateau(monitor='val_loss', factor=0.5, patience=4, min_lr=1e-6),
            TFKerasPruningCallback(trial, "val_loss"),
            tf.keras.callbacks.TensorBoard(log_dir=log_dir),
            tf.keras.callbacks.CSVLogger(f"{log_dir}/history.csv")
        ]

        # 5. Train Model
        model.fit(
            X_train, y_train,
            validation_data=(X_val, y_val),
            epochs=50,
            batch_size=batch_size,
            callbacks=callbacks,
            verbose=0
        )

        # 6. Evaluate
        y_pred_scaled = model.predict(X_val, verbose=0).flatten()
        y_val_scaled = y_val.flatten()

        rmse = root_mean_squared_error(y_val_scaled, y_pred_scaled)

        # Directional accuracy directly on the (scaled) returns - sign is invariant to
        # StandardScaler's positive linear transform, so no need to inverse-transform first.
        da = calculate_directional_accuracy(y_val_scaled, y_pred_scaled)

        # Optuna supports multi-objective optimization
        return da, rmse

def run_optimization(index_key="DAX40", filename="DAX40_Germany.csv", study_name=None, n_trials=40):
    data_path = os.path.join("data", "raw", filename)
    if not os.path.exists(data_path):
        raise FileNotFoundError(
            f"{data_path} not found. Pass index_key/filename matching a file that actually "
            f"exists in data/raw (see MARKET_REGISTRY in run_pipeline.py)."
        )
    study_name = study_name or f"cnn_bilstm_attention_{index_key.lower()}"

    # Use SQLite for parallel trial support and to persist results across runs/restarts.
    os.makedirs("mlops_artifacts/optuna", exist_ok=True)
    storage = f"sqlite:///mlops_artifacts/optuna/{study_name}.db"

    # Multi-objective: Maximize directional accuracy, Minimize RMSE
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

    return study

if __name__ == "__main__":
    run_optimization(index_key="DAX40", filename="DAX40_Germany.csv", n_trials=40)
