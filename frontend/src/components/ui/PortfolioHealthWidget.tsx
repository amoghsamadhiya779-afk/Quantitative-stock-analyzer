import { motion } from "framer-motion";
import { useCursor } from "../providers/CursorProvider";

export default function PortfolioHealthWidget({ ticker, pctChange }: { ticker: string, pctChange: number }) {
  const { setCursorType } = useCursor();
  // Mock impact on portfolio
  const impact = Number(pctChange * 0.15).toFixed(2); // assuming 15% weight
  const isPositive = pctChange >= 0;

  return (
    <div 
      className="p-5 glass-card relative overflow-hidden group transition-all"
      onMouseEnter={() => setCursorType("hover-card")}
      onMouseLeave={() => setCursorType("default")}
    >
      <div className="absolute top-0 right-0 w-32 h-32 bg-[var(--accent)] rounded-full blur-[60px] opacity-10 group-hover:opacity-20 transition-opacity pointer-events-none" />
      <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-[var(--accent)] to-[var(--accent-secondary)]" />
      <div className="text-[9px] font-bold uppercase tracking-widest text-[var(--foreground)]/50 mb-3 pl-2 relative z-10">Portfolio Impact</div>
      
      <div className="pl-2">
        <div className="flex items-center justify-between mb-1">
          <span className="font-mono text-sm font-bold">{ticker} Weight</span>
          <span className="font-mono text-sm">15.0%</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-[10px] text-[var(--foreground)]/60">Estimated Alpha</span>
          <motion.span 
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            className={`font-mono font-bold ${isPositive ? 'text-[var(--profit)]' : 'text-[var(--loss)]'}`}
          >
            {isPositive ? "+" : ""}{impact}%
          </motion.span>
        </div>
      </div>
    </div>
  );
}
