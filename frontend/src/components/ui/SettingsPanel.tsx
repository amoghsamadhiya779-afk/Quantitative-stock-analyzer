"use client";

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Moon, Sun, Monitor, Bell, Shield, Key, Eye, Clock, Download, HardDrive } from 'lucide-react';

const cardVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.3, ease: [0.22, 1, 0.36, 1] } },
};

const staggerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.05 },
  },
};

export default function SettingsPanel() {
  const [theme, setTheme] = useState('dark');
  const [notifications, setNotifications] = useState(true);
  const [dataStream, setDataStream] = useState('realtime');

  return (
    <motion.div
      variants={staggerVariants}
      initial="hidden"
      animate="visible"
      className="w-full flex flex-col gap-6"
    >
      <motion.div variants={cardVariants}>
        <h2 className="font-display text-4xl font-bold tracking-tight text-white mb-2">Platform Settings</h2>
        <p className="text-[#A0A0AC] text-sm">Manage your workspace preferences, UI themes, and data streaming configurations.</p>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-4">
        {/* Appearance Settings */}
        <motion.div variants={cardVariants} className="cosmoq-card p-6 flex flex-col gap-6">
          <div className="flex items-center gap-3 border-b border-white/5 pb-4">
            <Monitor className="w-5 h-5 text-indigo-400" />
            <h3 className="font-semibold text-white tracking-wide uppercase text-xs">Appearance & Theme</h3>
          </div>
          
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-neutral-300">Interface Theme</span>
              <div className="flex items-center bg-black/40 border border-white/10 rounded-full p-1 gap-1">
                <button
                  onClick={() => setTheme('dark')}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${theme === 'dark' ? 'bg-white/10 text-white' : 'text-neutral-500 hover:text-white'}`}
                >
                  <Moon className="w-3 h-3" /> Dark
                </button>
                <button
                  onClick={() => setTheme('light')}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${theme === 'light' ? 'bg-white/10 text-white' : 'text-neutral-500 hover:text-white'}`}
                >
                  <Sun className="w-3 h-3" /> Light
                </button>
              </div>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-sm text-neutral-300">Reduced Motion</span>
              <button className="relative w-10 h-5 bg-white/10 rounded-full transition-colors">
                <div className="absolute left-1 top-1 w-3 h-3 bg-neutral-400 rounded-full" />
              </button>
            </div>
          </div>
        </motion.div>

        {/* Data Configuration */}
        <motion.div variants={cardVariants} className="cosmoq-card p-6 flex flex-col gap-6">
          <div className="flex items-center gap-3 border-b border-white/5 pb-4">
            <HardDrive className="w-5 h-5 text-[var(--profit)]" />
            <h3 className="font-semibold text-white tracking-wide uppercase text-xs">Data & Streaming</h3>
          </div>
          
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-neutral-300">Live Tick Rate</span>
              <div className="flex gap-2">
                {['realtime', '1s', '5s'].map(rate => (
                  <button
                    key={rate}
                    onClick={() => setDataStream(rate)}
                    className={`px-3 py-1 rounded border text-xs font-mono uppercase transition-all ${dataStream === rate ? 'bg-white/10 border-white/20 text-white' : 'border-white/5 text-neutral-500 hover:text-white'}`}
                  >
                    {rate}
                  </button>
                ))}
              </div>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-sm text-neutral-300">Cache Global Models</span>
              <button className="relative w-10 h-5 bg-[var(--profit)] rounded-full transition-colors">
                <div className="absolute right-1 top-1 w-3 h-3 bg-black rounded-full" />
              </button>
            </div>
          </div>
        </motion.div>

        {/* Notifications & Alerts */}
        <motion.div variants={cardVariants} className="cosmoq-card p-6 flex flex-col gap-6">
          <div className="flex items-center gap-3 border-b border-white/5 pb-4">
            <Bell className="w-5 h-5 text-amber-400" />
            <h3 className="font-semibold text-white tracking-wide uppercase text-xs">Alerts & Notifications</h3>
          </div>
          
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-neutral-300">ML Prediction Alerts</span>
              <button 
                onClick={() => setNotifications(!notifications)}
                className={`relative w-10 h-5 rounded-full transition-colors ${notifications ? 'bg-[var(--profit)]' : 'bg-white/10'}`}
              >
                <div className={`absolute top-1 w-3 h-3 rounded-full transition-all ${notifications ? 'right-1 bg-black' : 'left-1 bg-neutral-400'}`} />
              </button>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-sm text-neutral-300">Risk Threshold Breaches</span>
              <button className="relative w-10 h-5 bg-[var(--profit)] rounded-full transition-colors">
                <div className="absolute right-1 top-1 w-3 h-3 bg-black rounded-full" />
              </button>
            </div>
          </div>
        </motion.div>

        {/* Security & Access */}
        <motion.div variants={cardVariants} className="cosmoq-card p-6 flex flex-col gap-6">
          <div className="flex items-center gap-3 border-b border-white/5 pb-4">
            <Shield className="w-5 h-5 text-rose-400" />
            <h3 className="font-semibold text-white tracking-wide uppercase text-xs">Security & Access</h3>
          </div>
          
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-neutral-300">API Key (Nexus Broker)</span>
              <button className="flex items-center gap-2 text-xs font-mono px-3 py-1 bg-white/5 border border-white/10 rounded hover:bg-white/10 transition-colors">
                <Eye className="w-3 h-3" /> Reveal Key
              </button>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-sm text-neutral-300">Session Timeout</span>
              <span className="text-xs font-mono text-neutral-500 border border-white/5 px-2 py-1 rounded">30 min</span>
            </div>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}
