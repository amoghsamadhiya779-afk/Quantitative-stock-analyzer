"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

import MarketDataIngestion from "@/components/workflows/MarketDataIngestion";
import TechnicalIndicators from "@/components/workflows/TechnicalIndicators";
import MLPrediction from "@/components/workflows/MLPrediction";
import PortfolioOptimization from "@/components/workflows/PortfolioOptimization";
import RiskAnalytics from "@/components/workflows/RiskAnalytics";
import Backtesting from "@/components/workflows/Backtesting";
import NewsDrivenMarket from "@/components/features/NewsDrivenMarket";

import CommoditiesBar from "@/components/ui/CommoditiesBar";
import CustomSelect from "@/components/ui/CustomSelect";
import WatchlistPanel from "@/components/ui/WatchlistPanel";
import CosmoqBackground from "@/components/ui/CosmoqBackground";

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
  "News-driven macro",
];

const ALGO_MAP: Record<string, string> = {
  "Quantum CNN-Attention Engine (Max Yield)": "CNN_BiLSTM_Attention",
  "Temporal Transformer Model (Robust)": "TimeSeriesTransformer",
  "Advanced BiLSTM Layer (Balanced)": "AdvancedBiLSTM"
};

const algos = Object.keys(ALGO_MAP);

/* Orchestrated load sequence — resolves in ~1.2s total */
const bgVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.8, ease: [0.16, 1, 0.3, 1] } },
};

const navVariants = {
  hidden: { opacity: 0, y: -8 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1], delay: 0.15 } },
};

const heroVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.06, delayChildren: 0.3 },
  },
};

const heroLineVariants = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] } },
};

const tickerVariants = {
  hidden: { opacity: 0, x: -30 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1], delay: 0.5 } },
};

const dashboardVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.04, delayChildren: 0.7 },
  },
};

const cardVariants = {
  hidden: { opacity: 0, y: 8 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.22, ease: [0.22, 1, 0.36, 1] } },
};

const TICKER_DATA = [
  { name: "AAPL", price: "184.20", change: "+1.2%", pos: true },
  { name: "TSLA", price: "192.15", change: "-0.4%", pos: false },
  { name: "NVDA", price: "450.00", change: "+2.1%", pos: true },
  { name: "MSFT", price: "330.10", change: "+0.8%", pos: true },
  { name: "AMZN", price: "140.50", change: "-0.1%", pos: false },
  { name: "GOOGL", price: "138.20", change: "+0.6%", pos: true },
  { name: "META", price: "312.40", change: "+1.8%", pos: true },
  { name: "BTC", price: "64,200", change: "+3.4%", pos: true },
];

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
    <main className="min-h-screen relative w-full flex flex-col font-sans text-foreground overflow-x-hidden">

      {/* COSMOQ Animated Background */}
      <CosmoqBackground />

      {/* Floating Glass Pill Navigation */}
      <motion.header
        variants={navVariants}
        initial="hidden"
        animate="visible"
        className="sticky top-0 z-50 w-full px-4 md:px-8 pt-4 transform-gpu"
      >
        <div className="max-w-[1200px] mx-auto cosmoq-nav-pill px-4 md:px-8 py-3 flex justify-between items-center">
          {/* Logo & Wordmark */}
          <div className="flex items-center gap-3">
            <img src="/quantum_yield_logo.png" alt="Nexus Quant" className="w-8 h-8 rounded-full border border-white/10" />
            <h1 className="font-display text-sm font-bold tracking-[0.12em] text-white uppercase">Nexus Quant</h1>
          </div>
          {/* Navigation Links */}
          <nav className="hidden md:flex items-center gap-6">
            {["Platform", "Research", "Technology", "Documentation"].map((link) => (
              <a
                key={link}
                href={`#${link.toLowerCase()}`}
                className="text-[10px] uppercase tracking-[0.15em] text-neutral-400 hover:text-white transition-colors duration-200"
              >
                {link}
              </a>
            ))}
            <a
              href="https://github.com/amoghsamadhiya779-afk/Quantitative-stock-analyzer"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[10px] uppercase tracking-[0.15em] text-neutral-400 hover:text-white transition-colors duration-200"
            >
              GitHub
            </a>
            <a
              href="#launch-terminal"
              className="cosmoq-cta px-4 py-1.5 text-[10px] font-semibold uppercase tracking-[0.15em] relative z-10"
            >
              Launch Terminal
            </a>
          </nav>
        </div>
      </motion.header>

      {/* Market Ticker Ribbon */}
      <motion.div
        variants={tickerVariants}
        initial="hidden"
        animate="visible"
        className="w-full overflow-hidden py-3 border-b border-white/5 bg-black/30 backdrop-blur-sm z-30 relative"
      >
        <div className="flex w-max animate-marquee">
          {[0, 1].map((copy) => (
            <div key={copy} className="flex gap-12 px-6 text-xs font-mono tracking-widest text-neutral-400 uppercase">
              {TICKER_DATA.map((item, i) => (
                <motion.span
                  key={`${copy}-${item.name}`}
                  className="flex items-center gap-2"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.5 + i * 0.03, duration: 0.3 }}
                >
                  <span className={`w-1.5 h-1.5 rounded-full ${item.pos ? 'bg-[var(--profit)]' : 'bg-[var(--loss)]'} inline-block`} />
                  <span className="text-white font-bold">{item.name}</span>
                  <span className="text-neutral-500">${item.price}</span>
                  <span className={item.pos ? 'text-[var(--profit)]' : 'text-[var(--loss)]'}>{item.change}</span>
                </motion.span>
              ))}
            </div>
          ))}
        </div>
      </motion.div>

      <motion.div
        variants={dashboardVariants}
        initial="hidden"
        animate="visible"
        className="w-full max-w-[1200px] mx-auto px-4 md:px-8 lg:px-12 py-12 md:py-16 z-10 flex flex-col gap-[20px] relative"
      >
        {/* Hero Section */}
        <motion.div id="research" variants={heroVariants} initial="hidden" animate="visible" className="max-w-4xl transform-gpu pt-4">
          <motion.h2 variants={heroLineVariants} className="font-display text-5xl md:text-[66px] font-semibold text-white leading-[0.95] mb-6 tracking-tight">
            Institutional Quantitative Intelligence
          </motion.h2>
          <motion.p variants={heroLineVariants} className="text-body-lg text-[#A0A0AC] max-w-2xl leading-relaxed">
            Nexus Quant synthesizes global macroeconomic data, real-time liquidity flow, and state-of-the-art neural networks into a singular, highly responsive interface.
          </motion.p>
        </motion.div>

        {/* Global Liquidity Nodes */}
        <motion.div id="technology" variants={cardVariants} className="transform-gpu">
          <div className="text-[10px] uppercase tracking-[0.2em] text-[#A0A0AC] font-semibold mb-5">Global Liquidity Nodes</div>
          <CommoditiesBar />
        </motion.div>

        {/* Control Bar */}
        <motion.div id="launch-terminal" variants={cardVariants} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 relative z-40 cosmoq-card p-6 transform-gpu">
          <CustomSelect label="Global Node" value={selectedMarket} options={marketNames} onChange={(v) => setSelectedMarket(v)} />
          <CustomSelect label="Target Asset" value={selectedTicker} options={tickers} onChange={(v) => setSelectedTicker(v)} />
          <CustomSelect label="AI Architecture" value={selectedAlgo} options={algos} onChange={(v) => setSelectedAlgo(v)} />
          <CustomSelect label="Execution Routing" value="Dark Pool Aggregator" options={["Dark Pool Aggregator", "Smart Order Router", "TWAP Engine"]} onChange={() => {}} />
          <div className="p-4 rounded-[20px] border border-white/5 bg-white/5 flex flex-col justify-center transition-all duration-200">
            <div className="flex items-center gap-2 mb-2">
              <div className={`w-2 h-2 rounded-full ${loading ? "bg-amber-400" : "bg-[var(--profit)]"} live-indicator`} />
              <span className="text-[10px] font-semibold tracking-wider uppercase text-neutral-400">{loading ? "Syncing Network..." : "Compute Online"}</span>
            </div>
            <div className="flex justify-between text-[10px] font-mono text-neutral-500">
              <span>LAT: {loading ? "..." : "12ms"}</span>
              <span>GPU: A100</span>
            </div>
          </div>
        </motion.div>

        {/* Live Valuation Header */}
        <motion.div variants={cardVariants} className="flex flex-col lg:flex-row gap-[20px] items-stretch cosmoq-card p-6 md:p-8 transform-gpu">
          {/* Logo + Name */}
          <div className="flex-1 flex flex-col items-start gap-6 w-full">
            <img
              src={logoError ? getFallbackLogo(selectedTicker) : getLogoUrl(selectedTicker)}
              onError={() => setLogoError(true)}
              alt={selectedTicker}
              className="w-24 h-24 rounded-[20px] border border-white/10 object-contain bg-black/40 p-3"
            />
            <div>
              <h2 className="font-display text-5xl md:text-7xl font-bold tracking-tighter text-white">{selectedTicker || "—"}</h2>
              <span className="inline-block mt-3 badge-neutral">{region}</span>
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
            <div className="p-5 cosmoq-card flex flex-col justify-center">
              <span className="text-[9px] font-semibold uppercase tracking-widest text-[#A0A0AC] mb-3">Imbalance</span>
              <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden mb-2 relative">
                <div className={`h-full rounded-full transition-all duration-700 ${imbalance > 50 ? "bg-[var(--profit)]" : "bg-[var(--loss)]"}`} style={{ width: `${imbalance}%` }} />
              </div>
              <div className="flex justify-between text-[10px] font-mono font-medium text-[#A0A0AC]">
                <span>BID {Math.round(imbalance)}%</span>
                <span>ASK {Math.round(100 - imbalance)}%</span>
              </div>
            </div>
          </div>
        </motion.div>

        {/* COSMOQ Segmented Tab Navigation */}
        <motion.div id="platform" variants={cardVariants} className="w-full overflow-x-auto pb-2 hide-scrollbar transform-gpu">
          <div className="flex w-max gap-1.5 cosmoq-nav-pill p-1.5 relative">
            {pages.map((page) => (
              <button
                key={page}
                onClick={() => setActivePage(page)}
                className={`px-3 md:px-5 py-2 md:py-3 rounded-full text-[10px] md:text-xs font-semibold uppercase tracking-[0.12em] whitespace-nowrap relative z-10 press-feedback transition-colors duration-[var(--dur-base)] ${
                  activePage === page
                    ? "text-[#0a0a0a] font-bold"
                    : "text-neutral-400 hover:text-white"
                }`}
              >
                {activePage === page && (
                  <motion.span
                    layoutId="activeTab"
                    className="absolute inset-0 bg-white/95 rounded-full shadow-lg"
                    style={{ zIndex: -1 }}
                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                  />
                )}
                {page}
              </button>
            ))}
          </div>
        </motion.div>

        {/* Content Area */}
        <motion.div variants={cardVariants} className="w-full relative z-20 min-h-[600px] flex flex-col lg:flex-row gap-[20px] transform-gpu">
          <div className="flex-1 min-w-0">
            <AnimatePresence mode="wait">
              <motion.div
                key={activePage + selectedTicker}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.15, ease: [0.22, 1, 0.36, 1] }}
                className="transform-gpu"
              >
                {activePage === "Market data ingestion" && <MarketDataIngestion />}
                {activePage === "Technical indicators" && <TechnicalIndicators />}
                {activePage === "ML prediction" && <MLPrediction />}
                {activePage === "Portfolio optimization" && <PortfolioOptimization />}
                {activePage === "Risk analytics" && <RiskAnalytics />}
                {activePage === "Backtesting" && <Backtesting />}
                {activePage === "News-driven macro" && <NewsDrivenMarket selectedTicker={selectedTicker} selectedMarket={selectedMarket} />}
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
    <div className="p-5 cosmoq-card flex flex-col justify-center">
      <span className="text-[10px] font-semibold uppercase tracking-widest text-[#A0A0AC] mb-2">{label}</span>
      <div className="font-mono text-2xl font-bold text-white">
        {value} <span className="text-xs text-neutral-500 ml-1">{sub}</span>
      </div>
      {delta && <div className={`text-sm font-bold mt-1 ${deltaColor}`}>{delta}</div>}
    </div>
  );
}
