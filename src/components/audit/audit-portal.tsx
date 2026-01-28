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
  const [isSampleData, setIsSampleData] = useState(false);

  const loadSampleData = () => {
    setIsSampleData(true);
    setMode('pi');
    setIsProcessing(true);
    
    setTimeout(() => {
      const sampleViolations: Violation[] = [
        {
          id: 's1',
          type: 'critical',
          title: 'Upcoded Evaluation (CPT 99215)',
          description: 'Provider charged for Comprehensive Complexity ($385) while patient records indicate Low Complexity (Level 3).',
          fix: 'Re-code to CPT 99213 ($165). Savings: $220.00',
          line: 1,
          potentialRecovery: 220.00,
          ruleCited: 'AMA CPT Guidelines: Level 5 vs Level 3 Medical Decision Making'
        },
        {
          id: 's2',
          type: 'critical',
          title: 'Duplicate MRI Charge',
          description: 'Identical charge for Lumbar MRI detected from both the surgical center and the imaging hub.',
          fix: 'Reject duplicate $1,250.00 imaging fee.',
          line: 14,
          potentialRecovery: 1250.00,
          ruleCited: 'OCG § 8.4: Prohibition of Duplicate Diagnostic Billing'
        },
        {
          id: 's3',
          type: 'warning',
          title: 'Unbundled Surgical Tray',
          description: 'Surgical tray supplies billed separately from the primary procedure fee.',
          fix: 'Deduct $450.00 unbundled supply cost.',
          line: 22,
          potentialRecovery: 450.00,
          ruleCited: 'CMS NCCI Manual: Surgical Procedure Bundling Rules'
        },
        {
          id: 's4',
          type: 'critical',
          title: 'Unauthorized Assistant Surgeon',
          description: 'Charge for Assistant Surgeon ($1,800) not pre-authorized or medically necessary for this procedure.',
          fix: 'Full rejection of assistant surgeon fee.',
          line: 5,
          potentialRecovery: 1800.00,
          ruleCited: 'OCG § 3.2: Assistant Surgeon Pre-Authorization Requirements'
        },
        {
          id: 's5',
          type: 'warning',
          title: 'Phantom Physical Therapy',
          description: 'Charge for 60 minutes of PT manual therapy; records show patient was in the facility for only 30 minutes.',
          fix: 'Apply 50% haircut to therapy time entries.',
          line: 31,
          potentialRecovery: 450.00,
          ruleCited: 'Medicare Benefit Policy Manual Ch. 15 § 220.3'
        },
        {
          id: 's6',
          type: 'warning',
          title: 'Administrative Surcharge',
          description: 'Medical record retrieval fee ($75) exceeds state-mandated maximum for non-litigation requests.',
          fix: 'Cap at $25.00 statutory limit.',
          line: 45,
          potentialRecovery: 50.00,
          ruleCited: 'FL Stat. § 456.057: Limits on Medical Record Copying Fees'
        }
      ];

      setViolations(sampleViolations);
      setMedicalSpecials(12450.00);
      setLeakage(4250.00);
      setInvoiceCount(1);
      setIsProcessing(false);
    }, 1500);
  };

  const handleFilesAccepted = async (files: File[]) => {
    setIsSampleData(false);
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
            line: 42,
            potentialRecovery: 1250.00,
            ruleCited: 'MSA § 2.1: Negotiated Rate Lock Provision'
          },
          {
            id: 'v2',
            type: 'warning',
            title: 'Task Inflation (Email)',
            description: 'Routine email response billed at 1.0 hour. Benchmark for administrative email correspondence is 0.1 - 0.2 hours.',
            fix: 'Apply 0.2hr benchmark cap. Savings: $400.00',
            line: 115,
            potentialRecovery: 400.00,
            ruleCited: 'OCG § 5.3: Efficiency Benchmarking for Routine Correspondence'
          }
        ];
        setLeakage(prev => prev + 1650.00);
      } else {
        mockViolations = [
          {
            id: 'm1',
            type: 'critical',
            title: 'Diagnostic Upcoding (CPT 99214)',
            description: 'Level 4 office visit charged ($285) despite patient record supporting only Level 3 criteria.',
            fix: 'Reduce to CPT 99213 ($165) per Medicare baseline rates.',
            line: 12,
            potentialRecovery: 120.00,
            ruleCited: 'CPT § 99213: Medical Decision Making Level Benchmarks'
          },
          {
            id: 'm2',
            type: 'warning',
            title: 'Unbundled Service Detection',
            description: 'Individual charges for "Bandage Application" and "Wound Cleaning" should be bundled under global trauma fee.',
            fix: 'Apply $85.00 unbundling deduction.',
            line: 8,
            potentialRecovery: 85.00,
            ruleCited: 'CCI § 4.1: Global Procedure Bundling Guidelines'
          },
          {
            id: 'm3',
            type: 'critical',
            title: 'Duplicate Provider Billing',
            description: 'Provider #842 submitted identical charges for X-Ray services already billed on 01/12/2026.',
            fix: 'Full $450.00 duplicate line-item rejection.',
            line: 24,
            potentialRecovery: 450.00,
            ruleCited: 'OCG § 8.4: Prohibition of Duplicate Charge Submission'
          }
        ];
        setMedicalSpecials(prev => prev + 8450.50);
        setLeakage(prev => prev + 655.00); // Amount saved in PI mode (sum of mockViolations)
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
                {mode === 'corporate' ? <Search className="w-6 h-6 text-gold" /> : <HeartPulse className="w-6 h-6 text-gold" />}
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
                        className={`px-3 py-1 flex items-center gap-2 transition-all ${mode === 'corporate' ? 'bg-gold text-[#020617] shadow-lg' : 'hover:text-white'}`}
                      >
                        <Briefcase className="w-3 h-3" /> Corporate
                      </button>
                      <button 
                        onClick={() => { setMode('pi'); setViolations([]); setLeakage(0); setMedicalSpecials(0); }}
                        className={`px-3 py-1 flex items-center gap-2 transition-all ${mode === 'pi' ? 'bg-gold text-[#020617] shadow-lg' : 'hover:text-white'}`}
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
              <Button className="bg-gold hover:bg-gold-light text-[#020617] rounded-none h-10 px-6 text-[11px] font-bold uppercase tracking-widest shadow-lg shadow-gold/20">
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
                <div className="flex items-center gap-4">
                  <h2 className="text-xs font-black uppercase tracking-[0.3em] text-slate-500">
                    {mode === 'corporate' ? 'Invoice Intake' : 'Medical Records & Billing'}
                  </h2>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={loadSampleData}
                    disabled={isProcessing}
                    className="h-7 text-[9px] font-black uppercase tracking-widest border-gold/30 bg-gold/5 hover:bg-gold/10 text-gold-light rounded-none px-3"
                  >
                    Load Sample PI Case
                  </Button>
                </div>
                <div className="text-[10px] font-bold text-blue-600 uppercase tracking-widest">Max 50MB per file</div>
              </div>
              <Dropzone onFilesAccepted={handleFilesAccepted} isProcessing={isProcessing} />
            </section>

            {/* Audit Results HUD */}
            <section>
              <div className="flex items-center justify-between mb-8 pb-4 border-b border-slate-100">
                <div className="flex items-center gap-3">
                  <h2 className="text-sm font-black uppercase tracking-[0.2em] text-gold">
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

              {/* Recovery Dashboard */}
              <AnimatePresence>
                {violations.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-8 grid grid-cols-1 md:grid-cols-3 gap-4"
                  >
                    <div className="bg-slate-50 border border-slate-200 p-6 rounded-none relative overflow-hidden group">
                      <div className="absolute top-0 left-0 w-1 h-full bg-slate-200" />
                      <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Total Audited Amount</div>
                      <div className="text-2xl font-mono font-medium text-slate-900">
                        ${(mode === 'corporate' ? leakage * 4.5 : medicalSpecials).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </div>
                    </div>
                    <div className="bg-emerald-50 border border-emerald-100 p-6 rounded-none relative overflow-hidden group">
                      <div className="absolute top-0 left-0 w-1 h-full bg-emerald-500" />
                      <div className="text-[10px] font-black text-emerald-600 uppercase tracking-widest mb-2">Total Leakage Found</div>
                      <div className="text-2xl font-mono font-medium text-emerald-600">
                        ${leakage.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </div>
                    </div>
                    <div className="bg-emerald-50/50 border border-emerald-100 p-6 rounded-none relative overflow-hidden group">
                      <div className="absolute top-0 left-0 w-1 h-full bg-emerald-400 opacity-50" />
                      <div className="text-[10px] font-black text-emerald-500/60 uppercase tracking-widest mb-2">LawAuditor Success Fee (15%)</div>
                      <div className="text-2xl font-mono font-medium text-emerald-500">
                        ${(leakage * 0.15).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

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
              <SettlementCalculator 
                medicalSpecials={medicalSpecials} 
                initialSettlement={isSampleData ? 100000 : 0}
                initialFeePercent={isSampleData ? 33.33 : 33.33}
              />
            )}
          </aside>
        </div>
      </main>

      {/* Compliance Footer */}
      <footer className="container mx-auto px-6 pb-12">
        <div className="pt-8 border-t border-slate-100">
          <p className="text-[9px] font-bold text-slate-400 uppercase tracking-[0.2em] leading-relaxed max-w-4xl">
            LawAuditor Analysis Report // Success fee is a software licensing cost based on data-processing volume and accuracy benchmarks. 
            All findings are generated by automated technical analysis and require licensed professional review.
          </p>
        </div>
      </footer>

      <div className="fixed bottom-8 left-8 z-50">
        <div className="flex items-center gap-3 bg-white border border-slate-200 p-3 shadow-2xl rounded-none">
          <div className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-green-600"></span>
          </div>
          <span className="text-[10px] font-black uppercase tracking-widest text-gold">System Status: Nominal</span>
        </div>
      </div>
    </div>
  );
}

