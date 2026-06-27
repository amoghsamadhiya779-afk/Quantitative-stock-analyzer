"use client";

import React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { LandingBackground } from '@/components/ui/LandingBackground';

export default function LandingPage() {
  return (
    <div className="relative min-h-screen text-white font-sans selection:bg-cyan-500/30 overflow-x-hidden">
      <LandingBackground />

      {/* Navigation */}
      <nav className="fixed top-6 left-1/2 -translate-x-1/2 z-50 w-[90%] max-w-3xl flex justify-center">
        <div className="flex items-center gap-4 sm:gap-6 px-6 py-3 rounded-full bg-white/5 border border-white/10 backdrop-blur-xl shadow-2xl">
          <Link href="#ai-solutions" className="hidden sm:block text-sm font-medium text-white/70 hover:text-white transition-colors">
            AI Solutions
          </Link>
          <Link href="#infrastructure" className="hidden sm:block text-sm font-medium text-white/70 hover:text-white transition-colors">
            Infrastructure
          </Link>
          <Link href="#risk-analytics" className="hidden sm:block text-sm font-medium text-white/70 hover:text-white transition-colors">
            Risk Analytics
          </Link>
          <Link 
            href="https://github.com/amoghsamadhiya779-afk/Quantitative-stock-analyzer" 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-sm font-medium text-white/70 hover:text-white transition-colors"
          >
            Github
          </Link>
          
          <div className="hidden sm:block w-px h-4 bg-white/20 mx-2" />
          
          <Link 
            href="/terminal"
            className="text-sm font-semibold bg-white/10 hover:bg-white/20 border border-white/10 px-5 py-2 rounded-full transition-all hover:shadow-[0_0_15px_rgba(255,255,255,0.15)] flex items-center gap-2 whitespace-nowrap"
          >
            Launch Terminal
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="flex flex-col items-center justify-center min-h-screen px-4 text-center z-10 relative pt-32 pb-16">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 backdrop-blur-md mb-8 animate-fade-in-up">
          <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse shadow-[0_0_8px_rgba(34,211,238,0.8)]" />
          <span className="text-xs font-medium tracking-wide text-cyan-50">Nexus Quant Platform is Live</span>
        </div>
        
        <h1 className="text-5xl md:text-7xl lg:text-8xl font-extrabold tracking-tight max-w-5xl bg-clip-text text-transparent bg-gradient-to-b from-white via-white/90 to-white/40 mb-6 drop-shadow-lg leading-tight animate-fade-in-up" style={{ animationDelay: '100ms', animationFillMode: 'both' }}>
          Next-gen Quantitative Intelligence with AI Agents
        </h1>
        
        <p className="text-lg md:text-xl text-white/60 max-w-2xl mb-12 font-light leading-relaxed animate-fade-in-up" style={{ animationDelay: '200ms', animationFillMode: 'both' }}>
          Accelerate the speed of business with the Nexus Quant Platform. Unify alternative data, predictive models, and autonomous AI for unparallelled market edges.
        </p>
        
        <Link 
          href="/terminal"
          className="group relative inline-flex items-center justify-center gap-3 px-8 py-4 bg-white/10 hover:bg-white/15 border border-white/20 rounded-full text-lg font-medium transition-all duration-300 hover:scale-105 hover:shadow-[0_0_40px_rgba(255,165,0,0.25)] backdrop-blur-md overflow-hidden animate-fade-in-up"
          style={{ animationDelay: '300ms', animationFillMode: 'both' }}
        >
          {/* Subtle moving glare effect */}
          <div className="absolute inset-0 -translate-x-full group-hover:animate-[glare_3s_ease-in-out_infinite] bg-gradient-to-r from-transparent via-white/10 to-transparent pointer-events-none" />
          
          <span>View Dashboard</span>
          <svg 
            className="w-5 h-5 group-hover:translate-x-1 transition-transform" 
            fill="none" 
            viewBox="0 0 24 24" 
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
          </svg>
        </Link>
        
        {/* Abstract mock terminal snippet floating at the bottom */}
        <div className="mt-24 w-full max-w-5xl h-[300px] rounded-t-3xl border-t border-l border-r border-white/10 bg-black/40 backdrop-blur-xl relative overflow-hidden flex flex-col items-start justify-start p-8 [mask-image:linear-gradient(to_bottom,white,transparent)] animate-fade-in-up" style={{ animationDelay: '400ms', animationFillMode: 'both' }}>
          <div className="flex gap-2 mb-6">
            <div className="w-3 h-3 rounded-full bg-red-500/50" />
            <div className="w-3 h-3 rounded-full bg-yellow-500/50" />
            <div className="w-3 h-3 rounded-full bg-green-500/50" />
          </div>
          <div className="w-full flex flex-col gap-4 font-mono text-sm text-white/40">
            <div className="flex items-center gap-4">
              <span className="text-cyan-400/60">~</span>
              <span className="text-green-400/60">nexus</span>
              <span>initialize --agents=4</span>
            </div>
            <div className="flex items-center gap-4 pl-4 text-white/30">
              <span>[+] Booting quantitative reasoning models...</span>
            </div>
            <div className="flex items-center gap-4 pl-4 text-white/30">
              <span>[+] Connecting to live market data feeds...</span>
            </div>
            <div className="flex items-center gap-4 pl-4 text-white/30">
              <span>[+] Agents ready. Standing by.</span>
            </div>
            <div className="flex items-center gap-4 mt-2">
              <span className="text-cyan-400/60">~</span>
              <span className="w-2 h-4 bg-white/40 animate-pulse" />
            </div>
          </div>
        </div>
      </main>

      {/* Feature Sections */}
      <div className="relative z-10 max-w-7xl mx-auto px-6 py-24 flex flex-col gap-32 pb-48">
        
        {/* Section 1: AI Solutions */}
        <motion.section 
          id="ai-solutions"
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center"
        >
          <div>
            <div className="text-cyan-400 font-mono text-sm tracking-widest uppercase mb-4">Neural Architecture</div>
            <h2 className="text-4xl md:text-5xl font-bold mb-6 tracking-tight text-white">Predictive AI Models</h2>
            <p className="text-lg text-white/60 leading-relaxed mb-8">
              Deploy state-of-the-art machine learning algorithms including CNN-BiLSTM Attention engines and Temporal Transformers. Extract alpha from high-dimensional datasets with unparalleled precision.
            </p>
            <ul className="flex flex-col gap-4 text-white/80 font-medium">
              <li className="flex items-center gap-3"><span className="w-1.5 h-1.5 rounded-full bg-cyan-400" /> Deep Learning Price Forecasting</li>
              <li className="flex items-center gap-3"><span className="w-1.5 h-1.5 rounded-full bg-cyan-400" /> Sentiment Analysis via NLP</li>
              <li className="flex items-center gap-3"><span className="w-1.5 h-1.5 rounded-full bg-cyan-400" /> Autonomous Agent Swarms</li>
            </ul>
          </div>
          <div className="h-[400px] rounded-3xl bg-white/5 border border-white/10 backdrop-blur-md p-8 relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
            {/* Mock UI Element */}
            <div className="flex flex-col gap-4 h-full">
               <div className="w-full h-8 bg-white/5 rounded-md" />
               <div className="flex-1 w-full bg-white/5 rounded-md flex items-end p-4 gap-2">
                  {[40, 60, 45, 80, 55, 90, 75, 100].map((h, i) => (
                    <motion.div 
                      key={i}
                      initial={{ height: 0 }}
                      whileInView={{ height: `${h}%` }}
                      viewport={{ once: true }}
                      transition={{ delay: i * 0.1, duration: 1, ease: "easeOut" }}
                      className="flex-1 bg-cyan-500/40 rounded-t-sm"
                    />
                  ))}
               </div>
            </div>
          </div>
        </motion.section>

        {/* Section 2: Quantitative Infrastructure */}
        <motion.section 
          id="infrastructure"
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center"
        >
          <div className="h-[400px] rounded-3xl bg-white/5 border border-white/10 backdrop-blur-md p-8 relative overflow-hidden group order-2 lg:order-1">
            <div className="absolute inset-0 bg-gradient-to-br from-orange-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
            <div className="flex flex-col gap-3 h-full justify-center">
              {[1, 2, 3].map((i) => (
                <div key={i} className="w-full bg-black/40 rounded-xl p-4 border border-white/5 flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-white/10 animate-pulse" />
                  <div className="flex-1">
                    <div className="h-2 w-1/3 bg-white/20 rounded-full mb-2" />
                    <div className="h-2 w-1/2 bg-white/10 rounded-full" />
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="order-1 lg:order-2">
            <div className="text-orange-400 font-mono text-sm tracking-widest uppercase mb-4">Infrastructure</div>
            <h2 className="text-4xl md:text-5xl font-bold mb-6 tracking-tight text-white">Robust Backtesting</h2>
            <p className="text-lg text-white/60 leading-relaxed mb-8">
              Validate your hypotheses against decades of historical tick data. Our high-performance backtesting engine simulates slippage, latency, and institutional trading costs to ensure real-world robustness.
            </p>
            <ul className="flex flex-col gap-4 text-white/80 font-medium">
              <li className="flex items-center gap-3"><span className="w-1.5 h-1.5 rounded-full bg-orange-400" /> High-frequency tick simulation</li>
              <li className="flex items-center gap-3"><span className="w-1.5 h-1.5 rounded-full bg-orange-400" /> Strategy optimization matrices</li>
              <li className="flex items-center gap-3"><span className="w-1.5 h-1.5 rounded-full bg-orange-400" /> Risk-adjusted return profiling</li>
            </ul>
          </div>
        </motion.section>

        {/* Section 3: Risk Analytics */}
        <motion.section 
          id="risk-analytics"
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center"
        >
          <div>
            <div className="text-green-400 font-mono text-sm tracking-widest uppercase mb-4">Portfolio Engineering</div>
            <h2 className="text-4xl md:text-5xl font-bold mb-6 tracking-tight text-white">Advanced Risk Analytics</h2>
            <p className="text-lg text-white/60 leading-relaxed mb-8">
              Construct highly optimized portfolios using Markowitz Efficient Frontier models. Monitor systemic risk, beta exposure, and dynamic correlation matrices in real-time.
            </p>
            <ul className="flex flex-col gap-4 text-white/80 font-medium">
              <li className="flex items-center gap-3"><span className="w-1.5 h-1.5 rounded-full bg-green-400" /> Value at Risk (VaR) monitoring</li>
              <li className="flex items-center gap-3"><span className="w-1.5 h-1.5 rounded-full bg-green-400" /> Dynamic Asset Allocation</li>
              <li className="flex items-center gap-3"><span className="w-1.5 h-1.5 rounded-full bg-green-400" /> Correlation heatmaps</li>
            </ul>
          </div>
          <div className="h-[400px] rounded-3xl bg-white/5 border border-white/10 backdrop-blur-md p-8 relative overflow-hidden group flex items-center justify-center">
            <div className="absolute inset-0 bg-gradient-to-br from-green-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
            <motion.div 
              animate={{ rotate: 360 }}
              transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
              className="w-48 h-48 rounded-full border border-dashed border-green-500/30 flex items-center justify-center"
            >
              <div className="w-32 h-32 rounded-full border border-green-500/50 flex items-center justify-center">
                <div className="w-16 h-16 rounded-full bg-green-500/20 blur-xl" />
              </div>
            </motion.div>
          </div>
        </motion.section>
      </div>
      
      {/* Inline styles for custom animations */}
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes glare {
          0% { transform: translateX(-100%); }
          50% { transform: translateX(100%); }
          100% { transform: translateX(100%); }
        }
        @keyframes fade-in-up {
          0% {
            opacity: 0;
            transform: translateY(20px);
          }
          100% {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fade-in-up {
          animation: fade-in-up 0.8s cubic-bezier(0.16, 1, 0.3, 1);
        }
      `}} />
    </div>
  );
}
