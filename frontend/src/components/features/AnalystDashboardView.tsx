import { motion } from "framer-motion";
import MarketRegimeBadge from "../ui/MarketRegimeBadge";
import ConfidenceMeter from "../ui/ConfidenceMeter";
import InstitutionalRiskMeter from "../ui/InstitutionalRiskMeter";
import MarketPulseWidget from "../ui/MarketPulseWidget";
import QuantResearchScore from "../ui/QuantResearchScore";
import PortfolioHealthWidget from "../ui/PortfolioHealthWidget";
import ResearchSnapshotCard from "../ui/ResearchSnapshotCard";
import { PredictionResult } from "@/lib/api";

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.1,
    }
  }
};

const staggerItem = {
  hidden: { opacity: 0, y: 30, filter: "blur(4px)" },
  visible: { 
    opacity: 1, 
    y: 0, 
    filter: "blur(0px)",
    transition: { duration: 0.8, ease: [0.16, 1, 0.3, 1] }
  }
};

export default function AnalystDashboardView({ stockData, prediction, allPredictions = [], currency }: any) {
  if (!stockData) return (
    <div className="w-full h-[600px] ventriloc-card flex items-center justify-center">
      <div className="text-[var(--color-slate)] text-sm font-semibold tracking-widest uppercase animate-pulse">Loading data...</div>
    </div>
  );

  const rsiScore = stockData.rsi > 70 ? 20 : (stockData.rsi < 30 ? 80 : 50);
  const vwapScore = stockData.latest_close > stockData.vwap ? 80 : 30;
  const compositeScore = Math.round((rsiScore + vwapScore + (prediction?.confidence || 50)) / 3);

  return (
    <motion.div 
      variants={staggerContainer}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-50px" }}
      className="w-full flex flex-col gap-6 md:gap-8"
    >
      {/* Top Metrics Row */}
      <div className="w-full grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8">
        {/* Left Column */}
        <motion.div variants={staggerItem} className="flex flex-col gap-6 md:gap-8">
          <ResearchSnapshotCard data={stockData} currency={currency} />
          <div className="p-8 ventriloc-card group relative overflow-hidden transition-all duration-500 hover:-translate-y-1">
            <div className="flex justify-between items-center mb-8 relative z-10">
              <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--color-slate)]">Market State</span>
              <MarketRegimeBadge pctChange={stockData.pct_change} volatility={stockData.volatility} />
            </div>
            <div className="relative z-10">
              <InstitutionalRiskMeter volatility={stockData.volatility} />
            </div>
          </div>
        </motion.div>

        {/* Right Column */}
        <motion.div variants={staggerItem} className="flex flex-col gap-6 md:gap-8">
          <QuantResearchScore score={compositeScore} />
          <MarketPulseWidget rsi={stockData.rsi} macd={stockData.macd} />
          <PortfolioHealthWidget ticker={stockData.ticker} pctChange={stockData.pct_change} />
        </motion.div>
      </div>

      {/* Bottom Section (AI Insights) */}
      <motion.div variants={staggerItem} className="p-8 lg:p-10 ventriloc-card relative overflow-hidden group transition-all duration-500 hover:-translate-y-1">
        <h3 className="text-xs font-bold uppercase tracking-[0.2em] mb-8 border-b border-[var(--border)] pb-4 relative z-10 flex items-center justify-between text-[var(--color-carbon)]">
          <span>AI Consensus Engine</span>
          <div className="flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[var(--accent)] opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-[var(--accent)]"></span>
            </span>
            <span className="text-[9px] text-[var(--accent)] font-semibold tracking-widest">LIVE</span>
          </div>
        </h3>
        
        {allPredictions && allPredictions.length > 0 ? (
          <div className="flex flex-col gap-8 relative z-10">
            <ConfidenceMeter confidence={
              allPredictions.reduce((acc: number, p: PredictionResult) => acc + p.confidence, 0) / allPredictions.length
            } />
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-4">
              {allPredictions.map((p: PredictionResult, idx: number) => {
                const isUp = p.delta > 0;
                const direction = isUp ? "UP" : "DOWN";
                const displayModel = p.model_type.split('_').join(' ').replace('CNN BiLSTM Attention', 'CNN-Attn').replace('TimeSeriesTransformer', 'Transf.').replace('AdvancedBiLSTM', 'BiLSTM');
                return (
                  <div key={idx} className="p-4 bg-[var(--color-fog)] rounded-card border border-[var(--border)] flex flex-col items-center text-center justify-center relative overflow-hidden group/model hover:shadow-card-hover hover:bg-white transition-all duration-500">
                    <div className="text-[10px] uppercase tracking-widest text-[var(--color-slate)] mb-2 w-full truncate px-1 font-semibold" title={p.model_type}>{displayModel}</div>
                    <div className={`text-xl md:text-2xl font-bold font-mono ${isUp ? 'text-[var(--profit)]' : 'text-[var(--loss)]'}`}>
                      {direction}
                    </div>
                    <div className="text-[11px] text-[var(--color-graphite)] mt-2 font-medium">{Math.round(p.confidence)}% Conf.</div>
                  </div>
                );
              })}
            </div>

            <div className="p-6 rounded-card bg-[var(--color-fog)] border border-[var(--border)] text-[11px] text-[var(--color-graphite)] font-mono leading-loose mt-4">
              Real-time multi-model consensus indicates a <strong className="text-[var(--color-carbon)]">{Math.round(allPredictions.reduce((acc: number, p: PredictionResult) => acc + p.confidence, 0) / allPredictions.length)}%</strong> aggregated probability of <strong className={allPredictions.filter((p: PredictionResult) => p.delta > 0).length > allPredictions.length / 2 ? "text-[var(--profit)]" : "text-[var(--loss)]"}>{allPredictions.filter((p: PredictionResult) => p.delta > 0).length > allPredictions.length / 2 ? "UP" : "DOWN"}</strong> movement over the next 5 periods across {allPredictions.length} models, conditioned on {Number(stockData.volatility).toFixed(1)}% volatility regime.
            </div>
          </div>
        ) : prediction ? (
          <div className="flex flex-col gap-8 relative z-10">
            <ConfidenceMeter confidence={prediction.confidence} />
            
            <div className="mt-4">
              <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--color-slate)] mb-2">Directional Bias</div>
              <div className={`text-4xl font-bold font-mono ${prediction.delta > 0 ? 'text-[var(--profit)]' : 'text-[var(--loss)]'}`}>
                {prediction.delta > 0 ? "UP" : "DOWN"}
              </div>
            </div>

            <div className="p-6 rounded-card bg-[var(--color-fog)] border border-[var(--border)] text-[11px] text-[var(--color-graphite)] font-mono leading-loose mt-4">
              Model outputs indicate a <strong className="text-[var(--color-carbon)]">{Math.round(prediction.confidence)}%</strong> probability of <strong className={prediction.delta > 0 ? "text-[var(--profit)]" : "text-[var(--loss)]"}>{prediction.delta > 0 ? "UP" : "DOWN"}</strong> movement over the next 5 periods, conditioned on recent {Number(stockData.volatility).toFixed(1)}% volatility regime.
            </div>
          </div>
        ) : (
          <div className="text-xs text-[var(--color-slate)] font-mono relative z-10">Forecasting engine offline.</div>
        )}
      </motion.div>
    </motion.div>
  );
}
