🌐 Quantum Yield | Enterprise MLOps Trading OS

Quantum Yield is a containerized, full-stack Machine Learning Operations (MLOps) platform designed for algorithmic capital allocation. It bridges the gap between deep learning predictive models and a high-density, institutional-grade frontend interface.

By decoupling the ML inference engine from the user interface and utilizing a "self-hydrating" data pipeline, this project demonstrates production-ready system design, fault tolerance, and advanced UI state management.

🚀 System Architecture & Key Innovations

1. Decoupled Microservices

Backend (FastAPI): A high-performance inference engine serving predictions from a Bidirectional LSTM Neural Network and live NLP sentiment analysis via VADER.

Frontend (Streamlit): A low-latency UI boasting a custom CSS/WebKit engine that overrides native browser dark-mode hijacking to deliver pixel-perfect themes (Apple Cupertino, Tesla Cyber Dark, Anthropic Parchment).

2. The "Self-Hydrating" Data Pipeline & Circuit Breakers

Cloud deployments often fail due to massive static datasets (Git limits) or rate-limited APIs.

The Solution: Quantum Yield uses a layered fallback architecture. It attempts to read from a local SQLite DB -> falls back to local CSVs -> falls back to live cloud fetching via yfinance -> and utilizes Synthetic Data Circuit Breakers (generating mathematically safe OHLCV data on the fly) to guarantee the application never crashes, even during total API outages.

3. Deep Learning Engine

Model: Bidirectional Long Short-Term Memory (BiLSTM).

Why BiLSTM? Standard RNNs suffer from vanishing gradients. LSTMs solve this using memory cell gates, retaining temporal context (e.g., 20-day moving averages). BiLSTMs process these sequences in both directions, capturing both past context and future sequence structures to predict T+1 asset prices effectively.

💻 Core Features

Global Node Sync: Real-time data and inference for 8 global indices including the S&P 500, NIKKEI 225, and DAX 40.

Quantitative Risk Engine: Calculates real-time Sharpe Ratios, 95% Value at Risk (VaR), and generates 100-path stochastic Monte Carlo projections.

Deep Technical Suite: Dynamic Plotly engines rendering Candlesticks, Bollinger Bands, Volume Density, and MACD Momentum Oscillators.

Smart Execution Router (L2 Trading Desk): Simulated order book matrix tracking Bid/Ask liquidity depth and algorithmic order routing (TWAP/VWAP/Iceberg).

🛠️ Tech Stack

ML / Data Science: TensorFlow, Keras, Scikit-Learn, Pandas, Numpy.

Backend / API: FastAPI, Uvicorn, SQLite, VADER Sentiment.

Frontend: Streamlit, Plotly, Custom WebKit CSS.

DevOps: Docker, Docker Compose, AWS EC2, GitHub Actions.

⚙️ Quick Start (Dockerized Deployment)

The fastest way to run Quantum Yield locally is via Docker. This ensures the environment exactly matches production, avoiding cross-platform dependency conflicts (e.g., TensorFlow compilation errors on newer Python versions).

Prerequisites

Docker & Docker Compose installed.

Git.

Installation

Clone the repository:

git clone [https://github.com/yourusername/nexus-fs.git](https://github.com/yourusername/nexus-fs.git)
cd nexus-fs


Boot the decoupled environment:

docker-compose -f docker-compose.yml up --build -d


Access the Platform:

Terminal UI: http://localhost:8501

FastAPI Docs (Swagger): http://localhost:8000/docs

📂 Project Structure

quantum-yield/
│
├── api/                          # Backend API Engine
│   └── main.py                   # FastAPI routing and ML Inference endpoints
│
├── src/                          # Core Machine Learning Modules
│   ├── config.py                 # Hyperparameters and Global Registries
│   ├── data_pipeline.py          # SQL Database synchronizer
│   ├── feature_engineering.py    # Generates VWAP, RSI, MACD, etc.
│   ├── model.py                  # BiLSTM Architecture definition
│   └── train.py                  # Model training loop & callbacks
│
├── mlops_artifacts/              # Model Registry
│   └── models/                   # Serialized .h5 models and .pkl scalers
│
├── app.py                        # Streamlit Frontend Terminal
├── docker-compose.yml            # Multi-container orchestration
├── Dockerfile.api                # Backend container configuration
├── Dockerfile.ui                 # Frontend container configuration
└── requirements.txt              # Strict dependency lockfile


⚠️ Disclaimer

Quantum Yield is a sophisticated demonstration of MLOps, Data Engineering, and UI/UX System Design. It is not financial advice. The ML models, Monte Carlo simulations, and L2 order books are simulations intended for educational and portfolio demonstration purposes.
