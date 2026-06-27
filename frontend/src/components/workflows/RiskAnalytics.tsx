"use client";

import { useState, Fragment } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, ChevronUp } from "lucide-react";

// Correlation matrix data
const TICKERS = ["AAPL", "MSFT", "NVDA", "TSLA", "AMZN"];
const CORRELATION_MATRIX = [
  [1.0, 0.65, 0.48, 0.38, 0.58], // AAPL
  [0.65, 1.0, 0.52, 0.31, 0.62], // MSFT
  [0.48, 0.52, 1.0, 0.42, 0.51], // NVDA
  [0.38, 0.31, 0.42, 1.0, 0.35], // TSLA
  [0.58, 0.62, 0.51, 0.35, 1.0], // AMZN
];

// Heatmap sectors and data
interface Sector {
  name: string;
  volatility: number;
  beta: number;
  varValue: string;
  constituents: Array<{ name: string; weight: string; beta: number }>;
}

const SECTORS: Sector[] = [
  {
    name: "Technology",
    volatility: 24.5,
    beta: 1.35,
    varValue: "$1.4M",
    constituents: [
      { name: "AAPL", weight: "35%", beta: 1.15 },
      { name: "MSFT", weight: "30%", beta: 1.08 },
      { name: "NVDA", weight: "25%", beta: 1.62 },
      { name: "AVGO", weight: "10%", beta: 1.25 },
    ],
  },
  {
    name: "Financials",
    volatility: 16.2,
    beta: 0.95,
    varValue: "$820K",
    constituents: [
      { name: "JPM", weight: "40%", beta: 1.05 },
      { name: "BAC", weight: "30%", beta: 0.98 },
      { name: "MS", weight: "20%", beta: 1.20 },
      { name: "GS", weight: "10%", beta: 1.12 },
    ],
  },
  {
    name: "Healthcare",
    volatility: 14.8,
    beta: 0.78,
    varValue: "$650K",
    constituents: [
      { name: "LLY", weight: "35%", beta: 0.85 },
      { name: "UNH", weight: "30%", beta: 0.72 },
      { name: "JNJ", weight: "25%", beta: 0.60 },
      { name: "MRK", weight: "10%", beta: 0.68 },
    ],
  },
  {
    name: "Energy",
    volatility: 28.1,
    beta: 1.12,
    varValue: "$1.1M",
    constituents: [
      { name: "XOM", weight: "50%", beta: 1.08 },
      { name: "CVX", weight: "35%", beta: 1.02 },
      { name: "COP", weight: "15%", beta: 1.30 },
    ],
  },
  {
    name: "Utilities",
    volatility: 12.1,
    beta: 0.52,
    varValue: "$320K",
    constituents: [
      { name: "NEE", weight: "45%", beta: 0.55 },
      { name: "DUK", weight: "30%", beta: 0.48 },
      { name: "SO", weight: "25%", beta: 0.50 },
    ],
  },
];

export default function RiskAnalytics() {
  const [hoveredCell, setHoveredCell] = useState<{ i: number; j: number } | null>(null);
  const [expandedSector, setExpandedSector] = useState<string | null>(null);

  const getHeatmapColor = (beta: number) => {
    if (beta > 1.3) return "bg-red-500/20 border-red-500/40 text-red-400";
    if (beta > 1.0) return "bg-orange-500/20 border-orange-500/40 text-orange-400";
    if (beta > 0.8) return "bg-yellow-500/20 border-yellow-500/40 text-yellow-400";
    return "bg-emerald-500/20 border-emerald-500/40 text-emerald-400";
  };

  const getMatrixCellColor = (val: number) => {
    if (val === 1.0) return "bg-white/10 text-white";
    if (val > 0.6) return "bg-orange-500/30 text-orange-400";
    if (val > 0.4) return "bg-orange-500/20 text-orange-400/80";
    return "bg-white/5 text-neutral-400";
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, ease: "easeOut" }}
      className="w-full flex flex-col gap-6"
    >
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Rolling Correlation Matrix inside Frosted Glass Card */}
        <div className="lg:col-span-6 ventriloc-card rounded-[24px] bg-[#0a0a0a]/60 border border-luxury-glass backdrop-blur-md p-6 flex flex-col relative overflow-hidden">
          <div className="mb-6">
            <h3 className="text-sm font-bold font-display uppercase tracking-widest text-white">Cross-Asset Correlation Matrix</h3>
            <p className="text-[10px] text-neutral-500 uppercase tracking-widest mt-1">Rolling Pearson coefficient based on 90-day pricing history.</p>
          </div>

          <div className="relative flex-1 flex flex-col items-center justify-center py-4">
            <div className="grid grid-cols-6 gap-1.5 w-full max-w-[420px] font-mono text-[10px] select-none">
              
              {/* Header corner */}
              <div className="h-10 w-10 flex items-center justify-center text-neutral-500">Asset</div>

              {/* Column labels */}
              {TICKERS.map((ticker) => (
                <div key={`col-${ticker}`} className="h-10 w-10 flex items-center justify-center text-neutral-400 font-bold">
                  {ticker}
                </div>
              ))}

              {TICKERS.map((rowTicker, i) => (
                <Fragment key={`row-group-${i}`}>
                  {/* Row label */}
                  <div className="h-10 w-10 flex items-center justify-center text-neutral-400 font-bold">
                    {rowTicker}
                  </div>

                  {/* Cells */}
                  {CORRELATION_MATRIX[i].map((val, j) => (
                    <div
                      key={`cell-${i}-${j}`}
                      onMouseEnter={() => setHoveredCell({ i, j })}
                      onMouseLeave={() => setHoveredCell(null)}
                      className={`h-10 w-10 rounded-lg flex items-center justify-center font-bold transition-all duration-150 cursor-crosshair transform-gpu hover:scale-105 ${getMatrixCellColor(val)}`}
                    >
                      {val.toFixed(2)}
                    </div>
                  ))}
                </Fragment>
              ))}
            </div>

            {/* Matrix Hover Tooltip */}
            <div className="h-12 mt-6 flex items-center justify-center w-full">
              <AnimatePresence>
                {hoveredCell && (
                  <motion.div
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="px-4 py-2 rounded-xl bg-black border border-white/10 text-xs font-mono text-center"
                  >
                    <span className="text-orange-500 font-bold">{TICKERS[hoveredCell.i]}</span>
                    <span className="text-neutral-500 mx-2">vs</span>
                    <span className="text-orange-500 font-bold">{TICKERS[hoveredCell.j]}</span>
                    <span className="text-neutral-400 ml-3">Pearson:</span>
                    <span className="text-white font-bold ml-1.5">{CORRELATION_MATRIX[hoveredCell.i][hoveredCell.j].toFixed(4)}</span>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>

        {/* Risk Heatmap (Sector Volatility / Beta) */}
        <div className="lg:col-span-6 ventriloc-card rounded-[24px] bg-[#0a0a0a]/60 border border-luxury-glass backdrop-blur-md p-6 flex flex-col gap-4">
          <div>
            <h3 className="text-sm font-bold font-display uppercase tracking-widest text-white">Sector Exposure Heatmap</h3>
            <p className="text-[10px] text-neutral-500 uppercase tracking-widest mt-1">Real-time sector beta and expected Value-at-Risk calculations.</p>
          </div>

          <div className="flex flex-col gap-3">
            {SECTORS.map((sector) => {
              const isExpanded = expandedSector === sector.name;
              return (
                <div
                  key={sector.name}
                  className={`rounded-2xl border transition-all duration-300 overflow-hidden ${
                    isExpanded ? "bg-white/5 border-white/10" : "bg-black/20 border-white/5 hover:border-white/10"
                  }`}
                >
                  {/* Sector Header Trigger */}
                  <button
                    onClick={() => setExpandedSector(isExpanded ? null : sector.name)}
                    className="w-full p-4 flex items-center justify-between text-left"
                  >
                    <div>
                      <div className="text-xs uppercase font-bold tracking-wider text-white">{sector.name}</div>
                      <div className="flex items-center gap-3 text-[10px] font-mono text-neutral-500 mt-1 uppercase">
                        <span>Beta: {sector.beta.toFixed(2)}</span>
                        <span>Vol: {sector.volatility}%</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className={`px-2.5 py-1 rounded-lg text-[9px] font-mono font-bold border uppercase ${getHeatmapColor(sector.beta)}`}>
                        VaR: {sector.varValue}
                      </span>
                      {isExpanded ? <ChevronUp className="w-4 h-4 text-neutral-400" /> : <ChevronDown className="w-4 h-4 text-neutral-400" />}
                    </div>
                  </button>

                  {/* Constituent details panel */}
                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        initial={{ height: 0 }}
                        animate={{ height: "auto" }}
                        exit={{ height: 0 }}
                        transition={{ duration: 0.3, ease: "easeInOut" }}
                        className="overflow-hidden border-t border-white/5 bg-black/40"
                      >
                        <div className="p-4 flex flex-col gap-2 font-mono text-[10px]">
                          <div className="grid grid-cols-3 text-neutral-500 uppercase tracking-wider pb-1.5 border-b border-white/5">
                            <span>Constituent</span>
                            <span className="text-center">Allocation</span>
                            <span className="text-right">Beta Factor</span>
                          </div>
                          {sector.constituents.map((item) => (
                            <div key={item.name} className="grid grid-cols-3 text-neutral-300 py-1">
                              <span className="font-bold text-white">{item.name}</span>
                              <span className="text-center">{item.weight}</span>
                              <span className="text-right text-orange-500 font-bold">{item.beta.toFixed(2)}</span>
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
