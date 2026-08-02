import os
class PipelineConfig:
    """ Enterprise Configuration & Registry
    """
    SEQ_LENGTH = 60
    TEST_SIZE =0.5
    VAL_SIZE =0.2
    EPOCHS=100
    BATCH_SIZE=40
    LEARNING_RATE=0.003

    ARTIFACTS_DIR ="mlops_artifacts"
    PLOT_DIR = os.path.join(ARTIFACTS_DIR,"plots")
    MODEL_DIR = os.path.join(ARTIFACTS_DIR,"models")
    LOG_DIR = os.path.join(ARTIFACTS_DIR,"logs")

    @classmethod 
    def setup_directories(cls):
         for directory in [cls.PLOT_DIR,cls.MODEL_DIR,cls.LOG_DIR]:
              os.makedirs(directory,exist_ok=True)
    @classmethod 
    def get_data_path(cls,index_key="SP500"):
         model_path= os.path.join(cls.MODEL_DIR,f"best{index_key}_model.h5")
         scaler_path = os.path.join(cls.MODEL_DIR,f"{index_key}_feature_scaler.pkl")
         return model_path,scaler_path
        
# Global Single Source of Truth for Data Mapping

MARKET_CONFIG ={
     "United States (S&P 500)":{"index_key": "SP500","stock_file":"SP500_DATASET.csv","lat":40.71,"lon":-74.00,"region":"North America","currency":"USD"},
     "India (NIFTY 50)":{"index_key":"NIFTY50","stock_file":"NIFTY50_India.csv","lat":19.07,"lon":72.87,"region":"Asia","currency":"INR"},
     "Japan (Nikkei 225)": {"index_key": "Nikkei225", "stock_file": "Nikkei225_Japan.csv", "lat": 35.68, "lon": 139.69, "region": "Asia", "currency": "JPY"},
    "United Kingdom (FTSE 100)": {"index_key": "FTSE100", "stock_file": "FTSE100_UK.csv", "lat": 51.50, "lon": -0.12, "region": "Europe", "currency": "GBP"},
    "Germany (DAX 40)": {"index_key": "DAX40", "stock_file": "DAX40_Germany.csv", "lat": 50.11, "lon": 8.68, "region": "Europe", "currency": "EUR"},
    "Turkey (BIST 100)": {"index_key": "BIST100", "stock_file": "BIST100_Turkey.csv", "lat": 41.00, "lon": 28.97, "region": "Europe/Asia", "currency": "TRY"},
    "Brazil (Bovespa)": {"index_key": "Bovespa", "stock_file": "Bovespa_Brazil.csv", "lat": -23.55, "lon": -46.63, "region": "South America", "currency": "BRL"},
    "Indonesia (IDX)": {"index_key": "IDX", "stock_file": "IDX_Indonesia.csv", "lat": -6.20, "lon": 106.81, "region": "Asia", "currency": "IDR"},
    " China (SSE)": {"index_key": "SSE", "stock_file": "SSE_China.csv", "lat": 39.90, "lon": 116.40, "region": "Asia", "currency": "CNY"},
    "Saudi Arabia (Tadawul)": {"index_key": "Tadawul", "stock_file": "Tadawul_SaudiArabia.csv", "lat": 23.63, "lon": 46.71, "region": "Asia", "currency": "SAR"}


 }
