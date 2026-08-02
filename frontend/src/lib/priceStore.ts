"use client";

import { useEffect, useSyncExternalStore } from "react";

type PriceEntry = { price: number; change: number; pct_change: number };

const INITIAL_PRICES: Record<string, PriceEntry> = {
  AAPL: { price: 184.20, change: 2.2, pct_change: 1.2 },
  MSFT: { price: 402.10, change: -1.5, pct_change: -0.4 },
  NVDA: { price: 890.50, change: 15.2, pct_change: 1.7 },
  AMZN: { price: 145.30, change: 0.8, pct_change: 0.6 },
  META: { price: 380.90, change: -2.1, pct_change: -0.5 },
  TSLA: { price: 192.15, change: -1.8, pct_change: -0.9 },
  GOOGL: { price: 138.20, change: 0.5, pct_change: 0.4 },
};

// A fresh snapshot object is published once per tick (not once per render), so
// useSyncExternalStore's Object.is comparison correctly detects real updates while
// renders that happen between ticks all see the same stable reference (no forced re-renders).
let snapshot: Record<string, PriceEntry> = INITIAL_PRICES;

const subscribers = new Set<() => void>();
const notify = () => subscribers.forEach((callback) => callback());

function subscribe(callback: () => void) {
  subscribers.add(callback);
  return () => {
    subscribers.delete(callback);
  };
}

function getSnapshot() {
  return snapshot;
}

function ensureTicker(symbol: string) {
  if (snapshot[symbol]) return;
  snapshot = { ...snapshot, [symbol]: { price: 100 + Math.random() * 100, change: 0, pct_change: 0 } };
  notify();
}

function tick() {
  // Paused while the tab is backgrounded - no point re-rendering hidden components every 2s.
  if (document.hidden) return;

  const next: Record<string, PriceEntry> = {};
  for (const ticker of Object.keys(snapshot)) {
    const data = snapshot[ticker];
    const move = (Math.random() - 0.5) * 0.5; // +/- 0.25 max move
    const price = data.price + move;
    const change = data.change + move;
    next[ticker] = { price, change, pct_change: (change / (price - change)) * 100 };
  }
  snapshot = next;
  notify();
}

if (typeof window !== "undefined") {
  setInterval(tick, 2000);
}

export function usePriceFeed(symbol: string) {
  useEffect(() => ensureTicker(symbol), [symbol]);
  const all = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
  return all[symbol] || { price: 100, change: 0, pct_change: 0 };
}

export function useAllPrices() {
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}
