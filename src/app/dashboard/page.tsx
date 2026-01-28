'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Upload, 
  ShieldCheck, 
  AlertCircle, 
  Loader2, 
  TrendingDown, 
  Gavel, 
  DollarSign,
  ArrowRight,
  CheckCircle2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Header } from '@/components/header';
import { useDropzone } from 'react-dropzone';
import { Violation } from '@/components/audit/violation-flag';

export default function DashboardPage() {
  const [isProcessing, setIsProcessing] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");
  const [violations, setViolations] = useState<Violation[]>([]);
  const [leakage, setLeakage] = useState(0);
  const [hasResults, setHasResults] = useState(false);

  const onDrop = async (acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return;

    setIsProcessing(true);
    setHasResults(false);
    setStatusMessage("Auditing against ABA Rule 1.5...");

    const formData = new FormData();
    acceptedFiles.forEach(file => {
      formData.append('files', file);
    });

    try {
      const response = await fetch('/api/audit', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Analysis failed');
      }

      const data = await response.json();
      setViolations(data.violations);
      setLeakage(data.leakage);
      setHasResults(true);
    } catch (error) {
      console.error('Audit error:', error);
      alert('Failed to process documents. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'text/plain': ['.txt'],
      'text/csv': ['.csv']
    },
    disabled: isProcessing
  });

  return (
    <div className="min-h-screen bg-[#020617] text-slate-50 selection:bg-blue-600 selection:text-white font-sans antialiased relative">
      <Header />

      <main className="container mx-auto px-6 pt-32 pb-24 relative z-10">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-12">
            <div>
              <h1 className="text-4xl font-black tracking-tighter text-white uppercase mb-2">Audit Intelligence Hub</h1>
              <p className="text-slate-400 text-sm font-medium uppercase tracking-widest">Zero-Retention Secure Analysis Engine</p>
            </div>
            
            {hasResults && (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-emerald-500/10 border border-emerald-500/20 p-6 flex flex-col items-end"
              >
                <span className="text-[10px] font-black text-emerald-500 uppercase tracking-[0.2em] mb-1">Total Estimated Savings</span>
                <span className="text-4xl font-mono font-medium text-emerald-400">${leakage.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
              </motion.div>
            )}
          </div>

          <div className="grid lg:grid-cols-12 gap-12">
            <div className="lg:col-span-4">
              <section className="sticky top-32 space-y-6">
                <div
                  {...getRootProps()}
                  className={`relative border-2 border-dashed transition-all duration-300 p-12 text-center rounded-none
                    ${isDragActive ? 'border-gold bg-gold/5 shadow-[0_0_30px_rgba(212,175,55,0.1)]' : 'border-slate-800 bg-slate-900/20 hover:border-slate-700'}
                    ${isProcessing ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                  `}
                >
                  <input {...getInputProps()} />
                  <div className="flex flex-col items-center gap-4">
                    <div className="w-16 h-16 rounded-full bg-slate-800 flex items-center justify-center border border-slate-700">
                      {isProcessing ? (
                        <Loader2 className="w-8 h-8 text-gold animate-spin" />
                      ) : (
                        <Upload className="w-8 h-8 text-slate-400" />
                      )}
                    </div>
                    <div>
                      <h3 className="text-sm font-black uppercase tracking-widest text-white mb-1">
                        {isDragActive ? 'Drop to Audit' : 'Upload Legal Bills'}
                      </h3>
                      <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">PDF, DOCX, TXT, CSV</p>
                    </div>
                  </div>
                </div>

                <div className="p-6 bg-slate-900/40 border border-slate-800 space-y-4">
                  <div className="flex items-center gap-3">
                    <ShieldCheck className="w-4 h-4 text-emerald-500" />
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-300">Zero-Retention Security</span>
                  </div>
                  <p className="text-[10px] leading-relaxed text-slate-500 font-bold uppercase tracking-widest">
                    Documents are processed in volatile RAM only. No PII or content is persisted to disk. Ephemeral encryption active.
                  </p>
                </div>
              </section>
            </div>

            <div className="lg:col-span-8">
              <AnimatePresence mode="wait">
                {isProcessing ? (
                  <motion.div
                    key="loading"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="flex flex-col items-center justify-center py-32 text-center"
                  >
                    <Loader2 className="w-12 h-12 text-gold animate-spin mb-6" />
                    <h3 className="text-xl font-black uppercase tracking-widest text-white animate-pulse">{statusMessage}</h3>
                    <p className="text-slate-500 text-[10px] font-bold uppercase tracking-[0.2em] mt-4">Cross-referencing with institutional OCG benchmarks</p>
                  </motion.div>
                ) : hasResults ? (
                  <motion.div
                    key="results"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="space-y-8"
                  >
                    <div className="flex items-center justify-between pb-4 border-b border-slate-800">
                      <h2 className="text-sm font-black uppercase tracking-[0.3em] text-gold">Recovery Table</h2>
                      <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">{violations.length} DISCREPANCIES IDENTIFIED</span>
                    </div>

                    <div className="overflow-x-auto">
                      <table className="w-full border-collapse">
                        <thead>
                          <tr className="border-b border-slate-800 text-left">
                            <th className="py-4 text-[10px] font-black uppercase tracking-widest text-slate-500">Classification</th>
                            <th className="py-4 text-[10px] font-black uppercase tracking-widest text-slate-500">Violation / Guideline</th>
                            <th className="py-4 text-[10px] font-black uppercase tracking-widest text-slate-500 text-right">Potential Recovery</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800/50">
                          {violations.map((v, i) => (
                            <motion.tr 
                              key={i}
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: i * 0.05 }}
                              className="group hover:bg-white/[0.02] transition-colors"
                            >
                              <td className="py-6 pr-4 align-top">
                                <span className={`inline-flex px-2 py-0.5 text-[8px] font-black uppercase tracking-widest border ${
                                  v.type === 'critical' ? 'border-red-500/30 bg-red-500/10 text-red-400' : 'border-amber-500/30 bg-amber-500/10 text-amber-400'
                                }`}>
                                  {v.type}
                                </span>
                              </td>
                              <td className="py-6 pr-4 align-top">
                                <div className="space-y-1">
                                  <div className="text-xs font-black uppercase tracking-widest text-white">{v.title}</div>
                                  <div className="text-[10px] text-slate-500 font-medium leading-relaxed max-w-md">{v.description}</div>
                                  <div className="pt-2 flex items-center gap-2">
                                    <span className="text-[8px] font-black text-blue-400 uppercase tracking-widest px-1.5 py-0.5 border border-blue-400/20 bg-blue-400/5">
                                      {v.ruleCited}
                                    </span>
                                  </div>
                                </div>
                              </td>
                              <td className="py-6 text-right align-top">
                                <span className="text-sm font-mono font-medium text-emerald-400">
                                  ${v.potentialRecovery.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                </span>
                              </td>
                            </motion.tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    <div className="pt-12 border-t border-slate-800">
                      <div className="bg-blue-600/5 border border-blue-500/20 p-8 flex flex-col md:flex-row items-center justify-between gap-8">
                        <div>
                          <h4 className="text-lg font-black uppercase tracking-widest text-white mb-2">Finalize Recovery Report</h4>
                          <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Generate certified PDF for dispute resolution or institutional filing.</p>
                        </div>
                        <Button className="bg-gold hover:bg-gold-light text-[#020617] px-8 h-12 text-xs font-black uppercase tracking-widest rounded-none whitespace-nowrap">
                          Export Full Analysis <ArrowRight className="ml-2 w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </motion.div>
                ) : (
                  <div className="h-[400px] flex flex-col items-center justify-center border border-dashed border-slate-800 bg-slate-900/10 text-center p-12">
                    <Gavel className="w-12 h-12 text-slate-700 mb-6" />
                    <h3 className="text-sm font-black uppercase tracking-[0.2em] text-slate-500 mb-2">No Active Audit</h3>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-slate-600 max-w-xs mx-auto leading-relaxed">
                      Upload institutional legal or medical invoices to initiate the Zero-Retention AI Audit Engine.
                    </p>
                  </div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </main>

      <footer className="py-12 border-t border-slate-800 relative z-10">
        <div className="container mx-auto px-6 text-center">
          <p className="text-[9px] font-bold text-slate-600 uppercase tracking-[0.3em]">
            LawAuditor Analysis Report // Success fee is a software licensing cost based on data-processing volume and accuracy benchmarks.
          </p>
        </div>
      </footer>
    </div>
  );
}

