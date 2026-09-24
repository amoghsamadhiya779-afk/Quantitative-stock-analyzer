"""Walk-forward evaluation primitives shared by training, validation and the report card.

Time alignment convention used throughout (and by the served API):

    row t holds features computed from data up to and including bar t, and
    Target_Return[t] = log(Close[t+1] / Close[t]) is the NEXT bar's return.

A forecast for Target_Return[t] may use any data at rows <= t. A sequence model's input
window for row t is rows [t - seq_length + 1, t].
"""

import os

import numpy as np
import pandas as pd

from src.config import MARKET_CONFIG, MARKET_FILES
from src.feature_engineering import FeatureEngineering

# Columns that are identifiers or targets, never model inputs. Columns starting with "_"
# hold next-bar values used only for scoring and are excluded as well.
NON_FEATURE_COLUMNS = {"Date", "Ticker", "Dollar_Volume", "Target_Return"}


def create_sequences(data, target, seq_length):
    """Windows X[j] = data[j : j+seq_length], labelled with the target of the window's
    LAST row, y[j] = target[j + seq_length - 1].

    Labelling with target[j + seq_length] (the previous behaviour) trained models to
    predict the return two bars ahead while the API serves them as next-bar forecasts.
    """
    xs, ys = [], []
    for i in range(len(data) - seq_length + 1):
        xs.append(data[i:i + seq_length])
        ys.append(target[i + seq_length - 1])
    return np.array(xs), np.array(ys)


def feature_columns(frame):
    return [c for c in frame.columns if c not in NON_FEATURE_COLUMNS and not c.startswith("_")]


def select_top_ticker(df):
    """The ticker with the highest median dollar volume, as training uses."""
    dollar_volume = df["Close"] * df["Volume"]
    return dollar_volume.groupby(df["Ticker"]).median().idxmax()


def load_price_history(index_key, data_dir="data", ticker=None):
    """OHLCV history for one stock of a market, oldest first.

    Uses the raw market dataset when present (data/raw/<file>), otherwise downloads the
    market's `report_ticker` from Yahoo Finance and caches it under data/cache/.
    Returns (prices, ticker, source).
    """
    raw_path = os.path.join(data_dir, "raw", MARKET_FILES[index_key])
    if os.path.exists(raw_path):
        df = pd.read_csv(raw_path, parse_dates=["Date"])
        ticker = ticker or select_top_ticker(df)
        prices = df[df["Ticker"] == ticker].sort_values("Date").reset_index(drop=True)
        return prices, ticker, "dataset"

    if ticker is None:
        ticker = next(m["report_ticker"] for m in MARKET_CONFIG.values() if m["index_key"] == index_key)
    cache_path = os.path.join(data_dir, "cache", f"{ticker}.csv")
    if os.path.exists(cache_path):
        return pd.read_csv(cache_path, parse_dates=["Date"]), ticker, "yfinance (cached)"

    import yfinance as yf

    raw = yf.download(ticker, period="max", auto_adjust=True, progress=False)
    if raw.empty:
        raise RuntimeError(f"No price history available for {ticker}")
    if isinstance(raw.columns, pd.MultiIndex):
        raw.columns = raw.columns.get_level_values(0)
    prices = raw[["Open", "High", "Low", "Close", "Volume"]].reset_index()
    prices = prices.rename(columns={prices.columns[0]: "Date"}).dropna()

    os.makedirs(os.path.dirname(cache_path), exist_ok=True)
    prices.to_csv(cache_path, index=False)
    return prices, ticker, "yfinance"


def prepare_frame(prices):
    """Engineer features and attach the next-bar target plus the next-bar values the
    strategy is scored on. The final bar has no next bar and is dropped."""
    frame = FeatureEngineering.engineer_features(prices)
    close = frame["Close"]
    frame["Target_Return"] = np.log(close.shift(-1) / close)
    frame["_next_simple_return"] = close.shift(-1) / close - 1.0
    frame["_next_ma20"] = frame["MA_20"].shift(-1)
    frame["_next_ma50"] = frame["MA_50"].shift(-1)
    frame = frame.iloc[:-1]
    return frame.replace([np.inf, -np.inf], 0.0)


def expanding_folds(n_rows, n_folds, initial_train_frac=0.5):
    """[(train_end, test_end)] for an expanding-window walk-forward.

    Fold k trains on rows [0, train_end) and is tested on rows [train_end, test_end).
    Test folds are contiguous and together cover rows [initial_train, n_rows).
    """
    initial_train = int(n_rows * initial_train_frac)
    fold_size = (n_rows - initial_train) // n_folds
    folds = []
    for k in range(n_folds):
        train_end = initial_train + k * fold_size
        test_end = train_end + fold_size if k < n_folds - 1 else n_rows
        folds.append((train_end, test_end))
    return folds


# ---------------------------------------------------------------------------------------
# Forecasters. Each one is fit on rows [0, train_end) and then predicts Target_Return for
# the requested rows using only information available at each row.
# ---------------------------------------------------------------------------------------

class Forecaster:
    name = "base"
    description = ""

    def fit(self, frame, features, train_end):
        return self

    def predict(self, frame, features, rows):
        raise NotImplementedError


class RandomWalk(Forecaster):
    name = "RandomWalk"
    description = "Always forecasts a zero return; the standard benchmark for asset returns."

    def predict(self, frame, features, rows):
        return np.zeros(len(rows))


class HistoricalMean(Forecaster):
    name = "HistoricalMean"
    description = "Forecasts the average training-period return (Campbell & Thompson benchmark)."

    def fit(self, frame, features, train_end):
        self.mean_ = float(frame["Target_Return"].values[:train_end].mean())
        return self

    def predict(self, frame, features, rows):
        return np.full(len(rows), self.mean_)


class Momentum(Forecaster):
    name = "Momentum20"
    description = "Forecasts the average daily log return of the last 20 bars."

    def __init__(self, window=20):
        self.window = window

    def predict(self, frame, features, rows):
        trailing = frame["Log_Return"].rolling(self.window).mean().fillna(0.0).values
        return trailing[np.asarray(rows)]


class RidgeForecaster(Forecaster):
    name = "Ridge"
    description = "Cross-validated ridge regression on the same features the deep models see."

    def fit(self, frame, features, train_end):
        from sklearn.linear_model import RidgeCV
        from sklearn.model_selection import TimeSeriesSplit
        from sklearn.pipeline import make_pipeline
        from sklearn.preprocessing import StandardScaler

        X = frame[features].values[:train_end]
        y = frame["Target_Return"].values[:train_end]
        self.model_ = make_pipeline(
            StandardScaler(),
            RidgeCV(alphas=np.logspace(-2, 4, 13), cv=TimeSeriesSplit(n_splits=5)),
        ).fit(X, y)
        return self

    def predict(self, frame, features, rows):
        return self.model_.predict(frame[features].values[np.asarray(rows)])


class GradientBoosting(Forecaster):
    name = "GradientBoosting"
    description = "Histogram gradient-boosted trees on the same features (fixed, conservative settings)."

    def fit(self, frame, features, train_end):
        from sklearn.ensemble import HistGradientBoostingRegressor

        # Built-in early stopping holds out a RANDOM validation split, which would mix
        # future bars into training decisions, so it is disabled in favour of a small,
        # fixed number of shallow trees.
        self.model_ = HistGradientBoostingRegressor(
            max_iter=150, learning_rate=0.03, max_leaf_nodes=15, min_samples_leaf=50,
            l2_regularization=1.0, early_stopping=False, random_state=0,
        ).fit(frame[features].values[:train_end], frame["Target_Return"].values[:train_end])
        return self

    def predict(self, frame, features, rows):
        return self.model_.predict(frame[features].values[np.asarray(rows)])


class DeepSequenceForecaster(Forecaster):
    """One of the three served architectures, retrained from scratch on each fold."""

    description = "Served deep-learning architecture, retrained on each fold's training window."

    def __init__(self, model_type, seq_length=60, epochs=30, batch_size=64, seed=0):
        self.name = model_type
        self.model_type = model_type
        self.seq_length = seq_length
        self.epochs = epochs
        self.batch_size = batch_size
        self.seed = seed

    def fit(self, frame, features, train_end):
        import tensorflow as tf
        from sklearn.preprocessing import MinMaxScaler, StandardScaler
        from tensorflow.keras.callbacks import EarlyStopping

        from src.advanced_models import ModelFactory

        builders = {
            "CNN_BiLSTM_Attention": ModelFactory.build_cnn_bilstm_attention,
            "TimeSeriesTransformer": ModelFactory.build_transformer_forecaster,
            "AdvancedBiLSTM": ModelFactory.build_advanced_bilstm,
        }
        tf.keras.backend.clear_session()
        tf.keras.utils.set_random_seed(self.seed)

        # Scalers see only the training window.
        raw_x = frame[features].values
        raw_y = frame[["Target_Return"]].values
        self.x_scaler_ = MinMaxScaler().fit(raw_x[:train_end])
        self.y_scaler_ = StandardScaler().fit(raw_y[:train_end])

        X, y = create_sequences(self.x_scaler_.transform(raw_x[:train_end]),
                                self.y_scaler_.transform(raw_y[:train_end]), self.seq_length)
        # Chronological hold-out for early stopping: the tail of the training window.
        val_cut = int(len(X) * 0.9)
        self.model_ = builders[self.model_type](input_shape=(self.seq_length, len(features)))
        self.model_.fit(
            X[:val_cut], y[:val_cut],
            validation_data=(X[val_cut:], y[val_cut:]),
            epochs=self.epochs, batch_size=self.batch_size, verbose=0,
            callbacks=[EarlyStopping(monitor="val_loss", patience=8, restore_best_weights=True)],
        )
        return self

    def predict(self, frame, features, rows):
        rows = np.asarray(rows)
        if rows.min() < self.seq_length - 1:
            raise ValueError("rows must leave room for a full input window")
        scaled_x = self.x_scaler_.transform(frame[features].values[:rows.max() + 1])
        windows = np.stack([scaled_x[r - self.seq_length + 1:r + 1] for r in rows])
        scaled = self.model_.predict(windows, verbose=0, batch_size=512).reshape(-1, 1)
        return self.y_scaler_.inverse_transform(scaled).ravel()


BASELINES = ("RandomWalk", "HistoricalMean", "Momentum20", "Ridge", "GradientBoosting")
DEEP_MODELS = ("CNN_BiLSTM_Attention", "TimeSeriesTransformer", "AdvancedBiLSTM")


def make_forecaster(name, seq_length=60, epochs=30):
    simple = {
        "RandomWalk": RandomWalk,
        "HistoricalMean": HistoricalMean,
        "Momentum20": Momentum,
        "Ridge": RidgeForecaster,
        "GradientBoosting": GradientBoosting,
    }
    if name in simple:
        return simple[name]()
    if name in DEEP_MODELS:
        return DeepSequenceForecaster(name, seq_length=seq_length, epochs=epochs)
    raise ValueError(f"Unknown forecaster {name!r}")
