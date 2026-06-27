import React from 'react';
import Link from 'next/link';
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
          <Link href="#about" className="hidden sm:block text-sm font-medium text-white/70 hover:text-white transition-colors">
            About
          </Link>
          <Link href="#pricing" className="hidden sm:block text-sm font-medium text-white/70 hover:text-white transition-colors">
            Pricing
          </Link>
          <Link href="#contact" className="hidden sm:block text-sm font-medium text-white/70 hover:text-white transition-colors">
            Contact
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
