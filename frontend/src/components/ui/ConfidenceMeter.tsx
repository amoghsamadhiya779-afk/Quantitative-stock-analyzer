import { motion } from "framer-motion";

export default function ConfidenceMeter({ confidence = 0.5 }: { confidence?: number }) {
  // confidence between 0 and 1
  const pct = Math.round(confidence);
  const isHigh = pct >= 70;
  const color = isHigh ? "var(--profit)" : (pct < 40 ? "var(--loss)" : "var(--accent)");

  return (
    <div className="flex flex-col gap-1 w-full max-w-[200px]">
      <div className="flex justify-between items-center text-[10px] font-bold uppercase text-[var(--foreground)]/60">
        <span>AI Confidence</span>
        <span style={{ color }}>{pct}%</span>
      </div>
      <div className="h-1.5 w-full bg-[var(--surface)] rounded-full overflow-hidden border border-[var(--border)]">
        <motion.div 
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 1.5, ease: "circOut" }}
          className="h-full rounded-full"
          style={{ backgroundColor: color, boxShadow: `0 0 10px ${color}` }}
        />
      </div>
    </div>
  );
}
