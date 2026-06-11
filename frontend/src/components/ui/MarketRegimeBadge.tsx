import { motion } from "framer-motion";

export default function MarketRegimeBadge({ pctChange, volatility }: { pctChange: number; volatility: number }) {
  let regime = "Sideways";
  let color = "bg-gray-500/20 text-gray-400 border-gray-500/30";
  let glow = "shadow-gray-500/20";

  if (volatility > 25) {
    regime = "High Volatility";
    color = "bg-purple-500/20 text-purple-400 border-purple-500/30";
    glow = "shadow-[0_0_15px_rgba(168,85,247,0.4)]";
  } else if (pctChange > 1.5) {
    regime = "Bull Market";
    color = "bg-[var(--profit)]/20 text-[var(--profit)] border-[var(--profit)]/30";
    glow = "shadow-[0_0_15px_var(--profit)]";
  } else if (pctChange < -1.5) {
    regime = "Bear Market";
    color = "bg-[var(--loss)]/20 text-[var(--loss)] border-[var(--loss)]/30";
    glow = "shadow-[0_0_15px_var(--loss)]";
  }

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className={`inline-flex items-center px-3 py-1 rounded-full border text-[10px] font-bold uppercase tracking-widest ${color} ${glow}`}
    >
      <span className="w-1.5 h-1.5 rounded-full bg-current mr-2 animate-pulse" />
      {regime}
    </motion.div>
  );
}
