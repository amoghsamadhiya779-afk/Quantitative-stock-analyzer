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

  const parallaxX = prefersReduced ? 0 : mouse.x * 18;
  const parallaxY = prefersReduced ? 0 : mouse.y * 12;

  return (
    <div
      className="fixed inset-0 w-full h-full overflow-hidden pointer-events-none"
      style={{ zIndex: 0, background: "#05060A" }}
      aria-hidden="true"
    >
      {/* Layer 1: Warm amber/orange radial — top-right */}
      <motion.div
        className="absolute"
        style={{
          width: "120vw",
          height: "120vh",
          top: "-20%",
          right: "-30%",
          background:
            "radial-gradient(ellipse at 70% 30%, rgba(255,138,61,0.18) 0%, rgba(232,93,44,0.08) 40%, transparent 70%)",
          filter: "blur(200px)",
          willChange: "transform",
          mixBlendMode: "screen",
        }}
        animate={{
          x: [parallaxX, parallaxX + 30, parallaxX - 20, parallaxX],
          y: [parallaxY, parallaxY - 25, parallaxY + 15, parallaxY],
        }}
        transition={{
          duration: 28,
          ease: "easeInOut",
          repeat: Infinity,
          repeatType: "reverse",
        }}
      />

      {/* Layer 2: Cool indigo/blue radial — bottom-left */}
      <motion.div
        className="absolute"
        style={{
          width: "130vw",
          height: "130vh",
          bottom: "-25%",
          left: "-35%",
          background:
            "radial-gradient(ellipse at 30% 70%, rgba(59,111,224,0.15) 0%, rgba(110,77,224,0.1) 35%, transparent 65%)",
          filter: "blur(220px)",
          willChange: "transform",
          mixBlendMode: "screen",
        }}
        animate={{
          x: [parallaxX * 0.7, parallaxX * 0.7 - 35, parallaxX * 0.7 + 25, parallaxX * 0.7],
          y: [parallaxY * 0.7, parallaxY * 0.7 + 30, parallaxY * 0.7 - 20, parallaxY * 0.7],
        }}
        transition={{
          duration: 32,
          ease: "easeInOut",
          repeat: Infinity,
          repeatType: "reverse",
        }}
      />

      {/* Layer 3: Cyan accent glow — center-left drift */}
      <motion.div
        className="absolute"
        style={{
          width: "60vw",
          height: "60vh",
          top: "20%",
          left: "10%",
          background:
            "radial-gradient(circle, rgba(56,189,248,0.08) 0%, transparent 60%)",
          filter: "blur(180px)",
          willChange: "transform",
          mixBlendMode: "screen",
        }}
        animate={{
          x: [0, 40, -30, 0],
          y: [0, -35, 25, 0],
          opacity: [0.6, 0.9, 0.5, 0.6],
        }}
        transition={{
          duration: 24,
          ease: "easeInOut",
          repeat: Infinity,
          repeatType: "reverse",
        }}
      />

      {/* Layer 4: Slow-drifting mesh gradient */}
      <motion.div
        className="absolute inset-0"
        style={{
          background:
            "conic-gradient(from 180deg at 50% 50%, rgba(110,77,224,0.04) 0deg, rgba(255,138,61,0.03) 120deg, rgba(59,111,224,0.04) 240deg, rgba(110,77,224,0.04) 360deg)",
          filter: "blur(260px)",
          willChange: "transform",
          mixBlendMode: "screen",
        }}
        animate={{
          rotate: [0, 360],
          scale: [1, 1.08, 1],
        }}
        transition={{
          rotate: { duration: 120, ease: "linear", repeat: Infinity },
          scale: { duration: 35, ease: "easeInOut", repeat: Infinity, repeatType: "reverse" },
        }}
      />

      {/* Layer 5: Floating organic glow blob */}
      <motion.div
        className="absolute"
        style={{
          width: "45vw",
          height: "45vh",
          top: "50%",
          right: "5%",
          background:
            "radial-gradient(circle, rgba(168,85,247,0.06) 0%, transparent 55%)",
          filter: "blur(200px)",
          willChange: "transform",
          mixBlendMode: "screen",
        }}
        animate={{
          x: [parallaxX * 0.5, parallaxX * 0.5 + 50, parallaxX * 0.5 - 40, parallaxX * 0.5],
          y: [parallaxY * 0.5, parallaxY * 0.5 - 45, parallaxY * 0.5 + 35, parallaxY * 0.5],
          opacity: [0.4, 0.7, 0.35, 0.4],
        }}
        transition={{
          duration: 22,
          ease: "easeInOut",
          repeat: Infinity,
          repeatType: "reverse",
        }}
      />

      {/* Layer 6: Monochrome film grain noise overlay */}
      <div
        className="absolute inset-0"
        style={{
          opacity: 0.035,
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
          backgroundSize: "128px 128px",
          mixBlendMode: "overlay",
          pointerEvents: "none",
        }}
      />

      {/* Layer 7: Dark radial vignette */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse at center, transparent 40%, rgba(5,6,10,0.7) 80%, rgba(5,6,10,0.95) 100%)",
          pointerEvents: "none",
        }}
      />
    </div>
  );
}
