import { motion } from "framer-motion";

export default function MarketPulseWidget({ rsi = 50, macd = 0 }: { rsi?: number, macd?: number }) {
  // A dual gauge or pulse representation
  const isOverbought = rsi > 70;
  const isOversold = rsi < 30;
  
  let pulseColor = "var(--accent)";
  if (isOverbought) pulseColor = "var(--loss)";
  else if (isOversold) pulseColor = "var(--profit)";

  return (
    <div className="relative p-5 glass-card overflow-hidden group">
      <div className="absolute top-0 right-0 w-32 h-32 bg-[var(--accent)] rounded-full blur-[60px] opacity-10 group-hover:opacity-20 transition-opacity pointer-events-none" />
      <div className="text-[9px] font-bold uppercase tracking-widest text-[var(--foreground)]/50 mb-3 relative z-10">Market Pulse (RSI / MACD)</div>
      
      <div className="flex items-end justify-between relative z-10">
        <div>
          <div className="text-2xl font-mono font-bold" style={{ color: pulseColor }}>{Number(rsi).toFixed(1)}</div>
          <div className="text-[10px] font-mono text-[var(--foreground)]/40 mt-1">MACD: {macd > 0 ? "+" : ""}{Number(macd).toFixed(3)}</div>
        </div>
        
        {/* Animated Pulse Line */}
        <div className="h-10 w-24 flex items-center justify-center relative">
          <svg viewBox="0 0 100 40" className="w-full h-full overflow-visible">
            <motion.path
              d="M0 20 L20 20 L30 5 L40 35 L50 20 L70 20 L80 10 L90 20 L100 20"
              fill="none"
              stroke={pulseColor}
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              initial={{ pathLength: 0, opacity: 0 }}
              animate={{ pathLength: 1, opacity: 1 }}
              transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
              style={{ filter: `drop-shadow(0 0 4px ${pulseColor})` }}
            />
          </svg>
        </div>
      </div>
    </div>
  );
}
