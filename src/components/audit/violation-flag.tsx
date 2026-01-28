'use client';

import { motion } from "framer-motion";
import { AlertCircle, AlertTriangle, CheckCircle2, Info } from "lucide-react";
import { Button } from "@/components/ui/button";

export type ViolationType = 'critical' | 'warning';

export interface Violation {
  id: string;
  type: ViolationType;
  title: string;
  description: string;
  fix: string;
  line?: number;
  potentialRecovery: number;
  ruleCited?: string;
}

interface ViolationFlagProps {
  violation: Violation;
  onFix?: (id: string) => void;
}

export function ViolationFlag({ violation, onFix }: ViolationFlagProps) {
  const isCritical = violation.type === 'critical';

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      className={`p-4 border-l-4 ${
        isCritical ? 'border-red-500 bg-red-50/10' : 'border-amber-500 bg-amber-50/10'
      } border-y border-r border-slate-800 mb-4 group relative`}
    >
      <div className="flex gap-4">
        <div className="flex-shrink-0 mt-1">
          {isCritical ? (
            <AlertCircle className="w-5 h-5 text-red-500" />
          ) : (
            <AlertTriangle className="w-5 h-5 text-amber-500" />
          )}
        </div>
        <div className="flex-1">
          <div className="flex items-center justify-between mb-1">
            <h4 className="text-[11px] font-black uppercase tracking-widest text-slate-200">
              {violation.title}
              {violation.line && <span className="text-slate-500 ml-2">LINE {violation.line}</span>}
            </h4>
            <span className={`text-[9px] font-black px-1.5 py-0.5 uppercase tracking-tighter ${
              isCritical ? 'bg-red-500/20 text-red-400' : 'bg-amber-500/20 text-amber-400'
            }`}>
              {isCritical ? 'Rejection Risk' : 'Guideline Violation'}
            </span>
          </div>
          <p className="text-slate-400 text-[10px] leading-relaxed font-medium mb-3">
            {violation.description}
          </p>
          {violation.ruleCited && (
            <div className="mb-4 flex items-start gap-2 p-2 bg-blue-500/5 border border-blue-500/10">
              <Info className="w-3 h-3 text-blue-400 mt-0.5" />
              <span className="text-[9px] font-bold text-blue-400 uppercase tracking-widest">
                Citation: {violation.ruleCited}
              </span>
            </div>
          )}
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onFix?.(violation.id)}
              className="h-7 text-[9px] font-black uppercase tracking-widest border-slate-700 bg-transparent hover:bg-slate-800 text-slate-300 rounded-none px-4"
            >
              Suggested Fix
            </Button>
            <div className="flex items-center gap-1.5 px-3 py-1 bg-emerald-500/10 border border-emerald-500/20">
              <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Potential Recovery:</span>
              <span className="text-[10px] font-mono font-black text-emerald-500">${violation.potentialRecovery.toLocaleString()}</span>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}


