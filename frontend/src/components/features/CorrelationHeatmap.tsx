"use client";

import { useEffect, useState } from "react";
import { fetchCorrelationMatrix, CorrelationMatrix } from "@/lib/api";
import { motion, AnimatePresence } from "framer-motion";

export default function CorrelationHeatmap({ marketName }: { marketName: string }) {
  const [data, setData] = useState<CorrelationMatrix | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!marketName) return;
    setLoading(true);
    fetchCorrelationMatrix(marketName).then((matrix) => {
      setData(matrix);
      setLoading(false);
    });
  }, [marketName]);

  // Interpolate color based on correlation coefficient (-1 to 1)
  const getColor = (value: number) => {
    if (value === 1) return "bg-[var(--color-carbon)] text-white"; // Identity
    
    if (value > 0.5) return "bg-[var(--profit)]/90 text-white";
    if (value > 0.2) return "bg-[var(--profit)]/50 text-[var(--color-carbon)]";
    if (value > 0) return "bg-[var(--profit)]/20 text-[var(--color-carbon)]";
    
    if (value < -0.5) return "bg-[var(--loss)]/90 text-white";
    if (value < -0.2) return "bg-[var(--loss)]/50 text-[var(--color-carbon)]";
    if (value < 0) return "bg-[var(--loss)]/20 text-[var(--color-carbon)]";
    
    return "bg-[var(--color-fog)] text-[var(--color-slate)]"; // Neutral / 0
  };

  return (
    <div className="ventriloc-card rounded-[24px] p-6 md:p-8 flex flex-col h-full w-full overflow-hidden">
      <div className="flex flex-col mb-8">
        <h3 className="font-display text-xl font-bold text-[var(--color-carbon)]">Cross-Asset Correlation</h3>
        <p className="text-xs text-[var(--color-slate)] mt-1">Pearson correlation coefficient over 90-day rolling window.</p>
      </div>

      <div className="flex-1 w-full flex items-center justify-center overflow-x-auto hide-scrollbar">
        <AnimatePresence mode="wait">
          {loading || !data || data.tickers.length === 0 ? (
            <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col items-center justify-center py-20 gap-4">
              <div className="w-8 h-8 rounded-full border-2 border-[var(--border)] border-t-[var(--color-carbon)] animate-spin" />
              <span className="text-[10px] font-mono uppercase tracking-widest text-[var(--color-slate)]">Computing Matrix...</span>
            </motion.div>
          ) : (
            <motion.div key="matrix" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }} className="min-w-max">
              <div className="flex flex-col gap-1">
                {/* Header Row */}
                <div className="flex gap-1">
                  <div className="w-12 h-12" /> {/* Empty corner */}
                  {data.tickers.map(ticker => (
                    <div key={`col-${ticker}`} className="w-10 h-10 flex items-center justify-center">
                      <span className="text-[9px] font-bold tracking-wider uppercase text-[var(--color-slate)] -rotate-45">{ticker.split('.')[0]}</span>
                    </div>
                  ))}
                </div>
                
                {/* Data Rows */}
                {data.matrix.map((row, i) => (
                  <div key={`row-${i}`} className="flex gap-1">
                    <div className="w-12 h-10 flex items-center justify-end pr-2">
                      <span className="text-[9px] font-bold tracking-wider uppercase text-[var(--color-slate)]">{data.tickers[i].split('.')[0]}</span>
                    </div>
                    {row.map((val, j) => (
                      <div
                        key={`cell-${i}-${j}`}
                        title={`${data.tickers[i]} vs ${data.tickers[j]}: ${val.toFixed(2)}`}
                        className={`w-10 h-10 rounded-lg flex items-center justify-center text-[10px] font-mono font-medium transition-transform hover:scale-110 cursor-crosshair ${getColor(val)}`}
                      >
                        {val === 1 ? "—" : val.toFixed(1)}
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      
      {/* Legend */}
      <div className="mt-8 flex items-center justify-between border-t border-[var(--border)] pt-4">
        <span className="text-[9px] uppercase tracking-widest text-[var(--color-slate)] font-semibold">Inverse</span>
        <div className="flex items-center gap-1">
          <div className="w-4 h-4 rounded-sm bg-[var(--loss)]/90" />
          <div className="w-4 h-4 rounded-sm bg-[var(--loss)]/50" />
          <div className="w-4 h-4 rounded-sm bg-[var(--loss)]/20" />
          <div className="w-4 h-4 rounded-sm bg-[var(--color-fog)] mx-1" />
          <div className="w-4 h-4 rounded-sm bg-[var(--profit)]/20" />
          <div className="w-4 h-4 rounded-sm bg-[var(--profit)]/50" />
          <div className="w-4 h-4 rounded-sm bg-[var(--profit)]/90" />
        </div>
        <span className="text-[9px] uppercase tracking-widest text-[var(--color-slate)] font-semibold">Direct</span>
      </div>
    </div>
  );
}
