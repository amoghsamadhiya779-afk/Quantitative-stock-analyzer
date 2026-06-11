import { motion } from "framer-motion";

export default function QuantResearchScore({ score = 75 }: { score?: number }) {
  // SVG Donut chart for score
  const radius = 30;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (score / 100) * circumference;

  let color = "var(--accent)";
  if (score >= 80) color = "var(--profit)";
  if (score < 40) color = "var(--loss)";

  return (
    <div className="flex items-center gap-4 p-4 rounded-xl border border-[var(--border)] bg-[var(--surface)] hover:shadow-[0_4px_20px_rgba(0,0,0,0.5)] transition-shadow">
      <div className="relative w-[70px] h-[70px] flex items-center justify-center">
        <svg className="w-full h-full transform -rotate-90">
          <circle 
            cx="35" cy="35" r={radius} 
            stroke="var(--border)" strokeWidth="4" fill="none" 
          />
          <motion.circle 
            cx="35" cy="35" r={radius} 
            stroke={color} strokeWidth="4" fill="none"
            strokeLinecap="round"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset }}
            transition={{ duration: 1.5, ease: "easeOut" }}
            style={{ filter: `drop-shadow(0 0 6px ${color})` }}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center flex-col">
          <span className="text-xl font-mono font-bold" style={{ color }}>{score}</span>
        </div>
      </div>
      <div>
        <div className="text-[11px] font-bold uppercase tracking-widest text-[var(--foreground)]">Quant Score</div>
        <div className="text-[9px] text-[var(--foreground)]/50 mt-1 w-32 leading-relaxed">
          Composite technical strength and alpha probability.
        </div>
      </div>
    </div>
  );
}
