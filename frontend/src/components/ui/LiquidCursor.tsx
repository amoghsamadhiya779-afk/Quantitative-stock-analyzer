"use client";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useCursor } from "../providers/CursorProvider";

export default function LiquidCursor() {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const { cursorType } = useCursor();
  
  useEffect(() => {
    const updateMousePosition = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };
    window.addEventListener("mousemove", updateMousePosition);
    return () => window.removeEventListener("mousemove", updateMousePosition);
  }, []);

  // Use a slight spring for smooth tracking, but very tight
  const springConfig = { type: "spring", stiffness: 300, damping: 25, mass: 0.5 };

  return (
    <>
      {/* Outer Glow / Halo */}
      <motion.div
        className="fixed top-0 left-0 rounded-full pointer-events-none z-[9998] hidden md:block"
        animate={{
          x: mousePosition.x - (cursorType === "hover-card" ? 100 : cursorType === "hover-data" ? 40 : cursorType === "hover-button" ? 24 : 16),
          y: mousePosition.y - (cursorType === "hover-card" ? 100 : cursorType === "hover-data" ? 40 : cursorType === "hover-button" ? 24 : 16),
          width: cursorType === "hover-card" ? 200 : cursorType === "hover-data" ? 80 : cursorType === "hover-button" ? 48 : 32,
          height: cursorType === "hover-card" ? 200 : cursorType === "hover-data" ? 80 : cursorType === "hover-button" ? 48 : 32,
          backgroundColor: cursorType === "hover-button" ? "var(--glow)" : "transparent",
          border: cursorType === "default" ? "1px solid var(--accent)" : cursorType === "hover-data" ? "1px dashed var(--accent)" : "none",
          backdropFilter: cursorType === "hover-card" ? "blur(12px) brightness(1.1)" : cursorType === "hover-button" ? "blur(4px)" : "blur(0px)",
          boxShadow: cursorType === "hover-card" ? "inset 0 0 40px rgba(255,255,255,0.05)" : cursorType === "default" ? "0 0 10px var(--glow)" : cursorType === "hover-data" ? "inset 0 0 15px var(--glow)" : "none",
          borderRadius: cursorType === "hover-chart" ? "4px" : "50%",
          rotate: cursorType === "hover-chart" ? 45 : 0,
        }}
        transition={springConfig}
      />
      {/* Inner Dot */}
      <motion.div
        className="fixed top-0 left-0 w-2 h-2 rounded-full pointer-events-none z-[9999] hidden md:block mix-blend-difference bg-white"
        animate={{
          x: mousePosition.x - 4,
          y: mousePosition.y - 4,
          scale: cursorType === "hover-chart" ? 0 : cursorType === "hover-button" ? 0.5 : 1,
          opacity: cursorType === "hover-card" ? 0 : 1
        }}
        transition={{ type: "spring", stiffness: 800, damping: 20 }}
      />
    </>
  );
}
