"use client";

import { useState, useMemo, useEffect } from "react";
import { motion } from "framer-motion";
import { ScatterChart, Scatter, XAxis, YAxis, ZAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { Sliders, Award, Percent, DollarSign } from "lucide-react";

interface Asset {
  name: string;
  expectedReturn: number;
  volatility: number;
}

interface PortfolioProps {
  tickers?: string[];
}

const RISK_FREE_RATE = 4.0; // 4% risk-free rate

// Helper to generate a deterministic pseudo-random number from a string
const pseudoRandom = (seed: string) => {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = Math.imul(31, hash) + seed.charCodeAt(i) | 0;
  }
  return (Math.abs(hash) % 1000) / 1000;
};

export default function PortfolioOptimization({ tickers = [] }: PortfolioProps) {
  // Use top 5 tickers, fallback if none provided
  const activeTickers = useMemo(() => {
    const list = tickers.length > 0 ? tickers : ["AAPL", "MSFT", "NVDA", "AMZN", "META"];
    return list.slice(0, 5);
  }, [tickers]);

  // Dynamically generate ASSETS based on activeTickers
  const ASSETS = useMemo(() => {
    const assets: Record<string, Asset> = {};
    activeTickers.forEach(ticker => {
      // Return between 8% and 35%
      const expRet = 8 + pseudoRandom(ticker + "ret") * 27;
      // Volatility between 10% and 45%
      const vol = 10 + pseudoRandom(ticker + "vol") * 35;
      assets[ticker] = {
        name: ticker,
        expectedReturn: parseFloat(expRet.toFixed(1)),
        volatility: parseFloat(vol.toFixed(1))
      };
    });
    return assets;
  }, [activeTickers]);

  // Dynamically generate correlation matrix
  const CORRELATIONS = useMemo(() => {
    const corrs: Record<string, number> = {};
    for (let i = 0; i < activeTickers.length; i++) {
      for (let j = i + 1; j < activeTickers.length; j++) {
        const t1 = activeTickers[i];
        const t2 = activeTickers[j];
        // Correlation between 0.1 and 0.7
        const corr = 0.1 + pseudoRandom(t1 + t2 + "corr") * 0.6;
        corrs[`${t1}_${t2}`] = corr;
        corrs[`${t2}_${t1}`] = corr;
      }
    }
    return corrs;
  }, [activeTickers]);

  const [weights, setWeights] = useState<Record<string, number>>({});

  // Initialize even weights when activeTickers change
  useEffect(() => {
    const initial: Record<string, number> = {};
    const evenWeight = 100 / activeTickers.length;
    activeTickers.forEach(t => initial[t] = parseFloat(evenWeight.toFixed(1)));
    
    // Fix slight rounding errors so it sums to exactly 100
    const sum = Object.values(initial).reduce((a, b) => a + b, 0);
    if (sum !== 100 && activeTickers.length > 0) {
      initial[activeTickers[0]] += (100 - sum);
    }
    setWeights(initial);
  }, [activeTickers]);

  // Calculate return, volatility, and Sharpe for a given set of weights
  const calculatePortfolio = (wts: Record<string, number>) => {
    let expectedReturn = 0;
    
    // Calculate Return
    activeTickers.forEach(t => {
      expectedReturn += (wts[t] / 100) * ASSETS[t].expectedReturn;
    });

    // Calculate Variance (w1^2*s1^2 + 2*w1*w2*cov12...)
    let variance = 0;
    for (let i = 0; i < activeTickers.length; i++) {
      for (let j = 0; j < activeTickers.length; j++) {
        const t1 = activeTickers[i];
        const t2 = activeTickers[j];
        const w1 = wts[t1] / 100;
        const w2 = wts[t2] / 100;
        const s1 = ASSETS[t1].volatility;
        const s2 = ASSETS[t2].volatility;
        
        let cov = 0;
        if (i === j) {
          cov = s1 * s1;
        } else {
          const corr = CORRELATIONS[`${t1}_${t2}`];
          cov = corr * s1 * s2;
        }
        
        variance += w1 * w2 * cov;
      }
    }

    const volatility = Math.sqrt(variance);
    const sharpe = (expectedReturn - RISK_FREE_RATE) / volatility;

    return {
      returnVal: parseFloat(expectedReturn.toFixed(2)),
      volatilityVal: parseFloat(volatility.toFixed(2)),
      sharpeVal: parseFloat(sharpe.toFixed(2)),
    };
  };

  // Generate 250 random portfolios to build the Efficient Frontier scatter plot
  const frontierData = useMemo(() => {
    if (Object.keys(ASSETS).length === 0) return [];
    
    const points = [];
    for (let i = 0; i < 250; i++) {
      // Generate random weights that sum to 100
      let wts: Record<string, number> = {};
      let sum = 0;
      activeTickers.forEach(t => {
        const r = Math.random();
        wts[t] = r;
        sum += r;
      });
      
      activeTickers.forEach(t => {
        wts[t] = (wts[t] / sum) * 100;
      });

      const { returnVal, volatilityVal, sharpeVal } = calculatePortfolio(wts);
      points.push({
        x: volatilityVal,
        y: returnVal,
        sharpe: sharpeVal,
        isTarget: false,
      });
    }
    return points;
  }, [activeTickers, ASSETS, CORRELATIONS]);

  // Recalculate target portfolio metrics based on active weights
  const currentPortfolio = useMemo(() => {
    if (Object.keys(weights).length === 0) return { returnVal: 0, volatilityVal: 0, sharpeVal: 0 };
    return calculatePortfolio(weights);
  }, [weights, ASSETS, CORRELATIONS]);

  // Combine efficient frontier points with target dot
  const chartData = useMemo(() => {
    if (Object.keys(weights).length === 0) return [];
    
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

  // Domains for axes
  const minVol = Math.min(...chartData.map(d => d.x)) * 0.9;
  const maxVol = Math.max(...chartData.map(d => d.x)) * 1.1;
  const minRet = Math.min(...chartData.map(d => d.y)) * 0.9;
  const maxRet = Math.max(...chartData.map(d => d.y)) * 1.1;

  const handleWeightChange = (asset: string, rawVal: number) => {
    const val = Math.max(0, Math.min(100, rawVal));
    setWeights((prev) => {
      const otherAssets = Object.keys(prev).filter((k) => k !== asset);
      const remainingSum = 100 - val;
      const currentOtherSum = otherAssets.reduce((sum, k) => sum + prev[k], 0);

      let newWeights = { ...prev };
      newWeights[asset] = val;

      if (currentOtherSum > 0) {
        otherAssets.forEach(k => {
          newWeights[k] = (prev[k] / currentOtherSum) * remainingSum;
        });
      } else {
        const evenDist = remainingSum / otherAssets.length;
        otherAssets.forEach(k => {
          newWeights[k] = evenDist;
        });
      }

      // Round to 1 decimal place and fix potential floating point drift
      otherAssets.forEach(k => {
        newWeights[k] = parseFloat(newWeights[k].toFixed(1));
      });
      
      const newTotal = Object.values(newWeights).reduce((a, b) => a + b, 0);
      if (newTotal !== 100 && otherAssets.length > 0) {
         newWeights[otherAssets[0]] += (100 - newTotal);
         newWeights[otherAssets[0]] = parseFloat(newWeights[otherAssets[0]].toFixed(1));
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
        <div className="lg:w-[320px] shrink-0 rounded border border-outline-variant/30 bg-[#08080a] p-stack-md flex flex-col gap-stack-sm">
          <div className="flex items-center gap-2">
            <Sliders className="w-4 h-4 text-secondary" />
            <h3 className="font-label-sm text-[11px] uppercase font-mono font-bold tracking-widest text-outline">Asset Weights</h3>
          </div>

          <div className="flex flex-col gap-5">
            {Object.keys(weights).length > 0 && Object.keys(ASSETS).map((asset) => (
              <div key={asset} className="flex flex-col gap-2">
                <div className="flex justify-between text-xs font-mono">
                  <span className="text-on-surface font-bold">{asset}</span>
                  <span className="text-on-surface-variant">{weights[asset]}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  step="0.5"
                  value={weights[asset]}
                  onChange={(e) => handleWeightChange(asset, parseFloat(e.target.value))}
                  className="w-full h-1 bg-outline-variant/30 rounded appearance-none cursor-pointer accent-secondary"
                />
                <div className="flex justify-between font-label-sm text-[9px] text-outline uppercase tracking-widest">
                  <span>Ret: {ASSETS[asset].expectedReturn}%</span>
                  <span>Vol: {ASSETS[asset].volatility}%</span>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-4 pt-4 border-t border-outline-variant/30 space-y-2 font-label-sm text-[10px] font-mono text-outline uppercase tracking-widest">
            <div className="flex justify-between">
              <span>Risk-Free Rate:</span>
              <span>4.0%</span>
            </div>
            <div className="flex justify-between font-bold text-on-surface">
              <span>Total Weight:</span>
              <span>
                {Math.round(Object.values(weights).reduce((a, b) => a + b, 0))}%
              </span>
            </div>
          </div>
        </div>

        {/* Efficient Frontier Scatter Plot */}
        <div className="flex-1 rounded border border-outline-variant/30 bg-[#08080a] p-stack-md flex flex-col gap-stack-sm">
          <div>
            <h2 className="font-display-md text-[14px] font-bold uppercase tracking-widest text-on-surface">Efficient Frontier Frontier Model</h2>
            <p className="font-label-sm text-[11px] text-outline uppercase tracking-widest mt-1">Plotting volatility against returns to discover the optimal capital allocation strategy.</p>
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
                  domain={[minVol, maxVol]}
                />
                <YAxis
                  type="number"
                  dataKey="y"
                  name="Return"
                  unit="%"
                  stroke="rgba(255,255,255,0.08)"
                  tick={{ fill: "rgba(255,255,255,0.4)", fontSize: 9 }}
                  domain={[minRet, maxRet]}
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
