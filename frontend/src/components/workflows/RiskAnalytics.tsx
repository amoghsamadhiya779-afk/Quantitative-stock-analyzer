"use client";

import { useState, Fragment, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AlertTriangle, ShieldCheck, Activity } from "lucide-react";
import { useAssetStats, historicalVar95, maxDrawdown } from "@/lib/assetStats";

interface RiskProps {
  tickers?: string[];
  selectedMarket?: string;
}

const PORTFOLIO_VALUE = 100_000;

export default function RiskAnalytics({ tickers = [], selectedMarket = "United States (S&P 500)" }: RiskProps) {
  const [hoveredCell, setHoveredCell] = useState<{ i: number; j: number } | null>(null);

  // Everything below is computed from about a year of real daily closes for the market's
  // top five tickers, held in equal weights.
  const { stats, loading } = useAssetStats(selectedMarket, tickers);
  const activeTickers = useMemo(() => stats?.assets.map((a) => a.ticker) ?? [], [stats]);
  const correlationMatrix = stats?.correlation ?? [];

  const portfolio = useMemo(() => {
    if (!stats) return null;
    const r = stats.equalWeightReturns;
    const m = r.reduce((a, b) => a + b, 0) / r.length;
    const vol = Math.sqrt(r.reduce((a, b) => a + (b - m) ** 2, 0) / (r.length - 1)) * Math.sqrt(252) * 100;
    const avgStockVol = stats.assets.reduce((a, s) => a + s.annualVol, 0) / stats.assets.length;
    return { vol, avgStockVol, var95: historicalVar95(r), maxDd: maxDrawdown(r) };
  }, [stats]);

  // Score = annualised portfolio volatility on a 0-40% scale; the bands are stated in the UI.
  const riskScore = portfolio ? Math.min(100, (portfolio.vol / 40) * 100) : 0;
  let riskCategory = { label: "Low", color: "text-emerald-500", bg: "bg-emerald-500", stroke: "#10b981", icon: ShieldCheck, desc: "Realised volatility under 15% a year." };
  if (portfolio && portfolio.vol >= 15) riskCategory = { label: "Moderate", color: "text-yellow-500", bg: "bg-yellow-500", stroke: "#eab308", icon: Activity, desc: "Realised volatility of 15-25% a year, typical for a small equity basket." };
  if (portfolio && portfolio.vol >= 25) riskCategory = { label: "High", color: "text-orange-500", bg: "bg-orange-500", stroke: "#f97316", icon: AlertTriangle, desc: "Realised volatility of 25-35% a year." };
  if (portfolio && portfolio.vol >= 35) riskCategory = { label: "Extreme", color: "text-red-500", bg: "bg-red-500", stroke: "#ef4444", icon: AlertTriangle, desc: "Realised volatility above 35% a year." };

  const formatCurrency = (val: number) => `$${Math.round(val).toLocaleString()}`;
  const maxVar = stats ? Math.max(...stats.assets.map((a) => a.var95)) : 1;

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

  if (!stats || !portfolio) {
    return (
      <div className="p-6 rounded-[10px] border border-outline-variant/30 bg-surface-container/90 font-body-md text-[13px] text-on-surface-variant">
        {loading || tickers.length === 0 ? "Loading a year of prices for the market's top tickers…" : "Not enough shared price history to compute risk for this market."}
      </div>
    );
  }

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
            <span className="text-[10px] font-mono uppercase tracking-widest text-neutral-500">Vol score</span>
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
          
          <h2 className="text-2xl font-display text-white">Equal-weighted basket risk</h2>
          <p className="text-sm text-neutral-400 max-w-lg leading-relaxed">
            {riskCategory.desc} Held in equal weights, a {formatCurrency(PORTFOLIO_VALUE)} portfolio of {activeTickers.join(", ")} had a
            one-day 95% historical VaR of <span className="text-white font-bold">{formatCurrency(PORTFOLIO_VALUE * portfolio.var95 / 100)}</span> ({portfolio.var95.toFixed(2)}%)
            and a worst drawdown of <span className="text-white font-bold">{portfolio.maxDd.toFixed(1)}%</span> between {stats.start} and {stats.end}.
          </p>

          <div className="flex gap-6 mt-2">
            <div>
              <div className="text-[10px] uppercase font-mono tracking-widest text-neutral-500 mb-1">Basket volatility</div>
              <div className="text-lg font-bold text-white">{portfolio.vol.toFixed(1)}%</div>
            </div>
            <div>
              <div className="text-[10px] uppercase font-mono tracking-widest text-neutral-500 mb-1">Avg stock volatility</div>
              <div className="text-lg font-bold text-white">{portfolio.avgStockVol.toFixed(1)}%</div>
            </div>
          </div>
        </div>
      </div>


      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* 2. Plain-English Correlation Matrix */}
        <div className="lg:col-span-6 ventriloc-card rounded-[24px] bg-[#0a0a0a]/60 border border-luxury-glass backdrop-blur-md p-6 flex flex-col relative overflow-hidden">
          <div className="mb-6">
            <h3 className="text-sm font-bold font-display uppercase tracking-widest text-white">Asset Relationship Map</h3>
            <p className="text-[10px] text-neutral-500 uppercase tracking-widest mt-1">Correlation of daily returns, {stats.start} to {stats.end}. Hover a square for details.</p>
          </div>

          <div className="relative flex-1 flex flex-col items-center justify-center py-4">
            <div className="grid gap-1.5 w-fit max-w-full font-mono text-[10px] select-none" style={{ gridTemplateColumns: `repeat(${activeTickers.length + 1}, 2.5rem)` }}>
              
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

        {/* 3. Per-stock risk */}
        <div className="lg:col-span-6 rounded border border-outline-variant/30 bg-[#08080a]/60 backdrop-blur-md p-stack-md flex flex-col gap-stack-sm">
          <div>
            <h3 className="font-display-md text-[14px] font-bold uppercase tracking-widest text-on-surface">Risk by stock</h3>
            <p className="font-label-sm text-[11px] text-outline uppercase tracking-widest mt-1">Realised over the same window. Bar = one-day 95% VaR.</p>
          </div>
          <div className="flex flex-col gap-3 mt-2">
            {stats.assets.map((a) => (
              <div key={a.ticker} className="rounded border border-outline-variant/30 bg-[#050505] p-4 flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <span className="font-label-sm text-[11px] uppercase font-bold tracking-wider text-on-surface">{a.ticker}</span>
                  <span className="font-mono text-[10px] text-on-surface-variant">
                    Vol {a.annualVol.toFixed(1)}% · Max DD {a.maxDrawdown.toFixed(1)}%
                  </span>
                </div>
                <div className="w-full flex flex-col gap-1.5">
                  <div className="flex justify-between font-label-sm text-[10px] font-mono text-outline">
                    <span>1-day VaR (95%)</span>
                    <span className="text-on-surface font-bold">{a.var95.toFixed(2)}%</span>
                  </div>
                  <div className="w-full h-1.5 bg-outline-variant/30 rounded overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${(a.var95 / maxVar) * 100}%` }}
                      transition={{ duration: 0.8, ease: "easeOut" }}
                      className="h-full rounded-full bg-on-surface-variant"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </motion.div>
  );
}
