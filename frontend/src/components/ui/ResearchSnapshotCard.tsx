import { motion } from "framer-motion";

export default function ResearchSnapshotCard({ data, currency }: { data: any, currency: string }) {
  if (!data) return null;

  return (
    <div className="p-5 rounded-2xl border border-[var(--border)] bg-gradient-to-br from-[var(--surface)] to-transparent shadow-xl backdrop-blur-md">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-xl font-bold tracking-tight">{data.ticker} <span className="text-[10px] text-[var(--foreground)]/40 ml-1">SNAPSHOT</span></h3>
        </div>
        <div className={`px-2 py-0.5 rounded text-[10px] font-bold ${data.pct_change >= 0 ? 'bg-[var(--profit)]/20 text-[var(--profit)]' : 'bg-[var(--loss)]/20 text-[var(--loss)]'}`}>
          {data.pct_change >= 0 ? 'LONG' : 'SHORT'} SIGNAL
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <div className="text-[9px] font-bold uppercase tracking-widest text-[var(--foreground)]/50">Close</div>
          <div className="font-mono text-lg font-bold">{data.latest_close.toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
        </div>
        <div>
          <div className="text-[9px] font-bold uppercase tracking-widest text-[var(--foreground)]/50">Delta</div>
          <div className={`font-mono text-lg font-bold ${data.pct_change >= 0 ? 'text-[var(--profit)]' : 'text-[var(--loss)]'}`}>
            {data.pct_change >= 0 ? '+' : ''}{data.pct_change.toFixed(2)}%
          </div>
        </div>
        <div>
          <div className="text-[9px] font-bold uppercase tracking-widest text-[var(--foreground)]/50">VWAP</div>
          <div className="font-mono text-sm">{data.vwap.toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
        </div>
        <div>
          <div className="text-[9px] font-bold uppercase tracking-widest text-[var(--foreground)]/50">Volatility</div>
          <div className="font-mono text-sm">{data.volatility.toFixed(1)}%</div>
        </div>
      </div>
    </div>
  );
}
