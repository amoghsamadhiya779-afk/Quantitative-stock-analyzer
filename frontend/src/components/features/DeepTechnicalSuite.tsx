"use client";

import { motion } from "framer-motion";
import { ComposedChart, Line, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, BarChart, Area, AreaChart } from "recharts";
import { Layers } from "lucide-react";
import type { StockData } from "@/lib/api";
import { useCursor } from "../providers/CursorProvider";

interface Props {
  stockData: StockData | null;
}

export default function DeepTechnicalSuite({ stockData }: Props) {
  const { setCursorType } = useCursor();

  if (!stockData) return (
    <div className="w-full h-96 glass-card flex items-center justify-center overflow-hidden relative">
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full animate-[shimmer_1.5s_infinite]" />
    </div>
  );

  const data = stockData.dates.map((d, i) => ({
    date: d.slice(5),
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

  // Helper for custom premium tooltip
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-[var(--surface)] backdrop-blur-xl border border-[var(--border)] p-3 rounded-lg shadow-xl relative overflow-hidden">
          <div className="absolute inset-0 bg-[var(--background)] opacity-50 pointer-events-none" />
          <p className="text-[10px] uppercase text-[var(--foreground)]/50 mb-2 font-bold tracking-widest border-b border-[var(--border)] pb-1 relative z-10">{label}</p>
          {payload.map((entry: any, index: number) => (
            <div key={index} className="flex items-center gap-3 text-xs font-mono my-1 relative z-10">
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
        <h2 className="text-[10px] tracking-[0.2em] text-[var(--foreground)]/50 font-bold uppercase">Advanced Institutional Indicators</h2>
      </div>

      {/* Price + Bollinger */}
      <div 
        className="p-5 glass-card" style={{ height: 380 }}
        onMouseEnter={() => setCursorType("hover-chart")}
        onMouseLeave={() => setCursorType("default")}
      >
        <h3 className="text-[10px] tracking-widest text-[var(--foreground)]/40 uppercase mb-3">Price Action & Bollinger Channels</h3>
        <ResponsiveContainer width="100%" height="90%" minWidth={0} minHeight={0} className="cursor-none">
          <ComposedChart data={data}>
            <defs>
              <linearGradient id="colorClose" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="var(--accent)" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="var(--accent)" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <XAxis dataKey="date" stroke="var(--border)" tick={{ fill: "var(--foreground)", opacity: 0.4, fontSize: 9 }} interval={Math.floor(data.length / 12)} tickMargin={10} axisLine={false} />
            <YAxis domain={["auto", "auto"]} stroke="var(--border)" tick={{ fill: "var(--foreground)", opacity: 0.4, fontSize: 10, fontFamily: 'monospace' }} tickFormatter={(v) => v.toLocaleString()} axisLine={false} tickLine={false} />
            <Tooltip content={<CustomTooltip />} cursor={{ stroke: 'var(--border)', strokeWidth: 1, strokeDasharray: '4 4' }} />
            <Line type="monotone" dataKey="upper" stroke="var(--foreground)" opacity={0.15} strokeDasharray="3 3" dot={false} name="BB Upper" />
            <Line type="monotone" dataKey="lower" stroke="var(--foreground)" opacity={0.15} strokeDasharray="3 3" dot={false} name="BB Lower" />
            <Area type="monotone" dataKey="close" stroke="var(--accent)" fillOpacity={1} fill="url(#colorClose)" strokeWidth={2} name="Close" isAnimationActive={true} />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Volume */}
        <div 
          className="p-5 glass-card" style={{ height: 220 }}
          onMouseEnter={() => setCursorType("hover-chart")}
          onMouseLeave={() => setCursorType("default")}
        >
          <h3 className="text-[10px] tracking-widest text-[var(--foreground)]/40 uppercase mb-3">Liquidity Density</h3>
          <ResponsiveContainer width="100%" height="85%" minWidth={0} minHeight={0} className="cursor-none">
            <BarChart data={data.slice(-60)}>
              <XAxis dataKey="date" hide />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: 'var(--surface)' }} />
              <Bar dataKey="volume" fill="var(--accent)" opacity={0.5} radius={[2, 2, 0, 0]} isAnimationActive={true} name="Volume" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* MACD */}
        <div 
          className="p-5 glass-card" style={{ height: 220 }}
          onMouseEnter={() => setCursorType("hover-chart")}
          onMouseLeave={() => setCursorType("default")}
        >
          <h3 className="text-[10px] tracking-widest text-[var(--foreground)]/40 uppercase mb-3">MACD Oscillator</h3>
          <ResponsiveContainer width="100%" height="85%" minWidth={0} minHeight={0} className="cursor-none">
            <ComposedChart data={data.slice(-60)}>
              <XAxis dataKey="date" hide />
              <Tooltip content={<CustomTooltip />} cursor={{ stroke: 'var(--border)', strokeWidth: 1, strokeDasharray: '4 4' }} />
              <Line type="monotone" dataKey="macd" stroke="var(--accent)" dot={false} strokeWidth={2} name="MACD" isAnimationActive={true} />
              <Line type="monotone" dataKey="signal" stroke="#f59e0b" dot={false} strokeWidth={1.5} name="Signal" isAnimationActive={true} opacity={0.8} />
              <Bar dataKey="hist" fill="var(--foreground)" opacity={0.15} name="Histogram" />
            </ComposedChart>
          </ResponsiveContainer>
        </div>

        {/* RSI */}
        <div 
          className="p-5 glass-card" style={{ height: 220 }}
          onMouseEnter={() => setCursorType("hover-chart")}
          onMouseLeave={() => setCursorType("default")}
        >
          <h3 className="text-[10px] tracking-widest text-[var(--foreground)]/40 uppercase mb-3">RSI (14)</h3>
          <ResponsiveContainer width="100%" height="85%" minWidth={0} minHeight={0} className="cursor-none">
            <AreaChart data={data.slice(-60)}>
              <defs>
                <linearGradient id="colorRsi" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--profit)" stopOpacity={0.2}/>
                  <stop offset="95%" stopColor="var(--profit)" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <XAxis dataKey="date" hide />
              <YAxis domain={[0, 100]} stroke="var(--border)" tick={{ fill: "var(--foreground)", opacity: 0.4, fontSize: 10, fontFamily: 'monospace' }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} cursor={{ stroke: 'var(--border)', strokeWidth: 1, strokeDasharray: '4 4' }} />
              {/* Overbought/Oversold Reference Lines */}
              <Line type="monotone" dataKey={() => 70} stroke="var(--loss)" opacity={0.3} strokeDasharray="3 3" dot={false} isAnimationActive={false} />
              <Line type="monotone" dataKey={() => 30} stroke="var(--profit)" opacity={0.3} strokeDasharray="3 3" dot={false} isAnimationActive={false} />
              <Area type="monotone" dataKey="rsi" stroke="var(--profit)" fillOpacity={1} fill="url(#colorRsi)" strokeWidth={2} name="RSI" isAnimationActive={true} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </motion.div>
  );
}
