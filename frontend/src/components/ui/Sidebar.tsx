import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  LayoutDashboard, 
  LineChart, 
  Brain, 
  PieChart, 
  ShieldAlert, 
  History, 
  Globe, 
  ChevronRight,
  Newspaper,
  TrendingUp,
  Activity,
  PanelLeftClose,
  PanelLeftOpen
} from 'lucide-react';

interface SidebarProps {
  activeTab: string;
  onTabSelect: (tab: string) => void;
}

const navItems = [
  { id: 'overview', label: 'Overview', icon: LayoutDashboard },
  { id: 'technical', label: 'Technical Indicators', icon: LineChart },
  { id: 'ml-prediction', label: 'ML Prediction', icon: Brain },
  { id: 'portfolio', label: 'Portfolio Optimization', icon: PieChart },
  { id: 'risk', label: 'Risk Analytics', icon: ShieldAlert },
  { id: 'backtesting', label: 'Backtesting', icon: History },
  { 
    id: 'news-macro', 
    label: 'News-Driven Macro', 
    icon: Globe,
    subItems: [
      { id: 'macro-globe', label: 'Macro Globe', icon: Globe },
      { id: 'live-news', label: 'Live News Feed', icon: Newspaper },
      { id: 'sentiment', label: 'Sentiment History', icon: TrendingUp },
    ]
  },
];

export const Sidebar: React.FC<SidebarProps> = ({ activeTab, onTabSelect }) => {
  const [isPinned, setIsPinned] = useState(true);
  const [isHovered, setIsHovered] = useState(false);
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({});

  const isExpanded = isPinned || isHovered;

  // Ensure groups are expanded if a child is active
  useEffect(() => {
    navItems.forEach(item => {
      if (item.subItems?.some(sub => sub.id === activeTab)) {
        setExpandedGroups(prev => ({ ...prev, [item.id]: true }));
      }
    });
  }, [activeTab]);

  const toggleGroup = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setExpandedGroups(prev => ({ ...prev, [id]: !prev[id] }));
    if (!isPinned) setIsPinned(true);
  };

  const handleSelect = (id: string) => {
    onTabSelect(id);
  };

  return (
    <motion.aside
      initial={false}
      animate={{ width: isExpanded ? 240 : 64 }}
      className={`
        relative flex flex-col h-full bg-surface-container/90 border-r border-outline-variant/30 scroll-surface
        transition-all duration-300 ease-in-out z-30 shadow-[4px_0_24px_-12px_rgba(0,0,0,0.5)]
        hidden md:flex shrink-0
      `}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="flex items-center justify-between p-4 border-b border-outline-variant/30 h-16 shrink-0">
        <AnimatePresence mode="wait">
          {isExpanded ? (
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              className="font-display-md text-[18px] font-bold text-on-surface whitespace-nowrap overflow-hidden flex items-center gap-2.5"
            >
              <Activity className="w-5 h-5 text-secondary" />
              <span>
                QuantTerminal
              </span>
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.5 }}
              className="w-full flex justify-center"
            >
              <Activity className="w-6 h-6 text-secondary" />
            </motion.div>
          )}
        </AnimatePresence>
        
        {isExpanded && (
          <button 
            onClick={() => setIsPinned(!isPinned)}
            className="p-1 rounded hover:bg-surface-variant text-outline hover:text-on-surface transition-colors"
            title={isPinned ? "Unpin sidebar" : "Pin sidebar"}
          >
            {isPinned ? <PanelLeftClose size={18} /> : <PanelLeftOpen size={18} />}
          </button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto overflow-x-hidden py-4 px-2.5 space-y-1 scrollbar-hide" style={{ contain: 'layout paint' }}>
        {navItems.map((item) => {
          const isActive = activeTab === item.id || item.subItems?.some(sub => activeTab === sub.id);
          const Icon = item.icon;
          const hasSubItems = !!item.subItems;
          const isGroupExpanded = expandedGroups[item.id];

          return (
            <div key={item.id} className="flex flex-col">
              <button
                onClick={(e) => hasSubItems ? toggleGroup(item.id, e) : handleSelect(item.id)}
                className={`
                  relative flex items-center w-full px-3 py-2.5 rounded cursor-pointer
                  group transition-colors outline-none
                  ${isActive ? 'text-on-surface' : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-variant'}
                `}
                title={!isExpanded ? item.label : undefined}
              >
                {isActive && (
                  <motion.div
                    layoutId="sidebarActiveTab"
                    className="absolute inset-0 bg-surface-variant rounded border border-outline-variant/30 shadow-[inset_0_1px_1px_rgba(255,255,255,0.02)]"
                    initial={false}
                    transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                  />
                )}
                
                <div className="relative flex items-center w-full min-w-0">
                  <Icon size={20} className={`shrink-0 ${isActive ? 'text-secondary' : 'text-outline group-hover:text-on-surface'} transition-colors`} />
                  
                  <AnimatePresence>
                    {isExpanded && (
                      <motion.span
                        initial={{ opacity: 0, width: 0 }}
                        animate={{ opacity: 1, width: 'auto' }}
                        exit={{ opacity: 0, width: 0 }}
                        className="ml-3.5 whitespace-nowrap overflow-hidden text-sm font-medium tracking-wide"
                      >
                        {item.label}
                      </motion.span>
                    )}
                  </AnimatePresence>

                  {isExpanded && hasSubItems && (
                    <div className="ml-auto flex items-center justify-center w-6 h-6 rounded group-hover:bg-surface-variant z-10 text-outline group-hover:text-on-surface transition-colors" onClick={(e) => toggleGroup(item.id, e)}>
                      <motion.div animate={{ rotate: isGroupExpanded ? 90 : 0 }} transition={{ duration: 0.2 }}>
                        <ChevronRight size={16} />
                      </motion.div>
                    </div>
                  )}
                </div>
              </button>

              <AnimatePresence>
                {isExpanded && hasSubItems && isGroupExpanded && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden ml-[21px] mt-1 space-y-1 border-l-[1px] border-outline-variant/30 pl-2"
                  >
                    {item.subItems.map(subItem => {
                      const isSubActive = activeTab === subItem.id;
                      const SubIcon = subItem.icon;
                      
                      return (
                        <button
                          key={subItem.id}
                          onClick={() => handleSelect(subItem.id)}
                          className={`
                            relative flex items-center w-full px-3 py-2 rounded cursor-pointer
                            group transition-colors outline-none
                            ${isSubActive ? 'text-on-surface' : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-variant'}
                          `}
                        >
                          {isSubActive && (
                            <motion.div
                              layoutId="sidebarActiveTab" // Shares the same layoutId so the active pill moves fluidly across sub-items too
                              className="absolute inset-0 bg-surface-variant rounded border border-outline-variant/30 shadow-[inset_0_1px_1px_rgba(255,255,255,0.02)]"
                              initial={false}
                              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                            />
                          )}
                          <div className="relative flex items-center w-full">
                            <SubIcon size={16} className={`shrink-0 ${isSubActive ? 'text-secondary' : 'text-outline group-hover:text-on-surface'} transition-colors`} />
                            <span className="ml-3 font-label-sm text-[12px] whitespace-nowrap">{subItem.label}</span>
                          </div>
                        </button>
                      );
                    })}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>
      
    </motion.aside>
  );
};
