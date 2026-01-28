'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { ShieldCheck, Upload, AlertCircle } from 'lucide-react';

export default function LawAuditorDropZone() {
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* 🏛️ Legal Compliance Header */}
      <div className="bg-slate-900/50 border border-gold/30 rounded-none p-4 mb-8">
        <div className="flex items-start gap-3">
          <AlertCircle className="text-gold mt-1" size={20} />
          <div>
            <h4 className="text-gold font-black text-[10px] uppercase tracking-widest">Legal Disclosure & Compliance</h4>
            <p className="text-slate-400 text-[10px] mt-1 leading-relaxed font-bold uppercase tracking-widest">
              LawAuditor is a SaaS data-analysis platform. We do not provide legal advice, and no attorney-client relationship 
              is formed. By uploading, you confirm this data is for clerical auditing purposes. 
              Data is encrypted and auto-deleted after 48 hours per our "Secure Shred" protocol.
            </p>
            <label className="flex items-center gap-2 mt-3 cursor-pointer group">
              <input 
                type="checkbox" 
                checked={acceptedTerms}
                onChange={(e) => setAcceptedTerms(e.target.checked)}
                className="rounded-none border-slate-700 bg-slate-800 text-gold focus:ring-gold"
              />
              <span className="text-slate-300 text-[9px] font-black uppercase tracking-widest group-hover:text-gold transition-colors">I acknowledge and accept the terms of service.</span>
            </label>
          </div>
        </div>
      </div>

      {/* 🚀 The "Medallion" Drop Zone */}
      <motion.div
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        className={`relative group border-2 border-dashed rounded-none p-12 transition-all duration-300 text-center
          ${acceptedTerms ? 'cursor-pointer' : 'cursor-not-allowed opacity-50'}
          ${isDragging ? 'border-gold bg-gold/5 shadow-[0_0_30px_rgba(212,175,55,0.1)]' : 'border-slate-800 bg-slate-900/20'}
        `}
      >
        <div className="flex flex-col items-center gap-4">
          <div className={`p-4 rounded-full bg-slate-800 border border-slate-700 transition-transform duration-500 ${isDragging ? 'scale-110' : ''}`}>
            {/* Medallion Icon Effect */}
            <div className="h-16 w-16 rounded-full bg-gradient-to-br from-gold-light to-gold flex items-center justify-center shadow-inner">
               <Upload className="text-[#020617]" size={32} />
            </div>
          </div>
          
          <div>
            <h3 className="text-xl font-black uppercase tracking-tighter text-white">Upload Legal or Medical Bills</h3>
            <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest mt-2">Drag & Drop PDF, CSV, or XLSX (Max 20MB)</p>
          </div>

          {!acceptedTerms && (
            <div className="absolute inset-0 z-10 bg-[#020617]/40 backdrop-blur-[1px] flex items-center justify-center">
               <span className="bg-slate-900 text-gold-light px-6 py-2 rounded-none text-[9px] font-black border border-gold/30 uppercase tracking-widest">Accept Terms to Enable</span>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}

