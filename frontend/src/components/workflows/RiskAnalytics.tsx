"use client";

import { useState, Fragment, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, ChevronUp, AlertTriangle, ShieldCheck, Activity } from "lucide-react";

interface Sector {
  name: string;
  volatility: number;
  beta: number;
  varValue: number;
  constituents: Array<{ name: string; weight: number; beta: number }>;
}

interface RiskProps {
  tickers?: string[];
  selectedMarket?: string;
}

// Helper to generate deterministic pseudo-random numbers
const pseudoRandom = (seed: string) => {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = Math.imul(31, hash) + seed.charCodeAt(i) | 0;
  }
  return (Math.abs(hash) % 1000) / 1000;
};

// Generates dynamic sector names based on the selected market
const getDynamicSectors = (market: string) => {
  if (market.toLowerCase().includes("crypto")) return ["Layer 1s", "DeFi", "Infrastructure", "Exchange Tokens"];
  if (market.toLowerCase().includes("india")) return ["Financial Services", "IT", "Oil & Gas", "Consumer Goods"];
  return ["Technology", "Financials", "Healthcare", "Energy", "Utilities"];
};

export default function RiskAnalytics({ tickers = [], selectedMarket = "United States (S&P 500)" }: RiskProps) {
  const [hoveredCell, setHoveredCell] = useState<{ i: number; j: number } | null>(null);
  const [expandedSector, setExpandedSector] = useState<string | null>(null);

  // Dynamic Data Generation
  const activeTickers = useMemo(() => {
    const list = tickers.length > 0 ? tickers : ["AAPL", "MSFT", "NVDA", "AMZN", "META"];
    return list.slice(0, 5);
  }, [tickers]);

  const correlationMatrix = useMemo(() => {
    const matrix: number[][] = Array(activeTickers.length).fill(0).map(() => Array(activeTickers.length).fill(1.0));
    for (let i = 0; i < activeTickers.length; i++) {
      for (let j = i + 1; j < activeTickers.length; j++) {
        const t1 = activeTickers[i];
        const t2 = activeTickers[j];
        // Generate correlation between -0.4 and 0.95
        const corr = -0.4 + pseudoRandom(t1 + t2 + "risk_corr") * 1.35;
        matrix[i][j] = corr;
        matrix[j][i] = corr;
      }
    }
    return matrix;
  }, [activeTickers]);

  const sectorsData = useMemo(() => {
    const sectorNames = getDynamicSectors(selectedMarket);
    let totalVarRemaining = 5000000; // Simulated $5M Total Value at Risk

    return sectorNames.map((name, idx) => {
      const isLast = idx === sectorNames.length - 1;
      const sectorBeta = 0.5 + pseudoRandom(name + selectedMarket + "beta") * 1.2;
      const sectorVol = 12 + pseudoRandom(name + selectedMarket + "vol") * 25;
      
      const varAlloc = isLast ? totalVarRemaining : totalVarRemaining * (0.2 + pseudoRandom(name + "var") * 0.3);
      totalVarRemaining -= varAlloc;

      // Generate 3-5 random constituents from the market
      const numConst = 3 + Math.floor(pseudoRandom(name + "count") * 3);
      const constituents = [];
      let totalWeight = 0;
      
      for (let i=0; i<numConst; i++) {
        const cTicker = tickers[i + (idx * 3)] || `SYM${i}`;
        const weight = 10 + pseudoRandom(cTicker + "weight") * 40;
        totalWeight += weight;
        constituents.push({
          name: cTicker,
          weight: weight,
          beta: sectorBeta * (0.8 + pseudoRandom(cTicker + "cbeta") * 0.4)
        });
      }

      // Normalize weights to 100%
      constituents.forEach(c => c.weight = (c.weight / totalWeight) * 100);

      return {
        name,
        volatility: parseFloat(sectorVol.toFixed(1)),
        beta: parseFloat(sectorBeta.toFixed(2)),
        varValue: varAlloc,
        constituents: constituents.map(c => ({...c, weight: parseFloat(c.weight.toFixed(1)), beta: parseFloat(c.beta.toFixed(2))}))
      };
    });
  }, [selectedMarket, tickers]);

  // Systemic Risk Calculations
  const averageBeta = useMemo(() => sectorsData.reduce((acc, s) => acc + s.beta, 0) / sectorsData.length, [sectorsData]);
  const averageVol = useMemo(() => sectorsData.reduce((acc, s) => acc + s.volatility, 0) / sectorsData.length, [sectorsData]);
  const totalVaR = useMemo(() => sectorsData.reduce((acc, s) => acc + s.varValue, 0), [sectorsData]);
  
  // Calculate a 0-100 score where 100 is max risk (high beta + high vol)
  const riskScore = Math.min(100, Math.max(0, ((averageBeta - 0.5) / 1.5) * 50 + (averageVol / 40) * 50));

  let riskCategory = { label: "Low Risk", color: "text-emerald-500", bg: "bg-emerald-500", stroke: "#10b981", icon: ShieldCheck, desc: "Market conditions are stable. Assets are showing historically low volatility." };
  if (riskScore > 40) riskCategory = { label: "Moderate", color: "text-yellow-500", bg: "bg-yellow-500", stroke: "#eab308", icon: Activity, desc: "Normal market fluctuations. Standard risk management applies." };
  if (riskScore > 65) riskCategory = { label: "High Risk", color: "text-orange-500", bg: "bg-orange-500", stroke: "#f97316", icon: AlertTriangle, desc: "Elevated volatility detected. Sector correlations are tightening." };
  if (riskScore > 85) riskCategory = { label: "Extreme", color: "text-red-500", bg: "bg-red-500", stroke: "#ef4444", icon: AlertTriangle, desc: "Market is experiencing severe stress. Capital preservation recommended." };

  const formatCurrency = (val: number) => {
    if (val >= 1000000) return `$${(val / 1000000).toFixed(1)}M`;
    return `$${(val / 1000).toFixed(0)}K`;
  };

  const getHeatmapColor = (beta: number) => {
    if (beta > 1.3) return "bg-red-500/20 border-red-500/40 text-red-400";
    if (beta > 1.0) return "bg-orange-500/20 border-orange-500/40 text-orange-400";
    if (beta > 0.8) return "bg-yellow-500/20 border-yellow-500/40 text-yellow-400";
    return "bg-emerald-500/20 border-emerald-500/40 text-emerald-400";
  };

  const getMatrixCellColor = (val: number) => {
    if (val === 1.0) return "bg-white/10 text-white"; // Self
    if (val > 0.7) return "bg-red-500/40 text-red-100"; // High Correlation
    if (val > 0.4) return "bg-orange-500/30 text-orange-200"; // Moderate
    if (val > 0) return "bg-white/5 text-neutral-400"; // Low
    if (val > -0.3) return "bg-emerald-500/20 text-emerald-200"; // Low inverse
    return "bg-emerald-500/40 text-emerald-100"; // Strong Hedge
  };

  const getPlainEnglishCorrelation = (val: number) => {
    if (val === 1.0) return "Perfectly Correlated (Same Asset)";
    if (val > 0.7) return "Highly Correlated: These assets move in the exact same direction. High systemic risk.";
    if (val > 0.4) return "Moderately Correlated: Tends to drift in the same general direction.";
    if (val > 0) return "Weakly Correlated: Very little relationship to each other.";
    if (val > -0.3) return "Slight Hedge: Mild tendency to move in opposite directions.";
    return "Strong Hedge: Moves in opposite directions, actively protecting your portfolio.";
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, ease: "easeOut" }}
      className="w-full flex flex-col gap-6"
    >
      {/* 1. Systemic Risk Gauge (New Intuitive Feature) */}
      <div className="w-full ventriloc-card rounded-[24px] bg-[#0a0a0a]/80 border border-luxury-glass backdrop-blur-md p-6 lg:p-8 flex flex-col lg:flex-row items-center gap-8 relative overflow-hidden">
        
        {/* Animated Circular Gauge */}
        <div className="relative w-48 h-48 shrink-0 flex items-center justify-center">
          <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
            {/* Track */}
            <circle cx="50" cy="50" r="45" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="8" />
            {/* Fill */}
            <motion.circle 
              cx="50" cy="50" r="45" fill="none" 
              stroke={riskCategory.stroke} 
              strokeWidth="8"
              strokeDasharray={`${2 * Math.PI * 45}`}
              initial={{ strokeDashoffset: 2 * Math.PI * 45 }}
              animate={{ strokeDashoffset: (2 * Math.PI * 45) * (1 - riskScore / 100) }}
              transition={{ duration: 1.5, ease: "easeOut" }}
              strokeLinecap="round"
            />
          </svg>
          <div className="absolute flex flex-col items-center justify-center text-center">
            <span className="text-3xl font-display font-bold text-white">{Math.round(riskScore)}</span>
            <span className="text-[10px] font-mono uppercase tracking-widest text-neutral-500">Risk Score</span>
          </div>
        </div>

        {/* Gauge Details */}
        <div className="flex-1 flex flex-col items-center lg:items-start text-center lg:text-left gap-3">
          <div className={`flex items-center gap-2 px-3 py-1 rounded-full ${riskCategory.bg}/20 border border-${riskCategory.stroke}/30`}>
            <riskCategory.icon className={`w-4 h-4 ${riskCategory.color}`} />
            <span className={`text-xs font-bold uppercase tracking-widest ${riskCategory.color}`}>
              {riskCategory.label}
            </span>
          </div>
          
          <h2 className="text-2xl font-display text-white">Systemic Market Risk</h2>
          <p className="text-sm text-neutral-400 max-w-lg leading-relaxed">
            {riskCategory.desc} Your simulated portfolio currently has a base Value at Risk (VaR) of <span className="text-white font-bold">{formatCurrency(totalVaR)}</span> assuming standard capital allocation.
          </p>

          <div className="flex gap-6 mt-2">
            <div>
              <div className="text-[10px] uppercase font-mono tracking-widest text-neutral-500 mb-1">Avg Market Beta</div>
              <div className="text-lg font-bold text-white">{averageBeta.toFixed(2)}x</div>
            </div>
            <div>
              <div className="text-[10px] uppercase font-mono tracking-widest text-neutral-500 mb-1">Avg Volatility</div>
              <div className="text-lg font-bold text-white">{averageVol.toFixed(1)}%</div>
            </div>
          </div>
        </div>
      </div>


      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* 2. Plain-English Correlation Matrix */}
        <div className="lg:col-span-6 ventriloc-card rounded-[24px] bg-[#0a0a0a]/60 border border-luxury-glass backdrop-blur-md p-6 flex flex-col relative overflow-hidden">
          <div className="mb-6">
            <h3 className="text-sm font-bold font-display uppercase tracking-widest text-white">Asset Relationship Map</h3>
            <p className="text-[10px] text-neutral-500 uppercase tracking-widest mt-1">Hover over any square to see how these assets interact.</p>
          </div>

          <div className="relative flex-1 flex flex-col items-center justify-center py-4">
            <div className="grid grid-cols-6 gap-1.5 w-full max-w-[420px] font-mono text-[10px] select-none">
              
              {/* Header corner */}
              <div className="h-10 w-10 flex items-center justify-center text-neutral-600 border-b border-r border-white/5">Asset</div>

              {/* Column labels */}
              {activeTickers.map((ticker) => (
                <div key={`col-${ticker}`} className="h-10 w-10 flex items-center justify-center text-neutral-400 font-bold border-b border-white/5">
                  {ticker.slice(0,4)}
                </div>
              ))}

              {activeTickers.map((rowTicker, i) => (
                <Fragment key={`row-group-${i}`}>
                  {/* Row label */}
                  <div className="h-10 w-10 flex items-center justify-center text-neutral-400 font-bold border-r border-white/5">
                    {rowTicker.slice(0,4)}
                  </div>

                  {/* Cells */}
                  {correlationMatrix[i].map((val, j) => (
                    <div
                      key={`cell-${i}-${j}`}
                      onMouseEnter={() => setHoveredCell({ i, j })}
                      onMouseLeave={() => setHoveredCell(null)}
                      className={`h-10 w-10 rounded-lg flex items-center justify-center font-bold transition-all duration-150 cursor-crosshair transform-gpu hover:scale-110 hover:z-10 shadow-lg ${getMatrixCellColor(val)}`}
                    >
                      {val.toFixed(2)}
                    </div>
                  ))}
                </Fragment>
              ))}
            </div>

            {/* Intuitive Tooltip */}
            <div className="mt-8 flex items-center justify-center w-full min-h-[80px]">
              <AnimatePresence mode="wait">
                {hoveredCell ? (
                  <motion.div
                    key="tooltip-active"
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -5 }}
                    className="p-stack-sm rounded bg-surface-container-highest border border-outline-variant/30 w-full max-w-[400px]"
                  >
                    <div className="flex items-center justify-between font-mono text-xs mb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-on-surface font-bold px-2 py-1 bg-surface-variant rounded">{activeTickers[hoveredCell.i]}</span>
                        <span className="text-outline">and</span>
                        <span className="text-on-surface font-bold px-2 py-1 bg-surface-variant rounded">{activeTickers[hoveredCell.j]}</span>
                      </div>
                      <span className="text-secondary font-bold">r = {correlationMatrix[hoveredCell.i][hoveredCell.j].toFixed(2)}</span>
                    </div>
                    <p className="font-body-md text-[12px] text-on-surface-variant leading-relaxed">
                      {getPlainEnglishCorrelation(correlationMatrix[hoveredCell.i][hoveredCell.j])}
                    </p>
                  </motion.div>
                ) : (
                  <motion.div
                    key="tooltip-idle"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="font-label-sm text-[11px] text-outline font-mono italic"
                  >
                    Hover over a block to view relationship analysis
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>

        {/* 3. Visual VaR Sector Heatmap */}
        <div className="lg:col-span-6 rounded border border-outline-variant/30 bg-[#08080a]/60 backdrop-blur-md p-stack-md flex flex-col gap-stack-sm">
          <div>
            <h3 className="font-display-md text-[14px] font-bold uppercase tracking-widest text-on-surface">Sector Capital Exposure</h3>
            <p className="font-label-sm text-[11px] text-outline uppercase tracking-widest mt-1">Visual breakdown of where your capital is at risk.</p>
          </div>

          <div className="flex flex-col gap-3 mt-2 overflow-y-auto pr-2 custom-scrollbar max-h-[500px]">
            {sectorsData.map((sector) => {
              const isExpanded = expandedSector === sector.name;
              const varPercentage = (sector.varValue / totalVaR) * 100;

              return (
                <div
                  key={sector.name}
                  className={`rounded border transition-all duration-300 overflow-hidden ${
                    isExpanded ? "bg-surface-variant border-outline-variant/30" : "bg-[#050505] border-outline-variant/30 hover:bg-surface-container-highest"
                  }`}
                >
                  {/* Sector Header Trigger */}
                  <button
                    onClick={() => setExpandedSector(isExpanded ? null : sector.name)}
                    className="w-full p-4 flex flex-col gap-3 text-left"
                  >
                    <div className="flex items-center justify-between w-full">
                      <div className="font-label-sm text-[11px] uppercase font-bold tracking-wider text-on-surface">{sector.name}</div>
                      <div className="flex items-center gap-3">
                        <span className={`px-2.5 py-1 rounded text-[10px] font-mono font-bold border uppercase ${getHeatmapColor(sector.beta)}`}>
                          Vol: {sector.volatility}%
                        </span>
                        {isExpanded ? <ChevronUp className="w-4 h-4 text-neutral-400" /> : <ChevronDown className="w-4 h-4 text-neutral-400" />}
                      </div>
                    </div>

                    {/* VaR Progress Bar */}
                    <div className="w-full flex flex-col gap-1.5">
                      <div className="flex justify-between font-label-sm text-[10px] font-mono text-outline">
                        <span>Capital at Risk</span>
                        <span className="text-on-surface font-bold">{formatCurrency(sector.varValue)} ({varPercentage.toFixed(1)}%)</span>
                      </div>
                      <div className="w-full h-1.5 bg-outline-variant/30 rounded overflow-hidden">
                        <motion.div 
                          initial={{ width: 0 }}
                          animate={{ width: `${varPercentage}%` }}
                          transition={{ duration: 1, ease: "easeOut" }}
                          className={`h-full rounded-full ${getHeatmapColor(sector.beta).split(' ')[0]}`} // Extracts just the bg color
                        />
                      </div>
                    </div>
                  </button>

                  {/* Constituent details panel */}
                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3, ease: "easeInOut" }}
                        className="overflow-hidden border-t border-outline-variant/30 bg-[#000000]"
                      >
                        <div className="p-stack-sm flex flex-col gap-2 font-mono text-[10px]">
                          <div className="grid grid-cols-3 text-outline uppercase tracking-wider pb-1.5 border-b border-outline-variant/30">
                            <span>Asset</span>
                            <span className="text-center">Allocation</span>
                            <span className="text-right">Risk (Beta)</span>
                          </div>
                          {sector.constituents.map((item) => (
                            <div key={item.name} className="grid grid-cols-3 text-on-surface-variant py-1.5 items-center">
                              <span className="font-bold text-on-surface">{item.name}</span>
                              
                              {/* Mini allocation bar */}
                              <div className="flex items-center gap-2 justify-center">
                                <span className="w-8 text-right">{item.weight}%</span>
                                <div className="w-12 h-1 bg-outline-variant/30 rounded-full overflow-hidden">
                                  <div className="h-full bg-outline" style={{ width: `${item.weight}%` }} />
                                </div>
                              </div>
                              
                              <span className={`text-right font-bold ${item.beta > 1 ? 'text-orange-400' : 'text-emerald-400'}`}>
                                {item.beta.toFixed(2)}x
                              </span>
                            </div>
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>
        </div>

      </div>
    </motion.div>
  );
}
