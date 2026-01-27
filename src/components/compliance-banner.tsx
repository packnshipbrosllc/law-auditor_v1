'use client';

import { motion } from "framer-motion";
import { Info } from "lucide-react";

export function ComplianceBanner() {
  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-slate-900/50 border border-slate-800 p-4 mb-8 relative group"
    >
      <div className="flex gap-4 items-start">
        <div className="w-8 h-8 border border-gold/20 bg-gold/5 flex items-center justify-center flex-shrink-0">
          <Info className="w-4 h-4 text-gold" />
        </div>
        <div>
          <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-white mb-1">
            Human-in-the-Loop Requirement
          </h4>
          <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest leading-relaxed">
            Notice: LawAuditor is a technology platform. By using this tool, you acknowledge that no attorney-client 
            relationship is formed and you will perform an independent human review of all automated analysis.
          </p>
        </div>
      </div>
    </motion.div>
  );
}


