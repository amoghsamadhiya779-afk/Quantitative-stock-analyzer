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
import ParticlePhysicsBackground from "@/components/ui/ParticlePhysicsBackground";

import {
  fetchMarkets,
  fetchTickers,
  fetchStockData,
  fetchPrediction,
  type MarketInfo,
  type StockData,
  type PredictionResult,
} from "@/lib/api";

import { useAllPrices } from "@/lib/priceStore";

const ALGO_MAP: Record<string, string> = {
  "Quantum CNN-Attention Engine (Max Yield)": "CNN_BiLSTM_Attention",
  "Temporal Transformer Model (Robust)": "TimeSeriesTransformer",
  "Advanced BiLSTM Layer (Balanced)": "AdvancedBiLSTM",
};

const algos = Object.keys(ALGO_MAP);

export default function LandingPage() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const allPrices = useAllPrices();
  const tickerKeys = Object.keys(allPrices);

  // Walkthrough State
  const [activeFeature, setActiveFeature] = useState(0);
  const platformRef = useRef<HTMLDivElement>(null);
  const scrollTriggerRef = useRef<any>(null);

  // Hyper-zoom transition state
  const [isZoomingToTerminal, setIsZoomingToTerminal] = useState(false);

  const handleLaunchTerminal = () => {
    setIsZoomingToTerminal(true);
    // 600ms perfectly aligns with the framer motion transition
    setTimeout(() => {
      router.push("/terminal");
    }, 600);
  };

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

  // Auto-play Slideshow for Walkthrough
  useEffect(() => {
    const interval = setInterval(() => {
      setActiveFeature((prev) => {
        const next = (prev + 1) % features.length;
        const tabName = features[next]?.name;
        if (tabName) {
          setActiveTerminalTab(tabName);
        }
        if (scrollTriggerRef.current) {
          ScrollManager.scrollToStep(scrollTriggerRef.current, next, 6);
        }
        return next;
      });
    }, 2500);

    return () => clearInterval(interval);
  }, []);

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
      <div className="relative bg-background text-on-background overflow-x-hidden min-h-screen font-body-md">
        <ParticlePhysicsBackground />

        {/* HYPER-ZOOM OVERLAY */}
        <AnimatePresence>
          {isZoomingToTerminal && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
              style={{ willChange: "transform, opacity" }}
              className="fixed inset-0 z-[100] bg-background flex flex-col transform-gpu pointer-events-none"
            >
              <ParticlePhysicsBackground />
              <header className="shrink-0 w-full px-4 md:px-8 pt-4 pb-2 bg-surface-container/50 backdrop-blur-xl border-b border-outline-variant/30 z-50">
                <div className="max-w-[1200px] mx-auto flex justify-between items-center opacity-50">
                  <div className="flex items-center gap-stack-sm px-4 py-2 bg-surface-container rounded border border-outline-variant/50">
                    <span className="font-display-md font-bold text-xl tracking-tight text-on-surface">NEXUS</span>
                  </div>
                  <div className="hidden md:flex items-center gap-unit px-3 py-1.5 rounded bg-surface-container border border-outline-variant/30">
                    <div className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                    <span className="font-label-sm text-[10px] tracking-wider uppercase text-outline">Syncing...</span>
                  </div>
                </div>
              </header>
              <div className="flex-1 w-full flex items-center justify-center">
                <motion.div 
                  initial={{ opacity: 0, scale: 0.9 }} 
                  animate={{ opacity: 1, scale: 1 }} 
                  transition={{ delay: 0.1, duration: 0.5, ease: "easeOut" }}
                  className="w-16 h-16 border-4 border-secondary/20 border-t-secondary rounded-full animate-spin" 
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Header navigation element */}
        <header className="sticky top-0 z-50 w-full bg-surface-container/50 backdrop-blur-xl border-b border-outline-variant/30 flex justify-between items-center px-margin-desktop h-16">
          <div className="flex items-center gap-gutter">
            <span className="font-display-md text-display-md font-bold text-on-surface">
              Nexus Quant
            </span>
            <nav className="hidden md:flex gap-gutter ml-stack-lg">
              {/* Top nav links removed to clear dead ends per QA */}
            </nav>
          </div>
          <div>
            <button
              onClick={handleLaunchTerminal}
              className="bg-primary-container text-white px-stack-md py-stack-sm rounded uppercase font-label-sm text-label-sm cursor-pointer active:opacity-80 transition-colors"
            >
              Launch Terminal
            </button>
          </div>
        </header>

        {/* Main content wrapper */}
        <main className="bg-transparent min-h-screen text-on-background relative">
          <div className="max-w-[1200px] mx-auto px-margin-mobile lg:px-margin-desktop py-12 flex flex-col gap-24">
            
            {/* 1. Hero Section */}
            <section className="min-h-[70vh] flex flex-col items-center justify-center text-center py-20 relative z-10">
              <span className="font-label-sm text-label-sm text-outline uppercase tracking-widest mb-stack-md bg-surface-container/50 border border-outline-variant px-stack-md py-stack-sm rounded-full backdrop-blur-md">
                Institutional Quantitative Intelligence
              </span>
              <h1 className="font-display-lg text-display-lg-mobile md:text-display-lg text-on-surface mb-stack-lg leading-tight tracking-tight max-w-4xl">
                Institutional Quantitative<br />
                <span className="text-primary-container italic font-medium">microsecond-synchronized</span><br />
                Intelligence
              </h1>
              <p className="font-body-lg text-body-lg text-on-surface-variant max-w-3xl leading-relaxed mb-stack-xl">
                Nexus Quant synthesizes raw market ticks, systemic beta variables, and custom directional neural networks into a microsecond-synchronized platform.
              </p>
              <div className="flex gap-stack-md">
                <button
                  onClick={handleLaunchTerminal}
                  className="bg-primary-container text-white px-stack-md py-stack-md rounded uppercase font-label-sm text-label-sm cursor-pointer active:opacity-80 transition-colors"
                >
                  Start Live Sandbox
                </button>
                <button
                  onClick={handleLaunchTerminal}
                  className="px-stack-md py-stack-md rounded border border-outline-variant bg-surface-container/50 backdrop-blur-md text-on-surface uppercase font-label-sm text-label-sm hover:bg-surface-variant transition-colors"
                >
                  Dedicated Console
                </button>
              </div>
            </section>

            {/* 2. Infinite Partner Marquee */}
            <div className="rounded-[10px] overflow-hidden border border-outline-variant bg-surface-container py-stack-md relative z-10">
              <div className="flex w-[200%] animate-marquee">
                <div className="flex justify-around w-1/2 items-center font-body-md font-bold text-on-surface opacity-70 grayscale uppercase">
                  <span>Yahoo Finance</span>
                  <span>Polygon</span>
                  <span>Finnhub</span>
                  <span>Alpha Vantage</span>
                  <span>NASDAQ</span>
                  <span>NSE</span>
                  <span>TradingView</span>
                </div>
                <div className="flex justify-around w-1/2 items-center font-body-md font-bold text-on-surface opacity-70 grayscale uppercase">
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
              className="w-full min-h-screen py-24 flex items-center justify-center relative z-20"
            >
              {/* Unified Terminal Window */}
              <div className="w-[95%] max-w-[1300px] h-[550px] md:h-[700px] rounded-[10px] border border-outline-variant bg-[#1c1d22] shadow-2xl overflow-hidden flex flex-col relative z-10 pointer-events-none">
                {/* Terminal Header */}
                <div className="flex justify-between items-center px-stack-md py-stack-sm border-b border-outline-variant/50 bg-[#1c1d22] z-20 select-none shrink-0">
                  <div className="flex items-center gap-stack-sm">
                    <span className="w-3 h-3 rounded-full bg-outline-variant"></span>
                    <span className="w-3 h-3 rounded-full bg-outline-variant"></span>
                    <span className="w-3 h-3 rounded-full bg-outline-variant"></span>
                  </div>
                  <span className="font-label-sm text-label-sm text-outline font-mono">NQ-TERM_v2.4.1 [SECURE]</span>
                  <div className="flex gap-unit">
                    <span className="material-symbols-outlined text-outline text-[16px]">signal_cellular_alt</span>
                    <span className="material-symbols-outlined text-outline text-[16px]">lock</span>
                  </div>
                </div>

                {/* Live Component Container */}
                <div className="relative flex-1 w-full overflow-hidden bg-[#08080a]">
                  <AnimatePresence mode="wait">
                    <motion.div 
                      key={activeFeature}
                      initial={{ filter: "blur(12px)", opacity: 0, scale: 1.05 }}
                      animate={{ filter: "blur(0px)", opacity: 1, scale: 1 }}
                      exit={{ filter: "blur(12px)", opacity: 0, scale: 0.95 }}
                      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                      className="w-full h-full transform-gpu origin-center p-stack-md pb-[140px]"
                    >
                      {renderActiveWorkflow()}
                    </motion.div>
                  </AnimatePresence>
                  
                  {/* Gradient Blur Overlay (Lower Half) */}
                  <div className="absolute bottom-0 left-0 w-full h-[200px] md:h-[220px] bg-gradient-to-t from-[#08080a] via-[#08080a]/90 to-transparent backdrop-blur-[2px] flex flex-col justify-end p-stack-md md:p-stack-lg z-10">
                    <AnimatePresence mode="wait">
                      <motion.div
                        key={`desc-${activeFeature}`}
                        initial={{ opacity: 0, y: 15 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -15 }}
                        transition={{ duration: 0.4, ease: "easeOut" }}
                      >
                        <h3 className="font-display-md text-[20px] md:text-[24px] font-bold text-on-surface mb-stack-xs drop-shadow-lg tracking-tight">
                          {features[activeFeature].title}
                        </h3>
                        <p className="font-body-md text-[12px] md:text-[14px] text-on-surface-variant max-w-3xl leading-relaxed line-clamp-2 md:line-clamp-none">
                          {features[activeFeature].description}
                        </p>
                      </motion.div>
                    </AnimatePresence>
                    
                    {/* Navigation Dots */}
                    <div className="flex items-center gap-2 mt-stack-md pointer-events-auto">
                      {features.map((_, i) => (
                        <button
                          key={i}
                          onClick={() => handleFeatureClick(i)}
                          className={`h-1.5 rounded-full transition-all duration-300 ${
                            activeFeature === i ? "w-8 bg-secondary" : "w-1.5 bg-outline-variant/50 hover:bg-outline-variant"
                          }`}
                          aria-label={`Go to slide ${i + 1}`}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* 4. Research Section */}
            <section id="research" className="py-stack-xl border-t border-outline-variant/30 z-10">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-stack-lg items-center">
                <div>
                  <span className="font-label-sm text-label-sm text-outline uppercase tracking-widest">
                    Research Division
                  </span>
                  <h2 className="font-display-md text-display-md text-on-surface mb-stack-md mt-stack-xs">
                    Neural Predictors & Spatial Attention
                  </h2>
                  <p className="font-body-md text-body-md text-on-surface-variant leading-relaxed mb-stack-md">
                    Our quant researchers utilize spatial attention layers alongside combined
                    CNN-BiLSTM networks. By employing Huber Loss and Spatial Dropout, we protect
                    forecasts against fat-tail events and extreme regime shifts.
                  </p>
                  <div className="grid grid-cols-2 gap-stack-sm">
                    <div className="p-stack-sm rounded border border-outline-variant/50 bg-surface-container">
                      <div className="font-headline-md text-headline-md text-on-surface">Huber Loss</div>
                      <div className="font-label-sm text-[11px] text-outline">Robust to outliers</div>
                    </div>
                    <div className="p-stack-sm rounded border border-outline-variant/50 bg-surface-container">
                      <div className="font-headline-md text-headline-md text-on-surface">Spatial Dropout</div>
                      <div className="font-label-sm text-[11px] text-outline">Regime invariance</div>
                    </div>
                  </div>
                </div>
                <div className="p-stack-lg rounded-[10px] border border-outline-variant bg-surface-container/80 backdrop-blur-md">
                  <h3 className="font-headline-lg text-headline-lg text-on-surface mb-stack-sm">Latest Whitepaper Abstract</h3>
                  <p className="font-body-md text-body-md text-on-surface-variant leading-relaxed italic border-l-2 border-outline-variant pl-stack-sm">
                    "By decoupling temporal feature learning from directional attention networks, we
                    show a 12% improvement in Sharpe ratio on out-of-sample backtests. The neural
                    framework incorporates real-time liquidity imbalance vectors to form dynamic
                    pricing thresholds."
                  </p>
                </div>
              </div>
            </section>

            {/* 5. Technology Section */}
            <section id="technology" className="py-stack-xl border-t border-outline-variant/30 z-10">
              <div className="text-center max-w-3xl mx-auto mb-stack-xl">
                <span className="font-label-sm text-label-sm text-outline uppercase tracking-widest">
                  Infrastructure Stack
                </span>
                <h2 className="font-display-md text-display-md text-on-surface mb-stack-sm mt-stack-xs">
                  Built for Microsecond Calculations
                </h2>
                <p className="font-body-md text-body-md text-on-surface-variant">
                  Highly optimized tech stack leveraging Next.js 14, React 18 for layouts, WebGL
                  (Three.js) for 3D model visualization, and GSAP for fluid scroll timing.
                </p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-stack-sm">
                <div className="p-stack-md rounded-[10px] border border-outline-variant/50 bg-surface-container hover:border-secondary/50 transition-colors">
                  <div className="font-headline-md text-headline-md text-on-surface mb-stack-xs">Next.js 14</div>
                  <p className="font-body-md text-[13px] text-on-surface-variant">
                    Server-rendered templates and layout caching.
                  </p>
                </div>
                <div className="p-stack-md rounded-[10px] border border-outline-variant/50 bg-surface-container hover:border-secondary/50 transition-colors">
                  <div className="font-headline-md text-headline-md text-on-surface mb-stack-xs">Three.js</div>
                  <p className="font-body-md text-[13px] text-on-surface-variant">
                    GPU-accelerated vector and point-cloud rendering.
                  </p>
                </div>
                <div className="p-stack-md rounded-[10px] border border-outline-variant/50 bg-surface-container hover:border-secondary/50 transition-colors">
                  <div className="font-headline-md text-headline-md text-on-surface mb-stack-xs">GSAP</div>
                  <p className="font-body-md text-[13px] text-on-surface-variant">
                    Seamless, lightweight state and animation synchronization.
                  </p>
                </div>
                <div className="p-stack-md rounded-[10px] border border-outline-variant/50 bg-surface-container hover:border-secondary/50 transition-colors">
                  <div className="font-headline-md text-headline-md text-on-surface mb-stack-xs">FastAPI</div>
                  <p className="font-body-md text-[13px] text-on-surface-variant">
                    High-concurrency API layer driving predictions and backtests.
                  </p>
                </div>
              </div>
            </section>

            {/* 6. Documentation Section */}
            <section id="documentation" className="py-stack-xl border-t border-outline-variant/30 z-10">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-stack-lg">
                <div>
                  <span className="font-label-sm text-label-sm text-outline uppercase tracking-widest">
                    Developer API
                  </span>
                  <h2 className="font-display-md text-display-md text-on-surface mb-stack-md mt-stack-xs">Documentation & SDK</h2>
                  <p className="font-body-md text-body-md text-on-surface-variant">
                    Access terminal stats and prediction results programmatically. Import the Nexus
                    SDK or call standard REST endpoints.
                  </p>
                </div>
                <div className="p-stack-md rounded-[10px] border border-outline-variant bg-surface-container lg:col-span-2 font-mono text-[13px] overflow-x-auto text-on-surface-variant">
                  <div className="flex justify-between items-center pb-unit mb-stack-sm border-b border-outline-variant/30">
                    <span className="text-outline">API Endpoint Reference</span>
                    <span className="text-secondary">POST</span>
                  </div>
                  <div className="text-on-surface">https://api.nexusquant.app/v1/predict</div>
                  <div className="mt-stack-sm text-[11px] text-outline">
                    Header: Content-Type: application/json
                  </div>
                  <pre className="mt-unit text-on-surface bg-[#08080a] p-stack-sm rounded border border-outline-variant/30">
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
            <section id="github" className="py-stack-xl border-t border-outline-variant/30 z-10">
              <div className="p-stack-lg rounded-[10px] border border-outline-variant bg-surface-container flex flex-col md:flex-row justify-between items-center gap-stack-md">
                <div>
                  <span className="font-label-sm text-[11px] text-outline uppercase tracking-widest">
                    Open Source Collaboration
                  </span>
                  <h2 className="font-display-md text-display-md text-on-surface mb-stack-xs">
                    Contribute to the Nexus SDK
                  </h2>
                  <p className="font-body-md text-body-md text-on-surface-variant max-w-xl">
                    The core model structures, indicators, and client libraries are open source.
                    Explore our GitHub repositories, report bugs, or submit pull requests.
                  </p>
                </div>
                <div>
                  <a
                    href="https://github.com"
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-unit bg-primary-container text-white px-stack-md py-stack-sm rounded uppercase font-label-sm text-[12px] hover:opacity-90 transition-opacity"
                  >
                    View on GitHub
                  </a>
                </div>
              </div>
            </section>

            {/* 8. Live Terminal Workspace Section */}
            <div id="launch-terminal" className="pt-stack-xl border-t border-outline-variant/30 z-20">
              <div className="text-center max-w-3xl mx-auto mb-stack-lg">
                <span className="font-label-sm text-label-sm text-outline uppercase tracking-widest">
                  Interface Console
                </span>
                <h2 className="font-display-md text-display-md text-on-surface mb-stack-sm mt-stack-xs">Interactive Quant Terminal</h2>
                <p className="font-body-md text-body-md text-on-surface-variant">
                  Test predictions, analyze technical indicators, and simulate portfolios live.
                  Change inputs below to query our active inference nodes.
                </p>
              </div>

              <div className="cosmoq-card p-stack-md flex flex-col gap-stack-md bg-[#1c1d22] border border-outline-variant rounded-[10px]">
                
                {/* Terminal Tickers Ribbon */}
                <div className="w-full overflow-hidden py-unit border-b border-outline-variant/30 bg-[#08080a] z-30 relative shrink-0 rounded">
                  <div className="flex w-max animate-marquee">
                    {[0, 1].map((copy) => (
                      <div
                        key={copy}
                        className="flex gap-gutter px-gutter font-label-sm text-[11px] font-mono tracking-widest text-outline uppercase"
                      >
                        {tickerKeys.map((ticker) => {
                          const item = allPrices[ticker];
                          return (
                            <span
                              key={`${copy}-${ticker}`}
                              className="flex items-center gap-unit"
                            >
                              <span
                                className={`w-1.5 h-1.5 rounded-full ${
                                  item.pct_change >= 0 ? "bg-[var(--profit)]" : "bg-[var(--loss)]"
                                } inline-block`}
                              />
                              <span className="text-on-surface font-bold">{ticker}</span>
                              <span className="text-outline">${item.price.toFixed(2)}</span>
                              <span
                                className={
                                  item.pct_change >= 0 ? "text-[var(--profit)]" : "text-[var(--loss)]"
                                }
                              >
                                {item.pct_change > 0 ? "+" : ""}{item.pct_change.toFixed(2)}%
                              </span>
                            </span>
                          );
                        })}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Dropdowns controls */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-stack-sm relative z-40">
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
                  <div className="p-stack-sm rounded border border-outline-variant/30 bg-[#08080a] flex flex-col justify-center">
                    <div className="flex items-center gap-unit mb-1">
                      <div className="w-2 h-2 rounded-full bg-secondary animate-pulse" />
                      <span className="font-label-sm text-[10px] text-outline tracking-wider uppercase">
                        Compute Online
                      </span>
                    </div>
                    <div className="flex justify-between font-label-sm text-[10px] text-on-surface-variant font-mono">
                      <span>LAT: 12ms</span>
                      <span>GPU: A100</span>
                    </div>
                  </div>
                </div>

                {/* Stats Blocks */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-stack-sm w-full">
                  <div className="p-stack-sm border border-outline-variant/30 bg-[#08080a] rounded flex flex-col justify-center">
                    <span className="font-label-sm text-[10px] text-outline tracking-widest uppercase mb-1">
                      Valuation
                    </span>
                    <div className="font-headline-lg text-headline-lg font-mono text-on-surface">
                      {stockData
                        ? latestClose.toLocaleString(undefined, { minimumFractionDigits: 2 })
                        : "—"}
                      <span className="font-label-sm text-[11px] text-outline ml-1">{currency}</span>
                    </div>
                    {stockData && (
                      <div
                        className={`font-label-sm text-[12px] mt-1 ${
                          pctChange >= 0 ? "text-[var(--profit)]" : "text-[var(--loss)]"
                        }`}
                      >
                        {pctChange >= 0 ? "+" : ""}
                        {pctChange.toFixed(2)}%
                      </div>
                    )}
                  </div>

                  <div className="p-stack-sm border border-outline-variant/30 bg-[#08080a] rounded flex flex-col justify-center">
                    <span className="font-label-sm text-[10px] text-outline tracking-widest uppercase mb-1">
                      Volatility
                    </span>
                    <div className="font-headline-lg text-headline-lg font-mono text-on-surface">
                      {stockData ? `${volatility.toFixed(2)}%` : "—"}
                    </div>
                    <span className="font-label-sm text-[10px] font-mono text-outline mt-1">
                      {stockData ? `Beta: ${(volatility / 15).toFixed(2)}` : ""}
                    </span>
                  </div>

                  <div className="p-stack-sm border border-outline-variant/30 bg-[#08080a] rounded flex flex-col justify-center">
                    <span className="font-label-sm text-[10px] text-outline tracking-widest uppercase mb-1">
                      VWAP (20d)
                    </span>
                    <div className="font-headline-lg text-headline-lg font-mono text-on-surface">
                      {stockData ? vwap.toLocaleString(undefined, { minimumFractionDigits: 2 }) : "—"}
                    </div>
                    <span className="font-label-sm text-[10px] font-mono text-outline mt-1">
                      {stockData && vwap !== 0
                        ? `Dev: ${(((latestClose / vwap) - 1) * 100).toFixed(2)}%`
                        : ""}
                    </span>
                  </div>

                  <div className="p-stack-sm border border-outline-variant/30 bg-[#08080a] rounded flex flex-col justify-center">
                    <span className="font-label-sm text-[10px] text-outline tracking-widest uppercase mb-2">
                      Imbalance
                    </span>
                    <div className="w-full h-1 bg-outline-variant/30 rounded-full overflow-hidden mb-1 relative">
                      <div
                        className={`h-full rounded-full transition-all duration-700 ${
                          imbalance > 50 ? "bg-[var(--profit)]" : "bg-[var(--loss)]"
                        }`}
                        style={{ width: `${imbalance}%` }}
                      />
                    </div>
                    <div className="flex justify-between font-label-sm text-[10px] font-mono text-outline">
                      <span>BID {Math.round(imbalance)}%</span>
                      <span>ASK {Math.round(100 - imbalance)}%</span>
                    </div>
                  </div>
                </div>

                {/* Terminal Tab Selector */}
                <div className="flex border-b border-outline-variant/30 overflow-x-auto hide-scrollbar gap-unit">
                  {tabs.map((tab) => (
                    <button
                      key={tab}
                      onClick={() => handleTabClick(tab)}
                      className={`px-stack-sm py-unit border-b-[2px] font-label-sm text-[11px] whitespace-nowrap transition-colors uppercase tracking-wider ${
                        activeTerminalTab === tab
                          ? "border-secondary text-secondary"
                          : "border-transparent text-outline hover:text-on-surface"
                      }`}
                    >
                      {tab}
                    </button>
                  ))}
                </div>

                {/* Active Page Viewport Rendering the Active Component */}
                <div className="min-h-[400px] border border-outline-variant/30 bg-[#08080a] rounded p-stack-md relative overflow-hidden flex flex-col justify-between">
                  {loading ? (
                    <div className="flex-1 flex flex-col items-center justify-center gap-stack-sm">
                      <div className="w-6 h-6 rounded-full border-[2px] border-secondary border-t-transparent animate-spin" />
                      <span className="font-label-sm text-[10px] text-outline font-mono">
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
