"use client";

import { motion } from "framer-motion";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, AreaChart, Area } from "recharts";
import { BarChart3, Play } from "lucide-react";
import { useState } from "react";
import { fetchBacktest, type BacktestResult } from "@/lib/api";

interface Props {
  selectedMarket: string;
  selectedTicker: string;
  selectedAlgo: string;
}

export default function BacktestingEngine({ selectedMarket, selectedTicker, selectedAlgo }: Props) {
  const [data, setData] = useState<BacktestResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleRun = async () => {
    if (!selectedMarket || !selectedTicker) return;
    setLoading(true);
    setError("");
    try {
      const result = await fetchBacktest(selectedMarket, selectedTicker);
      setData(result);
    } catch (e: any) {
      setError(e.message || "Backtest failed");
    } finally {
      setLoading(false);
    }
  };

  const chartData = data
    ? data.dates.map((d, i) => ({
        date: d.slice(5),
        ai: data.strategy_equity[i],
        bh: data.buy_hold_equity[i],
      }))
    : [];

  const alpha = data ? data.total_return - data.bh_return : 0;

  // Premium Tooltip
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-black/80 backdrop-blur-md border border-[var(--border)] p-3 rounded-lg shadow-xl">
          <p className="text-[10px] uppercase text-[var(--foreground)]/50 mb-2 font-bold tracking-widest border-b border-[var(--border)] pb-1">{label}</p>
          {payload.map((entry: any, index: number) => (
            <div key={index} className="flex items-center gap-3 text-xs font-mono my-1">
              <span style={{ color: entry.color }} className="font-bold flex-1">{entry.name}:</span>
              <span className="text-[var(--foreground)] text-right">${Number(entry.value).toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }} className="w-full space-y-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <BarChart3 className="text-[var(--accent)] w-4 h-4" />
          <h2 className="text-[10px] tracking-[0.2em] text-[var(--foreground)]/50 font-bold uppercase">1-Year Algorithmic Trading Simulator</h2>
        </div>
        <button onClick={handleRun} disabled={loading} className="flex items-center gap-2 px-6 py-2.5 bg-[var(--accent)] text-[var(--background)] font-bold uppercase tracking-widest text-[10px] rounded-lg hover:shadow-[0_0_20px_var(--glow)] transition-all disabled:opacity-50">
          {loading ? "Simulating..." : <><Play className="w-3 h-3" /> Execute Backtest</>}
        </button>
      </div>

      {error && <div className="p-4 rounded-xl bg-red-500/10 border border-[var(--loss)] text-[var(--loss)] text-sm font-mono">{error}</div>}

      {!data && !loading ? (
        <div className="p-16 text-center border border-[var(--border)] border-dashed rounded-2xl text-[var(--foreground)]/30 font-mono text-sm bg-[var(--surface)] hover:bg-white/5 transition-colors cursor-default">
          <div className="mb-3 tracking-widest uppercase font-bold text-xs">▶ AWAITING EXECUTION</div>
          <div className="text-[10px] text-[var(--foreground)]/20 uppercase">Will vectorize 252 days of historical data for <strong className="text-[var(--foreground)]/50">{selectedTicker}</strong> using <strong className="text-[var(--accent)]">{selectedAlgo}</strong></div>
        </div>
      ) : loading ? (
        <div className="w-full h-96 rounded-2xl border border-[var(--border)] bg-[var(--surface)] flex items-center justify-center overflow-hidden relative">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full animate-[shimmer_1.5s_infinite]" />
          <div className="font-mono text-[var(--foreground)]/30 uppercase tracking-widest text-xs z-10">Vectorizing historical data...</div>
        </div>
      ) : data ? (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <MC title="Strategy Return" value={`${data.total_return.toFixed(2)}%`} sub={`Alpha: ${alpha >= 0 ? "+" : ""}${alpha.toFixed(2)}%`} subColor={alpha >= 0 ? "text-[var(--profit)]" : "text-[var(--loss)]"} />
            <MC title="Buy & Hold Return" value={`${data.bh_return.toFixed(2)}%`} />
            <MC title="Sharpe Ratio" value={data.sharpe_ratio.toFixed(2)} sub="Risk-Adjusted" />
            <MC title="Max Drawdown" value={`${data.max_drawdown.toFixed(2)}%`} sub="Peak-to-Trough" subColor="text-[var(--loss)]" />
          </div>

          <div className="p-5 rounded-2xl bg-[var(--surface)] border border-[var(--border)] shadow-lg hover:shadow-[0_8px_30px_rgba(0,0,0,0.4)] transition-shadow" style={{ height: 450 }}>
            <div className="flex justify-between items-center mb-5">
              <h3 className="text-[10px] tracking-widest text-[var(--foreground)]/40 uppercase">Portfolio Value ($100k Starting Capital)</h3>
              <span className="text-[9px] font-mono text-[var(--accent)] px-3 py-1 rounded bg-[var(--accent)]/10 border border-[var(--accent)]/20">{data.model_used}</span>
            </div>
            <ResponsiveContainer width="100%" height="88%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorAi" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--accent)" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="var(--accent)" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis dataKey="date" stroke="var(--border)" tick={{ fill: "var(--foreground)", opacity: 0.4, fontSize: 9, fontFamily: 'monospace' }} interval={Math.floor(chartData.length / 12)} axisLine={false} tickMargin={10} />
                <YAxis domain={["auto", "auto"]} stroke="var(--border)" tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} tick={{ fill: "var(--foreground)", opacity: 0.4, fontSize: 10, fontFamily: 'monospace' }} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} cursor={{ stroke: 'var(--border)', strokeWidth: 1, strokeDasharray: '4 4' }} />
                <Line type="monotone" dataKey="bh" stroke="var(--foreground)" strokeWidth={1.5} strokeDasharray="5 5" dot={false} opacity={0.5} name="Buy & Hold" />
                <Area type="monotone" dataKey="ai" stroke="var(--accent)" fillOpacity={1} fill="url(#colorAi)" strokeWidth={3} dot={false} name="AI Strategy" isAnimationActive={true} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </>
      ) : null}
    </motion.div>
  );
}

function MC({ title, value, sub, subColor }: any) {
  return (
    <div className="p-5 rounded-2xl bg-[var(--surface)] border border-[var(--border)] transition-all hover:border-[var(--border)] hover:shadow-[0_8px_30px_rgba(0,0,0,0.4)] shadow-md relative overflow-hidden group">
      <div className="absolute top-0 right-0 w-24 h-24 bg-[var(--accent)] rounded-full blur-[60px] opacity-0 group-hover:opacity-10 transition-opacity pointer-events-none" />
      <div className="text-[9px] tracking-widest text-[var(--foreground)]/40 uppercase mb-2 relative z-10">{title}</div>
      <div className="text-xl font-mono font-bold text-[var(--foreground)] relative z-10">{value}</div>
      {sub && <div className={`text-[10px] mt-1 font-bold relative z-10 ${subColor || "text-[var(--foreground)]/40"}`}>{sub}</div>}
    </div>
  );
}
