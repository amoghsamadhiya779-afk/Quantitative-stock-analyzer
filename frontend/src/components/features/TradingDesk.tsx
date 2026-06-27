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
    <motion.div initial={{ opacity: 0, y: 30, filter: "blur(4px)" }} animate={{ opacity: 1, y: 0, filter: "blur(0px)" }} transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }} className="w-full space-y-8">
      <div className="flex items-center gap-3 border-b border-[var(--border)] pb-4">
        <TerminalSquare className="text-[var(--accent)] w-5 h-5" />
        <h2 className="text-xs tracking-[0.2em] text-[var(--color-carbon)] font-bold uppercase">L2 Execution & Order Routing</h2>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
        {/* Execution Router */}
        <div className="p-8 lg:p-10 ventriloc-card bg-white transition-all duration-500 hover:-translate-y-1">
          <h3 className="text-[10px] tracking-widest text-[var(--color-slate)] uppercase font-semibold mb-8">Smart Execution Router</h3>
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row gap-6">
              <Field label="Symbol">
                <input type="text" value={selectedTicker} disabled className="w-full bg-[var(--color-fog)] border border-[var(--border)] rounded-card p-4 text-[var(--color-carbon)] font-mono text-sm opacity-60 cursor-not-allowed" />
              </Field>
              <Field label="Action">
                <select value={side} onChange={(e) => setSide(e.target.value)} className="w-full bg-[var(--color-fog)] border border-[var(--border)] rounded-card p-4 text-[var(--color-carbon)] font-mono text-sm outline-none focus:border-[var(--accent)] focus:ring-1 focus:ring-[var(--accent)] transition-all cursor-pointer">
                  <option>BUY (LONG)</option>
                  <option>SELL (SHORT)</option>
                </select>
              </Field>
            </div>
            <div className="flex flex-col sm:flex-row gap-6">
              <Field label="Lot Quantity">
                <input type="number" value={qty} onChange={(e) => setQty(Number(e.target.value))} className="w-full bg-[var(--color-fog)] border border-[var(--border)] rounded-card p-4 text-[var(--color-carbon)] font-mono text-sm outline-none focus:border-[var(--accent)] focus:ring-1 focus:ring-[var(--accent)] transition-all" />
              </Field>
              <Field label="Order Paradigm">
                <select value={orderType} onChange={(e) => setOrderType(e.target.value)} className="w-full bg-[var(--color-fog)] border border-[var(--border)] rounded-card p-4 text-[var(--color-carbon)] font-mono text-sm outline-none focus:border-[var(--accent)] focus:ring-1 focus:ring-[var(--accent)] transition-all cursor-pointer">
                  <option>MARKET</option>
                  <option>LIMIT</option>
                  <option>ICEBERG (HIDDEN)</option>
                  <option>TWAP</option>
                  <option>VWAP ALGO</option>
                </select>
              </Field>
            </div>
            <div className="p-8 text-center border border-[var(--border)] rounded-card bg-[var(--color-mist)] mt-4">
              <div className="text-[10px] text-[var(--color-slate)] font-semibold tracking-widest uppercase mb-2">Estimated Notional</div>
              <div className="text-4xl font-mono text-[var(--color-carbon)] font-bold">{notional.toLocaleString(undefined, { minimumFractionDigits: 2 })} <span className="text-lg text-[var(--color-slate)] font-medium ml-1">{currency}</span></div>
            </div>
            <button onClick={handleTransmit} className={`w-full flex items-center justify-center gap-3 py-5 font-bold uppercase tracking-[0.2em] text-xs rounded-button transition-all duration-500 mt-6 ${executed ? "bg-[var(--profit)] text-white scale-[0.98]" : "bg-[var(--color-carbon)] text-white hover:bg-[var(--color-graphite)] hover:-translate-y-1 hover:shadow-card"}`}>
              {executed ? "✓ ORDER ROUTED VIA DARK POOL" : <><Lock className="w-4 h-4" /> Transmit Encrypted Order</>}
            </button>
          </div>
        </div>

        {/* Order Book */}
        <div className="p-8 lg:p-10 ventriloc-card bg-white transition-all duration-500 hover:-translate-y-1">
          <h3 className="text-[10px] tracking-widest text-[var(--color-slate)] uppercase font-semibold mb-8 text-right">Order Book Matrix (L2)</h3>
          <div className="space-y-1 font-mono text-sm bg-[var(--color-fog)] p-6 rounded-card">
            <div className="flex justify-between text-[10px] font-semibold text-[var(--color-slate)] uppercase px-4 mb-4 border-b border-[var(--border)] pb-2">
              <span>Price</span><span>Qty</span><span>Total</span>
            </div>
            {asks.map((a, i) => (
              <div key={`a-${i}`} className="flex justify-between p-3 rounded bg-[var(--loss)]/5 text-[var(--loss)] font-medium hover:bg-[var(--loss)]/10 transition-colors">
                <span>{a.price.toFixed(2)}</span>
                <span>{a.qty}</span>
                <span>{a.total}M</span>
              </div>
            ))}
            <div className="py-6 text-center text-[var(--color-carbon)] font-bold border-y border-[var(--border)] my-4 text-xl">
              {price.toLocaleString(undefined, { minimumFractionDigits: 2 })} <span className="text-[10px] text-[var(--color-slate)] ml-3 tracking-widest font-semibold">SPREAD: {(spread * 2).toFixed(2)}</span>
            </div>
            {bids.map((b, i) => (
              <div key={`b-${i}`} className="flex justify-between p-3 rounded bg-[var(--profit)]/5 text-[var(--profit)] font-medium hover:bg-[var(--profit)]/10 transition-colors">
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
      <label className="block text-[10px] font-semibold uppercase text-[var(--color-slate)] mb-2.5 tracking-[0.1em]">{label}</label>
      {children}
    </div>
  );
}
