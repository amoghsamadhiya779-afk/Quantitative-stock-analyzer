import os
import sys
import sqlite3
import pandas as pd

# 1. Force Python to recognize the project root directory first
PROJECT_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
if PROJECT_ROOT not in sys.path:
    sys.path.insert(0, PROJECT_ROOT)

# Now this import will work flawlessly
from src.config import MARKET_CONFIG

def migrate_csv_to_sqlite():
    # 2. Use Absolute Paths so it never loses track of the data folder
    db_path = os.path.join(PROJECT_ROOT, "data", "nexus_trading.db")
    print(f"🚀 Initializing Enterprise SQL Database at: {db_path}")
    
    with sqlite3.connect(db_path) as conn:
        # Migrate Macro Indices
        index_file = os.path.join(PROJECT_ROOT, "data", "raw", "Index_Levels.csv")
        if os.path.exists(index_file):
            print(f"📊 Migrating Macro Indices...")
            df_index = pd.read_csv(index_file)
            df_index.to_sql("macro_indices", conn, if_exists="replace", index=False)
            print(f"   ✅ Inserted {len(df_index)} index records.")
            
        # Migrate Market Data into Unified Table
        for market_name, details in MARKET_CONFIG.items():
            idx_key = details["index_key"]
            file_path = os.path.join(PROJECT_ROOT, "data", "raw", details["stock_file"])
            
            if os.path.exists(file_path):
                print(f"📈 Migrating Market: {idx_key}...")
                df_market = pd.read_csv(file_path)
                df_market['Market'] = idx_key # Inject the relational Market identifier
                
                # Append to the massive unified table
                df_market.to_sql("market_data", conn, if_exists="append", index=False)
                print(f"   ✅ Inserted {len(df_market)} records for {idx_key}.")
            else:
                print(f"   ❌ Missing CSV for {idx_key}, skipping.")
                
        # Create Indexes for High-Speed Querying
        print("\n⚡ Building SQL Indexes for millisecond query performance...")
        cursor = conn.cursor()
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_market_ticker ON market_data(Market, Ticker);")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_date ON market_data(Date);")
        
        
    print("\n🎉 MIGRATION COMPLETE! The Nexus system is now running on a Relational Database.")

if __name__ == "__main__":
    migrate_csv_to_sqlite()