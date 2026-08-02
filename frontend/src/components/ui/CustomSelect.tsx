"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, Check } from "lucide-react";

interface Props {
  label: string;
  value: string;
  options: string[];
  onChange: (v: string) => void;
}

export default function CustomSelect({ label, value, options, onChange }: Props) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div 
      ref={ref} 
      className={`relative p-3 rounded-card glass-card flex flex-col justify-center group transition-all select-none ${open ? "z-50" : "z-10"}`}
      onClick={() => setOpen(!open)}
    >
      <span className="text-[9px] font-bold uppercase tracking-widest text-[var(--foreground)]/40 mb-1 group-hover:text-[var(--accent)] transition-colors relative z-10">{label}</span>
      
      <div className="flex justify-between items-center w-full text-[var(--foreground)] font-bold text-sm truncate relative z-10">
        <span className="truncate pr-4">{value || "Select..."}</span>
        <ChevronDown className={`w-4 h-4 text-[var(--foreground)]/50 transition-transform duration-300 ${open ? "rotate-180" : ""}`} />
      </div>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
            className="absolute top-full left-0 right-0 mt-2 bg-[var(--background)] border border-[var(--border)] rounded-xl shadow-2xl z-50 overflow-hidden backdrop-blur-2xl max-h-60 overflow-y-auto scrollbar-none"
          >
            {options.map((o) => (
              <div
                key={o}
                onClick={(e) => { e.stopPropagation(); onChange(o); setOpen(false); }}
                className={`flex items-center justify-between p-3 text-sm transition-all hover:bg-[var(--surface)] ${value === o ? "text-[var(--accent)] bg-[var(--accent)]/5 font-bold" : "text-[var(--foreground)]"}`}
              >
                <span className="truncate">{o}</span>
                {value === o && <Check className="w-4 h-4 shrink-0" />}
              </div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
