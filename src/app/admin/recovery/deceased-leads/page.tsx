'use client';

import { useState, useEffect, useTransition } from 'react';
import { motion } from 'framer-motion';
import {
  Skull,
  Users,
  DollarSign,
  Search,
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
  FileText,
  Phone,
  Mail,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  scrapeAndSyncLeads,
  searchRelatives,
  updateLeadStatus,
  fetchDeceasedLeads,
  fetchDeceasedLeadStats,
} from '@/app/actions/leads';
import type { DeceasedLead, DeceasedLeadStatus, PotentialHeir } from '@/lib/db';

export default function DeceasedLeadsPage() {
  // State
  const [leads, setLeads] = useState<DeceasedLead[]>([]);
  const [stats, setStats] = useState<Record<string, number> | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [expandedRow, setExpandedRow] = useState<string | null>(null);
  const [searchingHeirs, setSearchingHeirs] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  // Filters
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [stateFilter, setStateFilter] = useState<string>('all');
  const [minAmount, setMinAmount] = useState<number>(1000);

  // Sample data for development (before database is populated)
  const sampleLeads: DeceasedLead[] = [
    {
      id: 'DL001',
      original_owner: 'JOHN DOE ESTATE',
      asset_amount: 45000,
      potential_fee: 4500,
      source_url: 'https://www.sco.ca.gov/upd_msg.html',
      date_listed: '2026-01-15',
      status: 'new',
      potential_heirs: [],
      county: 'Sacramento',
      state: 'CA',
      property_type: 'Cash',
      notes: null,
      created_at: '2026-01-20',
      updated_at: '2026-01-20',
    },
    {
      id: 'DL002',
      original_owner: 'MARY ELIZABETH SMITH ESTATE',
      asset_amount: 125000,
      potential_fee: 12500,
      source_url: 'https://www.sco.ca.gov/upd_msg.html',
      date_listed: '2026-01-10',
      status: 'contacted',
      potential_heirs: [
        { name: 'James Smith', relation: 'Son', contact_info: '+1-916-555-0123' },
        { name: 'Patricia Smith-Jones', relation: 'Daughter', contact_info: 'patricia@email.com' },
      ],
      county: 'San Francisco',
      state: 'CA',
      property_type: 'Securities',
      notes: 'High value estate, heirs located',
      created_at: '2026-01-12',
      updated_at: '2026-01-25',
    },
    {
      id: 'DL003',
      original_owner: 'ROBERT JOHNSON ESTATE',
      asset_amount: 78500,
      potential_fee: 7850,
      source_url: 'https://www.sco.ca.gov/upd_msg.html',
      date_listed: '2026-01-05',
      status: 'new',
      potential_heirs: [],
      county: 'Los Angeles',
      state: 'CA',
      property_type: 'Safe Deposit',
      notes: null,
      created_at: '2026-01-08',
      updated_at: '2026-01-08',
    },
    {
      id: 'DL004',
      original_owner: 'HELEN WILLIAMS ESTATE',
      asset_amount: 32000,
      potential_fee: 3200,
      source_url: 'https://www.sco.ca.gov/upd_msg.html',
      date_listed: '2025-12-20',
      status: 'claimed',
      potential_heirs: [
        { name: 'Michael Williams', relation: 'Spouse', contact_info: '+1-510-555-0456' },
      ],
      county: 'Alameda',
      state: 'CA',
      property_type: 'Cash',
      notes: 'Successfully claimed - fee collected',
      created_at: '2025-12-22',
      updated_at: '2026-01-28',
    },
  ];

  // Load data
  useEffect(() => {
    loadData();
  }, [statusFilter, stateFilter, minAmount]);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [leadsData, statsData] = await Promise.all([
        fetchDeceasedLeads({
          status: statusFilter !== 'all' ? statusFilter as DeceasedLeadStatus : undefined,
          state: stateFilter !== 'all' ? stateFilter : undefined,
          minAmount,
        }),
        fetchDeceasedLeadStats(),
      ]);

      // Use fetched data or fall back to samples
      setLeads(leadsData.length > 0 ? leadsData : sampleLeads);
      setStats(statsData);
    } catch (error) {
      console.error('Error loading data:', error);
      setLeads(sampleLeads);
    } finally {
      setIsLoading(false);
    }
  };

  // Scrape new leads
  const handleScrape = async () => {
    startTransition(async () => {
      const result = await scrapeAndSyncLeads('california');
      if (result.success) {
        await loadData();
      } else {
        alert(`Scrape failed: ${result.errors.join(', ')}`);
      }
    });
  };

  // Search for heirs
  const handleSearchRelatives = async (lead: DeceasedLead) => {
    setSearchingHeirs(lead.id);
    try {
      const result = await searchRelatives(lead.id, lead.original_owner);
      if (result.success) {
        // Update local state with new heirs
        setLeads(prev =>
          prev.map(l =>
            l.id === lead.id ? { ...l, potential_heirs: result.heirs } : l
          )
        );
        setExpandedRow(lead.id);
      } else {
        alert(`Search failed: ${result.error}`);
      }
    } finally {
      setSearchingHeirs(null);
    }
  };

  // Update status
  const handleStatusChange = async (leadId: string, newStatus: DeceasedLeadStatus) => {
    const result = await updateLeadStatus(leadId, newStatus);
    if (result.success) {
      setLeads(prev =>
        prev.map(l => (l.id === leadId ? { ...l, status: newStatus } : l))
      );
    }
  };

  // Calculate filtered stats
  const filteredStats = {
    totalLeads: leads.length,
    totalValue: leads.reduce((sum, l) => sum + l.asset_amount, 0),
    totalFees: leads.reduce((sum, l) => sum + l.potential_fee, 0),
    newCount: leads.filter(l => l.status === 'new').length,
    contactedCount: leads.filter(l => l.status === 'contacted').length,
    claimedCount: leads.filter(l => l.status === 'claimed').length,
    withHeirs: leads.filter(l => l.potential_heirs.length > 0).length,
  };

  const getStatusBadge = (status: DeceasedLeadStatus) => {
    switch (status) {
      case 'new':
        return (
          <span className="px-2 py-1 bg-amber-500/20 text-amber-400 text-[9px] font-black uppercase tracking-widest rounded flex items-center gap-1">
            <AlertCircle className="w-3 h-3" /> New
          </span>
        );
      case 'contacted':
        return (
          <span className="px-2 py-1 bg-blue-500/20 text-blue-400 text-[9px] font-black uppercase tracking-widest rounded flex items-center gap-1">
            <Clock className="w-3 h-3" /> Contacted
          </span>
        );
      case 'claimed':
        return (
          <span className="px-2 py-1 bg-emerald-500/20 text-emerald-400 text-[9px] font-black uppercase tracking-widest rounded flex items-center gap-1">
            <CheckCircle className="w-3 h-3" /> Claimed
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
            <Skull className="w-7 h-7 text-slate-400" />
            <h1 className="text-2xl font-black tracking-tight text-white">
              Deceased Leads
            </h1>
            <span className="px-2 py-1 bg-slate-800 text-slate-400 text-[9px] font-black uppercase tracking-widest rounded">
              Estate Recovery
            </span>
          </div>
          <p className="text-slate-500 text-xs">
            California Unclaimed Estates • Heir Location • 10% Fee Cap
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            onClick={handleScrape}
            disabled={isPending}
            className="bg-slate-800 hover:bg-slate-700 text-white text-[10px] font-bold uppercase tracking-widest"
          >
            {isPending ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <RefreshCw className="w-4 h-4 mr-2" />
            )}
            Sync Leads
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
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3 mb-6">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-slate-900 border border-slate-800 p-4 rounded"
        >
          <DollarSign className="w-4 h-4 text-gold mb-2" />
          <div className="text-xl font-mono font-bold text-white">
            ${(filteredStats.totalValue / 1000).toFixed(0)}k
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
          <DollarSign className="w-4 h-4 text-emerald-400 mb-2" />
          <div className="text-xl font-mono font-bold text-emerald-400">
            ${filteredStats.totalFees.toLocaleString()}
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
          <FileText className="w-4 h-4 text-blue-400 mb-2" />
          <div className="text-xl font-mono font-bold text-white">
            {filteredStats.totalLeads}
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
            {filteredStats.newCount}
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
            {filteredStats.contactedCount}
          </div>
          <div className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">
            Contacted
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="bg-slate-900 border border-slate-800 p-4 rounded"
        >
          <CheckCircle className="w-4 h-4 text-emerald-400 mb-2" />
          <div className="text-xl font-mono font-bold text-emerald-400">
            {filteredStats.claimedCount}
          </div>
          <div className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">
            Claimed
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-slate-900 border border-slate-800 p-4 rounded"
        >
          <Users className="w-4 h-4 text-purple-400 mb-2" />
          <div className="text-xl font-mono font-bold text-purple-400">
            {filteredStats.withHeirs}
          </div>
          <div className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">
            Heirs Found
          </div>
        </motion.div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4 mb-6">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-500" />
          <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">
            Filters:
          </span>
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="bg-slate-800 border border-slate-700 text-white px-3 py-2 text-xs rounded"
        >
          <option value="all">All Status</option>
          <option value="new">New</option>
          <option value="contacted">Contacted</option>
          <option value="claimed">Claimed</option>
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
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-slate-500">Min: ${minAmount.toLocaleString()}</span>
          <input
            type="range"
            min="1000"
            max="50000"
            step="1000"
            value={minAmount}
            onChange={(e) => setMinAmount(Number(e.target.value))}
            className="w-32 accent-gold"
          />
        </div>
      </div>

      {/* Table */}
      <div className="bg-slate-900 border border-slate-800 rounded overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-800">
          <h2 className="text-xs font-black uppercase tracking-[0.15em] text-white">
            Deceased Estates ({leads.length})
          </h2>
        </div>

        {isLoading ? (
          <div className="p-12 text-center">
            <Loader2 className="w-8 h-8 text-slate-500 mx-auto animate-spin mb-4" />
            <p className="text-slate-500 text-sm">Loading deceased leads...</p>
          </div>
        ) : leads.length === 0 ? (
          <div className="p-12 text-center">
            <Skull className="w-12 h-12 text-slate-700 mx-auto mb-4" />
            <p className="text-slate-500 text-sm">No leads found</p>
            <Button onClick={handleScrape} className="mt-4">
              Sync Leads from California SCO
            </Button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-800 text-left">
                  <th className="px-4 py-3 text-[9px] font-black uppercase tracking-widest text-slate-500">
                    Original Owner
                  </th>
                  <th className="px-4 py-3 text-[9px] font-black uppercase tracking-widest text-slate-500">
                    Asset Value
                  </th>
                  <th className="px-4 py-3 text-[9px] font-black uppercase tracking-widest text-slate-500">
                    Your Fee
                  </th>
                  <th className="px-4 py-3 text-[9px] font-black uppercase tracking-widest text-slate-500">
                    Date Listed
                  </th>
                  <th className="px-4 py-3 text-[9px] font-black uppercase tracking-widest text-slate-500">
                    Status
                  </th>
                  <th className="px-4 py-3 text-[9px] font-black uppercase tracking-widest text-slate-500">
                    Heirs
                  </th>
                  <th className="px-4 py-3 text-[9px] font-black uppercase tracking-widest text-slate-500">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {leads.map((lead) => (
                  <>
                    <tr
                      key={lead.id}
                      className={`hover:bg-slate-800/50 transition-colors ${
                        expandedRow === lead.id ? 'bg-slate-800/30' : ''
                      }`}
                    >
                      {/* Original Owner */}
                      <td className="px-4 py-4">
                        <div>
                          <div className="text-sm font-bold text-white">
                            {lead.original_owner}
                          </div>
                          <div className="flex items-center gap-2 text-[10px] text-slate-500">
                            <MapPin className="w-3 h-3" />
                            {lead.county}, {lead.state}
                            <span className="text-slate-600">•</span>
                            {lead.property_type}
                          </div>
                        </div>
                      </td>

                      {/* Asset Value */}
                      <td className="px-4 py-4">
                        <span className="text-lg font-mono font-bold text-gold">
                          ${lead.asset_amount.toLocaleString()}
                        </span>
                      </td>

                      {/* Your Fee */}
                      <td className="px-4 py-4">
                        <span className="text-lg font-mono font-bold text-emerald-400">
                          ${lead.potential_fee.toLocaleString()}
                        </span>
                      </td>

                      {/* Date Listed */}
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-2 text-sm text-slate-400">
                          <Calendar className="w-3 h-3" />
                          {new Date(lead.date_listed).toLocaleDateString()}
                        </div>
                      </td>

                      {/* Status */}
                      <td className="px-4 py-4">
                        <select
                          value={lead.status}
                          onChange={(e) =>
                            handleStatusChange(lead.id, e.target.value as DeceasedLeadStatus)
                          }
                          className={`text-[9px] font-black uppercase tracking-widest px-2 py-1 border-0 rounded cursor-pointer ${
                            lead.status === 'claimed'
                              ? 'bg-emerald-500/20 text-emerald-400'
                              : lead.status === 'contacted'
                              ? 'bg-blue-500/20 text-blue-400'
                              : 'bg-amber-500/20 text-amber-400'
                          }`}
                        >
                          <option value="new">New</option>
                          <option value="contacted">Contacted</option>
                          <option value="claimed">Claimed</option>
                        </select>
                      </td>

                      {/* Heirs Count */}
                      <td className="px-4 py-4">
                        <button
                          onClick={() =>
                            setExpandedRow(expandedRow === lead.id ? null : lead.id)
                          }
                          className="flex items-center gap-2 text-sm"
                        >
                          <Users
                            className={`w-4 h-4 ${
                              lead.potential_heirs.length > 0
                                ? 'text-purple-400'
                                : 'text-slate-600'
                            }`}
                          />
                          <span
                            className={
                              lead.potential_heirs.length > 0
                                ? 'text-purple-400'
                                : 'text-slate-600'
                            }
                          >
                            {lead.potential_heirs.length}
                          </span>
                          {lead.potential_heirs.length > 0 &&
                            (expandedRow === lead.id ? (
                              <ChevronUp className="w-3 h-3 text-slate-500" />
                            ) : (
                              <ChevronDown className="w-3 h-3 text-slate-500" />
                            ))}
                        </button>
                      </td>

                      {/* Actions */}
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-2">
                          <Button
                            onClick={() => handleSearchRelatives(lead)}
                            disabled={searchingHeirs === lead.id}
                            size="sm"
                            className="bg-purple-600 hover:bg-purple-500 text-white text-[9px] font-bold uppercase tracking-widest h-8 px-3"
                          >
                            {searchingHeirs === lead.id ? (
                              <Loader2 className="w-3 h-3 animate-spin" />
                            ) : (
                              <>
                                <UserSearch className="w-3 h-3 mr-1" />
                                Search Relatives
                              </>
                            )}
                          </Button>
                          {lead.source_url && (
                            <a
                              href={lead.source_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-2 hover:bg-slate-700 rounded"
                              title="View Source"
                            >
                              <ExternalLink className="w-4 h-4 text-slate-400" />
                            </a>
                          )}
                        </div>
                      </td>
                    </tr>

                    {/* Expanded Heirs Row */}
                    {expandedRow === lead.id && lead.potential_heirs.length > 0 && (
                      <tr className="bg-slate-800/20">
                        <td colSpan={7} className="px-4 py-4">
                          <div className="ml-4 pl-4 border-l-2 border-purple-500/30">
                            <h4 className="text-[10px] font-black uppercase tracking-widest text-purple-400 mb-3">
                              Potential Heirs ({lead.potential_heirs.length})
                            </h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                              {lead.potential_heirs.map((heir, idx) => (
                                <div
                                  key={idx}
                                  className="bg-slate-900/50 border border-slate-700 p-3 rounded"
                                >
                                  <div className="text-sm font-bold text-white mb-1">
                                    {heir.name}
                                  </div>
                                  <div className="text-[10px] text-purple-400 mb-2">
                                    {heir.relation}
                                  </div>
                                  {heir.contact_info && (
                                    <div className="flex items-center gap-2 text-[10px] text-slate-400">
                                      {heir.contact_info.includes('@') ? (
                                        <a
                                          href={`mailto:${heir.contact_info}`}
                                          className="flex items-center gap-1 hover:text-blue-400"
                                        >
                                          <Mail className="w-3 h-3" />
                                          {heir.contact_info}
                                        </a>
                                      ) : heir.contact_info.includes('+') ||
                                        heir.contact_info.match(/^\d/) ? (
                                        <a
                                          href={`tel:${heir.contact_info}`}
                                          className="flex items-center gap-1 hover:text-emerald-400"
                                        >
                                          <Phone className="w-3 h-3" />
                                          {heir.contact_info}
                                        </a>
                                      ) : (
                                        <span>{heir.contact_info}</span>
                                      )}
                                    </div>
                                  )}
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
              <CheckCircle className="w-3 h-3 text-emerald-500" /> Heir Notification Required
            </span>
          </div>
          <span>Source: California State Controller's Office</span>
        </div>
      </div>
    </div>
  );
}
