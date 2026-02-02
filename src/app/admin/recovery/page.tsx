'use client';

import { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { 
  Upload, 
  Coins, 
  Building2, 
  MapPin, 
  DollarSign,
  TrendingUp,
  FileSpreadsheet,
  AlertTriangle,
  CheckCircle,
  Phone,
  Mail,
  ExternalLink,
  Filter,
  Download
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useDropzone } from 'react-dropzone';

interface WhaleLead {
  id: string;
  ownerName: string;
  city: string;
  cashReported: number;
  potentialFee: number;
  propertyType: string;
  status: 'new' | 'contacted' | 'signed' | 'recovered';
  lastContact?: string;
}

export default function WhaleRecoveryDashboard() {
  const [whales, setWhales] = useState<WhaleLead[]>([
    { 
      id: 'W001', 
      ownerName: 'SACRAMENTO TECH SOLUTIONS LLC', 
      city: 'SACRAMENTO', 
      cashReported: 47500, 
      potentialFee: 4750, 
      propertyType: 'Cash',
      status: 'new'
    },
    { 
      id: 'W002', 
      ownerName: 'BAY AREA INVESTMENTS INC', 
      city: 'SAN FRANCISCO', 
      cashReported: 125000, 
      potentialFee: 12500, 
      propertyType: 'Securities',
      status: 'contacted',
      lastContact: '2026-01-28'
    },
    { 
      id: 'W003', 
      ownerName: 'PALO ALTO CONSULTING GROUP LLP', 
      city: 'PALO ALTO', 
      cashReported: 89000, 
      potentialFee: 8900, 
      propertyType: 'Cash',
      status: 'signed',
      lastContact: '2026-01-25'
    },
  ]);

  const [isProcessing, setIsProcessing] = useState(false);
  const [filterCity, setFilterCity] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');

  // Calculate totals
  const totalCash = whales.reduce((sum, w) => sum + w.cashReported, 0);
  const totalFees = whales.reduce((sum, w) => sum + w.potentialFee, 0);
  const newLeads = whales.filter(w => w.status === 'new').length;
  const recoveredValue = whales.filter(w => w.status === 'recovered').reduce((sum, w) => sum + w.cashReported, 0);

  // Process uploaded CSV
  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return;
    
    setIsProcessing(true);
    
    try {
      const file = acceptedFiles[0];
      const text = await file.text();
      const lines = text.split('\n');
      
      // Simple CSV parsing for demo
      const newWhales: WhaleLead[] = [];
      for (let i = 1; i < Math.min(lines.length, 50); i++) { // Limit to 50 for demo
        const cols = lines[i].split(',');
        if (cols.length >= 4) {
          const cashValue = parseFloat(cols[2]?.replace(/[$,]/g, '')) || 0;
          if (cashValue >= 5000) {
            newWhales.push({
              id: `W${String(i).padStart(3, '0')}`,
              ownerName: cols[0]?.toUpperCase() || 'UNKNOWN',
              city: cols[1]?.toUpperCase() || 'UNKNOWN',
              cashReported: cashValue,
              potentialFee: cashValue * 0.10, // 10% CA legal cap
              propertyType: cols[3] || 'Cash',
              status: 'new',
            });
          }
        }
      }
      
      setWhales(prev => [...newWhales, ...prev]);
    } catch (error) {
      console.error('Error processing CSV:', error);
    } finally {
      setIsProcessing(false);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'text/csv': ['.csv'] },
    disabled: isProcessing
  });

  const filteredWhales = whales.filter(w => {
    if (filterCity !== 'all' && !w.city.includes(filterCity)) return false;
    if (filterStatus !== 'all' && w.status !== filterStatus) return false;
    return true;
  });

  return (
    <div className="p-8 bg-slate-950 min-h-screen">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <Coins className="w-8 h-8 text-gold" />
          <h1 className="text-3xl font-black tracking-tight text-white">
            Whale Recovery Dashboard
          </h1>
        </div>
        <p className="text-slate-500 text-sm font-medium uppercase tracking-widest">
          California Unclaimed Property • CCP 1582 Compliant • 10% Fee Cap
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-br from-amber-950 to-slate-900 border border-amber-800/50 p-6"
        >
          <div className="flex items-center justify-between mb-4">
            <DollarSign className="w-5 h-5 text-gold" />
            <span className="text-[9px] font-bold text-gold uppercase tracking-widest">Total Value</span>
          </div>
          <div className="text-3xl font-mono font-bold text-white">${totalCash.toLocaleString()}</div>
          <div className="text-[10px] font-bold text-amber-600 uppercase tracking-widest mt-1">Unclaimed Assets</div>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-slate-900 border border-slate-800 p-6"
        >
          <div className="flex items-center justify-between mb-4">
            <TrendingUp className="w-5 h-5 text-emerald-500" />
            <span className="text-[9px] font-bold text-emerald-500 uppercase tracking-widest">Potential</span>
          </div>
          <div className="text-3xl font-mono font-bold text-emerald-400">${totalFees.toLocaleString()}</div>
          <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">Fee Revenue (10%)</div>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-slate-900 border border-slate-800 p-6"
        >
          <div className="flex items-center justify-between mb-4">
            <Building2 className="w-5 h-5 text-blue-500" />
            <span className="text-[9px] font-bold text-blue-500 uppercase tracking-widest">Leads</span>
          </div>
          <div className="text-3xl font-mono font-bold text-white">{whales.length}</div>
          <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">Whale Businesses</div>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-slate-900 border border-slate-800 p-6"
        >
          <div className="flex items-center justify-between mb-4">
            <AlertTriangle className="w-5 h-5 text-amber-500" />
            <span className="text-[9px] font-bold text-amber-500 uppercase tracking-widest">New</span>
          </div>
          <div className="text-3xl font-mono font-bold text-amber-400">{newLeads}</div>
          <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">Uncontacted Leads</div>
        </motion.div>
      </div>

      {/* Upload + Filters Row */}
      <div className="grid lg:grid-cols-3 gap-6 mb-8">
        {/* CSV Upload */}
        <div
          {...getRootProps()}
          className={`border-2 border-dashed p-8 text-center cursor-pointer transition-all ${
            isDragActive ? 'border-gold bg-gold/5' : 'border-slate-700 bg-slate-900/50 hover:border-slate-600'
          }`}
        >
          <input {...getInputProps()} />
          <Upload className="w-8 h-8 text-slate-500 mx-auto mb-3" />
          <h3 className="text-sm font-black uppercase tracking-widest text-white mb-1">
            {isDragActive ? 'Drop CSV Here' : 'Import Whale CSV'}
          </h3>
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
            SCO Export • sac_bay_whales.csv
          </p>
        </div>

        {/* Filters */}
        <div className="bg-slate-900 border border-slate-800 p-6 lg:col-span-2">
          <div className="flex items-center gap-3 mb-4">
            <Filter className="w-4 h-4 text-slate-400" />
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Filters</span>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <select 
              value={filterCity}
              onChange={(e) => setFilterCity(e.target.value)}
              className="bg-slate-800 border border-slate-700 text-white px-4 py-2 text-sm"
            >
              <option value="all">All Cities</option>
              <option value="SACRAMENTO">Sacramento</option>
              <option value="SAN FRANCISCO">San Francisco</option>
              <option value="PALO ALTO">Palo Alto</option>
              <option value="SAN JOSE">San Jose</option>
            </select>
            <select 
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="bg-slate-800 border border-slate-700 text-white px-4 py-2 text-sm"
            >
              <option value="all">All Status</option>
              <option value="new">New</option>
              <option value="contacted">Contacted</option>
              <option value="signed">Signed</option>
              <option value="recovered">Recovered</option>
            </select>
          </div>
        </div>
      </div>

      {/* Whale Table */}
      <div className="bg-slate-900 border border-slate-800 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between">
          <h2 className="text-sm font-black uppercase tracking-[0.2em] text-white">
            Whale Leads ({filteredWhales.length})
          </h2>
          <Button 
            variant="outline" 
            className="border-slate-700 text-slate-400 hover:text-white text-[10px] font-bold uppercase tracking-widest"
          >
            <Download className="w-3 h-3 mr-2" /> Export
          </Button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-800 text-left">
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-500">Business Name</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-500">City</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-500">Unclaimed</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-500">Your Fee (10%)</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-500">Status</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-500">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {filteredWhales.map((whale) => (
                <motion.tr 
                  key={whale.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="hover:bg-slate-800/50 transition-colors"
                >
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <Building2 className="w-4 h-4 text-slate-500" />
                      <span className="text-sm text-white font-medium">{whale.ownerName}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <MapPin className="w-3 h-3 text-slate-500" />
                      <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">{whale.city}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-lg font-mono font-bold text-gold">
                    ${whale.cashReported.toLocaleString()}
                  </td>
                  <td className="px-6 py-4 text-lg font-mono font-bold text-emerald-400">
                    ${whale.potentialFee.toLocaleString()}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 text-[9px] font-black uppercase tracking-widest ${
                      whale.status === 'recovered' ? 'bg-emerald-500/20 text-emerald-400' :
                      whale.status === 'signed' ? 'bg-blue-500/20 text-blue-400' :
                      whale.status === 'contacted' ? 'bg-purple-500/20 text-purple-400' :
                      'bg-amber-500/20 text-amber-400'
                    }`}>
                      {whale.status}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <button className="p-2 hover:bg-slate-700 rounded" title="Call">
                        <Phone className="w-4 h-4 text-slate-400" />
                      </button>
                      <button className="p-2 hover:bg-slate-700 rounded" title="Email">
                        <Mail className="w-4 h-4 text-slate-400" />
                      </button>
                      <button className="p-2 hover:bg-slate-700 rounded" title="View on SCO">
                        <ExternalLink className="w-4 h-4 text-slate-400" />
                      </button>
                    </div>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Legal Guardrails Footer */}
      <div className="mt-8 p-6 bg-slate-900/50 border border-slate-800">
        <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-4">
          CCP 1582 Compliance Checklist
        </h3>
        <div className="grid md:grid-cols-3 gap-4">
          <div className="flex items-start gap-3">
            <CheckCircle className="w-4 h-4 text-emerald-500 mt-0.5" />
            <div>
              <div className="text-xs font-bold text-white">Disclosure Required</div>
              <div className="text-[10px] text-slate-500">Must state: "You can claim this for free at claimit.ca.gov"</div>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <CheckCircle className="w-4 h-4 text-emerald-500 mt-0.5" />
            <div>
              <div className="text-xs font-bold text-white">SCO Template Contract</div>
              <div className="text-[10px] text-slate-500">Use the official State Controller's Office agreement</div>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <CheckCircle className="w-4 h-4 text-emerald-500 mt-0.5" />
            <div>
              <div className="text-xs font-bold text-white">10% Fee Cap (Hard-coded)</div>
              <div className="text-[10px] text-slate-500">California legal maximum for asset recovery</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
