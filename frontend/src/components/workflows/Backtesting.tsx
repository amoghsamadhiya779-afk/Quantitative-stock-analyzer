"use client";

import { useState, useMemo, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, Line, ComposedChart } from "recharts";
import { Play, RotateCcw, BarChart4 } from "lucide-react";

interface CurvePoint {
  date: string;
  strategy: number;
  benchmark: number;
}

const STRATEGIES = {
  "MACD Crossover": {
    name: "MACD Crossover Strategy",
    sharpe: 2.14,
    drawdown: -12.4,
    winRate: "62.4%",
    returnMultiplier: 1.6,
  },
  "Mean Reversion": {
    name: "Bollinger Mean Reversion",
    sharpe: 1.85,
    drawdown: -8.9,
    winRate: "68.1%",
    returnMultiplier: 1.35,
  },
  "Trend Following": {
    name: "Dual Moving Average Ribbon",
    sharpe: 2.45,
    drawdown: -15.2,
    winRate: "58.7%",
    returnMultiplier: 1.95,
  },
  "ML Breakout": {
    name: "AI Quant Breakout Predictor",
    sharpe: 2.82,
    drawdown: -11.1,
    winRate: "72.3%",
    returnMultiplier: 2.4,
  },
};

export default function Backtesting() {
  const [selectedStrategy, setSelectedStrategy] = useState<keyof typeof STRATEGIES>("MACD Crossover");
  const [lookback, setLookback] = useState(60);
  const [isRunning, setIsRunning] = useState(false);
  const [backtestRunCount, setBacktestRunCount] = useState(0);

  const strategyInfo = STRATEGIES[selectedStrategy];

  // Simulating the cumulative equity curve based on strategy metrics & lookback
  const equityCurve: CurvePoint[] = useMemo(() => {
    const list: CurvePoint[] = [];
    let stratVal = 100.0;
    let benchVal = 100.0;
    const mult = strategyInfo.returnMultiplier;

    for (let i = 0; i <= lookback; i++) {
      const date = new Date();
      date.setDate(date.getDate() - (lookback - i));
      const dateStr = date.toLocaleDateString("en-US", { month: "short", day: "numeric" });

      // Daily returns simulation
      const baseReturn = (Math.random() - 0.45) * 1.5; // Benchmark random walk
      const stratReturn = baseReturn * 0.4 + (Math.random() - 0.3) * 2.2 * mult;

      benchVal += baseReturn;
      stratVal += stratReturn;

      list.push({
        date: dateStr,
        strategy: parseFloat(Math.max(50, stratVal).toFixed(2)),
        benchmark: parseFloat(Math.max(50, benchVal).toFixed(2)),
      });
    }

    return list;
  }, [selectedStrategy, lookback, backtestRunCount]);

  const handleRunSimulation = () => {
    setIsRunning(true);
    setTimeout(() => {
      setBacktestRunCount((prev) => prev + 1);
      setIsRunning(false);
    }, 800);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, ease: "easeOut" }}
      className="w-full flex flex-col gap-6"
    >
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Parameters & Strategy selection */}
        <div className="lg:col-span-4 ventriloc-card rounded-[24px] bg-[#0a0a0a] border border-luxury-glass p-6 flex flex-col gap-5">
          <div className="flex items-center gap-2">
            <BarChart4 className="w-4 h-4 text-orange-500" />
            <h3 className="text-xs uppercase font-mono font-bold tracking-widest text-neutral-400">Simulation Settings</h3>
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-[10px] uppercase font-mono tracking-widest text-neutral-500">Target Strategy</label>
            <div className="flex flex-col gap-2">
              {(Object.keys(STRATEGIES) as Array<keyof typeof STRATEGIES>).map((key) => (
                <button
                  key={key}
                  onClick={() => setSelectedStrategy(key)}
                  disabled={isRunning}
                  className={`w-full text-left p-3 rounded-[16px] border text-xs uppercase tracking-wider transition-all duration-200 ${
                    selectedStrategy === key
                      ? "border-orange-500/30 bg-orange-500/10 text-white font-bold"
                      : "border-white/5 bg-white/5 text-neutral-400 hover:border-white/10 hover:bg-white/10"
                  } ${isRunning ? "opacity-50 cursor-not-allowed" : ""}`}
                >
                  {key}
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-2 mt-2">
            <div className="flex justify-between text-xs font-mono">
              <span className="text-neutral-400">Lookback Period</span>
              <span className="text-white font-bold">{lookback} Days</span>
            </div>
            <input
              type="range"
              min="30"
              max="180"
              step="5"
              value={lookback}
              onChange={(e) => setLookback(parseInt(e.target.value))}
              disabled={isRunning}
              className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-orange-500 disabled:opacity-50 disabled:cursor-not-allowed"
            />
          </div>

          <button
            onClick={handleRunSimulation}
            disabled={isRunning}
            className="w-full mt-4 py-3 rounded-full bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-all duration-200 disabled:opacity-50"
          >
            {isRunning ? (
              <>
                <RotateCcw className="w-4 h-4 animate-spin" /> Simulating...
              </>
            ) : (
              <>
                <Play className="w-4 h-4" /> Run Backtest
              </>
            )}
          </button>
        </div>

        {/* Backtest Results Area */}
        <div className="lg:col-span-8 flex flex-col gap-4">
          
          {/* Main Chart */}
          <div className="ventriloc-card rounded-[24px] bg-[#0a0a0a] border border-luxury-glass p-6 flex flex-col gap-4 relative overflow-hidden">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-sm font-bold font-display uppercase tracking-widest text-white">Cumulative Return Equity Curve</h2>
                <p className="text-[10px] text-neutral-500 uppercase tracking-widest mt-1">Comparing strategy equity simulation against baseline buy-and-hold index.</p>
              </div>

              <div className="flex items-center gap-3 text-[10px] font-mono">
                <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-orange-500"></span>Strategy</span>
                <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-neutral-600"></span>Benchmark</span>
              </div>
            </div>

            <div className="w-full h-[280px] relative">
              <AnimatePresence>
                {isRunning && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute inset-0 bg-black/60 backdrop-blur-sm z-10 flex items-center justify-center"
                  >
                    <div className="flex flex-col items-center gap-2">
                      <div className="w-8 h-8 rounded-full border-2 border-white/10 border-t-orange-500 animate-spin" />
                      <span className="text-[10px] font-mono uppercase tracking-widest text-neutral-400">Processing backtest simulation...</span>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={equityCurve} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="strategyGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#ea580c" stopOpacity={0.15}/>
                      <stop offset="95%" stopColor="#ea580c" stopOpacity={0.0}/>
                    </linearGradient>
                  </defs>
                  
                  <XAxis
                    dataKey="date"
                    stroke="rgba(255,255,255,0.08)"
                    tick={{ fill: "rgba(255,255,255,0.4)", fontSize: 9 }}
                  />
                  <YAxis
                    domain={["auto", "auto"]}
                    stroke="rgba(255,255,255,0.08)"
                    tick={{ fill: "rgba(255,255,255,0.4)", fontSize: 9, fontFamily: "monospace" }}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#050505",
                      borderColor: "rgba(255,255,255,0.08)",
                      borderRadius: "16px",
                      fontSize: "12px",
                      fontFamily: "monospace",
                    }}
                    itemStyle={{ color: "#fff" }}
                  />

                  <Area
                    type="monotone"
                    dataKey="strategy"
                    stroke="none"
                    fill="url(#strategyGrad)"
                  />
                  
                  <Line
                    type="monotone"
                    dataKey="benchmark"
                    stroke="#4b5563"
                    strokeWidth={1.5}
                    dot={false}
                    name="Benchmark (Buy & Hold)"
                  />

                  <Line
                    type="monotone"
                    dataKey="strategy"
                    stroke="#ea580c"
                    strokeWidth={2}
                    dot={false}
                    name="Strategy Equity"
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Quick Metrics Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-4 ventriloc-card rounded-[24px] bg-[#0a0a0a] border border-luxury-glass flex flex-col justify-center">
              <span className="text-[9px] font-semibold uppercase tracking-widest text-neutral-500 mb-1">Total Return</span>
              <div className="text-xl font-bold font-mono text-white flex items-center gap-1">
                {(equityCurve[equityCurve.length - 1].strategy - 100).toFixed(1)}%
              </div>
            </div>

            <div className="p-4 ventriloc-card rounded-[24px] bg-[#0a0a0a] border border-luxury-glass flex flex-col justify-center">
              <span className="text-[9px] font-semibold uppercase tracking-widest text-neutral-500 mb-1">Sharpe Ratio</span>
              <div className="text-xl font-bold font-mono text-emerald-400">
                {strategyInfo.sharpe}
              </div>
            </div>

            <div className="p-4 ventriloc-card rounded-[24px] bg-[#0a0a0a] border border-luxury-glass flex flex-col justify-center">
              <span className="text-[9px] font-semibold uppercase tracking-widest text-neutral-500 mb-1">Max Drawdown</span>
              <div className="text-xl font-bold font-mono text-red-500">
                {strategyInfo.drawdown}%
              </div>
            </div>

            <div className="p-4 ventriloc-card rounded-[24px] bg-[#0a0a0a] border border-luxury-glass flex flex-col justify-center">
              <span className="text-[9px] font-semibold uppercase tracking-widest text-neutral-500 mb-1">Win Rate</span>
              <div className="text-xl font-bold font-mono text-white">
                {strategyInfo.winRate}
              </div>
            </div>
          </div>

        </div>

      </div>
    </motion.div>
  );
}
