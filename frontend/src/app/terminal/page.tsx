"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import { AnimatePresence, motion } from "framer-motion";
import { Activity } from "lucide-react";

import MarketDataIngestion from "@/components/workflows/MarketDataIngestion";
import TechnicalIndicators from "@/components/workflows/TechnicalIndicators";
import MLPrediction from "@/components/workflows/MLPrediction";
import PortfolioOptimization from "@/components/workflows/PortfolioOptimization";
import RiskAnalytics from "@/components/workflows/RiskAnalytics";
import Backtesting from "@/components/workflows/Backtesting";

// Pulls in three.js/@react-three/fiber/drei (globe) - only load it when a news/macro
// tab is actually opened instead of bundling it into every terminal page load.
const NewsDrivenMarket = dynamic(() => import("@/components/features/NewsDrivenMarket"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full min-h-[480px] flex items-center justify-center text-outline font-label-sm text-[10px] uppercase tracking-widest">
      Loading macro view...
    </div>
  ),
});

import CommoditiesBar from "@/components/ui/CommoditiesBar";
import CustomSelect from "@/components/ui/CustomSelect";
import WatchlistPanel from "@/components/ui/WatchlistPanel";
import ParticlePhysicsBackground from "@/components/ui/ParticlePhysicsBackground";
import { Sidebar } from "@/components/ui/Sidebar";
import { RightRail } from "@/components/ui/RightRail";
import { FloatingIsland } from "@/components/ui/FloatingIsland";

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
  "overview",
  "technical",
  "ml-prediction",
  "portfolio",
  "risk",
  "backtesting",
  "news-macro",
  "macro-globe",
  "live-news",
  "sentiment"
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

import { useAllPrices } from "@/lib/priceStore";

export default function TerminalPage() {
  const [activePage, setActivePage] = useState("overview");
  const allPrices = useAllPrices();
  const tickerKeys = Object.keys(allPrices);

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
      // The selected algo is already one of algoKeys - fetch each algo's prediction
      // exactly once (was fetching the selected one twice: once here explicitly, again
      // inside the algoKeys map) and pick the primary out of the shared results.
      const algoKeys = Object.values(ALGO_MAP);
      Promise.all([
        fetchStockData(selectedMarket, selectedTicker).catch(() => null),
        ...algoKeys.map(algo => fetchPrediction(selectedMarket, selectedTicker, algo).catch(() => null))
      ]).then(([sd, ...allPrs]) => {
        if (!active) return;
        if (sd) setStockData(sd as any);
        const validPrs = allPrs.filter(Boolean) as PredictionResult[];
        if (validPrs.length > 0) setAllPredictions(validPrs);
        const primaryIndex = algoKeys.indexOf(ALGO_MAP[selectedAlgo]);
        const primaryPr = primaryIndex >= 0 ? allPrs[primaryIndex] : null;
        if (primaryPr) setPrediction(primaryPr as any);
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
  const globalPrice = allPrices[selectedTicker];
  const pctChange = globalPrice ? globalPrice.pct_change : (stockData && typeof stockData.pct_change === "number" && !isNaN(stockData.pct_change)) ? stockData.pct_change : 0;
  const latestClose = globalPrice ? globalPrice.price : (stockData && typeof stockData.latest_close === "number" && !isNaN(stockData.latest_close)) ? stockData.latest_close : 0;
  const volatility = (stockData && typeof stockData.volatility === "number" && !isNaN(stockData.volatility)) ? stockData.volatility : 0;
  const vwap = (stockData && typeof stockData.vwap === "number" && !isNaN(stockData.vwap)) ? stockData.vwap : 0;
  const imbalance = stockData ? Math.min(85, Math.max(30, 50 + (pctChange * 10))) : 50;

  return (
    <div className="flex h-screen w-full overflow-hidden font-body-md text-on-background bg-background">
      {/* Particle Animated Background */}
      <ParticlePhysicsBackground />

      <Sidebar activeTab={activePage} onTabSelect={setActivePage} />
      <FloatingIsland activeTab={activePage} onTabSelect={setActivePage} />

      <main data-lenis-prevent="true" className="flex-1 min-w-0 h-full flex flex-col relative z-10 hide-scrollbar bg-transparent pb-[80px] md:pb-0">
        {/* Top Header */}
        <header className="shrink-0 w-full px-4 md:px-8 pt-4 pb-2 bg-surface-container/90 border-b border-outline-variant/30 z-50 scroll-surface">
          <div className="max-w-[1200px] mx-auto flex justify-between items-center">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-stack-sm px-4 py-2 bg-surface-container rounded border border-outline-variant/50 backdrop-blur-md shadow-xl hover:scale-105 transition-transform pointer-events-auto z-50 relative">
              <span className="font-display-md font-bold text-xl tracking-tight text-on-surface">
                NEXUS
              </span>
            </Link>
            {/* Navigation Links */}
            <nav className="flex items-center gap-gutter">
              <div className="hidden md:flex items-center gap-unit px-3 py-1.5 rounded bg-surface-container border border-outline-variant/30">
                <div className={`w-2 h-2 rounded-full ${loading ? "bg-amber-400" : "bg-secondary"} live-indicator`} />
                <span className="font-label-sm text-[10px] tracking-wider uppercase text-outline">{loading ? "Syncing..." : "Online"}</span>
              </div>
              <a href="/" className="px-stack-sm py-1.5 font-label-sm text-[10px] uppercase tracking-[0.15em] text-outline hover:text-on-surface transition-colors border border-outline-variant/30 rounded hover:bg-surface-variant">
                Exit Terminal
              </a>
            </nav>
          </div>
        </header>

        {/* Market Ticker Ribbon */}
        <motion.div
          variants={tickerVariants}
          initial="hidden"
          animate="visible"
          className="w-full overflow-hidden py-unit border-b border-outline-variant/30 bg-[#08080a] z-40 relative shrink-0"
        >
          <div className="flex w-max animate-marquee marquee-track">
            {[0, 1].map((copy) => (
              <div key={copy} className="flex gap-gutter px-gutter font-label-sm text-[11px] font-mono tracking-widest text-outline uppercase">
                {tickerKeys.map((ticker, i) => {
                  const item = allPrices[ticker];
                  return (
                    <motion.span
                      key={`${copy}-${ticker}`}
                      className="flex items-center gap-unit"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.5 + i * 0.03, duration: 0.3 }}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full ${item.pct_change >= 0 ? 'bg-[var(--profit)]' : 'bg-[var(--loss)]'} inline-block`} />
                      <span className="text-white font-bold">{ticker}</span>
                      <span className="text-neutral-500">{item.price.toFixed(2)}</span>
                      <span className={item.pct_change >= 0 ? 'text-[var(--profit)]' : 'text-[var(--loss)]'}>
                        {item.pct_change > 0 ? "+" : ""}{item.pct_change.toFixed(2)}%
                      </span>
                    </motion.span>
                  );
                })}
              </div>
            ))}
          </div>
        </motion.div>

        {/* Scrollable Main Content */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden hide-scrollbar relative">
          <div className="w-full max-w-[1200px] mx-auto px-4 md:px-8 lg:px-12 py-8 flex flex-col gap-[20px]">
            
            {/* Always Visible Sections */}
          {activePage === "overview" && (
            <div className="max-w-4xl pt-4">
              <h2 className="font-display-lg text-display-lg-mobile md:text-display-lg text-on-surface leading-tight mb-stack-lg tracking-tight">
                Institutional Quantitative Intelligence
              </h2>
              <p className="font-body-lg text-body-lg text-on-surface-variant max-w-2xl leading-relaxed">
                Nexus Quant synthesizes global macroeconomic data, real-time liquidity flow, and state-of-the-art neural networks into a singular, highly responsive interface.
              </p>
            </div>
          )}

          <div className="font-label-sm text-label-sm text-outline uppercase tracking-widest mt-stack-md mb-stack-xs">Global Liquidity Nodes</div>
          <CommoditiesBar />
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-stack-sm relative z-40 bg-surface-container border border-outline-variant/30 rounded p-stack-md">
            <CustomSelect label="Global Node" value={selectedMarket} options={marketNames} onChange={(v) => setSelectedMarket(v)} />
            <CustomSelect label="Target Asset" value={selectedTicker} options={tickers} onChange={(v) => setSelectedTicker(v)} />
            <CustomSelect label="AI Architecture" value={selectedAlgo} options={algos} onChange={(v) => setSelectedAlgo(v)} />
            <CustomSelect label="Execution Routing" value="Dark Pool Aggregator" options={["Dark Pool Aggregator", "Smart Order Router", "TWAP Engine"]} onChange={() => {}} />
            <div className="p-stack-sm rounded border border-outline-variant/30 bg-[#08080a] flex flex-col justify-center">
              <div className="flex items-center gap-unit mb-1">
                <div className={`w-2 h-2 rounded-full ${loading ? "bg-amber-400" : "bg-secondary"} live-indicator`} />
                <span className="font-label-sm text-[10px] tracking-wider uppercase text-outline">{loading ? "Syncing Network..." : "Compute Online"}</span>
              </div>
              <div className="flex justify-between font-label-sm text-[10px] font-mono text-on-surface-variant">
                <span>LAT: {loading ? "..." : "12ms"}</span>
                <span>GPU: A100</span>
              </div>
            </div>
          </div>

          <div className="flex flex-col lg:flex-row gap-stack-lg items-stretch bg-[#1c1d22] border border-outline-variant/30 rounded p-stack-md">
            <div className="flex-1 flex flex-col items-start gap-stack-sm w-full">
              <img src={logoError ? getFallbackLogo(selectedTicker) : getLogoUrl(selectedTicker)} onError={() => setLogoError(true)} alt={selectedTicker} className="w-24 h-24 rounded border border-outline-variant/30 object-contain bg-surface-container p-3" />
              <div>
                <h2 className="font-display-lg text-display-lg text-on-surface tracking-tighter">{selectedTicker || "—"}</h2>
                <span className="inline-block mt-unit bg-surface-container-highest text-on-surface font-label-sm text-[11px] px-2 py-1 rounded border border-outline-variant/30 uppercase">{region}</span>
              </div>
            </div>
            <div className="flex-[2] grid grid-cols-2 md:grid-cols-4 gap-stack-sm w-full">
              <StatBlock label="Valuation" value={stockData ? latestClose.toLocaleString(undefined, { minimumFractionDigits: 2 }) : "—"} sub={currency} delta={stockData ? `${pctChange >= 0 ? "+" : ""}${Number(pctChange).toFixed(2)}%` : undefined} deltaColor={stockData && pctChange >= 0 ? "text-[var(--profit)]" : "text-[var(--loss)]"} />
              <StatBlock label="Volatility" value={stockData ? `${Number(volatility).toFixed(1)}%` : "—"} sub={stockData ? `Beta: ${Number(vwap !== 0 ? volatility / 15 : 0).toFixed(2)}` : ""} />
              <StatBlock label="VWAP (20d)" value={stockData ? vwap.toLocaleString(undefined, { minimumFractionDigits: 2 }) : "—"} sub={stockData ? `Dev: ${Number(vwap !== 0 ? ((latestClose / vwap) - 1) * 100 : 0).toFixed(2)}%` : ""} />
              <div className="p-stack-sm bg-[#08080a] border border-outline-variant/30 rounded flex flex-col justify-center">
                <span className="font-label-sm text-[10px] uppercase tracking-widest text-outline mb-2">Imbalance</span>
                <div className="w-full h-1 bg-outline-variant/30 rounded-full overflow-hidden mb-1 relative">
                  <div className={`h-full rounded-full transition-all duration-700 ${imbalance > 50 ? "bg-[var(--profit)]" : "bg-[var(--loss)]"}`} style={{ width: `${imbalance}%` }} />
                </div>
                <div className="flex justify-between font-label-sm text-[10px] font-mono text-outline">
                  <span>BID {Math.round(imbalance)}%</span>
                  <span>ASK {Math.round(100 - imbalance)}%</span>
                </div>
              </div>
            </div>
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={activePage + selectedTicker}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.15, ease: [0.22, 1, 0.36, 1] }}
              className="transform-gpu flex flex-col gap-[20px]"
            >
              {activePage === "overview" && <MarketDataIngestion />}
              {activePage === "technical" && <TechnicalIndicators />}
              {activePage === "ml-prediction" && <MLPrediction />}
              {activePage === "portfolio" && <PortfolioOptimization tickers={tickers} />}
              {activePage === "risk" && <RiskAnalytics tickers={tickers} selectedMarket={selectedMarket} />}
              {activePage === "backtesting" && <Backtesting selectedMarket={selectedMarket} selectedTicker={selectedTicker} selectedAlgo={selectedAlgo} />}
              {(activePage === "news-macro" || activePage === "macro-globe" || activePage === "live-news" || activePage === "sentiment") && (
                <NewsDrivenMarket selectedTicker={selectedTicker} selectedMarket={selectedMarket} />
              )}
            </motion.div>
          </AnimatePresence>
          </div>
        </div>
      </main>

      <RightRail>
        <WatchlistPanel marketName={selectedMarket} />
      </RightRail>
    </div>
  );
}

function StatBlock({ label, value, sub, delta, deltaColor }: any) {
  return (
    <div className="p-stack-sm bg-[#08080a] border border-outline-variant/30 rounded flex flex-col justify-center">
      <span className="font-label-sm text-[10px] uppercase tracking-widest text-outline mb-1">{label}</span>
      <div className="font-headline-lg font-mono text-on-surface">
        {value} <span className="font-label-sm text-[11px] text-outline ml-1">{sub}</span>
      </div>
      {delta && <div className={`font-label-sm text-[12px] mt-1 ${deltaColor}`}>{delta}</div>}
    </div>
  );
}
