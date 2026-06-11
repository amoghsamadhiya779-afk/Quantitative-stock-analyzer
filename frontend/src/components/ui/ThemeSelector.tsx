"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import { Sun, Moon, Palette, Zap, Check } from "lucide-react";
import { useCursor } from "../providers/CursorProvider";

const themes = [
  { id: "nexus-terminal", name: "Nexus Terminal", desc: "Black Datamorphism", icon: <Moon className="w-4 h-4" />, preview: ["#030507", "#00D4FF", "#00C076"] },
  { id: "nexus-research", name: "Nexus Research Lab", desc: "White Datamorphism", icon: <Sun className="w-4 h-4" />, preview: ["#F7F9FC", "#2563EB", "#0F172A"] },
  { id: "nexus-executive", name: "Nexus Executive", desc: "Liquid Glass Parchment", icon: <Palette className="w-4 h-4" />, preview: ["#F8F2E7", "#8B6B42", "#2A241F"] },
];

interface Props {
  currentTheme: string;
  onThemeChange: (theme: string) => void;
}

export default function ThemeSelector({ currentTheme, onThemeChange }: Props) {
  const [open, setOpen] = useState(false);
  const { setCursorType } = useCursor();

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        onMouseEnter={() => setCursorType("hover-button")}
        onMouseLeave={() => setCursorType("default")}
        className="flex items-center gap-2 px-3 py-2 rounded-xl bg-[var(--surface)] border border-[var(--border)] text-[var(--foreground)] text-[10px] font-bold uppercase tracking-widest hover:border-[var(--accent)] transition-all backdrop-blur-xl"
      >
        <div className="flex gap-0.5">
          {themes.find((t) => t.id === currentTheme)?.preview.map((c, i) => (
            <div key={i} className="w-2.5 h-2.5 rounded-full border border-white/20" style={{ backgroundColor: c }} />
          ))}
        </div>
        Theme
      </button>

      <AnimatePresence>
        {open && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
            <motion.div
              initial={{ opacity: 0, y: -8, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -8, scale: 0.95 }}
              transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
              className="absolute right-0 top-full mt-2 w-72 bg-[var(--background)] border border-border rounded-2xl shadow-2xl z-50 overflow-hidden backdrop-blur-2xl"
            >
              <div className="p-3 border-b border-border">
                <div className="text-[10px] font-bold uppercase tracking-widest text-foreground/40">Interface Theme</div>
              </div>
              <div className="p-2 space-y-1">
                {themes.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => { onThemeChange(t.id); setOpen(false); }}
                    onMouseEnter={() => setCursorType("hover-button")}
                    onMouseLeave={() => setCursorType("default")}
                    className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all ${currentTheme === t.id ? "bg-[var(--accent)]/10 border border-[var(--accent)]/30" : "hover:bg-[var(--surface)] border border-transparent"}`}
                  >
                    <div className="flex gap-0.5 shrink-0">
                      {t.preview.map((c, i) => (
                        <div key={i} className="w-4 h-4 rounded-full border border-white/10 shadow-inner" style={{ backgroundColor: c }} />
                      ))}
                    </div>
                    <div className="flex-1 text-left">
                      <div className="text-sm font-bold">{t.name}</div>
                      <div className="text-[10px] text-foreground/40">{t.desc}</div>
                    </div>
                    {currentTheme === t.id && <Check className="w-4 h-4 text-accent shrink-0" />}
                  </button>
                ))}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
