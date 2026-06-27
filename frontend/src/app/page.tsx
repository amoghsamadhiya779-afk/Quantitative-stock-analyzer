"use client";

import React, { useRef, useState, useEffect } from 'react';
import Link from 'next/link';
import { motion, useScroll, useTransform, AnimatePresence } from 'framer-motion';
import { ParticleNetwork } from '@/components/ui/ParticleNetwork';
import { useTheme } from 'next-themes';

// Live Components
import Backtesting from '@/components/workflows/Backtesting';
import RiskAnalytics from '@/components/workflows/RiskAnalytics';
import PortfolioOptimization from '@/components/workflows/PortfolioOptimization';

export default function LandingPage() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"]
  });

  // Fade out hero on scroll
  const heroOpacity = useTransform(scrollYProgress, [0, 0.15], [1, 0]);
  const heroScale = useTransform(scrollYProgress, [0, 0.15], [1, 0.9]);

  // Feature Section Snap points
  // 0.2 to 0.4: Backtesting
  // 0.4 to 0.6: Risk
  // 0.6 to 0.8: Portfolio
  const [activeFeature, setActiveFeature] = useState(0);

  useEffect(() => {
    setMounted(true);
    const unsubscribe = scrollYProgress.on("change", (latest) => {
      if (latest < 0.3) setActiveFeature(0);
      else if (latest >= 0.3 && latest < 0.6) setActiveFeature(1);
      else if (latest >= 0.6) setActiveFeature(2);
    });
    return () => unsubscribe();
  }, [scrollYProgress]);

  const [booting, setBooting] = useState(false);

  // Mock Props for Live Components
  const dummyTickers = ["AAPL", "MSFT", "NVDA", "AMZN", "META"];
  const dummyMarket = "United States (S&P 500)";

  if (!mounted) return null; // Avoid hydration mismatch

  return (
    <div ref={containerRef} className="relative bg-background text-foreground min-h-[400vh] selection:bg-cyan-500/30 font-sans">
      <ParticleNetwork />

      {/* Modern Theme Switcher & Nav */}
      <nav className="fixed top-6 left-0 right-0 z-50 flex justify-center w-full px-6 pointer-events-none">
        <div className="flex items-center justify-between w-full max-w-7xl">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-400 to-blue-600 shadow-[0_0_15px_rgba(34,211,238,0.5)]" />
            <span className="font-display font-bold text-xl tracking-tight text-white drop-shadow-md">NEXUS</span>
          </div>

          <div className="pointer-events-auto flex items-center gap-2 p-1.5 rounded-full bg-black/40 border border-white/10 backdrop-blur-xl">
            {['dark', 'light', 'cyber'].map((t) => (
              <button
                key={t}
                onClick={() => setTheme(t)}
                className={`px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider transition-all duration-300 ${
                  theme === t 
                    ? 'bg-white text-black shadow-[0_0_10px_rgba(255,255,255,0.5)]' 
                    : 'text-neutral-400 hover:text-white hover:bg-white/10'
                }`}
              >
                {t}
              </button>
            ))}
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
            <p className="text-lg text-neutral-400">Don't guess. Know. Test your algorithms against decades of historical data with zero look-ahead bias. Our engine simulates slippage, commissions, and extreme volatility instantly.</p>
          </div>
          
          <div className={`transition-opacity duration-500 ${activeFeature === 1 ? 'opacity-100' : 'opacity-20'}`}>
            <h2 className="text-4xl font-display font-bold text-white mb-4">Systemic Risk Analytics</h2>
            <p className="text-lg text-neutral-400">See the invisible. Dynamically calculate your Value at Risk (VaR) and systemic exposure across global markets in real-time. Identify dangerous correlations before they break your portfolio.</p>
          </div>
          
          <div className={`transition-opacity duration-500 ${activeFeature === 2 ? 'opacity-100' : 'opacity-20'}`}>
            <h2 className="text-4xl font-display font-bold text-white mb-4">Autonomous Portfolio Optimization</h2>
            <p className="text-lg text-neutral-400">Let AI find the Efficient Frontier. Optimize asset allocation for maximum Sharpe ratio mathematically. The engine runs thousands of Monte Carlo simulations to find the perfect risk/reward balance.</p>
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
          <div className="relative flex-1 w-full overflow-hidden bg-background p-6">
            <AnimatePresence mode="wait">
              {activeFeature === 0 && (
                <motion.div 
                  key="backtest"
                  initial={{ opacity: 0, scale: 0.95, y: 20 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 1.05, y: -20 }}
                  transition={{ duration: 0.5, ease: "easeInOut" }}
                  className="w-full h-full transform-gpu origin-top"
                  style={{ transform: "scale(0.85)" }} // Scale down to fit the preview window
                >
                  <Backtesting selectedMarket={dummyMarket} selectedTicker="AAPL" selectedAlgo="MACD" />
                </motion.div>
              )}
              {activeFeature === 1 && (
                <motion.div 
                  key="risk"
                  initial={{ opacity: 0, scale: 0.95, y: 20 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 1.05, y: -20 }}
                  transition={{ duration: 0.5, ease: "easeInOut" }}
                  className="w-full h-full transform-gpu origin-top"
                  style={{ transform: "scale(0.85)" }}
                >
                  <RiskAnalytics tickers={dummyTickers} selectedMarket={dummyMarket} />
                </motion.div>
              )}
              {activeFeature === 2 && (
                <motion.div 
                  key="portfolio"
                  initial={{ opacity: 0, scale: 0.95, y: 20 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 1.05, y: -20 }}
                  transition={{ duration: 0.5, ease: "easeInOut" }}
                  className="w-full h-full transform-gpu origin-top"
                  style={{ transform: "scale(0.85)" }}
                >
                  <PortfolioOptimization tickers={dummyTickers} />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

      </div>

      {/* 3. The Gateway (Final CTA) */}
      <div className="relative z-30 w-full h-screen flex flex-col items-center justify-center bg-black">
        {/* Deep shadow masking the top edge */}
        <div className="absolute top-0 left-0 w-full h-[50vh] bg-gradient-to-b from-transparent to-black pointer-events-none -translate-y-full" />
        
        <AnimatePresence>
          {!booting ? (
            <motion.div
              exit={{ opacity: 0, scale: 1.2, filter: "blur(10px)" }}
              className="flex flex-col items-center"
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
          ) : (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col items-start font-mono text-green-500 text-lg sm:text-2xl gap-4 max-w-3xl w-[90%]"
            >
              <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }}>$ nexus-core --boot</motion.div>
              <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.8 }}>{">"} Loading Neural Weights... OK</motion.div>
              <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 1.4 }}>{">"} Syncing Global Market Feeds... OK</motion.div>
              <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 2.0 }}>{">"} Handshake Established.</motion.div>
              <motion.div 
                initial={{ opacity: 0, x: -20 }} 
                animate={{ opacity: 1, x: 0 }} 
                transition={{ delay: 2.8 }}
                onAnimationComplete={() => {
                  setTimeout(() => {
                    // Navigate to terminal after boot sequence
                    window.location.href = "/terminal";
                  }, 800);
                }}
              >
                {">"} Routing to Interface...
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

    </div>
  );
}
