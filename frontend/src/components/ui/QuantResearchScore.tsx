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
    <div className="flex items-center gap-4 p-5 glass-card relative overflow-hidden group">
      <div className="absolute top-0 right-0 w-32 h-32 bg-[var(--accent)] rounded-full blur-[60px] opacity-10 group-hover:opacity-20 transition-opacity pointer-events-none" />
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
        <div className="text-[10px] text-[var(--foreground)]/50 mt-1 w-32 leading-relaxed">
          Composite technical strength and alpha probability.
        </div>
      </div>
    </div>
  );
}
