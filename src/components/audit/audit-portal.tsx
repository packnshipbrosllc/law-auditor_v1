'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, Activity, BarChart3, Lock, Search, FileText, LayoutGrid, List, HeartPulse, Briefcase, FileSignature } from 'lucide-react';
import { Dropzone } from './dropzone';
import { LeakageMeter } from './leakage-meter';
import { ViolationFlag, Violation } from './violation-flag';
import { SettlementCalculator } from './settlement-calculator';
import { Button } from '@/components/ui/button';

export function AuditPortal() {
  const [mode, setMode] = useState<'corporate' | 'pi'>('corporate');
  const [isProcessing, setIsProcessing] = useState(false);
  const [violations, setViolations] = useState<Violation[]>([]);
  const [leakage, setLeakage] = useState(0);
  const [medicalSpecials, setMedicalSpecials] = useState(0);
  const [invoiceCount, setInvoiceCount] = useState(0);

  const handleFilesAccepted = async (files: File[]) => {
    setIsProcessing(true);
    setInvoiceCount(prev => prev + files.length);

    // Simulated "Transient UI" logic with loading simulation
    setTimeout(() => {
      let mockViolations: Violation[] = [];
      
      if (mode === 'corporate') {
        mockViolations = [
          {
            id: 'v1',
            type: 'critical',
            title: 'Unauthorized Rate Increase',
            description: 'Line item rate ($450/hr) exceeds approved firm master agreement rate ($400/hr).',
            fix: 'Revert to approved rate or request rate change documentation.',
            line: 42
          },
          {
            id: 'v2',
            type: 'warning',
            title: 'Vague Task Description',
            description: 'Task entry "Review documents" lacks specificity required by UTBMS standards.',
            fix: 'Request detailed task breakdown or apply 10% administrative haircut.',
            line: 115
          }
        ];
        setLeakage(prev => prev + 2150.00);
      } else {
        mockViolations = [
          {
            id: 'm1',
            type: 'critical',
            title: 'Diagnostic Upcoding (CPT 99214)',
            description: 'Level 4 office visit charged ($285) despite patient record supporting only Level 3 criteria.',
            fix: 'Reduce to CPT 99213 ($165) per Medicare baseline rates.',
            line: 12
          },
          {
            id: 'm2',
            type: 'warning',
            title: 'Unbundled Service Detection',
            description: 'Individual charges for "Bandage Application" and "Wound Cleaning" should be bundled under global trauma fee.',
            fix: 'Apply $85.00 unbundling deduction.',
            line: 8
          },
          {
            id: 'm3',
            type: 'critical',
            title: 'Duplicate Provider Billing',
            description: 'Provider #842 submitted identical charges for X-Ray services already billed on 01/12/2026.',
            fix: 'Full $450.00 duplicate line-item rejection.',
            line: 24
          }
        ];
        setMedicalSpecials(prev => prev + 8450.50);
        setLeakage(prev => prev + 700.00); // Amount saved in PI mode
      }

      setViolations(prev => [...mockViolations, ...prev]);
      setIsProcessing(false);
    }, 2000);
  };

  const handleFix = (id: string) => {
    setViolations(prev => prev.filter(v => v.id !== id));
    setLeakage(prev => Math.max(0, prev - 350.00));
  };

  return (
    <div className="min-h-screen bg-white text-slate-900 font-sans antialiased">
      {/* Sacramento Professional Header */}
      <header className="bg-[#1e3a8a] py-8 border-b border-blue-900 shadow-xl">
        <div className="container mx-auto px-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-white flex items-center justify-center rounded shadow-inner">
                {mode === 'corporate' ? <Search className="w-6 h-6 text-[#1e3a8a]" /> : <HeartPulse className="w-6 h-6 text-[#1e3a8a]" />}
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <h1 className="text-2xl font-black tracking-tighter text-white uppercase">
                    {mode === 'corporate' ? 'Audit Portal' : 'PI Settlement Hub'}
                  </h1>
                  <div className="px-2 py-0.5 bg-blue-500/20 border border-blue-400/30 text-blue-100 text-[8px] font-black uppercase tracking-widest">v4.0.2</div>
                </div>
                <div className="flex items-center gap-4 text-blue-200">
                  <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest">
                    <div className="flex bg-blue-900/50 p-1 rounded border border-blue-700/50">
                      <button 
                        onClick={() => { setMode('corporate'); setViolations([]); setLeakage(0); setMedicalSpecials(0); }}
                        className={`px-3 py-1 flex items-center gap-2 transition-all ${mode === 'corporate' ? 'bg-blue-600 text-white shadow-lg' : 'hover:text-white'}`}
                      >
                        <Briefcase className="w-3 h-3" /> Corporate
                      </button>
                      <button 
                        onClick={() => { setMode('pi'); setViolations([]); setLeakage(0); setMedicalSpecials(0); }}
                        className={`px-3 py-1 flex items-center gap-2 transition-all ${mode === 'pi' ? 'bg-blue-600 text-white shadow-lg' : 'hover:text-white'}`}
                      >
                        <HeartPulse className="w-3 h-3" /> PI Mode
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              {mode === 'pi' && (
                <Button variant="outline" className="border-green-400/30 bg-green-500/5 hover:bg-green-500/10 text-green-100 rounded-none h-10 px-6 text-[11px] font-bold uppercase tracking-widest">
                  <FileSignature className="w-4 h-4 mr-2" />
                  Draft Demand
                </Button>
              )}
              <Button variant="outline" className="border-blue-400/30 bg-white/5 hover:bg-white/10 text-white rounded-none h-10 px-6 text-[11px] font-bold uppercase tracking-widest">
                Export Report
              </Button>
              <Button className="bg-blue-600 hover:bg-blue-700 text-white rounded-none h-10 px-6 text-[11px] font-bold uppercase tracking-widest shadow-lg shadow-blue-900/20">
                Finalize Audit
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-6 py-12">
        <div className="grid lg:grid-cols-12 gap-12">
          {/* Main Content Area */}
          <div className="lg:col-span-8 space-y-12">
            {/* Dropzone Section */}
            <section>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xs font-black uppercase tracking-[0.3em] text-slate-500">
                  {mode === 'corporate' ? 'Invoice Intake' : 'Medical Records & Billing'}
                </h2>
                <div className="text-[10px] font-bold text-blue-600 uppercase tracking-widest">Max 50MB per file</div>
              </div>
              <Dropzone onFilesAccepted={handleFilesAccepted} isProcessing={isProcessing} />
            </section>

            {/* Audit Results HUD */}
            <section>
              <div className="flex items-center justify-between mb-8 pb-4 border-b border-slate-100">
                <div className="flex items-center gap-3">
                  <h2 className="text-sm font-black uppercase tracking-[0.2em] text-[#1e3a8a]">
                    {mode === 'corporate' ? 'Audit HUD' : 'Medical Specials HUD'}
                  </h2>
                  <span className="px-2 py-0.5 bg-slate-100 text-slate-600 text-[9px] font-bold rounded-full">
                    {violations.length} Flags Detected
                  </span>
                </div>
                <div className="flex gap-2">
                  <button className="p-2 bg-slate-100 text-[#1e3a8a] hover:bg-[#1e3a8a] hover:text-white transition-colors">
                    <LayoutGrid className="w-4 h-4" />
                  </button>
                  <button className="p-2 bg-slate-100 text-slate-400">
                    <List className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="min-h-[400px]">
                <AnimatePresence mode="popLayout">
                  {violations.length > 0 ? (
                    violations.map((v) => (
                      <ViolationFlag key={v.id} violation={v} onFix={handleFix} />
                    ))
                  ) : (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="h-full flex flex-col items-center justify-center text-center py-24 bg-slate-50/50 border border-dashed border-slate-200"
                    >
                      <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mb-6 shadow-sm border border-slate-100">
                        <FileText className="w-8 h-8 text-slate-300" />
                      </div>
                      <h3 className="text-sm font-black uppercase tracking-[0.2em] text-slate-400 mb-2">No Violations Detected</h3>
                      <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 max-w-xs mx-auto leading-relaxed">
                        {mode === 'corporate' 
                          ? 'Upload legal invoices to begin real-time data analysis for inconsistencies.'
                          : 'Upload medical invoices to detect upcoding, unbundling, and duplicate charges.'}
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </section>
          </div>

          {/* Sidebar */}
          <aside className="lg:col-span-4 space-y-8">
            <LeakageMeter 
              amount={leakage} 
              invoiceCount={invoiceCount} 
              label={mode === 'corporate' ? 'At-Risk Revenue' : 'Billing Leakage Recovery'}
            />
            {mode === 'pi' && (
              <SettlementCalculator medicalSpecials={medicalSpecials} />
            )}
          </aside>
        </div>
      </main>

      <div className="fixed bottom-8 left-8 z-50">
        <div className="flex items-center gap-3 bg-white border border-slate-200 p-3 shadow-2xl rounded-none">
          <div className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-green-600"></span>
          </div>
          <span className="text-[10px] font-black uppercase tracking-widest text-[#1e3a8a]">System Status: Nominal</span>
        </div>
      </div>
    </div>
  );
}

