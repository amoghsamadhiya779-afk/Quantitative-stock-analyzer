"use client";

import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";

export const LandingBackground = () => {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <div className="fixed inset-0 z-[-1] bg-[#030305]" />;
  }

  return (
    <div className="fixed inset-0 z-[-1] overflow-hidden bg-[#030305]">
      {/* Deep starry space background */}
      <div 
        className="absolute inset-0 opacity-40"
        style={{
          backgroundImage: `
            radial-gradient(circle at 15% 50%, rgba(255, 255, 255, 0.15) 1px, transparent 1px),
            radial-gradient(circle at 85% 30%, rgba(255, 255, 255, 0.1) 1.5px, transparent 1.5px),
            radial-gradient(circle at 50% 80%, rgba(255, 255, 255, 0.1) 1px, transparent 1px),
            radial-gradient(circle at 30% 20%, rgba(255, 255, 255, 0.15) 1px, transparent 1px),
            radial-gradient(circle at 70% 60%, rgba(255, 255, 255, 0.1) 1px, transparent 1px)
          `,
          backgroundSize: "100px 100px, 150px 150px, 80px 80px, 120px 120px, 200px 200px"
        }}
      />
      
      {/* Massive glowing horizon - Main Orange/Yellow */}
      <motion.div
        initial={{ opacity: 0.6, y: 10 }}
        animate={{ opacity: [0.6, 0.85, 0.6], y: [10, -10, 10] }}
        transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
        className="absolute bottom-[-30%] left-[-20%] right-[-20%] h-[75%] blur-[120px] rounded-[100%]"
        style={{
          background: `radial-gradient(
            ellipse at top center,
            rgba(255, 170, 0, 0.5) 0%,
            rgba(255, 60, 0, 0.4) 30%,
            rgba(0, 150, 255, 0.15) 60%,
            transparent 80%
          )`
        }}
      />
      
      {/* Secondary accent glow layer for depth - Deep Cyan/Blue */}
      <motion.div
        initial={{ opacity: 0.4, y: 0 }}
        animate={{ opacity: [0.4, 0.7, 0.4], y: [0, -15, 0] }}
        transition={{ duration: 14, repeat: Infinity, ease: "easeInOut", delay: 1 }}
        className="absolute bottom-[-20%] left-[5%] right-[5%] h-[50%] blur-[100px] rounded-[100%]"
        style={{
          background: `radial-gradient(
            ellipse at top center,
            rgba(0, 230, 255, 0.3) 0%,
            rgba(120, 0, 255, 0.2) 50%,
            transparent 75%
          )`
        }}
      />
      
      {/* Intense center core at the very bottom horizon */}
      <motion.div
        initial={{ opacity: 0.7, scale: 1 }}
        animate={{ opacity: [0.7, 0.9, 0.7], scale: [1, 1.05, 1] }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut", delay: 2 }}
        className="absolute bottom-[-15%] left-[30%] right-[30%] h-[30%] blur-[80px] rounded-[100%]"
        style={{
          background: `radial-gradient(
            ellipse at top center,
            rgba(255, 220, 100, 0.6) 0%,
            transparent 70%
          )`
        }}
      />
      
      {/* Top subtle blue light leak */}
      <motion.div
        className="absolute top-[-20%] left-[-10%] right-[-10%] h-[40%] blur-[150px] opacity-30"
        style={{
          background: `radial-gradient(
            ellipse at top,
            rgba(0, 120, 255, 0.3) 0%,
            transparent 60%
          )`
        }}
      />
    </div>
  );
};
