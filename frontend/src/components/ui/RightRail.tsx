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
          relative hidden lg:flex flex-col h-full bg-surface-container/90 border-l border-outline-variant/30 scroll-surface
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
            absolute top-4 p-1.5 rounded-l border border-outline-variant/30 border-r-0 bg-surface-container backdrop-blur-md
            hover:bg-surface-variant text-outline hover:text-on-surface transition-colors z-30 shadow-lg
            ${isExpanded ? 'right-full' : 'right-0 rounded-r border-r'}
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
