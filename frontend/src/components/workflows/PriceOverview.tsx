"use client";

import { useMemo } from "react";
import { motion } from "framer-motion";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import type { StockData } from "@/lib/api";

const ACCENT = "#f0601f";
const MUTED = "#8a8a93";

function movingAverage(values: number[], window: number): (number | null)[] {
  let sum = 0;
  return values.map((v, i) => {
    sum += v;
    if (i >= window) sum -= values[i - window];
    return i >= window - 1 ? sum / window : null;
  });
}

interface PriceOverviewProps {
  stockData: StockData | null;
  currency: string;
}

export default function PriceOverview({ stockData, currency }: PriceOverviewProps) {
  const { rows, stats } = useMemo(() => {
    const closes = stockData?.closes ?? [];
    const dates = stockData?.dates ?? [];
    if (closes.length < 2) return { rows: [], stats: null };

    const ma20 = movingAverage(closes, 20);
    const ma50 = movingAverage(closes, 50);
    const rows = closes.map((close, i) => ({ date: dates[i], close, ma20: ma20[i], ma50: ma50[i] }));

    let peak = closes[0];
    let maxDd = 0;
    for (const c of closes) {
      peak = Math.max(peak, c);
      maxDd = Math.min(maxDd, c / peak - 1);
    }
    return {
      rows,
      stats: {
        periodReturn: (closes[closes.length - 1] / closes[0] - 1) * 100,
        high: Math.max(...closes),
        low: Math.min(...closes),
        maxDrawdown: maxDd * 100,
        days: closes.length,
      },
    };
  }, [stockData]);

  if (!stockData || !stats) {
    return (
      <div className="p-6 rounded-[10px] border border-outline-variant/30 bg-surface-container/90 font-body-md text-[13px] text-on-surface-variant">
        Loading price history…
      </div>
    );
  }

  const fmtPrice = (v: number) => v.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="w-full flex flex-col gap-4"
    >
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Stat label={`${stats.days}-day return`} value={`${stats.periodReturn >= 0 ? "+" : ""}${stats.periodReturn.toFixed(1)}%`}
          tone={stats.periodReturn >= 0 ? "text-[var(--profit)]" : "text-[var(--loss)]"} />
        <Stat label="Period high" value={fmtPrice(stats.high)} sub={currency} />
        <Stat label="Period low" value={fmtPrice(stats.low)} sub={currency} />
        <Stat label="Max drawdown" value={`${stats.maxDrawdown.toFixed(1)}%`} />
      </div>

      <section className="p-5 rounded-[10px] border border-outline-variant/30 bg-surface-container/90">
        <div className="flex flex-wrap items-baseline justify-between gap-2 mb-4">
          <div>
            <h3 className="font-headline-md text-on-surface">{stockData.ticker} daily close</h3>
            <p className="font-body-md text-[12px] text-on-surface-variant">
              {rows[0].date} to {rows[rows.length - 1].date} · {currency}
            </p>
          </div>
          <div className="flex items-center gap-4 font-label-sm text-[11px] text-on-surface-variant">
            <LegendLine color={ACCENT} text="Close" />
            <LegendLine color={MUTED} dash="4 3" text="20-day MA" />
            <LegendLine color={MUTED} dash="1 3" text="50-day MA" />
          </div>
        </div>
        <div className="h-[280px] md:h-[340px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={rows} margin={{ top: 4, right: 8, bottom: 0, left: 0 }}>
              <CartesianGrid stroke="rgba(255,255,255,0.05)" vertical={false} />
              <XAxis dataKey="date" tick={{ fill: "#737373", fontSize: 10 }} tickLine={false} axisLine={false}
                minTickGap={48} tickFormatter={(d: string) => d.slice(5)} />
              <YAxis domain={["auto", "auto"]} tick={{ fill: "#737373", fontSize: 10 }} tickLine={false} axisLine={false}
                width={56} tickFormatter={(v: number) => v.toLocaleString(undefined, { maximumFractionDigits: 0 })} />
              <Tooltip
                contentStyle={{ background: "#0e0e14", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 6, fontSize: 11 }}
                labelStyle={{ color: "#f3f4f6", marginBottom: 4 }}
                itemStyle={{ color: "#d4d4d8", padding: 0 }}
                formatter={(v, name) => [typeof v === "number" ? fmtPrice(v) : "–", name === "close" ? "Close" : name === "ma20" ? "20-day MA" : "50-day MA"]}
              />
              <Line type="monotone" dataKey="ma50" stroke={MUTED} strokeWidth={1.5} strokeDasharray="1 3" dot={false} isAnimationActive={false} connectNulls />
              <Line type="monotone" dataKey="ma20" stroke={MUTED} strokeWidth={1.5} strokeDasharray="4 3" dot={false} isAnimationActive={false} connectNulls />
              <Line type="monotone" dataKey="close" stroke={ACCENT} strokeWidth={2} dot={false} activeDot={{ r: 4, stroke: "#0e0e14", strokeWidth: 2 }} isAnimationActive={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </section>
    </motion.div>
  );
}

function Stat({ label, value, sub, tone = "text-on-surface" }: { label: string; value: string; sub?: string; tone?: string }) {
  return (
    <div className="p-4 rounded-[10px] border border-outline-variant/30 bg-[#08080a]">
      <div className="font-label-sm text-[10px] uppercase tracking-widest text-outline mb-1">{label}</div>
      <div className={`font-mono text-[20px] ${tone}`}>
        {value} {sub && <span className="font-label-sm text-[11px] text-outline">{sub}</span>}
      </div>
    </div>
  );
}

function LegendLine({ color, text, dash }: { color: string; text: string; dash?: string }) {
  return (
    <span className="flex items-center gap-1.5">
      <svg width="18" height="4" aria-hidden>
        <line x1="0" y1="2" x2="18" y2="2" stroke={color} strokeWidth="2" strokeDasharray={dash} />
      </svg>
      {text}
    </span>
  );
}
