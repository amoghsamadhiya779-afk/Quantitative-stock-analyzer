const API_URL = normalizeApiUrl(process.env.NEXT_PUBLIC_API_URL || "https://1amogh212-quant-modeling.hf.space");

function normalizeApiUrl(url: string): string {
  return url.replace(/\/+$/, "");
}

async function apiFetch(path: string, init?: RequestInit): Promise<Response> {
  const res = await fetch(`${API_URL}${path}`, init);
  if (!res.ok) {
    let detail = res.statusText;
    try {
      const data = await res.json();
      detail = data?.detail || data?.message || detail;
    } catch {
      // Some failures return an empty or non-JSON response body.
    }
    throw new Error(`API request failed (${res.status}): ${detail}`);
  }
  return res;
}

export interface MarketInfo {
  index_key: string;
  stock_file: string;
  region: string;
  currency: string;
}

export interface StockData {
  ticker: string;
  market: string;
  currency: string;
  region: string;
  latest_close: number;
  prev_close: number;
  price_delta: number;
  pct_change: number;
  rsi: number;
  volatility: number;
  vwap: number;
  ma_20: number;
  ma_50: number;
  dates: string[];
  closes: number[];
  opens: number[];
  highs: number[];
  lows: number[];
  volumes: number[];
  bb_upper: number[];
  bb_lower: number[];
  macd: number[];
  signal_line: number[];
  rsi_series: number[];
}

export interface PredictionResult {
  ticker: string;
  latest_close: number;
  predicted_price: number;
  delta: number;
  pct_change: number;
  model_type: string;
  confidence: number;
}

export interface BacktestResult {
  dates: string[];
  strategy_equity: number[];
  buy_hold_equity: number[];
  total_return: number;
  bh_return: number;
  sharpe_ratio: number;
  max_drawdown: number;
  model_used: string;
}

export interface NewsItem {
  title: string;
  source: string;
  link: string;
  tag: string;
  color: string;
}

export async function fetchMarkets(): Promise<Record<string, MarketInfo>> {
  const res = await apiFetch("/api/v1/markets");
  const data = await res.json();
  return data.markets;
}

export async function fetchTickers(marketName: string): Promise<string[]> {
  const res = await apiFetch(`/api/v1/tickers/${encodeURIComponent(marketName)}`);
  const data = await res.json();
  return data.tickers;
}

export async function fetchStockData(marketName: string, ticker: string): Promise<StockData> {
  const res = await apiFetch(`/api/v1/stock/${encodeURIComponent(marketName)}/${encodeURIComponent(ticker)}`);
  return res.json();
}

export async function fetchPrediction(marketName: string, ticker: string, modelType: string = "CNN_BiLSTM_Attention"): Promise<PredictionResult> {
  const res = await apiFetch("/api/v1/predict", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ market_name: marketName, ticker, model_type: modelType }),
  });
  return res.json();
}

export async function fetchBacktest(marketName: string, ticker: string, modelType: string = "CNN_BiLSTM_Attention"): Promise<BacktestResult> {
  const res = await apiFetch("/api/v1/backtest", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ market_name: marketName, ticker, model_type: modelType }),
  });
  return res.json();
}

export async function fetchNews(ticker: string, market?: string): Promise<NewsItem[]> {
  const res = await fetch(`${API_URL}/api/v1/news`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ticker, market: market || "" }),
  });
  if (!res.ok) return [];
  const data = await res.json();
  return data.news || [];
}

export function getLogoUrl(ticker: string): string {
  const clean = ticker.split('.')[0].replace('^', '').toLowerCase();
  return `https://logo.clearbit.com/${clean}.com`;
}

export function getFallbackLogo(ticker: string): string {
  const clean = ticker.split('.')[0].replace('^', '');
  return `https://ui-avatars.com/api/?name=${clean}&background=0F172A&color=60A5FA&font-size=0.33&bold=true`;
}
