'use client';

import { useState, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
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
  Download,
  Linkedin,
  User,
  Search,
  X,
  Loader2,
  RefreshCw
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
  // Enriched contact fields
  contactName?: string;
  contactTitle?: string;
  contactEmail?: string;
  contactPhone?: string;
  linkedinUrl?: string;
  enrichmentStatus: 'Enriched' | 'Needs Manual Research' | 'Pending';
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
      status: 'new',
      contactName: 'Michael Chen',
      contactTitle: 'CEO',
      contactEmail: 'mchen@sactech.com',
      contactPhone: '+1-916-555-0142',
      linkedinUrl: 'https://linkedin.com/in/michaelchen',
      enrichmentStatus: 'Enriched'
    },
    { 
      id: 'W002', 
      ownerName: 'BAY AREA INVESTMENTS INC', 
      city: 'SAN FRANCISCO', 
      cashReported: 125000, 
      potentialFee: 12500, 
      propertyType: 'Securities',
      status: 'contacted',
      lastContact: '2026-01-28',
      contactName: 'Sarah Williams',
      contactTitle: 'CFO',
      contactEmail: 'swilliams@bayareainv.com',
      contactPhone: '+1-415-555-0198',
      linkedinUrl: 'https://linkedin.com/in/sarahwilliams',
      enrichmentStatus: 'Enriched'
    },
    { 
      id: 'W003', 
      ownerName: 'PALO ALTO CONSULTING GROUP LLP', 
      city: 'PALO ALTO', 
      cashReported: 89000, 
      potentialFee: 8900, 
      propertyType: 'Cash',
      status: 'signed',
      lastContact: '2026-01-25',
      contactName: 'David Park',
      contactTitle: 'Managing Partner',
      contactEmail: 'dpark@paconsulting.com',
      contactPhone: '+1-650-555-0167',
      linkedinUrl: 'https://linkedin.com/in/davidpark',
      enrichmentStatus: 'Enriched'
    },
    { 
      id: 'W004', 
      ownerName: 'FOLSOM MANUFACTURING CORP', 
      city: 'FOLSOM', 
      cashReported: 32000, 
      potentialFee: 3200, 
      propertyType: 'Cash',
      status: 'new',
      enrichmentStatus: 'Needs Manual Research'
    },
  ]);

  const [isProcessing, setIsProcessing] = useState(false);
  const [filterCity, setFilterCity] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterEnrichment, setFilterEnrichment] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedWhale, setSelectedWhale] = useState<WhaleLead | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Calculate totals
  const totalCash = whales.reduce((sum, w) => sum + w.cashReported, 0);
  const totalFees = whales.reduce((sum, w) => sum + w.potentialFee, 0);
  const newLeads = whales.filter(w => w.status === 'new').length;
  const enrichedLeads = whales.filter(w => w.enrichmentStatus === 'Enriched').length;
  const readyToContact = whales.filter(w => w.status === 'new' && w.enrichmentStatus === 'Enriched').length;

  // Process uploaded CSV (supports enriched format)
  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return;
    
    setIsProcessing(true);
    
    try {
      const file = acceptedFiles[0];
      const text = await file.text();
      
      // Detect JSON vs CSV
      if (file.name.endsWith('.json')) {
        const data = JSON.parse(text);
        const newWhales: WhaleLead[] = data.map((row: Record<string, unknown>, i: number) => ({
          id: `W${String(i + 1).padStart(3, '0')}`,
          ownerName: String(row.BUSINESS_NAME || row.ownerName || 'UNKNOWN'),
          city: String(row.CITY || row.city || 'UNKNOWN'),
          cashReported: Number(row.UNCLAIMED_VALUE || row.cashReported) || 0,
          potentialFee: Number(row.YOUR_FEE_10PCT || row.potentialFee) || 0,
          propertyType: 'Cash',
          status: 'new' as const,
          contactName: String(row.CONTACT_NAME || row.contactName || ''),
          contactTitle: String(row.CONTACT_TITLE || row.contactTitle || ''),
          contactEmail: String(row.CONTACT_EMAIL || row.contactEmail || ''),
          contactPhone: String(row.CONTACT_PHONE || row.contactPhone || ''),
          linkedinUrl: String(row.LINKEDIN_URL || row.linkedinUrl || ''),
          enrichmentStatus: (row.ENRICHMENT_STATUS || row.enrichmentStatus || 'Needs Manual Research') as WhaleLead['enrichmentStatus'],
        }));
        setWhales(newWhales);
      } else {
        // CSV parsing
        const lines = text.split('\n');
        const headers = lines[0].split(',').map(h => h.trim().toUpperCase());
        
        const newWhales: WhaleLead[] = [];
        for (let i = 1; i < lines.length; i++) {
          const cols = lines[i].split(',').map(c => c.trim());
          if (cols.length < 3) continue;
          
          const getCol = (name: string) => {
            const idx = headers.indexOf(name);
            return idx >= 0 ? cols[idx] : '';
          };
          
          const cashValue = parseFloat(getCol('UNCLAIMED_VALUE')?.replace(/[$,]/g, '') || getCol('CASH_REPORTED')?.replace(/[$,]/g, '')) || 0;
          
          if (cashValue >= 5000) {
            newWhales.push({
              id: `W${String(i).padStart(3, '0')}`,
              ownerName: getCol('BUSINESS_NAME') || getCol('OWNER_NAME') || 'UNKNOWN',
              city: getCol('CITY') || 'UNKNOWN',
              cashReported: cashValue,
              potentialFee: cashValue * 0.10,
              propertyType: 'Cash',
              status: 'new',
              contactName: getCol('CONTACT_NAME'),
              contactTitle: getCol('CONTACT_TITLE'),
              contactEmail: getCol('CONTACT_EMAIL'),
              contactPhone: getCol('CONTACT_PHONE'),
              linkedinUrl: getCol('LINKEDIN_URL'),
              enrichmentStatus: (getCol('ENRICHMENT_STATUS') || 'Needs Manual Research') as WhaleLead['enrichmentStatus'],
            });
          }
        }
        
        setWhales(newWhales);
      }
    } catch (error) {
      console.error('Error processing file:', error);
    } finally {
      setIsProcessing(false);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 
      'text/csv': ['.csv'],
      'application/json': ['.json']
    },
    disabled: isProcessing
  });

  // Filter whales
  const filteredWhales = whales.filter(w => {
    if (filterCity !== 'all' && !w.city.includes(filterCity)) return false;
    if (filterStatus !== 'all' && w.status !== filterStatus) return false;
    if (filterEnrichment !== 'all' && w.enrichmentStatus !== filterEnrichment) return false;
    if (searchQuery && !w.ownerName.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  // Update whale status
  const updateWhaleStatus = (id: string, status: WhaleLead['status']) => {
    setWhales(prev => prev.map(w => 
      w.id === id ? { ...w, status, lastContact: new Date().toISOString().split('T')[0] } : w
    ));
  };

  // Click handlers for contact actions
  const handleCall = (phone: string) => {
    window.location.href = `tel:${phone.replace(/[^\d+]/g, '')}`;
  };

  const handleEmail = (email: string, whale: WhaleLead) => {
    const subject = encodeURIComponent(`Unclaimed Property Notice - ${whale.ownerName}`);
    const body = encodeURIComponent(
      `Dear ${whale.contactName || 'Business Owner'},\n\n` +
      `I'm reaching out because I found ${whale.ownerName} has $${whale.cashReported.toLocaleString()} ` +
      `in unclaimed property registered with the California State Controller's Office.\n\n` +
      `You can claim this for free at claimit.ca.gov, or I can assist you with the recovery process ` +
      `for a 10% fee (the California legal maximum).\n\n` +
      `Would you have 10 minutes this week to discuss?\n\n` +
      `Best regards,\n` +
      `John Dillard\n` +
      `LawAuditor Asset Recovery\n` +
      `Licensed Property Investigator`
    );
    window.location.href = `mailto:${email}?subject=${subject}&body=${body}`;
  };

  const handleLinkedIn = (url: string) => {
    window.open(url, '_blank');
  };

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
          California Unclaimed Property • CCP 1582 Compliant • 10% Fee Cap • Lead Enrichment Enabled
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-br from-amber-950 to-slate-900 border border-amber-800/50 p-4"
        >
          <DollarSign className="w-4 h-4 text-gold mb-2" />
          <div className="text-2xl font-mono font-bold text-white">${(totalCash / 1000).toFixed(0)}k</div>
          <div className="text-[9px] font-bold text-amber-600 uppercase tracking-widest">Total Value</div>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="bg-slate-900 border border-slate-800 p-4"
        >
          <TrendingUp className="w-4 h-4 text-emerald-500 mb-2" />
          <div className="text-2xl font-mono font-bold text-emerald-400">${(totalFees / 1000).toFixed(0)}k</div>
          <div className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">Fee Revenue</div>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-slate-900 border border-slate-800 p-4"
        >
          <Building2 className="w-4 h-4 text-blue-500 mb-2" />
          <div className="text-2xl font-mono font-bold text-white">{whales.length}</div>
          <div className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">Total Leads</div>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="bg-slate-900 border border-slate-800 p-4"
        >
          <AlertTriangle className="w-4 h-4 text-amber-500 mb-2" />
          <div className="text-2xl font-mono font-bold text-amber-400">{newLeads}</div>
          <div className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">New Leads</div>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-emerald-950 border border-emerald-800/50 p-4"
        >
          <User className="w-4 h-4 text-emerald-400 mb-2" />
          <div className="text-2xl font-mono font-bold text-emerald-400">{enrichedLeads}</div>
          <div className="text-[9px] font-bold text-emerald-600 uppercase tracking-widest">Enriched</div>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="bg-gradient-to-br from-emerald-950 to-blue-950 border border-emerald-700/50 p-4"
        >
          <Phone className="w-4 h-4 text-emerald-300 mb-2" />
          <div className="text-2xl font-mono font-bold text-white">{readyToContact}</div>
          <div className="text-[9px] font-bold text-emerald-500 uppercase tracking-widest">Ready to Call</div>
        </motion.div>
      </div>

      {/* Upload + Search + Filters Row */}
      <div className="grid lg:grid-cols-4 gap-4 mb-6">
        {/* CSV/JSON Upload */}
        <div
          {...getRootProps()}
          className={`border-2 border-dashed p-6 text-center cursor-pointer transition-all ${
            isDragActive ? 'border-gold bg-gold/5' : 'border-slate-700 bg-slate-900/50 hover:border-slate-600'
          }`}
        >
          <input {...getInputProps()} />
          {isProcessing ? (
            <Loader2 className="w-6 h-6 text-gold mx-auto animate-spin" />
          ) : (
            <Upload className="w-6 h-6 text-slate-500 mx-auto mb-2" />
          )}
          <h3 className="text-xs font-black uppercase tracking-widest text-white mb-1">
            {isDragActive ? 'Drop Here' : 'Import Leads'}
          </h3>
          <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">
            CSV or JSON
          </p>
        </div>

        {/* Search */}
        <div className="bg-slate-900 border border-slate-800 p-4">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search businesses..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 text-white pl-10 pr-4 py-2 text-sm placeholder:text-slate-500"
            />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2"
              >
                <X className="w-4 h-4 text-slate-500 hover:text-white" />
              </button>
            )}
          </div>
        </div>

        {/* Filters */}
        <div className="bg-slate-900 border border-slate-800 p-4 lg:col-span-2">
          <div className="flex items-center gap-2 mb-2">
            <Filter className="w-3 h-3 text-slate-400" />
            <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">Filters</span>
          </div>
          <div className="grid grid-cols-3 gap-2">
            <select 
              value={filterCity}
              onChange={(e) => setFilterCity(e.target.value)}
              className="bg-slate-800 border border-slate-700 text-white px-3 py-2 text-xs"
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
              className="bg-slate-800 border border-slate-700 text-white px-3 py-2 text-xs"
            >
              <option value="all">All Status</option>
              <option value="new">New</option>
              <option value="contacted">Contacted</option>
              <option value="signed">Signed</option>
              <option value="recovered">Recovered</option>
            </select>
            <select 
              value={filterEnrichment}
              onChange={(e) => setFilterEnrichment(e.target.value)}
              className="bg-slate-800 border border-slate-700 text-white px-3 py-2 text-xs"
            >
              <option value="all">All Enrichment</option>
              <option value="Enriched">Enriched ✓</option>
              <option value="Needs Manual Research">Needs Research</option>
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
          <div className="flex items-center gap-2">
            <Button 
              variant="outline" 
              className="border-slate-700 text-slate-400 hover:text-white text-[10px] font-bold uppercase tracking-widest"
            >
              <RefreshCw className="w-3 h-3 mr-2" /> Refresh
            </Button>
            <Button 
              variant="outline" 
              className="border-slate-700 text-slate-400 hover:text-white text-[10px] font-bold uppercase tracking-widest"
            >
              <Download className="w-3 h-3 mr-2" /> Export
            </Button>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-800 text-left">
                <th className="px-4 py-3 text-[9px] font-black uppercase tracking-widest text-slate-500">Business</th>
                <th className="px-4 py-3 text-[9px] font-black uppercase tracking-widest text-slate-500">Contact</th>
                <th className="px-4 py-3 text-[9px] font-black uppercase tracking-widest text-slate-500">Unclaimed</th>
                <th className="px-4 py-3 text-[9px] font-black uppercase tracking-widest text-slate-500">Your Fee</th>
                <th className="px-4 py-3 text-[9px] font-black uppercase tracking-widest text-slate-500">Status</th>
                <th className="px-4 py-3 text-[9px] font-black uppercase tracking-widest text-slate-500">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {filteredWhales.map((whale) => (
                <motion.tr 
                  key={whale.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="hover:bg-slate-800/50 transition-colors group"
                >
                  {/* Business Info */}
                  <td className="px-4 py-4">
                    <div className="flex items-start gap-3">
                      <Building2 className="w-4 h-4 text-slate-600 mt-0.5 flex-shrink-0" />
                      <div>
                        <div className="text-sm text-white font-medium leading-tight mb-1">
                          {whale.ownerName}
                        </div>
                        <div className="flex items-center gap-2 text-[10px] text-slate-500">
                          <MapPin className="w-3 h-3" />
                          {whale.city}
                        </div>
                      </div>
                    </div>
                  </td>

                  {/* Contact Info */}
                  <td className="px-4 py-4">
                    {whale.enrichmentStatus === 'Enriched' && whale.contactName ? (
                      <div>
                        <div className="text-sm text-white font-medium">{whale.contactName}</div>
                        <div className="text-[10px] text-slate-400">{whale.contactTitle}</div>
                        {whale.contactEmail && (
                          <div className="text-[10px] text-emerald-500 mt-1">{whale.contactEmail}</div>
                        )}
                      </div>
                    ) : (
                      <span className="text-[10px] font-bold uppercase tracking-widest text-amber-500 bg-amber-500/10 px-2 py-1">
                        Needs Research
                      </span>
                    )}
                  </td>

                  {/* Unclaimed Value */}
                  <td className="px-4 py-4">
                    <span className="text-lg font-mono font-bold text-gold">
                      ${whale.cashReported.toLocaleString()}
                    </span>
                  </td>

                  {/* Your Fee */}
                  <td className="px-4 py-4">
                    <span className="text-lg font-mono font-bold text-emerald-400">
                      ${whale.potentialFee.toLocaleString()}
                    </span>
                  </td>

                  {/* Status */}
                  <td className="px-4 py-4">
                    <select 
                      value={whale.status}
                      onChange={(e) => updateWhaleStatus(whale.id, e.target.value as WhaleLead['status'])}
                      className={`text-[9px] font-black uppercase tracking-widest px-2 py-1 border-0 cursor-pointer ${
                        whale.status === 'recovered' ? 'bg-emerald-500/20 text-emerald-400' :
                        whale.status === 'signed' ? 'bg-blue-500/20 text-blue-400' :
                        whale.status === 'contacted' ? 'bg-purple-500/20 text-purple-400' :
                        'bg-amber-500/20 text-amber-400'
                      }`}
                    >
                      <option value="new">New</option>
                      <option value="contacted">Contacted</option>
                      <option value="signed">Signed</option>
                      <option value="recovered">Recovered</option>
                    </select>
                  </td>

                  {/* Quick Actions */}
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-1">
                      {/* Click to Call */}
                      {whale.contactPhone ? (
                        <button 
                          onClick={() => handleCall(whale.contactPhone!)}
                          className="p-2 hover:bg-emerald-500/20 rounded transition-colors group/btn"
                          title={`Call ${whale.contactPhone}`}
                        >
                          <Phone className="w-4 h-4 text-slate-400 group-hover/btn:text-emerald-400" />
                        </button>
                      ) : (
                        <button className="p-2 opacity-30 cursor-not-allowed" disabled>
                          <Phone className="w-4 h-4 text-slate-600" />
                        </button>
                      )}

                      {/* Click to Email */}
                      {whale.contactEmail ? (
                        <button 
                          onClick={() => handleEmail(whale.contactEmail!, whale)}
                          className="p-2 hover:bg-blue-500/20 rounded transition-colors group/btn"
                          title={`Email ${whale.contactEmail}`}
                        >
                          <Mail className="w-4 h-4 text-slate-400 group-hover/btn:text-blue-400" />
                        </button>
                      ) : (
                        <button className="p-2 opacity-30 cursor-not-allowed" disabled>
                          <Mail className="w-4 h-4 text-slate-600" />
                        </button>
                      )}

                      {/* LinkedIn */}
                      {whale.linkedinUrl ? (
                        <button 
                          onClick={() => handleLinkedIn(whale.linkedinUrl!)}
                          className="p-2 hover:bg-blue-600/20 rounded transition-colors group/btn"
                          title="View LinkedIn"
                        >
                          <Linkedin className="w-4 h-4 text-slate-400 group-hover/btn:text-blue-500" />
                        </button>
                      ) : (
                        <button className="p-2 opacity-30 cursor-not-allowed" disabled>
                          <Linkedin className="w-4 h-4 text-slate-600" />
                        </button>
                      )}

                      {/* View on SCO */}
                      <button 
                        onClick={() => window.open('https://ucpi.sco.ca.gov/UCP/Default.aspx', '_blank')}
                        className="p-2 hover:bg-slate-700 rounded transition-colors"
                        title="Search on CA SCO"
                      >
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
              <div className="text-[10px] text-slate-500">"You can claim this for free at claimit.ca.gov"</div>
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

      {/* Email Template Preview */}
      <div className="mt-6 p-6 bg-blue-950/30 border border-blue-900/50">
        <h3 className="text-[10px] font-black uppercase tracking-widest text-blue-400 mb-3">
          Auto-Generated Email Template (Click-to-Email)
        </h3>
        <div className="text-xs text-slate-400 font-mono bg-slate-900/50 p-4 rounded">
          <p className="mb-2"><span className="text-blue-400">Subject:</span> Unclaimed Property Notice - [BUSINESS_NAME]</p>
          <p className="mb-2"><span className="text-blue-400">Body:</span></p>
          <p className="pl-4 text-slate-500">
            Dear [CONTACT_NAME],<br/><br/>
            I found [BUSINESS_NAME] has $[AMOUNT] in unclaimed property with the California SCO.<br/><br/>
            You can claim this for free at claimit.ca.gov, or I can assist for a 10% fee.<br/><br/>
            Would you have 10 minutes this week to discuss?
          </p>
        </div>
      </div>
    </div>
  );
}
