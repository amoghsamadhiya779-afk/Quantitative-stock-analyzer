---
title: Quantum Yield
emoji: 📈
colorFrom: blue
colorTo: indigo
sdk: docker
pinned: false
---

# Quantum Yield: Quantitative Research and MLOps Platform

Quantum Yield is a containerized, full-stack Machine Learning Operations (MLOps) platform designed for algorithmic capital allocation. It features a decoupled microservices architecture, linking a deep learning inference engine with a low-latency, immersive Next.js 14 user interface.

The platform demonstrates quantitative system design with a self-hydrating data pipeline, out-of-sample model evaluation, and WebGL-based visualization interfaces. Every price and statistic in the terminal is computed from real market data; when a source is unavailable the UI says so instead of filling the gap.

---

## Architectural Topography and Technical Innovations

### 1. Decoupled Microservice Topology
The platform segregates computational workload into two independent layers:
* **Analytical Backend (FastAPI)**: Runs high-performance inference loops over pre-trained Bidirectional LSTM models and executes VADER (Valence Aware Dictionary and Sentiment Reasoner) sentiment analysis.
* **Interactive Client (Next.js 14)**: A low-latency web application utilizing React Three Fiber, GSAP, and Framer Motion for high-fidelity interactive graphics.

### 2. Self-Hydrating Data Pipeline & Fault Tolerance
To mitigate issues with rate-limited data providers or offline states, the backend employs a hierarchical fallback pipeline:
1. **Local Relational Layer**: Queries local SQLite databases for indexed market history.
2. **Local Static Layer**: Cascades to compressed CSV datasets if the database is unpopulated.
3. **Cloud Hydration Layer**: Queries Yahoo Finance APIs to fetch live delta updates.
4. **Honest failure**: if no source has data for a ticker, the API returns an error and the UI shows an unavailable state rather than synthetic prices.

### 3. Machine Learning Subsystem
* **Neural Network Topology**: Bidirectional Long Short-Term Memory (BiLSTM) network.
* **Temporal Integration**: Processes a 60-day historical sequence window to capture complex momentum indicators and temporal correlations.
* **Context Retention**: Processes sequences in both forward and backward directions to extract deep structural features and mitigate vanishing gradient issues associated with standard recurrent networks.

---

## Quantitative Analytics & WebGL Visualization

### 1. Interactive 3D Globe Widget
Re-engineered using Three.js and React Three Fiber (R3F) to display real-time global node statuses:
* **Mesh Raycasting**: Leverages GPU-level raycasting to calculate pointer collisions directly on 3D meshes, enabling native hover state changes and node selection click events.
* **Physics-based Camera Damping**: Implements OrbitControls with inertia and friction parameters, allowing users to spin, rotate, and interact with the globe.
* **Visual Topography**: Includes a wireframe sphere, horizontal coordinate rings, and dual-axis rotating orbital rings representing analytical traffic.

### 2. Live Sentiment Engine (Google News RSS)
* **Feed Aggregation**: Backend utilizes Python's feedparser to capture Google News RSS headlines filtered dynamically by the active market node.
* **Natural Language Processing**: Computes compound polarity scores for headlines using VADER, classifying real-time geopolitical news into Bullish, Bearish, or Neutral sentiments.

### 3. Unified Comparative Commodities Graph
* **Baseline Normalization**: Displays S&P 500, NIFTY 50, Nikkei 225, FTSE 100, DAX 40, BIST 100, Bovespa, or IDX against Gold, Silver, and Crude Oil (WTI).
* **Formula**: Scales all series to a 100% baseline starting point:
  
  Normalized Value_t = ( Price_t / Price_0 ) * 100
  
* **Precision Rendering**: Prevents scale distortion between assets of widely differing nominal values, showing raw prices in local currencies only within custom HTML tooltip elements.

---

## Model Report Card

Daily stock returns are close to unpredictable, so a model is only interesting if it beats simple
baselines by more than luck would. `build_report_card.py` measures exactly that. For each market it runs
an expanding-window walk-forward and scores every model on the **same** out-of-sample bars:

| Baselines | Deep models (retrained per fold) |
| :--- | :--- |
| Random walk (zero forecast), historical mean, 20-day momentum, ridge regression, gradient boosting | CNN-BiLSTM-Attention, Transformer, BiLSTM |

Each forecast is tested twice:

* **As a forecast**: directional accuracy with a binomial test against a coin flip, out-of-sample R², and a
  Diebold-Mariano test against the random walk.
* **As the strategy the API serves** (same deadband, trend filter and transaction costs): Sharpe ratio with a
  block-bootstrap 95% confidence interval, return, drawdown, and the **Deflated Sharpe Ratio**, which
  corrects for having tried every model on the same data.

```bash
python build_report_card.py --baselines-only   # a few minutes
python build_report_card.py                    # all models; hours on a CPU
```

Results are written to `reports/REPORT_CARD.md` (readable on GitHub) and `reports/report_card.json`, which the
API serves at `GET /api/v1/report-card`. Data comes from `data/raw/` when present and otherwise from Yahoo Finance.

Leakage is tested rather than assumed: the test suite rewrites future prices and checks that no feature or
forecast before that point changes, and checks that the pipeline finds a planted edge in autocorrelated
synthetic returns and none in a random walk.

---

## Technical Stack

| Domain | Technology Components |
| :--- | :--- |
| **Quantitative ML** | TensorFlow, Keras, Scikit-Learn, Pandas, NumPy, Joblib |
| **Backend API Service** | FastAPI, Uvicorn, SQLite3, Feedparser, VADER Sentiment |
| **Interactive Frontend** | Next.js 14, React 18, React Three Fiber, Drei, Recharts, Framer Motion |
| **Infrastructure / DevOps** | Docker, Docker Compose, Hugging Face Spaces, Git |

---

## Project Directory Tree

```text
quantum-yield/
├── api/                            # Backend API Service
│   ├── main.py                     # FastAPI routes, RSS parsing, and ML inference
│   └── ...                         
├── src/                            # Machine Learning & Feature Engineering
│   ├── config.py                   # Market registry (single source of truth)
│   ├── feature_engineering.py      # Technical indicators (RSI, VWAP, Bollinger Bands)
│   ├── advanced_models.py          # CNN-BiLSTM-Attention, Transformer, BiLSTM
│   ├── strategy.py                 # Signal construction + backtest metrics (shared by API and validation)
│   ├── walkforward.py              # Walk-forward folds, data loading, baseline + deep forecasters
│   ├── significance.py             # DM test, bootstrap Sharpe CI, Probabilistic/Deflated Sharpe
│   ├── report_card.py              # Scores every model on every market, renders the report
│   └── optuna_optimizer.py         # Hyperparameter search
├── tests/                          # pytest suite (strategy, models, API smoke tests)
├── run_pipeline.py                 # Trains all three models for every market
├── validate_strategy.py            # Per-fold walk-forward view of one model
├── build_report_card.py            # Generates reports/report_card.json and REPORT_CARD.md
├── frontend/                       # Client web app
│   ├── src/
│   │   ├── app/                    # Next.js App Router pages and CSS
│   │   ├── components/             # Reusable UI features (TradingDesk, Backtesting)
│   │   └── lib/                    # API wrappers and client interfaces
│   ├── package.json                # Frontend package manifest
│   └── tsconfig.json               # TypeScript configuration
├── mlops_artifacts/                # Model Registry
│   └── models/                     # Saved weights (.keras) and scalers (.pkl), via Git LFS
├── Dockerfile                      # Hugging Face Spaces image (API + models)
├── Dockerfile.api                  # Backend container for docker-compose
├── Dockerfile.ui                   # Next.js frontend container
├── docker-compose.yml              # Runs API + frontend locally
├── requirements.txt                # API runtime dependencies
├── requirements-dev.txt            # + pytest, ruff
└── requirements-train.txt          # + optuna, for training
```

---

## Local Setup & Deployment

### 1. Backend API Server Setup
Create a virtual environment and install dependencies:
```bash
py -m venv venv
venv\Scripts\activate      # On Windows
source venv/bin/activate    # On Unix
git lfs pull                # fetch the trained models
pip install -r requirements-dev.txt
```
Run the FastAPI development server:
```bash
uvicorn api.main:app --reload --port 7860
```
The API Swagger documentation will be accessible at `http://localhost:7860/docs`.

### 2. Frontend Development Server Setup
Install Node.js packages and launch the Next.js dev server:
```bash
cd frontend
npm install
npm run dev
```
The platform interface will be accessible at `http://localhost:3000`.

### 3. Containerized Orchestration (Docker Compose)
Run the complete decoupled environment using Docker:
```bash
docker compose up --build -d
```
The API is served on `http://localhost:7860` and the UI on `http://localhost:3000`.

### 4. Tests and Lint
```bash
pytest            # strategy, model-architecture and API smoke tests
ruff check .
```
CI runs both on every pull request, plus a TypeScript check and production build of the frontend.

---

## Production Cloud Deployment

The platform is designed to be deployed using a fully decoupled cloud strategy:

### 1. Backend Deployment (Hugging Face Spaces)
Hugging Face Spaces provides a free container hosting environment suitable for python analytical services:
1. Create a new Space on [Hugging Face](https://huggingface.co/) and select **Docker** as the SDK (with the Blank template).
2. The root `Dockerfile` builds the FastAPI service on port 7860 with the trained models baked in.
3. Commit and push the repository to your Hugging Face Space git remote. Hugging Face will build the container and serve the API.

### 2. Frontend Deployment (Vercel)
Vercel is the recommended hosting platform for Next.js 14 frontend clients:
1. Import your GitHub repository into [Vercel](https://vercel.com/).
2. Set the **Root Directory** to `frontend`.
3. Configure the environment variable:
   * `NEXT_PUBLIC_API_URL`: The URL of your Hugging Face Space API (currently `https://1amogh212-quant-modeling.hf.space`).
4. Click **Deploy**. Vercel will build the Next.js static and edge routines and serve the UI.

The API allows local frontend origins by default and matches Vercel preview/production domains with `FRONTEND_ORIGIN_REGEX`. For a custom frontend domain, set `FRONTEND_ORIGINS` on the API host to a comma-separated list of exact origins.

---

## Financial and Academic Disclaimer

Quantum Yield is a technical demonstration of Machine Learning Operations (MLOps), data pipelines, and high-density interface design. It is not financial advice. The models, Monte Carlo simulations, and order book matrices are simulations intended for educational and research demonstration purposes. Past performance is not indicative of future results.
