"""Single source of truth for the markets the platform supports.

Every consumer (API, training pipeline, walk-forward validation, SQL pipeline) reads
from here, so adding or removing a market is a one-line change.
"""

MARKET_CONFIG = {
    "United States (S&P 500)": {"index_key": "SP500", "report_ticker": "AAPL", "stock_file": "SP500_DATASET.csv", "lat": 40.71, "lon": -74.00, "region": "North America", "currency": "USD"},
    "India (NIFTY 50)": {"index_key": "NIFTY50", "report_ticker": "RELIANCE.NS", "stock_file": "NIFTY50_India.csv", "lat": 19.07, "lon": 72.87, "region": "Asia", "currency": "INR"},
    "Japan (Nikkei 225)": {"index_key": "Nikkei225", "report_ticker": "7203.T", "stock_file": "Nikkei225_Japan.csv", "lat": 35.68, "lon": 139.69, "region": "Asia", "currency": "JPY"},
    "United Kingdom (FTSE 100)": {"index_key": "FTSE100", "report_ticker": "SHEL.L", "stock_file": "FTSE100_UK.csv", "lat": 51.50, "lon": -0.12, "region": "Europe", "currency": "GBP"},
    "Germany (DAX 40)": {"index_key": "DAX40", "report_ticker": "SAP.DE", "stock_file": "DAX40_Germany.csv", "lat": 50.11, "lon": 8.68, "region": "Europe", "currency": "EUR"},
    "Turkey (BIST 100)": {"index_key": "BIST100", "report_ticker": "THYAO.IS", "stock_file": "BIST100_Turkey.csv", "lat": 41.00, "lon": 28.97, "region": "Europe/Asia", "currency": "TRY"},
    "Brazil (Bovespa)": {"index_key": "Bovespa", "report_ticker": "VALE3.SA", "stock_file": "Bovespa_Brazil.csv", "lat": -23.55, "lon": -46.63, "region": "South America", "currency": "BRL"},
    "Indonesia (IDX)": {"index_key": "IDX", "report_ticker": "BBCA.JK", "stock_file": "IDX_Indonesia.csv", "lat": -6.20, "lon": 106.81, "region": "Asia", "currency": "IDR"},
}

# `report_ticker` is the stock the report card downloads when the raw dataset for a market
# is not on disk. With the dataset present, the report card (like training) uses the
# market's highest median dollar-volume ticker instead.

# index_key -> raw dataset filename, for the offline training/validation scripts.
MARKET_FILES = {m["index_key"]: m["stock_file"] for m in MARKET_CONFIG.values()}
