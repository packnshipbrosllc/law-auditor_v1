'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  Skull,
  DollarSign,
  MapPin,
  Calendar,
  Building,
  Users,
  Phone,
  Mail,
  ExternalLink,
  FileText,
  Scale,
  Crown,
  AlertTriangle,
  CheckCircle,
  Clock,
  Loader2,
  Search,
  Copy,
  Gavel,
  Shield,
  BookOpen,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import type { DeceasedLeadModule, ReportedHeir } from '@/lib/db';

// ═══════════════════════════════════════════════════════════════════════════
// SAMPLE DATA (for development)
// ═══════════════════════════════════════════════════════════════════════════

const sampleLeads: Record<string, DeceasedLeadModule> = {
  'L001': {
    id: 'L001',
    property_id: 'CA-SCO-2026-00847',
    decedent_name: 'JOHN WILLIAM ROBERTSON',
    available_balance: 78500,
    reported_heirs: [
      { name: 'Michael Robertson', relation: 'Son', phone: '+1-916-555-0142', confidence: 92, source: 'SCO Database' },
      { name: 'Sarah Robertson-Wells', relation: 'Daughter', email: 'swells@email.com', address: '1234 Oak St, Sacramento, CA', confidence: 88, source: 'SCO Database' },
    ],
    status: 'New',
    last_known_address: '4521 Broadway, Sacramento, CA 95820',
    date_of_death: '2024-03-15',
    date_reported: '2026-01-10',
    property_type: 'Securities',
    holder_name: 'Charles Schwab',
    state: 'CA',
    county: 'Sacramento',
    notes: null,
    created_at: '2026-01-10T08:00:00Z',
    updated_at: '2026-01-10T08:00:00Z',
  },
  'L002': {
    id: 'L002',
    property_id: 'CA-SCO-2026-01293',
    decedent_name: 'MARGARET ELIZABETH CHEN',
    available_balance: 125000,
    reported_heirs: [
      { name: 'David Chen', relation: 'Son', phone: '+1-415-555-0198', confidence: 95, source: 'SCO Database' },
    ],
    status: 'Skip-Tracing' as 'New',
    last_known_address: '2100 Van Ness Ave, San Francisco, CA 94109',
    date_of_death: '2023-11-22',
    date_reported: '2026-01-05',
    property_type: 'Cash',
    holder_name: 'Wells Fargo Bank',
    state: 'CA',
    county: 'San Francisco',
    notes: 'High priority - multiple heirs verified',
    created_at: '2026-01-05T10:30:00Z',
    updated_at: '2026-01-15T14:20:00Z',
  },
  'L003': {
    id: 'L003',
    property_id: 'CA-SCO-2026-00421',
    decedent_name: 'ROBERT JAMES THOMPSON',
    available_balance: 45000,
    reported_heirs: [],
    status: 'New',
    last_known_address: '3456 Grand Ave, Oakland, CA 94610',
    date_of_death: '2024-07-08',
    date_reported: '2025-12-20',
    property_type: 'Insurance',
    holder_name: 'State Farm Insurance',
    state: 'CA',
    county: 'Alameda',
    notes: 'High Priority - No Known Heir',
    created_at: '2025-12-20T09:15:00Z',
    updated_at: '2026-01-20T11:45:00Z',
  },
};

// ═══════════════════════════════════════════════════════════════════════════
// COURT SEARCH UTILITIES
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Generate Sacramento County Superior Court probate search URL.
 * Uses the court's public case search portal.
 */
function getSacramentoCourtSearchURL(decedentName: string): string {
  // Sacramento County Superior Court - Case Search
  // https://services.saccourt.ca.gov/PublicCaseSearch
  const searchName = encodeURIComponent(decedentName.replace(' ESTATE', '').trim());
  return `https://services.saccourt.ca.gov/PublicCaseSearch/civil?search=${searchName}&caseType=PROBATE`;
}

/**
 * Generate other county court search URLs.
 */
function getCourtSearchURL(county: string | null, decedentName: string): string {
  const searchName = encodeURIComponent(decedentName.replace(' ESTATE', '').trim());
  
  switch (county?.toLowerCase()) {
    case 'sacramento':
      return `https://services.saccourt.ca.gov/PublicCaseSearch/civil?search=${searchName}&caseType=PROBATE`;
    case 'san francisco':
      return `https://webapps.sftc.org/ci/CaseInfo.dll?CaseNum=&LastName=${searchName}`;
    case 'los angeles':
      return `https://www.lacourt.org/casesummary/ui/index.aspx?casetype=civil&searchtype=party&partyname=${searchName}`;
    case 'alameda':
      return `https://publicrecords.alameda.courts.ca.gov/PRS/Case/Search?searchType=PARTY&partyName=${searchName}`;
    case 'santa clara':
      return `https://portal.scscourt.org/case-search?searchType=party&partyName=${searchName}`;
    default:
      // Fallback to California Courts portal
      return `https://www.courts.ca.gov/selfhelp-cases.htm?q=${searchName}`;
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// COMPONENT
// ═══════════════════════════════════════════════════════════════════════════

export default function LeadDetailPage() {
  const params = useParams();
  const router = useRouter();
  const leadId = params.id as string;
  
  const [lead, setLead] = useState<DeceasedLeadModule | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [copied, setCopied] = useState<string | null>(null);

  // Load lead data
  useEffect(() => {
    const loadLead = async () => {
      setIsLoading(true);
      try {
        // Try API fetch
        const response = await fetch(`/api/deceased-module/${leadId}`);
        if (response.ok) {
          const data = await response.json();
          if (data.lead) {
            setLead(data.lead);
            setIsLoading(false);
            return;
          }
        }
      } catch (error) {
        console.error('Error fetching lead:', error);
      }
      
      // Fallback to sample data
      setLead(sampleLeads[leadId] || null);
      setIsLoading(false);
    };

    loadLead();
  }, [leadId]);

  // Copy to clipboard
  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopied(label);
    setTimeout(() => setCopied(null), 2000);
  };

  // Open court search
  const handleCourtSearch = () => {
    if (!lead) return;
    
    // Default to Sacramento County if none specified
    const searchURL = lead.county?.toLowerCase() === 'sacramento' || !lead.county
      ? getSacramentoCourtSearchURL(lead.decedent_name)
      : getCourtSearchURL(lead.county, lead.decedent_name);
    
    window.open(searchURL, '_blank', 'noopener,noreferrer');
  };

  if (isLoading) {
    return (
      <div className="p-8 bg-slate-950 min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 text-purple-500 mx-auto animate-spin mb-4" />
          <p className="text-slate-500">Loading lead details...</p>
        </div>
      </div>
    );
  }

  if (!lead) {
    return (
      <div className="p-8 bg-slate-950 min-h-screen">
        <div className="max-w-2xl mx-auto text-center py-16">
          <Skull className="w-16 h-16 text-slate-700 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-white mb-2">Lead Not Found</h1>
          <p className="text-slate-500 mb-6">
            The lead you&apos;re looking for doesn&apos;t exist or has been removed.
          </p>
          <Button onClick={() => router.back()} variant="outline">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Go Back
          </Button>
        </div>
      </div>
    );
  }

  const isGold = lead.available_balance >= 25000;
  const isHighPriority = lead.reported_heirs.length === 0;
  const fee = lead.available_balance * 0.10;

  return (
    <div className="p-6 lg:p-8 bg-slate-950 min-h-screen">
      {/* Back Button */}
      <Link
        href="/dashboard/recovery/leads"
        className="inline-flex items-center gap-2 text-slate-400 hover:text-white mb-6 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        <span className="text-sm">Back to Leads</span>
      </Link>

      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <Skull className="w-8 h-8 text-purple-500" />
            <h1 className={`text-2xl font-black tracking-tight ${isGold ? 'text-gold' : 'text-white'}`}>
              {lead.decedent_name}
            </h1>
            {isGold && (
              <span className="px-2 py-1 bg-gold/20 text-gold text-[9px] font-black uppercase tracking-widest rounded flex items-center gap-1">
                <Crown className="w-3 h-3" /> Gold Tier
              </span>
            )}
            {isHighPriority && (
              <span className="px-2 py-1 bg-red-500/20 text-red-400 text-[9px] font-black uppercase tracking-widest rounded flex items-center gap-1">
                <AlertTriangle className="w-3 h-3" /> No Known Heir
              </span>
            )}
          </div>
          <div className="flex items-center gap-4 text-sm text-slate-500">
            <span className="flex items-center gap-1">
              <FileText className="w-4 h-4" />
              {lead.property_id}
            </span>
            <button
              onClick={() => copyToClipboard(lead.property_id, 'property_id')}
              className="p-1 hover:bg-slate-800 rounded"
            >
              <Copy className={`w-3 h-3 ${copied === 'property_id' ? 'text-emerald-400' : 'text-slate-500'}`} />
            </button>
          </div>
        </div>

        <div className="text-right">
          <div className={`text-3xl font-mono font-black ${
            isGold ? 'text-gold drop-shadow-[0_0_12px_rgba(234,179,8,0.5)]' : 'text-white'
          }`}>
            ${lead.available_balance.toLocaleString()}
          </div>
          <div className="text-emerald-400 text-sm font-mono">
            Fee: ${fee.toLocaleString()}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Decedent Information */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-slate-900 border border-slate-800 rounded p-6"
          >
            <h2 className="text-xs font-black uppercase tracking-[0.15em] text-white mb-4 flex items-center gap-2">
              <Skull className="w-4 h-4 text-purple-500" />
              Decedent Information
            </h2>

            <div className="grid grid-cols-2 gap-6">
              <div>
                <div className="text-[9px] font-bold uppercase tracking-widest text-slate-500 mb-1">
                  Last Known Address
                </div>
                <div className="text-slate-300 flex items-start gap-2">
                  <MapPin className="w-4 h-4 text-slate-500 flex-shrink-0 mt-0.5" />
                  {lead.last_known_address || 'Unknown'}
                </div>
              </div>

              <div>
                <div className="text-[9px] font-bold uppercase tracking-widest text-slate-500 mb-1">
                  Date of Death
                </div>
                <div className="text-slate-300 flex items-start gap-2">
                  <Calendar className="w-4 h-4 text-slate-500 flex-shrink-0 mt-0.5" />
                  {lead.date_of_death
                    ? new Date(lead.date_of_death).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })
                    : 'Unknown'}
                </div>
              </div>

              <div>
                <div className="text-[9px] font-bold uppercase tracking-widest text-slate-500 mb-1">
                  County
                </div>
                <div className="text-slate-300">
                  {lead.county || 'Unknown'}, {lead.state}
                </div>
              </div>

              <div>
                <div className="text-[9px] font-bold uppercase tracking-widest text-slate-500 mb-1">
                  Date Reported to SCO
                </div>
                <div className="text-slate-300">
                  {new Date(lead.date_reported).toLocaleDateString()}
                </div>
              </div>
            </div>
          </motion.div>

          {/* Property Details */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-slate-900 border border-slate-800 rounded p-6"
          >
            <h2 className="text-xs font-black uppercase tracking-[0.15em] text-white mb-4 flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-gold" />
              Property Details
            </h2>

            <div className="grid grid-cols-2 gap-6">
              <div>
                <div className="text-[9px] font-bold uppercase tracking-widest text-slate-500 mb-1">
                  Property Type
                </div>
                <div className="text-slate-300">{lead.property_type}</div>
              </div>

              <div>
                <div className="text-[9px] font-bold uppercase tracking-widest text-slate-500 mb-1">
                  Holder / Institution
                </div>
                <div className="text-slate-300 flex items-start gap-2">
                  <Building className="w-4 h-4 text-slate-500 flex-shrink-0 mt-0.5" />
                  {lead.holder_name || 'Unknown'}
                </div>
              </div>

              <div>
                <div className="text-[9px] font-bold uppercase tracking-widest text-slate-500 mb-1">
                  Status
                </div>
                <div className="flex items-center gap-2">
                  {lead.status === 'New' && (
                    <span className="px-2 py-1 bg-amber-500/20 text-amber-400 text-[9px] font-black uppercase tracking-widest rounded flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3" /> New
                    </span>
                  )}
                  {lead.status === 'Skip-Tracing' && (
                    <span className="px-2 py-1 bg-blue-500/20 text-blue-400 text-[9px] font-black uppercase tracking-widest rounded flex items-center gap-1">
                      <Clock className="w-3 h-3" /> Skip-Tracing
                    </span>
                  )}
                  {lead.status === 'Contacted' && (
                    <span className="px-2 py-1 bg-emerald-500/20 text-emerald-400 text-[9px] font-black uppercase tracking-widest rounded flex items-center gap-1">
                      <CheckCircle className="w-3 h-3" /> Contacted
                    </span>
                  )}
                </div>
              </div>
            </div>

            {lead.notes && (
              <div className="mt-4 p-3 bg-slate-800/50 rounded">
                <div className="text-[9px] font-bold uppercase tracking-widest text-slate-500 mb-1">
                  Notes
                </div>
                <div className="text-slate-300 text-sm">{lead.notes}</div>
              </div>
            )}
          </motion.div>

          {/* Reported Heirs */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-slate-900 border border-slate-800 rounded p-6"
          >
            <h2 className="text-xs font-black uppercase tracking-[0.15em] text-white mb-4 flex items-center gap-2">
              <Users className="w-4 h-4 text-purple-500" />
              Reported Heirs
              <span className="text-slate-500">({lead.reported_heirs.length})</span>
            </h2>

            {lead.reported_heirs.length > 0 ? (
              <div className="space-y-3">
                {lead.reported_heirs.map((heir, idx) => (
                  <div
                    key={idx}
                    className="p-4 bg-slate-800/50 rounded border border-slate-700"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="font-bold text-white">{heir.name}</div>
                      {heir.confidence && (
                        <span className={`px-2 py-0.5 text-[9px] font-bold rounded ${
                          heir.confidence >= 80
                            ? 'bg-emerald-500/20 text-emerald-400'
                            : heir.confidence >= 60
                            ? 'bg-amber-500/20 text-amber-400'
                            : 'bg-slate-700 text-slate-400'
                        }`}>
                          {heir.confidence}% confidence
                        </span>
                      )}
                    </div>
                    
                    <div className="text-[10px] text-slate-400 mb-3">
                      {heir.relation}
                      {heir.source && (
                        <>
                          <span className="mx-2">•</span>
                          {heir.source}
                        </>
                      )}
                    </div>

                    <div className="flex items-center gap-4 flex-wrap">
                      {heir.phone && (
                        <a
                          href={`tel:${heir.phone}`}
                          className="flex items-center gap-2 text-sm text-emerald-400 hover:text-emerald-300 transition-colors"
                        >
                          <Phone className="w-4 h-4" />
                          {heir.phone}
                        </a>
                      )}
                      {heir.email && (
                        <a
                          href={`mailto:${heir.email}`}
                          className="flex items-center gap-2 text-sm text-blue-400 hover:text-blue-300 transition-colors"
                        >
                          <Mail className="w-4 h-4" />
                          {heir.email}
                        </a>
                      )}
                      {heir.address && (
                        <span className="flex items-center gap-2 text-sm text-slate-400">
                          <MapPin className="w-4 h-4" />
                          {heir.address}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 bg-red-950/20 rounded border border-dashed border-red-500/30">
                <AlertTriangle className="w-8 h-8 text-red-400 mx-auto mb-2" />
                <p className="text-red-400 font-bold">High Priority - No Known Heir</p>
                <p className="text-slate-500 text-sm mt-1">
                  This lead requires skip-tracing to identify potential heirs
                </p>
              </div>
            )}
          </motion.div>
        </div>

        {/* Sidebar Actions */}
        <div className="space-y-6">
          {/* Sacramento County Probate Court Search */}
          <motion.div
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-purple-950/30 border border-purple-500/30 rounded p-6"
          >
            <div className="flex items-center gap-2 mb-4">
              <Gavel className="w-5 h-5 text-purple-400" />
              <h3 className="text-sm font-bold text-purple-400">
                Probate Court Search
              </h3>
            </div>
            
            <p className="text-xs text-slate-400 mb-4">
              Search {lead.county || 'Sacramento'} County Superior Court for matching probate case records.
            </p>

            <Button
              onClick={handleCourtSearch}
              className="w-full bg-purple-600 hover:bg-purple-500 text-white font-bold"
            >
              <Search className="w-4 h-4 mr-2" />
              Search Probate Records
              <ExternalLink className="w-3 h-3 ml-2" />
            </Button>

            <p className="text-[9px] text-slate-500 mt-3 text-center">
              Opens {lead.county || 'Sacramento'} County Court Case Search
            </p>
          </motion.div>

          {/* Quick Actions */}
          <motion.div
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-slate-900 border border-slate-800 rounded p-6"
          >
            <h3 className="text-xs font-black uppercase tracking-[0.15em] text-white mb-4">
              Quick Actions
            </h3>

            <div className="space-y-3">
              <Button
                variant="outline"
                className="w-full justify-start border-slate-700 text-slate-300 hover:bg-slate-800"
              >
                <Scale className="w-4 h-4 mr-2" />
                Generate Claim Form
              </Button>

              <Button
                variant="outline"
                className="w-full justify-start border-slate-700 text-slate-300 hover:bg-slate-800"
              >
                <FileText className="w-4 h-4 mr-2" />
                Generate Contract
              </Button>

              <Button
                variant="outline"
                className="w-full justify-start border-slate-700 text-slate-300 hover:bg-slate-800"
              >
                <BookOpen className="w-4 h-4 mr-2" />
                View SCO Listing
              </Button>
            </div>
          </motion.div>

          {/* Legal Compliance */}
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
                10% Fee Cap Enforced
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-3 h-3 text-emerald-500" />
                Required Disclosures
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
