"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Activity, Cpu, ShieldAlert, Terminal } from "lucide-react";

export default function AiConsole() {
  const [ticker, setTicker] = useState("SP500");
  const [response, setResponse] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handlePredict = async () => {
    setLoading(true);
    // Simulate API call to FastAPI
    setTimeout(() => {
      setResponse(`Inference complete for ${ticker}. Predicted delta: +1.24%. Confidence: 92.4%. Signal: BUY.`);
      setLoading(false);
    }, 1500);
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
      className="relative z-10 w-full max-w-2xl mx-auto mt-24 p-6 rounded-card bg-surface border border-border backdrop-blur-xl shadow-2xl"
    >
      <div className="flex items-center gap-3 mb-6 border-b border-border pb-4">
        <Terminal className="text-accent w-5 h-5" />
        <h2 className="text-sm tracking-[0.2em] text-accent uppercase">Quantum Yield Core</h2>
      </div>

      <div className="space-y-6">
        <div className="flex gap-4">
          <input 
            type="text" 
            value={ticker}
            onChange={(e) => setTicker(e.target.value)}
            className="flex-1 bg-black/20 border border-border rounded-lg px-4 py-3 text-foreground outline-none focus:border-accent transition-colors duration-300 font-mono text-sm"
            placeholder="Enter Ticker (e.g. SP500)"
          />
          <button 
            onClick={handlePredict}
            disabled={loading}
            className="px-6 py-3 bg-accent text-background font-medium rounded-button hover:bg-opacity-90 transition-all duration-300 disabled:opacity-50"
          >
            {loading ? "PROCESSING..." : "EXECUTE"}
          </button>
        </div>

        <div className="h-32 bg-black/40 rounded-lg p-4 font-mono text-sm text-secondary overflow-y-auto border border-border/50">
          <div className="text-foreground/50 mb-2">{">"} System ready. Awaiting command...</div>
          {loading && <div className="text-accent animate-pulse">{">"} Establishing neural link...</div>}
          {response && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-foreground"
            >
              {">"} {response}
            </motion.div>
          )}
        </div>

        <div className="grid grid-cols-3 gap-4 text-xs font-mono text-foreground/60 pt-4 border-t border-border/50">
          <div className="flex items-center gap-2"><Activity className="w-4 h-4 text-emerald-400"/> L2 ACTIVE</div>
          <div className="flex items-center gap-2"><Cpu className="w-4 h-4 text-accent"/> GPU ONLINE</div>
          <div className="flex items-center gap-2"><ShieldAlert className="w-4 h-4 text-orange-400"/> RISK 95%</div>
        </div>
      </div>
    </motion.div>
  );
}
