"use client";

import React, { useRef, useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion, useScroll, useTransform, AnimatePresence } from 'framer-motion';
import { ParticleNetwork } from '@/components/ui/ParticleNetwork';
import { Activity } from 'lucide-react';

// Live Components
import Backtesting from '@/components/workflows/Backtesting';
import RiskAnalytics from '@/components/workflows/RiskAnalytics';
import PortfolioOptimization from '@/components/workflows/PortfolioOptimization';
import MLPrediction from '@/components/workflows/MLPrediction';
import TechnicalIndicators from '@/components/workflows/TechnicalIndicators';
import MarketDataIngestion from '@/components/workflows/MarketDataIngestion';

export default function LandingPage() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"]
  });

  // Fade out hero on scroll
  const heroOpacity = useTransform(scrollYProgress, [0, 0.08], [1, 0]);
  const heroScale = useTransform(scrollYProgress, [0, 0.08], [1, 0.95]);

  // Feature Section Snap points for 6 components
  const [activeFeature, setActiveFeature] = useState(0);

  useEffect(() => {
    setMounted(true);
    const unsubscribe = scrollYProgress.on("change", (latest) => {
      // Map scroll progress (0.1 to 0.9) into 6 segments
      if (latest < 0.2) setActiveFeature(0);
      else if (latest >= 0.2 && latest < 0.35) setActiveFeature(1);
      else if (latest >= 0.35 && latest < 0.5) setActiveFeature(2);
      else if (latest >= 0.5 && latest < 0.65) setActiveFeature(3);
      else if (latest >= 0.65 && latest < 0.8) setActiveFeature(4);
      else if (latest >= 0.8) setActiveFeature(5);
    });
    return () => unsubscribe();
  }, [scrollYProgress]);

  const [booting, setBooting] = useState(false);
  const [revealing, setRevealing] = useState(false);

  // Mock Props for Live Components
  const dummyTickers = ["AAPL", "MSFT", "NVDA", "AMZN", "META"];
  const dummyMarket = "United States (S&P 500)";

  if (!mounted) return null;

  return (
    <div ref={containerRef} className="relative bg-[#0a0a0a] text-white min-h-[600vh] selection:bg-cyan-500/30 font-sans">
      <ParticleNetwork />

      {/* Nav & Upgraded Logo */}
      <nav className="fixed top-6 left-0 right-0 z-50 flex justify-center w-full px-6 pointer-events-none">
        <div className="flex items-center justify-between w-full max-w-7xl">
          {/* Unifying Logo */}
          <div className="flex items-center gap-3 px-4 py-2 bg-gradient-to-r from-cyan-500/10 to-blue-500/5 rounded-xl border border-cyan-500/20 backdrop-blur-md shadow-xl pointer-events-auto">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-400 to-blue-600 flex items-center justify-center shadow-[0_0_15px_rgba(34,211,238,0.3)]">
              <Activity className="w-5 h-5 text-black" />
            </div>
            <span className="font-display font-bold text-xl tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-white to-neutral-400">
              NEXUS
            </span>
          </div>
        </div>
      </nav>

      {/* 1. Hero Section */}
      <motion.div 
        style={{ opacity: heroOpacity, scale: heroScale }}
        className="sticky top-0 h-screen w-full flex flex-col items-center justify-center px-4 pointer-events-none z-10"
      >
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.2 }}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-black/40 border border-white/10 backdrop-blur-md mb-8"
        >
          <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse shadow-[0_0_8px_rgba(34,211,238,0.8)]" />
          <span className="text-xs font-mono tracking-wider text-cyan-50">QUANTITATIVE INTELLIGENCE V2.0</span>
        </motion.div>
        
        <motion.h1 
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.4 }}
          className="text-6xl md:text-8xl lg:text-[100px] font-extrabold tracking-tighter max-w-6xl text-center leading-[0.9] drop-shadow-2xl text-white"
        >
          Outsmart the Market with <span className="bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-600">AI Agents.</span>
        </motion.h1>
        
        <motion.p 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: 0.8 }}
          className="text-lg md:text-2xl text-neutral-300 max-w-2xl text-center mt-8 font-light"
        >
          An institutional-grade terminal built on predictive neural networks and systemic risk engines. Scroll to explore.
        </motion.p>
      </motion.div>

      {/* 2. Scroll-Linked Feature Walkthrough */}
      <div className="relative z-20 w-full max-w-7xl mx-auto px-6 pt-32 pb-64 flex gap-12 lg:gap-24 items-start">
        
        {/* Left Side: Sticky Content */}
        <div className="hidden lg:flex flex-col sticky top-[30vh] w-[40%] gap-32 pointer-events-none">
          <div className={`transition-opacity duration-500 ${activeFeature === 0 ? 'opacity-100' : 'opacity-20'}`}>
            <h2 className="text-4xl font-display font-bold text-white mb-4">Institutional Backtesting</h2>
            <p className="text-lg text-neutral-400">Test your algorithms against decades of historical data with zero look-ahead bias. Our engine simulates slippage, commissions, and extreme volatility instantly.</p>
          </div>
          
          <div className={`transition-opacity duration-500 ${activeFeature === 1 ? 'opacity-100' : 'opacity-20'}`}>
            <h2 className="text-4xl font-display font-bold text-white mb-4">Systemic Risk Analytics</h2>
            <p className="text-lg text-neutral-400">Dynamically calculate your Value at Risk (VaR) and systemic exposure across global markets in real-time. Identify dangerous correlations before they break your portfolio.</p>
          </div>
          
          <div className={`transition-opacity duration-500 ${activeFeature === 2 ? 'opacity-100' : 'opacity-20'}`}>
            <h2 className="text-4xl font-display font-bold text-white mb-4">Portfolio Optimization</h2>
            <p className="text-lg text-neutral-400">Optimize asset allocation for maximum Sharpe ratio mathematically. The engine runs thousands of Monte Carlo simulations to find the perfect risk/reward balance.</p>
          </div>

          <div className={`transition-opacity duration-500 ${activeFeature === 3 ? 'opacity-100' : 'opacity-20'}`}>
            <h2 className="text-4xl font-display font-bold text-white mb-4">ML Predictions</h2>
            <p className="text-lg text-neutral-400">Leverage custom-trained CNN-BiLSTM-Attention networks utilizing Huber loss and Spatial Dropout to forecast short-term price vectors with statistical confidence bounds.</p>
          </div>

          <div className={`transition-opacity duration-500 ${activeFeature === 4 ? 'opacity-100' : 'opacity-20'}`}>
            <h2 className="text-4xl font-display font-bold text-white mb-4">Technical Indicators</h2>
            <p className="text-lg text-neutral-400">Visualize complex momentum oscillators, volatility bands, and moving average cross-overs in real-time to augment algorithmic strategies.</p>
          </div>

          <div className={`transition-opacity duration-500 ${activeFeature === 5 ? 'opacity-100' : 'opacity-20'}`}>
            <h2 className="text-4xl font-display font-bold text-white mb-4">Live Macro & Sentiment</h2>
            <p className="text-lg text-neutral-400">Track real-time NLP sentiment analysis from financial news. Gauge fear, greed, and macroeconomic shifts the second they hit the wire.</p>
          </div>
        </div>

        {/* Right Side: Live Component Preview Window */}
        <div className="w-full lg:w-[60%] sticky top-[15vh] h-[70vh] rounded-[32px] border border-white/10 bg-black/60 backdrop-blur-2xl shadow-2xl overflow-hidden flex flex-col pointer-events-none">
          
          {/* Mock MacOS Header */}
          <div className="w-full h-12 bg-white/5 border-b border-white/10 flex items-center px-6 gap-2 shrink-0">
            <div className="w-3 h-3 rounded-full bg-red-500/50" />
            <div className="w-3 h-3 rounded-full bg-yellow-500/50" />
            <div className="w-3 h-3 rounded-full bg-emerald-500/50" />
            <div className="flex-1 flex justify-center">
              <div className="px-3 py-1 rounded bg-black/50 text-[10px] font-mono text-neutral-500 border border-white/5 flex items-center gap-2">
                <span className="text-cyan-500">🔒</span> nexus.quant-platform.app
              </div>
            </div>
          </div>

          {/* Live Component Container */}
          <div className="relative flex-1 w-full overflow-hidden bg-[#0a0a0a] p-6">
            <AnimatePresence mode="wait">
              {activeFeature === 0 && (
                <motion.div 
                  key="backtest"
                  initial={{ opacity: 0, scale: 0.9, y: 30 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 1.05, y: -30 }}
                  transition={{ type: "spring", stiffness: 300, damping: 30 }}
                  className="w-full h-full transform-gpu origin-top"
                  style={{ transform: "scale(0.85)" }} 
                >
                  <Backtesting selectedMarket={dummyMarket} selectedTicker="AAPL" selectedAlgo="MACD" />
                </motion.div>
              )}
              {activeFeature === 1 && (
                <motion.div 
                  key="risk"
                  initial={{ opacity: 0, scale: 0.9, y: 30 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 1.05, y: -30 }}
                  transition={{ type: "spring", stiffness: 300, damping: 30 }}
                  className="w-full h-full transform-gpu origin-top"
                  style={{ transform: "scale(0.85)" }}
                >
                  <RiskAnalytics tickers={dummyTickers} selectedMarket={dummyMarket} />
                </motion.div>
              )}
              {activeFeature === 2 && (
                <motion.div 
                  key="portfolio"
                  initial={{ opacity: 0, scale: 0.9, y: 30 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 1.05, y: -30 }}
                  transition={{ type: "spring", stiffness: 300, damping: 30 }}
                  className="w-full h-full transform-gpu origin-top"
                  style={{ transform: "scale(0.85)" }}
                >
                  <PortfolioOptimization tickers={dummyTickers} />
                </motion.div>
              )}
              {activeFeature === 3 && (
                <motion.div 
                  key="ml"
                  initial={{ opacity: 0, scale: 0.9, y: 30 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 1.05, y: -30 }}
                  transition={{ type: "spring", stiffness: 300, damping: 30 }}
                  className="w-full h-full transform-gpu origin-top"
                  style={{ transform: "scale(0.85)" }}
                >
                  <MLPrediction />
                </motion.div>
              )}
              {activeFeature === 4 && (
                <motion.div 
                  key="tech"
                  initial={{ opacity: 0, scale: 0.9, y: 30 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 1.05, y: -30 }}
                  transition={{ type: "spring", stiffness: 300, damping: 30 }}
                  className="w-full h-full transform-gpu origin-top"
                  style={{ transform: "scale(0.85)" }}
                >
                  <TechnicalIndicators />
                </motion.div>
              )}
              {activeFeature === 5 && (
                <motion.div 
                  key="news"
                  initial={{ opacity: 0, scale: 0.9, y: 30 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 1.05, y: -30 }}
                  transition={{ type: "spring", stiffness: 300, damping: 30 }}
                  className="w-full h-full transform-gpu origin-top"
                  style={{ transform: "scale(0.85)" }}
                >
                  <MarketDataIngestion />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

      </div>

      {/* 3. The Gateway (Final CTA) */}
      <div className="relative z-30 w-full h-screen flex flex-col items-center justify-center bg-black overflow-hidden">
        {/* Deep shadow masking the top edge */}
        <div className="absolute top-0 left-0 w-full h-[50vh] bg-gradient-to-b from-transparent to-black pointer-events-none -translate-y-full" />
        
        <AnimatePresence>
          {!booting && !revealing ? (
            <motion.div
              exit={{ opacity: 0, scale: 1.5, filter: "blur(20px)" }}
              transition={{ duration: 0.8, ease: "easeIn" }}
              className="flex flex-col items-center z-10"
            >
              <h2 className="text-4xl md:text-6xl font-display font-bold text-white mb-12">Ready to deploy?</h2>
              <button 
                onClick={() => setBooting(true)}
                className="group relative px-12 py-5 bg-white text-black font-bold text-xl rounded-full overflow-hidden transition-transform hover:scale-105 active:scale-95"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-cyan-400 to-blue-500 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <span className="relative z-10 group-hover:text-white transition-colors duration-300">Initialize Terminal</span>
              </button>
            </motion.div>
          ) : booting && !revealing ? (
            <motion.div 
              key="boot-sequence"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0, scale: 0.9, filter: "blur(10px)" }}
              className="flex flex-col items-start font-mono text-cyan-400 text-lg sm:text-2xl gap-4 max-w-3xl w-[90%] z-10 drop-shadow-[0_0_10px_rgba(34,211,238,0.5)]"
            >
              <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }}>$ nexus-core --boot</motion.div>
              <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.6 }}>{">"} Loading Neural Weights... [OK]</motion.div>
              <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 1.0 }}>{">"} Syncing Global Market Feeds... [OK]</motion.div>
              <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 1.4 }}>{">"} Handshake Established.</motion.div>
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
          ) : revealing ? (
            <motion.div
              key="hyper-reveal"
              initial={{ scale: 0, opacity: 0, rotateX: 45 }}
              animate={{ scale: 1, opacity: 1, rotateX: 0 }}
              transition={{ type: "spring", stiffness: 100, damping: 20, duration: 1.5 }}
              onAnimationComplete={() => {
                setTimeout(() => {
                  router.push("/terminal");
                }, 200); // Slight delay after animation completes before hard routing
              }}
              className="absolute inset-0 m-auto w-[90vw] h-[90vh] bg-[#0a0a0a] rounded-[40px] border-[2px] border-cyan-500/50 shadow-[0_0_100px_rgba(34,211,238,0.6)] overflow-hidden flex flex-col z-50"
            >
              {/* Fake Terminal Skeleton UI */}
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
          ) : null}
        </AnimatePresence>
      </div>

    </div>
  );
}
