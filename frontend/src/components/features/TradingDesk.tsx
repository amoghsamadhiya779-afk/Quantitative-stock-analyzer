"use client";

import { motion } from "framer-motion";
import { TerminalSquare, Lock } from "lucide-react";
import { useState } from "react";
import type { StockData } from "@/lib/api";

interface Props {
  stockData: StockData | null;
  currency: string;
  selectedTicker: string;
}

export default function TradingDesk({ stockData, currency, selectedTicker }: Props) {
  const [qty, setQty] = useState(100);
  const [orderType, setOrderType] = useState("MARKET");
  const [side, setSide] = useState("BUY (LONG)");
  const [executed, setExecuted] = useState(false);

  const price = stockData?.latest_close || 0;
  const notional = qty * price;

  const handleTransmit = () => {
    setExecuted(true);
    setTimeout(() => setExecuted(false), 3000);
  };

  // Generate order book from real price
  const spread = price * 0.0005;
  const asks = Array.from({ length: 5 }, (_, i) => ({
    price: price + spread * (5 - i),
    qty: Math.floor(Math.random() * 50) + 10,
    total: (Math.random() * 10).toFixed(2),
  }));
  const bids = Array.from({ length: 5 }, (_, i) => ({
    price: price - spread * i,
    qty: Math.floor(Math.random() * 50) + 10,
    total: (Math.random() * 10).toFixed(2),
  }));

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }} className="w-full space-y-5">
      <div className="flex items-center gap-2">
        <TerminalSquare className="text-accent w-4 h-4" />
        <h2 className="text-[10px] tracking-[0.2em] text-foreground/50 font-bold uppercase">L2 Execution & Order Routing</h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Execution Router */}
        <div className="p-5 rounded-xl bg-surface border border-border">
          <h3 className="text-[10px] tracking-widest text-foreground/40 uppercase mb-5">Smart Execution Router</h3>
          <div className="space-y-4">
            <div className="flex gap-3">
              <Field label="Symbol">
                <input type="text" value={selectedTicker} disabled className="w-full bg-background border border-border rounded-lg p-2.5 text-foreground font-mono text-sm opacity-50" />
              </Field>
              <Field label="Action">
                <select value={side} onChange={(e) => setSide(e.target.value)} className="w-full bg-background border border-border rounded-lg p-2.5 text-foreground font-mono text-sm outline-none focus:border-accent">
                  <option>BUY (LONG)</option>
                  <option>SELL (SHORT)</option>
                </select>
              </Field>
            </div>
            <div className="flex gap-3">
              <Field label="Lot Quantity">
                <input type="number" value={qty} onChange={(e) => setQty(Number(e.target.value))} className="w-full bg-background border border-border rounded-lg p-2.5 text-foreground font-mono text-sm outline-none focus:border-accent" />
              </Field>
              <Field label="Order Paradigm">
                <select value={orderType} onChange={(e) => setOrderType(e.target.value)} className="w-full bg-background border border-border rounded-lg p-2.5 text-foreground font-mono text-sm outline-none focus:border-accent">
                  <option>MARKET</option>
                  <option>LIMIT</option>
                  <option>ICEBERG (HIDDEN)</option>
                  <option>TWAP</option>
                  <option>VWAP ALGO</option>
                </select>
              </Field>
            </div>
            <div className="p-5 text-center border border-border rounded-xl bg-black/10">
              <div className="text-[9px] text-foreground/40 uppercase mb-1">Estimated Notional</div>
              <div className="text-2xl font-mono text-accent font-bold">{notional.toLocaleString(undefined, { minimumFractionDigits: 2 })} <span className="text-sm text-foreground/40">{currency}</span></div>
            </div>
            <button onClick={handleTransmit} className={`w-full flex items-center justify-center gap-2 py-3.5 font-bold uppercase tracking-widest text-[10px] rounded-lg transition-all ${executed ? "bg-emerald-500 text-white" : "bg-accent text-background hover:opacity-90"}`}>
              {executed ? "✓ ORDER ROUTED VIA DARK POOL" : <><Lock className="w-3 h-3" /> Transmit Encrypted Order</>}
            </button>
          </div>
        </div>

        {/* Order Book */}
        <div className="p-5 rounded-xl bg-surface border border-border">
          <h3 className="text-[10px] tracking-widest text-foreground/40 uppercase mb-5 text-right">Order Book Matrix (L2)</h3>
          <div className="space-y-0.5 font-mono text-xs">
            <div className="flex justify-between text-[9px] text-foreground/30 uppercase px-2 mb-2">
              <span>Price</span><span>Qty</span><span>Total</span>
            </div>
            {asks.map((a, i) => (
              <div key={`a-${i}`} className="flex justify-between p-2 rounded bg-red-500/10 text-red-400">
                <span>{a.price.toFixed(2)}</span>
                <span>{a.qty}</span>
                <span>{a.total}M</span>
              </div>
            ))}
            <div className="py-2 text-center text-foreground font-bold border-y border-border/50 my-1.5 text-sm">
              {price.toLocaleString(undefined, { minimumFractionDigits: 2 })} <span className="text-[9px] text-foreground/40 ml-2">SPREAD: {(spread * 2).toFixed(2)}</span>
            </div>
            {bids.map((b, i) => (
              <div key={`b-${i}`} className="flex justify-between p-2 rounded bg-emerald-500/10 text-emerald-400">
                <span>{b.price.toFixed(2)}</span>
                <span>{b.qty}</span>
                <span>{b.total}M</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex-1">
      <label className="block text-[9px] uppercase text-foreground/40 mb-1.5 tracking-widest">{label}</label>
      {children}
    </div>
  );
}
