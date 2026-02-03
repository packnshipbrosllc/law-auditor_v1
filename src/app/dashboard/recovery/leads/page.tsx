'use client';

import { useState, useEffect, useTransition } from 'react';
import { motion } from 'framer-motion';
import {
  Search,
  Users,
  DollarSign,
  RefreshCw,
  Loader2,
  ExternalLink,
  UserSearch,
  CheckCircle,
  Clock,
  AlertCircle,
  Download,
  Filter,
  Calendar,
  MapPin,
  Phone,
  Mail,
  ChevronDown,
  ChevronUp,
  Sparkles,
  TrendingUp,
  Building,
  ToggleLeft,
  ToggleRight,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  searchRelativesAction,
  runScraperAction,
  fetchDeceasedLeads,
} from '@/app/actions/leads';
import type { Lead, RelativeSearchResult } from '@/lib/scrapers/unclaimed-property';
import type { DeceasedLead } from '@/lib/db';

// ═══════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════

interface DisplayLead {
  id: string;
  ownerName: string;
  assetValue: number;
  propertyId: string;
  lastKnownAddress: string | null;
  dateReported: string;
  status: 'New' | 'Researching' | 'Contacted';
  propertyType: string;
  state: string;
  county: string | null;
  relatives?: RelativeSearchResult['relatives'];
}

// ═══════════════════════════════════════════════════════════════════════════
// COMPONENT
// ═══════════════════════════════════════════════════════════════════════════

export default function RecoveryLeadsPage() {
  // State
  const [leads, setLeads] = useState<DisplayLead[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [expandedRow, setExpandedRow] = useState<string | null>(null);
  const [searchingRelatives, setSearchingRelatives] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  
  // Filters
  const [highValueOnly, setHighValueOnly] = useState(false); // >$1,000 filter
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [stateFilter, setStateFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Sample data for development
  const sampleLeads: DisplayLead[] = [
    {
      id: 'L001',
      ownerName: 'JOHN WILLIAM DOE ESTATE',
      assetValue: 45000,
      propertyId: 'CA-JWD45K',
      lastKnownAddress: '1234 Oak Street, Sacramento, CA 95814',
      dateReported: '2026-01-15',
      status: 'New',
      propertyType: 'Cash',
      state: 'CA',
      county: 'Sacramento',
    },
    {
      id: 'L002',
      ownerName: 'MARY ELIZABETH SMITH ESTATE',
      assetValue: 125000,
      propertyId: 'CA-MES125K',
      lastKnownAddress: '567 Market Street, San Francisco, CA 94102',
      dateReported: '2026-01-10',
      status: 'Researching',
      propertyType: 'Securities',
      state: 'CA',
      county: 'San Francisco',
      relatives: [
        { name: 'James Smith', relation: 'Son', confidence: 85, phone: '+1-916-555-0123' },
        { name: 'Patricia Smith-Jones', relation: 'Daughter', confidence: 78, email: 'patricia@email.com' },
      ],
    },
    {
      id: 'L003',
      ownerName: 'ROBERT JOHNSON ESTATE',
      assetValue: 78500,
      propertyId: 'CA-RJ78K',
      lastKnownAddress: '890 Hollywood Blvd, Los Angeles, CA 90028',
      dateReported: '2026-01-05',
      status: 'New',
      propertyType: 'Safe Deposit',
      state: 'CA',
      county: 'Los Angeles',
    },
    {
      id: 'L004',
      ownerName: 'HELEN WILLIAMS ESTATE',
      assetValue: 850,
      propertyId: 'CA-HW850',
      lastKnownAddress: '123 Broadway, Oakland, CA 94607',
      dateReported: '2025-12-20',
      status: 'Contacted',
      propertyType: 'Cash',
      state: 'CA',
      county: 'Alameda',
    },
    {
      id: 'L005',
      ownerName: 'THOMAS ANDERSON ESTATE',
      assetValue: 32000,
      propertyId: 'TX-TA32K',
      lastKnownAddress: '456 Main Street, Houston, TX 77001',
      dateReported: '2026-01-18',
      status: 'New',
      propertyType: 'Insurance',
      state: 'TX',
      county: 'Harris',
    },
    {
      id: 'L006',
      ownerName: 'MARGARET DAVIS ESTATE',
      assetValue: 18500,
      propertyId: 'FL-MD18K',
      lastKnownAddress: '789 Beach Drive, Tampa, FL 33602',
      dateReported: '2026-01-12',
      status: 'New',
      propertyType: 'Cash',
      state: 'FL',
      county: 'Hillsborough',
    },
  ];

  // Load data
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      // Try to fetch from database
      const dbLeads = await fetchDeceasedLeads();
      
      if (dbLeads.length > 0) {
        // Convert database format to display format
        const displayLeads: DisplayLead[] = dbLeads.map(lead => ({
          id: lead.id,
          ownerName: lead.original_owner,
          assetValue: lead.asset_amount,
          propertyId: `${lead.state}-${lead.id.slice(0, 6)}`,
          lastKnownAddress: lead.county ? `${lead.county}, ${lead.state}` : null,
          dateReported: lead.date_listed,
          status: lead.status === 'new' ? 'New' : lead.status === 'contacted' ? 'Contacted' : 'Researching',
          propertyType: lead.property_type,
          state: lead.state,
          county: lead.county,
          relatives: lead.potential_heirs.map(h => ({
            name: h.name,
            relation: h.relation,
            confidence: 70,
            phone: h.contact_info?.includes('+') ? h.contact_info : undefined,
            email: h.contact_info?.includes('@') ? h.contact_info : undefined,
          })),
        }));
        setLeads(displayLeads);
      } else {
        setLeads(sampleLeads);
      }
    } catch (error) {
      console.error('Error loading leads:', error);
      setLeads(sampleLeads);
    } finally {
      setIsLoading(false);
    }
  };

  // Run scraper
  const handleRunScraper = async () => {
    startTransition(async () => {
      const result = await runScraperAction(['CA', 'TX', 'FL'], 5000);
      if (result.success) {
        await loadData();
      } else {
        alert(`Scraper errors: ${result.errors.join(', ')}`);
      }
    });
  };

  // Find relatives - THE "UNFAIR ADVANTAGE"
  const handleFindRelatives = async (lead: DisplayLead) => {
    setSearchingRelatives(lead.id);
    try {
      const result = await searchRelativesAction(lead.ownerName, lead.lastKnownAddress);
      
      if (result.success) {
        // Update local state with found relatives
        setLeads(prev =>
          prev.map(l =>
            l.id === lead.id
              ? { ...l, relatives: result.relatives, status: 'Researching' as const }
              : l
          )
        );
        // Expand to show results
        setExpandedRow(lead.id);
      } else {
        alert(`Search failed: ${result.error}`);
      }
    } finally {
      setSearchingRelatives(null);
    }
  };

  // Apply filters
  const filteredLeads = leads.filter(lead => {
    // High value filter (>$1,000)
    if (highValueOnly && lead.assetValue <= 1000) return false;
    
    // Status filter
    if (statusFilter !== 'all' && lead.status !== statusFilter) return false;
    
    // State filter
    if (stateFilter !== 'all' && lead.state !== stateFilter) return false;
    
    // Search query
    if (searchQuery && !lead.ownerName.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    
    return true;
  });

  // Calculate stats
  const stats = {
    totalLeads: filteredLeads.length,
    totalValue: filteredLeads.reduce((sum, l) => sum + l.assetValue, 0),
    potentialFees: filteredLeads.reduce((sum, l) => sum + l.assetValue * 0.10, 0),
    newCount: filteredLeads.filter(l => l.status === 'New').length,
    researchingCount: filteredLeads.filter(l => l.status === 'Researching').length,
    withRelatives: filteredLeads.filter(l => l.relatives && l.relatives.length > 0).length,
  };

  const getStatusBadge = (status: DisplayLead['status']) => {
    switch (status) {
      case 'New':
        return (
          <span className="px-2 py-1 bg-amber-500/20 text-amber-400 text-[9px] font-black uppercase tracking-widest rounded flex items-center gap-1">
            <AlertCircle className="w-3 h-3" /> New
          </span>
        );
      case 'Researching':
        return (
          <span className="px-2 py-1 bg-blue-500/20 text-blue-400 text-[9px] font-black uppercase tracking-widest rounded flex items-center gap-1">
            <Clock className="w-3 h-3" /> Researching
          </span>
        );
      case 'Contacted':
        return (
          <span className="px-2 py-1 bg-emerald-500/20 text-emerald-400 text-[9px] font-black uppercase tracking-widest rounded flex items-center gap-1">
            <CheckCircle className="w-3 h-3" /> Contacted
          </span>
        );
    }
  };

  return (
    <div className="p-6 lg:p-8 bg-slate-950 min-h-screen">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <Search className="w-7 h-7 text-gold" />
            <h1 className="text-2xl font-black tracking-tight text-white">
              Recovery Leads
            </h1>
            <span className="px-2 py-1 bg-purple-500/20 text-purple-400 text-[9px] font-black uppercase tracking-widest rounded flex items-center gap-1">
              <Sparkles className="w-3 h-3" /> Heir Finder
            </span>
          </div>
          <p className="text-slate-500 text-xs">
            Automated heir search • California, Texas, Florida • 10% Recovery Fee
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            onClick={handleRunScraper}
            disabled={isPending}
            className="bg-purple-600 hover:bg-purple-500 text-white text-[10px] font-bold uppercase tracking-widest"
          >
            {isPending ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <RefreshCw className="w-4 h-4 mr-2" />
            )}
            Scrape New Leads
          </Button>
          <Button
            variant="outline"
            className="border-slate-700 text-slate-400 text-[10px] font-bold uppercase tracking-widest"
          >
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-slate-900 border border-slate-800 p-4 rounded"
        >
          <DollarSign className="w-4 h-4 text-gold mb-2" />
          <div className="text-xl font-mono font-bold text-white">
            ${(stats.totalValue / 1000).toFixed(0)}k
          </div>
          <div className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">
            Total Value
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="bg-emerald-950 border border-emerald-800/50 p-4 rounded"
        >
          <TrendingUp className="w-4 h-4 text-emerald-400 mb-2" />
          <div className="text-xl font-mono font-bold text-emerald-400">
            ${stats.potentialFees.toLocaleString()}
          </div>
          <div className="text-[9px] font-bold text-emerald-600 uppercase tracking-widest">
            Potential Fees
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-slate-900 border border-slate-800 p-4 rounded"
        >
          <Building className="w-4 h-4 text-blue-400 mb-2" />
          <div className="text-xl font-mono font-bold text-white">
            {stats.totalLeads}
          </div>
          <div className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">
            Total Leads
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="bg-slate-900 border border-slate-800 p-4 rounded"
        >
          <AlertCircle className="w-4 h-4 text-amber-400 mb-2" />
          <div className="text-xl font-mono font-bold text-amber-400">
            {stats.newCount}
          </div>
          <div className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">
            New
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-slate-900 border border-slate-800 p-4 rounded"
        >
          <Clock className="w-4 h-4 text-blue-400 mb-2" />
          <div className="text-xl font-mono font-bold text-blue-400">
            {stats.researchingCount}
          </div>
          <div className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">
            Researching
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="bg-purple-950 border border-purple-800/50 p-4 rounded"
        >
          <Users className="w-4 h-4 text-purple-400 mb-2" />
          <div className="text-xl font-mono font-bold text-purple-400">
            {stats.withRelatives}
          </div>
          <div className="text-[9px] font-bold text-purple-600 uppercase tracking-widest">
            Heirs Found
          </div>
        </motion.div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4 mb-6 flex-wrap">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-500" />
          <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">
            Filters:
          </span>
        </div>

        {/* HIGH VALUE TOGGLE */}
        <button
          onClick={() => setHighValueOnly(!highValueOnly)}
          className={`flex items-center gap-2 px-3 py-2 rounded text-[10px] font-bold uppercase tracking-widest transition-all ${
            highValueOnly
              ? 'bg-gold/20 text-gold border border-gold/30'
              : 'bg-slate-800 text-slate-400 border border-slate-700'
          }`}
        >
          {highValueOnly ? (
            <ToggleRight className="w-4 h-4" />
          ) : (
            <ToggleLeft className="w-4 h-4" />
          )}
          High Value (&gt;$1k)
        </button>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="bg-slate-800 border border-slate-700 text-white px-3 py-2 text-xs rounded"
        >
          <option value="all">All Status</option>
          <option value="New">New</option>
          <option value="Researching">Researching</option>
          <option value="Contacted">Contacted</option>
        </select>

        <select
          value={stateFilter}
          onChange={(e) => setStateFilter(e.target.value)}
          className="bg-slate-800 border border-slate-700 text-white px-3 py-2 text-xs rounded"
        >
          <option value="all">All States</option>
          <option value="CA">California</option>
          <option value="TX">Texas</option>
          <option value="FL">Florida</option>
        </select>

        <div className="relative ml-auto">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search owners..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="bg-slate-800 border border-slate-700 text-white pl-10 pr-4 py-2 text-xs rounded w-64"
          />
        </div>
      </div>

      {/* Table */}
      <div className="bg-slate-900 border border-slate-800 rounded overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-800 flex items-center justify-between">
          <h2 className="text-xs font-black uppercase tracking-[0.15em] text-white">
            Leads ({filteredLeads.length})
          </h2>
          {highValueOnly && (
            <span className="text-[9px] text-gold font-bold uppercase tracking-widest">
              Showing only &gt;$1,000
            </span>
          )}
        </div>

        {isLoading ? (
          <div className="p-12 text-center">
            <Loader2 className="w-8 h-8 text-purple-500 mx-auto animate-spin mb-4" />
            <p className="text-slate-500 text-sm">Loading leads...</p>
          </div>
        ) : filteredLeads.length === 0 ? (
          <div className="p-12 text-center">
            <Search className="w-12 h-12 text-slate-700 mx-auto mb-4" />
            <p className="text-slate-500 text-sm">No leads found</p>
            <p className="text-slate-600 text-xs mt-1">
              {highValueOnly ? 'Try disabling the High Value filter' : 'Run the scraper to fetch new leads'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-800 text-left">
                  <th className="px-4 py-3 text-[9px] font-black uppercase tracking-widest text-slate-500">
                    Owner Name
                  </th>
                  <th className="px-4 py-3 text-[9px] font-black uppercase tracking-widest text-slate-500">
                    Asset Value
                  </th>
                  <th className="px-4 py-3 text-[9px] font-black uppercase tracking-widest text-slate-500">
                    Property ID
                  </th>
                  <th className="px-4 py-3 text-[9px] font-black uppercase tracking-widest text-slate-500">
                    Last Known Address
                  </th>
                  <th className="px-4 py-3 text-[9px] font-black uppercase tracking-widest text-slate-500">
                    Date
                  </th>
                  <th className="px-4 py-3 text-[9px] font-black uppercase tracking-widest text-slate-500">
                    Status
                  </th>
                  <th className="px-4 py-3 text-[9px] font-black uppercase tracking-widest text-slate-500">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {filteredLeads.map((lead) => (
                  <>
                    <tr
                      key={lead.id}
                      className={`hover:bg-slate-800/50 transition-colors ${
                        expandedRow === lead.id ? 'bg-slate-800/30' : ''
                      } ${lead.assetValue >= 25000 ? 'border-l-2 border-l-gold' : ''}`}
                    >
                      {/* Owner Name */}
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-2">
                          {lead.relatives && lead.relatives.length > 0 && (
                            <button
                              onClick={() => setExpandedRow(expandedRow === lead.id ? null : lead.id)}
                              className="p-1 hover:bg-slate-700 rounded"
                            >
                              {expandedRow === lead.id ? (
                                <ChevronUp className="w-4 h-4 text-purple-400" />
                              ) : (
                                <ChevronDown className="w-4 h-4 text-purple-400" />
                              )}
                            </button>
                          )}
                          <div>
                            <div className="text-sm font-bold text-white">{lead.ownerName}</div>
                            <div className="text-[10px] text-slate-500">
                              {lead.propertyType} • {lead.state}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Asset Value */}
                      <td className="px-4 py-4">
                        <span className={`text-lg font-mono font-bold ${
                          lead.assetValue >= 25000 ? 'text-gold' : 'text-white'
                        }`}>
                          ${lead.assetValue.toLocaleString()}
                        </span>
                        <div className="text-[9px] text-emerald-500">
                          Fee: ${(lead.assetValue * 0.10).toLocaleString()}
                        </div>
                      </td>

                      {/* Property ID */}
                      <td className="px-4 py-4">
                        <code className="text-xs text-slate-400 bg-slate-800 px-2 py-1 rounded">
                          {lead.propertyId}
                        </code>
                      </td>

                      {/* Last Known Address */}
                      <td className="px-4 py-4">
                        {lead.lastKnownAddress ? (
                          <div className="flex items-center gap-2 text-sm text-slate-400">
                            <MapPin className="w-3 h-3 flex-shrink-0" />
                            <span className="truncate max-w-[200px]">{lead.lastKnownAddress}</span>
                          </div>
                        ) : (
                          <span className="text-slate-600 text-sm">Unknown</span>
                        )}
                      </td>

                      {/* Date Reported */}
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-2 text-sm text-slate-400">
                          <Calendar className="w-3 h-3" />
                          {new Date(lead.dateReported).toLocaleDateString()}
                        </div>
                      </td>

                      {/* Status */}
                      <td className="px-4 py-4">
                        {getStatusBadge(lead.status)}
                      </td>

                      {/* Actions */}
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-2">
                          {/* FIND RELATIVES - THE UNFAIR ADVANTAGE */}
                          <Button
                            onClick={() => handleFindRelatives(lead)}
                            disabled={searchingRelatives === lead.id}
                            size="sm"
                            className="bg-purple-600 hover:bg-purple-500 text-white text-[9px] font-bold uppercase tracking-widest h-8 px-3"
                          >
                            {searchingRelatives === lead.id ? (
                              <Loader2 className="w-3 h-3 animate-spin" />
                            ) : (
                              <>
                                <UserSearch className="w-3 h-3 mr-1" />
                                Find Relatives
                              </>
                            )}
                          </Button>
                        </div>
                      </td>
                    </tr>

                    {/* Expanded Relatives Row */}
                    {expandedRow === lead.id && lead.relatives && lead.relatives.length > 0 && (
                      <tr className="bg-purple-950/20">
                        <td colSpan={7} className="px-4 py-4">
                          <div className="ml-8 pl-4 border-l-2 border-purple-500/30">
                            <h4 className="text-[10px] font-black uppercase tracking-widest text-purple-400 mb-3 flex items-center gap-2">
                              <Users className="w-4 h-4" />
                              Found Relatives ({lead.relatives.length})
                            </h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                              {lead.relatives.map((relative, idx) => (
                                <div
                                  key={idx}
                                  className="bg-slate-900/50 border border-slate-700 p-3 rounded"
                                >
                                  <div className="flex items-center justify-between mb-1">
                                    <div className="text-sm font-bold text-white">{relative.name}</div>
                                    <span className="text-[9px] text-purple-400 bg-purple-500/20 px-2 py-0.5 rounded">
                                      {relative.confidence}% match
                                    </span>
                                  </div>
                                  <div className="text-[10px] text-slate-400 mb-2">{relative.relation}</div>
                                  <div className="flex items-center gap-2">
                                    {relative.phone && (
                                      <a
                                        href={`tel:${relative.phone}`}
                                        className="flex items-center gap-1 text-[10px] text-emerald-400 hover:text-emerald-300"
                                      >
                                        <Phone className="w-3 h-3" />
                                        {relative.phone}
                                      </a>
                                    )}
                                    {relative.email && (
                                      <a
                                        href={`mailto:${relative.email}`}
                                        className="flex items-center gap-1 text-[10px] text-blue-400 hover:text-blue-300"
                                      >
                                        <Mail className="w-3 h-3" />
                                        {relative.email}
                                      </a>
                                    )}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </>
                ))}
              </tbody>
            </table>
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
              <CheckCircle className="w-3 h-3 text-emerald-500" /> 10% Fee Cap
            </span>
            <span className="flex items-center gap-1">
              <CheckCircle className="w-3 h-3 text-emerald-500" /> Privacy Protected
            </span>
          </div>
          <span>Enrichment: PeopleDataLabs / BeenVerified (Placeholder)</span>
        </div>
      </div>
    </div>
  );
}
