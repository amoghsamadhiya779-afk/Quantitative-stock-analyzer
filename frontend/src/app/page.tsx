"use client";

import React, { useRef, useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { Canvas } from "@react-three/fiber";

import {
  BacktestModel,
  RiskModel,
  PortfolioModel,
  MLModel,
  IndicatorModel,
  NewsModel,
} from "@/components/ui/FeatureModels";
import { ScrollManager } from "@/lib/ScrollManager";
import { CursorProvider } from "@/components/providers/CursorProvider";

// Live Workflow components for the Terminal Section
import MarketDataIngestion from "@/components/workflows/MarketDataIngestion";
import TechnicalIndicators from "@/components/workflows/TechnicalIndicators";
import MLPrediction from "@/components/workflows/MLPrediction";
import PortfolioOptimization from "@/components/workflows/PortfolioOptimization";
import RiskAnalytics from "@/components/workflows/RiskAnalytics";
import Backtesting from "@/components/workflows/Backtesting";

import CommoditiesBar from "@/components/ui/CommoditiesBar";
import CustomSelect from "@/components/ui/CustomSelect";
import CosmoqBackground from "@/components/ui/CosmoqBackground";

import {
  fetchMarkets,
  fetchTickers,
  fetchStockData,
  fetchPrediction,
  type MarketInfo,
  type StockData,
  type PredictionResult,
} from "@/lib/api";

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

const ALGO_MAP: Record<string, string> = {
  "Quantum CNN-Attention Engine (Max Yield)": "CNN_BiLSTM_Attention",
  "Temporal Transformer Model (Robust)": "TimeSeriesTransformer",
  "Advanced BiLSTM Layer (Balanced)": "AdvancedBiLSTM",
};

const algos = Object.keys(ALGO_MAP);

export default function LandingPage() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  // Walkthrough State
  const [activeFeature, setActiveFeature] = useState(0);
  const platformRef = useRef<HTMLDivElement>(null);
  const scrollTriggerRef = useRef<any>(null);

  // Terminal Workspace State (Interactive Section)
  const [markets, setMarkets] = useState<Record<string, MarketInfo>>({});
  const [marketNames, setMarketNames] = useState<string[]>([]);
  const [selectedMarket, setSelectedMarket] = useState("");
  const [tickers, setTickers] = useState<string[]>([]);
  const [selectedTicker, setSelectedTicker] = useState("");
  const [selectedAlgo, setSelectedAlgo] = useState(algos[0]);
  const [stockData, setStockData] = useState<StockData | null>(null);
  const [prediction, setPrediction] = useState<PredictionResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTerminalTab, setActiveTerminalTab] = useState("Market data ingestion");

  const [booting, setBooting] = useState(false);
  const [revealing, setRevealing] = useState(false);

  const features = useMemo(
    () => [
      {
        id: 0,
        name: "Market data ingestion",
        title: "Market Data Ingestion",
        description:
          "Ingest and parse raw trade ticks, order book dynamics, and liquidity updates instantly from global nodes with microsecond precision.",
        model: <NewsModel />,
      },
      {
        id: 1,
        name: "Technical indicators",
        title: "Technical Indicator Suite",
        description:
          "Generate momentum, volatility, and trend indicators in real-time, matching institutional trading desk specifications.",
        model: <IndicatorModel />,
      },
      {
        id: 2,
        name: "ML prediction",
        title: "Neural Predictions",
        description:
          "Employ CNN-BiLSTM networks and spatial attention layers to generate statistically sound directional probability bounds.",
        model: <MLModel />,
      },
      {
        id: 3,
        name: "Portfolio optimization",
        title: "Portfolio Optimization",
        description:
          "Run robust covariance calculations and Sharpe ratio optimizations to reallocate capital dynamically and protect margins.",
        model: <PortfolioModel />,
      },
      {
        id: 4,
        name: "Risk analytics",
        title: "Systemic Risk Analytics",
        description:
          "Measure systemic beta exposures, portfolio Value-at-Risk (VaR), and regime correlations before they impact your balance sheet.",
        model: <RiskModel />,
      },
      {
        id: 5,
        name: "Backtesting",
        title: "Algorithmic Backtesting",
        description:
          "Simulate complex algorithms over historical decades, accounting for bid-ask spread slippage, fees, and sudden liquidity gaps.",
        model: <BacktestModel />,
      },
    ],
    []
  );

  const tabs = useMemo(
    () => [
      "Market data ingestion",
      "Technical indicators",
      "ML prediction",
      "Portfolio optimization",
      "Risk analytics",
      "Backtesting",
    ],
    []
  );

  // Initialize GSAP Walkthrough Pinning
  useEffect(() => {
    setMounted(true);
    ScrollManager.init();

    if (platformRef.current) {
      const trigger = ScrollManager.createWalkthroughTrigger(
        platformRef.current,
        (index) => {
          setActiveFeature(index);
        },
        6
      );
      scrollTriggerRef.current = trigger;
    }

    return () => {
      if (scrollTriggerRef.current) {
        scrollTriggerRef.current.kill();
      }
    };
  }, []);

  // API Loaders for the Interactive Terminal Zone
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
          "United States (S&P 500)": {
            index_key: "SP500",
            stock_file: "SP500_DATASET.csv",
            region: "North America",
            currency: "USD",
          },
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
    let active = true;

    const fetchData = () => {
      Promise.all([
        fetchStockData(selectedMarket, selectedTicker).catch(() => null),
        fetchPrediction(selectedMarket, selectedTicker, ALGO_MAP[selectedAlgo]).catch(() => null),
      ]).then(([sd, pred]) => {
        if (!active) return;
        if (sd) setStockData(sd);
        if (pred) setPrediction(pred);
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

  const handleFeatureClick = (index: number) => {
    setActiveFeature(index);
    const tabName = features[index]?.name;
    if (tabName) {
      setActiveTerminalTab(tabName);
    }
    if (scrollTriggerRef.current) {
      ScrollManager.scrollToStep(scrollTriggerRef.current, index, 6);
    }
  };

  const handleTabClick = (tab: string) => {
    setActiveTerminalTab(tab);
    const idx = features.findIndex((f) => f.name === tab);
    if (idx !== -1) {
      setActiveFeature(idx);
      if (scrollTriggerRef.current) {
        ScrollManager.scrollToStep(scrollTriggerRef.current, idx, 6);
      }
    }
  };

  const renderActiveWorkflow = () => {
    switch (activeTerminalTab) {
      case "Market data ingestion":
        return <MarketDataIngestion />;
      case "Technical indicators":
        return <TechnicalIndicators />;
      case "ML prediction":
        return <MLPrediction />;
      case "Portfolio optimization":
        return <PortfolioOptimization tickers={tickers} />;
      case "Risk analytics":
        return <RiskAnalytics tickers={tickers} selectedMarket={selectedMarket} />;
      case "Backtesting":
        return (
          <Backtesting
            selectedMarket={selectedMarket}
            selectedTicker={selectedTicker}
            selectedAlgo={selectedAlgo}
          />
        );
      default:
        return <MarketDataIngestion />;
    }
  };

  const market = markets[selectedMarket];
  const currency = market?.currency || "USD";
  const pctChange = stockData && typeof stockData.pct_change === "number" ? stockData.pct_change : 0;
  const latestClose = stockData && typeof stockData.latest_close === "number" ? stockData.latest_close : 0;
  const volatility = stockData && typeof stockData.volatility === "number" ? stockData.volatility : 0;
  const vwap = stockData && typeof stockData.vwap === "number" ? stockData.vwap : 0;
  const imbalance = stockData ? Math.min(85, Math.max(30, 50 + pctChange * 10)) : 50;

  if (!mounted) return null;

  return (
    <CursorProvider>
      <div className="relative bg-[#05060A] text-white overflow-x-hidden min-h-screen">
        <CosmoqBackground />

        {/* Header navigation element */}
        <header className="sticky top-0 z-50 w-full bg-black/40 backdrop-blur-md border-b border-white/5">
          <div className="max-w-[1200px] mx-auto px-6 py-4 flex justify-between items-center">
            <div className="flex items-center gap-3">
              <span className="font-display font-bold text-2xl tracking-tight text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.2)]">
                NEXUS QUANT
              </span>
            </div>
            <nav className="hidden md:flex items-center gap-6">
              <a
                href="#platform"
                onClick={(e) => {
                  e.preventDefault();
                  ScrollManager.scrollToElement("platform");
                }}
                className="text-xs font-semibold uppercase tracking-wider text-neutral-400 hover:text-white transition-colors"
              >
                Platform
              </a>
              <a
                href="#research"
                onClick={(e) => {
                  e.preventDefault();
                  ScrollManager.scrollToElement("research");
                }}
                className="text-xs font-semibold uppercase tracking-wider text-neutral-400 hover:text-white transition-colors"
              >
                Research
              </a>
              <a
                href="#technology"
                onClick={(e) => {
                  e.preventDefault();
                  ScrollManager.scrollToElement("technology");
                }}
                className="text-xs font-semibold uppercase tracking-wider text-neutral-400 hover:text-white transition-colors"
              >
                Technology
              </a>
              <a
                href="#documentation"
                onClick={(e) => {
                  e.preventDefault();
                  ScrollManager.scrollToElement("documentation");
                }}
                className="text-xs font-semibold uppercase tracking-wider text-neutral-400 hover:text-white transition-colors"
              >
                Documentation
              </a>
              <a
                href="#github"
                onClick={(e) => {
                  e.preventDefault();
                  ScrollManager.scrollToElement("github");
                }}
                className="text-xs font-semibold uppercase tracking-wider text-neutral-400 hover:text-white transition-colors"
              >
                GitHub
              </a>
              <a
                href="#launch-terminal"
                onClick={(e) => {
                  e.preventDefault();
                  router.push("/terminal");
                }}
                className="text-xs font-semibold uppercase tracking-wider text-cyan-400 hover:text-cyan-300 transition-colors"
              >
                Launch Terminal
              </a>
            </nav>
            <div>
              <button
                onClick={() => router.push("/terminal")}
                className="px-5 py-2 rounded-full bg-white text-black font-semibold text-xs hover:bg-neutral-200 transition-all"
              >
                Terminal
              </button>
            </div>
          </div>
        </header>

        {/* Main content wrapper */}
        <main className="bg-luxury-black min-h-screen text-white relative">
          <div className="max-w-[1200px] mx-auto px-6 py-12 flex flex-col gap-24">
            
            {/* 1. Hero Section */}
            <section className="min-h-[70vh] flex flex-col items-center justify-center text-center py-20 relative z-10">
              <span className="text-xs uppercase font-mono text-cyan-400 tracking-wider mb-6 bg-white/5 border border-white/10 px-4 py-1.5 rounded-full backdrop-blur-md">
                Institutional Quantitative Intelligence
              </span>
              <h2 className="text-5xl md:text-7xl font-extrabold tracking-tight max-w-4xl leading-[1.1] mb-6 drop-shadow-2xl">
                Institutional Quantitative Intelligence
              </h2>
              <p className="text-lg md:text-xl text-neutral-300 max-w-3xl leading-relaxed mb-10">
                Nexus Quant synthesizes raw market ticks, systemic beta variables, and custom directional neural networks into a microsecond-synchronized platform.
              </p>
              <div className="flex gap-4">
                <button
                  onClick={() => router.push("/terminal")}
                  className="px-8 py-4 rounded-full bg-white text-black font-bold text-sm hover:bg-neutral-200 transition-all shadow-[0_0_30px_rgba(255,255,255,0.15)]"
                >
                  Start Live Sandbox
                </button>
                <button
                  onClick={() => router.push("/terminal")}
                  className="px-8 py-4 rounded-full border border-white/20 bg-black/40 backdrop-blur-md text-white font-bold text-sm hover:bg-white hover:text-black transition-all"
                >
                  Dedicated Console
                </button>
              </div>
            </section>

            {/* 2. Infinite Partner Marquee */}
            <div className="rounded-[24px] overflow-hidden border border-white/10 bg-black/40 py-6 relative z-10">
              <div className="flex w-[200%] animate-marquee">
                <div className="flex justify-around w-1/2 items-center text-sm font-bold text-neutral-400 font-mono tracking-widest uppercase">
                  <span>Yahoo Finance</span>
                  <span>Polygon</span>
                  <span>Finnhub</span>
                  <span>Alpha Vantage</span>
                  <span>NASDAQ</span>
                  <span>NSE</span>
                  <span>TradingView</span>
                </div>
                <div className="flex justify-around w-1/2 items-center text-sm font-bold text-neutral-400 font-mono tracking-widest uppercase">
                  <span>Yahoo Finance</span>
                  <span>Polygon</span>
                  <span>Finnhub</span>
                  <span>Alpha Vantage</span>
                  <span>NASDAQ</span>
                  <span>NSE</span>
                  <span>TradingView</span>
                </div>
              </div>
            </div>

            {/* 3. Pinned Walkthrough Section */}
            <div
              id="platform"
              ref={platformRef}
              className="w-full min-h-screen py-24 flex items-center justify-between gap-8 relative z-20"
            >
              {/* Left Column: Three.js Canvas & Active Feature text overlay */}
              <div className="w-[30%] h-[600px] relative rounded-[32px] border border-white/10 bg-black/40 backdrop-blur-md p-8 flex flex-col justify-between overflow-hidden">
                <div className="absolute inset-0 z-0 opacity-80 pointer-events-auto">
                  <Canvas camera={{ position: [0, 0, 5], fov: 45 } as any}>
                    <ambientLight intensity={0.5} />
                    <pointLight position={[10, 10, 10]} intensity={1} />
                    {activeFeature === 0 && <NewsModel />}
                    {activeFeature === 1 && <IndicatorModel />}
                    {activeFeature === 2 && <MLModel />}
                    {activeFeature === 3 && <PortfolioModel />}
                    {activeFeature === 4 && <RiskModel />}
                    {activeFeature === 5 && <BacktestModel />}
                  </Canvas>
                </div>

                <div className="relative z-10 flex flex-col justify-between h-full pointer-events-none">
                  <div>
                    <span className="text-[10px] font-mono tracking-widest text-cyan-400 uppercase bg-black/50 p-2 rounded">
                      ACTIVE NODE PIPELINE
                    </span>
                  </div>
                  <div>
                    <h3 className="text-2xl font-display font-bold text-white mb-2 drop-shadow-lg">
                      {features[activeFeature].title}
                    </h3>
                    <p className="text-xs text-neutral-300 leading-relaxed max-w-md bg-black/60 backdrop-blur-sm p-4 rounded-xl border border-white/5">
                      {features[activeFeature].description}
                    </p>
                  </div>
                </div>
              </div>

              {/* Middle Column: Live Component Preview Window */}
              <div className="w-[45%] h-[600px] rounded-[32px] border border-white/10 bg-black/60 backdrop-blur-2xl shadow-2xl overflow-hidden flex flex-col pointer-events-none">
                {/* Live Component Container */}
                <div className="relative flex-1 w-full overflow-hidden bg-[#0a0a0a] p-6">
                  <AnimatePresence mode="wait">
                    <motion.div 
                      key={activeFeature}
                      initial={{ opacity: 0, scale: 0.95, y: 10 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 1.05, y: -10 }}
                      transition={{ type: "spring", stiffness: 300, damping: 30 }}
                      className="w-full h-full transform-gpu origin-top"
                      style={{ transform: "scale(0.9)" }} 
                    >
                      {renderActiveWorkflow()}
                    </motion.div>
                  </AnimatePresence>
                </div>
              </div>

              {/* Right Column: Interactive Step Buttons */}
              <div className="w-[25%] flex flex-col gap-3">
                <div className="text-[10px] uppercase tracking-[0.2em] font-semibold text-neutral-400 mb-2">
                  System Pipeline Modules
                </div>
                {features.map((feat, i) => (
                  <div
                    key={feat.id}
                    role="button"
                    tabIndex={0}
                    onClick={() => handleFeatureClick(i)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        handleFeatureClick(i);
                      }
                    }}
                    className={`flex items-center justify-between p-4 rounded-[16px] border transition-all text-left cursor-pointer select-none focus:outline-none focus:ring-2 focus:ring-cyan-500 ${
                      activeFeature === i
                        ? "bg-white text-black border-white shadow-[0_0_30px_rgba(255,255,255,0.15)]"
                        : "bg-white/5 text-white border-white/10 hover:bg-white/10 hover:border-white/20"
                    }`}
                  >
                    <div>
                      <span className="text-[10px] font-mono opacity-50 block mb-1">
                        MODULE 0{i + 1}
                      </span>
                      <span className="text-sm font-bold">{feat.name}</span>
                    </div>
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center border font-mono ${
                        activeFeature === i
                          ? "border-black/20 text-black bg-black/5"
                          : "border-white/20 text-white bg-white/5"
                      }`}
                    >
                      →
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* 4. Research Section */}
            <section id="research" className="py-20 border-t border-white/5 z-10">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
                <div>
                  <span className="text-xs uppercase font-mono text-cyan-400 tracking-wider">
                    Research Division
                  </span>
                  <h2 className="text-4xl font-display font-bold mt-2 mb-6">
                    Neural Predictors & Spatial Attention
                  </h2>
                  <p className="text-neutral-400 leading-relaxed mb-6">
                    Our quant researchers utilize spatial attention layers alongside combined
                    CNN-BiLSTM networks. By employing Huber Loss and Spatial Dropout, we protect
                    forecasts against fat-tail events and extreme regime shifts.
                  </p>
                  <div className="grid grid-cols-2 gap-6">
                    <div className="p-4 rounded-xl border border-white/5 bg-white/5 font-mono">
                      <div className="text-2xl font-bold text-white">Huber Loss</div>
                      <div className="text-xs text-neutral-500">Robust to outliers</div>
                    </div>
                    <div className="p-4 rounded-xl border border-white/5 bg-white/5 font-mono">
                      <div className="text-2xl font-bold text-white">Spatial Dropout</div>
                      <div className="text-xs text-neutral-500">Regime invariance</div>
                    </div>
                  </div>
                </div>
                <div className="p-8 rounded-[32px] border border-white/10 bg-white/5 backdrop-blur-md">
                  <h3 className="text-xl font-bold mb-4">Latest Whitepaper Abstract</h3>
                  <p className="text-sm text-neutral-400 leading-relaxed font-mono">
                    "By decoupling temporal feature learning from directional attention networks, we
                    show a 12% improvement in Sharpe ratio on out-of-sample backtests. The neural
                    framework incorporates real-time liquidity imbalance vectors to form dynamic
                    pricing thresholds."
                  </p>
                </div>
              </div>
            </section>

            {/* 5. Technology Section */}
            <section id="technology" className="py-20 border-t border-white/5 z-10">
              <div className="text-center max-w-3xl mx-auto mb-16">
                <span className="text-xs uppercase font-mono text-cyan-400 tracking-wider">
                  Infrastructure Stack
                </span>
                <h2 className="text-4xl font-display font-bold mt-2 mb-6">
                  Built for Microsecond Calculations
                </h2>
                <p className="text-neutral-400">
                  Highly optimized tech stack leveraging Next.js React-14 for layouts, WebGL
                  (Three.js) for 3D model visualization, and GSAP for fluid scroll timing.
                </p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="p-6 rounded-[24px] border border-white/5 bg-white/5 hover:border-cyan-500/20 transition-colors">
                  <div className="text-xl font-bold mb-2">Next.js 14</div>
                  <p className="text-sm text-neutral-400">
                    Server-rendered templates and layout caching.
                  </p>
                </div>
                <div className="p-6 rounded-[24px] border border-white/5 bg-white/5 hover:border-cyan-500/20 transition-colors">
                  <div className="text-xl font-bold mb-2">Three.js</div>
                  <p className="text-sm text-neutral-400">
                    GPU-accelerated vector and point-cloud rendering.
                  </p>
                </div>
                <div className="p-6 rounded-[24px] border border-white/5 bg-white/5 hover:border-cyan-500/20 transition-colors">
                  <div className="text-xl font-bold mb-2">GSAP & ScrollTrigger</div>
                  <p className="text-sm text-neutral-400">
                    Seamless, lightweight state and animation synchronization.
                  </p>
                </div>
                <div className="p-6 rounded-[24px] border border-white/5 bg-white/5 hover:border-cyan-500/20 transition-colors">
                  <div className="text-xl font-bold mb-2">FastAPI Backend</div>
                  <p className="text-sm text-neutral-400">
                    High-concurrency API layer driving predictions and backtests.
                  </p>
                </div>
              </div>
            </section>

            {/* 6. Documentation Section */}
            <section id="documentation" className="py-20 border-t border-white/5 z-10">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div>
                  <span className="text-xs uppercase font-mono text-cyan-400 tracking-wider">
                    Developer API
                  </span>
                  <h2 className="text-4xl font-display font-bold mt-2 mb-6">Documentation & SDK</h2>
                  <p className="text-neutral-400">
                    Access terminal stats and prediction results programmatically. Import the Nexus
                    SDK or call standard REST endpoints.
                  </p>
                </div>
                <div className="p-6 rounded-[24px] border border-white/5 bg-white/5 lg:col-span-2 font-mono text-sm overflow-x-auto">
                  <div className="flex justify-between items-center pb-4 mb-4 border-b border-white/10">
                    <span className="text-neutral-500">API Endpoint Reference</span>
                    <span className="text-green-400">POST</span>
                  </div>
                  <div className="text-neutral-300">https://api.nexusquant.app/v1/predict</div>
                  <div className="mt-4 text-xs text-neutral-500">
                    Header: Content-Type: application/json
                  </div>
                  <pre className="mt-2 text-neutral-400 bg-black/40 p-4 rounded-lg">
                    {`{
  "market_name": "United States (S&P 500)",
  "ticker": "AAPL",
  "model_type": "CNN_BiLSTM_Attention"
}`}
                  </pre>
                </div>
              </div>
            </section>

            {/* 7. GitHub Section */}
            <section id="github" className="py-20 border-t border-white/5 z-10">
              <div className="p-8 rounded-[32px] border border-white/10 bg-gradient-to-r from-neutral-900 to-black flex flex-col md:flex-row justify-between items-center gap-8">
                <div>
                  <span className="text-xs uppercase font-mono text-neutral-500">
                    Open Source Collaboration
                  </span>
                  <h2 className="text-3xl font-display font-bold mt-2 mb-4">
                    Contribute to the Nexus SDK
                  </h2>
                  <p className="text-neutral-400 max-w-xl">
                    The core model structures, indicators, and client libraries are open source.
                    Explore our GitHub repositories, report bugs, or submit pull requests.
                  </p>
                </div>
                <div>
                  <a
                    href="https://github.com"
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-2 px-8 py-4 bg-white text-black font-bold rounded-full hover:bg-neutral-200 transition-colors"
                  >
                    View on GitHub
                  </a>
                </div>
              </div>
            </section>

            {/* 8. Live Terminal Workspace Section */}
            <div id="launch-terminal" className="pt-24 border-t border-white/5 z-20">
              <div className="text-center max-w-3xl mx-auto mb-12">
                <span className="text-xs uppercase font-mono text-cyan-400 tracking-wider">
                  Interface Console
                </span>
                <h2 className="text-4xl font-display font-bold mt-2 mb-4">Interactive Quant Terminal</h2>
                <p className="text-neutral-400">
                  Test predictions, analyze technical indicators, and simulate portfolios live.
                  Change inputs below to query our active inference nodes.
                </p>
              </div>

              <div className="cosmoq-card p-6 md:p-8 flex flex-col gap-6 bg-black/60 border border-white/10 rounded-[32px]">
                
                {/* Terminal Tickers Ribbon */}
                <div className="w-full overflow-hidden py-2.5 border-b border-white/5 bg-black/30 backdrop-blur-sm z-30 relative shrink-0 rounded-lg">
                  <div className="flex w-max animate-marquee">
                    {[0, 1].map((copy) => (
                      <div
                        key={copy}
                        className="flex gap-12 px-6 text-xs font-mono tracking-widest text-neutral-400 uppercase"
                      >
                        {TICKER_DATA.map((item) => (
                          <span
                            key={`${copy}-${item.name}`}
                            className="flex items-center gap-2"
                          >
                            <span
                              className={`w-1.5 h-1.5 rounded-full ${
                                item.pos ? "bg-[var(--profit)]" : "bg-[var(--loss)]"
                              } inline-block`}
                            />
                            <span className="text-white font-bold">{item.name}</span>
                            <span className="text-neutral-500">${item.price}</span>
                            <span
                              className={
                                item.pos ? "text-[var(--profit)]" : "text-[var(--loss)]"
                              }
                            >
                              {item.change}
                            </span>
                          </span>
                        ))}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Dropdowns controls */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 relative z-40">
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
                    options={["Dark Pool Aggregator", "Smart Order Router", "TWAP Engine"]}
                    onChange={() => {}}
                  />
                  <div className="p-4 rounded-[20px] border border-white/5 bg-white/5 flex flex-col justify-center">
                    <div className="flex items-center gap-2 mb-1">
                      <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                      <span className="text-[10px] font-semibold tracking-wider uppercase text-neutral-400">
                        Compute Online
                      </span>
                    </div>
                    <div className="flex justify-between text-[10px] font-mono text-neutral-500">
                      <span>LAT: 12ms</span>
                      <span>GPU: A100</span>
                    </div>
                  </div>
                </div>

                {/* Stats Blocks */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 w-full">
                  <div className="p-5 border border-white/5 bg-white/5 rounded-xl flex flex-col justify-center">
                    <span className="text-[10px] font-semibold uppercase tracking-widest text-[#A0A0AC] mb-2">
                      Valuation
                    </span>
                    <div className="font-mono text-2xl font-bold text-white">
                      {stockData
                        ? latestClose.toLocaleString(undefined, { minimumFractionDigits: 2 })
                        : "—"}
                      <span className="text-xs text-neutral-500 ml-1">{currency}</span>
                    </div>
                    {stockData && (
                      <div
                        className={`text-sm font-bold mt-1 ${
                          pctChange >= 0 ? "text-[var(--profit)]" : "text-[var(--loss)]"
                        }`}
                      >
                        {pctChange >= 0 ? "+" : ""}
                        {pctChange.toFixed(2)}%
                      </div>
                    )}
                  </div>

                  <div className="p-5 border border-white/5 bg-white/5 rounded-xl flex flex-col justify-center">
                    <span className="text-[10px] font-semibold uppercase tracking-widest text-[#A0A0AC] mb-2">
                      Volatility
                    </span>
                    <div className="font-mono text-2xl font-bold text-white">
                      {stockData ? `${volatility.toFixed(2)}%` : "—"}
                    </div>
                    <span className="text-[10px] font-mono text-neutral-500 mt-1">
                      {stockData ? `Beta: ${(volatility / 15).toFixed(2)}` : ""}
                    </span>
                  </div>

                  <div className="p-5 border border-white/5 bg-white/5 rounded-xl flex flex-col justify-center">
                    <span className="text-[10px] font-semibold uppercase tracking-widest text-[#A0A0AC] mb-2">
                      VWAP (20d)
                    </span>
                    <div className="font-mono text-2xl font-bold text-white">
                      {stockData ? vwap.toLocaleString(undefined, { minimumFractionDigits: 2 }) : "—"}
                    </div>
                    <span className="text-[10px] font-mono text-neutral-500 mt-1">
                      {stockData && vwap !== 0
                        ? `Dev: ${(((latestClose / vwap) - 1) * 100).toFixed(2)}%`
                        : ""}
                    </span>
                  </div>

                  <div className="p-5 border border-white/5 bg-white/5 rounded-xl flex flex-col justify-center">
                    <span className="text-[10px] font-semibold uppercase tracking-widest text-[#A0A0AC] mb-3">
                      Imbalance
                    </span>
                    <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden mb-2 relative">
                      <div
                        className={`h-full rounded-full transition-all duration-700 ${
                          imbalance > 50 ? "bg-[var(--profit)]" : "bg-[var(--loss)]"
                        }`}
                        style={{ width: `${imbalance}%` }}
                      />
                    </div>
                    <div className="flex justify-between text-[10px] font-mono font-medium text-[#A0A0AC]">
                      <span>BID {Math.round(imbalance)}%</span>
                      <span>ASK {Math.round(100 - imbalance)}%</span>
                    </div>
                  </div>
                </div>

                {/* Terminal Tab Selector */}
                <div className="flex border-b border-white/10 overflow-x-auto hide-scrollbar gap-2">
                  {tabs.map((tab) => (
                    <button
                      key={tab}
                      onClick={() => handleTabClick(tab)}
                      className={`px-4 py-2 border-b-2 font-semibold text-xs whitespace-nowrap transition-colors uppercase tracking-wider ${
                        activeTerminalTab === tab
                          ? "border-cyan-400 text-cyan-400"
                          : "border-transparent text-neutral-400 hover:text-white"
                      }`}
                    >
                      {tab}
                    </button>
                  ))}
                </div>

                {/* Active Page Viewport Rendering the Active Component */}
                <div className="min-h-[400px] border border-white/5 bg-[#05060A]/80 rounded-[20px] p-6 relative overflow-hidden flex flex-col justify-between">
                  {loading ? (
                    <div className="flex-1 flex flex-col items-center justify-center gap-3">
                      <div className="w-8 h-8 rounded-full border-2 border-cyan-400 border-t-transparent animate-spin" />
                      <span className="text-xs text-neutral-500 font-mono">
                        SYNCING TERMINAL DATA...
                      </span>
                    </div>
                  ) : (
                    renderActiveWorkflow()
                  )}
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* Gateway Overlay sequence */}
      <AnimatePresence>
        {booting && (
          <div className="fixed inset-0 bg-black z-[100] flex flex-col items-center justify-center overflow-hidden">
            <motion.div
              key="boot-sequence"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0, scale: 0.9, filter: "blur(10px)" }}
              className="flex flex-col items-start font-mono text-cyan-400 text-lg sm:text-2xl gap-4 max-w-3xl w-[90%] z-10 drop-shadow-[0_0_10px_rgba(34,211,238,0.5)]"
            >
              <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }}>
                $ nexus-core --boot
              </motion.div>
              <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.6 }}>
                {">"} Loading Neural Weights... [OK]
              </motion.div>
              <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 1.0 }}>
                {">"} Syncing Global Market Feeds... [OK]
              </motion.div>
              <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 1.4 }}>
                {">"} Handshake Established.
              </motion.div>
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 1.8 }}
                onAnimationComplete={() => {
                  setTimeout(() => {
                    setRevealing(true);
                  }, 400);
                }}
              >
                {">"} Routing to Interface...
              </motion.div>
            </motion.div>
          </div>
        )}

        {revealing && (
          <div className="fixed inset-0 bg-black z-[110] flex items-center justify-center">
            <motion.div
              key="hyper-reveal"
              initial={{ scale: 0, opacity: 0, rotateX: 45 }}
              animate={{ scale: 1, opacity: 1, rotateX: 0 }}
              transition={{ type: "spring", stiffness: 100, damping: 20, duration: 1.5 }}
              onAnimationComplete={() => {
                setTimeout(() => {
                  router.push("/terminal");
                }, 200);
              }}
              className="w-[90vw] h-[90vh] bg-[#0a0a0a] rounded-[40px] border-[2px] border-cyan-500/50 shadow-[0_0_100px_rgba(34,211,238,0.6)] overflow-hidden flex flex-col z-50"
            >
              <div className="w-full h-16 border-b border-white/10 flex items-center px-8 gap-4 bg-white/5">
                <div className="w-8 h-8 rounded bg-cyan-500/20 animate-pulse" />
                <div className="w-32 h-4 rounded bg-white/10 animate-pulse" />
                <div className="flex-1" />
                <div className="w-12 h-4 rounded bg-white/10 animate-pulse" />
                <div className="w-12 h-4 rounded bg-white/10 animate-pulse" />
                <div className="w-12 h-4 rounded bg-white/10 animate-pulse" />
              </div>
              <div className="flex-1 flex p-8 gap-8">
                <div className="w-1/4 h-full rounded-2xl bg-white/5 animate-pulse delay-75" />
                <div className="w-1/2 h-full rounded-2xl bg-white/5 animate-pulse delay-150" />
                <div className="w-1/4 h-full rounded-2xl bg-white/5 animate-pulse delay-200" />
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </CursorProvider>
  );
}
