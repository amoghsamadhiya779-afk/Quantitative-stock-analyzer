"use client";

import { motion } from "framer-motion";
import { LineChart, Line, ResponsiveContainer } from "recharts";
import { TrendingUp, TrendingDown, Fuel, Gem, CircleDollarSign } from "lucide-react";
import { useState, useEffect } from "react";

interface CommodityData {
  name: string;
  symbol: string;
  price: number;
  change: number;
  icon: React.ReactNode;
  color: string;
  sparkline: number[];
}

const generateSparkline = (base: number, volatility: number) => {
  const data: number[] = [];
  let price = base;
  for (let i = 0; i < 24; i++) {
    price = price * (1 + (Math.random() - 0.48) * volatility);
    data.push(price);
  }
  return data;
};

const initialCommodities: CommodityData[] = [
  { name: "Gold", symbol: "XAU", price: 2345.80, change: 0.42, icon: <Gem className="w-4 h-4" />, color: "#EAB308", sparkline: generateSparkline(2345, 0.003) },
  { name: "Silver", symbol: "XAG", price: 31.24, change: -0.18, icon: <Gem className="w-4 h-4" />, color: "#94A3B8", sparkline: generateSparkline(31, 0.005) },
  { name: "Crude Oil", symbol: "WTI", price: 78.45, change: 1.23, icon: <Fuel className="w-4 h-4" />, color: "#F97316", sparkline: generateSparkline(78, 0.008) },
  { name: "Brent", symbol: "BRENT", price: 82.12, change: 0.95, icon: <Fuel className="w-4 h-4" />, color: "#FB923C", sparkline: generateSparkline(82, 0.007) },
  { name: "Natural Gas", symbol: "NG", price: 2.87, change: -2.14, icon: <Fuel className="w-4 h-4" />, color: "#38BDF8", sparkline: generateSparkline(2.87, 0.015) },
  { name: "USD Index", symbol: "DXY", price: 104.32, change: 0.08, icon: <CircleDollarSign className="w-4 h-4" />, color: "#34D399", sparkline: generateSparkline(104, 0.002) },
];

export default function CommoditiesBar() {
  const [commodities] = useState(initialCommodities);

  return (
    <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
      {commodities.map((c, idx) => (
        <motion.div
          key={c.symbol}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: idx * 0.05, duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
          className="flex-shrink-0 flex items-center gap-3 p-3 glass-card hover:border-[var(--accent)]/50 transition-all min-w-[180px]"
        >
          <div className="p-1.5 rounded-lg bg-foreground/5" style={{ color: c.color }}>
            {c.icon}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-foreground/50">{c.symbol}</span>
              <span className={`text-[9px] font-bold ${c.change >= 0 ? "text-[var(--profit)]" : "text-[var(--loss)]"}`}>
                {c.change >= 0 ? "▲" : "▼"} {Math.abs(c.change).toFixed(2)}%
              </span>
            </div>
            <div className="text-sm font-mono font-bold">{c.price.toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
          </div>
          <div className="w-16 h-8">
            <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
              <LineChart data={c.sparkline.map((v) => ({ v }))}>
                <Line type="monotone" dataKey="v" stroke={c.change >= 0 ? "var(--profit)" : "var(--loss)"} strokeWidth={1.5} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </motion.div>
      ))}
    </div>
  );
}
