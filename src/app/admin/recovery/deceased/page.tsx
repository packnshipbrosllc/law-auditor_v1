'use client';

import { useState, useEffect, useCallback, useTransition } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Skull,
  DollarSign,
  Search,
  Users,
  Clock,
  CheckCircle,
  AlertCircle,
  Loader2,
  Phone,
  Mail,
  MapPin,
  Calendar,
  Building,
  FileText,
  TrendingUp,
  Crown,
  Filter,
  RefreshCw,
  ExternalLink,
  UserSearch,
  ChevronRight,
  X,
  Sparkles,
  Shield,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from '@/components/ui/sheet';
import type { DeceasedLeadModule, ReportedHeir, DeceasedModuleStatus } from '@/lib/db';

// ═══════════════════════════════════════════════════════════════════════════
// SAMPLE DATA
// ═══════════════════════════════════════════════════════════════════════════

const sampleLeads: DeceasedLeadModule[] = [
  {
    id: 'DM001',
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
  {
    id: 'DM002',
    property_id: 'CA-SCO-2026-01293',
    decedent_name: 'MARGARET ELIZABETH CHEN',
    available_balance: 125000,
    reported_heirs: [
      { name: 'David Chen', relation: 'Son', phone: '+1-415-555-0198', confidence: 95, source: 'SCO Database' },
      { name: 'Linda Chen-Martinez', relation: 'Daughter', phone: '+1-415-555-0241', email: 'lchen@gmail.com', confidence: 90, source: 'SCO Database' },
      { name: 'Robert Chen', relation: 'Son', address: '789 Market St, San Francisco, CA', confidence: 78, source: 'Manual' },
    ],
    status: 'Skip-Tracing',
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
  {
    id: 'DM003',
    property_id: 'CA-SCO-2026-00421',
    decedent_name: 'ROBERT JAMES THOMPSON',
    available_balance: 32000,
    reported_heirs: [
      { name: 'Patricia Thompson', relation: 'Spouse', phone: '+1-510-555-0176', confidence: 98, source: 'SCO Database' },
    ],
    status: 'Contacted',
    last_known_address: '3456 Grand Ave, Oakland, CA 94610',
    date_of_death: '2024-07-08',
    date_reported: '2025-12-20',
    property_type: 'Insurance',
    holder_name: 'State Farm Insurance',
    state: 'CA',
    county: 'Alameda',
    notes: 'Spouse contacted, contract pending',
    created_at: '2025-12-20T09:15:00Z',
    updated_at: '2026-01-20T11:45:00Z',
  },
  {
    id: 'DM004',
    property_id: 'CA-SCO-2026-01847',
    decedent_name: 'HELEN MARIE DAVIS',
    available_balance: 45000,
    reported_heirs: [],
    status: 'New',
    last_known_address: '890 University Ave, Palo Alto, CA 94301',
    date_of_death: '2024-01-30',
    date_reported: '2026-01-18',
    property_type: 'Safe Deposit',
    holder_name: 'Bank of America',
    state: 'CA',
    county: 'Santa Clara',
    notes: 'No heirs on file - skip trace needed',
    created_at: '2026-01-18T13:00:00Z',
    updated_at: '2026-01-18T13:00:00Z',
  },
  {
    id: 'DM005',
    property_id: 'CA-SCO-2026-00193',
    decedent_name: 'WILLIAM GEORGE ANDERSON',
    available_balance: 18500,
    reported_heirs: [
      { name: 'Jennifer Anderson', relation: 'Daughter', email: 'janderson@outlook.com', confidence: 85, source: 'SCO Database' },
    ],
    status: 'New',
    last_known_address: '567 Main St, Stockton, CA 95202',
    date_of_death: '2024-09-12',
    date_reported: '2026-01-12',
    property_type: 'Cash',
    holder_name: 'US Bank',
    state: 'CA',
    county: 'San Joaquin',
    notes: null,
    created_at: '2026-01-12T16:30:00Z',
    updated_at: '2026-01-12T16:30:00Z',
  },
  {
    id: 'DM006',
    property_id: 'CA-SCO-2026-02341',
    decedent_name: 'PATRICIA ANN WILSON',
    available_balance: 92000,
    reported_heirs: [
      { name: 'Thomas Wilson', relation: 'Son', phone: '+1-408-555-0134', address: '123 Silicon Valley Blvd, San Jose, CA', confidence: 91, source: 'SCO Database' },
      { name: 'Mary Wilson-Brown', relation: 'Daughter', confidence: 72, source: 'Manual' },
    ],
    status: 'Skip-Tracing',
    last_known_address: '1500 The Alameda, San Jose, CA 95126',
    date_of_death: '2024-05-19',
    date_reported: '2026-01-22',
    property_type: 'Securities',
    holder_name: 'Fidelity Investments',
    state: 'CA',
    county: 'Santa Clara',
    notes: 'Son verified, daughter needs research',
    created_at: '2026-01-22T08:45:00Z',
    updated_at: '2026-01-25T10:30:00Z',
  },
];

// ═══════════════════════════════════════════════════════════════════════════
// COMPONENT
// ═══════════════════════════════════════════════════════════════════════════

export default function DeceasedLeadsModulePage() {
  // State
  const [leads, setLeads] = useState<DeceasedLeadModule[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedLead, setSelectedLead] = useState<DeceasedLeadModule | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [isResearching, setIsResearching] = useState(false);

  // Filters - High Value defaults to ON (>= $10,000)
  const [minBalance, setMinBalance] = useState(10000);
  const [statusFilter, setStatusFilter] = useState<DeceasedModuleStatus | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Load data
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      // Try API fetch (placeholder for now)
      const response = await fetch(`/api/deceased-module?minBalance=${minBalance}`);
      if (response.ok) {
        const data = await response.json();
        if (data.leads && data.leads.length > 0) {
          setLeads(data.leads);
          return;
        }
      }
    } catch (error) {
      console.error('Error fetching from API:', error);
    }
    // Fallback to sample data
    setLeads(sampleLeads);
    setIsLoading(false);
  };

  // Apply filters
  const filteredLeads = leads.filter(lead => {
    // Min balance filter (default $10k)
    if (lead.available_balance < minBalance) return false;
    
    // Status filter
    if (statusFilter !== 'all' && lead.status !== statusFilter) return false;
    
    // Search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        lead.decedent_name.toLowerCase().includes(query) ||
        lead.property_id.toLowerCase().includes(query) ||
        lead.county?.toLowerCase().includes(query) ||
        false
      );
    }
    
    return true;
  });

  // Calculate stats
  const stats = {
    totalLeads: filteredLeads.length,
    totalValue: filteredLeads.reduce((sum, l) => sum + l.available_balance, 0),
    potentialFees: filteredLeads.reduce((sum, l) => sum + l.available_balance * 0.10, 0),
    newCount: filteredLeads.filter(l => l.status === 'New').length,
    skipTracingCount: filteredLeads.filter(l => l.status === 'Skip-Tracing').length,
    contactedCount: filteredLeads.filter(l => l.status === 'Contacted').length,
    goldCount: filteredLeads.filter(l => l.available_balance >= 25000).length,
    goldFees: filteredLeads.filter(l => l.available_balance >= 25000).reduce((sum, l) => sum + l.available_balance * 0.10, 0),
  };

  // Open heir research panel
  const openHeirPanel = (lead: DeceasedLeadModule) => {
    setSelectedLead(lead);
    setSheetOpen(true);
  };

  // Simulate PeopleDataLabs research
  const handleResearchHeirs = async () => {
    if (!selectedLead) return;
    
    setIsResearching(true);
    
    // ═══════════════════════════════════════════════════════════════════════
    // PLACEHOLDER: PeopleDataLabs API Call
    // ═══════════════════════════════════════════════════════════════════════
    // 
    // const response = await fetch('/api/peopledatalabs', {
    //   method: 'POST',
    //   body: JSON.stringify({
    //     decedent_name: selectedLead.decedent_name,
    //     last_known_address: selectedLead.last_known_address,
    //   }),
    // });
    // const enrichedHeirs = await response.json();
    //
    // ═══════════════════════════════════════════════════════════════════════
    
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Add placeholder enriched heir
    const enrichedHeir: ReportedHeir = {
      name: `${selectedLead.decedent_name.split(' ')[0]} Jr.`,
      relation: 'Son (Discovered)',
      phone: '+1-555-000-XXXX',
      email: 'discovered@peopledatalabs.com',
      confidence: 65,
      source: 'PeopleDataLabs',
    };
    
    // Update local state with new heir
    setLeads(prev =>
      prev.map(l =>
        l.id === selectedLead.id
          ? { ...l, reported_heirs: [...l.reported_heirs, enrichedHeir], status: 'Skip-Tracing' as const }
          : l
      )
    );
    
    // Update selected lead
    setSelectedLead({
      ...selectedLead,
      reported_heirs: [...selectedLead.reported_heirs, enrichedHeir],
      status: 'Skip-Tracing',
    });
    
    setIsResearching(false);
  };

  // Update status
  const updateStatus = (leadId: string, newStatus: DeceasedModuleStatus) => {
    setLeads(prev =>
      prev.map(l => (l.id === leadId ? { ...l, status: newStatus } : l))
    );
    if (selectedLead?.id === leadId) {
      setSelectedLead({ ...selectedLead, status: newStatus });
    }
  };

  // Status badge
  const getStatusBadge = (status: DeceasedModuleStatus) => {
    switch (status) {
      case 'New':
        return (
          <span className="px-2 py-1 bg-amber-500/20 text-amber-400 text-[9px] font-black uppercase tracking-widest rounded flex items-center gap-1">
            <AlertCircle className="w-3 h-3" /> New
          </span>
        );
      case 'Skip-Tracing':
        return (
          <span className="px-2 py-1 bg-blue-500/20 text-blue-400 text-[9px] font-black uppercase tracking-widest rounded flex items-center gap-1">
            <Clock className="w-3 h-3" /> Skip-Tracing
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
            <Skull className="w-7 h-7 text-purple-500" />
            <h1 className="text-2xl font-black tracking-tight text-white">
              Deceased Leads Module
            </h1>
            <span className="px-2 py-1 bg-gold/20 text-gold text-[9px] font-black uppercase tracking-widest rounded flex items-center gap-1">
              <Crown className="w-3 h-3" /> High Value
            </span>
          </div>
          <p className="text-slate-500 text-xs">
            Estate recovery • Skip-tracing • 10% Fee Cap • CCP 1582 Compliant
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            onClick={loadData}
            disabled={isLoading}
            variant="outline"
            className="border-slate-700 text-slate-400 text-[10px] font-bold uppercase tracking-widest"
          >
            {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
            <span className="ml-2">Sync</span>
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3 mb-6">
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
          className="bg-gold/10 border border-gold/30 p-4 rounded"
        >
          <Crown className="w-4 h-4 text-gold mb-2" />
          <div className="text-xl font-mono font-bold text-gold">
            ${stats.goldFees.toLocaleString()}
          </div>
          <div className="text-[9px] font-bold text-gold/60 uppercase tracking-widest">
            Gold Tier Fees
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="bg-slate-900 border border-slate-800 p-4 rounded"
        >
          <FileText className="w-4 h-4 text-slate-400 mb-2" />
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
          transition={{ delay: 0.2 }}
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
          transition={{ delay: 0.25 }}
          className="bg-slate-900 border border-slate-800 p-4 rounded"
        >
          <Clock className="w-4 h-4 text-blue-400 mb-2" />
          <div className="text-xl font-mono font-bold text-blue-400">
            {stats.skipTracingCount}
          </div>
          <div className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">
            Skip-Tracing
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-slate-900 border border-slate-800 p-4 rounded"
        >
          <CheckCircle className="w-4 h-4 text-emerald-400 mb-2" />
          <div className="text-xl font-mono font-bold text-emerald-400">
            {stats.contactedCount}
          </div>
          <div className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">
            Contacted
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

        {/* Min Balance Slider */}
        <div className="flex items-center gap-2 bg-slate-800 border border-slate-700 px-3 py-2 rounded">
          <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">
            Min:
          </span>
          <input
            type="range"
            min="1000"
            max="50000"
            step="1000"
            value={minBalance}
            onChange={(e) => setMinBalance(Number(e.target.value))}
            className="w-24 accent-gold"
          />
          <span className="text-sm font-mono font-bold text-gold w-16">
            ${(minBalance / 1000).toFixed(0)}k
          </span>
        </div>

        {/* Status Filter */}
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as DeceasedModuleStatus | 'all')}
          className="bg-slate-800 border border-slate-700 text-white px-3 py-2 text-xs rounded"
        >
          <option value="all">All Status</option>
          <option value="New">New</option>
          <option value="Skip-Tracing">Skip-Tracing</option>
          <option value="Contacted">Contacted</option>
        </select>

        {/* Search */}
        <div className="relative ml-auto">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search decedent, property ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="bg-slate-800 border border-slate-700 text-white pl-10 pr-4 py-2 text-xs rounded w-64"
          />
        </div>
      </div>

      {/* Table */}
      <div className="bg-slate-900 border border-slate-800 rounded overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-800 flex items-center justify-between">
          <h2 className="text-xs font-black uppercase tracking-[0.15em] text-white flex items-center gap-2">
            <Skull className="w-4 h-4 text-purple-500" />
            Deceased Estates ({filteredLeads.length})
          </h2>
          <span className="text-[9px] text-gold font-bold uppercase tracking-widest">
            {stats.goldCount} Gold Tier (&gt;$25k)
          </span>
        </div>

        {isLoading ? (
          <div className="p-12 text-center">
            <Loader2 className="w-8 h-8 text-purple-500 mx-auto animate-spin mb-4" />
            <p className="text-slate-500 text-sm">Loading leads...</p>
          </div>
        ) : filteredLeads.length === 0 ? (
          <div className="p-12 text-center">
            <Skull className="w-12 h-12 text-slate-700 mx-auto mb-4" />
            <p className="text-slate-500 text-sm">No leads match filters</p>
            <p className="text-slate-600 text-xs mt-1">
              Try lowering the minimum balance
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-800 text-left">
                  <th className="px-4 py-3 text-[9px] font-black uppercase tracking-widest text-slate-500">
                    Decedent
                  </th>
                  <th className="px-4 py-3 text-[9px] font-black uppercase tracking-widest text-slate-500">
                    Property ID
                  </th>
                  <th className="px-4 py-3 text-[9px] font-black uppercase tracking-widest text-slate-500">
                    Available Balance
                  </th>
                  <th className="px-4 py-3 text-[9px] font-black uppercase tracking-widest text-slate-500">
                    Heirs
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
                {filteredLeads.map((lead) => {
                  const isGold = lead.available_balance >= 25000;
                  
                  return (
                    <tr
                      key={lead.id}
                      className={`hover:bg-slate-800/50 transition-colors ${
                        isGold ? 'bg-gradient-to-r from-gold/5 to-transparent border-l-2 border-l-gold' : ''
                      }`}
                    >
                      {/* Decedent Name */}
                      <td className="px-4 py-4">
                        <div>
                          <div className={`text-sm font-bold ${isGold ? 'text-gold' : 'text-white'}`}>
                            {lead.decedent_name}
                          </div>
                          <div className="flex items-center gap-2 text-[10px] text-slate-500 mt-1">
                            <MapPin className="w-3 h-3" />
                            {lead.county}, {lead.state}
                            <span className="text-slate-600">•</span>
                            {lead.property_type}
                          </div>
                        </div>
                      </td>

                      {/* Property ID */}
                      <td className="px-4 py-4">
                        <code className="text-xs text-slate-400 bg-slate-800 px-2 py-1 rounded">
                          {lead.property_id}
                        </code>
                      </td>

                      {/* AVAILABLE BALANCE - GOLD HIGHLIGHT */}
                      <td className="px-4 py-4">
                        <div className={`text-lg font-mono font-bold ${
                          isGold 
                            ? 'text-gold drop-shadow-[0_0_8px_rgba(234,179,8,0.5)]' 
                            : 'text-white'
                        }`}>
                          ${lead.available_balance.toLocaleString()}
                        </div>
                        <div className="text-[9px] text-emerald-500">
                          Fee: ${(lead.available_balance * 0.10).toLocaleString()}
                        </div>
                        {isGold && (
                          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-gold/20 text-gold text-[8px] font-black uppercase tracking-widest rounded mt-1">
                            <Crown className="w-2.5 h-2.5" /> Gold
                          </span>
                        )}
                      </td>

                      {/* Reported Heirs */}
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-2">
                          <Users className="w-4 h-4 text-purple-400" />
                          <span className={`text-sm font-bold ${
                            lead.reported_heirs.length > 0 ? 'text-purple-400' : 'text-slate-600'
                          }`}>
                            {lead.reported_heirs.length}
                          </span>
                          {lead.reported_heirs.length === 0 && (
                            <span className="text-[9px] text-amber-500 font-bold">
                              NEEDS RESEARCH
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Status */}
                      <td className="px-4 py-4">
                        <select
                          value={lead.status}
                          onChange={(e) => updateStatus(lead.id, e.target.value as DeceasedModuleStatus)}
                          className="bg-transparent border-none text-xs font-bold cursor-pointer focus:outline-none"
                        >
                          <option value="New" className="bg-slate-800">New</option>
                          <option value="Skip-Tracing" className="bg-slate-800">Skip-Tracing</option>
                          <option value="Contacted" className="bg-slate-800">Contacted</option>
                        </select>
                      </td>

                      {/* Actions */}
                      <td className="px-4 py-4">
                        <Button
                          onClick={() => openHeirPanel(lead)}
                          size="sm"
                          className={`text-[9px] font-bold uppercase tracking-widest h-8 px-3 ${
                            isGold
                              ? 'bg-gold hover:bg-gold/80 text-black'
                              : 'bg-purple-600 hover:bg-purple-500 text-white'
                          }`}
                        >
                          <UserSearch className="w-3 h-3 mr-1" />
                          Research Heirs
                          <ChevronRight className="w-3 h-3 ml-1" />
                        </Button>
                      </td>
                    </tr>
                  );
                })}
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
              <Shield className="w-3 h-3 text-emerald-500" /> CCP 1582 Compliant
            </span>
            <span className="flex items-center gap-1">
              <CheckCircle className="w-3 h-3 text-emerald-500" /> 10% Fee Cap
            </span>
            <span className="flex items-center gap-1">
              <CheckCircle className="w-3 h-3 text-emerald-500" /> SCO Template Contract
            </span>
          </div>
          <span>Data Source: California State Controller's Office</span>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════════
          HEIR RESEARCH SIDE PANEL
          ═══════════════════════════════════════════════════════════════════════ */}
      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent className="w-full sm:max-w-xl bg-slate-900 border-l border-slate-800 overflow-y-auto">
          {selectedLead && (
            <>
              <SheetHeader>
                <SheetTitle className="text-white flex items-center gap-2">
                  <UserSearch className="w-5 h-5 text-purple-500" />
                  Research Heirs
                </SheetTitle>
                <SheetDescription className="text-slate-400">
                  {selectedLead.decedent_name}
                </SheetDescription>
              </SheetHeader>

              <div className="mt-6 space-y-6">
                {/* Lead Summary */}
                <div className="bg-slate-800/50 border border-slate-700 rounded p-4">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <div className="text-[9px] font-bold uppercase tracking-widest text-slate-500 mb-1">
                        Property ID
                      </div>
                      <code className="text-sm text-white">{selectedLead.property_id}</code>
                    </div>
                    <div className="text-right">
                      <div className="text-[9px] font-bold uppercase tracking-widest text-slate-500 mb-1">
                        Available Balance
                      </div>
                      <div className={`text-xl font-mono font-bold ${
                        selectedLead.available_balance >= 25000 
                          ? 'text-gold drop-shadow-[0_0_8px_rgba(234,179,8,0.5)]' 
                          : 'text-white'
                      }`}>
                        ${selectedLead.available_balance.toLocaleString()}
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <div className="text-[9px] font-bold uppercase tracking-widest text-slate-500 mb-1">
                        Last Known Address
                      </div>
                      <div className="text-slate-300 flex items-start gap-2">
                        <MapPin className="w-4 h-4 text-slate-500 flex-shrink-0 mt-0.5" />
                        {selectedLead.last_known_address || 'Unknown'}
                      </div>
                    </div>
                    <div>
                      <div className="text-[9px] font-bold uppercase tracking-widest text-slate-500 mb-1">
                        Holder
                      </div>
                      <div className="text-slate-300 flex items-start gap-2">
                        <Building className="w-4 h-4 text-slate-500 flex-shrink-0 mt-0.5" />
                        {selectedLead.holder_name || 'Unknown'}
                      </div>
                    </div>
                    <div>
                      <div className="text-[9px] font-bold uppercase tracking-widest text-slate-500 mb-1">
                        Date of Death
                      </div>
                      <div className="text-slate-300 flex items-start gap-2">
                        <Calendar className="w-4 h-4 text-slate-500 flex-shrink-0 mt-0.5" />
                        {selectedLead.date_of_death 
                          ? new Date(selectedLead.date_of_death).toLocaleDateString() 
                          : 'Unknown'}
                      </div>
                    </div>
                    <div>
                      <div className="text-[9px] font-bold uppercase tracking-widest text-slate-500 mb-1">
                        Property Type
                      </div>
                      <div className="text-slate-300">
                        {selectedLead.property_type}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Reported Heirs from Database */}
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-bold text-white flex items-center gap-2">
                      <Users className="w-4 h-4 text-purple-500" />
                      Reported Heirs
                      <span className="text-slate-500">({selectedLead.reported_heirs.length})</span>
                    </h3>
                  </div>

                  {selectedLead.reported_heirs.length > 0 ? (
                    <div className="space-y-3">
                      {selectedLead.reported_heirs.map((heir, idx) => (
                        <motion.div
                          key={idx}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: idx * 0.1 }}
                          className={`p-4 rounded border ${
                            heir.source === 'PeopleDataLabs'
                              ? 'bg-purple-950/30 border-purple-500/30'
                              : 'bg-slate-800/50 border-slate-700'
                          }`}
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
                                {heir.confidence}% match
                              </span>
                            )}
                          </div>
                          
                          <div className="text-[10px] text-slate-400 mb-3">
                            {heir.relation}
                            {heir.source && (
                              <>
                                <span className="text-slate-600 mx-2">•</span>
                                <span className={heir.source === 'PeopleDataLabs' ? 'text-purple-400' : ''}>
                                  {heir.source}
                                </span>
                              </>
                            )}
                          </div>

                          <div className="flex items-center gap-3 flex-wrap">
                            {heir.phone && (
                              <a
                                href={`tel:${heir.phone}`}
                                className="flex items-center gap-1 text-xs text-emerald-400 hover:text-emerald-300 transition-colors"
                              >
                                <Phone className="w-3 h-3" />
                                {heir.phone}
                              </a>
                            )}
                            {heir.email && (
                              <a
                                href={`mailto:${heir.email}`}
                                className="flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300 transition-colors"
                              >
                                <Mail className="w-3 h-3" />
                                {heir.email}
                              </a>
                            )}
                            {heir.address && (
                              <span className="flex items-center gap-1 text-xs text-slate-400">
                                <MapPin className="w-3 h-3" />
                                {heir.address}
                              </span>
                            )}
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 bg-slate-800/30 rounded border border-dashed border-slate-700">
                      <Users className="w-8 h-8 text-slate-600 mx-auto mb-2" />
                      <p className="text-slate-500 text-sm">No heirs on file</p>
                      <p className="text-slate-600 text-xs mt-1">
                        Use the button below to search for heirs
                      </p>
                    </div>
                  )}
                </div>

                {/* PeopleDataLabs Placeholder */}
                <div className="bg-purple-950/20 border border-purple-500/30 rounded p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <Sparkles className="w-4 h-4 text-purple-400" />
                    <h4 className="text-sm font-bold text-purple-400">
                      PeopleDataLabs Enrichment
                    </h4>
                  </div>
                  <p className="text-xs text-slate-400 mb-4">
                    Click below to search for additional heirs using PeopleDataLabs API.
                    This will cross-reference the decedent&apos;s information with public records.
                  </p>
                  <Button
                    onClick={handleResearchHeirs}
                    disabled={isResearching}
                    className="w-full bg-purple-600 hover:bg-purple-500 text-white font-bold"
                  >
                    {isResearching ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Searching...
                      </>
                    ) : (
                      <>
                        <UserSearch className="w-4 h-4 mr-2" />
                        Search for Additional Heirs
                      </>
                    )}
                  </Button>
                  <p className="text-[9px] text-slate-500 mt-2 text-center">
                    Placeholder - Connect to PeopleDataLabs API
                  </p>
                </div>
              </div>

              <SheetFooter className="mt-6 pt-4 border-t border-slate-800">
                <div className="flex items-center justify-between w-full">
                  <Button
                    variant="outline"
                    onClick={() => setSheetOpen(false)}
                    className="border-slate-700 text-slate-400"
                  >
                    Close
                  </Button>
                  <Button
                    onClick={() => {
                      updateStatus(selectedLead.id, 'Contacted');
                      setSheetOpen(false);
                    }}
                    className="bg-emerald-600 hover:bg-emerald-500 text-white"
                  >
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Mark as Contacted
                  </Button>
                </div>
              </SheetFooter>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
