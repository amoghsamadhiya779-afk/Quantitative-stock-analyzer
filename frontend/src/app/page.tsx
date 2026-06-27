"use client";

import { useEffect, useState, useRef } from "react";
import { AnimatePresence, motion, useScroll, useTransform, useMotionValueEvent } from "framer-motion";

import MacroRiskEngine from "@/components/features/MacroRiskEngine";
import DeepTechnicalSuite from "@/components/features/DeepTechnicalSuite";
import SotaBenchmarking from "@/components/features/SotaBenchmarking";
import BacktestingEngine from "@/components/features/BacktestingEngine";
import TradingDesk from "@/components/features/TradingDesk";
import NewsDrivenMarket from "@/components/features/NewsDrivenMarket";
import AnalystDashboardView from "@/components/features/AnalystDashboardView";
import CommoditiesBar from "@/components/ui/CommoditiesBar";
import CustomSelect from "@/components/ui/CustomSelect";

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
  "Analyst Dashboard",
  "Macro & Risk Engine",
  "Deep Technical Suite",
  "SOTA Benchmarking",
  "Backtesting Engine",
  "Trading Desk",
  "News-Driven Market",
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
  const [navVisible, setNavVisible] = useState(false);

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

  // Detect sudden mouse movement to top
  useEffect(() => {
    let timeout: NodeJS.Timeout;
    const handleMouseMove = (e: MouseEvent) => {
      if (e.clientY < 120) {
        setNavVisible(true);
        clearTimeout(timeout);
      } else {
        timeout = setTimeout(() => {
          setNavVisible(false);
        }, 300); // Small delay to avoid jitter
      }
    };
    
    // Also show nav when scrolled to very top
    const handleScroll = () => {
      if (window.scrollY < 50) setNavVisible(true);
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("scroll", handleScroll);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("scroll", handleScroll);
      clearTimeout(timeout);
    };
  }, []);

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
    fetchTickers(selectedMarket)
      .then((t) => {
        setTickers(t);
        if (t.length > 0) setSelectedTicker(t[0]);
      })
      .catch(() => setTickers([]))
      .finally(() => setLoading(false));
  }, [selectedMarket]);

  useEffect(() => {
    if (!selectedMarket || !selectedTicker) return;
    setLoading(true);
    setLogoError(false);

    const fetchData = () => {
      const algoKeys = Object.values(ALGO_MAP);
      Promise.all([
        fetchStockData(selectedMarket, selectedTicker).catch(() => null),
        fetchPrediction(selectedMarket, selectedTicker, ALGO_MAP[selectedAlgo]).catch(() => null),
        ...algoKeys.map(algo => fetchPrediction(selectedMarket, selectedTicker, algo).catch(() => null))
      ]).then(([sd, primaryPr, ...allPrs]) => {
        if (sd) setStockData(sd as any);
        if (primaryPr) setPrediction(primaryPr as any);
        const validPrs = allPrs.filter(Boolean) as PredictionResult[];
        if (validPrs.length > 0) setAllPredictions(validPrs);
        setLoading(false);
      });
    };

    fetchData();
    const interval = setInterval(fetchData, 15000);
    return () => clearInterval(interval);
  }, [selectedMarket, selectedTicker, selectedAlgo]);

  const market = markets[selectedMarket];
  const currency = market?.currency || "USD";
  const region = market?.region || "Global";
  const imbalance = stockData ? Math.min(85, Math.max(30, 50 + (stockData.pct_change * 10))) : 50;

  return (
    <main className="min-h-screen relative w-full flex flex-col font-sans bg-[var(--background)] text-[var(--foreground)] transition-colors duration-500 overflow-x-hidden">
      
      {/* Auto-Hide Top Navigation */}
      <AnimatePresence>
        {navVisible && (
          <motion.div
            initial={{ y: "-100%", opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: "-100%", opacity: 0 }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            className="fixed top-0 left-0 w-full z-50 flex flex-col pointer-events-auto"
          >
            {/* Ticker Ribbon */}
            <div className="w-full bg-[var(--color-carbon)] py-1.5 overflow-hidden whitespace-nowrap text-[10px] font-mono text-[var(--color-paper)]">
              <div className="animate-marquee inline-block flex w-max">
                <div className="flex shrink-0">
                  S&P 500: 5,088.21 <span className="text-[var(--profit)] mx-2">▲ 1.12%</span> &nbsp;&nbsp;&nbsp;&nbsp; NIKKEI 225: 39,098.68 <span className="text-[var(--profit)] mx-2">▲ 2.19%</span> &nbsp;&nbsp;&nbsp;&nbsp; VIX: 13.45 <span className="text-[var(--loss)] mx-2">▼ -4.21%</span> &nbsp;&nbsp;&nbsp;&nbsp; GOLD: 2,045.10 <span className="text-[var(--profit)] mx-2">▲ 0.15%</span> &nbsp;&nbsp;&nbsp;&nbsp;
                </div>
                <div className="flex shrink-0">
                  S&P 500: 5,088.21 <span className="text-[var(--profit)] mx-2">▲ 1.12%</span> &nbsp;&nbsp;&nbsp;&nbsp; NIKKEI 225: 39,098.68 <span className="text-[var(--profit)] mx-2">▲ 2.19%</span> &nbsp;&nbsp;&nbsp;&nbsp; VIX: 13.45 <span className="text-[var(--loss)] mx-2">▼ -4.21%</span> &nbsp;&nbsp;&nbsp;&nbsp; GOLD: 2,045.10 <span className="text-[var(--profit)] mx-2">▲ 0.15%</span> &nbsp;&nbsp;&nbsp;&nbsp;
                </div>
              </div>
            </div>
            
            {/* Header / Logo */}
            <div className="w-full bg-[var(--surface)]/90 backdrop-blur-xl border-b border-[var(--border)] px-8 lg:px-16 py-4 flex justify-between items-center shadow-card">
              <div className="flex items-center gap-4 group cursor-pointer">
                <img src="/quantum_yield_logo.png" alt="Quantum Yield Logo" className="w-10 h-10 rounded-full border border-[var(--border)] group-hover:rotate-12 transition-transform duration-700" />
                <div>
                  <h1 className="font-display text-xl font-bold tracking-tighter text-[var(--color-carbon)]">QUANTUM YIELD</h1>
                  <div className="text-[9px] uppercase tracking-widest text-[var(--color-slate)] font-medium">Algorithmic Capital Allocation</div>
                </div>
              </div>
              <div className="flex items-center gap-2 text-[10px] uppercase tracking-widest text-[var(--color-slate)]">
                <div className="w-1.5 h-1.5 rounded-full bg-[var(--accent)] animate-pulse" />
                <span className="font-bold">System Live</span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.div 
        variants={containerVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-100px" }}
        className="w-full max-w-[1200px] mx-auto px-6 md:px-12 lg:px-24 py-32 md:py-48 z-10 flex flex-col gap-16 md:gap-24 relative"
      >
        {/* Massive Hero Section */}
        <motion.div variants={itemVariants} className="max-w-4xl">
          <h2 className="font-display text-display-lg font-semibold text-[var(--color-carbon)] mb-6">
            Institutional Intelligence.<br/>
            <span className="text-[var(--color-slate)] font-medium">Fluid Execution.</span>
          </h2>
          <p className="text-body-lg text-[var(--color-graphite)] max-w-2xl leading-relaxed">
            Quantum Yield synthesizes global macroeconomic data, real-time liquidity flow, and state-of-the-art neural networks into a singular, highly responsive interface.
          </p>
        </motion.div>

        {/* Global Market Commodities */}
        <motion.div variants={itemVariants}>
          <div className="text-[10px] uppercase tracking-[0.2em] text-[var(--color-slate)] font-semibold mb-6">Global Liquidity Nodes</div>
          <CommoditiesBar />
        </motion.div>

        {/* Large Control Bar */}
        <motion.div variants={itemVariants} className="grid grid-cols-2 md:grid-cols-5 gap-4 relative z-40">
          <CustomSelect label="Global Node" value={selectedMarket} options={marketNames} onChange={(v) => setSelectedMarket(v)} />
          <CustomSelect label="Target Asset" value={selectedTicker} options={tickers} onChange={(v) => setSelectedTicker(v)} />
          <CustomSelect label="AI Architecture" value={selectedAlgo} options={algos} onChange={(v) => setSelectedAlgo(v)} />
          <CustomSelect label="Execution Routing" value="Dark Pool Aggregator" options={["Dark Pool Aggregator", "Smart Order Router", "TWAP Engine"]} onChange={() => {}} />
          <div className="p-4 rounded-card ventriloc-card flex flex-col justify-center transition-all hover:-translate-y-1">
            <div className="flex items-center gap-2 mb-2">
              <div className={`w-2 h-2 rounded-full ${loading ? "bg-amber-400" : "bg-[var(--profit)]"} animate-pulse`} />
              <span className="text-[10px] font-semibold tracking-wider uppercase text-[var(--color-graphite)]">{loading ? "Syncing Network..." : "Compute Online"}</span>
            </div>
            <div className="flex justify-between text-[10px] font-mono text-[var(--color-slate)]">
              <span>LAT: {loading ? "..." : "12ms"}</span>
              <span>GPU: A100</span>
            </div>
          </div>
        </motion.div>

        {/* Live Valuation Giant Header */}
        <motion.div variants={itemVariants} className="flex flex-col xl:flex-row gap-8 items-center bg-white border border-[var(--border)] rounded-[32px] p-8 md:p-12 shadow-card hover:shadow-card-hover transition-all duration-700">
          {/* Logo + Name */}
          <div className="flex-1 flex flex-col items-start gap-6 w-full">
            <img
              src={logoError ? getFallbackLogo(selectedTicker) : getLogoUrl(selectedTicker)}
              onError={() => setLogoError(true)}
              alt={selectedTicker}
              className="w-24 h-24 rounded-[24px] border border-[var(--border)] object-contain bg-[var(--background)] p-3"
            />
            <div>
              <h2 className="font-display text-5xl md:text-7xl font-bold tracking-tighter text-[var(--color-carbon)]">{selectedTicker || "—"}</h2>
              <span className="inline-block mt-3 text-xs font-semibold uppercase tracking-widest bg-[var(--color-chalk)] px-4 py-1.5 rounded-tag text-[var(--color-graphite)]">{region}</span>
            </div>
          </div>
          {/* Stats Grid */}
          <div className="flex-[2] grid grid-cols-2 md:grid-cols-4 gap-4 w-full">
            <StatBlock
              label="Valuation"
              value={stockData ? stockData.latest_close.toLocaleString(undefined, { minimumFractionDigits: 2 }) : "—"}
              sub={currency}
              delta={stockData ? `${stockData.pct_change >= 0 ? "+" : ""}${Number(stockData.pct_change).toFixed(2)}%` : undefined}
              deltaColor={stockData && stockData.pct_change >= 0 ? "text-[var(--profit)]" : "text-[var(--loss)]"}
            />
            <StatBlock
              label="Volatility"
              value={stockData ? `${Number(stockData.volatility).toFixed(1)}%` : "—"}
              sub={stockData ? `Beta: ${Number(stockData.volatility / 15).toFixed(2)}` : ""}
            />
            <StatBlock
              label="VWAP (20d)"
              value={stockData ? stockData.vwap.toLocaleString(undefined, { minimumFractionDigits: 2 }) : "—"}
              sub={stockData ? `Dev: ${Number(((stockData.latest_close / stockData.vwap) - 1) * 100).toFixed(2)}%` : ""}
            />
            <div className="p-5 bg-[var(--color-fog)] rounded-2xl flex flex-col justify-center">
              <span className="text-[9px] font-semibold uppercase tracking-widest text-[var(--color-slate)] mb-3">Imbalance</span>
              <div className="w-full h-1.5 bg-[var(--color-chalk)] rounded-full overflow-hidden mb-2 relative">
                <div className={`h-full rounded-full transition-all duration-700 ${imbalance > 50 ? "bg-[var(--profit)]" : "bg-[var(--loss)]"}`} style={{ width: `${imbalance}%` }} />
              </div>
              <div className="flex justify-between text-[10px] font-mono font-medium text-[var(--color-slate)]">
                <span>BID {Math.round(imbalance)}%</span>
                <span>ASK {Math.round(100 - imbalance)}%</span>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Navigation Pills — Giant Fluid Segment */}
        <motion.div variants={itemVariants} className="w-full overflow-x-auto pb-4 hide-scrollbar">
          <div className="flex w-max gap-2 rounded-[200px] bg-white border border-[var(--border)] shadow-sm p-2">
            {pages.map((page) => (
              <button
                key={page}
                onClick={() => setActivePage(page)}
                className={`px-6 py-4 rounded-[200px] text-xs font-semibold uppercase tracking-[0.15em] transition-all duration-500 whitespace-nowrap ${
                  activePage === page
                    ? "bg-[var(--color-carbon)] text-white shadow-card scale-100"
                    : "text-[var(--color-slate)] hover:bg-[var(--color-fog)] hover:text-[var(--color-carbon)] scale-95 hover:scale-100"
                }`}
              >
                {page}
              </button>
            ))}
          </div>
        </motion.div>

        {/* Content Area */}
        <motion.div variants={itemVariants} className="w-full relative z-20 min-h-[800px]">
          <AnimatePresence mode="wait">
            <motion.div
              key={activePage + selectedTicker}
              initial={{ opacity: 0, y: 20, filter: "blur(8px)" }}
              animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              exit={{ opacity: 0, y: -20, filter: "blur(8px)" }}
              transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            >
              {activePage === "Analyst Dashboard" && <AnalystDashboardView stockData={stockData} prediction={prediction} allPredictions={allPredictions} currency={currency} />}
              {activePage === "Macro & Risk Engine" && <MacroRiskEngine stockData={stockData} prediction={prediction} currency={currency} selectedAlgo={selectedAlgo} selectedMarket={selectedMarket} selectedTicker={selectedTicker} />}
              {activePage === "Deep Technical Suite" && <DeepTechnicalSuite stockData={stockData} />}
              {activePage === "SOTA Benchmarking" && <SotaBenchmarking stockData={stockData} prediction={prediction} currency={currency} selectedAlgo={selectedAlgo} />}
              {activePage === "Backtesting Engine" && <BacktestingEngine selectedMarket={selectedMarket} selectedTicker={selectedTicker} selectedAlgo={selectedAlgo} />}
              {activePage === "Trading Desk" && <TradingDesk stockData={stockData} currency={currency} selectedTicker={selectedTicker} />}
              {activePage === "News-Driven Market" && <NewsDrivenMarket selectedTicker={selectedTicker} selectedMarket={selectedMarket} />}
            </motion.div>
          </AnimatePresence>
        </motion.div>
      </motion.div>
    </main>
  );
}

function StatBlock({ label, value, sub, delta, deltaColor }: any) {
  return (
    <div className="p-5 bg-[var(--color-fog)] rounded-2xl flex flex-col justify-center">
      <span className="text-[10px] font-semibold uppercase tracking-widest text-[var(--color-slate)] mb-2">{label}</span>
      <div className="font-mono text-2xl font-bold text-[var(--color-carbon)]">
        {value} <span className="text-xs text-[var(--color-slate)] ml-1">{sub}</span>
      </div>
      {delta && <div className={`text-sm font-bold mt-1 ${deltaColor}`}>{delta}</div>}
    </div>
  );
}
