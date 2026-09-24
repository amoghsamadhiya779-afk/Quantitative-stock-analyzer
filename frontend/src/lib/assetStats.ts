"use client";

import { useEffect, useState } from "react";
import { fetchStockData } from "@/lib/api";

const TRADING_DAYS = 252;

export interface AssetStat {
  ticker: string;
  /** Annualised mean daily return over the window, in %. Historical, not a forecast. */
  annualReturn: number;
  /** Annualised standard deviation of daily returns, in %. */
  annualVol: number;
  /** One-day 95% historical VaR, as a positive % loss. */
  var95: number;
  /** Worst peak-to-trough decline over the window, as a negative %. */
  maxDrawdown: number;
}

export interface AssetStats {
  assets: AssetStat[];
  /** correlation[i][j] of daily returns, in the order of `assets`. */
  correlation: number[][];
  /** Daily returns of an equally weighted portfolio of the assets. */
  equalWeightReturns: number[];
  start: string;
  end: string;
  days: number;
}

const mean = (xs: number[]) => xs.reduce((a, b) => a + b, 0) / xs.length;
const std = (xs: number[]) => {
  const m = mean(xs);
  return Math.sqrt(xs.reduce((a, b) => a + (b - m) ** 2, 0) / (xs.length - 1));
};

export function historicalVar95(returns: number[]) {
  const sorted = [...returns].sort((a, b) => a - b);
  return -sorted[Math.floor(0.05 * (sorted.length - 1))] * 100;
}

export function maxDrawdown(returns: number[]) {
  let equity = 1;
  let peak = 1;
  let worst = 0;
  for (const r of returns) {
    equity *= 1 + r;
    peak = Math.max(peak, equity);
    worst = Math.min(worst, equity / peak - 1);
  }
  return worst * 100;
}

function correlation(a: number[], b: number[]) {
  const ma = mean(a);
  const mb = mean(b);
  let cov = 0, va = 0, vb = 0;
  for (let i = 0; i < a.length; i++) {
    cov += (a[i] - ma) * (b[i] - mb);
    va += (a[i] - ma) ** 2;
    vb += (b[i] - mb) ** 2;
  }
  return va > 0 && vb > 0 ? cov / Math.sqrt(va * vb) : 0;
}

/** Compute statistics from each ticker's dated closes, using only dates all tickers share. */
export function computeAssetStats(series: { ticker: string; dates: string[]; closes: number[] }[]): AssetStats | null {
  if (series.length === 0) return null;
  const shared = series
    .map((s) => new Set(s.dates))
    .reduce((acc, set) => new Set([...acc].filter((d) => set.has(d))));
  const dates = [...shared].sort();
  if (dates.length < 30) return null;

  const returns = series.map((s) => {
    const byDate = new Map(s.dates.map((d, i) => [d, s.closes[i]]));
    const closes = dates.map((d) => byDate.get(d) as number);
    return closes.slice(1).map((c, i) => c / closes[i] - 1);
  });

  const assets = series.map((s, i) => ({
    ticker: s.ticker,
    annualReturn: mean(returns[i]) * TRADING_DAYS * 100,
    annualVol: std(returns[i]) * Math.sqrt(TRADING_DAYS) * 100,
    var95: historicalVar95(returns[i]),
    maxDrawdown: maxDrawdown(returns[i]),
  }));
  const corr = returns.map((a) => returns.map((b) => correlation(a, b)));
  const equalWeightReturns = returns[0].map((_, t) => mean(returns.map((r) => r[t])));

  return { assets, correlation: corr, equalWeightReturns, start: dates[0], end: dates[dates.length - 1], days: dates.length };
}

/** Real risk statistics for up to `limit` tickers of a market, from ~1 year of daily closes. */
export function useAssetStats(market: string, tickers: string[], limit = 5) {
  const [stats, setStats] = useState<AssetStats | null>(null);
  const [loading, setLoading] = useState(false);
  const key = tickers.slice(0, limit).join(",");

  useEffect(() => {
    const list = key ? key.split(",") : [];
    if (!market || list.length === 0) return;
    let active = true;
    setLoading(true);
    Promise.all(list.map((t) => fetchStockData(market, t).catch(() => null)))
      .then((results) => {
        if (!active) return;
        const series = results
          .filter((r): r is NonNullable<typeof r> => !!r && r.closes?.length > 1)
          .map((r) => ({ ticker: r.ticker, dates: r.dates, closes: r.closes }));
        setStats(computeAssetStats(series));
      })
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [market, key]);

  return { stats, loading };
}
