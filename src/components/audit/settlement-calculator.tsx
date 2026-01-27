'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Calculator, DollarSign, ArrowDownRight, User, Scale, ClipboardList } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface SettlementCalculatorProps {
  medicalSpecials: number;
  initialSettlement?: number;
  initialFeePercent?: number;
}

export function SettlementCalculator({ 
  medicalSpecials, 
  initialSettlement = 0, 
  initialFeePercent = 33.33 
}: SettlementCalculatorProps) {
  const [settlement, setSettlement] = useState(initialSettlement);
  const [feePercent, setFeePercent] = useState(initialFeePercent);
  const [advancedCosts, setAdvancedCosts] = useState(0);
  const [clientNet, setClientNet] = useState(0);

  useEffect(() => {
    setSettlement(initialSettlement);
    setFeePercent(initialFeePercent);
  }, [initialSettlement, initialFeePercent]);

  useEffect(() => {
    const fee = settlement * (feePercent / 100);
    const net = settlement - fee - medicalSpecials - advancedCosts;
    setClientNet(Math.max(0, net));
  }, [settlement, feePercent, medicalSpecials, advancedCosts]);

  return (
    <div className="bg-slate-50 border border-slate-200 p-6 rounded-none shadow-xl">
      <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-100">
        <div className="w-10 h-10 bg-[#1e3a8a] flex items-center justify-center rounded shadow-lg">
          <Calculator className="w-5 h-5 text-white" />
        </div>
        <div>
          <h3 className="text-sm font-black uppercase tracking-widest text-[#1e3a8a]">Net Recovery Calculator</h3>
          <p className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">Human-in-the-Loop Decision Support</p>
        </div>
      </div>

      <div className="space-y-6">
        {/* Total Settlement */}
        <div className="space-y-2">
          <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Gross Settlement</label>
          <div className="relative">
            <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input 
              type="number" 
              value={settlement || ''} 
              onChange={(e) => setSettlement(parseFloat(e.target.value) || 0)}
              placeholder="0.00"
              className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 text-lg font-mono focus:border-[#1e3a8a] outline-none transition-colors"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          {/* Fee % */}
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Attorney Fee %</label>
            <input 
              type="number" 
              value={feePercent} 
              onChange={(e) => setFeePercent(parseFloat(e.target.value) || 0)}
              className="w-full px-4 py-2 bg-white border border-slate-200 font-mono focus:border-[#1e3a8a] outline-none"
            />
          </div>
          {/* Costs */}
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Advanced Costs</label>
            <input 
              type="number" 
              value={advancedCosts || ''} 
              onChange={(e) => setAdvancedCosts(parseFloat(e.target.value) || 0)}
              placeholder="0.00"
              className="w-full px-4 py-2 bg-white border border-slate-200 font-mono focus:border-[#1e3a8a] outline-none"
            />
          </div>
        </div>

        {/* Audited Specials (Read Only) */}
        <div className="p-4 bg-slate-100/50 border border-slate-200 flex justify-between items-center">
          <div>
            <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Audited Med. Specials</div>
            <div className="text-sm font-mono font-bold text-slate-700">
              ${medicalSpecials.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </div>
          </div>
          <div className="px-2 py-1 bg-green-100 text-green-700 text-[8px] font-black uppercase rounded">Verified</div>
        </div>

        {/* Net Result */}
        <div className="pt-6 border-t border-dashed border-slate-200">
          <div className="bg-[#1e3a8a] p-6 text-center shadow-inner relative overflow-hidden group">
            <div className="absolute inset-0 bg-blue-400/5 group-hover:bg-blue-400/10 transition-colors" />
            <div className="relative z-10">
              <div className="text-[10px] font-black text-blue-200 uppercase tracking-[0.2em] mb-2">Estimated Client Net</div>
              <div className="text-4xl font-mono font-medium text-white tabular-nums tracking-tighter">
                ${clientNet.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </div>
              <div className="mt-4 flex items-center justify-center gap-2">
                <div className="h-1 w-1 rounded-full bg-blue-400 animate-ping" />
                <span className="text-[8px] font-bold text-blue-300 uppercase tracking-widest">Live Pro-Forma Calculation</span>
              </div>
            </div>
          </div>
        </div>

        <Button className="w-full h-12 bg-white border border-[#1e3a8a] text-[#1e3a8a] hover:bg-slate-50 rounded-none font-black uppercase tracking-widest text-[11px] gap-2">
          <ClipboardList className="w-4 h-4" />
          Export Settlement Statement
        </Button>
      </div>
    </div>
  );
}

