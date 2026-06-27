"use client";

import { useEffect, useState } from "react";
import { fetchWatchlist, WatchlistItem, getLogoUrl, getFallbackLogo } from "@/lib/api";
import { motion, AnimatePresence } from "framer-motion";

export default function WatchlistPanel({ marketName }: { marketName: string }) {
  const [items, setItems] = useState<WatchlistItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!marketName) return;
    setLoading(true);
    
    const load = () => {
      fetchWatchlist(marketName).then((data) => {
        setItems(data);
        setLoading(false);
      });
    };
    
    load();
    const interval = setInterval(load, 30000);
    return () => clearInterval(interval);
  }, [marketName]);

  return (
    <div className="ventriloc-card rounded-[24px] p-6 h-full flex flex-col min-h-[400px]">
      <div className="flex items-center justify-between mb-6">
        <h3 className="font-display text-lg font-bold text-[var(--color-carbon)]">Active Watchlist</h3>
        <span className="text-[9px] uppercase tracking-widest text-[var(--color-slate)] font-semibold">Live</span>
      </div>

      <div className="flex-1 flex flex-col gap-3 overflow-y-auto hide-scrollbar pr-2">
        <AnimatePresence>
          {loading && items.length === 0 ? (
            <div className="flex justify-center py-10">
              <div className="w-5 h-5 rounded-full border-2 border-[var(--border)] border-t-[var(--accent)] animate-spin" />
            </div>
          ) : (
            items.map((item, i) => (
              <motion.div
                key={item.ticker}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05, duration: 0.4 }}
                className="flex items-center justify-between p-3 rounded-2xl hover:bg-[var(--color-fog)] transition-colors cursor-pointer group"
              >
                <div className="flex items-center gap-3">
                  <img
                    src={getLogoUrl(item.ticker)}
                    onError={(e) => { e.currentTarget.src = getFallbackLogo(item.ticker); }}
                    alt={item.ticker}
                    className="w-8 h-8 rounded-full border border-[var(--border)] p-1 object-contain bg-white"
                  />
                  <div className="flex flex-col">
                    <span className="font-display font-bold text-[var(--color-carbon)] text-sm">{item.ticker}</span>
                    <span className="text-[10px] text-[var(--color-slate)] font-mono">VOL {Intl.NumberFormat('en-US', { notation: "compact", compactDisplay: "short" }).format(item.volume)}</span>
                  </div>
                </div>
                <div className="flex flex-col items-end">
                  <span className="font-mono font-bold text-[var(--color-carbon)]">{item.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                  <span className={`text-[10px] font-bold ${item.pct_change >= 0 ? "text-[var(--profit)]" : "text-[var(--loss)]"}`}>
                    {item.pct_change > 0 ? "+" : ""}{item.pct_change.toFixed(2)}%
                  </span>
                </div>
              </motion.div>
            ))
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
