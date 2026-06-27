"use client";

import { useEffect, useState, useRef } from "react";
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
        <span className="text-[9px] uppercase tracking-widest text-[var(--profit)] font-bold live-indicator flex items-center gap-1.5">
          <div className="w-1.5 h-1.5 rounded-full bg-[var(--profit)]" />
          Live
        </span>
      </div>

      <div className="flex-1 flex flex-col gap-3 overflow-y-auto hide-scrollbar pr-2">
        <AnimatePresence>
          {loading && items.length === 0 ? (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-3">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="flex items-center justify-between p-3 rounded-2xl border border-transparent">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full skeleton-shimmer" />
                    <div className="flex flex-col gap-2">
                      <div className="w-12 h-3 rounded-md skeleton-shimmer" />
                      <div className="w-16 h-2 rounded-md skeleton-shimmer" />
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <div className="w-14 h-4 rounded-md skeleton-shimmer" />
                    <div className="w-10 h-2 rounded-md skeleton-shimmer" />
                  </div>
                </div>
              ))}
            </motion.div>
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
                  <PriceTick price={item.price} />
                  <span className={`text-[10px] font-bold sentiment-crossfade ${item.pct_change >= 0 ? "text-[var(--profit)]" : "text-[var(--loss)]"}`}>
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

function PriceTick({ price }: { price: number }) {
  const [flashClass, setFlashClass] = useState("");
  const prevPrice = useRef(price);

  useEffect(() => {
    if (price > prevPrice.current) {
      setFlashClass("price-flash-up");
      const timer = setTimeout(() => setFlashClass(""), 600);
      return () => clearTimeout(timer);
    } else if (price < prevPrice.current) {
      setFlashClass("price-flash-down");
      const timer = setTimeout(() => setFlashClass(""), 600);
      return () => clearTimeout(timer);
    }
    prevPrice.current = price;
  }, [price]);

  return (
    <span className={`font-mono font-bold text-[var(--color-carbon)] px-1 rounded-sm ${flashClass}`} key={flashClass}>
      {price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
    </span>
  );
}
