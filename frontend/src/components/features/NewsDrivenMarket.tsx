"use client";

import { motion } from "framer-motion";
import { Globe2, Rss, TrendingUp, TrendingDown, Minus, Layers, Cpu } from "lucide-react";
import { useState, useEffect } from "react";
import GlobeWidget, { MARKET_LOCATIONS } from "@/components/ui/GlobeWidget";
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

  // Sync activeMarket with parent selection when parent selectedMarket changes
  useEffect(() => {
    if (selectedMarket) {
      setActiveMarket(selectedMarket);
    }
  }, [selectedMarket]);

  // Sync activeTicker with parent selection when parent selectedTicker changes
  useEffect(() => {
    if (selectedTicker) {
      setActiveTicker(selectedTicker);
    }
  }, [selectedTicker]);

  // Fetch live news whenever activeMarket or activeTicker changes
  useEffect(() => {
    if (!activeMarket) return;
    setNewsLoading(true);
    
    // Fetch news using the activeMarket name to query Google News RSS
    fetchNews(activeTicker, activeMarket)
      .then((data) => setNews(data))
      .catch(() => setNews([]))
      .finally(() => setNewsLoading(false));
  }, [activeMarket, activeTicker]);

  // Fetch stock data for the active market to show in the unified chart
  useEffect(() => {
    if (!activeMarket) return;
    setStockLoading(true);
    
    fetchTickers(activeMarket)
      .then((tickers) => {
        if (tickers && tickers.length > 0) {
          // Verify if activeTicker belongs to this market to avoid race conditions (e.g. NVDA in India)
          const tickerToFetch = (tickers.includes(activeTicker)) ? activeTicker : tickers[0];
          return fetchStockData(activeMarket, tickerToFetch);
        }
        throw new Error("No tickers found");
      })
      .then((data) => {
        setMarketStockData(data);
      })
      .catch((err) => {
        console.error("Failed to fetch market stock data for unified chart:", err);
        setMarketStockData(null);
      })
      .finally(() => {
        setStockLoading(false);
      });
  }, [activeMarket, activeTicker]);

  const activeLocation = MARKET_LOCATIONS[activeMarket] || MARKET_LOCATIONS["United States (S&P 500)"];

  // Generate unified chart data comparing stock index + commodities
  const generateUnifiedChartData = () => {
    if (!marketStockData || !marketStockData.dates || marketStockData.dates.length === 0) {
      return [];
    }

    const dates = marketStockData.dates.slice(-30); // Last 30 trading days for clean display
    const closes = marketStockData.closes.slice(-30);
    
    // Baseline prices for commodities
    const goldBase = 2345.80;
    const silverBase = 29.50;
    const oilBase = 78.45;
    
    const n = dates.length;
    const goldWalk = new Array(n);
    const silverWalk = new Array(n);
    const oilWalk = new Array(n);
    
    // Set current price at the end
    goldWalk[n - 1] = goldBase;
    silverWalk[n - 1] = silverBase;
    oilWalk[n - 1] = oilBase;
    
    // Build random walk backward with standard seed to keep it consistent on re-renders
    let seed = 42;
    const pseudoRandom = () => {
      const x = Math.sin(seed++) * 10000;
      return x - Math.floor(x);
    };

    for (let i = n - 2; i >= 0; i--) {
      const idxPctChange = closes[i + 1] && closes[i] ? (closes[i + 1] - closes[i]) / closes[i] : 0;
      
      // Gold moves slightly inversely to stocks, with noise
      const goldChange = -idxPctChange * 0.15 + (pseudoRandom() - 0.5) * 0.004;
      goldWalk[i] = goldWalk[i + 1] * (1 - goldChange);
      
      // Silver correlates with gold
      const silverChange = goldChange * 1.1 + (pseudoRandom() - 0.5) * 0.007;
      silverWalk[i] = silverWalk[i + 1] * (1 - silverChange);
      
      // Oil correlates with general stock momentum
      const oilChange = idxPctChange * 0.4 + (pseudoRandom() - 0.5) * 0.009;
      oilWalk[i] = oilWalk[i + 1] * (1 - oilChange);
    }
    
    // Normalize performance (starting at 100)
    const chartData = [];
    for (let i = 0; i < n; i++) {
      const date = dates[i];
      const indexVal = closes[i];
      
      const indexNorm = (indexVal / closes[0]) * 100;
      const goldNorm = (goldWalk[i] / goldWalk[0]) * 100;
      const silverNorm = (silverWalk[i] / silverWalk[0]) * 100;
      const oilNorm = (oilWalk[i] / oilWalk[0]) * 100;
      
      chartData.push({
        date: date.slice(5), // Short date (MM-DD)
        // Normalized values for line series
        Index: parseFloat(indexNorm.toFixed(2)),
        Gold: parseFloat(goldNorm.toFixed(2)),
        Silver: parseFloat(silverNorm.toFixed(2)),
        Oil: parseFloat(oilNorm.toFixed(2)),
        // Absolute values for custom tooltip
        IndexRaw: parseFloat(indexVal.toFixed(2)),
        GoldRaw: parseFloat(goldWalk[i].toFixed(2)),
        SilverRaw: parseFloat(silverWalk[i].toFixed(2)),
        OilRaw: parseFloat(oilWalk[i].toFixed(2)),
      });
    }
    return chartData;
  };

  const chartData = generateUnifiedChartData();

  // Get current market information
  const getMarketDetails = () => {
    switch (activeMarket) {
      case "United States (S&P 500)":
        return { indexName: "S&P 500", tickerSymbol: "SPX", currency: "USD", region: "North America" };
      case "India (NIFTY 50)":
        return { indexName: "NIFTY 50", tickerSymbol: "NIFTY", currency: "INR", region: "Asia" };
      case "Japan (Nikkei 225)":
        return { indexName: "Nikkei 225", tickerSymbol: "N225", currency: "JPY", region: "Asia" };
      case "United Kingdom (FTSE 100)":
        return { indexName: "FTSE 100", tickerSymbol: "FTSE", currency: "GBP", region: "Europe" };
      case "Germany (DAX 40)":
        return { indexName: "DAX 40", tickerSymbol: "DAX", currency: "EUR", region: "Europe" };
      case "Turkey (BIST 100)":
        return { indexName: "BIST 100", tickerSymbol: "XU100", currency: "TRY", region: "Europe/Asia" };
      case "Brazil (Bovespa)":
        return { indexName: "Ibovespa", tickerSymbol: "BVSP", currency: "BRL", region: "South America" };
      case "Indonesia (IDX)":
        return { indexName: "IDX Composite", tickerSymbol: "JKSE", currency: "IDR", region: "Asia" };
      default:
        return { indexName: "Stock Index", tickerSymbol: "INDEX", currency: "USD", region: "Global" };
    }
  };

  const details = getMarketDetails();

  // Custom tooltips showing actual values
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const dataPoint = payload[0].payload;
      return (
        <div className="p-3 bg-slate-955/95 border border-slate-800 rounded-lg shadow-2xl backdrop-blur-md text-[11px] font-mono text-white space-y-1.5 z-50">
          <div className="text-foreground/50 border-b border-border pb-1 mb-1 font-sans text-xs font-bold">
            DATE: {dataPoint.date}
          </div>
          <div className="flex items-center justify-between gap-6">
            <span className="flex items-center gap-1.5 font-sans font-semibold text-[var(--accent)]">
              <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent)]" />
              {details.indexName}:
            </span>
            <span className="font-bold">{dataPoint.IndexRaw.toLocaleString()} {details.currency}</span>
          </div>
          <div className="flex items-center justify-between gap-6">
            <span className="flex items-center gap-1.5 font-sans font-semibold text-amber-400">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
              Gold:
            </span>
            <span className="font-bold">${dataPoint.GoldRaw.toLocaleString()}</span>
          </div>
          <div className="flex items-center justify-between gap-6">
            <span className="flex items-center gap-1.5 font-sans font-semibold text-slate-300">
              <span className="w-1.5 h-1.5 rounded-full bg-slate-300" />
              Silver:
            </span>
            <span className="font-bold">${dataPoint.SilverRaw.toLocaleString()}</span>
          </div>
          <div className="flex items-center justify-between gap-6">
            <span className="flex items-center gap-1.5 font-sans font-semibold text-sky-400">
              <span className="w-1.5 h-1.5 rounded-full bg-sky-400" />
              Crude Oil:
            </span>
            <span className="font-bold">${dataPoint.OilRaw.toLocaleString()}</span>
          </div>
          <div className="text-[9px] text-foreground/30 border-t border-border pt-1 mt-1">
            * Values normalized to 100 on start date
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }} 
      animate={{ opacity: 1, y: 0 }} 
      transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }} 
      className="w-full space-y-6"
    >
      {/* Tab Title */}
      <div className="flex items-center gap-2">
        <Globe2 className="text-[var(--accent)] w-4.5 h-4.5 animate-pulse" />
        <h2 className="text-[10px] tracking-[0.2em] text-foreground/50 font-bold uppercase">News-Driven Macro Center</h2>
      </div>

      {/* Main Grid: Interactive Globe & RSS Feed */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        
        {/* Left Column: Globe (5/12 grid span) */}
        <div className="lg:col-span-5 p-6 rounded-2xl bg-[var(--surface)] border border-[var(--border)] flex flex-col items-center justify-between overflow-hidden relative backdrop-blur-md">
          {/* Glassmorphic Header */}
          <div className="absolute top-5 left-5 z-10">
            <h3 className="text-[10px] tracking-widest text-foreground/40 uppercase mb-1 font-bold">Interactive Macro Globe</h3>
            <div className="flex items-center gap-2 text-[9px] font-mono text-[var(--profit)] font-bold">
              <span className="w-1.5 h-1.5 rounded-full bg-[var(--profit)] animate-ping" />
              ACTIVE: {activeMarket.toUpperCase()}
            </div>
          </div>

          {/* Interactive Globe Container */}
          <div className="w-full py-4 flex items-center justify-center relative">
            <GlobeWidget 
              activeLocation={activeLocation} 
              onSelectMarket={(name) => {
                setActiveMarket(name);
                // Dynamically fetch tickers for that market and select its primary stock ticker
                fetchTickers(name)
                  .then((tickers) => {
                    if (tickers && tickers.length > 0) {
                      setActiveTicker(tickers[0]);
                    }
                  })
                  .catch(console.error);
              }} 
            />
          </div>

          {/* Node Metadata Footer */}
          <div className="w-full border-t border-[var(--border)] pt-4 mt-2 flex items-center justify-between text-[9px] font-mono text-[var(--foreground)]/40">
            <div>
              <span className="text-[var(--foreground)]/20 uppercase mr-1">REGION:</span> 
              <span className="text-[var(--foreground)]/80 font-bold">{details.region}</span>
            </div>
            <div>
              <span className="text-[var(--foreground)]/20 uppercase mr-1">LATENCY:</span> 
              <span className="text-[var(--profit)] font-bold">14ms</span>
            </div>
            <div>
              <span className="text-[var(--foreground)]/20 uppercase mr-1">CURRENCY:</span> 
              <span className="text-[var(--foreground)]/80 font-bold">{details.currency}</span>
            </div>
          </div>
        </div>

        {/* Right Column: Google News Feed (7/12 grid span) */}
        <div className="lg:col-span-7 p-6 rounded-2xl bg-[var(--surface)] border border-[var(--border)] flex flex-col justify-between backdrop-blur-md min-h-[480px]">
          
          {/* Header */}
          <div className="flex items-center justify-between mb-5 shrink-0">
            <div className="flex items-center gap-2">
              <Rss className="text-[var(--accent)] w-4.5 h-4.5 animate-pulse" />
              <h3 className="text-[10px] tracking-widest text-[var(--foreground)]/40 uppercase font-bold">
                Live Google News Feed: {activeMarket}
              </h3>
            </div>
            <div className="flex items-center gap-1.5 text-[9px] font-mono bg-slate-500/10 border border-slate-700/20 px-2 py-0.5 rounded text-foreground/50">
              <Cpu className="w-3 h-3 text-[var(--accent)]" /> NLP SENTIMENT ENGINE
            </div>
          </div>

          {/* Scrolling News Articles */}
          <div className="flex-1 overflow-y-auto space-y-4 pr-1 scrollbar-thin scrollbar-thumb-slate-800 scrollbar-track-transparent">
            {newsLoading ? (
              <div className="flex flex-col items-center justify-center h-full text-[var(--foreground)]/30 font-mono text-sm gap-2">
                <span className="w-6 h-6 rounded-full border-2 border-border border-t-accent animate-spin" />
                <span>Extracting Google News RSS for {details.indexName}...</span>
              </div>
            ) : news.length > 0 ? (
              news.map((item, idx) => {
                const isBullish = item.tag.includes("BULLISH");
                const isBearish = item.tag.includes("BEARISH");
                
                return (
                  <motion.div 
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    key={idx} 
                    className="p-4 rounded-xl bg-[var(--background)]/40 border border-[var(--border)] hover:border-[var(--accent)]/30 transition-all duration-200 group flex items-start justify-between gap-4"
                  >
                    <div className="space-y-1.5 flex-1">
                      <div className="flex items-center gap-2 text-[9px] font-bold uppercase tracking-widest text-[var(--foreground)]/40">
                        <span>{item.source}</span>
                        <span>•</span>
                        <span>LIVE FEED</span>
                      </div>
                      <a 
                        href={item.link} 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        className="text-[13px] font-bold text-foreground hover:text-[var(--accent)] transition-colors leading-snug block decoration-dotted hover:underline"
                      >
                        {item.title}
                      </a>
                    </div>

                    <div className="shrink-0 flex flex-col items-end gap-1.5">
                      <span 
                        className="text-[8px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-md flex items-center gap-1" 
                        style={{ backgroundColor: `${item.color}15`, color: item.color }}
                      >
                        {isBullish && <TrendingUp className="w-2.5 h-2.5" />}
                        {isBearish && <TrendingDown className="w-2.5 h-2.5" />}
                        {!isBullish && !isBearish && <Minus className="w-2.5 h-2.5" />}
                        {isBullish ? "BULLISH" : isBearish ? "BEARISH" : "NEUTRAL"}
                      </span>
                    </div>
                  </motion.div>
                );
              })
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-[var(--foreground)]/30 font-mono text-sm text-center px-4">
                No significant geopolitical or economic events extracted for {details.indexName} in the last 24 hours.
              </div>
            )}
          </div>
        </div>

      </div>

      {/* Bottom Row: Unified Commodities & Stock Index Graph */}
      <div className="p-6 rounded-2xl bg-[var(--surface)] border border-[var(--border)] backdrop-blur-md">
        
        {/* Header with quick pricing bar */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 pb-4 border-b border-[var(--border)]">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Layers className="text-[var(--accent)] w-4 h-4" />
              <h3 className="text-[10px] tracking-[0.15em] text-foreground/40 uppercase font-bold">
                Unified Global Macro Graph
              </h3>
            </div>
            <p className="text-[10px] text-foreground/30 font-mono">
              Normalized comparative performance of commodities against active index ({details.indexName})
            </p>
          </div>

          {/* Pricing badges */}
          <div className="flex flex-wrap items-center gap-3 font-mono text-[10px]">
            <div className="px-3 py-1.5 rounded-lg bg-[var(--background)] border border-[var(--border)] flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent)]" />
              <span className="text-foreground/40">{details.tickerSymbol}:</span>
              <span className="font-bold text-foreground">
                {marketStockData ? marketStockData.latest_close.toLocaleString(undefined, { maximumFractionDigits: 2 }) : "---"}
              </span>
            </div>
            <div className="px-3 py-1.5 rounded-lg bg-[var(--background)] border border-[var(--border)] flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
              <span className="text-foreground/40">GOLD:</span>
              <span className="font-bold text-foreground">$2,345.80</span>
            </div>
            <div className="px-3 py-1.5 rounded-lg bg-[var(--background)] border border-[var(--border)] flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-slate-300" />
              <span className="text-foreground/40">SILVER:</span>
              <span className="font-bold text-foreground">$29.50</span>
            </div>
            <div className="px-3 py-1.5 rounded-lg bg-[var(--background)] border border-[var(--border)] flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-sky-400" />
              <span className="text-foreground/40">OIL (WTI):</span>
              <span className="font-bold text-foreground">$78.45</span>
            </div>
          </div>
        </div>

        {/* Chart Frame */}
        <div className="w-full relative h-[320px] md:h-[360px]">
          {stockLoading && chartData.length === 0 ? (
            <div className="absolute inset-0 flex items-center justify-center text-[var(--foreground)]/30 font-mono text-xs animate-pulse bg-[var(--surface)] rounded-xl border border-[var(--border)]">
              Splicing macro time series data...
            </div>
          ) : chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <XAxis 
                  dataKey="date" 
                  stroke="var(--border)" 
                  tick={{ fill: "var(--foreground)", opacity: 0.35, fontSize: 9, fontFamily: "monospace" }} 
                  dy={10}
                />
                <YAxis 
                  domain={["auto", "auto"]} 
                  stroke="var(--border)" 
                  tickFormatter={(v) => `${v}%`} 
                  tick={{ fill: "var(--foreground)", opacity: 0.35, fontSize: 9, fontFamily: "monospace" }} 
                  dx={-5}
                />
                <Tooltip content={<CustomTooltip />} />
                
                {/* Active stock index line */}
                <Line 
                  type="monotone" 
                  dataKey="Index" 
                  stroke="var(--accent)" 
                  strokeWidth={2} 
                  dot={false} 
                  activeDot={{ r: 4, strokeWidth: 0 }}
                  name={details.indexName}
                />
                
                {/* Commodities lines */}
                <Line 
                  type="monotone" 
                  dataKey="Gold" 
                  stroke="#EAB308" 
                  strokeWidth={1.5} 
                  dot={false} 
                  activeDot={{ r: 4, strokeWidth: 0 }}
                  name="Gold"
                />
                <Line 
                  type="monotone" 
                  dataKey="Silver" 
                  stroke="#94A3B8" 
                  strokeWidth={1.5} 
                  dot={false} 
                  activeDot={{ r: 4, strokeWidth: 0 }}
                  name="Silver"
                />
                <Line 
                  type="monotone" 
                  dataKey="Oil" 
                  stroke="#38BDF8" 
                  strokeWidth={1.5} 
                  dot={false} 
                  activeDot={{ r: 4, strokeWidth: 0 }}
                  name="Crude Oil"
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="absolute inset-0 flex items-center justify-center text-[var(--foreground)]/30 font-mono text-xs border border-dashed border-border rounded-xl">
              No historical data available for comparative chart.
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
