# pyrefly: ignore [missing-import]
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware
from pydantic import BaseModel
import pandas as pd
import numpy as np
import os
import joblib
import warnings
import sqlite3
import sys
import threading
import time
from concurrent.futures import ThreadPoolExecutor
from cachetools import TTLCache
import yfinance as yf
from vaderSentiment.vaderSentiment import SentimentIntensityAnalyzer
import logging

warnings.filterwarnings('ignore')
os.environ['TF_CPP_MIN_LOG_LEVEL'] = '3'

# Explicitly import TensorFlow and Keras (Removed the silent bypass)
import tensorflow as tf
from tensorflow.keras.models import load_model

# --- HOTFIX: Monkey-patch Keras Dense to ignore quantization_config ---
# TensorFlow 2.16+ saves models with 'quantization_config' in Dense layers,
# which causes deserialization to fail on older Keras versions or certain HF environments.
original_dense_init = tf.keras.layers.Dense.__init__
def patched_dense_init(self, *args, **kwargs):
    kwargs.pop('quantization_config', None)
    original_dense_init(self, *args, **kwargs)
tf.keras.layers.Dense.__init__ = patched_dense_init
# ----------------------------------------------------------------------
from sklearn.preprocessing import MinMaxScaler, StandardScaler
import uvicorn

# Append root directory to sys.path to resolve 'src' imports
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))
from src.feature_engineering import FeatureEngineering
from src.strategy import build_signals, apply_costs

# Configure Enterprise Logging for visibility
logging.basicConfig(level=logging.INFO, format='%(asctime)s - API ENGINE - %(levelname)s - %(message)s')
logger = logging.getLogger("NexusAPI")

MARKET_CONFIG = {
    "United States (S&P 500)": {"index_key": "SP500", "stock_file": "SP500_DATASET.csv"},
    "India (NIFTY 50)": {"index_key": "NIFTY50", "stock_file": "NIFTY50_India.csv"},
    "Japan (Nikkei 225)": {"index_key": "Nikkei225", "stock_file": "Nikkei225_Japan.csv"},
    "United Kingdom (FTSE 100)": {"index_key": "FTSE100", "stock_file": "FTSE100_UK.csv"},
    "Germany (DAX 40)": {"index_key": "DAX40", "stock_file": "DAX40_Germany.csv"},
    "Turkey (BIST 100)": {"index_key": "BIST100", "stock_file": "BIST100_Turkey.csv"},
    "Brazil (Bovespa)": {"index_key": "Bovespa", "stock_file": "Bovespa_Brazil.csv"},
    "Indonesia (IDX)": {"index_key": "IDX", "stock_file": "IDX_Indonesia.csv"}
}

MARKET_META = {
    "United States (S&P 500)": {"index_key": "SP500", "stock_file": "SP500_DATASET.csv", "region": "North America", "currency": "USD"},
    "India (NIFTY 50)": {"index_key": "NIFTY50", "stock_file": "NIFTY50_India.csv", "region": "Asia", "currency": "INR"},
    "Japan (Nikkei 225)": {"index_key": "Nikkei225", "stock_file": "Nikkei225_Japan.csv", "region": "Asia", "currency": "JPY"},
    "United Kingdom (FTSE 100)": {"index_key": "FTSE100", "stock_file": "FTSE100_UK.csv", "region": "Europe", "currency": "GBP"},
    "Germany (DAX 40)": {"index_key": "DAX40", "stock_file": "DAX40_Germany.csv", "region": "Europe", "currency": "EUR"},
    "Turkey (BIST 100)": {"index_key": "BIST100", "stock_file": "BIST100_Turkey.csv", "region": "Europe/Asia", "currency": "TRY"},
    "Brazil (Bovespa)": {"index_key": "Bovespa", "stock_file": "Bovespa_Brazil.csv", "region": "South America", "currency": "BRL"},
    "Indonesia (IDX)": {"index_key": "IDX", "stock_file": "IDX_Indonesia.csv", "region": "Asia", "currency": "IDR"}
}

FALLBACK_TICKERS = {
    "United States (S&P 500)": ["AAPL", "MSFT", "AMZN", "NVDA", "META", "GOOGL", "BRK-B", "JNJ", "JPM", "V"],
    "India (NIFTY 50)": ["RELIANCE.NS", "TCS.NS", "HDFCBANK.NS", "INFY.NS", "ICICIBANK.NS", "HINDUNILVR.NS", "ITC.NS", "SBI.NS", "BHARTIARTL.NS", "LTIM.NS"],
    "Japan (Nikkei 225)": ["7203.T", "6758.T", "9984.T", "6861.T", "8035.T", "6501.T", "4502.T", "6098.T", "9432.T", "4063.T"],
    "United Kingdom (FTSE 100)": ["SHEL.L", "AZN.L", "HSBA.L", "ULVR.L", "BP.L", "GSK.L", "DGE.L", "BATS.L", "RIO.L", "LLOY.L"],
    "Germany (DAX 40)": ["SAP.DE", "SIE.DE", "ALV.DE", "DTE.DE", "BAS.DE", "BMW.DE", "BAYN.DE", "MBG.DE", "VOW3.DE", "DPW.DE"],
    "Turkey (BIST 100)": ["THYAO.IS", "EREGL.IS", "ASELS.IS", "TUPRS.IS", "AKBNK.IS", "GARAN.IS", "KCHOL.IS", "SAHOL.IS", "YKBNK.IS", "BIMAS.IS"],
    "Brazil (Bovespa)": ["VALE3.SA", "PETR4.SA", "ITUB4.SA", "BBDC4.SA", "ABEV3.SA", "BBAS3.SA", "B3SA3.SA", "WEGE3.SA", "ITSAs.SA", "GGBR4.SA"],
    "Indonesia (IDX)": ["BBCA.JK", "BBRI.JK", "BMRI.JK", "TLKM.JK", "BYAN.JK", "ASII.JK", "TPIA.JK", "BBNI.JK", "UNVR.JK", "GOTO.JK"]
}

SEQ_LENGTH = 60

# Force absolute pathing to guarantee models are found regardless of terminal execution directory
PROJECT_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))

# --- STARTUP DIAGNOSTICS ---
logger.info("=" * 80)
logger.info(f"PROJECT_ROOT = {PROJECT_ROOT}")

if os.path.exists(PROJECT_ROOT):
    logger.info(f"ROOT FILES = {os.listdir(PROJECT_ROOT)}")

raw_dir = os.path.join(PROJECT_ROOT, "data", "raw")
logger.info(f"RAW_DIR = {raw_dir}")

if os.path.exists(raw_dir):
    logger.info(f"RAW FILES = {os.listdir(raw_dir)}")
else:
    logger.warning("data/raw directory does not exist")
logger.info("=" * 80)
# ---------------------------

MODEL_DIR = os.path.join(PROJECT_ROOT, "mlops_artifacts", "models")
DB_PATH = os.path.join(PROJECT_ROOT, "data", "nexus_trading.db")

def get_model_paths(index_key, model_type="CNN_BiLSTM_Attention"):
    model_path = os.path.join(MODEL_DIR, f"{index_key}_{model_type}.keras")
    scaler_path = os.path.join(MODEL_DIR, f"{index_key}_feature_scaler.pkl")
    features_path = os.path.join(MODEL_DIR, f"{index_key}_features_list.pkl")
    target_scaler_path = os.path.join(MODEL_DIR, f"{index_key}_target_scaler.pkl")
    
    # Fallback to old naming
    if not os.path.exists(model_path):
        model_path = os.path.join(MODEL_DIR, f"best_{index_key}_model.keras")
        if not os.path.exists(model_path):
            model_path = os.path.join(MODEL_DIR, f"best_{index_key.lower()}_model.keras")
            
    if not os.path.exists(scaler_path):
        alt_scaler_path = os.path.join(MODEL_DIR, f"{index_key.lower()}_feature_scaler.pkl")
        if os.path.exists(alt_scaler_path):
            scaler_path = alt_scaler_path
            
    return model_path, scaler_path, features_path, target_scaler_path

app = FastAPI(title="Nexus Quant Research & Portfolio Analytics Engine", version="6.0.0", description="SQL-Backed Institutional quantitative engine with MLOps logging and Factor Analytics.")

def parse_cors_origins(raw_origins: str) -> list[str]:
    return [origin.strip().rstrip("/") for origin in raw_origins.split(",") if origin.strip()]

frontend_origins = parse_cors_origins(
    os.getenv("FRONTEND_ORIGINS", "http://localhost:3000,http://127.0.0.1:3000")
)
frontend_origin_regex = os.getenv("FRONTEND_ORIGIN_REGEX", r"^https://[\w-]+\.vercel\.app$")

app.add_middleware(
    CORSMiddleware,
    allow_origins=frontend_origins,
    allow_origin_regex=frontend_origin_regex,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
# Must be added after CORS so CORS headers still apply to compressed/error responses.
app.add_middleware(GZipMiddleware, minimum_size=1000)

nlp_analyzer = SentimentIntensityAnalyzer()
MODEL_CACHE = {}
MODEL_CACHE_LOCK = threading.Lock()
MODEL_LOAD_RETRY_COOLDOWN_SEC = 300  # don't retry a failed model load more than once per 5 min

# Backtest strategy parameters.
# DEADBAND: minimum predicted next-bar log return (~0.1%) before taking a position, so the
# strategy ignores forecasts inside the noise floor instead of churning every bar.
# COST_BPS: per-unit-of-notional-traded cost in basis points. Set to 0 to reproduce a
# frictionless backtest; 5bps is a realistic retail-ish round-trip assumption per side.
BACKTEST_DEADBAND = float(os.getenv("BACKTEST_DEADBAND", "0.001"))
BACKTEST_COST_BPS = float(os.getenv("BACKTEST_COST_BPS", "5.0"))

# Feature-group membership for the explainability panel. Every trained model uses the
# same 42-column feature set (src/feature_engineering.py), so this mapping is static.
FEATURE_GROUPS = {
    "Momentum (MACD/RSI)": ["MACD", "Signal_Line", "MACD_Hist", "RSI_14", "Stoch_RSI", "ROC_5", "ROC_10", "ROC_20"],
    "Volatility Profile": ["Volatility_20", "GK_Vol_20", "ATR_14", "ATR_30", "BB_Width"],
    "Volume Trend": ["Volume", "Volume_MA_20", "Volume_Ratio", "OBV", "PVT", "VWAP_20"],
    "Mean Reversion": ["Dist_MA_20", "Dist_MA_50", "Dist_MA_200", "BB_Upper", "BB_Lower", "Rolling_Beta"],
}

def compute_feature_importance(model, X_pred: np.ndarray, features: list, pct_change: float) -> dict:
    """Gradient x Input saliency, aggregated into the four feature groups shown in the
    UI. Replaces what was previously np.random.uniform() dressed up as a 'SHAP-Proxy' -
    this is a real (if simple) attribution method: for each input feature, how much does
    nudging it change the model's output, scaled by the feature's own value.

    Returns each group's share of the predicted move in percentage points, signed, so
    they read the same way the fabricated version used to ("this group pushed the
    forecast up/down by X%") but are now derived from the model's actual gradient."""
    try:
        x = tf.convert_to_tensor(X_pred, dtype=tf.float32)
        with tf.GradientTape() as tape:
            tape.watch(x)
            out = model(x, training=False)
        grads = tape.gradient(out, x)
        if grads is None:
            raise ValueError("model is not differentiable w.r.t. its input")

        # Sum gradient*input attribution over the sequence timesteps -> one signed
        # contribution per feature.
        contrib = (grads[0].numpy() * x[0].numpy()).sum(axis=0)
        contrib_by_feature = dict(zip(features, contrib))

        raw_group = {
            group: float(sum(contrib_by_feature.get(c, 0.0) for c in cols))
            for group, cols in FEATURE_GROUPS.items()
        }
        total_abs = sum(abs(v) for v in raw_group.values())
        if total_abs < 1e-12:
            return {g: 0.0 for g in FEATURE_GROUPS}

        # Rescale so the groups sum (in absolute value) to the actual predicted move,
        # expressing each in the same percentage-point units as pct_change.
        scale = abs(pct_change) / total_abs
        return {g: round(v * scale, 3) for g, v in raw_group.items()}
    except Exception as e:
        logger.warning(f"Gradient-based feature importance failed: {e}")
        return {g: 0.0 for g in FEATURE_GROUPS}

def get_cached_model(idx_key: str, model_type: str):
    """Thread-safe cached model load. A failed load is remembered for
    MODEL_LOAD_RETRY_COOLDOWN_SEC instead of being retried (and refailing) on every
    single request, and concurrent first-hits for the same key are serialized so two
    requests never load the same multi-MB Keras model into memory at once."""
    cache_key = f"{idx_key}_{model_type}"
    with MODEL_CACHE_LOCK:
        entry = MODEL_CACHE.get(cache_key)
        if entry is not None:
            if entry.get("status") == "failed":
                if time.time() - entry["ts"] < MODEL_LOAD_RETRY_COOLDOWN_SEC:
                    return None
                # cooldown elapsed - fall through and retry the load
            else:
                return entry

        model_path, scaler_path, features_path, target_scaler_path = get_model_paths(idx_key, model_type)
        if os.path.exists(model_path) and os.path.exists(scaler_path):
            try:
                logger.info(f"Mounting {model_type} Model for {idx_key} from {model_path}...")
                if os.path.exists(features_path):
                    feature_list = joblib.load(features_path)
                else:
                    feature_list = ['Open', 'High', 'Low', 'Close', 'Volume', 'MA_20', 'MA_50', 'Volatility_20', 'RSI_14']

                # Models now predict a standardized next-bar LOG RETURN, so a StandardScaler
                # target scaler is required to invert predictions back into a price.
                # Stale MinMaxScaler target scalers from the old price-level pipeline still
                # exist on disk, so check the type - not just the path - before trusting it.
                target_scaler = joblib.load(target_scaler_path) if os.path.exists(target_scaler_path) else None
                if not isinstance(target_scaler, StandardScaler):
                    logger.warning(
                        f"⚠️ {cache_key} has no log-return target scaler (found "
                        f"{type(target_scaler).__name__}). This artifact predates the return-target "
                        f"retrain; refusing to serve it. Retrain via run_pipeline.py."
                    )
                    MODEL_CACHE[cache_key] = {"status": "failed", "ts": time.time()}
                    return None

                loaded = {
                    "model": load_model(model_path, compile=False),
                    "scaler": joblib.load(scaler_path),
                    "target_scaler": target_scaler,
                    "features": feature_list,
                }
                MODEL_CACHE[cache_key] = loaded
                logger.info(f"✅ Architecture successfully mounted for {cache_key}.")
                return loaded
            except Exception as e:
                logger.error(f"❌ Failed to load Neural Network artifacts for {cache_key}: {e}")
                MODEL_CACHE[cache_key] = {"status": "failed", "ts": time.time()}
                return None
        else:
            logger.warning(f"⚠️ Artifacts missing for {cache_key}. Expected: {model_path}")
            MODEL_CACHE[cache_key] = {"status": "failed", "ts": time.time()}
            return None

# --- NEW PYDANTIC MODELS ---
class InferenceRequest(BaseModel):
    market_name: str
    ticker: str
    model_type: str = "CNN_BiLSTM_Attention"

class InferenceResponse(BaseModel):
    ticker: str
    latest_close: float
    predicted_price: float
    delta: float
    pct_change: float
    model_type: str
    confidence: float
    feature_importance: dict  # ADDED: Explainability

class NewsRequest(BaseModel):
    ticker: str
    market: str = ""

class BacktestResponse(BaseModel):
    dates: list
    strategy_equity: list
    buy_hold_equity: list
    total_return: float
    bh_return: float
    sharpe_ratio: float
    max_drawdown: float
    model_used: str

class MonteCarloRequest(BaseModel):
    market_name: str
    ticker: str
    simulations: int = 1000
    time_horizon: int = 252

class MonteCarloResponse(BaseModel):
    expected_return_pct: float
    var_95_pct: float
    mean_path: list
    upper_path: list
    lower_path: list
# ---------------------------

MARKET_DATA_CACHE = TTLCache(maxsize=256, ttl=300)  # 5 min: collapses the CSV/yfinance/feature-engineering hot path
MARKET_DATA_CACHE_LOCK = threading.Lock()

def get_market_data(market_name: str, ticker: str):
    """Cached wrapper around _fetch_market_data. Returns a copy so callers are free to
    mutate the frame (e.g. adding an 'Adj Close' column) without corrupting the shared cache
    entry for concurrent requests."""
    cache_key = (market_name, ticker)
    with MARKET_DATA_CACHE_LOCK:
        cached = MARKET_DATA_CACHE.get(cache_key)
    if cached is not None:
        return cached.copy()

    df = _fetch_market_data(market_name, ticker)

    with MARKET_DATA_CACHE_LOCK:
        MARKET_DATA_CACHE[cache_key] = df

    return df.copy()

def _fetch_market_data(market_name: str, ticker: str):
    if market_name not in MARKET_CONFIG:
        raise HTTPException(status_code=404, detail="Market not found in registry.")

    idx_key = MARKET_CONFIG[market_name]["index_key"]
    
    def process_df(data):
        if data.empty: return data
        
        # PREVENT CHART PLUNGE BUG: Replace zero prices with NaN, then forward fill
        for col in ['Open', 'High', 'Low', 'Close']:
            if col in data.columns:
                data[col] = pd.to_numeric(data[col], errors='coerce').replace(0.0, np.nan)
        if 'Volume' in data.columns:
            data['Volume'] = pd.to_numeric(data['Volume'], errors='coerce')
            
        if 'Close' in data.columns and 'Adj Close' not in data.columns:
            data['Adj Close'] = data['Close']
            
        data = data.ffill().bfill().dropna(subset=['Close'])
        
        # Drop any remaining infinite values that break Pydantic validation
        data = data.replace([np.inf, -np.inf], np.nan).ffill()
        return FeatureEngineering.engineer_features(data)

    # Check SQL DB first
    if os.path.exists(DB_PATH):
        with sqlite3.connect(DB_PATH) as conn:
            df = pd.read_sql(f"SELECT * FROM market_data WHERE Market = '{idx_key}' AND Ticker = '{ticker}' ORDER BY Date", conn, parse_dates=['Date'])
            if not df.empty:
                return process_df(df)
                
    # Fallback 1: Attempt to load raw CSV
    file_path = os.path.join(PROJECT_ROOT, "data", "raw", MARKET_CONFIG[market_name]["stock_file"])
    
    if os.path.exists(file_path):
        try:
            df = pd.read_csv(file_path, parse_dates=['Date'])
            subset = df[df['Ticker'] == ticker].sort_values('Date')
            if not subset.empty:
                return process_df(subset)
        except Exception as e:
            logger.error(f"Failed to read CSV for {ticker}: {e}")

    # Fallback 2: Dynamic Live Fetch (Zero-Dataset Resilience)
    logger.warning(f"Dataset missing or empty for {market_name}. Attempting live fetch via yfinance for {ticker}...")
    try:
        df_live = yf.download(ticker, period="2y", progress=False)
        if not df_live.empty:
            df_live.reset_index(inplace=True)
            # Flatten MultiIndex columns safely if yfinance returns them
            if isinstance(df_live.columns, pd.MultiIndex):
                df_live.columns = [c[0] for c in df_live.columns]
                
            df_live['Ticker'] = ticker
            logger.info(f"✅ Successfully downloaded live historical data for {ticker}")
            return process_df(df_live)
        else:
            logger.warning(f"yfinance returned empty dataset for {ticker}")
    except Exception as e:
        logger.error(f"yfinance live fetch failed for {ticker}: {e}")

    # Fallback 3: Hard failure
    if ticker in FALLBACK_TICKERS.get(market_name, []):
        raise HTTPException(
            status_code=503,
            detail="Market dataset is not deployed on the server and live fetch failed. Predictions require historical market data."
        )
    raise HTTPException(status_code=404, detail="Ticker not available")

@app.get("/")
def health_check():
    return {"status": "Operational", "engine": "SQL-Backed Institutional Quant Engine v6.0"}

@app.post("/api/v1/predict", response_model=InferenceResponse)
def execute_prediction(req: InferenceRequest):
    try:
        df = get_market_data(req.market_name, req.ticker)
        latest_close = float(df['Close'].iloc[-1])
        idx_key = MARKET_CONFIG[req.market_name]["index_key"]

        artifacts = get_cached_model(idx_key, req.model_type)

        if artifacts and len(df) >= SEQ_LENGTH:
            features = artifacts["features"]
            try:
                if 'Adj Close' in features and 'Adj Close' not in df.columns and 'Close' in df.columns:
                    df['Adj Close'] = df['Close']
                
                # 1. Extract feature subset and Scale
                data_slice = df[features].tail(SEQ_LENGTH).values
                scaled_recent = artifacts["scaler"].transform(data_slice)
                X_pred = scaled_recent.reshape(1, SEQ_LENGTH, len(features))
                
                # 2. Neural Net Prediction (a standardized next-bar log return)
                pred = artifacts["model"].predict(X_pred, verbose=0)

                # 3. Invert the target scaler to recover the raw log return, then compound
                # it onto the latest close. (Previously the prediction was a scaled price
                # level inverted via a dummy row through the *feature* scaler.)
                pred_log_return = float(
                    artifacts["target_scaler"].inverse_transform(np.array([[float(pred[0][0])]]))[0][0]
                )
                # Guard against a runaway model blowing up through exp()
                pred_log_return = float(np.clip(pred_log_return, -0.5, 0.5))
                predicted_price = float(latest_close * np.exp(pred_log_return))

                model_type_resp = f"Neural Network ({req.model_type})"
                
                # Dynamic Confidence Calculation based on Signal-to-Noise Ratio (SNR).
                # Both terms MUST be in the same units. Previously this compared
                # abs(predicted_price - latest_close) - a price delta in currency units -
                # against Volatility_20, which is the rolling std of LOG RETURNS (a
                # fraction). That made SNR scale with the share price rather than with
                # prediction quality, so any high-priced ticker pinned confidence at the
                # ceiling (META: a +0.03% forecast reported 99.2% confidence).
                # The predicted log return is already the move expressed as a fraction.
                move_frac = abs(pred_log_return)
                vol = df['Volatility_20'].iloc[-1] if 'Volatility_20' in df.columns else 0.02
                if not np.isfinite(vol) or vol <= 0:
                    vol = 0.02

                # "How many daily standard deviations is this forecast?"
                signal_to_noise = move_frac / (vol + 1e-9)

                # Map SNR onto a deliberately modest band. Walk-forward validation puts
                # this model's out-of-sample directional accuracy around 51-52%, so a
                # 75-99.5% band (the previous range) would materially overstate it. The
                # floor is a coin flip because that is the honest worst case.
                base_conf = 50.0
                max_conf = 80.0
                sigmoid = 1 / (1 + np.exp(-signal_to_noise)) # Range 0.5 to 1.0
                scaled_sigmoid = (sigmoid - 0.5) * 2.0 # Range 0.0 to 1.0

                conf = float(np.clip(base_conf + (scaled_sigmoid * (max_conf - base_conf)), base_conf, max_conf))
                
            except Exception as e:
                logger.error(f"❌ TensorFlow Inference Failed: {e}")
                raise e
        else:
            logger.warning(f"Triggering linear fallback. Reason: Artifacts={bool(artifacts)}, Data_Length={len(df)}")
            
            # DEFEND AGAINST ZERO DIVISION ERROR IN FALLBACK LOGIC
            if len(df) >= 5 and float(df['Close'].iloc[-5]) != 0.0:
                change = (float(df['Close'].iloc[-1]) / float(df['Close'].iloc[-5])) - 1
            else:
                change = 0.0
                
            predicted_price = float(latest_close * (1 + change * 0.3))
            model_type_resp = "Algorithmic Momentum Synthesis"
            conf = 72.5
            
        # GUARD AGAINST PYDANTIC VALIDATION 500 ERRORS (caused by NaNs)
        if np.isnan(predicted_price) or np.isinf(predicted_price):
            predicted_price = latest_close
            
        delta = predicted_price - latest_close
        
        # DEFEND AGAINST ZERO DIVISION FOR PCT_CHANGE
        if latest_close != 0.0:
            pct_change = (delta / latest_close) * 100
        else:
            pct_change = 0.0
        
        if np.isnan(delta) or np.isnan(pct_change) or np.isinf(pct_change) or np.isinf(delta):
            delta = 0.0
            pct_change = 0.0
            conf = 0.0

        # --- EXPLAINABILITY: Gradient x Input saliency, grouped by feature family ---
        # Real attribution derived from the model's own gradient (see
        # compute_feature_importance) when a neural prediction was actually made;
        # zeroed out for the algorithmic fallback, which has no gradient to explain.
        explainability = (
            compute_feature_importance(artifacts["model"], X_pred, features, pct_change)
            if artifacts and len(df) >= SEQ_LENGTH
            else {g: 0.0 for g in FEATURE_GROUPS}
        )
        
        return InferenceResponse(
            ticker=req.ticker, latest_close=latest_close, predicted_price=predicted_price,
            delta=delta, pct_change=pct_change, model_type=model_type_resp, confidence=conf,
            feature_importance=explainability
        )
    except HTTPException as he:
        raise he
    except Exception as e:
        logger.error(f"Critical prediction failure: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/v1/backtest", response_model=BacktestResponse)
def execute_backtest(req: InferenceRequest):
    try:
        df = get_market_data(req.market_name, req.ticker)
        idx_key = MARKET_CONFIG[req.market_name]["index_key"]
        
        backtest_days = 252 # 1 Trading Year
        if len(df) < backtest_days + SEQ_LENGTH:
            raise HTTPException(status_code=400, detail="Insufficient data for a 1-year backtest.")

        actual_closes = df['Close'].values[-backtest_days:]
        dates = df.index[-backtest_days:].strftime('%Y-%m-%d').tolist()
        asset_returns = pd.Series(actual_closes).pct_change().fillna(0).values

        artifacts = get_cached_model(idx_key, req.model_type)

        # Vectorized Signal Generation using Neural Network Ensemble
        if artifacts:
            try:
                features = artifacts["features"]
                scaler = artifacts["scaler"]
                
                if 'Adj Close' in features and 'Adj Close' not in df.columns and 'Close' in df.columns:
                    df['Adj Close'] = df['Close']
                
                data_slice = df[features].values[-(backtest_days + SEQ_LENGTH):]
                scaled_data = scaler.transform(data_slice)
                X_batch = np.array([scaled_data[i:i+SEQ_LENGTH] for i in range(backtest_days)])

                # === HYBRID NEURAL NETWORK + TREND CONVERGENCE ===
                # The NN supplies a directional view on the next bar's return; a medium-term
                # trend filter (MA20 > MA50) supplies confirmation. Each leg is lag-aligned
                # independently BEFORE being combined (see below).

                # 1. NN leg. The model predicts a standardized next-bar log return, so its
                # sign IS the directional call - no differencing needed. (The old code did
                # sign(pred_t - pred_{t-1}), which for a price-level model algebraically
                # cancelled the model out and left lagged realised momentum.)
                preds_scaled = artifacts["model"].predict(X_batch, verbose=0).flatten()
                preds_returns = artifacts["target_scaler"].inverse_transform(
                    preds_scaled.reshape(-1, 1)
                ).flatten()

                # 2 + 3. Deadband, per-leg lag alignment and graduated position sizing all
                # live in src/strategy.py so the served strategy is provably identical to
                # the one validated offline by validate_strategy.py.
                has_ma = 'MA_20' in df.columns and 'MA_50' in df.columns
                signals = build_signals(
                    preds_returns,
                    ma20=df['MA_20'].values[-backtest_days:] if has_ma else None,
                    ma50=df['MA_50'].values[-backtest_days:] if has_ma else None,
                    deadband=BACKTEST_DEADBAND,
                )

                model_used = f"Hybrid NN-Trend Convergence ({req.model_type})"
            except Exception as e:
                logger.error(f"❌ Backtest inference failed: {e}")
                raise e
        else:
            # Algorithmic Fallback (MACD + EMA Convergence). Same-bar indicators, so the
            # combined signal is shifted by one bar below.
            macd = df['MACD'].values[-backtest_days:]
            sig = df['Signal_Line'].values[-backtest_days:]
            ma20 = df['MA_20'].values[-backtest_days:]
            ma50 = df['MA_50'].values[-backtest_days:]

            macd_signal = np.where(macd > sig, 1.0, -1.0)
            trend_signal_fb = np.where(ma20 > ma50, 1.0, -1.0)
            combined_fb = macd_signal + trend_signal_fb
            raw_fb = np.select(
                [combined_fb >= 2, combined_fb <= -2],
                [1.0, -1.0],
                default=0.0,  # indicators disagree -> stay flat
            )
            signals = np.roll(raw_fb, 1)
            signals[0] = 0.0
            model_used = "Algorithmic Trend Convergence"

        # Each leg was lag-aligned before combination, so no blanket shift here.
        # (The old code applied np.roll to the already-aligned combined signal, which
        # left the NN leg two bars stale.)
        trade_signals = signals

        # Charge transaction costs on the change in position size each bar.
        strategy_returns = apply_costs(trade_signals, asset_returns, cost_bps=BACKTEST_COST_BPS)

        # Equity Curves
        start_capital = 100000.0
        strat_equity = start_capital * np.cumprod(1 + strategy_returns)
        bh_equity = start_capital * np.cumprod(1 + asset_returns)

        # Institutional Metrics
        total_ret = ((strat_equity[-1] - start_capital) / start_capital) * 100
        bh_ret = ((bh_equity[-1] - start_capital) / start_capital) * 100

        std_dev = np.std(strategy_returns)
        sharpe = (np.mean(strategy_returns) / std_dev * np.sqrt(252)) if std_dev > 0 else 0.0

        roll_max = np.maximum.accumulate(strat_equity)
        drawdowns = strat_equity / roll_max - 1.0
        max_dd = np.min(drawdowns) * 100

        return BacktestResponse(
            dates=dates,
            strategy_equity=strat_equity.tolist(),
            buy_hold_equity=bh_equity.tolist(),
            total_return=total_ret,
            bh_return=bh_ret,
            sharpe_ratio=sharpe,
            max_drawdown=max_dd,
            model_used=model_used
        )

    except HTTPException as he: raise he
    except Exception as e: 
        logger.error(f"Backtest runtime error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# --- NEW: MONTE CARLO SIMULATION ENGINE ---
@app.post("/api/v1/monte-carlo", response_model=MonteCarloResponse)
def execute_monte_carlo(req: MonteCarloRequest):
    try:
        df = get_market_data(req.market_name, req.ticker)
        if len(df) < req.time_horizon:
            raise HTTPException(status_code=400, detail="Not enough historical data for Monte Carlo simulation.")

        # Calculate historical returns
        returns = df['Close'].pct_change().dropna().values
        mu = returns.mean()
        sigma = returns.std()
        last_price = float(df['Close'].iloc[-1])

        # Run Geometric Brownian Motion (GBM) Paths
        paths = np.zeros((req.simulations, req.time_horizon))
        paths[:, 0] = last_price
        
        for t in range(1, req.time_horizon):
            rand_shocks = np.random.normal(loc=mu, scale=sigma, size=req.simulations)
            paths[:, t] = paths[:, t-1] * (1 + rand_shocks)

        end_prices = paths[:, -1]
        
        # Calculate institutional risk metrics
        expected_price = np.mean(end_prices)
        expected_return_pct = ((expected_price - last_price) / last_price) * 100
        
        var_95_price = np.percentile(end_prices, 5) # 5th percentile represents 95% confidence VaR
        var_95_pct = ((var_95_price - last_price) / last_price) * 100

        # We extract specific percentiles to send to the frontend for charting (saves bandwidth vs sending 1000 paths)
        mean_path = np.mean(paths, axis=0).tolist()
        upper_path = np.percentile(paths, 95, axis=0).tolist()
        lower_path = np.percentile(paths, 5, axis=0).tolist()

        return MonteCarloResponse(
            expected_return_pct=float(expected_return_pct),
            var_95_pct=float(var_95_pct),
            mean_path=mean_path,
            upper_path=upper_path,
            lower_path=lower_path
        )
    except HTTPException as he:
        raise he
    except Exception as e:
        logger.error(f"Monte Carlo Engine Failed: {e}")
        raise HTTPException(status_code=500, detail="Simulation Failed")

FUNDAMENTALS_CACHE = TTLCache(maxsize=256, ttl=3600)  # fundamentals move slowly; 1hr is plenty
FUNDAMENTALS_CACHE_LOCK = threading.Lock()

def _clamp_score(value: float, lo: float, hi: float) -> int:
    """Linearly map value from [lo, hi] onto a 0-100 score, clamped at the ends."""
    if hi == lo:
        return 50
    pct = (value - lo) / (hi - lo)
    return int(min(max(pct * 100, 0), 100))

def get_fundamental_scores(ticker: str) -> tuple[int, int, int]:
    """Quality/Value/Growth scores (0-100) from real yfinance fundamentals. Falls back to
    a neutral 50 per-factor when a field is missing rather than fabricating a number."""
    with FUNDAMENTALS_CACHE_LOCK:
        cached = FUNDAMENTALS_CACHE.get(ticker)
    if cached is not None:
        return cached

    quality, value, growth = 50, 50, 50
    try:
        info = yf.Ticker(ticker).info

        # Quality: return on equity and profit margin - higher is better.
        roe = info.get("returnOnEquity")
        margin = info.get("profitMargins")
        parts = []
        if roe is not None:
            parts.append(_clamp_score(roe, 0.0, 0.30))
        if margin is not None:
            parts.append(_clamp_score(margin, 0.0, 0.25))
        if parts:
            quality = int(sum(parts) / len(parts))

        # Value: trailing P/E - lower is "cheaper" (higher value score). Inverted scale.
        pe = info.get("trailingPE")
        if pe is not None and pe > 0:
            value = 100 - _clamp_score(pe, 8, 40)

        # Growth: revenue and earnings growth - higher is better.
        rev_g = info.get("revenueGrowth")
        earn_g = info.get("earningsGrowth")
        parts = []
        if rev_g is not None:
            parts.append(_clamp_score(rev_g, -0.10, 0.30))
        if earn_g is not None:
            parts.append(_clamp_score(earn_g, -0.10, 0.30))
        if parts:
            growth = int(sum(parts) / len(parts))
    except Exception as e:
        logger.warning(f"Fundamentals lookup failed for {ticker}, using neutral scores: {e}")

    result = (quality, value, growth)
    with FUNDAMENTALS_CACHE_LOCK:
        FUNDAMENTALS_CACHE[ticker] = result
    return result

# --- NEW: REGIME DETECTION & FACTOR EXPOSURE ---
@app.get("/api/v1/quant-metrics/{market_name}/{ticker}")
def get_quant_metrics(market_name: str, ticker: str):
    try:
        df = get_market_data(market_name, ticker)
        if len(df) < 200:
            raise HTTPException(status_code=400, detail="Insufficient data for regime detection (200 days required)")

        current_close = float(df['Close'].iloc[-1])
        ma50 = float(df['Close'].rolling(50).mean().iloc[-1])
        ma200 = float(df['Close'].rolling(200).mean().iloc[-1])
        
        returns = df['Close'].pct_change().dropna()
        volatility_30d = float(returns.tail(30).std() * np.sqrt(252))
        hist_volatility = float(returns.std() * np.sqrt(252))

        # 1. Regime Detection Logic
        regime = "Sideways Market"
        if current_close > ma50 and ma50 > ma200:
            regime = "Bull Market"
        elif current_close < ma50 and ma50 < ma200:
            regime = "Bear Market"

        if volatility_30d > (hist_volatility * 1.5):
            regime = "High Volatility"

        # 2. Factor Analytics (0-100 Guage System)
        momentum_raw = (current_close / float(df['Close'].iloc[-126])) - 1 if len(df) > 126 else 0
        momentum_score = min(max(int((momentum_raw + 0.5) * 100), 0), 100)

        vol_score = min(max(int(100 - (volatility_30d * 100)), 0), 100) # Low Volatility factor

        # Quality/Value/Growth need fundamentals (P/E, ROE, revenue growth), which aren't
        # in this app's price/volume pipeline. These used to be np.random.uniform() -
        # plausible-looking numbers with no relationship to the ticker. Fetch real
        # fundamentals from yfinance where available; report a neutral 50 (not a random
        # number) when a field is genuinely missing, which is common for several of the
        # non-US tickers this app covers.
        quality_score, value_score, growth_score = get_fundamental_scores(ticker)

        return {
            "regime": regime,
            "factors": {
                "Momentum": momentum_score,
                "Low Volatility": vol_score,
                "Quality": quality_score,
                "Value": value_score,
                "Growth": growth_score
            }
        }
    except Exception as e:
        logger.error(f"Quant metrics failed: {e}")
        raise HTTPException(status_code=500, detail="Metrics engine failed")

import feedparser
import urllib.parse

@app.post("/api/v1/news")
def get_real_time_news(req: NewsRequest):
    try:
        search_term = req.market if req.market else req.ticker
        query = urllib.parse.quote(f"{search_term} stock market finance economy")
        url = f"https://news.google.com/rss/search?q={query}&hl=en-US&gl=US&ceid=US:en"
        
        feed = feedparser.parse(url)
        raw_news = feed.entries
        
        if not raw_news: return {"news": []}
            
        processed_news = []
        for item in raw_news[:6]:
            title = item.title
            link = item.link
            publisher = getattr(item, 'source', {}).get('title', 'Financial Press')
            
            sentiment_score = nlp_analyzer.polarity_scores(title)
            compound = sentiment_score['compound']
            
            if compound >= 0.15: sentiment, color = "BULLISH", "#10b981"
            elif compound <= -0.15: sentiment, color = "BEARISH", "#ef4444"
            else: sentiment, color = "NEUTRAL", "#3b82f6"
                
            processed_news.append({"title": title, "source": publisher, "link": link, "tag": f"NLP SENTIMENT: {sentiment}", "color": color})
        return {"news": processed_news}
    except Exception as e: 
        logger.error(f"News fetch failed: {e}")
        return {"news": []}

@app.get("/api/v1/markets")
def get_markets():
    return {"markets": MARKET_META}

# --- HARDENED TICKER ENDPOINT ---
@app.get("/api/v1/tickers/{market_name}")
def get_tickers(market_name: str):
    try:
        if market_name not in MARKET_CONFIG:
            raise HTTPException(status_code=404, detail=f"Market '{market_name}' not found")

        stock_file = MARKET_CONFIG[market_name]["stock_file"]
        file_path = os.path.join(PROJECT_ROOT, "data", "raw", stock_file)

        logger.info(f"Requested Market: {market_name}")

        # TIER 1: LOAD FROM CSV FOR LIQUIDITY RANKING
        if os.path.exists(file_path):
            try:
                df = pd.read_csv(file_path, parse_dates=["Date"])
                required_cols = ["Ticker", "Close", "Volume", "Date"]
                if not any(col not in df.columns for col in required_cols):
                    df["Dollar_Volume"] = df["Close"] * df["Volume"]
                    latest_date = df["Date"].max()
                    recent = df[df["Date"] >= (latest_date - pd.Timedelta(days=90))]
                    top_30 = recent.groupby("Ticker")["Dollar_Volume"].median().sort_values(ascending=False).head(30).index.tolist()
                    
                    if top_30:
                        return {"market": market_name, "source": "dataset", "tickers": top_30}
            except Exception as e:
                logger.error(f"CSV parsing failed: {e}")

        # TIER 2: HARDCODED FALLBACK (Specifically constrained to pre-trained tickers)
        logger.warning(f"Using hardcoded fallback tickers for {market_name} to align with trained model base.")
        return {"market": market_name, "source": "static_fallback", "tickers": FALLBACK_TICKERS.get(market_name, [])}

    except HTTPException:
        raise
    except Exception as e:
        logger.exception(f"Unexpected error in get_tickers: {e}")
        return {"market": market_name, "source": "error_fallback", "tickers": FALLBACK_TICKERS.get(market_name, [])}
# --------------------------------

@app.get("/api/v1/stock/{market_name}/{ticker}")
def get_stock_data(market_name: str, ticker: str):
    df = get_market_data(market_name, ticker)
    df_recent = df.tail(252)  # Last 1 year
    
    # Handle NaNs defensively for frontend charting
    df_recent = df_recent.replace([np.inf, -np.inf, np.nan], 0.0)
    
    result = {
        "ticker": ticker,
        "market": market_name,
        "currency": MARKET_META.get(market_name, {}).get("currency", "USD"),
        "region": MARKET_META.get(market_name, {}).get("region", "Global"),
        "latest_close": float(df_recent['Close'].iloc[-1]),
        "prev_close": float(df_recent['Close'].iloc[-2]) if len(df_recent) > 1 else 0.0,
        "price_delta": float(df_recent['Close'].iloc[-1] - df_recent['Close'].iloc[-2]) if len(df_recent) > 1 else 0.0,
        "pct_change": float(((df_recent['Close'].iloc[-1] / df_recent['Close'].iloc[-2]) - 1) * 100) if len(df_recent) > 1 and df_recent['Close'].iloc[-2] != 0 else 0.0,
        "rsi": float(df_recent['RSI_14'].iloc[-1]) if 'RSI_14' in df_recent.columns else 0.0,
        "volatility": float(df_recent['Volatility_20'].iloc[-1] * np.sqrt(252) * 100) if 'Volatility_20' in df_recent.columns else 0.0,
        "vwap": float(df_recent['VWAP_20'].iloc[-1]) if 'VWAP_20' in df_recent.columns else 0.0,
        "ma_20": float(df_recent['MA_20'].iloc[-1]) if 'MA_20' in df_recent.columns else 0.0,
        "ma_50": float(df_recent['MA_50'].iloc[-1]) if 'MA_50' in df_recent.columns else 0.0,
        "dates": df_recent.index.strftime('%Y-%m-%d').tolist() if hasattr(df_recent.index, 'strftime') else df_recent.reset_index()['Date'].astype(str).tolist(),
        "closes": df_recent['Close'].tolist(),
        "opens": df_recent['Open'].tolist(),
        "highs": df_recent['High'].tolist(),
        "lows": df_recent['Low'].tolist(),
        "volumes": df_recent['Volume'].tolist(),
        "bb_upper": df_recent['BB_Upper'].tolist() if 'BB_Upper' in df_recent.columns else [],
        "bb_lower": df_recent['BB_Lower'].tolist() if 'BB_Lower' in df_recent.columns else [],
        "macd": df_recent['MACD'].tolist() if 'MACD' in df_recent.columns else [],
        "signal_line": df_recent['Signal_Line'].tolist() if 'Signal_Line' in df_recent.columns else [],
        "rsi_series": df_recent['RSI_14'].tolist() if 'RSI_14' in df_recent.columns else [],
    }
    return result

# --- DEBUG ENDPOINT ---
@app.get("/api/v1/debug")
def debug_environment():
    raw_dir = os.path.join(PROJECT_ROOT, "data", "raw")
    return {
        "project_root": PROJECT_ROOT,
        "raw_dir_exists": os.path.exists(raw_dir),
        "raw_files": os.listdir(raw_dir) if os.path.exists(raw_dir) else []
    }
# ----------------------

# --- NEW: WATCHLIST & CORRELATION ENDPOINTS ---
def _fetch_watchlist_entry(market_name: str, t: str):
    try:
        df = get_market_data(market_name, t)
        if len(df) > 1:
            latest = float(df['Close'].iloc[-1])
            prev = float(df['Close'].iloc[-2])
            pct = ((latest / prev) - 1) * 100 if prev != 0 else 0.0
            vol = float(df['Volume'].iloc[-1]) if 'Volume' in df.columns else 0.0

            # Defend against NaNs
            if np.isnan(pct) or np.isinf(pct): pct = 0.0

            return {"ticker": t, "price": latest, "pct_change": pct, "volume": vol}, None
        return None, None
    except Exception as e:
        logger.warning(f"Skipping {t} for watchlist: {e}")
        return None, f"{t}: {str(e)}"

@app.get("/api/v1/watchlist/{market_name}")
def get_watchlist(market_name: str):
    try:
        tickers = FALLBACK_TICKERS.get(market_name, [])[:10]
        results = []
        errors = []
        # Per-ticker fetches are independent I/O (cache lookups, CSV reads, or yfinance
        # calls) - run them concurrently instead of one request paying for all 10 serially.
        with ThreadPoolExecutor(max_workers=len(tickers) or 1) as executor:
            for entry, err in executor.map(lambda t: _fetch_watchlist_entry(market_name, t), tickers):
                if entry is not None:
                    results.append(entry)
                if err is not None:
                    errors.append(err)
        return {"watchlist": results, "debug_errors": errors}
    except Exception as e:
        logger.error(f"Watchlist failed: {e}")
        raise HTTPException(status_code=500, detail="Failed to generate watchlist")

def _fetch_correlation_series(market_name: str, t: str):
    try:
        df = get_market_data(market_name, t)
        df_recent = df.tail(90)  # Use 90 days for stable correlation
        if len(df_recent) >= 30:
            return t, df_recent['Close'], None
        return t, None, None
    except Exception as e:
        return t, None, f"{t}: {str(e)}"

@app.get("/api/v1/correlation/{market_name}")
def get_correlation(market_name: str):
    try:
        tickers = FALLBACK_TICKERS.get(market_name, [])[:10]
        series_dict = {}
        errors = []
        with ThreadPoolExecutor(max_workers=len(tickers) or 1) as executor:
            for t, series, err in executor.map(lambda t: _fetch_correlation_series(market_name, t), tickers):
                if series is not None:
                    series_dict[t] = series
                if err is not None:
                    errors.append(err)

        if not series_dict:
            return {"tickers": [], "matrix": [], "debug_errors": errors}
            
        # Combine into single DataFrame and compute Pearson correlation
        combined = pd.DataFrame(series_dict).ffill().bfill().fillna(0)
        corr = combined.corr().round(2)
        
        matrix = corr.values.tolist()
        labels = corr.columns.tolist()
        
        # Replace any remaining NaNs in the matrix with 0
        matrix = [[0.0 if np.isnan(val) else val for val in row] for row in matrix]
        
        return {"tickers": labels, "matrix": matrix}
    except Exception as e:
        logger.error(f"Correlation heatmap failed: {e}")
        raise HTTPException(status_code=500, detail="Failed to generate correlation matrix")
# ----------------------

if __name__ == "__main__":
    uvicorn.run("api.main:app", host="0.0.0.0", port=7860, reload=False)