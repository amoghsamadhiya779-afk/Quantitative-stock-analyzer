"use client";

import React, { useEffect, useId, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useOutsideClick } from "@/hooks/use-outside-click";
import { NewsItem } from "@/lib/api";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

export default function ExpandableNewsCards({ news }: { news: NewsItem[] }) {
  const [active, setActive] = useState<NewsItem | boolean | null>(
    null
  );
  const ref = useRef<HTMLDivElement>(null);
  const id = useId();

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setActive(false);
      }
    }

    if (active && typeof active === "object") {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "auto";
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [active]);

  useOutsideClick(ref, () => setActive(null));

  return (
    <>
      <AnimatePresence>
        {active && typeof active === "object" && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/20 h-full w-full z-10"
          />
        )}
      </AnimatePresence>
      <AnimatePresence>
        {active && typeof active === "object" ? (
          <div className="fixed inset-0  grid place-items-center z-[100]">
            <motion.button
              key={`button-${active.title}-${id}`}
              layout
              initial={{
                opacity: 0,
              }}
              animate={{
                opacity: 1,
              }}
              exit={{
                opacity: 0,
                transition: {
                  duration: 0.05,
                },
              }}
              className="flex absolute top-2 right-2 lg:hidden items-center justify-center bg-white rounded-full h-6 w-6"
              onClick={() => setActive(null)}
            >
              <CloseIcon />
            </motion.button>
            <motion.div
              layoutId={`card-${active.title}-${id}`}
              ref={ref}
              className="w-full max-w-[600px] h-full md:h-fit md:max-h-[90%] flex flex-col bg-[var(--background)] sm:rounded-3xl overflow-hidden border border-[var(--border)] shadow-2xl"
            >
              <div className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div className="space-y-2 flex-1">
                    <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-[var(--color-slate)]">
                      <span>{active.source}</span>
                      <span>•</span>
                      <span>LIVE FEED</span>
                    </div>
                    <motion.h3
                      layoutId={`title-${active.title}-${id}`}
                      className="text-xl font-bold text-[var(--foreground)] leading-tight"
                    >
                      {active.title}
                    </motion.h3>
                  </div>
                  
                  <motion.a
                    layoutId={`button-${active.title}-${id}`}
                    href={active.link}
                    target="_blank"
                    className="shrink-0 ml-4 px-4 py-2 text-[10px] uppercase tracking-widest rounded-full font-bold bg-[var(--accent)] text-white hover:bg-orange-500 transition-colors"
                  >
                    Read Full
                  </motion.a>
                </div>

                <div className="relative">
                  <motion.div
                    layout
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="text-[var(--color-graphite)] text-sm leading-relaxed h-40 md:h-fit pb-4 flex flex-col items-start gap-4 overflow-auto [mask:linear-gradient(to_bottom,white,white,transparent)] [scrollbar-width:none] [-ms-overflow-style:none] [-webkit-overflow-scrolling:touch]"
                  >
                    <p>
                      This article from <strong>{active.source}</strong> provides key insights into macroeconomic shifts and corporate developments that may impact asset valuation.
                    </p>
                    <div className="p-4 rounded-xl border border-[var(--border)] bg-surface w-full">
                      <h4 className="text-[10px] font-bold tracking-widest uppercase mb-2 text-[var(--color-slate)]">AI Impact Assessment</h4>
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-md flex items-center gap-1 border" style={{ backgroundColor: `${active.color}15`, borderColor: `${active.color}30`, color: active.color }}>
                          {active.tag.includes("BULLISH") ? <TrendingUp className="w-3 h-3" /> : active.tag.includes("BEARISH") ? <TrendingDown className="w-3 h-3" /> : <Minus className="w-3 h-3" />}
                          {active.tag}
                        </span>
                      </div>
                      <p className="text-xs font-mono text-[var(--foreground)]/60">
                        NLP analysis detects strong {active.tag.toLowerCase()} sentiment vectors affecting current market pricing matrices. Consider adjusting exposure based on these momentum shifts.
                      </p>
                    </div>
                  </motion.div>
                </div>
              </div>
            </motion.div>
          </div>
        ) : null}
      </AnimatePresence>
      <ul className="w-full space-y-4 pr-1">
        {news.map((item, index) => {
          const isBullish = item.tag.includes("BULLISH");
          const isBearish = item.tag.includes("BEARISH");
          
          return (
            <motion.div
              layoutId={`card-${item.title}-${id}`}
              key={`card-${item.title}-${id}`}
              onClick={() => setActive(item)}
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
              className="p-4 rounded-xl bg-[var(--background)]/40 border border-[var(--border)] hover:border-[var(--accent)]/50 transition-all duration-200 group flex items-start justify-between gap-4 cursor-pointer"
            >
              <div className="space-y-1.5 flex-1">
                <div className="flex items-center gap-2 text-[9px] font-bold uppercase tracking-widest text-[var(--color-slate)]">
                  <span>{item.source}</span>
                  <span>•</span>
                  <span>LIVE FEED</span>
                </div>
                <motion.h3
                  layoutId={`title-${item.title}-${id}`}
                  className="text-[13px] font-bold text-[var(--foreground)] group-hover:text-[var(--accent)] transition-colors leading-snug block"
                >
                  {item.title}
                </motion.h3>
              </div>
              <div className="shrink-0 flex flex-col items-end gap-1.5">
                <span className="text-[8px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-md flex items-center gap-1 border" style={{ backgroundColor: `${item.color}15`, borderColor: `${item.color}30`, color: item.color }}>
                  {isBullish && <TrendingUp className="w-2.5 h-2.5" />}
                  {isBearish && <TrendingDown className="w-2.5 h-2.5" />}
                  {!isBullish && !isBearish && <Minus className="w-2.5 h-2.5" />}
                  {isBullish ? "BULLISH" : isBearish ? "BEARISH" : "NEUTRAL"}
                </span>
                <motion.button
                  layoutId={`button-${item.title}-${id}`}
                  className="opacity-0 group-hover:opacity-100 px-3 py-1 text-[9px] uppercase tracking-widest rounded-full font-bold bg-[var(--accent)] text-white transition-all mt-2"
                >
                  Analyze
                </motion.button>
              </div>
            </motion.div>
          );
        })}
      </ul>
    </>
  );
}

export const CloseIcon = () => {
  return (
    <motion.svg
      initial={{
        opacity: 0,
      }}
      animate={{
        opacity: 1,
      }}
      exit={{
        opacity: 0,
        transition: {
          duration: 0.05,
        },
      }}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-4 w-4 text-black"
    >
      <path stroke="none" d="M0 0h24v24H0z" fill="none" />
      <path d="M18 6l-12 12" />
      <path d="M6 6l12 12" />
    </motion.svg>
  );
};


