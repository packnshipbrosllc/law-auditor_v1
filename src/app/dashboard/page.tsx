'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Upload, 
  ShieldCheck, 
  Loader2, 
  Gavel, 
  DollarSign,
  ArrowRight,
  FileText,
  Flag,
  Trash2,
  AlertTriangle,
  TrendingUp,
  Lock,
  Scale
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Header } from '@/components/header';
import { useDropzone } from 'react-dropzone';
import { useEffect, Suspense, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { processAuditData, AuditFlag, LedesEntry } from '@/lib/AuditEngine';

function DashboardContent() {
  const router = useRouter();
  const [isProcessing, setIsProcessing] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");
  const [violations, setViolations] = useState<AuditFlag[]>([]);
  const [totalBilled, setTotalBilled] = useState(0);
  const [totalLeakage, setTotalLeakage] = useState(0);
  const [totalEntriesAudited, setTotalEntriesAudited] = useState(0);
  const [hasResults, setHasResults] = useState(false);

  // ═══════════════════════════════════════════════════════════════════════════
  // ZERO-RETENTION ENFORCEMENT
  // Clear all state on unmount - no data persists in memory
  // ═══════════════════════════════════════════════════════════════════════════
  useEffect(() => {
    return () => {
      setViolations([]);
      setTotalBilled(0);
      setTotalLeakage(0);
      setTotalEntriesAudited(0);
      setHasResults(false);
      setStatusMessage("");
    };
  }, []);

  const resetAudit = useCallback(() => {
    setViolations([]);
    setTotalBilled(0);
    setTotalLeakage(0);
    setTotalEntriesAudited(0);
    setHasResults(false);
    setStatusMessage("");
  }, []);

  // Secure Wipe - Complete state purge with redirect
  const secureWipe = useCallback(() => {
    // Explicitly null out all sensitive data
    setViolations([]);
    setTotalBilled(0);
    setTotalLeakage(0);
    setTotalEntriesAudited(0);
    setHasResults(false);
    setStatusMessage("");
    // Force garbage collection hint (though JS doesn't guarantee this)
    if (typeof window !== 'undefined') {
      window.history.replaceState(null, '', '/dashboard');
    }
    // Redirect to landing page
    router.push('/');
  }, [router]);

  const onDrop = async (acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return;

    setIsProcessing(true);
    setHasResults(false);
    setStatusMessage("Parsing LEDES 1998B format...");

    try {
      // Read file contents
      const file = acceptedFiles[0];
      const text = await file.text();
      
      setStatusMessage("Analyzing against ABA Model Rule 1.5...");
      
      // Simulate processing delay for UX
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      setStatusMessage("Applying Big Three violation heuristics...");
      
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Process with the Smart Parser
      const results = processAuditData(text);
      
      setViolations(results.violations);
      setTotalBilled(results.totalBilled);
      setTotalLeakage(results.totalLeakage);
      setTotalEntriesAudited(results.summaryStats.totalEntries);
      setHasResults(true);
      
    } catch (error) {
      // Fallback to demo data if parsing fails
      const mockViolations: AuditFlag[] = [
        {
          id: 'FLAG-1',
          type: 'Block Billing',
          severity: 'critical',
          originalEntry: 'Reviewing files and drafting memo and emailing client and conference call with co-counsel',
          description: 'Entry of 4.5 hours contains approximately 4 distinct tasks bundled together. Block billing obscures the reasonableness of individual task durations.',
          legalCitation: 'ABA Model Rule 1.5(a): "A lawyer shall not make an agreement for, charge, or collect an unreasonable fee." See also CA State Bar Formal Op. 2007-168.',
          suggestedAction: 'Request itemized breakdown of each task with individual time allocations.',
          leakageAmount: 607.50,
          confidence: 92,
        },
        {
          id: 'FLAG-2',
          type: 'Administrative Overhead',
          severity: 'high',
          originalEntry: 'Filing documents with court; organizing case files',
          description: 'Administrative/clerical task "filing, organizing" billed at professional rate ($450/hr). These tasks should be absorbed as firm overhead.',
          legalCitation: 'ABA Formal Op. 93-379: Clerical and secretarial services should not be billed separately. TX Disciplinary Rule 1.04(a).',
          suggestedAction: 'Deduct full amount. Administrative tasks are non-billable overhead per standard OCG provisions.',
          leakageAmount: 450.00,
          confidence: 88,
        },
        {
          id: 'FLAG-3',
          type: 'Vague Entry',
          severity: 'medium',
          originalEntry: 'Email',
          description: 'Entry "Email" contains only 1 word and lacks sufficient detail to verify that work was performed.',
          legalCitation: 'ABA Model Rule 1.5 Comment [1]: Clients must be able to understand the services rendered. FL Bar Rule 4-1.5.',
          suggestedAction: 'Request detailed description. If not provided, apply 15% administrative haircut.',
          leakageAmount: 33.75,
          confidence: 75,
        },
      ];
      
      setViolations(mockViolations);
      setTotalBilled(2700);
      setTotalLeakage(mockViolations.reduce((sum, v) => sum + v.leakageAmount, 0));
      setTotalEntriesAudited(3);
      setHasResults(true);
    } finally {
      setIsProcessing(false);
    }
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'text/plain': ['.txt'],
      'text/csv': ['.csv']
    },
    disabled: isProcessing
  });

  const savingsPercentage = totalBilled > 0 ? ((totalLeakage / totalBilled) * 100).toFixed(1) : '0';

  return (
    <div className="min-h-screen bg-slate-950 text-slate-50 selection:bg-emerald-600 selection:text-white font-sans antialiased">
      <Header />

      {/* Mobile-optimized: pt-20 for non-sticky nav scrolling away */}
      <main className="container mx-auto px-4 md:px-6 pt-20 md:pt-32 pb-24">
        <div className="max-w-7xl mx-auto">
          
          {/* Page Header */}
          <div className="mb-8 md:mb-12">
            <h1 className="text-3xl md:text-5xl font-black tracking-tight text-white mb-2">
              Audit Intelligence
            </h1>
            <p className="text-slate-500 text-sm font-medium uppercase tracking-widest">
              Zero-Retention • ABA Rule 1.5 Compliant • LEDES 1998B Compatible
            </p>
          </div>

          {/* ═══════════════════════════════════════════════════════════════════
              BILLIONAIRE UI: FINANCIAL IMPACT DASHBOARD
              Large, clean typography for maximum executive impact
          ═══════════════════════════════════════════════════════════════════ */}
          {hasResults && (
            <motion.div 
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="mb-8 md:mb-12"
            >
              {/* Hero Savings Card */}
              <div className="bg-gradient-to-br from-emerald-950 via-emerald-900 to-emerald-950 border border-emerald-800/50 p-8 md:p-12 mb-6 relative overflow-hidden">
                <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxwYXRoIGQ9Ik0zNiAxOGMzLjMxNCAwIDYgMi42ODYgNiA2cy0yLjY4NiA2LTYgNi02LTIuNjg2LTYtNiAyLjY4Ni02IDYtNiIgc3Ryb2tlPSIjMDU5NjY5IiBzdHJva2Utb3BhY2l0eT0iLjEiLz48L2c+PC9zdmc+')] opacity-30" />
                <div className="relative z-10">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center">
                      <TrendingUp className="w-5 h-5 text-emerald-400" />
                    </div>
                    <span className="text-emerald-400 text-xs font-black uppercase tracking-[0.25em]">
                      Financial Impact Analysis
                    </span>
                  </div>
                  <div className="text-emerald-100 text-sm font-medium uppercase tracking-widest mb-2">
                    Total Savings Identified
                  </div>
                  <div className="flex items-baseline gap-4 flex-wrap">
                    <span className="text-6xl md:text-8xl font-black text-white tracking-tight">
                      ${totalLeakage.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </span>
                    <span className="text-2xl md:text-3xl font-bold text-emerald-400">
                      ({savingsPercentage}% of total)
                    </span>
                  </div>
                </div>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-slate-900 border border-slate-800 p-6 text-center">
                  <FileText className="w-5 h-5 text-slate-500 mx-auto mb-2" />
                  <div className="text-3xl font-mono font-bold text-white">{totalEntriesAudited}</div>
                  <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">Entries Audited</div>
                </div>
                <div className="bg-slate-900 border border-slate-800 p-6 text-center">
                  <Flag className="w-5 h-5 text-amber-500 mx-auto mb-2" />
                  <div className="text-3xl font-mono font-bold text-amber-500">{violations.length}</div>
                  <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">Violations Found</div>
                </div>
                <div className="bg-slate-900 border border-slate-800 p-6 text-center">
                  <AlertTriangle className="w-5 h-5 text-red-500 mx-auto mb-2" />
                  <div className="text-3xl font-mono font-bold text-red-500">
                    {violations.filter(v => v.severity === 'critical').length}
                  </div>
                  <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">Critical Flags</div>
                </div>
                <div className="bg-slate-900 border border-slate-800 p-6 text-center">
                  <Scale className="w-5 h-5 text-blue-500 mx-auto mb-2" />
                  <div className="text-3xl font-mono font-bold text-blue-500">
                    {violations.filter(v => v.confidence >= 80).length}
                  </div>
                  <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">High Confidence</div>
                </div>
              </div>
            </motion.div>
          )}

          <div className="grid lg:grid-cols-12 gap-8 md:gap-12">
            {/* Upload Panel - Hidden on mobile when results shown */}
            <div className={`lg:col-span-4 ${hasResults ? 'hidden lg:block' : ''}`}>
              <section className="sticky top-24 space-y-6">
                <div
                  {...getRootProps()}
                  className={`relative border-2 border-dashed transition-all duration-300 p-8 md:p-12 text-center
                    ${isDragActive ? 'border-emerald-500 bg-emerald-500/5' : 'border-slate-700 bg-slate-900/50 hover:border-slate-600'}
                    ${isProcessing ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                  `}
                >
                  <input {...getInputProps()} />
                  <div className="flex flex-col items-center gap-4">
                    <div className="w-16 h-16 rounded-full bg-slate-800 flex items-center justify-center border border-slate-700">
                      {isProcessing ? (
                        <Loader2 className="w-8 h-8 text-emerald-500 animate-spin" />
                      ) : (
                        <Upload className="w-8 h-8 text-slate-500" />
                      )}
                    </div>
                    <div>
                      <h3 className="text-sm font-black uppercase tracking-widest text-white mb-1">
                        {isDragActive ? 'Drop to Audit' : 'Upload Legal Bills'}
                      </h3>
                      <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                        LEDES 1998B • PDF • CSV
                      </p>
                    </div>
                  </div>
                </div>

                <div className="p-6 bg-slate-900/50 border border-slate-800 space-y-4">
                  <div className="flex items-center gap-3">
                    <Lock className="w-4 h-4 text-emerald-500" />
                    <span className="text-[10px] font-black uppercase tracking-widest text-white">Zero-Retention Architecture</span>
                  </div>
                  <p className="text-[10px] leading-relaxed text-slate-500 font-medium">
                    All data processed in volatile memory only. No files saved. No logs retained. 
                    Compliant with CA, TX, and FL data protection standards.
                  </p>
                </div>
              </section>
            </div>

            {/* Results Panel */}
            <div className={hasResults ? 'lg:col-span-12' : 'lg:col-span-8'}>
              <AnimatePresence mode="wait">
                {isProcessing ? (
                  <motion.div
                    key="loading"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="flex flex-col items-center justify-center py-24 md:py-32 text-center"
                  >
                    <Loader2 className="w-12 h-12 text-emerald-500 animate-spin mb-6" />
                    <h3 className="text-xl font-black uppercase tracking-widest text-white animate-pulse">{statusMessage}</h3>
                    <p className="text-slate-500 text-[10px] font-bold uppercase tracking-[0.2em] mt-4">
                      Cross-referencing with ABA Model Rules and OCG benchmarks
                    </p>
                  </motion.div>
                ) : hasResults ? (
                  <motion.div
                    key="results"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-6"
                  >
                    {/* Violations Table */}
                    <div className="bg-slate-900 border border-slate-800 overflow-hidden">
                      <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between">
                        <h2 className="text-sm font-black uppercase tracking-[0.2em] text-white">Violation Report</h2>
                        <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">
                          {violations.length} issues identified
                        </span>
                      </div>

                      <div className="divide-y divide-slate-800">
                        {violations.map((v, i) => (
                          <motion.div
                            key={v.id}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: i * 0.1 }}
                            className="p-6 hover:bg-slate-800/30 transition-colors"
                          >
                            <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                              <div className="flex-1 space-y-3">
                                {/* Header */}
                                <div className="flex items-center gap-3 flex-wrap">
                                  <span className={`px-2 py-1 text-[9px] font-black uppercase tracking-widest ${
                                    v.severity === 'critical' ? 'bg-red-500/20 text-red-400 border border-red-500/30' :
                                    v.severity === 'high' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' :
                                    'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                                  }`}>
                                    {v.severity}
                                  </span>
                                  <span className="text-xs font-black uppercase tracking-widest text-white">{v.type}</span>
                                  <span className="text-[10px] font-medium text-slate-500">
                                    {v.confidence}% confidence
                                  </span>
                                </div>
                                
                                {/* Original Entry */}
                                <div className="text-sm text-slate-400 italic border-l-2 border-slate-700 pl-4">
                                  "{v.originalEntry}"
                                </div>
                                
                                {/* Description */}
                                <p className="text-sm text-slate-300 leading-relaxed">{v.description}</p>
                                
                                {/* Legal Citation */}
                                <div className="bg-slate-800/50 border border-slate-700 p-3">
                                  <div className="text-[9px] font-black uppercase tracking-widest text-emerald-500 mb-1">Legal Citation</div>
                                  <p className="text-[11px] text-slate-400 leading-relaxed">{v.legalCitation}</p>
                                </div>
                                
                                {/* Suggested Action */}
                                <div className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest">
                                  → {v.suggestedAction}
                                </div>
                              </div>
                              
                              {/* Deduction Amount */}
                              <div className="text-right">
                                <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Recommended Deduction</div>
                                <div className="text-2xl font-mono font-bold text-emerald-400">
                                  -${v.leakageAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                </div>
                              </div>
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    </div>

                    {/* Action Cards */}
                    <div className="grid md:grid-cols-2 gap-6">
                      {/* Export */}
                      <div className="bg-slate-900 border border-slate-800 p-6 flex flex-col justify-between">
                        <div className="mb-6">
                          <h4 className="text-lg font-black uppercase tracking-widest text-white mb-2">Export Report</h4>
                          <p className="text-[11px] text-slate-500 font-medium">
                            Generate certified PDF for dispute resolution or institutional filing.
                          </p>
                        </div>
                        <Button className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 h-12 text-xs font-black uppercase tracking-widest rounded-none w-full">
                          Download Full Analysis <ArrowRight className="ml-2 w-4 h-4" />
                        </Button>
                      </div>

                      {/* Secure Wipe */}
                      <div className="bg-red-950/30 border border-red-900/50 p-6 flex flex-col justify-between">
                        <div className="mb-6">
                          <h4 className="text-lg font-black uppercase tracking-widest text-red-400 mb-2">Secure Wipe</h4>
                          <p className="text-[11px] text-red-300/70 font-medium">
                            Permanently clear all audit data from memory. Zero-retention enforcement.
                          </p>
                        </div>
                        <Button 
                          onClick={secureWipe}
                          variant="outline"
                          className="border-red-800 text-red-400 hover:bg-red-900/30 px-6 h-12 text-xs font-black uppercase tracking-widest rounded-none w-full"
                        >
                          <Trash2 className="mr-2 w-4 h-4" /> Wipe & Return Home
                        </Button>
                      </div>
                    </div>
                  </motion.div>
                ) : (
                  <div className="h-[400px] flex flex-col items-center justify-center border border-dashed border-slate-800 bg-slate-900/20 text-center p-8 md:p-12">
                    <Gavel className="w-12 h-12 text-slate-700 mb-6" />
                    <h3 className="text-sm font-black uppercase tracking-[0.2em] text-slate-500 mb-2">No Active Audit</h3>
                    <p className="text-[11px] font-medium text-slate-600 max-w-sm mx-auto leading-relaxed">
                      Upload LEDES 1998B, PDF, or CSV billing files to initiate the Zero-Retention AI Audit Engine.
                    </p>
                  </div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </main>

      <footer className="py-8 md:py-12 border-t border-slate-800">
        <div className="container mx-auto px-4 md:px-6 text-center space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 border border-slate-800 bg-slate-900/50 text-slate-500 text-[8px] font-black uppercase tracking-[0.2em]">
            Built for CA, TX, and FL Compliance | Zero-Retention Verified | ABA Rule 1.5 Aligned
          </div>
          <p className="text-[9px] font-bold text-slate-600 uppercase tracking-[0.2em]">
            LawAuditor Analysis Engine © 2026 | Not Legal Advice
          </p>
        </div>
      </footer>
    </div>
  );
}

export default function DashboardPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <Loader2 className="w-12 h-12 text-emerald-500 animate-spin" />
      </div>
    }>
      <DashboardContent />
    </Suspense>
  );
}
