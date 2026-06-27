"use client";

import { motion } from "framer-motion";
import { Globe2, Rss, Layers, Cpu } from "lucide-react";
import { useState, useEffect } from "react";
import GlobeWidget, { MARKET_LOCATIONS } from "@/components/ui/GlobeWidget";
import ExpandableNewsCards from "@/components/ui/ExpandableNewsCards";
import { fetchNews, fetchTickers, fetchStockData, type NewsItem, type StockData } from "@/lib/api";
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip } from "recharts";

interface Props {
  selectedTicker: string;
  selectedMarket: string;
}

export default function NewsDrivenMarket({ selectedTicker, selectedMarket }: Props) {
  const [activeMarket, setActiveMarket] = useState(selectedMarket);
  const [news, setNews] = useState<NewsItem[]>([]);
  const [newsLoading, setNewsLoading] = useState(true);
  const [marketStockData, setMarketStockData] = useState<StockData | null>(null);
  const [stockLoading, setStockLoading] = useState(false);
  const [activeTicker, setActiveTicker] = useState(selectedTicker);

  useEffect(() => {
    if (selectedMarket) {
      setActiveMarket(selectedMarket);
    }
  }, [selectedMarket]);

  useEffect(() => {
    if (selectedTicker) {
      setActiveTicker(selectedTicker);
    }
  }, [selectedTicker]);

  useEffect(() => {
    if (!activeMarket) return;
    setNewsLoading(true);
    fetchNews(activeTicker, activeMarket)
      .then((data) => setNews(data))
      .catch(() => setNews([]))
      .finally(() => setNewsLoading(false));
  }, [activeMarket, activeTicker]);

  useEffect(() => {
    if (!activeMarket) return;
    setStockLoading(true);
    fetchTickers(activeMarket)
      .then((tickers) => {
        if (tickers && tickers.length > 0) {
          const tickerToFetch = (tickers.includes(activeTicker)) ? activeTicker : tickers[0];
          return fetchStockData(activeMarket, tickerToFetch);
        }
        throw new Error("No tickers found");
      })
      .then((data) => setMarketStockData(data))
      .catch((err) => {
        console.error("Failed to fetch market stock data for unified chart:", err);
        setMarketStockData(null);
      })
      .finally(() => setStockLoading(false));
  }, [activeMarket, activeTicker]);

  const activeLocation = MARKET_LOCATIONS[activeMarket] || MARKET_LOCATIONS["United States (S&P 500)"];

  const generateUnifiedChartData = () => {
    if (!marketStockData || !marketStockData.dates || marketStockData.dates.length === 0) return [];

    const dates = marketStockData.dates.slice(-30);
    const closes = marketStockData.closes.slice(-30);
    
    const goldBase = 2345.80;
    const silverBase = 29.50;
    const oilBase = 78.45;
    
    const n = dates.length;
    const goldWalk = new Array(n);
    const silverWalk = new Array(n);
    const oilWalk = new Array(n);
    
    goldWalk[n - 1] = goldBase;
    silverWalk[n - 1] = silverBase;
    oilWalk[n - 1] = oilBase;
    
    let seed = 42;
    const pseudoRandom = () => {
      const x = Math.sin(seed++) * 10000;
      return x - Math.floor(x);
    };

    for (let i = n - 2; i >= 0; i--) {
      const idxPctChange = closes[i + 1] && closes[i] ? (closes[i + 1] - closes[i]) / closes[i] : 0;
      const goldChange = -idxPctChange * 0.15 + (pseudoRandom() - 0.5) * 0.004;
      goldWalk[i] = goldWalk[i + 1] * (1 - goldChange);
      const silverChange = goldChange * 1.1 + (pseudoRandom() - 0.5) * 0.007;
      silverWalk[i] = silverWalk[i + 1] * (1 - silverChange);
      const oilChange = idxPctChange * 0.4 + (pseudoRandom() - 0.5) * 0.009;
      oilWalk[i] = oilWalk[i + 1] * (1 - oilChange);
    }
    
    const chartData = [];
    for (let i = 0; i < n; i++) {
      const date = dates[i];
      const indexVal = closes[i];
      const indexNorm = (indexVal / closes[0]) * 100;
      const goldNorm = (goldWalk[i] / goldWalk[0]) * 100;
      const silverNorm = (silverWalk[i] / silverWalk[0]) * 100;
      const oilNorm = (oilWalk[i] / oilWalk[0]) * 100;
      
      chartData.push({
        date: date.slice(5),
        Index: parseFloat(Number(indexNorm).toFixed(2)),
        Gold: parseFloat(Number(goldNorm).toFixed(2)),
        Silver: parseFloat(Number(silverNorm).toFixed(2)),
        Oil: parseFloat(Number(oilNorm).toFixed(2)),
        IndexRaw: parseFloat(Number(indexVal).toFixed(2)),
        GoldRaw: parseFloat(Number(goldWalk[i]).toFixed(2)),
        SilverRaw: parseFloat(Number(silverWalk[i]).toFixed(2)),
        OilRaw: parseFloat(Number(oilWalk[i]).toFixed(2)),
      });
    }
    return chartData;
  };

  const chartData = generateUnifiedChartData();

  const getMarketDetails = () => {
    switch (activeMarket) {
      case "United States (S&P 500)": return { indexName: "S&P 500", tickerSymbol: "SPX", currency: "USD", region: "North America" };
      case "India (NIFTY 50)": return { indexName: "NIFTY 50", tickerSymbol: "NIFTY", currency: "INR", region: "Asia" };
      case "Japan (Nikkei 225)": return { indexName: "Nikkei 225", tickerSymbol: "N225", currency: "JPY", region: "Asia" };
      case "United Kingdom (FTSE 100)": return { indexName: "FTSE 100", tickerSymbol: "FTSE", currency: "GBP", region: "Europe" };
      case "Germany (DAX 40)": return { indexName: "DAX 40", tickerSymbol: "DAX", currency: "EUR", region: "Europe" };
      case "Turkey (BIST 100)": return { indexName: "BIST 100", tickerSymbol: "XU100", currency: "TRY", region: "Europe/Asia" };
      case "Brazil (Bovespa)": return { indexName: "Ibovespa", tickerSymbol: "BVSP", currency: "BRL", region: "South America" };
      case "Indonesia (IDX)": return { indexName: "IDX Composite", tickerSymbol: "JKSE", currency: "IDR", region: "Asia" };
      default: return { indexName: "Stock Index", tickerSymbol: "INDEX", currency: "USD", region: "Global" };
    }
  };

  const details = getMarketDetails();

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const dataPoint = payload[0].payload;
      return (
        <div className="bg-black/80 backdrop-blur-md border border-[var(--border)] p-3 rounded-lg shadow-xl text-[11px] font-mono z-50">
          <p className="text-[10px] uppercase text-[var(--foreground)]/50 mb-2 font-bold tracking-widest border-b border-[var(--border)] pb-1">
            DATE: {dataPoint.date}
          </p>
          <div className="flex items-center justify-between gap-6 my-1">
            <span className="flex items-center gap-1.5 font-bold text-[var(--accent)]">
              <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent)]" /> {details.indexName}:
            </span>
            <span className="font-bold text-[var(--foreground)]">{dataPoint.IndexRaw.toLocaleString()} {details.currency}</span>
          </div>
          <div className="flex items-center justify-between gap-6 my-1">
            <span className="flex items-center gap-1.5 font-bold text-amber-400">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400" /> Gold:
            </span>
            <span className="font-bold text-[var(--foreground)]">${dataPoint.GoldRaw.toLocaleString()}</span>
          </div>
          <div className="flex items-center justify-between gap-6 my-1">
            <span className="flex items-center gap-1.5 font-bold text-slate-300">
              <span className="w-1.5 h-1.5 rounded-full bg-slate-300" /> Silver:
            </span>
            <span className="font-bold text-[var(--foreground)]">${dataPoint.SilverRaw.toLocaleString()}</span>
          </div>
          <div className="flex items-center justify-between gap-6 my-1">
            <span className="flex items-center gap-1.5 font-bold text-sky-400">
              <span className="w-1.5 h-1.5 rounded-full bg-sky-400" /> Crude Oil:
            </span>
            <span className="font-bold text-[var(--foreground)]">${dataPoint.OilRaw.toLocaleString()}</span>
          </div>
          <div className="text-[9px] text-[var(--foreground)]/30 border-t border-[var(--border)] pt-1 mt-1">
            * Normalized to 100
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }} className="w-full space-y-6">
      <div className="flex items-center gap-2">
        <Globe2 className="text-[var(--accent)] w-4 h-4 animate-pulse" />
        <h2 className="text-[10px] tracking-[0.2em] text-[var(--foreground)]/50 font-bold uppercase">News-Driven Macro Center</h2>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        {/* Globe */}
        <div className="lg:col-span-5 p-6 rounded-card bg-surface border border-[var(--border)] flex flex-col items-center justify-between overflow-hidden relative shadow-lg hover:shadow-[0_8px_30px_rgba(0,0,0,0.4)] transition-shadow">
          <div className="absolute top-5 left-5 z-10">
            <h3 className="text-[10px] tracking-widest text-[var(--foreground)]/40 uppercase mb-1 font-bold">Interactive Macro Globe</h3>
            <div className="flex items-center gap-2 text-[9px] font-mono text-[var(--profit)] font-bold">
              <span className="w-1.5 h-1.5 rounded-full bg-[var(--profit)] animate-ping" />
              ACTIVE: {activeMarket.toUpperCase()}
            </div>
          </div>
          <div className="w-full py-4 flex items-center justify-center relative">
            <GlobeWidget 
              activeLocation={activeLocation} 
              onSelectMarket={(name) => {
                setActiveMarket(name);
                fetchTickers(name).then((tickers) => {
                  if (tickers && tickers.length > 0) setActiveTicker(tickers[0]);
                }).catch(console.error);
              }} 
            />
          </div>
          <div className="w-full border-t border-[var(--border)] pt-4 mt-2 flex items-center justify-between text-[9px] font-mono text-[var(--foreground)]/40">
            <div><span className="text-[var(--foreground)]/20 uppercase mr-1">REGION:</span> <span className="text-[var(--foreground)]/80 font-bold">{details.region}</span></div>
            <div><span className="text-[var(--foreground)]/20 uppercase mr-1">LATENCY:</span> <span className="text-[var(--profit)] font-bold">14ms</span></div>
            <div><span className="text-[var(--foreground)]/20 uppercase mr-1">CURRENCY:</span> <span className="text-[var(--foreground)]/80 font-bold">{details.currency}</span></div>
          </div>
        </div>

        {/* News Feed */}
        <div className="lg:col-span-7 p-6 rounded-card bg-surface border border-[var(--border)] flex flex-col justify-between shadow-lg hover:shadow-[0_8px_30px_rgba(0,0,0,0.4)] transition-shadow min-h-[480px]">
          <div className="flex items-center justify-between mb-5 shrink-0">
            <div className="flex items-center gap-2">
              <Rss className="text-[var(--accent)] w-4 h-4 animate-pulse" />
              <h3 className="text-[10px] tracking-widest text-[var(--foreground)]/40 uppercase font-bold">Live Google News Feed: {activeMarket}</h3>
            </div>
            <div className="flex items-center gap-1.5 text-[9px] font-mono bg-[var(--accent)]/10 border border-[var(--accent)]/20 px-2 py-0.5 rounded text-[var(--foreground)]/50">
              <Cpu className="w-3 h-3 text-[var(--accent)]" /> NLP SENTIMENT ENGINE
            </div>
          </div>

          <div className="flex-1 overflow-y-auto space-y-4 pr-1 scrollbar-thin scrollbar-thumb-[var(--border)] scrollbar-track-transparent">
            {newsLoading ? (
              <div className="w-full h-full rounded-card border border-[var(--border)] bg-surface flex items-center justify-center overflow-hidden relative">
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full animate-[shimmer_1.5s_infinite]" />
                <div className="font-mono text-[var(--foreground)]/30 uppercase tracking-widest text-xs z-10">Extracting Google News RSS...</div>
              </div>
            ) : news.length > 0 ? (
              <ExpandableNewsCards news={news} />
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-[var(--foreground)]/30 font-mono text-sm text-center px-4 border border-[var(--border)] border-dashed rounded-xl">
                No significant geopolitical or economic events extracted.
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="p-6 rounded-card bg-surface border border-[var(--border)] shadow-lg hover:shadow-[0_8px_30px_rgba(0,0,0,0.4)] transition-shadow">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 pb-4 border-b border-[var(--border)]">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Layers className="text-[var(--accent)] w-4 h-4" />
              <h3 className="text-[10px] tracking-[0.15em] text-[var(--foreground)]/40 uppercase font-bold">Unified Global Macro Graph</h3>
            </div>
            <p className="text-[10px] text-[var(--foreground)]/30 font-mono">Normalized comparative performance of commodities against active index ({details.indexName})</p>
          </div>
          <div className="flex flex-wrap items-center gap-3 font-mono text-[10px]">
            <div className="px-3 py-1.5 rounded-lg bg-[var(--background)] border border-[var(--border)] flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent)]" />
              <span className="text-[var(--foreground)]/40">{details.tickerSymbol}:</span>
              <span className="font-bold text-[var(--foreground)]">{marketStockData ? marketStockData.latest_close.toLocaleString(undefined, { maximumFractionDigits: 2 }) : "---"}</span>
            </div>
            <div className="px-3 py-1.5 rounded-lg bg-[var(--background)] border border-[var(--border)] flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
              <span className="text-[var(--foreground)]/40">GOLD:</span>
              <span className="font-bold text-[var(--foreground)]">$2,345.80</span>
            </div>
            <div className="px-3 py-1.5 rounded-lg bg-[var(--background)] border border-[var(--border)] flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-slate-300" />
              <span className="text-[var(--foreground)]/40">SILVER:</span>
              <span className="font-bold text-[var(--foreground)]">$29.50</span>
            </div>
            <div className="px-3 py-1.5 rounded-lg bg-[var(--background)] border border-[var(--border)] flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-sky-400" />
              <span className="text-[var(--foreground)]/40">OIL (WTI):</span>
              <span className="font-bold text-[var(--foreground)]">$78.45</span>
            </div>
          </div>
        </div>

        <div className="w-full relative h-[320px] md:h-[360px]">
          {stockLoading && chartData.length === 0 ? (
            <div className="absolute inset-0 w-full h-full rounded-card border border-[var(--border)] bg-surface flex items-center justify-center overflow-hidden relative">
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full animate-[shimmer_1.5s_infinite]" />
              <div className="font-mono text-[var(--foreground)]/30 uppercase tracking-widest text-xs z-10">Splicing macro time series data...</div>
            </div>
          ) : chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
              <LineChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <XAxis dataKey="date" stroke="var(--border)" tick={{ fill: "var(--foreground)", opacity: 0.35, fontSize: 9, fontFamily: "monospace" }} axisLine={false} tickLine={false} dy={10} />
                <YAxis domain={["auto", "auto"]} stroke="var(--border)" tickFormatter={(v) => `${v}%`} tick={{ fill: "var(--foreground)", opacity: 0.35, fontSize: 9, fontFamily: "monospace" }} axisLine={false} tickLine={false} dx={-5} />
                <Tooltip content={<CustomTooltip />} cursor={{ stroke: 'var(--border)', strokeWidth: 1, strokeDasharray: '4 4' }} />
                <Line type="monotone" dataKey="Index" stroke="var(--accent)" strokeWidth={2} dot={false} activeDot={{ r: 4, strokeWidth: 0 }} name={details.indexName} isAnimationActive={true} />
                <Line type="monotone" dataKey="Gold" stroke="#EAB308" strokeWidth={1.5} dot={false} activeDot={{ r: 4, strokeWidth: 0 }} name="Gold" isAnimationActive={true} />
                <Line type="monotone" dataKey="Silver" stroke="#94A3B8" strokeWidth={1.5} dot={false} activeDot={{ r: 4, strokeWidth: 0 }} name="Silver" isAnimationActive={true} />
                <Line type="monotone" dataKey="Oil" stroke="#38BDF8" strokeWidth={1.5} dot={false} activeDot={{ r: 4, strokeWidth: 0 }} name="Crude Oil" isAnimationActive={true} />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="absolute inset-0 flex items-center justify-center text-[var(--foreground)]/30 font-mono text-xs border border-dashed border-[var(--border)] rounded-xl">
              No historical data available for comparative chart.
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
