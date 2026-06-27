"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";

export default function CosmoqBackground() {
  const prefersReduced = useReducedMotion();
  const [mouse, setMouse] = useState({ x: 0, y: 0 });
  const rafRef = useRef<number>(0);

  useEffect(() => {
    if (prefersReduced) return;
    const handleMove = (e: MouseEvent) => {
      if (rafRef.current) return;
      rafRef.current = requestAnimationFrame(() => {
        setMouse({
          x: (e.clientX / window.innerWidth - 0.5) * 2,
          y: (e.clientY / window.innerHeight - 0.5) * 2,
        });
        rafRef.current = 0;
      });
    };
    window.addEventListener("mousemove", handleMove, { passive: true });
    return () => window.removeEventListener("mousemove", handleMove);
  }, [prefersReduced]);

  const parallaxX = prefersReduced ? 0 : mouse.x * 20;
  const parallaxY = prefersReduced ? 0 : mouse.y * 10;

  return (
    <div className="fixed inset-0 w-full h-full overflow-hidden bg-[#020202] pointer-events-none z-0">
      <div 
        className="absolute inset-0 opacity-50 mix-blend-screen"
        style={{
          backgroundImage: `
            radial-gradient(1px 1px at 10% 20%, white, transparent),
            radial-gradient(1px 1px at 30% 10%, rgba(255,255,255,0.8), transparent),
            radial-gradient(2px 2px at 50% 30%, rgba(255,255,255,0.5), transparent),
            radial-gradient(1px 1px at 70% 15%, white, transparent),
            radial-gradient(2px 2px at 80% 40%, rgba(255,255,255,0.7), transparent),
            radial-gradient(1px 1px at 90% 10%, white, transparent),
            radial-gradient(1px 1px at 20% 50%, rgba(255,255,255,0.6), transparent),
            radial-gradient(2px 2px at 40% 70%, white, transparent),
            radial-gradient(1px 1px at 60% 80%, rgba(255,255,255,0.8), transparent),
            radial-gradient(1.5px 1.5px at 85% 60%, white, transparent),
            radial-gradient(1px 1px at 25% 90%, rgba(255,255,255,0.4), transparent),
            radial-gradient(2px 2px at 75% 90%, rgba(255,255,255,0.9), transparent)
          `,
          backgroundSize: '150px 150px',
        }}
      />
      <motion.div 
        className="absolute inset-0 opacity-40 mix-blend-screen"
        style={{
          backgroundImage: `
            radial-gradient(1.5px 1.5px at 15% 25%, rgba(255,255,255,0.8), transparent),
            radial-gradient(1px 1px at 45% 15%, white, transparent),
            radial-gradient(2px 2px at 65% 35%, rgba(255,255,255,0.5), transparent),
            radial-gradient(1px 1px at 85% 20%, white, transparent)
          `,
          backgroundSize: '200px 200px',
        }}
        animate={{
          y: [0, -20, 0],
          opacity: [0.3, 0.6, 0.3],
        }}
        transition={{
          duration: 10,
          repeat: Infinity,
          ease: "linear",
        }}
      />
      <motion.div
        className="absolute"
        style={{
          width: "140vw",
          height: "100vh",
          bottom: "-40%",
          left: "-30%",
          background: "radial-gradient(ellipse at 40% 100%, rgba(245, 124, 0, 0.35) 0%, rgba(255, 61, 0, 0.15) 30%, transparent 60%)",
          filter: "blur(120px)",
          willChange: "transform",
        }}
        animate={{
          x: parallaxX * 0.5,
          y: parallaxY * 0.5,
        }}
        transition={{ type: "spring", stiffness: 50, damping: 20 }}
      />
      <motion.div
        className="absolute"
        style={{
          width: "120vw",
          height: "120vh",
          bottom: "-50%",
          right: "-20%",
          background: "radial-gradient(ellipse at 60% 100%, rgba(0, 140, 255, 0.35) 0%, rgba(61, 90, 254, 0.15) 35%, transparent 65%)",
          filter: "blur(140px)",
          willChange: "transform",
        }}
        animate={{
          x: parallaxX * 0.7,
          y: parallaxY * 0.7,
        }}
        transition={{ type: "spring", stiffness: 50, damping: 20 }}
      />
      <motion.div
        className="absolute"
        style={{
          width: "80vw",
          height: "60vh",
          bottom: "-20%",
          left: "10%",
          background: "radial-gradient(ellipse at 50% 100%, rgba(255, 235, 150, 0.15) 0%, transparent 50%)",
          filter: "blur(100px)",
          willChange: "transform",
        }}
        animate={{
          x: parallaxX * 0.3,
          y: parallaxY * 0.3,
        }}
        transition={{ type: "spring", stiffness: 50, damping: 20 }}
      />
      <div className="absolute top-0 left-0 w-full h-[60vh] bg-gradient-to-b from-[#020202] via-[#020202]/80 to-transparent" />
    </div>
  );
}
