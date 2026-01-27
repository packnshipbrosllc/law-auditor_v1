'use client';

import { motion, useSpring, useTransform, animate } from "framer-motion";
import { useEffect, useState } from "react";
import { TrendingDown, ShieldCheck, DollarSign } from "lucide-react";

interface LeakageMeterProps {
  amount: number;
  invoiceCount: number;
}

export function LeakageMeter({ amount, invoiceCount }: LeakageMeterProps) {
  const [displayAmount, setDisplayAmount] = useState(0);

  useEffect(() => {
    const controls = animate(displayAmount, amount, {
      duration: 1.5,
      onUpdate: (value) => setDisplayAmount(value),
      ease: "easeOut",
    });
    return () => controls.stop();
  }, [amount]);

  const formattedAmount = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
  }).format(displayAmount);

  return (
    <div className="sticky top-24 w-full">
      <div className="bg-[#1e3a8a] border border-blue-400/20 p-6 rounded-none shadow-2xl relative overflow-hidden group">
        <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
          <TrendingDown className="w-24 h-24 text-white" />
        </div>
        
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-6">
            <div className="w-8 h-8 bg-white/10 flex items-center justify-center">
              <DollarSign className="w-4 h-4 text-white" />
            </div>
            <h3 className="text-xs font-black uppercase tracking-[0.2em] text-blue-100">
              At-Risk Revenue
            </h3>
          </div>

          <div className="mb-8">
            <div className="text-4xl font-mono font-medium text-white tabular-nums tracking-tighter">
              {formattedAmount}
            </div>
            <div className="flex items-center gap-2 mt-2">
              <div className="h-1.5 w-1.5 rounded-full bg-red-500 animate-pulse" />
              <span className="text-[10px] font-bold uppercase tracking-widest text-blue-200">
                Calculated Leakage
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 border-t border-white/10 pt-6">
            <div>
              <div className="text-[9px] font-black text-blue-300 uppercase tracking-widest mb-1">Invoices</div>
              <div className="text-xl font-mono text-white">{invoiceCount}</div>
            </div>
            <div>
              <div className="text-[9px] font-black text-blue-300 uppercase tracking-widest mb-1">Efficiency</div>
              <div className="text-xl font-mono text-white">84.2%</div>
            </div>
          </div>

          <div className="mt-8 pt-6 border-t border-white/10">
            <div className="flex items-center gap-3">
              <ShieldCheck className="w-4 h-4 text-blue-300" />
              <div className="text-[9px] font-bold text-blue-200 uppercase tracking-widest">
                Enterprise Shield Active
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-6 p-4 border border-slate-800 bg-slate-900/20">
        <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest leading-relaxed">
          LawAuditor processes data in-memory. No document content is persisted to permanent storage.
        </p>
      </div>
    </div>
  );
}

