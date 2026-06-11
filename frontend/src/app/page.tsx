"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

import MacroRiskEngine from "@/components/features/MacroRiskEngine";
import DeepTechnicalSuite from "@/components/features/DeepTechnicalSuite";
import SotaBenchmarking from "@/components/features/SotaBenchmarking";
import BacktestingEngine from "@/components/features/BacktestingEngine";
import TradingDesk from "@/components/features/TradingDesk";
import NewsDrivenMarket from "@/components/features/NewsDrivenMarket";
import AnalystDashboardView from "@/components/features/AnalystDashboardView";
import ThemeSelector from "@/components/ui/ThemeSelector";
import CommoditiesBar from "@/components/ui/CommoditiesBar";

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

const algos = [
  "Quantum Transformer (QTN) - Max Yield",
  "Liquid Neural Net (LTC) - Robust",
  "Temporal Fusion Coder (TFC) - Balanced",
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.8, ease: [0.22, 1, 0.36, 1] },
  },
};

export default function Home() {
  const [activePage, setActivePage] = useState(pages[0]);
  const [theme, setThemeState] = useState("default");

  // Backend-driven state
  const [markets, setMarkets] = useState<Record<string, MarketInfo>>({});
  const [marketNames, setMarketNames] = useState<string[]>([]);
  const [selectedMarket, setSelectedMarket] = useState("");
  const [tickers, setTickers] = useState<string[]>([]);
  const [selectedTicker, setSelectedTicker] = useState("");
  const [selectedAlgo, setSelectedAlgo] = useState(algos[0]);
  const [stockData, setStockData] = useState<StockData | null>(null);
  const [prediction, setPrediction] = useState<PredictionResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [logoError, setLogoError] = useState(false);

  // 1. Load markets on mount
  useEffect(() => {
    fetchMarkets()
      .then((m) => {
        setMarkets(m);
        const names = Object.keys(m);
        setMarketNames(names);
        if (names.length > 0) setSelectedMarket(names[0]);
      })
      .catch(() => {
        // Fallback if API is down
        const fallback: Record<string, MarketInfo> = {
          "United States (S&P 500)": { index_key: "SP500", stock_file: "SP500_DATASET.csv", region: "North America", currency: "USD" },
          "India (NIFTY 50)": { index_key: "NIFTY50", stock_file: "NIFTY50_India.csv", region: "Asia", currency: "INR" },
          "Japan (Nikkei 225)": { index_key: "Nikkei225", stock_file: "Nikkei225_Japan.csv", region: "Asia", currency: "JPY" },
          "United Kingdom (FTSE 100)": { index_key: "FTSE100", stock_file: "FTSE100_UK.csv", region: "Europe", currency: "GBP" },
          "Germany (DAX 40)": { index_key: "DAX40", stock_file: "DAX40_Germany.csv", region: "Europe", currency: "EUR" },
          "Turkey (BIST 100)": { index_key: "BIST100", stock_file: "BIST100_Turkey.csv", region: "Europe/Asia", currency: "TRY" },
          "Brazil (Bovespa)": { index_key: "Bovespa", stock_file: "Bovespa_Brazil.csv", region: "South America", currency: "BRL" },
          "Indonesia (IDX)": { index_key: "IDX", stock_file: "IDX_Indonesia.csv", region: "Asia", currency: "IDR" },
        };
        setMarkets(fallback);
        const names = Object.keys(fallback);
        setMarketNames(names);
        setSelectedMarket(names[0]);
      });
  }, []);

  // 2. Load tickers when market changes
  useEffect(() => {
    if (!selectedMarket) return;
    setLoading(true);
    setSelectedTicker("");
    setStockData(null);
    setPrediction(null);
    fetchTickers(selectedMarket)
      .then((t) => {
        setTickers(t);
        if (t.length > 0) setSelectedTicker(t[0]);
      })
      .catch(() => setTickers([]))
      .finally(() => setLoading(false));
  }, [selectedMarket]);

  // 3. Load stock data + prediction when ticker changes
  useEffect(() => {
    if (!selectedMarket || !selectedTicker) return;
    setLoading(true);
    setLogoError(false);
    Promise.all([
      fetchStockData(selectedMarket, selectedTicker).catch(() => null),
      fetchPrediction(selectedMarket, selectedTicker).catch(() => null),
    ]).then(([sd, pr]) => {
      setStockData(sd);
      setPrediction(pr);
      setLoading(false);
    });
  }, [selectedMarket, selectedTicker]);

  const setTheme = (t: string) => {
    setThemeState(t);
    document.documentElement.setAttribute("data-theme", t);
  };

  const market = markets[selectedMarket];
  const currency = market?.currency || "USD";
  const region = market?.region || "Global";

  const imbalance = stockData ? Math.min(85, Math.max(30, 50 + (stockData.pct_change * 10))) : 50;

  return (
    <main className="min-h-screen relative w-full flex flex-col font-sans bg-[var(--background)] text-[var(--foreground)] transition-colors duration-700 overflow-hidden">
      
      {/* Cinematic Digital Grid Background */}
      <div className="absolute inset-0 z-0 opacity-10 pointer-events-none bg-[linear-gradient(rgba(255,255,255,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.05)_1px,transparent_1px)] bg-[size:40px_40px] [mask-image:radial-gradient(ellipse_80%_80%_at_50%_0%,#000_10%,transparent_100%)]" />

      {/* Ticker Ribbon */}
      <motion.div 
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="w-full bg-[var(--surface)] border-b border-[var(--border)] py-2 overflow-hidden whitespace-nowrap text-xs font-mono text-[var(--foreground)]/60 backdrop-blur-xl z-50 relative"
      >
        <div className="animate-[marquee_30s_linear_infinite] inline-block">
          S&P 500: 5,088.21 <span className="text-[var(--profit)]">▲ 1.12%</span> &nbsp;&nbsp;&nbsp;&nbsp; NIKKEI 225: 39,098.68 <span className="text-[var(--profit)]">▲ 2.19%</span> &nbsp;&nbsp;&nbsp;&nbsp; DAX: 17,419.33 <span className="text-[var(--profit)]">▲ 0.28%</span> &nbsp;&nbsp;&nbsp;&nbsp; VIX: 13.45 <span className="text-[var(--loss)]">▼ -4.21%</span> &nbsp;&nbsp;&nbsp;&nbsp; GOLD: 2,045.10 <span className="text-[var(--profit)]">▲ 0.15%</span> &nbsp;&nbsp;&nbsp;&nbsp; US10Y: 4.28% <span className="text-[var(--loss)]">▼ -0.02</span> &nbsp;&nbsp;&nbsp;&nbsp; BTC: 64,210.00 <span className="text-[var(--profit)]">▲ 3.42%</span> &nbsp;&nbsp;&nbsp;&nbsp; NIFTY 50: 22,147.90 <span className="text-[var(--profit)]">▲ 0.68%</span> &nbsp;&nbsp;&nbsp;&nbsp; FTSE 100: 8,275.38 <span className="text-[var(--loss)]">▼ -0.31%</span>
        </div>
      </motion.div>

      <motion.div 
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="flex-1 w-full max-w-[1440px] mx-auto px-6 py-4 z-10 flex flex-col gap-5 relative"
      >
        {/* Header */}
        <motion.div variants={itemVariants} className="flex justify-between items-end">
          <div className="flex items-center gap-4">
            <img src="/quantum_yield_logo.png" alt="Quantum Yield Logo" className="w-16 h-16 rounded-2xl object-cover border border-[var(--border)] shadow-[0_0_20px_var(--glow)]" />
            <div>
              <h1 className="text-4xl font-bold tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-[var(--foreground)] to-[var(--foreground)]/50 animate-glow-pulse drop-shadow-xl">QUANTUM YIELD</h1>
              <div className="text-[10px] uppercase tracking-[0.25em] text-[var(--foreground)]/50 font-bold mt-1">Algorithmic Capital Allocation</div>
            </div>
          </div>
          <ThemeSelector currentTheme={theme} onThemeChange={setTheme} />
        </motion.div>

        {/* Global Market Commodities */}
        <motion.div variants={itemVariants}>
          <CommoditiesBar />
        </motion.div>

        {/* Control Bar — LIVE DROPDOWNS */}
        <motion.div variants={itemVariants} className="grid grid-cols-2 md:grid-cols-5 gap-3 relative z-40">
          <CustomSelect
            label="Global Node"
            value={selectedMarket}
            options={marketNames}
            onChange={(v) => setSelectedMarket(v)}
          />
          <CustomSelect
            label="Target Asset"
            value={selectedTicker}
            options={tickers}
            onChange={(v) => setSelectedTicker(v)}
          />
          <CustomSelect
            label="AI Architecture"
            value={selectedAlgo}
            options={algos}
            onChange={(v) => setSelectedAlgo(v)}
          />
          <CustomSelect
            label="Execution Routing"
            value="Dark Pool Aggregator"
            options={["Dark Pool Aggregator", "Smart Order Router", "TWAP Engine", "VWAP Engine"]}
            onChange={() => {}}
          />
          <div className="p-3 rounded-xl bg-[var(--surface)] border border-[var(--border)] flex flex-col justify-center backdrop-blur-xl hover:shadow-[0_0_20px_var(--glow)] transition-all">
            <div className="flex items-center gap-2 mb-1">
              <div className={`w-2 h-2 rounded-full ${loading ? "bg-amber-400" : "bg-[var(--profit)]"} animate-pulse shadow-[0_0_8px_currentColor]`} />
              <span className="text-[10px] font-bold tracking-wider uppercase">{loading ? "Syncing..." : "System Live"}</span>
            </div>
            <div className="flex justify-between text-[9px] font-mono text-[var(--foreground)]/40">
              <span>LAT: {loading ? "..." : "14ms"}</span>
              <span>GPU: Online</span>
            </div>
          </div>
        </motion.div>

        {/* Live Valuation Header */}
        <motion.div variants={itemVariants} className="flex flex-col md:flex-row bg-[var(--surface)] border border-[var(--border)] rounded-2xl overflow-hidden shadow-2xl backdrop-blur-md group hover:border-[var(--border)] transition-all">
          {/* Logo + Name */}
          <div className="flex-1 p-5 md:border-r border-[var(--border)] flex items-center gap-5">
            <img
              src={logoError ? getFallbackLogo(selectedTicker) : getLogoUrl(selectedTicker)}
              onError={() => setLogoError(true)}
              alt={selectedTicker}
              className="w-14 h-14 rounded-xl border border-[var(--border)] shadow-lg object-contain bg-[var(--background)] p-1 group-hover:scale-105 transition-transform duration-500"
            />
            <div>
              <h2 className="text-2xl font-bold tracking-tight">{selectedTicker || "—"}</h2>
              <span className="inline-block mt-1 text-[9px] font-bold uppercase tracking-widest bg-[var(--foreground)]/10 px-3 py-0.5 rounded-md text-[var(--foreground)]/60">{region}</span>
            </div>
          </div>
          {/* Stats */}
          <div className="flex-[2] flex flex-wrap">
            <StatBlock
              label="Live Valuation"
              value={stockData ? stockData.latest_close.toLocaleString(undefined, { minimumFractionDigits: 2 }) : "—"}
              sub={currency}
              delta={stockData ? `${stockData.pct_change >= 0 ? "+" : ""}${Number(stockData.pct_change).toFixed(2)}%` : undefined}
              deltaColor={stockData && stockData.pct_change >= 0 ? "text-[var(--profit)]" : "text-[var(--loss)]"}
            />
            <StatBlock
              label="Annual Volatility"
              value={stockData ? `${Number(stockData.volatility).toFixed(1)}%` : "—"}
              sub={stockData ? `Beta: ${Number(stockData.volatility / 15).toFixed(2)}` : ""}
            />
            <StatBlock
              label="VWAP (20d)"
              value={stockData ? stockData.vwap.toLocaleString(undefined, { minimumFractionDigits: 2 }) : "—"}
              sub={stockData ? `Dev: ${Number(((stockData.latest_close / stockData.vwap) - 1) * 100).toFixed(2)}%` : ""}
            />
            <div className="flex-1 min-w-[140px] p-5 flex flex-col justify-center">
              <span className="text-[9px] font-bold uppercase tracking-widest text-[var(--foreground)]/40 mb-2">Order Imbalance</span>
              <div className="w-full h-1.5 bg-[var(--foreground)]/10 rounded-full overflow-hidden mb-1 relative">
                <div className={`h-full rounded-full transition-all duration-700 ${imbalance > 50 ? "bg-[var(--profit)] shadow-[0_0_8px_currentColor]" : "bg-[var(--loss)] shadow-[0_0_8px_currentColor]"}`} style={{ width: `${imbalance}%` }} />
              </div>
              <div className="flex justify-between text-[9px] font-mono font-bold text-[var(--foreground)]/40 mt-1">
                <span>BID {Math.round(imbalance)}%</span>
                <span>ASK {Math.round(100 - imbalance)}%</span>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Navigation Pills */}
        <motion.div variants={itemVariants} className="flex flex-wrap gap-1.5 bg-[var(--surface)] p-1.5 rounded-2xl border border-[var(--border)] backdrop-blur-xl shadow-lg relative z-30">
          {pages.map((page) => (
            <button
              key={page}
              onClick={() => setActivePage(page)}
              className={`flex-1 min-w-[130px] px-3 py-2.5 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all duration-300 ${
                activePage === page
                  ? "bg-[var(--foreground)] text-[var(--background)] shadow-[0_4px_20px_var(--glow)] scale-[1.02]"
                  : "text-[var(--foreground)]/70 hover:bg-white/5 hover:text-[var(--foreground)] hover:-translate-y-0.5"
              }`}
            >
              {page}
            </button>
          ))}
        </motion.div>

        {/* Content Area */}
        <motion.div variants={itemVariants} className="w-full relative z-20">
          <AnimatePresence mode="wait">
            <motion.div
              key={activePage + selectedTicker}
              initial={{ opacity: 0, y: 8, filter: "blur(8px)" }}
              animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              exit={{ opacity: 0, y: -8, filter: "blur(8px)" }}
              transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            >
              {activePage === "Analyst Dashboard" && (
                <AnalystDashboardView
                  stockData={stockData}
                  prediction={prediction}
                  currency={currency}
                />
              )}
              {activePage === "Macro & Risk Engine" && (
                <MacroRiskEngine
                  stockData={stockData}
                  prediction={prediction}
                  currency={currency}
                  selectedAlgo={selectedAlgo}
                  selectedMarket={selectedMarket}
                  selectedTicker={selectedTicker}
                />
              )}
              {activePage === "Deep Technical Suite" && (
                <DeepTechnicalSuite stockData={stockData} />
              )}
              {activePage === "SOTA Benchmarking" && (
                <SotaBenchmarking
                  stockData={stockData}
                  prediction={prediction}
                  currency={currency}
                  selectedAlgo={selectedAlgo}
                />
              )}
              {activePage === "Backtesting Engine" && (
                <BacktestingEngine
                  selectedMarket={selectedMarket}
                  selectedTicker={selectedTicker}
                  selectedAlgo={selectedAlgo}
                />
              )}
              {activePage === "Trading Desk" && (
                <TradingDesk
                  stockData={stockData}
                  currency={currency}
                  selectedTicker={selectedTicker}
                />
              )}
              {activePage === "News-Driven Market" && (
                <NewsDrivenMarket selectedTicker={selectedTicker} selectedMarket={selectedMarket} />
              )}
            </motion.div>
          </AnimatePresence>
        </motion.div>
      </motion.div>
    </main>
  );
}

import CustomSelect from "@/components/ui/CustomSelect";

function StatBlock({ label, value, sub, delta, deltaColor }: any) {
  return (
    <div className="flex-1 min-w-[140px] p-5 border-r border-[var(--border)] last:border-r-0 flex flex-col justify-center">
      <span className="text-[9px] font-bold uppercase tracking-widest text-[var(--foreground)]/40 mb-1">{label}</span>
      <div className="font-mono text-lg font-bold">
        {value} <span className="text-[10px] text-[var(--foreground)]/40">{sub}</span>
      </div>
      {delta && <div className={`text-xs font-bold mt-0.5 ${deltaColor}`}>{delta}</div>}
    </div>
  );
}
