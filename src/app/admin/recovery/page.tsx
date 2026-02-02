'use client';

import { useState, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
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
  FileText,
  Send,
  Sparkles,
  Target,
  Zap,
  Crown,
  Medal,
  Bot,
  PhoneCall,
  SlidersHorizontal,
  ChevronRight
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useDropzone } from 'react-dropzone';

// ═══════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════

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

type LeadTier = 'gold' | 'silver' | 'automation';

// ═══════════════════════════════════════════════════════════════════════════
// HELPER FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════

function getLeadTier(value: number): LeadTier {
  if (value >= 25000) return 'gold';
  if (value >= 10000) return 'silver';
  return 'automation';
}

function getTierStyles(tier: LeadTier) {
  switch (tier) {
    case 'gold':
      return {
        bg: 'bg-gradient-to-r from-amber-950/50 to-yellow-950/30',
        border: 'border-l-4 border-l-gold',
        badge: 'bg-gold/20 text-gold',
        icon: Crown,
        label: 'GOLD',
        action: 'Priority Call'
      };
    case 'silver':
      return {
        bg: 'bg-gradient-to-r from-slate-800/50 to-zinc-800/30',
        border: 'border-l-4 border-l-slate-400',
        badge: 'bg-slate-400/20 text-slate-300',
        icon: Medal,
        label: 'SILVER',
        action: 'Generate Contract'
      };
    case 'automation':
      return {
        bg: 'bg-slate-900/30',
        border: 'border-l-4 border-l-blue-500/50',
        badge: 'bg-blue-500/20 text-blue-400',
        icon: Bot,
        label: 'AUTO',
        action: 'AI Warm-up'
      };
  }
}

// Priority Call Script Generator
function openPriorityCallScript(whale: WhaleLead) {
  const script = `
PRIORITY CALL SCRIPT - GOLD TIER
================================
Company: ${whale.ownerName}
Contact: ${whale.contactName || 'Decision Maker'}
Title: ${whale.contactTitle || 'Owner/CFO'}
Phone: ${whale.contactPhone || 'N/A'}
Value: $${whale.cashReported.toLocaleString()}
Your Fee: $${whale.potentialFee.toLocaleString()}

OPENING:
"Hi ${whale.contactName?.split(' ')[0] || 'there'}, this is John Dillard. I'm a licensed property investigator and I found that ${whale.ownerName} has $${whale.cashReported.toLocaleString()} in unclaimed funds with the California State Controller."

PAUSE - Let them react

QUALIFYING:
"Are you the right person to discuss recovering these funds?"

IF YES:
"Great. I can help you recover this. My fee is 10%, which is $${whale.potentialFee.toLocaleString()}. I handle all the paperwork."

DISCLOSURE (Required by CCP 1582):
"I should mention - you CAN claim this yourself for free at claimit.ca.gov. Most businesses prefer to have someone handle it professionally."

CLOSE:
"I can email you the agreement right now. What's the best email?"

OBJECTION HANDLERS:
- "I need to think about it" → "Totally understand. These funds don't expire, but I'm reaching out to other businesses in ${whale.city} this week. Can I follow up Friday?"
- "Is this a scam?" → "Great question. You can verify these funds yourself at claimit.ca.gov. I'm just offering to handle the recovery paperwork."
- "10% is too much" → "That's the California legal maximum. Given the paperwork involved, most CFOs find it worth their time savings."
`;
  
  // Open in new window as a printable script
  const win = window.open('', '_blank', 'width=600,height=800');
  if (win) {
    win.document.write(`<html><head><title>Call Script - ${whale.ownerName}</title>
      <style>body{font-family:monospace;padding:20px;white-space:pre-wrap;background:#1a1a2e;color:#eee;line-height:1.6}
      h1{color:#ffd700;}</style></head>
      <body><h1>🎯 PRIORITY CALL</h1>${script}</body></html>`);
    win.document.close();
  }
  
  // Also trigger phone dialer
  if (whale.contactPhone) {
    window.location.href = `tel:${whale.contactPhone.replace(/[^\d+]/g, '')}`;
  }
}

// AI Warm-up Email Generator
function generateAIWarmupEmail(whale: WhaleLead) {
  const subject = encodeURIComponent(`Quick Question About ${whale.ownerName}`);
  const body = encodeURIComponent(
`Hi ${whale.contactName?.split(' ')[0] || 'there'},

I came across some interesting data while reviewing California's unclaimed property database.

It looks like ${whale.ownerName} may have approximately $${whale.cashReported.toLocaleString()} in unclaimed funds registered with the State Controller's Office.

I help businesses recover these funds - completely free to check, and I only charge a fee (10%, the CA legal max) if we successfully recover the money.

Would you be open to a quick 5-minute call to see if this matches your records?

Quick note: You can also claim directly for free at claimit.ca.gov if you prefer to handle it yourself.

Best,
John Dillard
LawAuditor Asset Recovery
Licensed Property Investigator - California

P.S. This isn't urgent - these funds don't expire. But I'm reaching out to other ${whale.city} businesses this week and wanted to give you first notice.`
  );
  
  window.location.href = `mailto:${whale.contactEmail}?subject=${subject}&body=${body}`;
}

// Contract PDF Generator (from jsPDF)
function generateContractPDF(whale: WhaleLead): void {
  import('jspdf').then(({ jsPDF }) => {
    const doc = new jsPDF();
    const today = new Date().toLocaleDateString('en-US', { 
      year: 'numeric', month: 'long', day: 'numeric' 
    });
    
    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.text('UNCLAIMED PROPERTY RECOVERY AGREEMENT', 105, 25, { align: 'center' });
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text('California Civil Code Section 1582 Compliant', 105, 32, { align: 'center' });
    
    doc.setLineWidth(0.5);
    doc.line(20, 38, 190, 38);
    
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
    
    doc.setFillColor(240, 240, 240);
    doc.rect(25, y - 4, 160, 20, 'F');
    doc.setFont('helvetica', 'bold');
    doc.text(`10% of Recovered Amount = $${whale.potentialFee.toLocaleString('en-US', { minimumFractionDigits: 2 })}`, 30, y + 4);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.text('(Maximum fee permitted under California Civil Code § 1582)', 30, y + 12);
    doc.setFontSize(11);
    y += 28;
    
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
      'Website: https://claimit.ca.gov    Phone: 1-800-992-4647'
    ];
    
    disclosure.forEach(line => {
      doc.text(line, 25, y);
      y += 5;
    });
    
    y += 15;
    
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
    
    doc.setFontSize(8);
    doc.setTextColor(128, 128, 128);
    doc.text('LawAuditor Asset Recovery | Licensed Property Investigator | California', 105, 285, { align: 'center' });
    
    const filename = `Contract_${whale.ownerName.replace(/[^a-zA-Z0-9]/g, '_').substring(0, 30)}.pdf`;
    doc.save(filename);
  });
}

// ═══════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════

export default function WhaleRecoveryDashboard() {
  // Sample data
  const [whales, setWhales] = useState<WhaleLead[]>([
    { 
      id: 'W001', ownerName: 'SACRAMENTO TECH SOLUTIONS LLC', city: 'SACRAMENTO', 
      cashReported: 47500, potentialFee: 4750, propertyType: 'Cash', status: 'high_interest',
      contactName: 'Michael Chen', contactTitle: 'CEO', contactEmail: 'mchen@sactech.com',
      contactPhone: '+1-916-555-0142', linkedinUrl: 'https://linkedin.com/in/michaelchen',
      enrichmentStatus: 'Enriched'
    },
    { 
      id: 'W002', ownerName: 'BAY AREA INVESTMENTS INC', city: 'SAN FRANCISCO', 
      cashReported: 125000, potentialFee: 12500, propertyType: 'Securities', status: 'new',
      contactName: 'Sarah Williams', contactTitle: 'CFO', contactEmail: 'swilliams@bayareainv.com',
      contactPhone: '+1-415-555-0198', linkedinUrl: 'https://linkedin.com/in/sarahwilliams',
      enrichmentStatus: 'Enriched'
    },
    { 
      id: 'W003', ownerName: 'PALO ALTO CONSULTING GROUP LLP', city: 'PALO ALTO', 
      cashReported: 89000, potentialFee: 8900, propertyType: 'Cash', status: 'signed',
      contactName: 'David Park', contactTitle: 'Managing Partner', contactEmail: 'dpark@paconsulting.com',
      contactPhone: '+1-650-555-0167', linkedinUrl: 'https://linkedin.com/in/davidpark',
      enrichmentStatus: 'Enriched'
    },
    { 
      id: 'W004', ownerName: 'FOLSOM MANUFACTURING CORP', city: 'FOLSOM', 
      cashReported: 18500, potentialFee: 1850, propertyType: 'Cash', status: 'new',
      contactName: 'Robert Taylor', contactTitle: 'Controller', contactEmail: 'rtaylor@folsommfg.com',
      contactPhone: '+1-916-555-0289', enrichmentStatus: 'Enriched'
    },
    { 
      id: 'W005', ownerName: 'ROSEVILLE HOLDINGS LLC', city: 'ROSEVILLE', 
      cashReported: 78500, potentialFee: 7850, propertyType: 'Cash', status: 'contacted',
      contactName: 'Jennifer Martinez', contactTitle: 'Owner', contactEmail: 'jmartinez@rosevilleholdings.com',
      contactPhone: '+1-916-555-0234', enrichmentStatus: 'Enriched'
    },
    { 
      id: 'W006', ownerName: 'OAKLAND DISTRIBUTION CENTER INC', city: 'OAKLAND', 
      cashReported: 32000, potentialFee: 3200, propertyType: 'Cash', status: 'new',
      contactName: 'Marcus Johnson', contactTitle: 'CFO', contactEmail: 'mjohnson@oaklanddist.com',
      contactPhone: '+1-510-555-0156', enrichmentStatus: 'Enriched'
    },
    { 
      id: 'W007', ownerName: 'SAN JOSE TECH VENTURES LLC', city: 'SAN JOSE', 
      cashReported: 8500, potentialFee: 850, propertyType: 'Cash', status: 'new',
      contactName: 'Lisa Wong', contactTitle: 'Founder', contactEmail: 'lwong@sjtechventures.com',
      contactPhone: '+1-408-555-0178', enrichmentStatus: 'Enriched'
    },
    { 
      id: 'W008', ownerName: 'BERKELEY RESEARCH PARTNERS LLP', city: 'BERKELEY', 
      cashReported: 6200, potentialFee: 620, propertyType: 'Cash', status: 'new',
      enrichmentStatus: 'Needs Manual Research'
    },
  ]);

  // Filters
  const [selectedCity, setSelectedCity] = useState<string>('all');
  const [minValue, setMinValue] = useState<number>(10000);
  const [searchQuery, setSearchQuery] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [generatingContract, setGeneratingContract] = useState<string | null>(null);

  // Get unique cities
  const cities = useMemo(() => {
    const uniqueCities = [...new Set(whales.map(w => w.city))].sort();
    return uniqueCities;
  }, [whales]);

  // Filtered whales based on city and min value
  const filteredWhales = useMemo(() => {
    return whales.filter(w => {
      if (selectedCity !== 'all' && w.city !== selectedCity) return false;
      if (w.cashReported < minValue) return false;
      if (searchQuery && !w.ownerName.toLowerCase().includes(searchQuery.toLowerCase())) return false;
      return true;
    }).sort((a, b) => b.cashReported - a.cashReported); // Highest value first
  }, [whales, selectedCity, minValue, searchQuery]);

  // Real-time stats based on filters
  const stats = useMemo(() => {
    const filtered = filteredWhales;
    const goldLeads = filtered.filter(w => w.cashReported >= 25000);
    const silverLeads = filtered.filter(w => w.cashReported >= 10000 && w.cashReported < 25000);
    const autoLeads = filtered.filter(w => w.cashReported >= 5000 && w.cashReported < 10000);
    const highInterest = filtered.filter(w => w.status === 'high_interest' || w.status === 'signed');
    
    return {
      totalValue: filtered.reduce((sum, w) => sum + w.cashReported, 0),
      totalFees: filtered.reduce((sum, w) => sum + w.potentialFee, 0),
      projectedCommission: highInterest.reduce((sum, w) => sum + w.potentialFee, 0),
      goldCount: goldLeads.length,
      goldValue: goldLeads.reduce((sum, w) => sum + w.potentialFee, 0),
      silverCount: silverLeads.length,
      silverValue: silverLeads.reduce((sum, w) => sum + w.potentialFee, 0),
      autoCount: autoLeads.length,
      autoValue: autoLeads.reduce((sum, w) => sum + w.potentialFee, 0),
      enrichedCount: filtered.filter(w => w.enrichmentStatus === 'Enriched').length,
      totalCount: filtered.length
    };
  }, [filteredWhales]);

  // CSV/JSON import
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
          enrichmentStatus: (row.ENRICHMENT_STATUS || 'Needs Manual Research') as WhaleLead['enrichmentStatus'],
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
    accept: { 'text/csv': ['.csv'], 'application/json': ['.json'] },
    disabled: isProcessing
  });

  // Status update
  const updateWhaleStatus = (id: string, status: WhaleLead['status']) => {
    setWhales(prev => prev.map(w => 
      w.id === id ? { ...w, status, lastContact: new Date().toISOString().split('T')[0] } : w
    ));
  };

  // Tier action handler
  const handleTierAction = async (whale: WhaleLead, tier: LeadTier) => {
    switch (tier) {
      case 'gold':
        openPriorityCallScript(whale);
        updateWhaleStatus(whale.id, 'contacted');
        break;
      case 'silver':
        setGeneratingContract(whale.id);
        await new Promise(r => setTimeout(r, 300));
        generateContractPDF(whale);
        setGeneratingContract(null);
        break;
      case 'automation':
        generateAIWarmupEmail(whale);
        updateWhaleStatus(whale.id, 'contacted');
        break;
    }
  };

  return (
    <div className="flex min-h-screen bg-slate-950">
      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* CITY SEARCH PANEL (Sidebar) */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      <aside className="w-72 bg-slate-900 border-r border-slate-800 p-4 flex flex-col">
        <div className="flex items-center gap-2 mb-6">
          <SlidersHorizontal className="w-5 h-5 text-gold" />
          <h2 className="text-sm font-black uppercase tracking-widest text-white">City Panel</h2>
        </div>

        {/* City Filter */}
        <div className="mb-4">
          <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-2 block">
            Filter by City
          </label>
          <select 
            value={selectedCity}
            onChange={(e) => setSelectedCity(e.target.value)}
            className="w-full bg-slate-800 border border-slate-700 text-white px-3 py-2.5 text-sm rounded"
          >
            <option value="all">All Northern California</option>
            {cities.map(city => (
              <option key={city} value={city}>{city}</option>
            ))}
          </select>
        </div>

        {/* Minimum Value Slider */}
        <div className="mb-6">
          <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-2 block">
            Minimum Value: ${minValue.toLocaleString()}
          </label>
          <input 
            type="range" 
            min="5000" 
            max="50000" 
            step="1000"
            value={minValue}
            onChange={(e) => setMinValue(Number(e.target.value))}
            className="w-full accent-gold"
          />
          <div className="flex justify-between text-[9px] text-slate-600 mt-1">
            <span>$5k</span>
            <span>$50k</span>
          </div>
        </div>

        {/* Recoverable Fees Card */}
        <div className="bg-gradient-to-br from-emerald-950 to-slate-900 border border-emerald-800/50 p-4 rounded mb-4">
          <div className="text-[9px] font-bold uppercase tracking-widest text-emerald-500 mb-1">
            Total Recoverable Fees
          </div>
          <div className="text-3xl font-black text-white">
            ${stats.totalFees.toLocaleString()}
          </div>
          <div className="text-[10px] text-emerald-400 mt-1">
            from {stats.totalCount} leads in view
          </div>
        </div>

        {/* Tier Breakdown */}
        <div className="space-y-2 mb-6">
          <div className="bg-amber-950/30 border border-amber-800/30 p-3 rounded flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Crown className="w-4 h-4 text-gold" />
              <span className="text-[10px] font-bold uppercase tracking-widest text-gold">Gold</span>
            </div>
            <div className="text-right">
              <div className="text-sm font-bold text-white">{stats.goldCount}</div>
              <div className="text-[9px] text-amber-400">${stats.goldValue.toLocaleString()}</div>
            </div>
          </div>

          <div className="bg-slate-800/30 border border-slate-700/30 p-3 rounded flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Medal className="w-4 h-4 text-slate-400" />
              <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Silver</span>
            </div>
            <div className="text-right">
              <div className="text-sm font-bold text-white">{stats.silverCount}</div>
              <div className="text-[9px] text-slate-400">${stats.silverValue.toLocaleString()}</div>
            </div>
          </div>

          <div className="bg-blue-950/30 border border-blue-800/30 p-3 rounded flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Bot className="w-4 h-4 text-blue-400" />
              <span className="text-[10px] font-bold uppercase tracking-widest text-blue-400">Auto</span>
            </div>
            <div className="text-right">
              <div className="text-sm font-bold text-white">{stats.autoCount}</div>
              <div className="text-[9px] text-blue-400">${stats.autoValue.toLocaleString()}</div>
            </div>
          </div>
        </div>

        {/* Import */}
        <div
          {...getRootProps()}
          className={`border-2 border-dashed p-4 text-center cursor-pointer transition-all rounded ${
            isDragActive ? 'border-gold bg-gold/5' : 'border-slate-700 hover:border-slate-600'
          }`}
        >
          <input {...getInputProps()} />
          {isProcessing ? (
            <Loader2 className="w-5 h-5 text-gold mx-auto animate-spin" />
          ) : (
            <Upload className="w-5 h-5 text-slate-500 mx-auto mb-1" />
          )}
          <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
            Import Leads
          </span>
        </div>

        {/* Enriched stat */}
        <div className="mt-auto pt-4 border-t border-slate-800">
          <div className="flex items-center justify-between text-[10px]">
            <span className="text-slate-500">Enriched Contacts</span>
            <span className="text-emerald-400 font-bold">{stats.enrichedCount}/{stats.totalCount}</span>
          </div>
        </div>
      </aside>

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* MAIN CONTENT */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      <main className="flex-1 p-6 overflow-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <div className="flex items-center gap-3">
              <Coins className="w-7 h-7 text-gold" />
              <h1 className="text-2xl font-black tracking-tight text-white">
                Whale Recovery
              </h1>
              {selectedCity !== 'all' && (
                <span className="px-2 py-1 bg-blue-500/20 text-blue-400 text-[9px] font-black uppercase tracking-widest rounded">
                  {selectedCity}
                </span>
              )}
            </div>
            <p className="text-slate-500 text-xs mt-1">
              Northern California • CCP 1582 • 10% Fee Cap
            </p>
          </div>
          
          {/* Search */}
          <div className="relative w-64">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search businesses..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 text-white pl-10 pr-4 py-2 text-sm rounded"
            />
          </div>
        </div>

        {/* PROJECTED COMMISSION HERO */}
        <motion.div
          key={`${selectedCity}-${minValue}`}
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-gradient-to-r from-emerald-950 via-emerald-900 to-emerald-950 border border-emerald-700/50 p-6 mb-6 relative overflow-hidden rounded"
        >
          <div className="absolute top-0 right-0 w-48 h-48 bg-emerald-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
          <div className="relative z-10 flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Target className="w-4 h-4 text-emerald-400" />
                <span className="text-[9px] font-black uppercase tracking-[0.2em] text-emerald-400">
                  Projected Commission
                </span>
                {selectedCity !== 'all' && (
                  <span className="text-[9px] text-emerald-500">• {selectedCity}</span>
                )}
              </div>
              <div className="text-4xl lg:text-5xl font-black text-white tracking-tight">
                ${stats.projectedCommission.toLocaleString()}
              </div>
              <div className="text-[10px] text-emerald-400 mt-1">
                from high-interest & signed leads
              </div>
            </div>
            <div className="text-right">
              <div className="text-[10px] text-slate-400 uppercase tracking-widest mb-1">Pipeline Total</div>
              <div className="text-2xl font-mono font-bold text-gold">${stats.totalFees.toLocaleString()}</div>
            </div>
          </div>
        </motion.div>

        {/* WHALE TABLE */}
        <div className="bg-slate-900 border border-slate-800 rounded overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <h2 className="text-xs font-black uppercase tracking-[0.15em] text-white">
                Pipeline ({filteredWhales.length})
              </h2>
              <div className="flex items-center gap-2">
                <span className="flex items-center gap-1 text-[9px] text-gold">
                  <Crown className="w-3 h-3" /> {'>'}$25k
                </span>
                <span className="flex items-center gap-1 text-[9px] text-slate-400">
                  <Medal className="w-3 h-3" /> $10-25k
                </span>
                <span className="flex items-center gap-1 text-[9px] text-blue-400">
                  <Bot className="w-3 h-3" /> $5-10k
                </span>
              </div>
            </div>
            <Button variant="outline" className="border-slate-700 text-slate-400 text-[9px] font-bold uppercase h-7 px-3">
              <Download className="w-3 h-3 mr-1" /> Export
            </Button>
          </div>

          <div className="divide-y divide-slate-800">
            {filteredWhales.map((whale) => {
              const tier = getLeadTier(whale.cashReported);
              const tierStyle = getTierStyles(tier);
              const TierIcon = tierStyle.icon;

              return (
                <motion.div
                  key={whale.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className={`${tierStyle.bg} ${tierStyle.border} hover:bg-slate-800/30 transition-colors`}
                >
                  <div className="flex items-center gap-4 p-4">
                    {/* Tier Badge */}
                    <div className={`${tierStyle.badge} px-2 py-1 rounded text-[9px] font-black uppercase tracking-widest flex items-center gap-1 w-20 justify-center`}>
                      <TierIcon className="w-3 h-3" />
                      {tierStyle.label}
                    </div>

                    {/* Business Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-white truncate">{whale.ownerName}</span>
                        <span className="text-[9px] text-slate-500">{whale.city}</span>
                      </div>
                      {whale.contactName && (
                        <div className="text-[10px] text-slate-400">
                          {whale.contactName} • {whale.contactTitle}
                        </div>
                      )}
                    </div>

                    {/* Value */}
                    <div className="text-right w-28">
                      <div className="text-lg font-mono font-bold text-gold">
                        ${whale.cashReported.toLocaleString()}
                      </div>
                      <div className="text-[10px] text-emerald-500">
                        Fee: ${whale.potentialFee.toLocaleString()}
                      </div>
                    </div>

                    {/* Status */}
                    <select 
                      value={whale.status}
                      onChange={(e) => updateWhaleStatus(whale.id, e.target.value as WhaleLead['status'])}
                      className={`text-[8px] font-black uppercase tracking-widest px-2 py-1 border-0 rounded w-28 ${
                        whale.status === 'recovered' ? 'bg-emerald-500/20 text-emerald-400' :
                        whale.status === 'signed' ? 'bg-blue-500/20 text-blue-400' :
                        whale.status === 'high_interest' ? 'bg-gold/20 text-gold' :
                        whale.status === 'contacted' ? 'bg-purple-500/20 text-purple-400' :
                        'bg-slate-700/50 text-slate-400'
                      }`}
                    >
                      <option value="new">New</option>
                      <option value="contacted">Contacted</option>
                      <option value="high_interest">🔥 High Interest</option>
                      <option value="signed">Signed</option>
                      <option value="recovered">Recovered</option>
                    </select>

                    {/* Quick Contact */}
                    <div className="flex items-center gap-1">
                      {whale.contactPhone && (
                        <button 
                          onClick={() => window.location.href = `tel:${whale.contactPhone?.replace(/[^\d+]/g, '')}`}
                          className="p-1.5 hover:bg-emerald-500/20 rounded"
                        >
                          <Phone className="w-3.5 h-3.5 text-slate-400 hover:text-emerald-400" />
                        </button>
                      )}
                      {whale.contactEmail && (
                        <button 
                          onClick={() => window.location.href = `mailto:${whale.contactEmail}`}
                          className="p-1.5 hover:bg-blue-500/20 rounded"
                        >
                          <Mail className="w-3.5 h-3.5 text-slate-400 hover:text-blue-400" />
                        </button>
                      )}
                      {whale.linkedinUrl && (
                        <button 
                          onClick={() => window.open(whale.linkedinUrl, '_blank')}
                          className="p-1.5 hover:bg-blue-600/20 rounded"
                        >
                          <Linkedin className="w-3.5 h-3.5 text-slate-400 hover:text-blue-500" />
                        </button>
                      )}
                    </div>

                    {/* TIER ACTION BUTTON */}
                    <Button
                      onClick={() => handleTierAction(whale, tier)}
                      disabled={generatingContract === whale.id || !whale.enrichmentStatus.includes('Enriched')}
                      className={`text-[9px] font-black uppercase tracking-widest h-8 px-4 rounded ${
                        tier === 'gold' 
                          ? 'bg-gold hover:bg-amber-500 text-slate-900' 
                          : tier === 'silver'
                          ? 'bg-slate-600 hover:bg-slate-500 text-white'
                          : 'bg-blue-600 hover:bg-blue-500 text-white'
                      }`}
                    >
                      {generatingContract === whale.id ? (
                        <Loader2 className="w-3 h-3 animate-spin" />
                      ) : tier === 'gold' ? (
                        <>
                          <PhoneCall className="w-3 h-3 mr-1" />
                          Priority Call
                        </>
                      ) : tier === 'silver' ? (
                        <>
                          <FileText className="w-3 h-3 mr-1" />
                          Contract
                        </>
                      ) : (
                        <>
                          <Bot className="w-3 h-3 mr-1" />
                          AI Warm-up
                        </>
                      )}
                    </Button>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* Legal Footer */}
        <div className="mt-6 p-4 bg-slate-900/50 border border-slate-800 rounded">
          <div className="flex items-center justify-between text-[9px] text-slate-500">
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1">
                <CheckCircle className="w-3 h-3 text-emerald-500" /> CCP 1582 Compliant
              </span>
              <span className="flex items-center gap-1">
                <CheckCircle className="w-3 h-3 text-emerald-500" /> 10% Fee Hard-coded
              </span>
              <span className="flex items-center gap-1">
                <CheckCircle className="w-3 h-3 text-emerald-500" /> Free Claim Disclosure
              </span>
            </div>
            <span>claimit.ca.gov</span>
          </div>
        </div>
      </main>
    </div>
  );
}
