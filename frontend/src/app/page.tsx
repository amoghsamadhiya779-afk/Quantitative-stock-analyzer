"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

import MarketDataIngestion from "@/components/workflows/MarketDataIngestion";
import TechnicalIndicators from "@/components/workflows/TechnicalIndicators";
import MLPrediction from "@/components/workflows/MLPrediction";
import PortfolioOptimization from "@/components/workflows/PortfolioOptimization";
import RiskAnalytics from "@/components/workflows/RiskAnalytics";
import Backtesting from "@/components/workflows/Backtesting";

import CommoditiesBar from "@/components/ui/CommoditiesBar";
import CustomSelect from "@/components/ui/CustomSelect";
import WatchlistPanel from "@/components/ui/WatchlistPanel";

import {
  fetchMarkets,
  fetchTickers,
  fetchStockData,
  fetchPrediction,
  getLogoUrl,
  getFallbackLogo,
  type MarketInfo,
  type StockData,
  type PredictionResult,
} from "@/lib/api";

const pages = [
  "Market data ingestion",
  "Technical indicators",
  "ML prediction",
  "Portfolio optimization",
  "Risk analytics",
  "Backtesting",
];

const ALGO_MAP: Record<string, string> = {
  "Quantum CNN-Attention Engine (Max Yield)": "CNN_BiLSTM_Attention",
  "Temporal Transformer Model (Robust)": "TimeSeriesTransformer",
  "Advanced BiLSTM Layer (Balanced)": "AdvancedBiLSTM"
};

const algos = Object.keys(ALGO_MAP);

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.15,
      delayChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 40 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 1.2, ease: [0.16, 1, 0.3, 1] }, // Ultra-smooth easeOutExpo
  },
};

export default function Home() {
  const [activePage, setActivePage] = useState(pages[0]);

  // Backend-driven state
  const [markets, setMarkets] = useState<Record<string, MarketInfo>>({});
  const [marketNames, setMarketNames] = useState<string[]>([]);
  const [selectedMarket, setSelectedMarket] = useState("");
  const [tickers, setTickers] = useState<string[]>([]);
  const [selectedTicker, setSelectedTicker] = useState("");
  const [selectedAlgo, setSelectedAlgo] = useState(algos[0]);
  const [stockData, setStockData] = useState<StockData | null>(null);
  const [prediction, setPrediction] = useState<PredictionResult | null>(null);
  const [allPredictions, setAllPredictions] = useState<PredictionResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [logoError, setLogoError] = useState(false);

  // API Loaders
  useEffect(() => {
    fetchMarkets()
      .then((m) => {
        setMarkets(m);
        const names = Object.keys(m);
        setMarketNames(names);
        if (names.length > 0) setSelectedMarket(names[0]);
      })
      .catch(() => {
        const fallback: Record<string, MarketInfo> = {
          "United States (S&P 500)": { index_key: "SP500", stock_file: "SP500_DATASET.csv", region: "North America", currency: "USD" },
        };
        setMarkets(fallback);
        setMarketNames(Object.keys(fallback));
        setSelectedMarket("United States (S&P 500)");
      });
  }, []);

  useEffect(() => {
    if (!selectedMarket) return;
    setLoading(true);
    setSelectedTicker("");
    setStockData(null);
    let active = true;
    fetchTickers(selectedMarket)
      .then((t) => {
        if (!active) return;
        setTickers(t);
        if (t.length > 0) setSelectedTicker(t[0]);
      })
      .catch(() => {
        if (!active) return;
        setTickers([]);
      })
      .finally(() => {
        if (!active) return;
        setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [selectedMarket]);

  useEffect(() => {
    if (!selectedMarket || !selectedTicker) return;
    setLoading(true);
    setLogoError(false);

    let active = true;

    const fetchData = () => {
      const algoKeys = Object.values(ALGO_MAP);
      Promise.all([
        fetchStockData(selectedMarket, selectedTicker).catch(() => null),
        fetchPrediction(selectedMarket, selectedTicker, ALGO_MAP[selectedAlgo]).catch(() => null),
        ...algoKeys.map(algo => fetchPrediction(selectedMarket, selectedTicker, algo).catch(() => null))
      ]).then(([sd, primaryPr, ...allPrs]) => {
        if (!active) return;
        if (sd) setStockData(sd as any);
        if (primaryPr) setPrediction(primaryPr as any);
        const validPrs = allPrs.filter(Boolean) as PredictionResult[];
        if (validPrs.length > 0) setAllPredictions(validPrs);
        setLoading(false);
      });
    };

    fetchData();
    const interval = setInterval(fetchData, 15000);
    return () => {
      active = false;
      clearInterval(interval);
    };
  }, [selectedMarket, selectedTicker, selectedAlgo]);

  const market = markets[selectedMarket];
  const currency = market?.currency || "USD";
  const region = market?.region || "Global";
  const pctChange = (stockData && typeof stockData.pct_change === "number" && !isNaN(stockData.pct_change)) ? stockData.pct_change : 0;
  const latestClose = (stockData && typeof stockData.latest_close === "number" && !isNaN(stockData.latest_close)) ? stockData.latest_close : 0;
  const volatility = (stockData && typeof stockData.volatility === "number" && !isNaN(stockData.volatility)) ? stockData.volatility : 0;
  const vwap = (stockData && typeof stockData.vwap === "number" && !isNaN(stockData.vwap)) ? stockData.vwap : 0;
  const imbalance = stockData ? Math.min(85, Math.max(30, 50 + (pctChange * 10))) : 50;

  return (
    <main className="min-h-screen relative w-full flex flex-col font-sans bg-luxury-black text-foreground transition-colors duration-500 overflow-x-hidden bg-luxury-radial">
      
      {/* Sticky Blurred Header Bar */}
      <header className="sticky top-0 z-50 backdrop-blur-md bg-black/60 border-b border-white/10 w-full transform-gpu">
        <div className="max-w-[1200px] mx-auto px-4 md:px-8 py-4 flex justify-between items-center">
          {/* Logo & Name */}
          <div className="flex items-center gap-3">
            <img src="/quantum_yield_logo.png" alt="Quantum Yield Logo" className="w-8 h-8 rounded-full border border-white/10" />
            <div>
              <h1 className="font-display text-sm font-bold tracking-tighter text-white">NEXUS QUANT</h1>
            </div>
          </div>
          {/* Navigation Links */}
          <nav className="flex items-center gap-4 md:gap-8">
            {["Platform", "Research", "Technology", "Documentation", "GitHub"].map((link) => (
              <a
                key={link}
                href={`#${link.toLowerCase()}`}
                className="text-[10px] md:text-xs uppercase tracking-widest text-neutral-400 hover:text-white transition-colors duration-200"
              >
                {link}
              </a>
            ))}
            <a
              href="#launch-terminal"
              className="px-3.5 py-1.5 rounded-full bg-white text-black text-[10px] md:text-xs font-semibold uppercase tracking-wider hover:bg-neutral-200 transition-all duration-200"
            >
              Launch Terminal
            </a>
          </nav>
        </div>
      </header>

      <motion.div 
        variants={containerVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-100px" }}
        className="w-full max-w-[1200px] mx-auto px-4 md:px-8 lg:px-12 py-12 md:py-16 z-10 flex flex-col gap-8 md:gap-12 relative"
      >
        {/* Massive Hero Section */}
        <motion.div id="research" variants={itemVariants} className="max-w-4xl transform-gpu">
          <h2 className="font-display text-5xl md:text-[66px] font-semibold text-white leading-tight mb-6 tracking-tight">
            Institutional Quantitative Intelligence
          </h2>
          <p className="text-body-lg text-neutral-400 max-w-2xl leading-relaxed">
            Nexus Quant synthesizes global macroeconomic data, real-time liquidity flow, and state-of-the-art neural networks into a singular, highly responsive interface.
          </p>
        </motion.div>

        {/* Integration Marquee */}
        <motion.div variants={itemVariants} className="w-full overflow-hidden py-6 border-y border-white/10 bg-black/40 backdrop-blur-md rounded-[24px] transform-gpu">
          <div className="flex w-max animate-marquee">
            <div className="flex gap-16 px-8 text-xs font-mono tracking-widest text-neutral-400 uppercase">
              {["Yahoo Finance", "Polygon", "Finnhub", "Alpha Vantage", "NASDAQ", "NSE", "TradingView"].map((item) => (
                <span key={item} className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-orange-500 inline-block"></span>
                  {item}
                </span>
              ))}
            </div>
            <div className="flex gap-16 px-8 text-xs font-mono tracking-widest text-neutral-400 uppercase">
              {["Yahoo Finance", "Polygon", "Finnhub", "Alpha Vantage", "NASDAQ", "NSE", "TradingView"].map((item) => (
                <span key={item} className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-orange-500 inline-block"></span>
                  {item}
                </span>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Global Market Commodities */}
        <motion.div id="technology" variants={itemVariants} className="transform-gpu">
          <div className="text-[10px] uppercase tracking-[0.2em] text-neutral-500 font-semibold mb-6">Global Liquidity Nodes</div>
          <CommoditiesBar />
        </motion.div>

        {/* Large Control Bar (Outer Container/Major Panel: rounded-[32px]) */}
        <motion.div id="launch-terminal" variants={itemVariants} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 relative z-40 bg-[#0a0a0a]/60 border border-white/10 rounded-[32px] p-6 transform-gpu">
          <CustomSelect label="Global Node" value={selectedMarket} options={marketNames} onChange={(v) => setSelectedMarket(v)} />
          <CustomSelect label="Target Asset" value={selectedTicker} options={tickers} onChange={(v) => setSelectedTicker(v)} />
          <CustomSelect label="AI Architecture" value={selectedAlgo} options={algos} onChange={(v) => setSelectedAlgo(v)} />
          <CustomSelect label="Execution Routing" value="Dark Pool Aggregator" options={["Dark Pool Aggregator", "Smart Order Router", "TWAP Engine"]} onChange={() => {}} />
          <div className="p-4 rounded-[24px] border border-white/5 bg-white/5 flex flex-col justify-center transition-all duration-200">
            <div className="flex items-center gap-2 mb-2">
              <div className={`w-2 h-2 rounded-full ${loading ? "bg-amber-400" : "bg-[var(--profit)]"} animate-pulse`} />
              <span className="text-[10px] font-semibold tracking-wider uppercase text-neutral-400">{loading ? "Syncing Network..." : "Compute Online"}</span>
            </div>
            <div className="flex justify-between text-[10px] font-mono text-neutral-500">
              <span>LAT: {loading ? "..." : "12ms"}</span>
              <span>GPU: A100</span>
            </div>
          </div>
        </motion.div>

        {/* Live Valuation Giant Header (Outer Container/Major Panel: rounded-[32px]) */}
        <motion.div variants={itemVariants} className="flex flex-col lg:flex-row gap-6 items-center bg-[#0a0a0a]/60 border border-white/10 rounded-[32px] p-6 md:p-8 shadow-card transform-gpu">
          {/* Logo + Name */}
          <div className="flex-1 flex flex-col items-start gap-6 w-full">
            <img
              src={logoError ? getFallbackLogo(selectedTicker) : getLogoUrl(selectedTicker)}
              onError={() => setLogoError(true)}
              alt={selectedTicker}
              className="w-24 h-24 rounded-[24px] border border-white/10 object-contain bg-black p-3"
            />
            <div>
              <h2 className="font-display text-5xl md:text-7xl font-bold tracking-tighter text-white">{selectedTicker || "—"}</h2>
              <span className="inline-block mt-3 text-xs font-semibold uppercase tracking-widest bg-white/5 border border-white/10 px-4 py-1.5 rounded-full text-neutral-400">{region}</span>
            </div>
          </div>
          {/* Stats Grid */}
          <div className="flex-[2] grid grid-cols-2 md:grid-cols-4 gap-4 w-full">
            <StatBlock
              label="Valuation"
              value={stockData ? latestClose.toLocaleString(undefined, { minimumFractionDigits: 2 }) : "—"}
              sub={currency}
              delta={stockData ? `${pctChange >= 0 ? "+" : ""}${Number(pctChange).toFixed(2)}%` : undefined}
              deltaColor={stockData && pctChange >= 0 ? "text-[var(--profit)]" : "text-[var(--loss)]"}
            />
            <StatBlock
              label="Volatility"
              value={stockData ? `${Number(volatility).toFixed(1)}%` : "—"}
              sub={stockData ? `Beta: ${Number(vwap !== 0 ? volatility / 15 : 0).toFixed(2)}` : ""}
            />
            <StatBlock
              label="VWAP (20d)"
              value={stockData ? vwap.toLocaleString(undefined, { minimumFractionDigits: 2 }) : "—"}
              sub={stockData ? `Dev: ${Number(vwap !== 0 ? ((latestClose / vwap) - 1) * 100 : 0).toFixed(2)}%` : ""}
            />
            <div className="p-5 bg-white/5 border border-white/5 rounded-2xl flex flex-col justify-center">
              <span className="text-[9px] font-semibold uppercase tracking-widest text-neutral-500 mb-3">Imbalance</span>
              <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden mb-2 relative">
                <div className={`h-full rounded-full transition-all duration-700 ${imbalance > 50 ? "bg-[var(--profit)]" : "bg-[var(--loss)]"}`} style={{ width: `${imbalance}%` }} />
              </div>
              <div className="flex justify-between text-[10px] font-mono font-medium text-neutral-400">
                <span>BID {Math.round(imbalance)}%</span>
                <span>ASK {Math.round(100 - imbalance)}%</span>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Navigation Pills — 6 Workflows Swapper */}
        <motion.div id="platform" variants={itemVariants} className="w-full overflow-x-auto pb-4 hide-scrollbar transform-gpu">
          <div className="flex w-max gap-2 rounded-full bg-[#0a0a0a] border border-white/10 p-2">
            {pages.map((page) => (
              <button
                key={page}
                onClick={() => setActivePage(page)}
                className={`px-3 md:px-6 py-2 md:py-4 rounded-full text-[10px] md:text-xs font-semibold uppercase tracking-[0.15em] transition-all duration-300 whitespace-nowrap ${
                  activePage === page
                    ? "bg-white text-black shadow-card scale-100 font-bold"
                    : "text-neutral-400 hover:bg-white/5 hover:text-white scale-95 hover:scale-100"
                }`}
              >
                {page}
              </button>
            ))}
          </div>
        </motion.div>

        {/* Content Area */}
        <motion.div variants={itemVariants} className="w-full relative z-20 min-h-[600px] flex flex-col lg:flex-row gap-8 transform-gpu">
          <div className="flex-1 min-w-0">
            <AnimatePresence mode="wait">
              <motion.div
                key={activePage + selectedTicker}
                initial={{ opacity: 0, y: 20, filter: "blur(8px)" }}
                animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                exit={{ opacity: 0, y: -20, filter: "blur(8px)" }}
                transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                className="transform-gpu"
              >
                {activePage === "Market data ingestion" && <MarketDataIngestion />}
                {activePage === "Technical indicators" && <TechnicalIndicators />}
                {activePage === "ML prediction" && <MLPrediction />}
                {activePage === "Portfolio optimization" && <PortfolioOptimization />}
                {activePage === "Risk analytics" && <RiskAnalytics />}
                {activePage === "Backtesting" && <Backtesting />}
              </motion.div>
            </AnimatePresence>
          </div>
          <div id="documentation" className="w-full lg:w-[320px] shrink-0">
            <WatchlistPanel marketName={selectedMarket} />
          </div>
        </motion.div>
      </motion.div>
    </main>
  );
}

function StatBlock({ label, value, sub, delta, deltaColor }: any) {
  return (
    <div className="p-5 bg-white/5 border border-white/5 rounded-2xl flex flex-col justify-center">
      <span className="text-[10px] font-semibold uppercase tracking-widest text-neutral-500 mb-2">{label}</span>
      <div className="font-mono text-2xl font-bold text-white">
        {value} <span className="text-xs text-neutral-500 ml-1">{sub}</span>
      </div>
      {delta && <div className={`text-sm font-bold mt-1 ${deltaColor}`}>{delta}</div>}
    </div>
  );
}

