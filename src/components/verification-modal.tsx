'use client';

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { CheckCircle2, ShieldAlert } from "lucide-react";
import { getActiveStateMetadata } from "@/config/siteConfig";

interface VerificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onVerify: () => void;
  stateCode?: string;
}

export function VerificationModal({ isOpen, onClose, onVerify, stateCode }: VerificationModalProps) {
  const [isChecked, setIsChecked] = useState(false);
  const metadata = getActiveStateMetadata(stateCode);

  const handleVerify = () => {
    if (isChecked) {
      onVerify();
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-[#020617] border-slate-800 text-slate-50 max-w-md rounded-none">
        <DialogHeader>
          <div className="w-12 h-12 border border-blue-500/20 bg-blue-500/5 flex items-center justify-center mb-4">
            <ShieldAlert className="w-6 h-6 text-blue-500" />
          </div>
          <DialogTitle className="text-xl font-black uppercase tracking-tighter text-white">
            Professional Verification
          </DialogTitle>
          <DialogDescription className="text-slate-400 text-sm font-medium leading-relaxed pt-2">
            {metadata.disclosureText}
          </DialogDescription>
        </DialogHeader>

        <div className="py-6">
          <label className="flex items-start gap-4 cursor-pointer group bg-slate-900/30 p-4 border border-slate-800/50 hover:border-blue-500/30 transition-colors">
            <div className="relative flex items-center mt-1">
              <input
                type="checkbox"
                checked={isChecked}
                onChange={(e) => setIsChecked(e.target.checked)}
                className="w-5 h-5 appearance-none border border-slate-700 bg-slate-950 checked:bg-blue-600 checked:border-blue-600 transition-all cursor-pointer"
              />
              {isChecked && (
                <CheckCircle2 className="absolute w-3 h-3 text-white left-1 pointer-events-none" />
              )}
            </div>
            <span className="text-[11px] font-bold uppercase tracking-widest text-slate-300 leading-relaxed">
              I understand this is an automated analysis tool. I am a professional user and will perform an independent human review of these findings before taking any action.
            </span>
          </label>
        </div>

        <DialogFooter className="sm:justify-start">
          <Button
            onClick={handleVerify}
            disabled={!isChecked}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-black uppercase tracking-[0.2em] rounded-none h-12 disabled:opacity-30 transition-all"
          >
            Access Analysis Results
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

