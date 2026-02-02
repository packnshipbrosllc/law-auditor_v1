'use client';

import { useState, useCallback, useMemo, useEffect } from 'react';
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
  Download,
  Linkedin,
  Loader2,
  FileText,
  Sparkles,
  Target,
  Crown,
  Medal,
  Bot,
  PhoneCall,
  SlidersHorizontal,
  RefreshCw,
  Database,
  Search
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useDropzone } from 'react-dropzone';

// ═══════════════════════════════════════════════════════════════════════════
// TYPES (Matches database schema)
// ═══════════════════════════════════════════════════════════════════════════

interface WhaleLead {
  id: string;
  // Business Info
  owner_name: string;
  city: string;
  cash_reported: number;
  potential_fee: number;
  property_type: string;
  status: 'new' | 'contacted' | 'high_interest' | 'signed' | 'recovered';
  // Decision Maker (Apollo Enriched)
  decision_maker_name: string | null;
  decision_maker_title: string | null;
  direct_email: string | null;
  direct_phone: string | null;
  linkedin_url: string | null;
  enrichment_status: 'Enriched' | 'Needs Manual Research' | 'Pending';
  // Metadata
  last_contact: string | null;
  notes: string | null;
  created_at?: string;
  updated_at?: string;
}

type LeadTier = 'gold' | 'silver' | 'automation';

// ═══════════════════════════════════════════════════════════════════════════
// HELPER FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════

function getLeadTier(cashReported: number): LeadTier {
  if (cashReported >= 25000) return 'gold';
  if (cashReported >= 10000) return 'silver';
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
  const contactFirstName = whale.decision_maker_name?.split(' ')[0] || 'there';
  const script = `
PRIORITY CALL SCRIPT - GOLD TIER
================================
Company: ${whale.owner_name}
Contact: ${whale.decision_maker_name || 'Decision Maker'}
Title: ${whale.decision_maker_title || 'Owner/CFO'}
Phone: ${whale.direct_phone || 'N/A'}
Value: $${whale.cash_reported.toLocaleString()}
Your Fee: $${whale.potential_fee.toLocaleString()}

OPENING:
"Hi ${contactFirstName}, this is John Dillard. I'm a licensed property investigator and I found that ${whale.owner_name} has $${whale.cash_reported.toLocaleString()} in unclaimed funds with the California State Controller."

PAUSE - Let them react

QUALIFYING:
"Are you the right person to discuss recovering these funds?"

IF YES:
"Great. I can help you recover this. My fee is 10%, which is $${whale.potential_fee.toLocaleString()}. I handle all the paperwork."

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
    win.document.write(`<html><head><title>Call Script - ${whale.owner_name}</title>
      <style>body{font-family:monospace;padding:20px;white-space:pre-wrap;background:#1a1a2e;color:#eee;line-height:1.6}
      h1{color:#ffd700;}</style></head>
      <body><h1>🎯 PRIORITY CALL</h1>${script}</body></html>`);
    win.document.close();
  }
  
  // Also trigger phone dialer
  if (whale.direct_phone) {
    window.location.href = `tel:${whale.direct_phone.replace(/[^\d+]/g, '')}`;
  }
}

// AI Warm-up Email Generator
function generateAIWarmupEmail(whale: WhaleLead) {
  const contactFirstName = whale.decision_maker_name?.split(' ')[0] || 'there';
  const subject = encodeURIComponent(`Quick Question About ${whale.owner_name}`);
  const body = encodeURIComponent(
`Hi ${contactFirstName},

I came across some interesting data while reviewing California's unclaimed property database.

It looks like ${whale.owner_name} may have approximately $${whale.cash_reported.toLocaleString()} in unclaimed funds registered with the State Controller's Office.

I help businesses recover these funds - completely free to check, and I only charge a fee (10%, the CA legal max) if we successfully recover the money.

Would you be open to a quick 5-minute call to see if this matches your records?

Quick note: You can also claim directly for free at claimit.ca.gov if you prefer to handle it yourself.

Best,
John Dillard
LawAuditor Asset Recovery
Licensed Property Investigator - California

P.S. This isn't urgent - these funds don't expire. But I'm reaching out to other ${whale.city} businesses this week and wanted to give you first notice.`
  );
  
  window.location.href = `mailto:${whale.direct_email}?subject=${subject}&body=${body}`;
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
    doc.text(`Property Owner: ${whale.owner_name}`, 25, y);
    y += 6;
    doc.text(`Contact: ${whale.decision_maker_name || '[AUTHORIZED REPRESENTATIVE]'}`, 25, y);
    y += 6;
    doc.text(`Title: ${whale.decision_maker_title || '[TITLE]'}`, 25, y);
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
    doc.text(`Estimated Value: $${whale.cash_reported.toLocaleString('en-US', { minimumFractionDigits: 2 })}`, 25, y);
    y += 6;
    doc.text(`Property Type: ${whale.property_type || 'Cash/Financial Assets'}`, 25, y);
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
    doc.text(`10% of Recovered Amount = $${whale.potential_fee.toLocaleString('en-US', { minimumFractionDigits: 2 })}`, 30, y + 4);
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
    doc.text(`Name: ${whale.decision_maker_name || '________________________'}`, 25, y);
    doc.text('Name: John Dillard', 110, y);
    y += 6;
    doc.text(`Date: ${today}`, 25, y);
    doc.text(`Date: ${today}`, 110, y);
    
    doc.setFontSize(8);
    doc.setTextColor(128, 128, 128);
    doc.text('LawAuditor Asset Recovery | Licensed Property Investigator | California', 105, 285, { align: 'center' });
    
    const filename = `Contract_${whale.owner_name.replace(/[^a-zA-Z0-9]/g, '_').substring(0, 30)}.pdf`;
    doc.save(filename);
  });
}

// ═══════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════

export default function WhaleRecoveryDashboard() {
  // State
  const [whales, setWhales] = useState<WhaleLead[]>([]);
  const [cities, setCities] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [generatingContract, setGeneratingContract] = useState<string | null>(null);
  const [dataSource, setDataSource] = useState<'database' | 'local'>('local');

  // Filters
  const [selectedCity, setSelectedCity] = useState<string>('all');
  const [minValue, setMinValue] = useState<number>(10000);
  const [searchQuery, setSearchQuery] = useState('');

  // Fetch data from API or use fallback
  const fetchWhaleLeads = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        minValue: minValue.toString(),
        stats: 'true',
      });
      if (selectedCity !== 'all') {
        params.set('city', selectedCity);
      }

      const response = await fetch(`/api/whales?${params}`);
      
      if (response.ok) {
        const data = await response.json();
        if (data.leads && data.leads.length > 0) {
          setWhales(data.leads);
          setDataSource('database');
          
          // Fetch cities
          const citiesRes = await fetch('/api/whales?cities=true');
          if (citiesRes.ok) {
            const citiesData = await citiesRes.json();
            setCities(citiesData.cities || []);
          }
          return;
        }
      }
      
      // Fallback to sample data if API fails or returns empty
      loadSampleData();
    } catch (error) {
      console.error('Error fetching leads:', error);
      loadSampleData();
    } finally {
      setIsLoading(false);
    }
  }, [minValue, selectedCity]);

  // Sample data fallback (real enriched data structure)
  const loadSampleData = () => {
    const sampleLeads: WhaleLead[] = [
      { 
        id: 'W001', owner_name: 'SACRAMENTO TECH SOLUTIONS LLC', city: 'SACRAMENTO', 
        cash_reported: 47500, potential_fee: 4750, property_type: 'Cash', status: 'high_interest',
        decision_maker_name: 'Michael Chen', decision_maker_title: 'CEO', 
        direct_email: 'mchen@sactech.com', direct_phone: '+1-916-555-0142', 
        linkedin_url: 'https://linkedin.com/in/michaelchen',
        enrichment_status: 'Enriched', last_contact: null, notes: null
      },
      { 
        id: 'W002', owner_name: 'BAY AREA INVESTMENTS INC', city: 'SAN FRANCISCO', 
        cash_reported: 125000, potential_fee: 12500, property_type: 'Securities', status: 'new',
        decision_maker_name: 'Sarah Williams', decision_maker_title: 'CFO', 
        direct_email: 'swilliams@bayareainv.com', direct_phone: '+1-415-555-0198', 
        linkedin_url: 'https://linkedin.com/in/sarahwilliams',
        enrichment_status: 'Enriched', last_contact: null, notes: null
      },
      { 
        id: 'W003', owner_name: 'PALO ALTO CONSULTING GROUP LLP', city: 'PALO ALTO', 
        cash_reported: 89000, potential_fee: 8900, property_type: 'Cash', status: 'signed',
        decision_maker_name: 'David Park', decision_maker_title: 'Managing Partner', 
        direct_email: 'dpark@paconsulting.com', direct_phone: '+1-650-555-0167', 
        linkedin_url: 'https://linkedin.com/in/davidpark',
        enrichment_status: 'Enriched', last_contact: '2026-01-25', notes: null
      },
      { 
        id: 'W004', owner_name: 'FOLSOM MANUFACTURING CORP', city: 'FOLSOM', 
        cash_reported: 18500, potential_fee: 1850, property_type: 'Cash', status: 'new',
        decision_maker_name: 'Robert Taylor', decision_maker_title: 'Controller', 
        direct_email: 'rtaylor@folsommfg.com', direct_phone: '+1-916-555-0289', 
        linkedin_url: null, enrichment_status: 'Enriched', last_contact: null, notes: null
      },
      { 
        id: 'W005', owner_name: 'ROSEVILLE HOLDINGS LLC', city: 'ROSEVILLE', 
        cash_reported: 78500, potential_fee: 7850, property_type: 'Cash', status: 'contacted',
        decision_maker_name: 'Jennifer Martinez', decision_maker_title: 'Owner', 
        direct_email: 'jmartinez@rosevilleholdings.com', direct_phone: '+1-916-555-0234', 
        linkedin_url: 'https://linkedin.com/in/jennifermartinez',
        enrichment_status: 'Enriched', last_contact: '2026-01-27', notes: null
      },
      { 
        id: 'W006', owner_name: 'OAKLAND DISTRIBUTION CENTER INC', city: 'OAKLAND', 
        cash_reported: 32000, potential_fee: 3200, property_type: 'Cash', status: 'new',
        decision_maker_name: 'Marcus Johnson', decision_maker_title: 'CFO', 
        direct_email: 'mjohnson@oaklanddist.com', direct_phone: '+1-510-555-0156', 
        linkedin_url: 'https://linkedin.com/in/marcusjohnson',
        enrichment_status: 'Enriched', last_contact: null, notes: null
      },
      { 
        id: 'W007', owner_name: 'SAN JOSE TECH VENTURES LLC', city: 'SAN JOSE', 
        cash_reported: 8500, potential_fee: 850, property_type: 'Cash', status: 'new',
        decision_maker_name: 'Lisa Wong', decision_maker_title: 'Founder', 
        direct_email: 'lwong@sjtechventures.com', direct_phone: '+1-408-555-0178', 
        linkedin_url: 'https://linkedin.com/in/lisawong',
        enrichment_status: 'Enriched', last_contact: null, notes: null
      },
      { 
        id: 'W008', owner_name: 'BERKELEY RESEARCH PARTNERS LLP', city: 'BERKELEY', 
        cash_reported: 6200, potential_fee: 620, property_type: 'Cash', status: 'new',
        decision_maker_name: null, decision_maker_title: null, 
        direct_email: null, direct_phone: null, linkedin_url: null,
        enrichment_status: 'Needs Manual Research', last_contact: null, notes: null
      },
    ];
    
    setWhales(sampleLeads);
    setCities([...new Set(sampleLeads.map(w => w.city))].sort());
    setDataSource('local');
  };

  // Load data on mount
  useEffect(() => {
    fetchWhaleLeads();
  }, []);

  // Refresh when filters change (for database mode)
  useEffect(() => {
    if (dataSource === 'database') {
      fetchWhaleLeads();
    }
  }, [selectedCity, minValue, dataSource, fetchWhaleLeads]);

  // Filtered whales based on city and min value
  const filteredWhales = useMemo(() => {
    return whales.filter(w => {
      if (selectedCity !== 'all' && w.city !== selectedCity) return false;
      if (w.cash_reported < minValue) return false;
      if (searchQuery && !w.owner_name.toLowerCase().includes(searchQuery.toLowerCase())) return false;
      return true;
    }).sort((a, b) => b.cash_reported - a.cash_reported); // Highest value first
  }, [whales, selectedCity, minValue, searchQuery]);

  // Real-time stats based on filters
  const stats = useMemo(() => {
    const filtered = filteredWhales;
    const goldLeads = filtered.filter(w => w.cash_reported >= 25000);
    const silverLeads = filtered.filter(w => w.cash_reported >= 10000 && w.cash_reported < 25000);
    const autoLeads = filtered.filter(w => w.cash_reported >= 5000 && w.cash_reported < 10000);
    const highInterest = filtered.filter(w => w.status === 'high_interest' || w.status === 'signed');
    
    return {
      totalValue: filtered.reduce((sum, w) => sum + w.cash_reported, 0),
      totalFees: filtered.reduce((sum, w) => sum + w.potential_fee, 0),
      projectedCommission: highInterest.reduce((sum, w) => sum + w.potential_fee, 0),
      goldCount: goldLeads.length,
      goldValue: goldLeads.reduce((sum, w) => sum + w.potential_fee, 0),
      silverCount: silverLeads.length,
      silverValue: silverLeads.reduce((sum, w) => sum + w.potential_fee, 0),
      autoCount: autoLeads.length,
      autoValue: autoLeads.reduce((sum, w) => sum + w.potential_fee, 0),
      enrichedCount: filtered.filter(w => w.enrichment_status === 'Enriched').length,
      totalCount: filtered.length
    };
  }, [filteredWhales]);

  // CSV/JSON import - uploads to API or sets local state
  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return;
    setIsProcessing(true);
    
    try {
      const file = acceptedFiles[0];
      const text = await file.text();
      let parsedLeads: WhaleLead[] = [];
      
      if (file.name.endsWith('.json')) {
        const data = JSON.parse(text);
        parsedLeads = data.map((row: Record<string, unknown>, i: number) => ({
          id: `W${String(i + 1).padStart(3, '0')}`,
          owner_name: String(row.BUSINESS_NAME || row.owner_name || row.ownerName || 'UNKNOWN'),
          city: String(row.CITY || row.city || 'UNKNOWN'),
          cash_reported: Number(row.UNCLAIMED_VALUE || row.cash_reported || row.cashReported) || 0,
          potential_fee: Number(row.YOUR_FEE_10PCT || row.potential_fee || row.potentialFee) || 0,
          property_type: 'Cash',
          status: 'new' as const,
          decision_maker_name: String(row.CONTACT_NAME || row.decision_maker_name || row.contactName || '') || null,
          decision_maker_title: String(row.CONTACT_TITLE || row.decision_maker_title || row.contactTitle || '') || null,
          direct_email: String(row.CONTACT_EMAIL || row.direct_email || row.contactEmail || '') || null,
          direct_phone: String(row.CONTACT_PHONE || row.direct_phone || row.contactPhone || '') || null,
          linkedin_url: String(row.LINKEDIN_URL || row.linkedin_url || row.linkedinUrl || '') || null,
          enrichment_status: (row.ENRICHMENT_STATUS || row.enrichment_status || 'Needs Manual Research') as WhaleLead['enrichment_status'],
          last_contact: null,
          notes: null,
        }));
      } else {
        // CSV parsing
        const lines = text.split('\n');
        const headers = lines[0].split(',').map(h => h.trim().toUpperCase());
        
        for (let i = 1; i < lines.length; i++) {
          const cols = lines[i].split(',').map(c => c.trim());
          if (cols.length < 3) continue;
          
          const getCol = (name: string) => {
            const idx = headers.indexOf(name);
            return idx >= 0 ? cols[idx] : '';
          };
          
          const cashValue = parseFloat(getCol('UNCLAIMED_VALUE')?.replace(/[$,]/g, '') || getCol('CASH_REPORTED')?.replace(/[$,]/g, '')) || 0;
          
          if (cashValue >= 5000) {
            parsedLeads.push({
              id: `W${String(i).padStart(3, '0')}`,
              owner_name: getCol('BUSINESS_NAME') || getCol('OWNER_NAME') || 'UNKNOWN',
              city: getCol('CITY') || 'UNKNOWN',
              cash_reported: cashValue,
              potential_fee: cashValue * 0.10,
              property_type: 'Cash',
              status: 'new',
              decision_maker_name: getCol('CONTACT_NAME') || null,
              decision_maker_title: getCol('CONTACT_TITLE') || null,
              direct_email: getCol('CONTACT_EMAIL') || null,
              direct_phone: getCol('CONTACT_PHONE') || null,
              linkedin_url: getCol('LINKEDIN_URL') || null,
              enrichment_status: (getCol('ENRICHMENT_STATUS') || 'Needs Manual Research') as WhaleLead['enrichment_status'],
              last_contact: null,
              notes: null,
            });
          }
        }
      }

      // Try to bulk upload to database
      try {
        const response = await fetch('/api/whales', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ bulk: true, leads: parsedLeads }),
        });
        
        if (response.ok) {
          // Refresh from database
          await fetchWhaleLeads();
          setDataSource('database');
          return;
        }
      } catch {
        // Fall through to local state
      }

      // Fallback: set local state
      setWhales(parsedLeads);
      setCities([...new Set(parsedLeads.map(w => w.city))].sort());
      setDataSource('local');
      
    } catch (error) {
      console.error('Error processing file:', error);
    } finally {
      setIsProcessing(false);
    }
  }, [fetchWhaleLeads]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'text/csv': ['.csv'], 'application/json': ['.json'] },
    disabled: isProcessing
  });

  // Status update - updates API and local state
  const updateWhaleStatus = async (id: string, status: WhaleLead['status']) => {
    // Update local state immediately
    setWhales(prev => prev.map(w => 
      w.id === id ? { ...w, status, last_contact: new Date().toISOString().split('T')[0] } : w
    ));

    // Try to update database
    if (dataSource === 'database') {
      try {
        await fetch('/api/whales', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id, status }),
        });
      } catch (error) {
        console.error('Error updating status:', error);
      }
    }
  };

  // Tier action handler
  const handleTierAction = async (whale: WhaleLead, tier: LeadTier) => {
    switch (tier) {
      case 'gold':
        openPriorityCallScript(whale);
        await updateWhaleStatus(whale.id, 'contacted');
        break;
      case 'silver':
        setGeneratingContract(whale.id);
        await new Promise(r => setTimeout(r, 300));
        generateContractPDF(whale);
        setGeneratingContract(null);
        break;
      case 'automation':
        generateAIWarmupEmail(whale);
        await updateWhaleStatus(whale.id, 'contacted');
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
          <div className="flex items-center justify-between text-[10px] mb-2">
            <span className="text-slate-500">Enriched Contacts</span>
            <span className="text-emerald-400 font-bold">{stats.enrichedCount}/{stats.totalCount}</span>
          </div>
          <div className="flex items-center justify-between text-[10px]">
            <span className="text-slate-500">Data Source</span>
            <span className={`font-bold flex items-center gap-1 ${dataSource === 'database' ? 'text-emerald-400' : 'text-amber-400'}`}>
              <Database className="w-3 h-3" />
              {dataSource === 'database' ? 'Database' : 'Local'}
            </span>
          </div>
          {dataSource === 'local' && (
            <Button 
              onClick={fetchWhaleLeads}
              variant="outline"
              className="w-full mt-3 border-slate-700 text-slate-400 text-[9px] h-8"
            >
              <RefreshCw className="w-3 h-3 mr-1" /> Sync Database
            </Button>
          )}
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

          {isLoading ? (
            <div className="p-12 text-center">
              <Loader2 className="w-8 h-8 text-gold mx-auto animate-spin mb-4" />
              <p className="text-slate-500 text-sm">Loading whale leads...</p>
            </div>
          ) : filteredWhales.length === 0 ? (
            <div className="p-12 text-center">
              <Building2 className="w-12 h-12 text-slate-700 mx-auto mb-4" />
              <p className="text-slate-500 text-sm">No leads match your filters</p>
              <p className="text-slate-600 text-xs mt-1">Try adjusting the minimum value or city filter</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-800">
              {filteredWhales.map((whale) => {
                const tier = getLeadTier(whale.cash_reported);
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
                          <span className="text-sm font-bold text-white truncate">{whale.owner_name}</span>
                          <span className="text-[9px] text-slate-500">{whale.city}</span>
                        </div>
                        {whale.decision_maker_name && (
                          <div className="text-[10px] text-emerald-400">
                            {whale.decision_maker_name} • <span className="text-slate-400">{whale.decision_maker_title}</span>
                          </div>
                        )}
                        {!whale.decision_maker_name && (
                          <div className="text-[10px] text-amber-500">
                            Needs Research
                          </div>
                        )}
                      </div>

                      {/* Value */}
                      <div className="text-right w-28">
                        <div className="text-lg font-mono font-bold text-gold">
                          ${whale.cash_reported.toLocaleString()}
                        </div>
                        <div className="text-[10px] text-emerald-500">
                          Fee: ${whale.potential_fee.toLocaleString()}
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

                      {/* Quick Contact - Direct Phone & LinkedIn */}
                      <div className="flex items-center gap-1">
                        {whale.direct_phone ? (
                          <a 
                            href={`tel:${whale.direct_phone.replace(/[^\d+]/g, '')}`}
                            className="p-1.5 hover:bg-emerald-500/20 rounded group"
                            title={whale.direct_phone}
                          >
                            <Phone className="w-3.5 h-3.5 text-emerald-400 group-hover:text-emerald-300" />
                          </a>
                        ) : (
                          <span className="p-1.5 opacity-30">
                            <Phone className="w-3.5 h-3.5 text-slate-600" />
                          </span>
                        )}
                        {whale.direct_email ? (
                          <a 
                            href={`mailto:${whale.direct_email}`}
                            className="p-1.5 hover:bg-blue-500/20 rounded group"
                            title={whale.direct_email}
                          >
                            <Mail className="w-3.5 h-3.5 text-blue-400 group-hover:text-blue-300" />
                          </a>
                        ) : (
                          <span className="p-1.5 opacity-30">
                            <Mail className="w-3.5 h-3.5 text-slate-600" />
                          </span>
                        )}
                        {whale.linkedin_url ? (
                          <a 
                            href={whale.linkedin_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1.5 hover:bg-blue-600/20 rounded group"
                            title="View LinkedIn Profile"
                          >
                            <Linkedin className="w-3.5 h-3.5 text-blue-500 group-hover:text-blue-400" />
                          </a>
                        ) : (
                          <span className="p-1.5 opacity-30">
                            <Linkedin className="w-3.5 h-3.5 text-slate-600" />
                          </span>
                        )}
                      </div>

                      {/* TIER ACTION BUTTON */}
                      <Button
                        onClick={() => handleTierAction(whale, tier)}
                        disabled={generatingContract === whale.id || whale.enrichment_status !== 'Enriched'}
                        className={`text-[9px] font-black uppercase tracking-widest h-8 px-4 rounded ${
                          tier === 'gold' 
                            ? 'bg-gold hover:bg-amber-500 text-slate-900' 
                            : tier === 'silver'
                            ? 'bg-slate-600 hover:bg-slate-500 text-white'
                            : 'bg-blue-600 hover:bg-blue-500 text-white'
                        } disabled:opacity-50 disabled:cursor-not-allowed`}
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
          )}
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
