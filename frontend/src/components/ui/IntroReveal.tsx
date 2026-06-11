"use client";

import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { useEffect, useState } from "react";

export default function IntroReveal() {
  const [show, setShow] = useState(true);
  const [phase, setPhase] = useState<"parchment" | "ink" | "network" | "glass" | "done">("parchment");
  const shouldReduceMotion = useReducedMotion();

  useEffect(() => {
    const hasSeenIntro = sessionStorage.getItem("nexus_intro_seen_v3");
    if (hasSeenIntro || shouldReduceMotion) {
      setShow(false);
      return;
    }

    // Sequence timing (total ~3 seconds)
    setTimeout(() => setPhase("ink"), 600);
    setTimeout(() => setPhase("network"), 1400);
    setTimeout(() => setPhase("glass"), 2200);
    setTimeout(() => {
      setPhase("done");
      setShow(false);
      sessionStorage.setItem("nexus_intro_seen_v3", "true");
    }, 3000);
  }, [shouldReduceMotion]);

  if (!show) return null;

  return (
    <AnimatePresence>
      <motion.div
        key="intro-overlay"
        initial={{ opacity: 1 }}
        exit={{ opacity: 0, backdropFilter: "blur(0px)" }}
        transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
        className="fixed inset-0 z-[9999] bg-[var(--background)] flex items-center justify-center overflow-hidden"
      >
        {/* Phase 1: Parchment/Base Surface */}
        <div className="absolute inset-0 opacity-20 pointer-events-none" style={{ filter: 'url(#paperGrain)' }} />
        
        {/* Phase 2: Financial Ink Strokes */}
        <AnimatePresence>
          {(phase === "ink" || phase === "network" || phase === "glass") && (
            <motion.svg
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute w-full h-full"
              viewBox="0 0 1000 1000"
              preserveAspectRatio="xMidYMid slice"
            >
              <motion.path
                d="M 100 800 Q 300 700 400 500 T 900 200"
                fill="none"
                stroke="var(--foreground)"
                strokeWidth="1.5"
                strokeOpacity="0.3"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 1.5, ease: "easeInOut" }}
              />
              <motion.path
                d="M 100 600 Q 400 800 600 400 T 900 400"
                fill="none"
                stroke="var(--accent)"
                strokeWidth="2"
                strokeOpacity="0.4"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 1.2, delay: 0.3, ease: "easeInOut" }}
              />
            </motion.svg>
          )}
        </AnimatePresence>

        {/* Phase 3: Market Networks Emerge */}
        <AnimatePresence>
          {(phase === "network" || phase === "glass") && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.1 }}
              transition={{ duration: 1 }}
              className="absolute inset-0 flex items-center justify-center"
            >
              {Array.from({ length: 20 }).map((_, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, scale: 0 }}
                  animate={{ opacity: 0.5, scale: 1 }}
                  transition={{ delay: i * 0.05, duration: 0.5 }}
                  className="absolute w-2 h-2 rounded-full bg-[var(--accent)] shadow-[0_0_15px_var(--glow)]"
                  style={{
                    left: `${40 + Math.random() * 20}%`,
                    top: `${40 + Math.random() * 20}%`,
                    x: (Math.random() - 0.5) * 400,
                    y: (Math.random() - 0.5) * 400,
                  }}
                />
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Phase 4: Liquid Glass Forms */}
        <AnimatePresence>
          {phase === "glass" && (
            <motion.div
              initial={{ scale: 0, opacity: 0, backdropFilter: "blur(0px)" }}
              animate={{ scale: 5, opacity: 1, backdropFilter: "blur(40px)" }}
              transition={{ duration: 1.2, ease: "circIn" }}
              className="absolute w-[300px] h-[300px] rounded-full border border-[var(--border)] bg-[var(--surface)] shadow-[0_0_100px_var(--glow)]"
            />
          )}
        </AnimatePresence>

        {/* Brand Reveal */}
        <motion.div
          animate={{
            opacity: phase === "glass" ? 0 : 1,
            scale: phase === "glass" ? 1.1 : 1,
          }}
          transition={{ duration: 0.5 }}
          className="relative z-10 flex flex-col items-center gap-6"
        >
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 1 }}
          >
            <div className="text-3xl tracking-[0.4em] font-bold text-[var(--foreground)] uppercase drop-shadow-xl">
              NEXUS QUANT
            </div>
            <div className="text-center text-[10px] uppercase tracking-widest text-[var(--foreground)]/50 mt-2">
              Institutional Intelligence
            </div>
          </motion.div>
        </motion.div>

      </motion.div>
    </AnimatePresence>
  );
}
