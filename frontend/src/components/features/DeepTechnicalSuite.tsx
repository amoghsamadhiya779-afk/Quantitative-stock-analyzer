"use client";

import { motion } from "framer-motion";
import { ComposedChart, Line, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, BarChart } from "recharts";
import { Layers } from "lucide-react";
import type { StockData } from "@/lib/api";

interface Props {
  stockData: StockData | null;
}

export default function DeepTechnicalSuite({ stockData }: Props) {
  if (!stockData) return <div className="flex items-center justify-center h-64 text-foreground/30 font-mono text-sm animate-pulse">Loading technical data...</div>;

  const data = stockData.dates.map((d, i) => ({
    date: d.slice(5),
    close: stockData.closes[i],
    open: stockData.opens[i],
    high: stockData.highs[i],
    low: stockData.lows[i],
    upper: stockData.bb_upper[i],
    lower: stockData.bb_lower[i],
    volume: stockData.volumes[i],
    macd: stockData.macd[i],
    signal: stockData.signal_line[i],
    hist: stockData.macd[i] - stockData.signal_line[i],
    rsi: stockData.rsi_series[i],
  }));

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }} className="w-full space-y-4">
      <div className="flex items-center gap-2">
        <Layers className="text-accent w-4 h-4" />
        <h2 className="text-[10px] tracking-[0.2em] text-foreground/50 font-bold uppercase">Advanced Institutional Indicators</h2>
      </div>

      {/* Price + Bollinger */}
      <div className="p-5 rounded-xl bg-surface border border-border" style={{ height: 320 }}>
        <h3 className="text-[10px] tracking-widest text-foreground/40 uppercase mb-3">Price Action & Bollinger Channels</h3>
        <ResponsiveContainer width="100%" height="90%">
          <ComposedChart data={data}>
            <XAxis dataKey="date" stroke="var(--border)" tick={{ fill: "var(--foreground)", opacity: 0.4, fontSize: 9 }} interval={Math.floor(data.length / 12)} />
            <YAxis domain={["auto", "auto"]} stroke="var(--border)" tick={{ fill: "var(--foreground)", opacity: 0.4, fontSize: 10 }} tickFormatter={(v) => v.toLocaleString()} />
            <Tooltip contentStyle={{ backgroundColor: "var(--background)", borderColor: "var(--border)", borderRadius: 8, fontSize: 11 }} />
            <Line type="monotone" dataKey="upper" stroke="var(--foreground)" opacity={0.2} strokeDasharray="3 3" dot={false} name="BB Upper" />
            <Line type="monotone" dataKey="lower" stroke="var(--foreground)" opacity={0.2} strokeDasharray="3 3" dot={false} name="BB Lower" />
            <Line type="monotone" dataKey="close" stroke="var(--accent)" strokeWidth={2} dot={false} name="Close" />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Volume */}
        <div className="p-5 rounded-xl bg-surface border border-border" style={{ height: 200 }}>
          <h3 className="text-[10px] tracking-widest text-foreground/40 uppercase mb-3">Liquidity Density</h3>
          <ResponsiveContainer width="100%" height="85%">
            <BarChart data={data.slice(-60)}>
              <XAxis dataKey="date" hide />
              <Tooltip contentStyle={{ backgroundColor: "var(--background)", borderColor: "var(--border)", fontSize: 11 }} formatter={(v: number) => v.toLocaleString()} />
              <Bar dataKey="volume" fill="var(--accent)" opacity={0.4} radius={[2, 2, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* MACD */}
        <div className="p-5 rounded-xl bg-surface border border-border" style={{ height: 200 }}>
          <h3 className="text-[10px] tracking-widest text-foreground/40 uppercase mb-3">MACD Oscillator</h3>
          <ResponsiveContainer width="100%" height="85%">
            <ComposedChart data={data.slice(-60)}>
              <XAxis dataKey="date" hide />
              <Tooltip contentStyle={{ backgroundColor: "var(--background)", borderColor: "var(--border)", fontSize: 11 }} />
              <Line type="monotone" dataKey="macd" stroke="var(--accent)" dot={false} strokeWidth={2} name="MACD" />
              <Line type="monotone" dataKey="signal" stroke="#f59e0b" dot={false} strokeWidth={1.5} name="Signal" />
              <Bar dataKey="hist" fill="var(--accent)" opacity={0.2} name="Histogram" />
            </ComposedChart>
          </ResponsiveContainer>
        </div>

        {/* RSI */}
        <div className="p-5 rounded-xl bg-surface border border-border" style={{ height: 200 }}>
          <h3 className="text-[10px] tracking-widest text-foreground/40 uppercase mb-3">RSI (14)</h3>
          <ResponsiveContainer width="100%" height="85%">
            <ComposedChart data={data.slice(-60)}>
              <XAxis dataKey="date" hide />
              <YAxis domain={[0, 100]} stroke="var(--border)" tick={{ fill: "var(--foreground)", opacity: 0.4, fontSize: 10 }} />
              <Tooltip contentStyle={{ backgroundColor: "var(--background)", borderColor: "var(--border)", fontSize: 11 }} />
              <Line type="monotone" dataKey="rsi" stroke="var(--accent)" dot={false} strokeWidth={2} />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>
    </motion.div>
  );
}
