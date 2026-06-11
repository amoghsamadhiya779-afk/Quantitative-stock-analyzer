"use client";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";

export default function DatamorphicBackground() {
  const [theme, setTheme] = useState("nexus-terminal");

  useEffect(() => {
    // Observe theme changes on the html element
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.attributeName === "data-theme") {
          const currentTheme = document.documentElement.getAttribute("data-theme") || "nexus-terminal";
          setTheme(currentTheme);
        }
      });
    });

    observer.observe(document.documentElement, { attributes: true });
    
    // Initial check
    setTheme(document.documentElement.getAttribute("data-theme") || "nexus-terminal");

    return () => observer.disconnect();
  }, []);

  return (
    <div className="fixed inset-0 pointer-events-none z-[-1] overflow-hidden">
      {/* Nexus Terminal: Black Datamorphism (Subtle grids and nodes) */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: theme === "nexus-terminal" ? 1 : 0 }}
        transition={{ duration: 1.5 }}
        className="absolute inset-0"
      >
        <div className="absolute inset-0 opacity-[0.03] bg-[linear-gradient(rgba(0,212,255,0.5)_1px,transparent_1px),linear-gradient(90deg,rgba(0,212,255,0.5)_1px,transparent_1px)] bg-[size:50px_50px]" />
        {/* Subtle radial gradients simulating data nodes */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-[var(--accent)] rounded-full blur-[120px] opacity-[0.04]" />
        <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-[var(--profit)] rounded-full blur-[150px] opacity-[0.03]" />
      </motion.div>

      {/* Nexus Research Lab: White Datamorphism (Contour maps) */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: theme === "nexus-research" ? 1 : 0 }}
        transition={{ duration: 1.5 }}
        className="absolute inset-0"
      >
        <div className="absolute inset-0 opacity-[0.02] bg-[radial-gradient(circle_at_center,var(--accent)_1px,transparent_1px)] bg-[size:20px_20px]" />
        <svg className="absolute inset-0 w-full h-full opacity-[0.02]" xmlns="http://www.w3.org/2000/svg">
          <path d="M0 100 Q 250 50 500 200 T 1000 150" fill="none" stroke="var(--accent)" strokeWidth="1" />
          <path d="M0 300 Q 350 250 600 400 T 1200 350" fill="none" stroke="var(--accent)" strokeWidth="1" />
          <path d="M0 500 Q 450 450 700 600 T 1400 550" fill="none" stroke="var(--accent)" strokeWidth="1" />
        </svg>
      </motion.div>

      {/* Nexus Executive: Liquid Glass Parchment (Warm texture) */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: theme === "nexus-executive" ? 1 : 0 }}
        transition={{ duration: 1.5 }}
        className="absolute inset-0"
      >
        {/* Paper Grain Effect via SVG filter */}
        <div className="absolute inset-0 opacity-[0.4]" style={{ filter: 'url(#paperGrain)' }}></div>
        <svg className="hidden">
          <filter id="paperGrain">
            <feTurbulence type="fractalNoise" baseFrequency="0.04" numOctaves="5" result="noise" />
            <feColorMatrix type="matrix" values="1 0 0 0 0  0 0.9 0 0 0  0 0.8 0 0 0  0 0 0 0.15 0" in="noise" />
          </filter>
        </svg>
        <div className="absolute top-1/3 left-1/2 w-[800px] h-[800px] -translate-x-1/2 -translate-y-1/2 bg-[var(--accent)] rounded-full blur-[150px] opacity-[0.05]" />
      </motion.div>
    </div>
  );
}
