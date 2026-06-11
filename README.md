# Quantum Yield: Enterprise MLOps Trading OS and Quantitative Analytics Platform

Quantum Yield is a containerized, full-stack Machine Learning Operations (MLOps) platform designed for algorithmic capital allocation. It features a decoupled microservices architecture, linking a deep learning inference engine with a low-latency, immersive Next.js 14 user interface.

The platform demonstrates robust quantitative system design, utilizing a self-hydrating data pipeline, synthetic data circuit breakers, and WebGL-based visualization interfaces.

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
4. **Synthetic Circuit Breakers**: Generates mathematically consistent synthetic price series using geometric Brownian motion paths to ensure the system remains operational under network isolation.

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
│   ├── config.py                   # Market configurations and parameters
│   ├── feature_engineering.py      # Technical indicators (RSI, VWAP, Bollinger Bands)
│   ├── data_ingestion.py           # SQL DB loader
│   ├── model.py                    # BiLSTM architecture
│   └── train.py                    # Neural network training loop
├── frontend/                       # Client web app
│   ├── src/
│   │   ├── app/                    # Next.js App Router pages and CSS
│   │   ├── components/             # Reusable UI features (TradingDesk, Backtesting)
│   │   └── lib/                    # API wrappers and client interfaces
│   ├── package.json                # Frontend package manifest
│   └── tsconfig.json               # TypeScript configuration
├── mlops_artifacts/                # Model Registry
│   └── models/                     # Saved weights (.h5) and scalers (.pkl)
├── Dockerfile.api                  # Backend container configuration
├── Dockerfile.ui                   # Frontend container configuration
├── docker-compose.yml              # Multi-container orchestrator
└── requirements.txt                # Backend dependencies manifest
```

---

## Local Setup & Deployment

### 1. Backend API Server Setup
Create a virtual environment and install dependencies:
```bash
python -m venv venv
venv\Scripts\activate      # On Windows
source venv/bin/activate    # On Unix
pip install -r requirements.txt
```
Run the FastAPI development server:
```bash
python api/main.py
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
docker-compose up --build -d
```

---

## Production Cloud Deployment

The platform is designed to be deployed using a fully decoupled cloud strategy:

### 1. Backend Deployment (Hugging Face Spaces)
Hugging Face Spaces provides a free container hosting environment suitable for python analytical services:
1. Create a new Space on [Hugging Face](https://huggingface.co/) and select **Docker** as the SDK (with the Blank template).
2. Copy `Dockerfile.hf` to `Dockerfile` to configure the container to run the FastAPI analytical endpoint on port 7860:
   ```bash
   cp Dockerfile.hf Dockerfile
   ```
3. Commit and push the repository to your Hugging Face Space git remote. Hugging Face will build the container and serve the API.

### 2. Frontend Deployment (Vercel)
Vercel is the recommended hosting platform for Next.js 14 frontend clients:
1. Import your GitHub repository into [Vercel](https://vercel.com/).
2. Set the **Root Directory** to `frontend`.
3. Configure the environment variable:
   * `NEXT_PUBLIC_API_URL`: The URL of your Hugging Face Space API (e.g., `https://amoghsamadhiya779-afk-quantum-yield-api.hf.space`).
4. Click **Deploy**. Vercel will build the Next.js static and edge routines and serve the UI.

---

## Financial and Academic Disclaimer

Quantum Yield is a technical demonstration of Machine Learning Operations (MLOps), data pipelines, and high-density interface design. It is not financial advice. The models, Monte Carlo simulations, and order book matrices are simulations intended for educational and research demonstration purposes. Past performance is not indicative of future results.
