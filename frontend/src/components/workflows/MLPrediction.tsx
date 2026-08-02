"use client";

import { useMemo } from "react";
import { motion } from "framer-motion";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, Line, ComposedChart, ReferenceLine } from "recharts";
import { Cpu, Server, TrendingUp } from "lucide-react";
import type { StockData, PredictionResult } from "@/lib/api";

interface DataPoint {
  index: number;
  label: string;
  actual?: number;
  prediction?: number;
  ciLower?: number;
  ciUpper?: number;
}

interface Props {
  stockData?: StockData | null;
  prediction?: PredictionResult | null;
}

const HISTORY_DAYS = 30;

export default function MLPrediction({ stockData, prediction }: Props) {
  const data: DataPoint[] = useMemo(() => {
    if (!stockData || !stockData.closes || stockData.closes.length === 0) return [];

    const closes = stockData.closes.slice(-HISTORY_DAYS);
    const dates = (stockData.dates || []).slice(-HISTORY_DAYS);
    const list: DataPoint[] = closes.map((price, i) => ({
      index: i,
      label: dates[i] || `T-${closes.length - i}`,
      actual: price,
    }));

    if (prediction && list.length > 0) {
      // The model is a single next-bar (1-day-ahead) predictor - it has no genuine
      // multi-day forecasting capability, so this shows exactly one forecast point
      // instead of a fabricated 10-day curve. The CI comes from the ticker's own
      // realized volatility (annualized %, converted back to a 1-day sigma), not a
      // hardcoded per-model width.
      const dailySigma = ((stockData.volatility || 0) / 100) / Math.sqrt(252);
      const band = prediction.predicted_price * dailySigma * 1.96; // ~95% CI, 1 day ahead

      list.push({
        index: list.length,
        label: "T+1",
        prediction: prediction.predicted_price,
        ciLower: prediction.predicted_price - band,
        ciUpper: prediction.predicted_price + band,
      });
      // Connects the historical line to the forecast point so the chart doesn't show a gap.
      list[list.length - 2] = { ...list[list.length - 2], prediction: list[list.length - 2].actual };
    }

    return list;
  }, [stockData, prediction]);

  if (!stockData || !prediction) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="w-full flex flex-col gap-6"
      >
        <div className="rounded border border-outline-variant/30 bg-[#08080a] p-stack-xl flex items-center justify-center h-[400px] font-label-sm text-[11px] uppercase tracking-widest text-outline">
          Waiting for live market data...
        </div>
      </motion.div>
    );
  }

  const confidenceLabel = `${prediction.confidence.toFixed(1)}%`;
  const rmseEstimate = ((stockData.volatility || 0) / 100) / Math.sqrt(252) * stockData.latest_close;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, ease: "easeOut" }}
      className="w-full flex flex-col gap-6"
    >
      {/* Live Model Stats - all derived from the actual prediction response, not
          per-architecture constants. */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-stack-sm">
        <div className="rounded border border-outline-variant/30 bg-[#08080a] p-stack-sm flex flex-col gap-3 lg:col-span-1">
          <span className="font-label-sm text-[10px] uppercase tracking-widest text-outline">Active Engine</span>
          <div className="p-3 rounded border border-secondary/30 bg-secondary/10 text-on-surface font-label-sm text-[11px] font-bold">
            {prediction.model_type}
          </div>
        </div>

        <div className="lg:col-span-3 grid grid-cols-1 sm:grid-cols-3 gap-stack-sm">
          <div className="p-stack-sm rounded border border-outline-variant/30 bg-[#08080a] flex items-center justify-between">
            <div>
              <span className="font-label-sm text-[10px] uppercase tracking-widest text-outline">Confidence</span>
              <div className="font-headline-lg font-mono text-emerald-400 mt-1">{confidenceLabel}</div>
            </div>
            <TrendingUp className="w-8 h-8 text-emerald-500 opacity-80" />
          </div>

          <div className="p-stack-sm rounded border border-outline-variant/30 bg-[#08080a] flex items-center justify-between">
            <div>
              <span className="font-label-sm text-[10px] uppercase tracking-widest text-outline">1-Day Vol Estimate</span>
              <div className="font-headline-lg font-mono text-on-surface mt-1">{rmseEstimate.toFixed(2)} <span className="font-label-sm text-[11px] text-outline">{stockData.currency}</span></div>
            </div>
            <Server className="w-8 h-8 text-secondary opacity-80" />
          </div>

          <div className="p-stack-sm rounded border border-outline-variant/30 bg-[#08080a] flex items-center justify-between">
            <div>
              <span className="font-label-sm text-[10px] uppercase tracking-widest text-outline">Predicted Move</span>
              <div className={`font-headline-lg font-mono mt-1 ${prediction.pct_change >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                {prediction.pct_change >= 0 ? "+" : ""}{prediction.pct_change.toFixed(2)}%
              </div>
            </div>
            <Cpu className="w-8 h-8 text-secondary opacity-80" />
          </div>
        </div>
      </div>

      {/* Main Chart Panel */}
      <div className="rounded border border-outline-variant/30 bg-[#08080a] p-stack-md flex flex-col gap-stack-sm">
        <div>
          <h2 className="font-display-md text-[14px] font-bold uppercase tracking-widest text-on-surface">Next-Bar Forecast (95% CI)</h2>
          <p className="font-label-sm text-[11px] text-outline uppercase tracking-widest mt-1">
            {HISTORY_DAYS}-day realized price against the model&apos;s single next-bar forecast.
          </p>
        </div>

        <div className="w-full h-[400px]">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="predictionArea" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#ea580c" stopOpacity={0.15}/>
                  <stop offset="95%" stopColor="#ea580c" stopOpacity={0.0}/>
                </linearGradient>
                <linearGradient id="ciArea" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f97316" stopOpacity={0.08}/>
                  <stop offset="95%" stopColor="#f97316" stopOpacity={0.01}/>
                </linearGradient>
              </defs>

              <XAxis
                dataKey="label"
                stroke="rgba(255,255,255,0.08)"
                tick={{ fill: "rgba(255,255,255,0.4)", fontSize: 9 }}
              />
              <YAxis
                domain={["auto", "auto"]}
                stroke="rgba(255,255,255,0.08)"
                tick={{ fill: "rgba(255,255,255,0.4)", fontSize: 10, fontFamily: "monospace" }}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#050505",
                  borderColor: "rgba(255,255,255,0.08)",
                  borderRadius: "16px",
                  fontSize: "12px",
                  fontFamily: "monospace",
                }}
                itemStyle={{ color: "#fff" }}
              />

              <Area type="monotone" dataKey="ciUpper" stroke="none" fill="url(#ciArea)" name="95% CI Upper" />
              <Area type="monotone" dataKey="ciLower" stroke="none" fill="#0a0a0a" name="95% CI Lower" />

              <Line type="monotone" dataKey="ciUpper" stroke="#ea580c" strokeDasharray="3 3" strokeWidth={1} dot={false} opacity={0.3} name="CI Upper Boundary" />
              <Line type="monotone" dataKey="ciLower" stroke="#ea580c" strokeDasharray="3 3" strokeWidth={1} dot={false} opacity={0.3} name="CI Lower Boundary" />

              <Line type="monotone" dataKey="actual" stroke="#ffffff" strokeWidth={2} dot={false} name="Historical Price" />
              <Line type="monotone" dataKey="prediction" stroke="#ea580c" strokeWidth={2.5} strokeDasharray="5 5" dot={{ r: 4, fill: "#ea580c" }} name="Forecast" />

              <ReferenceLine x={data.length > 1 ? data[data.length - 2].label : undefined} stroke="rgba(255,255,255,0.15)" strokeDasharray="3 3" label={{ value: "Forecast Horizon", fill: "rgba(255,255,255,0.4)", fontSize: 9, position: "top" }} />
            </ComposedChart>
          </ResponsiveContainer>
        </div>

        <div className="flex justify-between font-label-sm text-[10px] font-mono tracking-widest text-outline mt-2 border-t border-outline-variant/30 pt-4">
          <span>{prediction.model_type}</span>
          <span>Horizon: +1 Trading Day</span>
        </div>
      </div>
    </motion.div>
  );
}
