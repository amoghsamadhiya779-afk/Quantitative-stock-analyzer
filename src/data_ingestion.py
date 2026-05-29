import pandas as pd
import logging
import os

logger = logging.getLogger("SP500_MLOps")

class DataIngestion:
    def __init__(self, data_path):
        self.data_path = data_path

    def fetch_data(self):
        logger.info(f"Loading local dataset from: {self.data_path}...")
        
        if not os.path.exists(self.data_path):
            raise FileNotFoundError(f"Could not find the dataset at {self.data_path}. Please ensure it is placed in the data/raw/ folder.")
            
        # Read the CSV. Assuming it has a 'Date' column.
        # parse_dates=True and index_col ensures the date becomes the index (required for time series)
        try:
            data = pd.read_csv(self.data_path, parse_dates=['Date'], index_col='Date')
        except ValueError:
            # Fallback in case the date column is named differently (e.g., 'date' lowercase)
            logger.warning("Could not find 'Date' column. Attempting to parse the first column as Date index.")
            data = pd.read_csv(self.data_path, index_col=0, parse_dates=True)
            
        # Drop any empty rows
        data.dropna(inplace=True)
        logger.info(f"Data loaded successfully! Shape: {data.shape}")
        
        return data