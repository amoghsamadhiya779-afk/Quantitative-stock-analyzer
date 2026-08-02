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

export interface WatchlistItem {
  ticker: string;
  price: number;
  pct_change: number;
  volume: number;
}

export interface CorrelationMatrix {
  tickers: string[];
  matrix: number[][];
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

export async function fetchWatchlist(marketName: string): Promise<WatchlistItem[]> {
  try {
    const res = await apiFetch(`/api/v1/watchlist/${encodeURIComponent(marketName)}`);
    const data = await res.json();
    return data.watchlist || [];
  } catch (e) {
    console.error("Failed to fetch watchlist", e);
    return [];
  }
}

export async function fetchCorrelationMatrix(marketName: string): Promise<CorrelationMatrix | null> {
  try {
    const res = await apiFetch(`/api/v1/correlation/${encodeURIComponent(marketName)}`);
    const data = await res.json();
    return data;
  } catch (e) {
    console.error("Failed to fetch correlation matrix", e);
    return null;
  }
}

// Local files for tickers we ship a bundled asset for.
const LOCAL_LOGO_TICKERS: Record<string, string> = {
  aapl: 'aapl_logo', msft: 'msft_logo', amzn: 'amzn_logo', nvda: 'nvda_logo', meta: 'meta_logo',
  reliance: 'reliance_logo', tcs: 'tcs_logo', hdfcbank: 'hdfc_logo', infy: 'infy_logo',
  sbi: 'sbin_logo', sbin: 'sbin_logo', bhartiartl: 'airtel_logo',
};

// Clearbit's Logo API serves each company's actual logo from their real domain - we never
// generate or store a copy of the artwork ourselves, only tell Clearbit which domain to
// look up. Its default guess is `{ticker}.com`, which only works for a handful of US
// names; every other market's ticker doesn't map to a domain by simple concatenation, so
// without this table those requests 404 and fall through to the generic placeholder.
// Domains below are each company's own public corporate site.
const CLEARBIT_DOMAIN_OVERRIDES: Record<string, string> = {
  // US
  googl: 'google.com', 'brk-b': 'berkshirehathaway.com', jpm: 'jpmorganchase.com', v: 'visa.com',
  // India (NIFTY 50)
  icicibank: 'icicibank.com', hindunilvr: 'hul.co.in', itc: 'itcportal.com',
  bhartiartl: 'airtel.in', ltim: 'ltimindtree.com',
  // Japan (Nikkei 225)
  '7203': 'toyota.com', '6758': 'sony.com', '9984': 'softbank.jp', '6861': 'keyence.com',
  '8035': 'tel.com', '6501': 'hitachi.com', '4502': 'takeda.com', '6098': 'recruit-holdings.com',
  '9432': 'ntt.com', '4063': 'shinetsu.co.jp',
  // UK (FTSE 100)
  shel: 'shell.com', azn: 'astrazeneca.com', hsba: 'hsbc.com', ulvr: 'unilever.com',
  gsk: 'gsk.com', dge: 'diageo.com', bats: 'bat.com', rio: 'riotinto.com', lloy: 'lloydsbankinggroup.com',
  // Germany (DAX 40)
  sie: 'siemens.com', alv: 'allianz.com', dte: 'telekom.com', bas: 'basf.com', bayn: 'bayer.com',
  mbg: 'mercedes-benz.com', vow3: 'volkswagen.com', dpw: 'dpdhl.com',
  // Turkey (BIST 100)
  thyao: 'turkishairlines.com', eregl: 'erdemir.com.tr', asels: 'aselsan.com.tr',
  tuprs: 'tupras.com.tr', akbnk: 'akbank.com', garan: 'garantibbva.com.tr',
  kchol: 'koc.com.tr', sahol: 'sabanci.com', ykbnk: 'yapikredi.com.tr', bimas: 'bim.com.tr',
  // Brazil (Bovespa)
  vale3: 'vale.com', petr4: 'petrobras.com.br', itub4: 'itau.com.br', bbdc4: 'banco.bradesco',
  abev3: 'ambev.com.br', bbas3: 'bb.com.br', b3sa3: 'b3.com.br', wege3: 'weg.net',
  itsas: 'itausa.com.br', ggbr4: 'gerdau.com',
  // Indonesia (IDX)
  bbca: 'bca.co.id', bbri: 'bri.co.id', bmri: 'bankmandiri.co.id', tlkm: 'telkom.co.id',
  byan: 'bayanresources.com', asii: 'astra.co.id', tpia: 'chandra-asri.com',
  bbni: 'bni.co.id', unvr: 'unilever.co.id', goto: 'gotocompany.com',
};

export function getLogoUrl(ticker: string): string {
  const clean = ticker.split('.')[0].replace('^', '').toLowerCase();

  // Served locally from public/assets - Vercel ships these as static files, so this
  // avoids an external network round trip (previously streamed from GitHub's LFS media
  // server on every logo render, uncached and unoptimized).
  if (LOCAL_LOGO_TICKERS[clean]) return `/assets/${LOCAL_LOGO_TICKERS[clean]}.png`;

  // Clearbit serves the real logo from the real company domain; if it 404s the
  // frontend's onError handler catches it and calls getFallbackLogo.
  const domain = CLEARBIT_DOMAIN_OVERRIDES[clean] || `${clean}.com`;
  return `https://logo.clearbit.com/${domain}`;
}

export function getFallbackLogo(ticker: string): string {
  return '/assets/generic_logo.png';
}
