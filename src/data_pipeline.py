import os
import sys
import sqlite3
import pandas as pd
import yfinance as yf
from datetime import datetime, timedelta
import logging

# Ensure Python can find the src module
PROJECT_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
if PROJECT_ROOT not in sys.path:
    sys.path.insert(0, PROJECT_ROOT)

from src.config import MARKET_CONFIG

# Configure Enterprise Logger
logging.basicConfig(level=logging.INFO, format='%(asctime)s - NEXUS DB ENGINE - %(levelname)s - %(message)s')
logger = logging.getLogger("NexusDBEngine")

INDEX_TICKER_MAP = {
    "SP500": "^GSPC", "NIFTY50": "^NSEI", "Nikkei225": "^N225", "FTSE100": "^FTSE",
    "DAX40": "^GDAXI", "BIST100": "XU100.IS", "Bovespa": "^BVSP", "IDX": "^JKSE",
    "TASI": "^TASI.SR", "SSE": "000001.SS"
}

class SQLDataPipeline:
    def __init__(self):
        self.db_path = os.path.join(PROJECT_ROOT, "data", "nexus_trading.db")
        if not os.path.exists(self.db_path):
            logger.error("SQL Database not found! Please run src/db_migration.py first.")
            sys.exit(1)

    def fetch_recent_data(self, ticker, start_date):
        """Fetches delta data from Yahoo Finance."""
        try:
            start_str = (start_date + timedelta(days=1)).strftime('%Y-%m-%d')
            today_str = datetime.now().strftime('%Y-%m-%d')
            
            if start_str >= today_str: return pd.DataFrame() 

            df = yf.download(ticker, start=start_str, end=today_str, progress=False)
            if df.empty: return pd.DataFrame()
                
            df = df.reset_index()
            df['Ticker'] = ticker
            df = df[['Date', 'Open', 'High', 'Low', 'Close', 'Volume', 'Ticker']]
            return df
        except Exception as e:
            logger.warning(f"Failed to fetch data for {ticker}: {e}")
            return pd.DataFrame()

    def update_market_sql(self, market_name, details):
        """Updates a specific country's market data directly in the SQL table."""
        idx_key = details["index_key"]
        logger.info(f"Scanning SQL Table for {market_name}...")
        
        with sqlite3.connect(self.db_path) as conn:
            # Get unique tickers for this market
            tickers_df = pd.read_sql(f"SELECT DISTINCT Ticker FROM market_data WHERE Market='{idx_key}'", conn)
            tickers = tickers_df['Ticker'].tolist()
            
            new_data_frames = []
            updated_count = 0

            for ticker in tickers:
                # Find the most recent date using pure SQL for max speed
                query = f"SELECT MAX(Date) as max_date FROM market_data WHERE Market='{idx_key}' AND Ticker='{ticker}'"
                date_df = pd.read_sql(query, conn)
                last_date_str = date_df.iloc[0]['max_date']
                
                if last_date_str:
                    last_date = pd.to_datetime(last_date_str)
                    new_data = self.fetch_recent_data(ticker, last_date)
                    
                    if not new_data.empty:
                        new_data['Market'] = idx_key # Inject the relational key
                        new_data_frames.append(new_data)
                        updated_count += 1
                        print(f"  + Synced {ticker} from {last_date.strftime('%Y-%m-%d')} to Today.")

            if new_data_frames:
                df_new = pd.concat(new_data_frames, ignore_index=True)
                df_new.to_sql("market_data", conn, if_exists="append", index=False)
                logger.info(f"✅ SUCCESS: DB updated with new data for {updated_count} assets in {idx_key}.")
            else:
                logger.info(f"⚡ {idx_key} is already fully synchronized to today's close.")

    def update_macro_indices_sql(self):
        """Updates the macro indices directly in the SQL table."""
        logger.info("Scanning Macro Indices in SQL...")
        with sqlite3.connect(self.db_path) as conn:
            new_data_frames = []
            
            for index_key, yf_ticker in INDEX_TICKER_MAP.items():
                query = f"SELECT MAX(Date) as max_date FROM macro_indices WHERE Index_Col='{index_key}'"
                # Handle edge case where column name might be "Index" or "Index_Col" based on pandas parsing
                try: date_df = pd.read_sql(f"SELECT MAX(Date) as max_date FROM macro_indices WHERE \"Index\"='{index_key}'", conn)
                except: date_df = pd.DataFrame([{'max_date': None}])

                last_date_str = date_df.iloc[0]['max_date']
                last_date = pd.to_datetime(last_date_str) if last_date_str else (datetime.now() - timedelta(days=730))
                
                new_data = self.fetch_recent_data(yf_ticker, last_date)
                
                if not new_data.empty:
                    new_data = new_data.rename(columns={'Ticker': 'Index'})
                    new_data['Index'] = index_key
                    new_data_frames.append(new_data)
                    print(f"  + Synced Macro Index {index_key} to Today.")

            if new_data_frames:
                df_new = pd.concat(new_data_frames, ignore_index=True)
                df_new.to_sql("macro_indices", conn, if_exists="append", index=False)
                logger.info("✅ SUCCESS: Macro Indices SQL updated.")
            else:
                logger.info("⚡ Macro Indices are already synchronized.")

    def run_full_pipeline(self):
        logger.info("INITIATING ENTERPRISE SQL DATA PIPELINE...")
        self.update_macro_indices_sql()
        for market_name, details in MARKET_CONFIG.items():
            self.update_market_sql(market_name, details)
        logger.info("PIPELINE COMPLETE. System ready for real-time AI Inference.")

if __name__ == "__main__":
    pipeline = SQLDataPipeline()
    pipeline.run_full_pipeline()