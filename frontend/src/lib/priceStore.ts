"use client";

import { useCallback, useSyncExternalStore } from "react";
import { fetchWatchlist } from "@/lib/api";

// Latest daily close per ticker, from the API's /watchlist endpoint (Yahoo Finance or the
// local dataset). One shared store per market so the ticker ribbon, watchlist and header
// never disagree, and each market is fetched once per refresh however many components
// subscribe.

export type Quote = { price: number; pct_change: number };
type Quotes = Record<string, Quote>;

const REFRESH_MS = 60_000;
const EMPTY: Quotes = {};

const stores = new Map<string, { quotes: Quotes; subscribers: Set<() => void>; timer?: ReturnType<typeof setInterval> }>();

function getStore(market: string) {
  let store = stores.get(market);
  if (!store) {
    store = { quotes: EMPTY, subscribers: new Set() };
    stores.set(market, store);
  }
  return store;
}

async function refresh(market: string) {
  const items = await fetchWatchlist(market);
  if (!items.length) return;
  const store = getStore(market);
  store.quotes = Object.fromEntries(items.map((i) => [i.ticker, { price: i.price, pct_change: i.pct_change }]));
  store.subscribers.forEach((cb) => cb());
}

function subscribe(market: string, callback: () => void) {
  const store = getStore(market);
  store.subscribers.add(callback);
  if (store.subscribers.size === 1) {
    refresh(market);
    store.timer = setInterval(() => {
      if (!document.hidden) refresh(market);
    }, REFRESH_MS);
  }
  return () => {
    store.subscribers.delete(callback);
    if (store.subscribers.size === 0 && store.timer) {
      clearInterval(store.timer);
      store.timer = undefined;
    }
  };
}

/** Latest close and daily % change for each watchlist ticker in `market` (empty until loaded). */
export function useMarketQuotes(market: string): Quotes {
  // Stable per market: a new subscribe function every render would unsubscribe and
  // resubscribe (and refetch) on each render.
  const sub = useCallback((cb: () => void) => (market ? subscribe(market, cb) : () => {}), [market]);
  const get = useCallback(() => (market ? getStore(market).quotes : EMPTY), [market]);
  return useSyncExternalStore(sub, get, () => EMPTY);
}
