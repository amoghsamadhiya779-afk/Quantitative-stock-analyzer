"use client";

import { motion } from "framer-motion";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { Activity, TrendingDown, TrendingUp } from "lucide-react";
import type { StockData, PredictionResult } from "@/lib/api";

interface Props {
  stockData: StockData | null;
  prediction: PredictionResult | null;
  currency: string;
  selectedAlgo: string;
  selectedMarket: string;
  selectedTicker: string;
}

export default function MacroRiskEngine({ stockData, prediction, currency, selectedAlgo, selectedMarket, selectedTicker }: Props) {
  if (!stockData) return <LoadingState />;

  const returns = stockData.closes.slice(1).map((c, i) => (c - stockData.closes[i]) / stockData.closes[i]);
  const meanReturn = returns.reduce((a, b) => a + b, 0) / returns.length;
  const stdReturn = Math.sqrt(returns.map((r) => (r - meanReturn) ** 2).reduce((a, b) => a + b, 0) / returns.length);
  const sharpe = stdReturn > 0 ? (meanReturn / stdReturn) * Math.sqrt(252) : 0;
  const sortedReturns = [...returns].sort((a, b) => a - b);
  const var95 = sortedReturns[Math.floor(sortedReturns.length * 0.05)] * 100;

  // Build Monte Carlo chart data from real closes + simulated projections
  const tail = stockData.closes.slice(-30);
  const tailDates = stockData.dates.slice(-30);
  const lastPrice = tail[tail.length - 1];

  const chartData = tail.map((c, i) => {
    const point: any = { day: tailDates[i]?.slice(5) || `D${i}`, historical: c };
    return point;
  });

  // Generate 5-day MC projections
  for (let d = 1; d <= 5; d++) {
    const point: any = { day: `T+${d}` };
    for (let p = 0; p < 8; p++) {
      let price = lastPrice;
      for (let s = 0; s < d; s++) {
        price *= 1 + (Math.random() - 0.48) * stdReturn * 3;
      }
      point[`path${p}`] = price;
    }
    if (prediction && d === 1) point.aiTarget = prediction.predicted_price;
    chartData.push(point);
  }

  // Premium Tooltip
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-black/80 backdrop-blur-md border border-[var(--border)] p-3 rounded-lg shadow-xl">
          <p className="text-[10px] uppercase text-[var(--foreground)]/50 mb-2 font-bold tracking-widest border-b border-[var(--border)] pb-1">{label}</p>
          {payload.map((entry: any, index: number) => {
            if(entry.dataKey.startsWith('path')) return null; // hide paths from tooltip to avoid clutter
            return (
              <div key={index} className="flex items-center gap-3 text-xs font-mono my-1">
                <span style={{ color: entry.color }} className="font-bold flex-1">{entry.name}:</span>
                <span className="text-[var(--foreground)] text-right">{Number(entry.value).toLocaleString(undefined, { maximumFractionDigits: 2 })}</span>
              </div>
            );
          })}
        </div>
      );
    }
    return null;
  };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }} className="w-full space-y-5">
      <SectionHeader icon={<Activity className="text-[var(--accent)] w-4 h-4" />} title="Quantitative Metrics & Risk Modeling" />

      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
        <MetricCard title="Algo Target (T+1)" value={prediction ? `${prediction.predicted_price.toLocaleString(undefined, { minimumFractionDigits: 2 })} ${currency}` : "—"} sub={prediction ? `${prediction.pct_change >= 0 ? "+" : ""}${prediction.pct_change.toFixed(2)}% (Expected)` : ""} icon={prediction && prediction.pct_change >= 0 ? <TrendingUp className="w-4 h-4 text-[var(--profit)]" /> : <TrendingDown className="w-4 h-4 text-[var(--loss)]" />} />
        <MetricCard title="Historical Sharpe" value={sharpe.toFixed(2)} sub="Risk-Adjusted Alpha" />
        <MetricCard title="Value at Risk (95%)" value={`${var95.toFixed(2)}%`} sub="Max Daily Loss" icon={<TrendingDown className="w-4 h-4 text-[var(--loss)]" />} />
        <div className="p-4 rounded-2xl bg-[var(--surface)] border border-[var(--border)] flex flex-col justify-center items-center text-center transition-all hover:border-[var(--accent)] shadow-md hover:shadow-[0_8px_30px_var(--glow)]">
          <h4 className="text-xl text-[var(--accent)] font-bold tracking-tight">★ {prediction ? prediction.confidence.toFixed(1) : "—"}%</h4>
          <span className="text-[9px] text-[var(--foreground)]/40 uppercase tracking-widest mt-1">{prediction?.model_type || selectedAlgo}</span>
        </div>
      </div>

      <div className="p-5 rounded-2xl bg-[var(--surface)] border border-[var(--border)] shadow-lg hover:shadow-[0_8px_30px_rgba(0,0,0,0.4)] transition-shadow" style={{ height: 380 }}>
        <h3 className="text-[10px] tracking-widest text-[var(--foreground)]/40 uppercase mb-3">Monte Carlo Projection — {selectedAlgo.split("-")[0].trim()}</h3>
        <ResponsiveContainer width="100%" height="90%" minWidth={0} minHeight={0}>
          <LineChart data={chartData}>
            <XAxis dataKey="day" stroke="var(--border)" tick={{ fill: "var(--foreground)", opacity: 0.4, fontSize: 10, fontFamily: 'monospace' }} axisLine={false} tickMargin={10} />
            <YAxis domain={["auto", "auto"]} stroke="var(--border)" tick={{ fill: "var(--foreground)", opacity: 0.4, fontSize: 10, fontFamily: 'monospace' }} tickFormatter={(v) => v.toLocaleString()} axisLine={false} tickLine={false} />
            <Tooltip content={<CustomTooltip />} cursor={{ stroke: 'var(--border)', strokeWidth: 1, strokeDasharray: '4 4' }} />
            {Array.from({ length: 8 }).map((_, i) => (
              <Line key={i} type="monotone" dataKey={`path${i}`} stroke="var(--accent)" strokeWidth={1.5} dot={false} opacity={0.15} connectNulls={false} isAnimationActive={true} />
            ))}
            <Line type="monotone" dataKey="historical" stroke="var(--foreground)" strokeWidth={2.5} dot={false} isAnimationActive={true} name="Historical" />
            <Line type="monotone" dataKey="aiTarget" stroke="var(--profit)" strokeWidth={3} strokeDasharray="5 5" dot={{ r: 6, fill: "var(--profit)", stroke: 'var(--background)', strokeWidth: 2 }} isAnimationActive={true} name="AI Target" />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </motion.div>
  );
}

function SectionHeader({ icon, title }: { icon: React.ReactNode; title: string }) {
  return (
    <div className="flex items-center gap-2">
      {icon}
      <h2 className="text-[10px] tracking-[0.2em] text-[var(--foreground)]/50 font-bold uppercase">{title}</h2>
    </div>
  );
}

function MetricCard({ title, value, sub, icon }: any) {
  return (
    <div className="p-5 rounded-2xl bg-[var(--surface)] border border-[var(--border)] transition-all hover:border-[var(--border)] hover:shadow-[0_8px_30px_rgba(0,0,0,0.4)] shadow-md group relative overflow-hidden">
      <div className="absolute top-0 right-0 w-24 h-24 bg-[var(--accent)] rounded-full blur-[60px] opacity-0 group-hover:opacity-10 transition-opacity pointer-events-none" />
      <div className="text-[9px] tracking-widest text-[var(--foreground)]/40 uppercase mb-2 relative z-10">{title}</div>
      <div className="text-xl font-mono font-bold text-[var(--foreground)] mb-1 flex items-center gap-2 relative z-10">{value} {icon}</div>
      <div className="text-[10px] text-[var(--foreground)]/40 relative z-10">{sub}</div>
    </div>
  );
}

function LoadingState() {
  return (
    <div className="w-full h-96 rounded-2xl border border-[var(--border)] bg-[var(--surface)] flex items-center justify-center overflow-hidden relative">
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full animate-[shimmer_1.5s_infinite]" />
    </div>
  );
}
