import { motion } from "framer-motion";

export default function InstitutionalRiskMeter({ volatility }: { volatility: number }) {
  let level = "Low";
  let activeIndex = 0;
  
  if (volatility > 30) {
    level = "Extreme";
    activeIndex = 3;
  } else if (volatility > 20) {
    level = "High";
    activeIndex = 2;
  } else if (volatility > 12) {
    level = "Med";
    activeIndex = 1;
  }

  const bars = [
    { label: "Low", color: "var(--profit)" },
    { label: "Med", color: "var(--accent)" },
    { label: "High", color: "orange" },
    { label: "Extreme", color: "var(--loss)" }
  ];

  return (
    <div className="flex flex-col gap-2">
      <div className="text-[10px] font-bold uppercase tracking-widest text-[var(--foreground)]/50">
        Institutional Risk
      </div>
      <div className="flex gap-1 h-6">
        {bars.map((bar, i) => {
          const isActive = i === activeIndex;
          const isPast = i < activeIndex;
          return (
            <div key={bar.label} className="flex-1 flex flex-col justify-end relative group">
              <motion.div 
                initial={{ height: "20%" }}
                animate={{ height: isActive || isPast ? "100%" : "20%", opacity: isActive ? 1 : (isPast ? 0.5 : 0.2) }}
                className="w-full rounded-sm"
                style={{ 
                  backgroundColor: isActive || isPast ? bar.color : "var(--border)",
                  boxShadow: isActive ? `0 0 10px ${bar.color}` : "none"
                }}
              />
              <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 text-[8px] font-mono opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                {bar.label}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
