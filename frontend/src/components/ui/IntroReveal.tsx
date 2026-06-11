"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState } from "react";

export default function IntroReveal() {
  const [show, setShow] = useState(true);
  const [phase, setPhase] = useState<"logo" | "chart" | "done">("logo");

  useEffect(() => {
    const hasSeenIntro = sessionStorage.getItem("quantum_intro_seen");
    if (hasSeenIntro) {
      setShow(false);
      return;
    }

    // Sequence timing
    setTimeout(() => setPhase("chart"), 1800);
    setTimeout(() => {
      setPhase("done");
      setShow(false);
      sessionStorage.setItem("quantum_intro_seen", "true");
    }, 3200);
  }, []);

  if (!show) return null;

  return (
    <AnimatePresence>
      <motion.div
        key="intro-overlay"
        initial={{ opacity: 1 }}
        exit={{ opacity: 0, filter: "blur(20px)" }}
        transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
        className="fixed inset-0 z-[9999] bg-[#030712] flex items-center justify-center overflow-hidden"
      >
        {/* Ambient Grid Background */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:40px_40px] [mask-image:radial-gradient(ellipse_60%_60%_at_50%_50%,#000_10%,transparent_100%)]" />

        {/* Ambient Glow */}
        <motion.div
          animate={{
            scale: [1, 1.2, 1.5],
            opacity: [0, 0.2, 0],
          }}
          transition={{ duration: 3, ease: "easeInOut" }}
          className="absolute w-[600px] h-[600px] bg-blue-500/20 rounded-full blur-[100px]"
        />

        {/* Logo Phase */}
        <AnimatePresence mode="wait">
          {phase === "logo" && (
            <motion.div
              key="logo"
              initial={{ scale: 0.85, opacity: 0, filter: "blur(10px)" }}
              animate={{ scale: 1, opacity: 1, filter: "blur(0px)" }}
              exit={{ scale: 1.5, opacity: 0, filter: "blur(20px)" }}
              transition={{ duration: 1.5, ease: [0.22, 1, 0.36, 1] }}
              className="flex flex-col items-center gap-6 relative z-10"
            >
              <img
                src="/quantum_yield_logo.png"
                alt="Quantum Yield"
                className="w-32 h-32 rounded-3xl object-cover shadow-[0_0_50px_rgba(96,165,250,0.5)] border border-white/10"
              />
              <div className="text-2xl tracking-[0.4em] font-bold text-white uppercase opacity-80">
                Quantum Yield
              </div>
            </motion.div>
          )}

          {/* Morph to Chart Phase */}
          {phase === "chart" && (
            <motion.div
              key="chart"
              initial={{ opacity: 0, scale: 0.8, y: 50 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 2, filter: "blur(20px)" }}
              transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
              className="w-full max-w-4xl h-64 relative z-10 flex items-end justify-between px-10"
            >
              {/* Animated Chart Bars */}
              {Array.from({ length: 40 }).map((_, i) => (
                <motion.div
                  key={i}
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: `${20 + Math.random() * 80}%`, opacity: 0.8 }}
                  transition={{
                    duration: 0.5,
                    delay: i * 0.02,
                    ease: "easeOut",
                  }}
                  className="w-2 bg-emerald-400 rounded-t-sm"
                  style={{
                    boxShadow: "0 0 20px rgba(52, 211, 153, 0.5)",
                  }}
                />
              ))}
              
              {/* Overlay line */}
              <motion.div 
                initial={{ width: 0, opacity: 0 }}
                animate={{ width: "100%", opacity: 1 }}
                transition={{ duration: 0.8, delay: 0.3, ease: "easeInOut" }}
                className="absolute top-1/2 left-0 h-0.5 bg-blue-400 shadow-[0_0_20px_rgba(96,165,250,0.8)]"
              />
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </AnimatePresence>
  );
}
