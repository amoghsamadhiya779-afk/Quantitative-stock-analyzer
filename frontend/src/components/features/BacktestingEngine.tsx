"use client";

import { motion } from "framer-motion";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
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

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }} className="w-full space-y-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <BarChart3 className="text-accent w-4 h-4" />
          <h2 className="text-[10px] tracking-[0.2em] text-foreground/50 font-bold uppercase">1-Year Algorithmic Trading Simulator</h2>
        </div>
        <button onClick={handleRun} disabled={loading} className="flex items-center gap-2 px-5 py-2 bg-accent text-background font-bold uppercase tracking-widest text-[10px] rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50">
          {loading ? "Simulating..." : <><Play className="w-3 h-3" /> Execute Backtest</>}
        </button>
      </div>

      {error && <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm font-mono">{error}</div>}

      {!data && !loading ? (
        <div className="p-12 text-center border border-border border-dashed rounded-xl text-foreground/30 font-mono text-sm">
          <div className="mb-2">▶ AWAITING EXECUTION</div>
          <div className="text-[10px] text-foreground/20">Will vectorize 252 days of historical data for <strong>{selectedTicker}</strong> using <strong>{selectedAlgo}</strong></div>
        </div>
      ) : loading ? (
        <div className="flex items-center justify-center h-64 text-foreground/30 font-mono text-sm animate-pulse">Vectorizing historical data...</div>
      ) : data ? (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <MC title="Strategy Return" value={`${data.total_return.toFixed(2)}%`} sub={`Alpha: ${alpha >= 0 ? "+" : ""}${alpha.toFixed(2)}%`} subColor={alpha >= 0 ? "text-emerald-400" : "text-red-400"} />
            <MC title="Buy & Hold Return" value={`${data.bh_return.toFixed(2)}%`} />
            <MC title="Sharpe Ratio" value={data.sharpe_ratio.toFixed(2)} sub="Risk-Adjusted" />
            <MC title="Max Drawdown" value={`${data.max_drawdown.toFixed(2)}%`} sub="Peak-to-Trough" subColor="text-red-400" />
          </div>

          <div className="p-5 rounded-xl bg-surface border border-border" style={{ height: 420 }}>
            <div className="flex justify-between items-center mb-3">
              <h3 className="text-[10px] tracking-widest text-foreground/40 uppercase">Portfolio Value ($100k Starting Capital)</h3>
              <span className="text-[9px] font-mono text-foreground/30">{data.model_used}</span>
            </div>
            <ResponsiveContainer width="100%" height="90%">
              <LineChart data={chartData}>
                <XAxis dataKey="date" stroke="var(--border)" tick={{ fill: "var(--foreground)", opacity: 0.4, fontSize: 9 }} interval={Math.floor(chartData.length / 12)} />
                <YAxis domain={["auto", "auto"]} stroke="var(--border)" tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} tick={{ fill: "var(--foreground)", opacity: 0.4, fontSize: 10 }} />
                <Tooltip contentStyle={{ backgroundColor: "var(--background)", borderColor: "var(--border)", borderRadius: 8, fontSize: 11 }} formatter={(v: number) => `$${v.toLocaleString(undefined, { minimumFractionDigits: 2 })}`} />
                <Line type="monotone" dataKey="ai" stroke="var(--accent)" strokeWidth={2.5} dot={false} name="AI Strategy" />
                <Line type="monotone" dataKey="bh" stroke="var(--foreground)" strokeWidth={1.5} strokeDasharray="5 5" dot={false} opacity={0.5} name="Buy & Hold" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </>
      ) : null}
    </motion.div>
  );
}

function MC({ title, value, sub, subColor }: any) {
  return (
    <div className="p-4 rounded-xl bg-surface border border-border">
      <div className="text-[9px] tracking-widest text-foreground/40 uppercase mb-2">{title}</div>
      <div className="text-xl font-mono font-bold text-foreground">{value}</div>
      {sub && <div className={`text-[10px] mt-1 font-bold ${subColor || "text-foreground/40"}`}>{sub}</div>}
    </div>
  );
}
