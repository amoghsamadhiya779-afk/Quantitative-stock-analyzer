QUANTUM YIELD | Algorithmic OS 🌐📈

Quantum Yield is an enterprise-grade, full-stack Machine Learning Operations (MLOps) platform designed for algorithmic capital allocation and quantitative trading. It bridges the gap between deep learning predictive models and a sleek, institutional frontend interface.

Built with an architecture that mimics high-frequency trading desks, Quantum Yield ingests global market data, processes technical indicators in real-time, infers future price action via Bidirectional LSTM Neural Networks, and visualizes the insights through a dynamic, themeable command center.

🚀 Key Features

🧠 Advanced MLOps Pipeline

Multi-Market Data Ingestion: Synchronizes historical and live data from 8 global indices (S&P 500, NIKKEI 225, DAX 40, NIFTY 50, FTSE 100, BIST 100, Bovespa, IDX).

Dynamic Feature Engineering: Automatically computes institutional indicators (VWAP, MACD, Bollinger Bands, Annualized Volatility, RSI, etc.).

Deep Learning Prediction: Utilizes robust Bidirectional LSTMs (TensorFlow/Keras) to forecast (T+1) asset prices.

Automated Retraining (Cron): Designed to autonomously retrain models via cloud triggers post-market close.

💻 Institutional Frontend (Streamlit)

Theme Engine: Instantly switch between premium design languages:

🍏 Apple Light (Cupertino) & Apple Dark (Pro) (Glassmorphism & SF Pro fonts)

⚡ Tesla (Cyber Dark) (Matte gradients & Montserrat/Roboto)

📝 Anthropic (Parchment) (Warm document-centric styling with jiggling dynamic backdrops)

Liquid Metal Navigation: Fluid, physics-based UI transitions.

Macro & Risk Engine: Calculates real-time Sharpe Ratios, Value at Risk (VaR - 95%), and 100-path Stochastic Monte Carlo simulations.

Backtesting Simulator: Vectorized 1-year historical trading simulations to benchmark AI performance against Buy & Hold strategies.

Smart Execution Router: A simulated L2 Order Book with dynamic liquidity depth and order flow imbalance gauges.

⚙️ Scalable Backend (FastAPI)

Decoupled Architecture: The UI communicates with a standalone Python FastAPI server for inference and NLP processing.

Live NLP Sentiment: Scrapes and scores live financial news using VADER NLP to gauge market sentiment dynamically.

📂 Project Architecture

quantum-yield-os/
│
├── api/                          # Backend Server
│   └── main.py                   # FastAPI inference and NLP endpoints
│
├── configs/                      # Pipeline configuration
│   ├── default_config.yaml       
│   └── prod_config.yaml          
│
├── data/                         # Database and Raw CSV storage
│   ├── raw/                      # yfinance historical dumps
│   └── nexus_trading.db          # Unified SQLite Database
│
├── mlops_artifacts/              # Generated AI Assets
│   ├── logs/                     # Training telemetry
│   ├── models/                   # .h5 Neural Networks & .pkl Scalers
│   └── plots/                    # EDA visualizations
│
├── src/                          # Core Engine Modules
│   ├── config.py                 # Registry for global nodes
│   ├── data_ingestion.py         # Local & Cloud data synchronizer
│   ├── data_pipeline.py          # SQL Database updater
│   ├── db_migration.py           # CSV to SQLite migrator
│   ├── evaluate.py               # Model benchmarking logic
│   ├── feature_engineering.py    # Math/Indicator engine
│   ├── model.py                  # BiLSTM architecture
│   ├── preprocessing.py          # Tensor scaling and sequencing
│   └── train.py                  # Keras training loop & callbacks
│
├── app.py                        # The main Streamlit Frontend Terminal
├── deploy_to_cloud.py            # Automated Cloud Deployment Orchestrator
├── run_pipeline.py               # Master MLOps training orchestrator
├── train_models.py               # Specialized multi-market training script
├── docker-compose.yml            # Container orchestration
├── Dockerfile.api                # Backend container config
├── Dockerfile.ui                 # Frontend container config
└── requirements.txt              # Dependency list


🛠️ Installation & Setup (Local Development)

1. Prerequisites

Ensure you have Python 3.9+ and Docker installed on your machine.

2. Clone and Initialize

git clone [https://github.com/yourusername/quantum-yield-os.git](https://github.com/yourusername/quantum-yield-os.git)
cd quantum-yield-os

# Create a virtual environment
python -m venv venv

# Activate (Windows)
venv\Scripts\activate
# Activate (Mac/Linux)
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt


3. Build the Brain (Data & Models)

Before running the UI, you need to populate the database and train the Neural Networks.

# Migrate sample CSVs into the SQL Database
python src/db_migration.py

# Train the BiLSTM models for all markets (This will take a few minutes)
python train_models.py


4. Launch the Platform

Quantum Yield requires two concurrent terminal sessions to run locally.

Terminal 1 (Start the Backend Engine):

uvicorn api.main:app --reload


Terminal 2 (Start the Frontend Terminal):

streamlit run app.py


The UI will automatically open in your browser at http://localhost:8501.

☁️ Docker & Cloud Deployment

To deploy the entire stack using containerization:

Local Docker Testing

docker-compose up --build -d


This will spin up both the nexus-api and nexus-ui containers in a bridged network.

Cloud Production

Use the included automation script to simulate or execute a push to a cloud provider (e.g., AWS EC2, Render, DigitalOcean).

python deploy_to_cloud.py


Note: This script outlines the standard DevOps procedure for tagging images, pushing to a registry, and setting up Cron jobs for automated post-market retraining.

⚠️ Disclaimer

Quantum Yield is a sophisticated demonstration of MLOps, Data Engineering, and UI/UX design. It is not financial advice. The models and L2 order books provided in this repository are simulations intended for educational and portfolio purposes. Do not use this software to route real capital without extensive validation and integration with a certified brokerage API.