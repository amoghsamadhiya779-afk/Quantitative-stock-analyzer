"use client";

import { useState, useEffect } from "react";

// Global cache for ticker data
const globalPriceStore: Record<string, { price: number; change: number; pct_change: number }> = {
  AAPL: { price: 184.20, change: 2.2, pct_change: 1.2 },
  MSFT: { price: 402.10, change: -1.5, pct_change: -0.4 },
  NVDA: { price: 890.50, change: 15.2, pct_change: 1.7 },
  AMZN: { price: 145.30, change: 0.8, pct_change: 0.6 },
  META: { price: 380.90, change: -2.1, pct_change: -0.5 },
  TSLA: { price: 192.15, change: -1.8, pct_change: -0.9 },
  GOOGL: { price: 138.20, change: 0.5, pct_change: 0.4 },
};

// Subscribers list to trigger re-renders
const subscribers: Set<() => void> = new Set();

const notifySubscribers = () => {
  subscribers.forEach((callback) => callback());
};

// Simulate live price ticks every 2 seconds
if (typeof window !== "undefined") {
  setInterval(() => {
    Object.keys(globalPriceStore).forEach((ticker) => {
      const data = globalPriceStore[ticker];
      const move = (Math.random() - 0.5) * 0.5; // +/- 0.25 max move
      data.price += move;
      data.change += move;
      data.pct_change = (data.change / (data.price - data.change)) * 100;
    });
    notifySubscribers();
  }, 2000);
}

export function usePriceFeed(symbol: string) {
  const [data, setData] = useState(globalPriceStore[symbol] || { price: 100, change: 0, pct_change: 0 });

  useEffect(() => {
    // If symbol isn't in store yet, initialize it
    if (!globalPriceStore[symbol]) {
      globalPriceStore[symbol] = { price: 100 + Math.random() * 100, change: 0, pct_change: 0 };
      setData(globalPriceStore[symbol]);
    }

    const handler = () => {
      if (globalPriceStore[symbol]) {
        // Create new object reference to trigger re-render
        setData({ ...globalPriceStore[symbol] });
      }
    };

    subscribers.add(handler);
    return () => {
      subscribers.delete(handler);
    };
  }, [symbol]);

  return data;
}

export function useAllPrices() {
  const [data, setData] = useState({ ...globalPriceStore });

  useEffect(() => {
    const handler = () => {
      setData({ ...globalPriceStore });
    };

    subscribers.add(handler);
    return () => {
      subscribers.delete(handler);
    };
  }, []);

  return data;
}
