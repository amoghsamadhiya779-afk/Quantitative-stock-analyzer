"use client";

import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, Line, ComposedChart, ReferenceLine } from "recharts";
import { Cpu, Server, TrendingUp } from "lucide-react";

interface DataPoint {
  index: number;
  label: string;
  actual?: number;
  prediction?: number;
  ciLower?: number;
  ciUpper?: number;
}

const MODELS = {
  "Quantum CNN-Attention": {
    name: "Quantum CNN-Attention Engine",
    rmse: 0.84,
    direction: "87.4%",
    latency: "14ms",
    predMultiplier: 1.05,
    ciWidth: 3.5,
  },
  "Temporal Transformer": {
    name: "Temporal Time-Series Transformer",
    rmse: 0.92,
    direction: "84.2%",
    latency: "28ms",
    predMultiplier: 0.96,
    ciWidth: 5.8,
  },
  "Deep BiLSTM": {
    name: "Multi-layer LSTM Neural Network",
    rmse: 1.15,
    direction: "79.8%",
    latency: "9ms",
    predMultiplier: 1.01,
    ciWidth: 7.2,
  },
};

export default function MLPrediction() {
  const [selectedModel, setSelectedModel] = useState<keyof typeof MODELS>("Quantum CNN-Attention");
  const modelInfo = MODELS[selectedModel];

  const data: DataPoint[] = useMemo(() => {
    const list: DataPoint[] = [];
    let price = 180.0;
    
    // Historical data (30 days)
    for (let i = 0; i < 30; i++) {
      const change = (Math.sin(i / 3) + (Math.random() - 0.45)) * 1.5;
      price += change;
      list.push({
        index: i,
        label: `T - ${30 - i}d`,
        actual: parseFloat(price.toFixed(2)),
      });
    }

    // Future predictions (10 days)
    let predPrice = price;
    const mult = modelInfo.predMultiplier;
    const ci = modelInfo.ciWidth;

    for (let i = 1; i <= 10; i++) {
      const baseTrend = (i / 3) * (mult > 1 ? 1.2 : -0.8);
      const prediction = predPrice + baseTrend + (Math.sin(i / 1.5) * 1.0);
      const ciLower = prediction - (i * 0.4 + ci);
      const ciUpper = prediction + (i * 0.4 + ci);

      list.push({
        index: 29 + i,
        label: `T + ${i}d`,
        prediction: parseFloat(prediction.toFixed(2)),
        ciLower: parseFloat(ciLower.toFixed(2)),
        ciUpper: parseFloat(ciUpper.toFixed(2)),
      });
    }

    return list;
  }, [selectedModel]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, ease: "easeOut" }}
      className="w-full flex flex-col gap-6"
    >
      {/* Model Selection and Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        {/* Model swapper */}
        <div className="ventriloc-card rounded-[24px] bg-[#0a0a0a] border border-luxury-glass p-5 flex flex-col gap-3 lg:col-span-1">
          <span className="text-[10px] font-semibold uppercase tracking-widest text-neutral-500">AI Architectures</span>
          <div className="flex flex-col gap-2">
            {(Object.keys(MODELS) as Array<keyof typeof MODELS>).map((key) => (
              <button
                key={key}
                onClick={() => setSelectedModel(key)}
                className={`w-full text-left p-3 rounded-[16px] border text-xs uppercase tracking-wider transition-all duration-200 ${
                  selectedModel === key
                    ? "border-orange-500/30 bg-orange-500/10 text-white font-bold"
                    : "border-white/5 bg-white/5 text-neutral-400 hover:border-white/10 hover:bg-white/10"
                }`}
              >
                {key}
              </button>
            ))}
          </div>
        </div>

        {/* Stats Grid */}
        <div className="lg:col-span-3 grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-5 ventriloc-card rounded-[24px] bg-[#0a0a0a] border border-luxury-glass backdrop-blur-md flex items-center justify-between">
            <div>
              <span className="text-[10px] font-semibold uppercase tracking-widest text-neutral-500">Directional Accuracy</span>
              <div className="text-2xl font-bold font-mono text-emerald-400 mt-1">{modelInfo.direction}</div>
            </div>
            <TrendingUp className="w-8 h-8 text-emerald-500 opacity-80" />
          </div>

          <div className="p-5 ventriloc-card rounded-[24px] bg-[#0a0a0a] border border-luxury-glass backdrop-blur-md flex items-center justify-between">
            <div>
              <span className="text-[10px] font-semibold uppercase tracking-widest text-neutral-500">Prediction RMSE</span>
              <div className="text-2xl font-bold font-mono text-white mt-1">{modelInfo.rmse} <span className="text-xs text-neutral-500">USD</span></div>
            </div>
            <Server className="w-8 h-8 text-orange-500 opacity-80" />
          </div>

          <div className="p-5 ventriloc-card rounded-[24px] bg-[#0a0a0a] border border-luxury-glass backdrop-blur-md flex items-center justify-between">
            <div>
              <span className="text-[10px] font-semibold uppercase tracking-widest text-neutral-500">inference latency</span>
              <div className="text-2xl font-bold font-mono text-white mt-1">{modelInfo.latency}</div>
            </div>
            <Cpu className="w-8 h-8 text-orange-500 opacity-80" />
          </div>
        </div>
      </div>

      {/* Main Chart Panel */}
      <div className="ventriloc-card rounded-[24px] bg-[#0a0a0a] border border-luxury-glass p-6 flex flex-col gap-4">
        <div>
          <h2 className="text-sm font-bold font-display uppercase tracking-widest text-white">95% Confidence Interval Forecast</h2>
          <p className="text-xs text-neutral-500 uppercase tracking-widest mt-1">Overlaying historical price data against neural network confidence predictions.</p>
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

              {/* Confidence Interval Shaded Area */}
              <Area
                type="monotone"
                dataKey="ciUpper"
                stroke="none"
                fill="url(#ciArea)"
                name="95% CI Upper"
              />
              <Area
                type="monotone"
                dataKey="ciLower"
                stroke="none"
                fill="#0a0a0a" // Masks the bottom area below CI
                name="95% CI Lower"
              />

              {/* CI Boundary Lines */}
              <Line
                type="monotone"
                dataKey="ciUpper"
                stroke="#ea580c"
                strokeDasharray="3 3"
                strokeWidth={1}
                dot={false}
                opacity={0.3}
                name="CI Upper Boundary"
              />
              <Line
                type="monotone"
                dataKey="ciLower"
                stroke="#ea580c"
                strokeDasharray="3 3"
                strokeWidth={1}
                dot={false}
                opacity={0.3}
                name="CI Lower Boundary"
              />

              {/* Historical Price */}
              <Line
                type="monotone"
                dataKey="actual"
                stroke="#ffffff"
                strokeWidth={2}
                dot={false}
                name="Historical Price"
              />

              {/* ML Prediction Path */}
              <Line
                type="monotone"
                dataKey="prediction"
                stroke="#ea580c"
                strokeWidth={2.5}
                strokeDasharray="5 5"
                dot={{ r: 3, fill: "#ea580c" }}
                name="Prediction Path"
              />

              {/* Reference line separating history & prediction */}
              <ReferenceLine x="T - 1d" stroke="rgba(255,255,255,0.15)" strokeDasharray="3 3" label={{ value: "Forecast Horizon", fill: "rgba(255,255,255,0.4)", fontSize: 9, position: "top" }} />
            </ComposedChart>
          </ResponsiveContainer>
        </div>

        <div className="flex justify-between text-[10px] font-mono tracking-widest text-neutral-500 mt-2 border-t border-white/5 pt-4">
          <span>Active Model: {modelInfo.name}</span>
          <span>Horizon: +10 Trading Days</span>
        </div>
      </div>
    </motion.div>
  );
}
