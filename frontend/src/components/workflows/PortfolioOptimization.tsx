"use client";

import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { ScatterChart, Scatter, XAxis, YAxis, ZAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { Sliders, Award, Percent, DollarSign } from "lucide-react";

interface Asset {
  name: string;
  expectedReturn: number;
  volatility: number;
}

const ASSETS: Record<string, Asset> = {
  AAPL: { name: "Apple Inc.", expectedReturn: 16, volatility: 20 },
  MSFT: { name: "Microsoft Corp.", expectedReturn: 14, volatility: 18 },
  NVDA: { name: "NVIDIA Corp.", expectedReturn: 28, volatility: 34 },
};

const CORRELATIONS = {
  AAPL_MSFT: 0.45,
  AAPL_NVDA: 0.35,
  MSFT_NVDA: 0.40,
};

const RISK_FREE_RATE = 4.0; // 4% risk-free rate

export default function PortfolioOptimization() {
  const [weights, setWeights] = useState<Record<string, number>>({
    AAPL: 35,
    MSFT: 35,
    NVDA: 30,
  });

  // Calculate return, volatility, and Sharpe for a given set of weights
  const calculatePortfolio = (wAAPL: number, wMSFT: number, wNVDA: number) => {
    // Convert percentages to fractions
    const w1 = wAAPL / 100;
    const w2 = wMSFT / 100;
    const w3 = wNVDA / 100;

    const r1 = ASSETS.AAPL.expectedReturn;
    const r2 = ASSETS.MSFT.expectedReturn;
    const r3 = ASSETS.NVDA.expectedReturn;

    const s1 = ASSETS.AAPL.volatility;
    const s2 = ASSETS.MSFT.volatility;
    const s3 = ASSETS.NVDA.volatility;

    // Expected Return
    const expectedReturn = w1 * r1 + w2 * r2 + w3 * r3;

    // Expected Volatility (using Covariance formula)
    const cov12 = CORRELATIONS.AAPL_MSFT * s1 * s2;
    const cov13 = CORRELATIONS.AAPL_NVDA * s1 * s3;
    const cov23 = CORRELATIONS.MSFT_NVDA * s2 * s3;

    const variance =
      Math.pow(w1 * s1, 2) +
      Math.pow(w2 * s2, 2) +
      Math.pow(w3 * s3, 2) +
      2 * w1 * w2 * cov12 +
      2 * w1 * w3 * cov13 +
      2 * w2 * w3 * cov23;

    const volatility = Math.sqrt(variance);

    // Sharpe Ratio
    const sharpe = (expectedReturn - RISK_FREE_RATE) / volatility;

    return {
      returnVal: parseFloat(expectedReturn.toFixed(2)),
      volatilityVal: parseFloat(volatility.toFixed(2)),
      sharpeVal: parseFloat(sharpe.toFixed(2)),
    };
  };

  // Generate 250 random portfolios to build the Efficient Frontier scatter plot
  const frontierData = useMemo(() => {
    const points = [];
    for (let i = 0; i < 250; i++) {
      // Generate random weights that sum to 100
      let w1 = Math.random();
      let w2 = Math.random();
      let w3 = Math.random();
      const sum = w1 + w2 + w3;
      w1 = (w1 / sum) * 100;
      w2 = (w2 / sum) * 100;
      w3 = (w3 / sum) * 100;

      const { returnVal, volatilityVal, sharpeVal } = calculatePortfolio(w1, w2, w3);
      points.push({
        x: volatilityVal,
        y: returnVal,
        sharpe: sharpeVal,
        isTarget: false,
      });
    }
    return points;
  }, []);

  // Recalculate target portfolio metrics based on active weights
  const currentPortfolio = useMemo(() => {
    return calculatePortfolio(weights.AAPL, weights.MSFT, weights.NVDA);
  }, [weights]);

  // Combine efficient frontier points with target dot
  const chartData = useMemo(() => {
    return [
      ...frontierData,
      {
        x: currentPortfolio.volatilityVal,
        y: currentPortfolio.returnVal,
        sharpe: currentPortfolio.sharpeVal,
        isTarget: true,
      },
    ];
  }, [frontierData, currentPortfolio]);

  const handleWeightChange = (asset: string, rawVal: number) => {
    const val = Math.max(0, Math.min(100, rawVal));
    setWeights((prev) => {
      const otherAssets = Object.keys(prev).filter((k) => k !== asset);
      const remainingSum = 100 - val;
      const currentOtherSum = prev[otherAssets[0]] + prev[otherAssets[1]];

      let newWeights = { ...prev };
      newWeights[asset] = val;

      if (currentOtherSum > 0) {
        newWeights[otherAssets[0]] = Math.max(0, Math.min(100, parseFloat(((prev[otherAssets[0]] / currentOtherSum) * remainingSum).toFixed(1))));
        newWeights[otherAssets[1]] = Math.max(0, Math.min(100, parseFloat((100 - val - newWeights[otherAssets[0]]).toFixed(1))));
      } else {
        newWeights[otherAssets[0]] = Math.max(0, Math.min(100, parseFloat((remainingSum / 2).toFixed(1))));
        newWeights[otherAssets[1]] = Math.max(0, Math.min(100, parseFloat((100 - val - newWeights[otherAssets[0]]).toFixed(1))));
      }

      return newWeights;
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, ease: "easeOut" }}
      className="w-full flex flex-col gap-6"
    >
      {/* Portfolio Stats Panel */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-5 ventriloc-card rounded-[24px] bg-[#0a0a0a] border border-luxury-glass backdrop-blur-md flex items-center justify-between">
          <div>
            <span className="text-[10px] font-semibold uppercase tracking-widest text-neutral-500">Expected Annual Return</span>
            <div className="text-2xl font-bold font-mono text-white mt-1">{currentPortfolio.returnVal}%</div>
          </div>
          <DollarSign className="w-8 h-8 text-orange-500 opacity-80" />
        </div>

        <div className="p-5 ventriloc-card rounded-[24px] bg-[#0a0a0a] border border-luxury-glass backdrop-blur-md flex items-center justify-between">
          <div>
            <span className="text-[10px] font-semibold uppercase tracking-widest text-neutral-500">Portfolio Volatility</span>
            <div className="text-2xl font-bold font-mono text-white mt-1">{currentPortfolio.volatilityVal}%</div>
          </div>
          <Percent className="w-8 h-8 text-orange-500 opacity-80" />
        </div>

        <div className="p-5 ventriloc-card rounded-[24px] bg-[#0a0a0a] border border-luxury-glass backdrop-blur-md flex items-center justify-between">
          <div>
            <span className="text-[10px] font-semibold uppercase tracking-widest text-neutral-500">Portfolio Sharpe Ratio</span>
            <div className="text-2xl font-bold font-mono text-emerald-400 mt-1">{currentPortfolio.sharpeVal}</div>
          </div>
          <Award className="w-8 h-8 text-emerald-500 opacity-80" />
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Sliders Panel */}
        <div className="lg:w-[320px] shrink-0 ventriloc-card rounded-[24px] bg-[#0a0a0a] border border-luxury-glass p-6 flex flex-col gap-6">
          <div className="flex items-center gap-2">
            <Sliders className="w-4 h-4 text-orange-500" />
            <h3 className="text-xs uppercase font-mono font-bold tracking-widest text-neutral-400">Asset Weights</h3>
          </div>

          <div className="flex flex-col gap-5">
            {Object.keys(ASSETS).map((asset) => (
              <div key={asset} className="flex flex-col gap-2">
                <div className="flex justify-between text-xs font-mono">
                  <span className="text-white font-bold">{asset}</span>
                  <span className="text-neutral-400">{weights[asset]}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  step="0.5"
                  value={weights[asset]}
                  onChange={(e) => handleWeightChange(asset, parseFloat(e.target.value))}
                  className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-orange-500"
                />
                <div className="flex justify-between text-[9px] text-neutral-500 uppercase tracking-widest">
                  <span>Ret: {ASSETS[asset].expectedReturn}%</span>
                  <span>Vol: {ASSETS[asset].volatility}%</span>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-4 pt-4 border-t border-white/5 space-y-2 text-[10px] font-mono text-neutral-500 uppercase tracking-widest">
            <div className="flex justify-between">
              <span>Risk-Free Rate:</span>
              <span>4.0%</span>
            </div>
            <div className="flex justify-between font-bold text-white">
              <span>Total Weight:</span>
              <span>
                {Math.round(Object.values(weights).reduce((a, b) => a + b, 0))}%
              </span>
            </div>
          </div>
        </div>

        {/* Efficient Frontier Scatter Plot */}
        <div className="flex-1 ventriloc-card rounded-[24px] bg-[#0a0a0a] border border-luxury-glass p-6 flex flex-col gap-4">
          <div>
            <h2 className="text-sm font-bold font-display uppercase tracking-widest text-white">Efficient Frontier Frontier Model</h2>
            <p className="text-xs text-neutral-500 uppercase tracking-widest mt-1">Plotting volatility against returns to discover the optimal capital allocation strategy.</p>
          </div>

          <div className="w-full h-[350px]">
            <ResponsiveContainer width="100%" height="100%">
              <ScatterChart margin={{ top: 10, right: 10, bottom: 10, left: -20 }}>
                <XAxis
                  type="number"
                  dataKey="x"
                  name="Volatility"
                  unit="%"
                  stroke="rgba(255,255,255,0.08)"
                  tick={{ fill: "rgba(255,255,255,0.4)", fontSize: 9 }}
                  domain={[15, 36]}
                />
                <YAxis
                  type="number"
                  dataKey="y"
                  name="Return"
                  unit="%"
                  stroke="rgba(255,255,255,0.08)"
                  tick={{ fill: "rgba(255,255,255,0.4)", fontSize: 9 }}
                  domain={[10, 30]}
                />
                <ZAxis type="number" dataKey="sharpe" range={[20, 150]} />
                <Tooltip
                  cursor={{ strokeDasharray: "3 3", stroke: "rgba(255,255,255,0.15)" }}
                  contentStyle={{
                    backgroundColor: "#050505",
                    borderColor: "rgba(255,255,255,0.08)",
                    borderRadius: "16px",
                    fontSize: "12px",
                    fontFamily: "monospace",
                  }}
                  itemStyle={{ color: "#fff" }}
                />
                <Scatter name="Portfolios" data={chartData}>
                  {chartData.map((entry, index) => {
                    const isTarget = entry.isTarget;
                    return (
                      <Cell
                        key={`cell-${index}`}
                        fill={isTarget ? "#ea580c" : "rgba(255,255,255,0.08)"}
                        stroke={isTarget ? "#ffffff" : "none"}
                        strokeWidth={isTarget ? 2 : 0}
                        style={{
                          filter: isTarget ? "drop-shadow(0 0 8px #ea580c)" : "none",
                        }}
                      />
                    );
                  })}
                </Scatter>
              </ScatterChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
