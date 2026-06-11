"use client";

import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { useEffect, useState } from "react";

export default function IntroReveal() {
  const [show, setShow] = useState(true);
  const [phase, setPhase] = useState<"dark" | "logo" | "particles" | "chart" | "done">("dark");
  const shouldReduceMotion = useReducedMotion();

  useEffect(() => {
    const hasSeenIntro = sessionStorage.getItem("quantum_intro_seen_v2");
    if (hasSeenIntro) {
      setShow(false);
      return;
    }

    if (shouldReduceMotion) {
      setShow(false);
      sessionStorage.setItem("quantum_intro_seen_v2", "true");
      return;
    }

    // Sequence timing (total ~2.5 - 3 seconds)
    setTimeout(() => setPhase("logo"), 200);
    setTimeout(() => setPhase("particles"), 800);
    setTimeout(() => setPhase("chart"), 1800);
    setTimeout(() => {
      setPhase("done");
      setShow(false);
      sessionStorage.setItem("quantum_intro_seen_v2", "true");
    }, 2800);
  }, [shouldReduceMotion]);

  if (!show) return null;

  return (
    <AnimatePresence>
      <motion.div
        key="intro-overlay"
        initial={{ opacity: 1 }}
        exit={{ opacity: 0, filter: "blur(20px)" }}
        transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
        className="fixed inset-0 z-[9999] bg-[#000000] flex items-center justify-center overflow-hidden"
      >
        {/* Deep Ambient Glow */}
        <motion.div
          animate={{
            scale: phase === "dark" ? 0.8 : 1.5,
            opacity: phase === "chart" ? 0 : 0.15,
          }}
          transition={{ duration: 2, ease: "easeInOut" }}
          className="absolute w-[800px] h-[800px] bg-[var(--accent)] rounded-full blur-[120px]"
        />

        {/* Particles / Network Phase */}
        <AnimatePresence>
          {(phase === "particles" || phase === "chart") && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.2 }}
              transition={{ duration: 1.2, ease: "easeOut" }}
              className="absolute inset-0 z-0 flex items-center justify-center pointer-events-none"
            >
              {Array.from({ length: 40 }).map((_, i) => (
                <motion.div
                  key={i}
                  initial={{ 
                    x: 0, y: 0, opacity: 0 
                  }}
                  animate={{ 
                    x: (Math.random() - 0.5) * 800, 
                    y: (Math.random() - 0.5) * 800, 
                    opacity: [0, 0.6, 0],
                    scale: [0.5, 2, 0.5]
                  }}
                  transition={{ 
                    duration: 1.5 + Math.random(), 
                    ease: "circOut",
                    delay: Math.random() * 0.3
                  }}
                  className="absolute w-1 h-1 bg-[var(--accent)] rounded-full shadow-[0_0_15px_var(--glow)]"
                />
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Logo to Chart Transformation */}
        <AnimatePresence mode="wait">
          {(phase === "logo" || phase === "particles") && (
            <motion.div
              key="logo-center"
              initial={{ scale: 0.9, opacity: 0, filter: "blur(10px)" }}
              animate={{ scale: phase === "particles" ? 1.05 : 1, opacity: 1, filter: "blur(0px)" }}
              exit={{ scale: 1.2, opacity: 0, filter: "blur(10px)" }}
              transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
              className="relative z-10 flex flex-col items-center gap-6"
            >
              <img
                src="/quantum_yield_logo.png"
                alt="Quantum Yield"
                className="w-32 h-32 rounded-3xl object-cover shadow-[0_0_60px_var(--glow)] border border-[var(--border)]"
              />
              <div className="text-2xl tracking-[0.4em] font-bold text-[var(--foreground)] uppercase">
                Quantum Yield
              </div>
            </motion.div>
          )}

          {phase === "chart" && (
            <motion.div
              key="chart-lines"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, filter: "blur(20px)", scale: 1.5 }}
              transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
              className="w-full max-w-5xl h-64 relative z-10 flex items-end justify-between px-10"
            >
              {Array.from({ length: 80 }).map((_, i) => {
                const heightPct = 10 + Math.random() * 90;
                return (
                  <motion.div
                    key={i}
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: `${heightPct}%`, opacity: heightPct > 60 ? 0.8 : 0.3 }}
                    transition={{
                      duration: 0.4,
                      delay: i * 0.008,
                      ease: "easeOut",
                    }}
                    className={`w-1.5 rounded-t-sm ${heightPct > 60 ? "bg-[var(--profit)] shadow-[0_0_15px_var(--profit)]" : "bg-[var(--accent)] shadow-[0_0_10px_var(--glow)]"}`}
                  />
                );
              })}
              
              {/* Premium Sweeping Line */}
              <motion.div 
                initial={{ width: 0, opacity: 0, x: -100 }}
                animate={{ width: "100%", opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: 0.2, ease: "circOut" }}
                className="absolute top-1/2 left-0 h-[2px] bg-[var(--foreground)] shadow-[0_0_20px_var(--foreground)]"
              />
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </AnimatePresence>
  );
}
