import { motion } from "framer-motion";
import MarketRegimeBadge from "../ui/MarketRegimeBadge";
import ConfidenceMeter from "../ui/ConfidenceMeter";
import InstitutionalRiskMeter from "../ui/InstitutionalRiskMeter";
import MarketPulseWidget from "../ui/MarketPulseWidget";
import QuantResearchScore from "../ui/QuantResearchScore";
import PortfolioHealthWidget from "../ui/PortfolioHealthWidget";
import ResearchSnapshotCard from "../ui/ResearchSnapshotCard";
import { useCursor } from "../providers/CursorProvider";
import { PredictionResult } from "@/lib/api";

export default function AnalystDashboardView({ stockData, prediction, allPredictions = [], currency }: any) {
  const { setCursorType } = useCursor();

  if (!stockData) return (
    <div className="w-full h-64 glass-card flex items-center justify-center overflow-hidden relative">
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full animate-[shimmer_1.5s_infinite]" />
    </div>
  );

  // Derive composite score
  const rsiScore = stockData.rsi > 70 ? 20 : (stockData.rsi < 30 ? 80 : 50);
  const vwapScore = stockData.latest_close > stockData.vwap ? 80 : 30;
  const compositeScore = Math.round((rsiScore + vwapScore + (prediction?.confidence || 50)) / 3);

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full grid grid-cols-1 lg:grid-cols-3 gap-4"
    >
      {/* Left Column */}
      <div className="flex flex-col gap-4">
        <ResearchSnapshotCard data={stockData} currency={currency} />
        <div 
          className="p-5 glass-card group relative overflow-hidden"
          onMouseEnter={() => setCursorType("hover-card")}
          onMouseLeave={() => setCursorType("default")}
        >
          <div className="flex justify-between items-center mb-6 relative z-10">
            <span className="text-[10px] font-bold uppercase tracking-widest text-[var(--foreground)]/50">Market State</span>
            <MarketRegimeBadge pctChange={stockData.pct_change} volatility={stockData.volatility} />
          </div>
          <div className="relative z-10">
            <InstitutionalRiskMeter volatility={stockData.volatility} />
          </div>
        </div>
      </div>

      {/* Middle Column */}
      <div className="flex flex-col gap-4">
        <QuantResearchScore score={compositeScore} />
        <MarketPulseWidget rsi={stockData.rsi} macd={stockData.macd} />
        <PortfolioHealthWidget ticker={stockData.ticker} pctChange={stockData.pct_change} />
      </div>

      {/* Right Column (AI Insights) */}
      <div 
        className="p-5 glass-card relative overflow-hidden group"
        onMouseEnter={() => setCursorType("hover-card")}
        onMouseLeave={() => setCursorType("default")}
      >
        <div className="absolute top-0 right-0 w-32 h-32 bg-[var(--accent)] rounded-full blur-[80px] opacity-10 group-hover:opacity-20 transition-opacity pointer-events-none" />
        <h3 className="text-sm font-bold uppercase tracking-widest mb-6 border-b border-[var(--border)] pb-2 relative z-10 flex items-center justify-between">
          <span>AI Multi-Model Consensus Engine</span>
          <div className="flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[var(--profit)] opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-[var(--profit)]"></span>
            </span>
            <span className="text-[9px] text-[var(--profit)]">LIVE</span>
          </div>
        </h3>
        
        {allPredictions && allPredictions.length > 0 ? (
          <div className="flex flex-col gap-6 relative z-10">
            {/* Aggregate Confidence */}
            <ConfidenceMeter confidence={
              allPredictions.reduce((acc: number, p: PredictionResult) => acc + p.confidence, 0) / allPredictions.length
            } />
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2 mt-2">
              {allPredictions.map((p: PredictionResult, idx: number) => {
                const isUp = p.forecast_direction === "UP";
                const displayModel = p.model_type.split('_').join(' ').replace('CNN BiLSTM Attention', 'CNN-Attn Engine').replace('TimeSeriesTransformer', 'Temporal Transf.').replace('AdvancedBiLSTM', 'BiLSTM Layer');
                return (
                  <div key={idx} className="p-3 bg-black/20 rounded-lg border border-[var(--border)] flex flex-col items-center text-center justify-center relative overflow-hidden group/model">
                    <div className="absolute inset-0 bg-gradient-to-b from-white/5 to-transparent opacity-0 group-hover/model:opacity-100 transition-opacity" />
                    <div className="text-[9px] uppercase tracking-widest text-[var(--foreground)]/50 mb-1 w-full truncate px-1" title={p.model_type}>{displayModel}</div>
                    <div className={`text-xl font-bold font-mono ${isUp ? 'text-[var(--profit)]' : 'text-[var(--loss)]'}`}>
                      {p.forecast_direction}
                    </div>
                    <div className="text-[10px] text-[var(--foreground)]/60 mt-1">{Math.round(p.confidence)}% Conf.</div>
                  </div>
                );
              })}
            </div>

            <div className="p-4 rounded-xl bg-black/10 border border-[var(--border)] text-xs text-[var(--foreground)]/80 font-mono leading-relaxed backdrop-blur-md">
              Real-time multi-model consensus indicates a {Math.round(allPredictions.reduce((acc: number, p: PredictionResult) => acc + p.confidence, 0) / allPredictions.length)}% aggregated probability of {allPredictions.filter((p: PredictionResult) => p.forecast_direction === "UP").length > allPredictions.length / 2 ? "UP" : "DOWN"} movement over the next 5 periods across {allPredictions.length} models, conditioned on {Number(stockData.volatility).toFixed(1)}% volatility regime.
            </div>
          </div>
        ) : prediction ? (
          <div className="flex flex-col gap-6 relative z-10">
            <ConfidenceMeter confidence={prediction.confidence} />
            
            <div onMouseEnter={(e) => { e.stopPropagation(); setCursorType("hover-data"); }} onMouseLeave={(e) => { e.stopPropagation(); setCursorType("hover-card"); }}>
              <div className="text-[10px] font-bold uppercase tracking-widest text-[var(--foreground)]/50 mb-1">Directional Bias</div>
              <div className={`text-2xl font-bold font-mono ${prediction.forecast_direction === "UP" ? 'text-[var(--profit)]' : 'text-[var(--loss)]'}`}>
                {prediction.forecast_direction}
              </div>
            </div>

            <div className="p-4 rounded-xl bg-black/10 border border-[var(--border)] text-xs text-[var(--foreground)]/80 font-mono leading-relaxed backdrop-blur-md">
              Model outputs indicate a {Math.round(prediction.confidence)}% probability of {prediction.forecast_direction} movement over the next 5 periods, conditioned on recent {Number(stockData.volatility).toFixed(1)}% volatility regime.
            </div>
          </div>
        ) : (
          <div className="text-xs text-[var(--foreground)]/40 font-mono relative z-10">Forecasting engine offline.</div>
        )}
      </div>
    </motion.div>
  );
}
