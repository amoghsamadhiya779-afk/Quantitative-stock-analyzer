"use client";

import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { Check } from "lucide-react";

interface Candle {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  ema?: number;
  bbUpper?: number;
  bbLower?: number;
  bbBasis?: number;
  macd?: number;
  signal?: number;
  hist?: number;
}

// Generate high-fidelity simulated OHLC data
const generateSimulatedData = (): Candle[] => {
  const data: Candle[] = [];
  let currentPrice = 150.0;
  const dates = Array.from({ length: 40 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (40 - i));
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  });

  // Basic random walk with some trend
  dates.forEach((date, index) => {
    const change = (Math.random() - 0.45) * 5; // Slight upward bias
    const open = currentPrice;
    const close = currentPrice + change;
    const high = Math.max(open, close) + Math.random() * 2.5;
    const low = Math.min(open, close) - Math.random() * 2.5;
    const volume = Math.floor(Math.random() * 800000) + 200000;

    data.push({ date, open, high, low, close, volume });
    currentPrice = close;
  });

  // Calculate EMA 12, EMA 26, MACD, Signal, EMA 20, BB
  // EMA 20
  const emaPeriod = 20;
  const k20 = 2 / (emaPeriod + 1);
  let currentEma = data[0].close;
  data[0].ema = currentEma;
  for (let i = 1; i < data.length; i++) {
    currentEma = data[i].close * k20 + currentEma * (1 - k20);
    data[i].ema = currentEma;
  }

  // Bollinger Bands (20-day SMA, 2 standard deviations)
  const bbPeriod = 20;
  for (let i = 0; i < data.length; i++) {
    if (i >= bbPeriod - 1) {
      const slice = data.slice(i - bbPeriod + 1, i + 1);
      const closePrices = slice.map((c) => c.close);
      const mean = closePrices.reduce((a, b) => a + b, 0) / bbPeriod;
      const variance = closePrices.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / bbPeriod;
      const stdDev = Math.sqrt(variance);

      data[i].bbBasis = mean;
      data[i].bbUpper = mean + 2 * stdDev;
      data[i].bbLower = mean - 2 * stdDev;
    } else {
      data[i].bbBasis = data[i].close;
      data[i].bbUpper = data[i].close + 4;
      data[i].bbLower = data[i].close - 4;
    }
  }

  // MACD (12, 26, 9)
  const k12 = 2 / (12 + 1);
  const k26 = 2 / (26 + 1);
  let ema12 = data[0].close;
  let ema26 = data[0].close;

  data.forEach((candle, i) => {
    if (i > 0) {
      ema12 = candle.close * k12 + ema12 * (1 - k12);
      ema26 = candle.close * k26 + ema26 * (1 - k26);
    }
    const macdVal = ema12 - ema26;
    candle.macd = macdVal;
  });

  const k9 = 2 / (9 + 1);
  let signalVal = data[0].macd || 0;
  data[0].signal = signalVal;
  data[0].hist = 0;

  for (let i = 1; i < data.length; i++) {
    signalVal = (data[i].macd || 0) * k9 + signalVal * (1 - k9);
    data[i].signal = signalVal;
    data[i].hist = (data[i].macd || 0) - signalVal;
  }

  return data;
};

export default function TechnicalIndicators() {
  const [overlays, setOverlays] = useState({
    ema: true,
    bb: true,
    macd: false,
  });

  const data = useMemo(() => generateSimulatedData(), []);

  // Compute SVG dimensions and limits
  const width = 800;
  const priceHeight = 280;
  const macdHeight = 100;
  const margin = { top: 20, right: 50, bottom: 20, left: 50 };

  const priceMin = useMemo(() => {
    let min = Math.min(...data.map((c) => c.low));
    if (overlays.bb) {
      const bbLows = data.map((c) => c.bbLower || c.low);
      min = Math.min(min, ...bbLows);
    }
    return min - 2;
  }, [data, overlays.bb]);

  const priceMax = useMemo(() => {
    let max = Math.max(...data.map((c) => c.high));
    if (overlays.bb) {
      const bbHighs = data.map((c) => c.bbUpper || c.high);
      max = Math.max(max, ...bbHighs);
    }
    return max + 2;
  }, [data, overlays.bb]);

  const macdMax = useMemo(() => {
    const vals = data.flatMap((c) => [c.macd || 0, c.signal || 0, c.hist || 0]);
    return Math.max(...vals.map(Math.abs), 0.5);
  }, [data]);

  const getPriceY = (val: number) => {
    const divisor = priceMax - priceMin;
    if (divisor <= 0) {
      return priceHeight / 2;
    }
    return priceHeight - margin.bottom - ((val - priceMin) / divisor) * (priceHeight - margin.top - margin.bottom);
  };

  const getMacdY = (val: number) => {
    if (macdMax <= 0) {
      return macdHeight / 2;
    }
    const scaleHeight = (macdHeight - 20) / 2;
    return macdHeight / 2 - (val / macdMax) * scaleHeight;
  };

  const getX = (index: number) => {
    if (data.length < 2) {
      return margin.left;
    }
    const step = (width - margin.left - margin.right) / (data.length - 1);
    return margin.left + index * step;
  };

  const toggleOverlay = (key: "ema" | "bb" | "macd") => {
    setOverlays((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  // Generate paths for overlays
  const emaPath = useMemo(() => {
    return data.map((c, i) => `${i === 0 ? "M" : "L"} ${getX(i)} ${getPriceY(c.ema || 0)}`).join(" ");
  }, [data, priceMin, priceMax]);

  const bbBasisPath = useMemo(() => {
    return data.map((c, i) => `${i === 0 ? "M" : "L"} ${getX(i)} ${getPriceY(c.bbBasis || 0)}`).join(" ");
  }, [data, priceMin, priceMax]);

  const bbUpperPath = useMemo(() => {
    return data.map((c, i) => `${i === 0 ? "M" : "L"} ${getX(i)} ${getPriceY(c.bbUpper || 0)}`).join(" ");
  }, [data, priceMin, priceMax]);

  const bbLowerPath = useMemo(() => {
    return data.map((c, i) => `${i === 0 ? "M" : "L"} ${getX(i)} ${getPriceY(c.bbLower || 0)}`).join(" ");
  }, [data, priceMin, priceMax]);

  const bbAreaPath = useMemo(() => {
    const upperPoints = data.map((c, i) => `${getX(i)},${getPriceY(c.bbUpper || 0)}`).join(" ");
    const lowerPoints = data
      .slice()
      .reverse()
      .map((c, i) => `${getX(data.length - 1 - i)},${getPriceY(c.bbLower || 0)}`)
      .join(" ");
    return `M ${upperPoints} L ${lowerPoints} Z`;
  }, [data, priceMin, priceMax]);

  // MACD Paths
  const macdLinePath = useMemo(() => {
    return data.map((c, i) => `${i === 0 ? "M" : "L"} ${getX(i)} ${getMacdY(c.macd || 0)}`).join(" ");
  }, [data, macdMax]);

  const macdSignalPath = useMemo(() => {
    return data.map((c, i) => `${i === 0 ? "M" : "L"} ${getX(i)} ${getMacdY(c.signal || 0)}`).join(" ");
  }, [data, macdMax]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, ease: "easeOut" }}
      className="w-full flex flex-col gap-6"
    >
      <div className="flex flex-col lg:flex-row gap-6">
        {/* Controls checklist */}
        <div className="lg:w-[220px] shrink-0 ventriloc-card transition-all duration-300 rounded-[24px] bg-[#0a0a0a] border border-luxury-glass p-6 flex flex-col gap-4">
          <h3 className="text-xs uppercase font-mono font-bold tracking-widest text-neutral-400">Indicators</h3>
          
          <div className="flex flex-col gap-3">
            {[
              { id: "ema" as const, name: "EMA (20)", desc: "Exponential Moving Avg", color: "border-orange-500 bg-orange-500/20 text-orange-500" },
              { id: "bb" as const, name: "Bollinger Bands", desc: "Volatility Envelope", color: "border-blue-500 bg-blue-500/20 text-blue-500" },
              { id: "macd" as const, name: "MACD", desc: "Moving Avg Convergence", color: "border-emerald-500 bg-emerald-500/20 text-emerald-500" },
            ].map((overlay) => (
              <button
                key={overlay.id}
                onClick={() => toggleOverlay(overlay.id)}
                className="flex items-center gap-3 p-3 rounded-[16px] border border-white/5 hover:border-white/10 bg-white/5 hover:bg-white/10 text-left transition-all duration-200"
              >
                <div
                  className={`w-5 h-5 rounded-md border flex items-center justify-center shrink-0 transition-colors duration-200 ${
                    overlays[overlay.id] ? "bg-orange-500 border-orange-500 text-white" : "border-white/20 bg-transparent text-transparent"
                  }`}
                >
                  <Check className="w-3.5 h-3.5" />
                </div>
                <div>
                  <div className="text-[11px] font-bold text-white uppercase tracking-wider">{overlay.name}</div>
                  <div className="text-[9px] text-neutral-500 uppercase tracking-widest">{overlay.desc}</div>
                </div>
              </button>
            ))}
          </div>

          <div className="mt-4 pt-4 border-t border-white/5 text-[9px] uppercase font-mono tracking-widest text-neutral-500 space-y-2">
            <div>Symbol: AAPL (Sim)</div>
            <div>Period: Daily (40D)</div>
            <div>Interval: 1D</div>
          </div>
        </div>

        {/* Chart View */}
        <div className="flex-1 ventriloc-card transition-all duration-300 rounded-[24px] bg-[#0a0a0a] border border-luxury-glass p-6 flex flex-col gap-4 overflow-hidden">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold font-display uppercase tracking-widest text-white">Dynamic Candlestick Chart & Overlays</h2>
            <div className="flex items-center gap-4 text-[10px] font-mono uppercase tracking-wider text-neutral-400">
              <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-emerald-400"></span>O: {data[data.length - 1].open.toFixed(2)}</span>
              <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-orange-400"></span>H: {data[data.length - 1].high.toFixed(2)}</span>
              <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-red-400"></span>L: {data[data.length - 1].low.toFixed(2)}</span>
              <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-emerald-400"></span>C: {data[data.length - 1].close.toFixed(2)}</span>
            </div>
          </div>

          {/* SVG Price Chart */}
          <div className="relative w-full overflow-x-auto select-none bg-[#0a0a0a]">
            <svg viewBox={`0 0 ${width} ${priceHeight}`} className="w-full h-auto overflow-visible transform-gpu">
              {/* Grid Lines */}
              {Array.from({ length: 5 }).map((_, idx) => {
                const price = priceMin + (idx * (priceMax - priceMin)) / 4;
                const y = getPriceY(price);
                return (
                  <g key={idx}>
                    <line x1={margin.left} y1={y} x2={width - margin.right} y2={y} stroke="rgba(255,255,255,0.04)" strokeDasharray="3 3" />
                    <text x={width - margin.right + 5} y={y + 4} fill="rgba(255,255,255,0.4)" className="text-[9px] font-mono">{price.toFixed(1)}</text>
                  </g>
                );
              })}

              {/* Bollinger Bands Shaded Area */}
              {overlays.bb && (
                <>
                  <path d={bbAreaPath} fill="rgba(59, 130, 246, 0.05)" />
                  <path d={bbUpperPath} fill="none" stroke="rgba(59, 130, 246, 0.5)" strokeWidth={1} strokeDasharray="2 2" />
                  <path d={bbLowerPath} fill="none" stroke="rgba(59, 130, 246, 0.5)" strokeWidth={1} strokeDasharray="2 2" />
                  <path d={bbBasisPath} fill="none" stroke="rgba(59, 130, 246, 0.25)" strokeWidth={1} />
                </>
              )}

              {/* EMA (20) Line */}
              {overlays.ema && (
                <path d={emaPath} fill="none" stroke="#f97316" strokeWidth={1.5} />
              )}

              {/* Candlesticks */}
              {data.map((candle, idx) => {
                const x = getX(idx);
                const openY = getPriceY(candle.open);
                const closeY = getPriceY(candle.close);
                const highY = getPriceY(candle.high);
                const lowY = getPriceY(candle.low);
                const isGreen = candle.close >= candle.open;
                const candleColor = isGreen ? "#10b981" : "#ef4444";
                const barWidth = data.length > 0 ? Math.max(3, (width - margin.left - margin.right) / data.length * 0.6) : 3;

                return (
                  <g key={idx} className="hover:opacity-80 transition-opacity duration-150">
                    {/* Shadow / Wick */}
                    <line x1={x} y1={highY} x2={x} y2={lowY} stroke={candleColor} strokeWidth={1.2} />
                    {/* Body */}
                    <rect
                      x={x - barWidth / 2}
                      y={Math.min(openY, closeY)}
                      width={barWidth}
                      height={Math.max(1.5, Math.abs(openY - closeY))}
                      fill={candleColor}
                      rx={1}
                    />
                  </g>
                );
              })}
            </svg>
          </div>

          {/* MACD Chart Sub-Panel */}
          {overlays.macd && (
            <div className="border-t border-white/5 pt-4 mt-2">
              <div className="text-[10px] font-mono uppercase tracking-widest text-neutral-500 mb-2">MACD Oscillator (12, 26, 9)</div>
              <div className="relative w-full">
                <svg viewBox={`0 0 ${width} ${macdHeight}`} className="w-full h-auto overflow-visible transform-gpu">
                  {/* Zero Line */}
                  <line x1={margin.left} y1={macdHeight / 2} x2={width - margin.right} y2={macdHeight / 2} stroke="rgba(255,255,255,0.08)" />

                  {/* Histogram Bars */}
                  {data.map((candle, idx) => {
                    const x = getX(idx);
                    const histY = getMacdY(candle.hist || 0);
                    const zeroY = macdHeight / 2;
                    const barWidth = data.length > 0 ? Math.max(2, (width - margin.left - margin.right) / data.length * 0.5) : 2;
                    const isGreen = (candle.hist || 0) >= 0;

                    return (
                      <rect
                        key={idx}
                        x={x - barWidth / 2}
                        y={isGreen ? histY : zeroY}
                        width={barWidth}
                        height={Math.max(1, Math.abs(histY - zeroY))}
                        fill={isGreen ? "rgba(16, 185, 129, 0.4)" : "rgba(239, 68, 68, 0.4)"}
                        rx={0.5}
                      />
                    );
                  })}

                  {/* MACD & Signal Lines */}
                  <path d={macdLinePath} fill="none" stroke="#3b82f6" strokeWidth={1.2} />
                  <path d={macdSignalPath} fill="none" stroke="#f59e0b" strokeWidth={1.2} />
                </svg>
              </div>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
