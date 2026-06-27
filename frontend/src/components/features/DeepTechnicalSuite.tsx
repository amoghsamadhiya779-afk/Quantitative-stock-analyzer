"use client";

import { motion } from "framer-motion";
import { ComposedChart, Line, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, BarChart, Area, AreaChart } from "recharts";
import { Layers } from "lucide-react";
import type { StockData } from "@/lib/api";

interface Props {
  stockData: StockData | null;
}

import LightweightChart from "../ui/LightweightChart";
import SkeletonCard from "../ui/SkeletonCard";

export default function DeepTechnicalSuite({ stockData }: Props) {
  if (!stockData) return (
    <div className="w-full space-y-4">
      <SkeletonCard height={380} titleWidth="w-1/4" />
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <SkeletonCard height={220} titleWidth="w-1/2" />
        <SkeletonCard height={220} titleWidth="w-1/2" />
        <SkeletonCard height={220} titleWidth="w-1/2" />
      </div>
    </div>
  );

  const data = stockData.dates.map((d, i) => ({
    date: d.slice(5), // for Recharts
    time: d, // for Lightweight Charts (must be YYYY-MM-DD)
    close: Number(stockData.closes[i]),
    open: Number(stockData.opens[i]),
    high: Number(stockData.highs[i]),
    low: Number(stockData.lows[i]),
    upper: Number(stockData.bb_upper[i]),
    lower: Number(stockData.bb_lower[i]),
    volume: Number(stockData.volumes[i]),
    macd: Number(stockData.macd[i]),
    signal: Number(stockData.signal_line[i]),
    hist: Number(stockData.macd[i]) - Number(stockData.signal_line[i]),
    rsi: Number(stockData.rsi_series[i]),
  }));

  // Map to LightweightChart format
  const volumeData = data.slice(-60).map(d => ({ time: d.time as any, value: d.volume }));
  const rsiData = data.slice(-60).map(d => ({ time: d.time as any, value: d.rsi }));
  const macdData = data.slice(-60).map(d => ({ time: d.time as any, value: d.macd }));

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-surface border border-[var(--border)] p-3 rounded-card shadow-card">
          <p className="text-[10px] uppercase text-[var(--color-slate)] mb-2 font-semibold tracking-widest border-b border-[var(--border)] pb-1">{label}</p>
          {payload.map((entry: any, index: number) => (
            <div key={index} className="flex items-center gap-3 text-xs font-mono my-1">
              <span style={{ color: entry.color }} className="font-bold flex-1">{entry.name}:</span>
              <span className="text-[var(--foreground)] text-right">{Number(entry.value).toLocaleString(undefined, { maximumFractionDigits: 2 })}</span>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }} className="w-full space-y-4">
      <div className="flex items-center gap-2">
        <Layers className="text-[var(--accent)] w-4 h-4" />
        <h2 className="text-[10px] tracking-[0.2em] text-[var(--color-slate)] font-semibold uppercase">Advanced Institutional Indicators</h2>
      </div>

      {/* Price + Bollinger */}
      <div className="p-5 ventriloc-card" style={{ height: 380 }}>
        <h3 className="text-[10px] tracking-widest text-[var(--color-slate)] uppercase mb-3">Price Action & Bollinger Channels</h3>
        <ResponsiveContainer width="100%" height="90%" minWidth={0} minHeight={0}>
          <ComposedChart data={data}>
            <defs>
              <linearGradient id="colorClose" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="var(--accent)" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="var(--accent)" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <XAxis dataKey="date" stroke="var(--border)" tick={{ fill: "var(--color-slate)", fontSize: 9 }} interval={Math.floor(data.length / 12)} tickMargin={10} axisLine={false} />
            <YAxis domain={["auto", "auto"]} stroke="var(--border)" tick={{ fill: "var(--color-slate)", fontSize: 10, fontFamily: 'monospace' }} tickFormatter={(v) => v.toLocaleString()} axisLine={false} tickLine={false} />
            <Tooltip content={<CustomTooltip />} cursor={{ stroke: 'var(--color-chalk)', strokeWidth: 1, strokeDasharray: '4 4' }} />
            <Line type="monotone" dataKey="upper" stroke="var(--color-graphite)" opacity={0.2} strokeDasharray="3 3" dot={false} name="BB Upper" />
            <Line type="monotone" dataKey="lower" stroke="var(--color-graphite)" opacity={0.2} strokeDasharray="3 3" dot={false} name="BB Lower" />
            <Area type="monotone" dataKey="close" stroke="var(--accent)" fillOpacity={1} fill="url(#colorClose)" strokeWidth={2} name="Close" isAnimationActive={true} />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Volume */}
        <div className="p-5 ventriloc-card" style={{ height: 220 }}>
          <h3 className="text-[10px] tracking-widest text-[var(--color-slate)] uppercase mb-3">Liquidity Density</h3>
          <div className="w-full h-[85%]">
            <LightweightChart data={volumeData} type="histogram" color="#ff682c" height={160} />
          </div>
        </div>

        {/* MACD */}
        <div className="p-5 ventriloc-card" style={{ height: 220 }}>
          <h3 className="text-[10px] tracking-widest text-[var(--color-slate)] uppercase mb-3">MACD Oscillator</h3>
          <ResponsiveContainer width="100%" height="85%" minWidth={0} minHeight={0}>
            <ComposedChart data={data.slice(-60)}>
              <XAxis dataKey="date" hide />
              <Tooltip content={<CustomTooltip />} cursor={{ stroke: 'var(--color-chalk)', strokeWidth: 1, strokeDasharray: '4 4' }} />
              <Line type="monotone" dataKey="macd" stroke="var(--accent)" dot={false} strokeWidth={2} name="MACD" isAnimationActive={true} />
              <Line type="monotone" dataKey="signal" stroke="#f59e0b" dot={false} strokeWidth={1.5} name="Signal" isAnimationActive={true} opacity={0.8} />
              <Bar dataKey="hist" fill="var(--color-graphite)" opacity={0.15} name="Histogram" />
            </ComposedChart>
          </ResponsiveContainer>
        </div>

        {/* RSI */}
        <div className="p-5 ventriloc-card" style={{ height: 220 }}>
          <h3 className="text-[10px] tracking-widest text-[var(--color-slate)] uppercase mb-3">RSI (14)</h3>
          <div className="w-full h-[85%]">
            <LightweightChart data={rsiData} type="line" color="#059669" height={160} />
          </div>
        </div>
      </div>
    </motion.div>
  );
}
