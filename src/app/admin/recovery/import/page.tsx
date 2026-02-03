'use client';

import { useState, useCallback, useRef } from 'react';
import { useDropzone } from 'react-dropzone';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Upload,
  FileText,
  CheckCircle,
  AlertCircle,
  Loader2,
  X,
  Download,
  ArrowRight,
  Sparkles,
  Crown,
  DollarSign,
  Users,
  TrendingUp,
  Clock,
  Shield,
  FileSpreadsheet,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { processEstateCSV, IngestResult } from '@/lib/actions/ingest';

// ═══════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════

type ImportPhase = 
  | 'idle' 
  | 'reading' 
  | 'parsing' 
  | 'filtering' 
  | 'scoring' 
  | 'inserting' 
  | 'complete' 
  | 'error';

interface ProgressState {
  phase: ImportPhase;
  progress: number;
  message: string;
}

// ═══════════════════════════════════════════════════════════════════════════
// COMPONENT
// ═══════════════════════════════════════════════════════════════════════════

export default function ImportPage() {
  const [file, setFile] = useState<File | null>(null);
  const [progressState, setProgressState] = useState<ProgressState>({
    phase: 'idle',
    progress: 0,
    message: '',
  });
  const [result, setResult] = useState<IngestResult | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // File drop handler
  const onDrop = useCallback((acceptedFiles: File[]) => {
    const csvFile = acceptedFiles.find(
      f => f.name.endsWith('.csv') || f.type === 'text/csv'
    );
    if (csvFile) {
      setFile(csvFile);
      setResult(null);
      setProgressState({ phase: 'idle', progress: 0, message: '' });
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'text/csv': ['.csv'],
    },
    multiple: false,
  });

  // Process the CSV file
  const handleImport = async () => {
    if (!file) return;

    try {
      // Phase 1: Reading file
      setProgressState({
        phase: 'reading',
        progress: 10,
        message: 'Reading file...',
      });

      const content = await file.text();

      // Phase 2: Parsing
      setProgressState({
        phase: 'parsing',
        progress: 25,
        message: 'Parsing CSV records...',
      });

      await new Promise(resolve => setTimeout(resolve, 500)); // Visual feedback

      // Phase 3: Filtering
      setProgressState({
        phase: 'filtering',
        progress: 40,
        message: 'Filtering records >= $10,000...',
      });

      await new Promise(resolve => setTimeout(resolve, 500));

      // Phase 4: Scoring
      setProgressState({
        phase: 'scoring',
        progress: 60,
        message: 'Scoring leads (Unfair Advantage logic)...',
      });

      await new Promise(resolve => setTimeout(resolve, 500));

      // Phase 5: Inserting
      setProgressState({
        phase: 'inserting',
        progress: 80,
        message: 'Inserting into database...',
      });

      // Call the server action
      const ingestResult = await processEstateCSV(content);

      // Phase 6: Complete
      setProgressState({
        phase: ingestResult.success ? 'complete' : 'error',
        progress: 100,
        message: ingestResult.success
          ? `Successfully imported ${ingestResult.inserted} leads!`
          : `Import failed: ${ingestResult.errors.join(', ')}`,
      });

      setResult(ingestResult);
    } catch (error) {
      setProgressState({
        phase: 'error',
        progress: 100,
        message: error instanceof Error ? error.message : 'Import failed',
      });
    }
  };

  // Reset state
  const handleReset = () => {
    setFile(null);
    setResult(null);
    setProgressState({ phase: 'idle', progress: 0, message: '' });
  };

  const isProcessing = ['reading', 'parsing', 'filtering', 'scoring', 'inserting'].includes(
    progressState.phase
  );

  return (
    <div className="p-6 lg:p-8 bg-slate-950 min-h-screen">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <Upload className="w-7 h-7 text-emerald-500" />
          <h1 className="text-2xl font-black tracking-tight text-white">
            Import Deceased Estates
          </h1>
        </div>
        <p className="text-slate-500 text-xs">
          Upload California SCO &ldquo;Estates of Deceased Persons&rdquo; CSV file
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Upload Area */}
        <div className="lg:col-span-2 space-y-6">
          {/* Dropzone */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div
              className={`relative border-2 border-dashed rounded-lg p-8 transition-all cursor-pointer ${
                isDragActive
                  ? 'border-emerald-500 bg-emerald-950/30'
                  : file
                  ? 'border-emerald-500/50 bg-emerald-950/10'
                  : 'border-slate-700 bg-slate-900/50 hover:border-slate-600'
              }`}
              {...getRootProps()}
            >
              <input {...getInputProps()} />

            <div className="text-center">
              {file ? (
                <>
                  <FileSpreadsheet className="w-12 h-12 text-emerald-500 mx-auto mb-4" />
                  <p className="text-lg font-bold text-white mb-1">{file.name}</p>
                  <p className="text-sm text-slate-400">
                    {(file.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleReset();
                    }}
                    className="mt-4 text-slate-400 hover:text-white"
                  >
                    <X className="w-4 h-4 mr-1" />
                    Remove
                  </Button>
                </>
              ) : (
                <>
                  <Upload
                    className={`w-12 h-12 mx-auto mb-4 ${
                      isDragActive ? 'text-emerald-500' : 'text-slate-600'
                    }`}
                  />
                  <p className="text-lg font-bold text-white mb-1">
                    {isDragActive ? 'Drop CSV file here' : 'Drag & drop CSV file'}
                  </p>
                  <p className="text-sm text-slate-500 mb-4">
                    or click to browse
                  </p>
                  <p className="text-[10px] text-slate-600">
                    Accepts: estates_of_deceased_persons_file.csv
                  </p>
                </>
              )}
            </div>
            </div>
          </motion.div>

          {/* Progress Bar */}
          <AnimatePresence>
            {progressState.phase !== 'idle' && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="bg-slate-900 border border-slate-800 rounded p-6"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    {isProcessing ? (
                      <Loader2 className="w-5 h-5 text-emerald-500 animate-spin" />
                    ) : progressState.phase === 'complete' ? (
                      <CheckCircle className="w-5 h-5 text-emerald-500" />
                    ) : (
                      <AlertCircle className="w-5 h-5 text-red-500" />
                    )}
                    <span className="text-sm font-bold text-white">
                      {progressState.message}
                    </span>
                  </div>
                  <span className="text-sm font-mono text-slate-400">
                    {progressState.progress}%
                  </span>
                </div>

                {/* Progress Bar */}
                <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${progressState.progress}%` }}
                    transition={{ duration: 0.3 }}
                    className={`h-full rounded-full ${
                      progressState.phase === 'error'
                        ? 'bg-red-500'
                        : progressState.phase === 'complete'
                        ? 'bg-emerald-500'
                        : 'bg-emerald-500'
                    }`}
                  />
                </div>

                {/* Phase Indicators */}
                <div className="flex justify-between mt-4 text-[9px] font-bold uppercase tracking-widest text-slate-600">
                  <span className={progressState.progress >= 10 ? 'text-emerald-500' : ''}>
                    Read
                  </span>
                  <span className={progressState.progress >= 25 ? 'text-emerald-500' : ''}>
                    Parse
                  </span>
                  <span className={progressState.progress >= 40 ? 'text-emerald-500' : ''}>
                    Filter
                  </span>
                  <span className={progressState.progress >= 60 ? 'text-emerald-500' : ''}>
                    Score
                  </span>
                  <span className={progressState.progress >= 80 ? 'text-emerald-500' : ''}>
                    Insert
                  </span>
                  <span className={progressState.progress >= 100 ? 'text-emerald-500' : ''}>
                    Done
                  </span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Results */}
          <AnimatePresence>
            {result && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className={`border rounded p-6 ${
                  result.success
                    ? 'bg-emerald-950/30 border-emerald-500/30'
                    : 'bg-red-950/30 border-red-500/30'
                }`}
              >
                <div className="flex items-center gap-2 mb-4">
                  {result.success ? (
                    <CheckCircle className="w-5 h-5 text-emerald-500" />
                  ) : (
                    <AlertCircle className="w-5 h-5 text-red-500" />
                  )}
                  <h3 className="text-sm font-bold text-white">
                    {result.success ? 'Import Complete' : 'Import Failed'}
                  </h3>
                </div>

                {result.success ? (
                  <>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                      <div className="bg-slate-900/50 p-3 rounded">
                        <div className="text-2xl font-mono font-bold text-white">
                          {result.totalRecords.toLocaleString()}
                        </div>
                        <div className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">
                          Total Records
                        </div>
                      </div>

                      <div className="bg-slate-900/50 p-3 rounded">
                        <div className="text-2xl font-mono font-bold text-emerald-400">
                          {result.inserted.toLocaleString()}
                        </div>
                        <div className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">
                          Imported
                        </div>
                      </div>

                      <div className="bg-slate-900/50 p-3 rounded">
                        <div className="text-2xl font-mono font-bold text-gold">
                          {result.highPriority.toLocaleString()}
                        </div>
                        <div className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">
                          High Priority
                        </div>
                      </div>

                      <div className="bg-slate-900/50 p-3 rounded">
                        <div className="text-2xl font-mono font-bold text-slate-400">
                          {result.duplicates.toLocaleString()}
                        </div>
                        <div className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">
                          Duplicates
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between p-4 bg-emerald-900/30 rounded mb-4">
                      <div>
                        <div className="text-lg font-mono font-bold text-emerald-400">
                          ${result.totalValue.toLocaleString()}
                        </div>
                        <div className="text-[9px] font-bold text-emerald-600 uppercase tracking-widest">
                          Total Asset Value
                        </div>
                      </div>
                      <ArrowRight className="w-5 h-5 text-emerald-600" />
                      <div className="text-right">
                        <div className="text-lg font-mono font-bold text-emerald-400">
                          ${result.potentialFees.toLocaleString()}
                        </div>
                        <div className="text-[9px] font-bold text-emerald-600 uppercase tracking-widest">
                          Potential Fees (10%)
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="text-[10px] text-slate-500">
                        Batch ID: <code className="text-slate-400">{result.batchId}</code>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={handleReset}
                          className="border-slate-700 text-slate-400"
                        >
                          Import Another
                        </Button>
                        <Link href="/admin/recovery/deceased">
                          <Button
                            size="sm"
                            className="bg-emerald-600 hover:bg-emerald-500 text-white"
                          >
                            View Leads
                            <ArrowRight className="w-4 h-4 ml-1" />
                          </Button>
                        </Link>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="space-y-2">
                    {result.errors.map((error, idx) => (
                      <div key={idx} className="text-sm text-red-400">
                        {error}
                      </div>
                    ))}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleReset}
                      className="mt-4 border-red-700 text-red-400"
                    >
                      Try Again
                    </Button>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Import Button */}
          {file && !isProcessing && !result && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              <Button
                onClick={handleImport}
                className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-4 text-sm"
              >
                <Upload className="w-5 h-5 mr-2" />
                Start Import
              </Button>
            </motion.div>
          )}
        </div>

        {/* Sidebar Info */}
        <div className="space-y-6">
          {/* Import Logic */}
          <motion.div
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-slate-900 border border-slate-800 rounded p-6"
          >
            <h3 className="text-xs font-black uppercase tracking-[0.15em] text-white mb-4 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-purple-500" />
              Import Logic
            </h3>

            <div className="space-y-4 text-sm">
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-emerald-500/20 flex items-center justify-center flex-shrink-0">
                  <span className="text-emerald-500 text-[10px] font-bold">1</span>
                </div>
                <div>
                  <div className="text-white font-bold">Filter</div>
                  <div className="text-slate-500 text-xs">
                    Only records ≥ $10,000
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-emerald-500/20 flex items-center justify-center flex-shrink-0">
                  <span className="text-emerald-500 text-[10px] font-bold">2</span>
                </div>
                <div>
                  <div className="text-white font-bold">De-duplicate</div>
                  <div className="text-slate-500 text-xs">
                    Skip existing property_ids
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-gold/20 flex items-center justify-center flex-shrink-0">
                  <Crown className="w-3 h-3 text-gold" />
                </div>
                <div>
                  <div className="text-gold font-bold">Score (Unfair Advantage)</div>
                  <div className="text-slate-500 text-xs">
                    HIGH priority if &ldquo;Decedent&rdquo; + No Heirs
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* High Priority Logic */}
          <motion.div
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-gold/10 border border-gold/30 rounded p-6"
          >
            <h3 className="text-xs font-black uppercase tracking-[0.15em] text-gold mb-4 flex items-center gap-2">
              <Crown className="w-4 h-4" />
              High Priority Leads
            </h3>

            <p className="text-sm text-slate-300 mb-4">
              Flagged when:
            </p>

            <ul className="space-y-2 text-sm text-slate-400">
              <li className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-gold" />
                Relation = &ldquo;Decedent&rdquo;
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-gold" />
                No Heirs listed
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-gold" />
                Balance ≥ $10,000
              </li>
            </ul>

            <p className="text-[10px] text-gold/70 mt-4">
              = Skip-trace opportunity before competitors
            </p>
          </motion.div>

          {/* Compliance */}
          <motion.div
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-slate-900/50 border border-slate-800 rounded p-4"
          >
            <div className="flex items-center gap-2 mb-3">
              <Shield className="w-4 h-4 text-emerald-500" />
              <h4 className="text-[10px] font-bold uppercase tracking-widest text-slate-500">
                Compliance
              </h4>
            </div>

            <div className="space-y-2 text-[10px] text-slate-500">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-3 h-3 text-emerald-500" />
                CCP 1582 Compliant
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-3 h-3 text-emerald-500" />
                10% Fee Cap
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-3 h-3 text-emerald-500" />
                Investigator Handbook
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
