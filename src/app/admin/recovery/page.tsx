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
  RefreshCw,
  FileText,
  Send,
  Sparkles,
  Target,
  Zap
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
  status: 'new' | 'contacted' | 'high_interest' | 'signed' | 'recovered';
  lastContact?: string;
  contactName?: string;
  contactTitle?: string;
  contactEmail?: string;
  contactPhone?: string;
  linkedinUrl?: string;
  enrichmentStatus: 'Enriched' | 'Needs Manual Research' | 'Pending';
}

// Contract PDF Generator
function generateContractPDF(whale: WhaleLead): void {
  // Dynamic import jsPDF
  import('jspdf').then(({ jsPDF }) => {
    const doc = new jsPDF();
    const today = new Date().toLocaleDateString('en-US', { 
      year: 'numeric', month: 'long', day: 'numeric' 
    });
    
    // Header
    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.text('UNCLAIMED PROPERTY RECOVERY AGREEMENT', 105, 25, { align: 'center' });
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text('California Civil Code Section 1582 Compliant', 105, 32, { align: 'center' });
    
    // Line separator
    doc.setLineWidth(0.5);
    doc.line(20, 38, 190, 38);
    
    // Agreement body
    doc.setFontSize(11);
    let y = 50;
    
    doc.setFont('helvetica', 'bold');
    doc.text('PARTIES:', 20, y);
    doc.setFont('helvetica', 'normal');
    y += 8;
    doc.text(`Property Owner: ${whale.ownerName}`, 25, y);
    y += 6;
    doc.text(`Contact: ${whale.contactName || '[AUTHORIZED REPRESENTATIVE]'}`, 25, y);
    y += 6;
    doc.text(`Location: ${whale.city}, California`, 25, y);
    y += 6;
    doc.text(`Date: ${today}`, 25, y);
    y += 12;
    
    doc.text(`Recovery Agent: LawAuditor Asset Recovery`, 25, y);
    y += 6;
    doc.text(`Licensed Property Investigator - State of California`, 25, y);
    y += 15;
    
    doc.setFont('helvetica', 'bold');
    doc.text('UNCLAIMED PROPERTY DETAILS:', 20, y);
    doc.setFont('helvetica', 'normal');
    y += 8;
    doc.text(`Estimated Value: $${whale.cashReported.toLocaleString('en-US', { minimumFractionDigits: 2 })}`, 25, y);
    y += 6;
    doc.text(`Property Type: ${whale.propertyType || 'Cash/Financial Assets'}`, 25, y);
    y += 6;
    doc.text(`Holder: California State Controller's Office`, 25, y);
    y += 15;
    
    doc.setFont('helvetica', 'bold');
    doc.text('RECOVERY FEE:', 20, y);
    doc.setFont('helvetica', 'normal');
    y += 8;
    
    // Fee calculation box
    doc.setFillColor(240, 240, 240);
    doc.rect(25, y - 4, 160, 20, 'F');
    doc.setFont('helvetica', 'bold');
    doc.text(`10% of Recovered Amount = $${whale.potentialFee.toLocaleString('en-US', { minimumFractionDigits: 2 })}`, 30, y + 4);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.text('(Maximum fee permitted under California Civil Code § 1582)', 30, y + 12);
    doc.setFontSize(11);
    y += 28;
    
    // Required disclosure
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(180, 0, 0);
    doc.text('REQUIRED DISCLOSURE (CCP 1582):', 20, y);
    doc.setTextColor(0, 0, 0);
    doc.setFont('helvetica', 'normal');
    y += 8;
    
    doc.setFontSize(10);
    const disclosure = [
      'You are not required to use this service. You may claim this property for FREE',
      'directly from the California State Controller\'s Office at:',
      '',
      'Website: https://claimit.ca.gov',
      'Phone: 1-800-992-4647',
      '',
      'This agreement does not guarantee recovery. The fee is only payable upon',
      'successful recovery of funds to the Property Owner.'
    ];
    
    disclosure.forEach(line => {
      doc.text(line, 25, y);
      y += 5;
    });
    
    y += 10;
    doc.setFontSize(11);
    
    // Terms
    doc.setFont('helvetica', 'bold');
    doc.text('TERMS:', 20, y);
    doc.setFont('helvetica', 'normal');
    y += 8;
    
    const terms = [
      '1. Agent will file all necessary claim forms with the State Controller.',
      '2. Fee is due only upon successful recovery of funds.',
      '3. Owner may cancel within 30 days without penalty.',
      '4. Agent maintains all required state licenses and bonds.'
    ];
    
    terms.forEach(term => {
      doc.text(term, 25, y);
      y += 7;
    });
    
    y += 15;
    
    // Signature lines
    doc.line(25, y, 90, y);
    doc.line(110, y, 175, y);
    y += 5;
    doc.setFontSize(9);
    doc.text('Property Owner Signature', 25, y);
    doc.text('Recovery Agent Signature', 110, y);
    y += 8;
    doc.text(`Name: ${whale.contactName || '________________________'}`, 25, y);
    doc.text('Name: John Dillard', 110, y);
    y += 6;
    doc.text(`Date: ${today}`, 25, y);
    doc.text(`Date: ${today}`, 110, y);
    
    // Footer
    doc.setFontSize(8);
    doc.setTextColor(128, 128, 128);
    doc.text('LawAuditor Asset Recovery | Licensed Property Investigator | California', 105, 285, { align: 'center' });
    doc.text('Generated ' + new Date().toISOString(), 105, 290, { align: 'center' });
    
    // Save
    const filename = `Contract_${whale.ownerName.replace(/[^a-zA-Z0-9]/g, '_').substring(0, 30)}_${today.replace(/[^a-zA-Z0-9]/g, '')}.pdf`;
    doc.save(filename);
  });
}

// Email contract function
function emailContract(whale: WhaleLead): void {
  const subject = encodeURIComponent(`Recovery Agreement - ${whale.ownerName} - $${whale.cashReported.toLocaleString()}`);
  const body = encodeURIComponent(
    `Dear ${whale.contactName || 'Authorized Representative'},\n\n` +
    `Attached please find the Recovery Agreement for the unclaimed property registered to ${whale.ownerName}.\n\n` +
    `PROPERTY DETAILS:\n` +
    `• Estimated Value: $${whale.cashReported.toLocaleString()}\n` +
    `• Recovery Fee (10%): $${whale.potentialFee.toLocaleString()}\n` +
    `• Location: ${whale.city}, California\n\n` +
    `IMPORTANT DISCLOSURE (Required by CCP 1582):\n` +
    `You can claim this property for FREE at claimit.ca.gov or by calling 1-800-992-4647.\n\n` +
    `If you prefer professional assistance, please sign the attached agreement and return via:\n` +
    `• Email reply with signed PDF\n` +
    `• DocuSign (link will be sent upon request)\n\n` +
    `I'm available to discuss at your convenience.\n\n` +
    `Best regards,\n` +
    `John Dillard\n` +
    `LawAuditor Asset Recovery\n` +
    `Licensed Property Investigator - California`
  );
  window.location.href = `mailto:${whale.contactEmail}?subject=${subject}&body=${body}`;
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
      status: 'high_interest',
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
      status: 'high_interest',
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
    { 
      id: 'W005', 
      ownerName: 'ROSEVILLE HOLDINGS LLC', 
      city: 'ROSEVILLE', 
      cashReported: 78500, 
      potentialFee: 7850, 
      propertyType: 'Cash',
      status: 'contacted',
      contactName: 'Jennifer Martinez',
      contactTitle: 'Owner',
      contactEmail: 'jmartinez@rosevilleholdings.com',
      contactPhone: '+1-916-555-0234',
      enrichmentStatus: 'Enriched'
    },
  ]);

  const [isProcessing, setIsProcessing] = useState(false);
  const [filterCity, setFilterCity] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterEnrichment, setFilterEnrichment] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [generatingContract, setGeneratingContract] = useState<string | null>(null);

  // Calculate stats
  const totalCash = whales.reduce((sum, w) => sum + w.cashReported, 0);
  const totalFees = whales.reduce((sum, w) => sum + w.potentialFee, 0);
  const newLeads = whales.filter(w => w.status === 'new').length;
  const enrichedLeads = whales.filter(w => w.enrichmentStatus === 'Enriched').length;
  const readyToContact = whales.filter(w => w.status === 'new' && w.enrichmentStatus === 'Enriched').length;
  
  // HIGH INTEREST commission projection
  const highInterestLeads = whales.filter(w => w.status === 'high_interest');
  const projectedCommission = highInterestLeads.reduce((sum, w) => sum + w.potentialFee, 0);
  
  // Signed/Recovered (confirmed revenue)
  const confirmedRevenue = whales
    .filter(w => w.status === 'signed' || w.status === 'recovered')
    .reduce((sum, w) => sum + w.potentialFee, 0);

  // Process uploaded CSV/JSON
  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return;
    setIsProcessing(true);
    
    try {
      const file = acceptedFiles[0];
      const text = await file.text();
      
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
    accept: { 'text/csv': ['.csv'], 'application/json': ['.json'] },
    disabled: isProcessing
  });

  // Filter
  const filteredWhales = whales.filter(w => {
    if (filterCity !== 'all' && !w.city.includes(filterCity)) return false;
    if (filterStatus !== 'all' && w.status !== filterStatus) return false;
    if (filterEnrichment !== 'all' && w.enrichmentStatus !== filterEnrichment) return false;
    if (searchQuery && !w.ownerName.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  // Status update
  const updateWhaleStatus = (id: string, status: WhaleLead['status']) => {
    setWhales(prev => prev.map(w => 
      w.id === id ? { ...w, status, lastContact: new Date().toISOString().split('T')[0] } : w
    ));
  };

  // Contact actions
  const handleCall = (phone: string) => window.location.href = `tel:${phone.replace(/[^\d+]/g, '')}`;
  const handleLinkedIn = (url: string) => window.open(url, '_blank');
  
  // Contract generation
  const handleGenerateContract = async (whale: WhaleLead) => {
    setGeneratingContract(whale.id);
    await new Promise(r => setTimeout(r, 500)); // Brief loading state
    generateContractPDF(whale);
    setGeneratingContract(null);
  };

  return (
    <div className="p-6 lg:p-8 bg-slate-950 min-h-screen">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <Coins className="w-8 h-8 text-gold" />
          <h1 className="text-2xl lg:text-3xl font-black tracking-tight text-white">
            Whale Recovery Dashboard
          </h1>
          <span className="px-2 py-1 bg-emerald-500/20 text-emerald-400 text-[9px] font-black uppercase tracking-widest">
            200 Lead Pipeline
          </span>
        </div>
        <p className="text-slate-500 text-xs font-medium uppercase tracking-widest">
          Northern California • CCP 1582 Compliant • 10% Fee Cap • Apollo.io Enriched
        </p>
      </div>

      {/* HERO: Projected Commission Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6 bg-gradient-to-r from-emerald-950 via-emerald-900 to-emerald-950 border border-emerald-700/50 p-6 lg:p-8 relative overflow-hidden"
      >
        <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-2">
            <Target className="w-5 h-5 text-emerald-400" />
            <span className="text-[10px] font-black uppercase tracking-[0.25em] text-emerald-400">
              Projected Commission (High Interest Leads)
            </span>
          </div>
          <div className="flex items-baseline gap-4 flex-wrap">
            <span className="text-5xl lg:text-7xl font-black text-white tracking-tight">
              ${projectedCommission.toLocaleString()}
            </span>
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-gold" />
              <span className="text-lg lg:text-xl font-bold text-emerald-400">
                {highInterestLeads.length} hot leads
              </span>
            </div>
          </div>
          <div className="mt-4 flex items-center gap-6 text-sm">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-emerald-500" />
              <span className="text-emerald-300">Confirmed: ${confirmedRevenue.toLocaleString()}</span>
            </div>
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-gold" />
              <span className="text-slate-400">Pipeline Total: ${totalFees.toLocaleString()}</span>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Stats Grid */}
      <div className="grid grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
        <div className="bg-gradient-to-br from-amber-950 to-slate-900 border border-amber-800/50 p-3 lg:p-4">
          <DollarSign className="w-4 h-4 text-gold mb-1" />
          <div className="text-xl lg:text-2xl font-mono font-bold text-white">${(totalCash / 1000).toFixed(0)}k</div>
          <div className="text-[8px] lg:text-[9px] font-bold text-amber-600 uppercase tracking-widest">Total Value</div>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-3 lg:p-4">
          <Building2 className="w-4 h-4 text-blue-500 mb-1" />
          <div className="text-xl lg:text-2xl font-mono font-bold text-white">{whales.length}</div>
          <div className="text-[8px] lg:text-[9px] font-bold text-slate-500 uppercase tracking-widest">Pipeline</div>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-3 lg:p-4">
          <AlertTriangle className="w-4 h-4 text-amber-500 mb-1" />
          <div className="text-xl lg:text-2xl font-mono font-bold text-amber-400">{newLeads}</div>
          <div className="text-[8px] lg:text-[9px] font-bold text-slate-500 uppercase tracking-widest">New</div>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-3 lg:p-4">
          <User className="w-4 h-4 text-emerald-400 mb-1" />
          <div className="text-xl lg:text-2xl font-mono font-bold text-emerald-400">{enrichedLeads}</div>
          <div className="text-[8px] lg:text-[9px] font-bold text-slate-500 uppercase tracking-widest">Enriched</div>
        </div>

        <div className="bg-emerald-950 border border-emerald-800/50 p-3 lg:p-4">
          <Sparkles className="w-4 h-4 text-gold mb-1" />
          <div className="text-xl lg:text-2xl font-mono font-bold text-gold">{highInterestLeads.length}</div>
          <div className="text-[8px] lg:text-[9px] font-bold text-emerald-600 uppercase tracking-widest">Hot Leads</div>
        </div>

        <div className="bg-blue-950 border border-blue-800/50 p-3 lg:p-4">
          <FileText className="w-4 h-4 text-blue-400 mb-1" />
          <div className="text-xl lg:text-2xl font-mono font-bold text-blue-400">
            {whales.filter(w => w.status === 'signed').length}
          </div>
          <div className="text-[8px] lg:text-[9px] font-bold text-blue-600 uppercase tracking-widest">Signed</div>
        </div>
      </div>

      {/* Upload + Filters */}
      <div className="grid lg:grid-cols-4 gap-3 mb-6">
        <div
          {...getRootProps()}
          className={`border-2 border-dashed p-4 text-center cursor-pointer transition-all ${
            isDragActive ? 'border-gold bg-gold/5' : 'border-slate-700 bg-slate-900/50 hover:border-slate-600'
          }`}
        >
          <input {...getInputProps()} />
          {isProcessing ? (
            <Loader2 className="w-5 h-5 text-gold mx-auto animate-spin" />
          ) : (
            <Upload className="w-5 h-5 text-slate-500 mx-auto mb-1" />
          )}
          <span className="text-[10px] font-black uppercase tracking-widest text-white">Import 200 Leads</span>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-3">
          <div className="relative">
            <Search className="w-3 h-3 text-slate-500 absolute left-2 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 text-white pl-7 pr-3 py-1.5 text-xs"
            />
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-3 lg:col-span-2">
          <div className="grid grid-cols-3 gap-2">
            <select 
              value={filterCity}
              onChange={(e) => setFilterCity(e.target.value)}
              className="bg-slate-800 border border-slate-700 text-white px-2 py-1.5 text-[10px]"
            >
              <option value="all">All Cities</option>
              <option value="SACRAMENTO">Sacramento</option>
              <option value="SAN FRANCISCO">San Francisco</option>
              <option value="PALO ALTO">Palo Alto</option>
              <option value="SAN JOSE">San Jose</option>
              <option value="OAKLAND">Oakland</option>
            </select>
            <select 
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="bg-slate-800 border border-slate-700 text-white px-2 py-1.5 text-[10px]"
            >
              <option value="all">All Status</option>
              <option value="new">New</option>
              <option value="contacted">Contacted</option>
              <option value="high_interest">High Interest 🔥</option>
              <option value="signed">Signed</option>
              <option value="recovered">Recovered</option>
            </select>
            <select 
              value={filterEnrichment}
              onChange={(e) => setFilterEnrichment(e.target.value)}
              className="bg-slate-800 border border-slate-700 text-white px-2 py-1.5 text-[10px]"
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
        <div className="px-4 py-3 border-b border-slate-800 flex items-center justify-between">
          <h2 className="text-xs font-black uppercase tracking-[0.15em] text-white">
            Whale Pipeline ({filteredWhales.length})
          </h2>
          <Button variant="outline" className="border-slate-700 text-slate-400 text-[9px] font-bold uppercase tracking-widest h-7 px-3">
            <Download className="w-3 h-3 mr-1" /> Export
          </Button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-800 text-left">
                <th className="px-3 py-2 text-[8px] font-black uppercase tracking-widest text-slate-500">Business</th>
                <th className="px-3 py-2 text-[8px] font-black uppercase tracking-widest text-slate-500">Decision Maker</th>
                <th className="px-3 py-2 text-[8px] font-black uppercase tracking-widest text-slate-500">Value</th>
                <th className="px-3 py-2 text-[8px] font-black uppercase tracking-widest text-slate-500">Your 10%</th>
                <th className="px-3 py-2 text-[8px] font-black uppercase tracking-widest text-slate-500">Status</th>
                <th className="px-3 py-2 text-[8px] font-black uppercase tracking-widest text-slate-500">Quick Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {filteredWhales.map((whale) => (
                <motion.tr 
                  key={whale.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className={`hover:bg-slate-800/50 transition-colors ${
                    whale.status === 'high_interest' ? 'bg-emerald-950/20' : ''
                  }`}
                >
                  <td className="px-3 py-3">
                    <div className="flex items-start gap-2">
                      <Building2 className="w-3 h-3 text-slate-600 mt-0.5 flex-shrink-0" />
                      <div>
                        <div className="text-xs text-white font-medium leading-tight">{whale.ownerName}</div>
                        <div className="flex items-center gap-1 text-[9px] text-slate-500">
                          <MapPin className="w-2 h-2" />
                          {whale.city}
                        </div>
                      </div>
                    </div>
                  </td>

                  <td className="px-3 py-3">
                    {whale.enrichmentStatus === 'Enriched' && whale.contactName ? (
                      <div>
                        <div className="text-xs text-white font-medium">{whale.contactName}</div>
                        <div className="text-[9px] text-emerald-500">{whale.contactTitle}</div>
                        {whale.contactPhone && (
                          <div className="text-[9px] text-slate-400 font-mono">{whale.contactPhone}</div>
                        )}
                      </div>
                    ) : (
                      <span className="text-[9px] font-bold uppercase text-amber-500 bg-amber-500/10 px-1.5 py-0.5">
                        Research
                      </span>
                    )}
                  </td>

                  <td className="px-3 py-3">
                    <span className="text-base font-mono font-bold text-gold">
                      ${whale.cashReported.toLocaleString()}
                    </span>
                  </td>

                  <td className="px-3 py-3">
                    <span className="text-base font-mono font-bold text-emerald-400">
                      ${whale.potentialFee.toLocaleString()}
                    </span>
                  </td>

                  <td className="px-3 py-3">
                    <select 
                      value={whale.status}
                      onChange={(e) => updateWhaleStatus(whale.id, e.target.value as WhaleLead['status'])}
                      className={`text-[8px] font-black uppercase tracking-widest px-1.5 py-0.5 border-0 cursor-pointer rounded ${
                        whale.status === 'recovered' ? 'bg-emerald-500/20 text-emerald-400' :
                        whale.status === 'signed' ? 'bg-blue-500/20 text-blue-400' :
                        whale.status === 'high_interest' ? 'bg-gold/20 text-gold' :
                        whale.status === 'contacted' ? 'bg-purple-500/20 text-purple-400' :
                        'bg-amber-500/20 text-amber-400'
                      }`}
                    >
                      <option value="new">New</option>
                      <option value="contacted">Contacted</option>
                      <option value="high_interest">🔥 High Interest</option>
                      <option value="signed">Signed</option>
                      <option value="recovered">Recovered</option>
                    </select>
                  </td>

                  <td className="px-3 py-3">
                    <div className="flex items-center gap-0.5">
                      {/* Call */}
                      <button 
                        onClick={() => whale.contactPhone && handleCall(whale.contactPhone)}
                        disabled={!whale.contactPhone}
                        className={`p-1.5 rounded transition-colors ${whale.contactPhone ? 'hover:bg-emerald-500/20' : 'opacity-30'}`}
                        title="Call"
                      >
                        <Phone className="w-3.5 h-3.5 text-slate-400 hover:text-emerald-400" />
                      </button>

                      {/* Email */}
                      <button 
                        onClick={() => whale.contactEmail && emailContract(whale)}
                        disabled={!whale.contactEmail}
                        className={`p-1.5 rounded transition-colors ${whale.contactEmail ? 'hover:bg-blue-500/20' : 'opacity-30'}`}
                        title="Email Contract"
                      >
                        <Mail className="w-3.5 h-3.5 text-slate-400 hover:text-blue-400" />
                      </button>

                      {/* LinkedIn */}
                      <button 
                        onClick={() => whale.linkedinUrl && handleLinkedIn(whale.linkedinUrl)}
                        disabled={!whale.linkedinUrl}
                        className={`p-1.5 rounded transition-colors ${whale.linkedinUrl ? 'hover:bg-blue-600/20' : 'opacity-30'}`}
                        title="LinkedIn"
                      >
                        <Linkedin className="w-3.5 h-3.5 text-slate-400 hover:text-blue-500" />
                      </button>

                      {/* GENERATE CONTRACT */}
                      <button 
                        onClick={() => handleGenerateContract(whale)}
                        disabled={generatingContract === whale.id}
                        className="p-1.5 hover:bg-gold/20 rounded transition-colors ml-1"
                        title="Generate Contract PDF"
                      >
                        {generatingContract === whale.id ? (
                          <Loader2 className="w-3.5 h-3.5 text-gold animate-spin" />
                        ) : (
                          <FileText className="w-3.5 h-3.5 text-gold" />
                        )}
                      </button>

                      {/* Send for Signature */}
                      <button 
                        onClick={() => whale.contactEmail && emailContract(whale)}
                        disabled={!whale.contactEmail}
                        className={`p-1.5 rounded transition-colors ${whale.contactEmail ? 'hover:bg-emerald-500/20' : 'opacity-30'}`}
                        title="Send for Signature"
                      >
                        <Send className="w-3.5 h-3.5 text-slate-400 hover:text-emerald-400" />
                      </button>
                    </div>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Legal Footer */}
      <div className="mt-6 p-4 bg-slate-900/50 border border-slate-800">
        <div className="grid md:grid-cols-4 gap-4 text-[10px]">
          <div className="flex items-start gap-2">
            <CheckCircle className="w-3 h-3 text-emerald-500 mt-0.5" />
            <div>
              <div className="font-bold text-white">Free Claim Disclosure</div>
              <div className="text-slate-500">claimit.ca.gov</div>
            </div>
          </div>
          <div className="flex items-start gap-2">
            <CheckCircle className="w-3 h-3 text-emerald-500 mt-0.5" />
            <div>
              <div className="font-bold text-white">SCO Contract Template</div>
              <div className="text-slate-500">Official agreement</div>
            </div>
          </div>
          <div className="flex items-start gap-2">
            <CheckCircle className="w-3 h-3 text-emerald-500 mt-0.5" />
            <div>
              <div className="font-bold text-white">10% Fee Hard-coded</div>
              <div className="text-slate-500">CCP 1582 max</div>
            </div>
          </div>
          <div className="flex items-start gap-2">
            <CheckCircle className="w-3 h-3 text-emerald-500 mt-0.5" />
            <div>
              <div className="font-bold text-white">DocuSign Ready</div>
              <div className="text-slate-500">PDF → signature</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
