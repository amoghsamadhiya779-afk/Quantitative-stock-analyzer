import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { PanelRightClose, PanelRightOpen } from 'lucide-react';

interface RightRailProps {
  children: React.ReactNode;
  defaultExpanded?: boolean;
}

export const RightRail: React.FC<RightRailProps> = ({ children, defaultExpanded = true }) => {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  return (
    <>
      {/* Desktop view */}
      <motion.aside
        initial={false}
        animate={{ 
          width: isExpanded ? 320 : 0,
          opacity: isExpanded ? 1 : 0,
        }}
        className={`
          relative hidden lg:flex flex-col h-full bg-slate-950/40 backdrop-blur-xl border-l border-white/10
          transition-all duration-300 ease-in-out z-20 shrink-0 shadow-[-4px_0_24px_-12px_rgba(0,0,0,0.5)]
        `}
      >
        <div className="flex-1 h-full min-w-[320px] overflow-hidden">
          {children}
        </div>

        {/* Toggle Button */}
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className={`
            absolute top-4 p-1.5 rounded-l-lg bg-black/60 backdrop-blur-md border border-white/10 border-r-0
            hover:bg-white/10 text-white/70 hover:text-white transition-colors z-30 shadow-lg
            ${isExpanded ? 'right-full' : 'right-0 rounded-r-lg border-r'}
          `}
          title={isExpanded ? "Collapse Watchlist" : "Expand Watchlist"}
        >
          {isExpanded ? <PanelRightClose size={20} /> : <PanelRightOpen size={20} />}
        </button>
      </motion.aside>

      {/* Mobile view - placeholder for bottom sheet */}
      <div className="lg:hidden">
        {/* Mobile implementation would go here */}
      </div>
    </>
  );
};
