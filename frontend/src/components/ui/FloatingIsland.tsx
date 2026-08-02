import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { LayoutDashboard, Activity, X, ChevronUp, Globe } from 'lucide-react';
import Link from 'next/link';

interface FloatingIslandProps {
  activeTab: string;
  onTabSelect: (tab: string) => void;
}

export const FloatingIsland: React.FC<FloatingIslandProps> = ({ activeTab, onTabSelect }) => {
  const [expanded, setExpanded] = useState(false);

  const quickNav = [
    { id: 'overview', icon: LayoutDashboard, label: 'Overview' },
    { id: 'technical', icon: Activity, label: 'Technical' },
    { id: 'news-macro', icon: Globe, label: 'Macro' }
  ];

  const handleSelect = (id: string) => {
    onTabSelect(id);
    setExpanded(false);
  };

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[100] md:hidden">
      <motion.div
        initial={{ borderRadius: 32 }}
        animate={{
          width: expanded ? 280 : 'auto',
          height: expanded ? 'auto' : 56,
          borderRadius: expanded ? 24 : 32,
        }}
        transition={{ type: 'spring', stiffness: 400, damping: 30 }}
        className="bg-surface-container-highest/90 backdrop-blur-xl border border-outline-variant shadow-2xl overflow-hidden flex flex-col"
      >
        <AnimatePresence mode="wait">
          {!expanded ? (
            <motion.div
              key="collapsed"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="flex items-center justify-between px-2 h-14"
            >
              <div className="flex items-center gap-1">
                {quickNav.map((item) => {
                  const isActive = activeTab === item.id;
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.id}
                      onClick={() => handleSelect(item.id)}
                      aria-label={item.label}
                      aria-current={isActive ? "page" : undefined}
                      className={`min-w-[44px] min-h-[44px] flex items-center justify-center rounded-full transition-colors ${
                        isActive ? 'bg-secondary/20 text-secondary' : 'text-on-surface hover:bg-surface-variant'
                      }`}
                    >
                      <Icon size={18} />
                    </button>
                  );
                })}
              </div>
              <div className="w-px h-6 bg-outline-variant/50 mx-1" />
              <button
                onClick={() => setExpanded(true)}
                aria-label="Expand navigation"
                className="min-w-[44px] min-h-[44px] flex items-center justify-center text-on-surface hover:text-secondary transition-colors"
              >
                <ChevronUp size={18} />
              </button>
            </motion.div>
          ) : (
            <motion.div
              key="expanded"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="p-4 flex flex-col gap-4"
            >
              <div className="flex justify-between items-center pb-2 border-b border-outline-variant/30">
                <span className="font-label-sm font-bold uppercase tracking-widest text-outline text-[10px]">Navigation</span>
                <button
                  onClick={() => setExpanded(false)}
                  aria-label="Collapse navigation"
                  className="min-w-[44px] min-h-[44px] -mr-2 flex items-center justify-center text-outline hover:text-on-surface"
                >
                  <X size={16} />
                </button>
              </div>
              
              <div className="grid grid-cols-2 gap-2">
                {[
                  { id: 'overview', label: 'Overview' },
                  { id: 'technical', label: 'Technical' },
                  { id: 'ml-prediction', label: 'ML Prediction' },
                  { id: 'portfolio', label: 'Portfolio Opt' },
                  { id: 'risk', label: 'Risk Analytics' },
                  { id: 'backtesting', label: 'Backtesting' },
                  { id: 'news-macro', label: 'News-Macro' },
                ].map((item) => (
                  <button
                    key={item.id}
                    onClick={() => handleSelect(item.id)}
                    className={`text-left text-[12px] p-2 rounded transition-colors ${
                      activeTab === item.id 
                        ? 'bg-secondary text-on-surface font-bold' 
                        : 'bg-surface-variant text-on-surface-variant hover:text-on-surface'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>

              <div className="pt-2 border-t border-outline-variant/30 flex justify-center">
                <Link href="/" className="text-[10px] uppercase tracking-wider font-bold text-outline hover:text-on-surface">
                  Exit Terminal
                </Link>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
};
