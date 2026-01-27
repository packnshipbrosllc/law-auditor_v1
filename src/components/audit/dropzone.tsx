'use client';

import { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, FileText, X, Loader2, ShieldCheck, FileCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface DropzoneProps {
  onFilesAccepted: (files: File[]) => void;
  isProcessing: boolean;
}

export function Dropzone({ onFilesAccepted, isProcessing }: DropzoneProps) {
  const [files, setFiles] = useState<File[]>([]);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    setFiles(prev => [...prev, ...acceptedFiles]);
    onFilesAccepted(acceptedFiles);
  }, [onFilesAccepted]);

  const removeFile = (name: string) => {
    setFiles(files.filter(f => f.name !== name));
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'text/plain': ['.txt'],
    },
    disabled: isProcessing
  });

  return (
    <div className="w-full">
      <div
        {...getRootProps()}
        className={`relative border-2 border-dashed transition-all duration-300 p-12 text-center cursor-pointer ${
          isDragActive 
            ? 'border-blue-500 bg-blue-500/5' 
            : 'border-slate-800 bg-slate-900/10 hover:border-slate-700'
        } ${isProcessing ? 'opacity-50 cursor-not-allowed' : ''}`}
      >
        <input {...getInputProps()} />
        
        <div className="flex flex-col items-center gap-4">
          <div className={`w-16 h-16 flex items-center justify-center transition-colors ${
            isDragActive ? 'text-blue-500' : 'text-slate-500'
          }`}>
            {isProcessing ? (
              <Loader2 className="w-10 h-10 animate-spin" />
            ) : (
              <Upload className="w-10 h-10" />
            )}
          </div>
          
          <div>
            <h3 className="text-sm font-black uppercase tracking-[0.2em] text-white mb-2">
              {isDragActive ? 'Drop Files Here' : 'Drag & Drop Legal Invoices'}
            </h3>
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">
              Support for PDF and LEDES (.txt) files
            </p>
          </div>

          <div className="flex items-center gap-2 mt-4 px-4 py-2 bg-slate-900 border border-slate-800">
            <ShieldCheck className="w-3 h-3 text-blue-500" />
            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
              Zero-Retention Encryption Active
            </span>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {files.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-6 space-y-2"
          >
            {files.map((file) => (
              <div
                key={file.name}
                className="flex items-center justify-between p-4 bg-[#020617] border border-slate-800"
              >
                <div className="flex items-center gap-3">
                  <FileText className="w-4 h-4 text-blue-500" />
                  <div className="flex flex-col">
                    <span className="text-[10px] font-black text-slate-200 uppercase tracking-widest">
                      {file.name}
                    </span>
                    <span className="text-[8px] font-bold text-slate-500 uppercase">
                      {(file.size / 1024 / 1024).toFixed(2)} MB
                    </span>
                  </div>
                </div>
                {!isProcessing && (
                  <button
                    onClick={() => removeFile(file.name)}
                    className="p-1 hover:bg-slate-800 transition-colors"
                  >
                    <X className="w-3 h-3 text-slate-500" />
                  </button>
                )}
                {isProcessing && (
                  <Loader2 className="w-3 h-3 text-blue-500 animate-spin" />
                )}
              </div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}


