"use client";

import { useEffect, useState, useRef } from "react";
import { motion } from "framer-motion";
import { Play, Pause, Trash2, Cpu, Database, Activity, RefreshCw } from "lucide-react";

interface LogLine {
  timestamp: string;
  level: "INFO" | "DEBUG" | "WARN" | "SUCCESS";
  source: string;
  message: string;
}

const SOURCES = ["FEED-WS", "PARSER-JSON", "DB-WRITER", "REDIS-CACHE", "ROUTER-SOR", "COMPUTE-NODE"];
const MESSAGES = [
  "Recv AAPL trade packet 184.23 x 200 via direct feed",
  "Recv MSFT trade packet 425.50 x 100 via direct feed",
  "Recv NVDA trade packet 875.12 x 500 via direct feed",
  "Committed 50 trades in 1.12ms",
  "Normalized JSON payload size=148B",
  "Flushed Redis cache buffer keys=12",
  "Updated order book depth levels=20 for TSLA",
  "Subscribed to trade channels for AMZN, META, GOOGL",
  "Network round-trip latency calculated: 12ms",
  "Garbage collection executed heap_freed=42MB",
  "Computed real-time imbalance: BID 52% | ASK 48%",
  "Routing block of 5000 AAPL to Dark Pool Aggregator",
];

export default function MarketDataIngestion() {
  const [isPlaying, setIsPlaying] = useState(true);
  const [logs, setLogs] = useState<LogLine[]>([]);
  const [msgRate, setMsgRate] = useState(148);
  const [latency, setLatency] = useState(12.4);
  const logContainerRef = useRef<HTMLDivElement>(null);

  function generateRandomLog(): LogLine {
    const time = new Date();
    const timestamp = time.toLocaleTimeString() + "." + String(time.getMilliseconds()).padStart(3, "0");
    const level = ["INFO", "DEBUG", "WARN", "SUCCESS"][Math.floor(Math.random() * 4)] as any;
    const source = SOURCES[Math.floor(Math.random() * SOURCES.length)];
    const message = MESSAGES[Math.floor(Math.random() * MESSAGES.length)];
    return { timestamp, level, source, message };
  }

  function getLevelColor(level: string) {
    switch (level) {
      case "INFO":
        return "text-blue-400";
      case "DEBUG":
        return "text-neutral-400";
      case "WARN":
        return "text-amber-400";
      case "SUCCESS":
        return "text-emerald-400";
      default:
        return "text-white";
    }
  }

  useEffect(() => {
    // Generate initial logs
    const initialLogs: LogLine[] = [];
    for (let i = 0; i < 20; i++) {
      initialLogs.push(generateRandomLog());
    }
    setLogs(initialLogs);
  }, []);

  useEffect(() => {
    if (!isPlaying) return;

    const interval = setInterval(() => {
      setLogs((prev) => [...prev.slice(-99), generateRandomLog()]);
      setMsgRate((prev) => Math.max(100, Math.min(250, prev + Math.floor(Math.random() * 21) - 10)));
      setLatency((prev) => Math.max(8.0, Math.min(18.0, prev + (Math.random() - 0.5) * 2)));
    }, 450);

    return () => clearInterval(interval);
  }, [isPlaying]);

  useEffect(() => {
    if (logContainerRef.current) {
      logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
    }
  }, [logs]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, ease: "easeOut" }}
      className="w-full flex flex-col gap-6"
    >
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-5 ventriloc-card transition-all duration-300 rounded-[24px] bg-[#0a0a0a] border border-luxury-glass backdrop-blur-md flex items-center justify-between">
          <div>
            <span className="text-[10px] font-semibold uppercase tracking-widest text-neutral-500">Ingestion Rate</span>
            <div className="text-2xl font-bold font-mono text-white mt-1">{msgRate} <span className="text-xs text-neutral-500">msg/sec</span></div>
          </div>
          <Activity className="w-8 h-8 text-orange-500 opacity-80" />
        </div>

        <div className="p-5 ventriloc-card transition-all duration-300 rounded-[24px] bg-[#0a0a0a] border border-luxury-glass backdrop-blur-md flex items-center justify-between">
          <div>
            <span className="text-[10px] font-semibold uppercase tracking-widest text-neutral-500">Ingress Latency</span>
            <div className="text-2xl font-bold font-mono text-white mt-1">{latency.toFixed(2)} <span className="text-xs text-neutral-500">ms</span></div>
          </div>
          <Cpu className="w-8 h-8 text-orange-500 opacity-80" />
        </div>

        <div className="p-5 ventriloc-card transition-all duration-300 rounded-[24px] bg-[#0a0a0a] border border-luxury-glass backdrop-blur-md flex items-center justify-between">
          <div>
            <span className="text-[10px] font-semibold uppercase tracking-widest text-neutral-500">Database Status</span>
            <div className="text-2xl font-bold font-mono text-emerald-400 mt-1">CONNECTED</div>
          </div>
          <Database className="w-8 h-8 text-emerald-500 opacity-80" />
        </div>
      </div>

      {/* Terminal Log Console */}
      <div className="ventriloc-card transition-all duration-300 rounded-[24px] bg-[#050505] border border-luxury-glass backdrop-blur-md p-6 flex flex-col h-[520px] shadow-2xl relative overflow-hidden">
        {/* Console Header */}
        <div className="flex items-center justify-between border-b border-white/5 pb-4 mb-4">
          <div className="flex items-center gap-3">
            <span className="w-3 h-3 rounded-full bg-red-500/80"></span>
            <span className="w-3 h-3 rounded-full bg-yellow-500/80"></span>
            <span className="w-3 h-3 rounded-full bg-emerald-500/80"></span>
            <span className="text-xs font-mono text-neutral-400 ml-2 uppercase tracking-widest">Real-time Stream Ingestion Feed</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsPlaying(!isPlaying)}
              className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-white transition-all duration-200"
            >
              {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
            </button>
            <button
              onClick={() => setLogs([])}
              className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-white transition-all duration-200"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Console Logs */}
        <div
          ref={logContainerRef}
          className="flex-1 overflow-y-auto font-mono text-xs text-neutral-300 space-y-2 pr-2 scrollbar-thin scrollbar-thumb-white/10"
        >
          {logs.length === 0 ? (
            <div className="h-full flex items-center justify-center text-neutral-500 text-[10px] uppercase tracking-widest gap-2">
              <RefreshCw className="w-4 h-4 animate-spin text-orange-500" /> Waiting for data streams...
            </div>
          ) : (
            logs.map((log, index) => (
              <div key={index} className="flex items-start gap-4 hover:bg-white/5 py-1 px-2 rounded transition-colors duration-150 transform-gpu">
                <span className="text-orange-500/70 select-none">{log.timestamp}</span>
                <span className={`font-semibold shrink-0 select-none ${getLevelColor(log.level)}`}>[{log.level}]</span>
                <span className="text-neutral-500 shrink-0 select-none">{log.source}:</span>
                <span className="text-neutral-100 break-all">{log.message}</span>
              </div>
            ))
          )}
        </div>

        {/* Console Footer */}
        <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between text-[9px] uppercase font-mono tracking-widest text-neutral-500">
          <span>Active Feed: WS://live.nexus-quant.com/v1</span>
          <span>Buffer: {logs.length}/100 packets</span>
        </div>
      </div>
    </motion.div>
  );
}
