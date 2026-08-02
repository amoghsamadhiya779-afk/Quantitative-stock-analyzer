"""Walk-forward validation for the trading strategy.

Answers the question the old single 80/20 split could not: does the model carry a real,
repeatable directional edge out-of-sample, or did one lucky window flatter it?

Trains on an expanding window and evaluates each subsequent fold strictly out-of-sample,
using the SAME signal construction the API serves (src/strategy.py). Reports per-fold and
aggregate Sharpe / return / drawdown against buy-and-hold.

Usage:
    python validate_strategy.py                       # DAX40, CNN_BiLSTM_Attention
    python validate_strategy.py --market FTSE100 --folds 5
    python validate_strategy.py --cost-bps 0          # frictionless comparison
"""

import argparse
import os
import warnings

import numpy as np
import pandas as pd
from sklearn.preprocessing import MinMaxScaler, StandardScaler

warnings.filterwarnings('ignore')
os.environ.setdefault('TF_CPP_MIN_LOG_LEVEL', '3')

from src.feature_engineering import FeatureEngineering
from src.advanced_models import ModelFactory
from src.strategy import build_signals, apply_costs, compute_metrics, DEFAULT_DEADBAND, DEFAULT_COST_BPS

MARKET_FILES = {
    "SP500": "SP500_DATASET.csv",
    "NIFTY50": "NIFTY50_India.csv",
    "Nikkei225": "Nikkei225_Japan.csv",
    "FTSE100": "FTSE100_UK.csv",
    "DAX40": "DAX40_Germany.csv",
    "BIST100": "BIST100_Turkey.csv",
    "Bovespa": "Bovespa_Brazil.csv",
    "IDX": "IDX_Indonesia.csv",
}

MODEL_BUILDERS = {
    "CNN_BiLSTM_Attention": ModelFactory.build_cnn_bilstm_attention,
    "TimeSeriesTransformer": ModelFactory.build_transformer_forecaster,
    "AdvancedBiLSTM": ModelFactory.build_advanced_bilstm,
}


def create_sequences(data, target, seq_length):
    xs, ys = [], []
    for i in range(len(data) - seq_length):
        xs.append(data[i:(i + seq_length)])
        ys.append(target[i + seq_length])
    return np.array(xs), np.array(ys)


def load_market(market, seq_length):
    """Load the market's top-dollar-volume ticker with features and the return target."""
    path = os.path.join("data", "raw", MARKET_FILES[market])
    if not os.path.exists(path):
        raise FileNotFoundError(f"{path} not found.")

    df = pd.read_csv(path, parse_dates=['Date'])
    df['Dollar_Volume'] = df['Close'] * df['Volume']
    top_ticker = df.groupby('Ticker')['Dollar_Volume'].median().idxmax()

    subset = df[df['Ticker'] == top_ticker].sort_values('Date')
    subset = FeatureEngineering.engineer_features(subset)
    subset['Target_Return'] = np.log(subset['Close'].shift(-1) / subset['Close'])
    subset = subset.dropna(subset=['Target_Return'])

    features = [c for c in subset.columns
                if c not in ['Date', 'Ticker', 'Dollar_Volume', 'Target_Return']]
    return subset, features, top_ticker


def run_fold(subset, features, seq_length, train_end, test_end, model_type, epochs, deadband, cost_bps):
    """Train on [0, train_end) and evaluate strictly out-of-sample on [train_end, test_end)."""
    import tensorflow as tf
    from tensorflow.keras.callbacks import EarlyStopping

    raw_features = subset[features].values
    raw_target = subset[['Target_Return']].values

    # Scalers see ONLY training data - no leakage of the test period's distribution.
    feature_scaler = MinMaxScaler().fit(raw_features[:train_end])
    target_scaler = StandardScaler().fit(raw_target[:train_end])

    scaled_features = feature_scaler.transform(raw_features)
    scaled_target = target_scaler.transform(raw_target)

    X, y = create_sequences(scaled_features, scaled_target, seq_length)

    # Sequence i covers rows [i, i+seq_length) and predicts row i+seq_length, so a
    # sequence is safe for training only if its predicted row lies before train_end.
    train_hi = train_end - seq_length
    # Embargo: drop the sequences whose input window straddles the boundary, so no test-period
    # bar ever appears inside a training sequence.
    test_lo = train_hi
    test_hi = test_end - seq_length

    X_train, y_train = X[:train_hi], y[:train_hi]
    X_test = X[test_lo:test_hi]

    if len(X_train) < 200 or len(X_test) < 30:
        return None

    # Hold out the tail of train for early stopping (never touches the test fold).
    val_cut = int(len(X_train) * 0.9)

    model = MODEL_BUILDERS[model_type](input_shape=(seq_length, len(features)))
    model.fit(
        X_train[:val_cut], y_train[:val_cut],
        validation_data=(X_train[val_cut:], y_train[val_cut:]),
        epochs=epochs,
        batch_size=64,
        callbacks=[EarlyStopping(monitor='val_loss', patience=8, restore_best_weights=True)],
        verbose=0,
    )

    preds_scaled = model.predict(X_test, verbose=0).flatten()
    preds_returns = target_scaler.inverse_transform(preds_scaled.reshape(-1, 1)).flatten()

    # Align market data to the predicted bars: sequence at index j predicts row j+seq_length.
    row_lo = test_lo + seq_length
    row_hi = test_hi + seq_length
    closes = subset['Close'].values[row_lo:row_hi]
    asset_returns = pd.Series(closes).pct_change().fillna(0).values
    ma20 = subset['MA_20'].values[row_lo:row_hi]
    ma50 = subset['MA_50'].values[row_lo:row_hi]

    signals = build_signals(preds_returns, ma20=ma20, ma50=ma50, deadband=deadband)
    strategy_returns = apply_costs(signals, asset_returns, cost_bps=cost_bps)
    metrics = compute_metrics(strategy_returns, asset_returns)

    actual_returns = subset['Target_Return'].values[row_lo:row_hi]
    metrics['directional_accuracy'] = float(
        np.mean(np.sign(preds_returns) == np.sign(actual_returns)) * 100
    )
    metrics['flips'] = int(np.sum(np.abs(np.diff(signals, prepend=0.0)) > 0))
    metrics['pct_flat'] = float(np.mean(signals == 0.0) * 100)
    metrics['n_bars'] = len(signals)

    tf.keras.backend.clear_session()
    return metrics


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--market", default="DAX40", choices=list(MARKET_FILES))
    parser.add_argument("--model", default="CNN_BiLSTM_Attention", choices=list(MODEL_BUILDERS))
    parser.add_argument("--folds", type=int, default=4)
    parser.add_argument("--seq-length", type=int, default=60)
    parser.add_argument("--epochs", type=int, default=30)
    parser.add_argument("--deadband", type=float, default=DEFAULT_DEADBAND)
    parser.add_argument("--cost-bps", type=float, default=DEFAULT_COST_BPS)
    args = parser.parse_args()

    subset, features, ticker = load_market(args.market, args.seq_length)
    n = len(subset)

    print(f"\n{'=' * 72}")
    print(f" WALK-FORWARD VALIDATION - {args.market} / {ticker} / {args.model}")
    print(f" {n} bars | {len(features)} features | deadband={args.deadband} | cost={args.cost_bps}bps")
    print(f"{'=' * 72}\n")

    # Expanding window: train on everything up to the fold, test on the next slice.
    initial_train = int(n * 0.5)
    fold_size = (n - initial_train) // args.folds

    results = []
    for k in range(args.folds):
        train_end = initial_train + k * fold_size
        test_end = train_end + fold_size if k < args.folds - 1 else n

        m = run_fold(subset, features, args.seq_length, train_end, test_end,
                     args.model, args.epochs, args.deadband, args.cost_bps)
        if m is None:
            print(f"[fold {k + 1}] skipped - insufficient data")
            continue

        results.append(m)
        print(f"[fold {k + 1}] bars={m['n_bars']:>4}  "
              f"DA={m['directional_accuracy']:>5.1f}%  "
              f"ret={m['total_return']:>7.2f}% (BH {m['bh_return']:>7.2f}%)  "
              f"Sharpe={m['sharpe']:>6.2f} (BH {m['bh_sharpe']:>6.2f})  "
              f"maxDD={m['max_drawdown']:>7.2f}%  "
              f"flips={m['flips']:>3}  flat={m['pct_flat']:>4.1f}%")

    if not results:
        print("\nNo folds completed.")
        return

    print(f"\n{'-' * 72}")
    mean_sharpe = np.mean([m['sharpe'] for m in results])
    mean_bh_sharpe = np.mean([m['bh_sharpe'] for m in results])
    mean_ret = np.mean([m['total_return'] for m in results])
    mean_bh_ret = np.mean([m['bh_return'] for m in results])
    mean_da = np.mean([m['directional_accuracy'] for m in results])
    beat = sum(1 for m in results if m['sharpe'] > m['bh_sharpe'])

    print(f" AGGREGATE over {len(results)} folds")
    print(f"   Mean directional accuracy : {mean_da:.2f}%   (coin flip = 50%)")
    print(f"   Mean strategy Sharpe      : {mean_sharpe:.3f}")
    print(f"   Mean buy-and-hold Sharpe  : {mean_bh_sharpe:.3f}")
    print(f"   Mean strategy return      : {mean_ret:.2f}%")
    print(f"   Mean buy-and-hold return  : {mean_bh_ret:.2f}%")
    print(f"   Folds beating buy-and-hold: {beat}/{len(results)}")
    print(f"{'-' * 72}")

    if mean_sharpe > 0 and mean_sharpe > mean_bh_sharpe:
        print(" PASS - positive out-of-sample Sharpe, beats buy-and-hold on average.\n")
    elif mean_sharpe > 0:
        print(" PARTIAL - positive Sharpe but does not beat buy-and-hold on average.\n")
    else:
        print(" FAIL - no positive out-of-sample edge.\n")


if __name__ == "__main__":
    main()
