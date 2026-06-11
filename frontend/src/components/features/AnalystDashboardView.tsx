import { motion } from "framer-motion";
import MarketRegimeBadge from "../ui/MarketRegimeBadge";
import ConfidenceMeter from "../ui/ConfidenceMeter";
import InstitutionalRiskMeter from "../ui/InstitutionalRiskMeter";
import MarketPulseWidget from "../ui/MarketPulseWidget";
import QuantResearchScore from "../ui/QuantResearchScore";
import PortfolioHealthWidget from "../ui/PortfolioHealthWidget";
import ResearchSnapshotCard from "../ui/ResearchSnapshotCard";

export default function AnalystDashboardView({ stockData, prediction, currency }: any) {
  if (!stockData) return (
    <div className="w-full h-64 rounded-2xl border border-[var(--border)] bg-[var(--surface)] flex items-center justify-center overflow-hidden relative">
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
        <div className="p-4 rounded-2xl border border-[var(--border)] bg-[var(--surface)]">
          <div className="flex justify-between items-center mb-6">
            <span className="text-[10px] font-bold uppercase tracking-widest text-[var(--foreground)]/50">Market State</span>
            <MarketRegimeBadge pctChange={stockData.pct_change} volatility={stockData.volatility} />
          </div>
          <InstitutionalRiskMeter volatility={stockData.volatility} />
        </div>
      </div>

      {/* Middle Column */}
      <div className="flex flex-col gap-4">
        <QuantResearchScore score={compositeScore} />
        <MarketPulseWidget rsi={stockData.rsi} macd={stockData.macd} />
        <PortfolioHealthWidget ticker={stockData.ticker} pctChange={stockData.pct_change} />
      </div>

      {/* Right Column (AI Insights) */}
      <div className="p-5 rounded-2xl border border-[var(--border)] bg-[var(--surface)] backdrop-blur-sm relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-[var(--accent)] rounded-full blur-[80px] opacity-20 pointer-events-none" />
        <h3 className="text-sm font-bold uppercase tracking-widest mb-6 border-b border-[var(--border)] pb-2">AI Forecasting Engine</h3>
        
        {prediction ? (
          <div className="flex flex-col gap-6 relative z-10">
            <ConfidenceMeter confidence={prediction.confidence} />
            
            <div>
              <div className="text-[10px] font-bold uppercase tracking-widest text-[var(--foreground)]/50 mb-1">Directional Bias</div>
              <div className={`text-2xl font-bold font-mono ${prediction.forecast_direction === "UP" ? 'text-[var(--profit)]' : 'text-[var(--loss)]'}`}>
                {prediction.forecast_direction}
              </div>
            </div>

            <div className="p-3 rounded-lg bg-black/20 border border-[var(--border)] text-xs text-[var(--foreground)]/70 font-mono leading-relaxed">
              Model outputs indicate a {Math.round(prediction.confidence)}% probability of {prediction.forecast_direction} movement over the next 5 periods, conditioned on recent {Number(stockData.volatility).toFixed(1)}% volatility regime.
            </div>
          </div>
        ) : (
          <div className="text-xs text-[var(--foreground)]/40 font-mono">Forecasting engine offline.</div>
        )}
      </div>
    </motion.div>
  );
}
