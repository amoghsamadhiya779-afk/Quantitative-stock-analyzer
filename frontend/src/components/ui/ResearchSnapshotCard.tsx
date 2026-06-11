import { motion } from "framer-motion";
import { useCursor } from "../providers/CursorProvider";

export default function ResearchSnapshotCard({ data, currency }: any) {
  const { setCursorType } = useCursor();

  if (!data) return null;

  return (
    <div 
      className="p-5 glass-card relative overflow-hidden group"
      onMouseEnter={() => setCursorType("hover-card")}
      onMouseLeave={() => setCursorType("default")}
    >
      <div className="absolute top-0 right-0 w-32 h-32 bg-[var(--accent)] rounded-full blur-[60px] opacity-10 group-hover:opacity-20 transition-opacity pointer-events-none" />
      
      <div className="flex justify-between items-center mb-6 relative z-10">
        <h3 className="text-sm font-bold uppercase tracking-widest text-[var(--foreground)]">Valuation Overview</h3>
        <span className="text-[10px] font-mono bg-[var(--foreground)]/10 px-2 py-1 rounded text-[var(--foreground)]/60">LIVE</span>
      </div>

      <div className="grid grid-cols-2 gap-4 relative z-10" onMouseEnter={(e) => { e.stopPropagation(); setCursorType("hover-data"); }} onMouseLeave={(e) => { e.stopPropagation(); setCursorType("hover-card"); }}>
        <div>
          <div className="text-[9px] font-bold uppercase tracking-widest text-[var(--foreground)]/50">Current Price</div>
          <div className="font-mono text-xl font-bold">{data.latest_close.toLocaleString(undefined, { minimumFractionDigits: 2 })} <span className="text-xs text-[var(--foreground)]/40">{currency}</span></div>
        </div>
        <div>
          <div className="text-[9px] font-bold uppercase tracking-widest text-[var(--foreground)]/50">Delta</div>
          <div className={`font-mono text-lg font-bold ${data.pct_change >= 0 ? 'text-[var(--profit)]' : 'text-[var(--loss)]'}`}>
            {data.pct_change >= 0 ? '+' : ''}{Number(data.pct_change).toFixed(2)}%
          </div>
        </div>
        <div>
          <div className="text-[9px] font-bold uppercase tracking-widest text-[var(--foreground)]/50">VWAP (20d)</div>
          <div className="font-mono text-sm">{data.vwap.toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
        </div>
        <div>
          <div className="text-[9px] font-bold uppercase tracking-widest text-[var(--foreground)]/50">Volatility</div>
          <div className="font-mono text-sm">{Number(data.volatility).toFixed(1)}%</div>
        </div>
      </div>
    </div>
  );
}
