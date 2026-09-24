"use client";

import { motion } from "framer-motion";
import { LineChart, Line, ResponsiveContainer } from "recharts";
import { Fuel, Gem, CircleDollarSign } from "lucide-react";
import { fetchCommodities, type CommoditySeries } from "@/lib/api";
import { useState, useEffect } from "react";

const DISPLAY: Record<string, { short: string; icon: React.ReactNode; color: string }> = {
  Gold: { short: "Gold", icon: <Gem className="w-4 h-4" />, color: "#EAB308" },
  Silver: { short: "Silver", icon: <Gem className="w-4 h-4" />, color: "#94A3B8" },
  "Crude Oil (WTI)": { short: "WTI", icon: <Fuel className="w-4 h-4" />, color: "#F97316" },
  Brent: { short: "Brent", icon: <Fuel className="w-4 h-4" />, color: "#FB923C" },
  "Natural Gas": { short: "Nat gas", icon: <Fuel className="w-4 h-4" />, color: "#38BDF8" },
  "US Dollar Index": { short: "DXY", icon: <CircleDollarSign className="w-4 h-4" />, color: "#34D399" },
};

export default function CommoditiesBar() {
  // undefined = loading, null = unavailable
  const [data, setData] = useState<Record<string, CommoditySeries> | null | undefined>(undefined);

  useEffect(() => {
    let active = true;
    fetchCommodities().then((d) => active && setData(d));
    return () => {
      active = false;
    };
  }, []);

  if (data === null) {
    return <div className="font-label-sm text-[11px] text-outline pb-1">Commodity prices are unavailable right now.</div>;
  }
  const entries = data ? Object.entries(data) : [];

  return (
    <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
      {data === undefined &&
        [0, 1, 2, 3].map((i) => <div key={i} className="flex-shrink-0 min-w-[180px] h-[58px] glass-card skeleton-shimmer" />)}
      {entries.map(([name, c], idx) => {
        const d = DISPLAY[name] ?? { short: name, icon: <CircleDollarSign className="w-4 h-4" />, color: "#94A3B8" };
        const spark = c.closes.slice(-30).map((v) => ({ v }));
        return (
          <motion.div
            key={c.symbol}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.05, duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            className="flex-shrink-0 flex items-center gap-3 p-3 glass-card hover:border-[var(--accent)]/50 transition-all min-w-[180px]"
            title={`${name} (${c.symbol}), last close ${c.dates[c.dates.length - 1]}`}
          >
            <div className="p-1.5 rounded-lg bg-foreground/5" style={{ color: d.color }}>
              {d.icon}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-foreground/50">{d.short}</span>
                <span className={`text-[11px] font-bold ${c.pct_change >= 0 ? "text-[var(--profit)]" : "text-[var(--loss)]"}`}>
                  {c.pct_change >= 0 ? "▲" : "▼"} {Math.abs(c.pct_change).toFixed(2)}%
                </span>
              </div>
              <div className="text-sm font-mono font-bold">{c.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
            </div>
            <div className="w-16 h-8" aria-hidden>
              <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                <LineChart data={spark}>
                  <Line type="monotone" dataKey="v" stroke={c.pct_change >= 0 ? "var(--profit)" : "var(--loss)"} strokeWidth={1.5} dot={false} isAnimationActive={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}
