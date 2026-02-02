'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  FileSpreadsheet, 
  Users, 
  DollarSign, 
  TrendingUp,
  Clock,
  CheckCircle,
  AlertTriangle,
  ArrowUpRight
} from 'lucide-react';

interface DashboardStats {
  pendingAudits: number;
  completedAudits: number;
  totalLeads: number;
  totalSavingsIdentified: number;
  conversionRate: number;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    pendingAudits: 12,
    completedAudits: 47,
    totalLeads: 89,
    totalSavingsIdentified: 1247500,
    conversionRate: 23.4,
  });

  const [recentLeads, setRecentLeads] = useState([
    { id: 1, email: 'partner@biglaw.com', state: 'TX', savings: 45000, status: 'pending', date: '2026-01-29' },
    { id: 2, email: 'cfo@techcorp.com', state: 'CA', savings: 125000, status: 'contacted', date: '2026-01-28' },
    { id: 3, email: 'legal@startup.io', state: 'FL', savings: 18500, status: 'converted', date: '2026-01-27' },
  ]);

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-black tracking-tight text-white mb-2">
          Admin Dashboard
        </h1>
        <p className="text-slate-500 text-sm font-medium uppercase tracking-widest">
          LawAuditor Command Center • Legal Billing Audit
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-slate-900 border border-slate-800 p-6"
        >
          <div className="flex items-center justify-between mb-4">
            <Clock className="w-5 h-5 text-amber-500" />
            <span className="text-[9px] font-bold text-amber-500 uppercase tracking-widest">Pending</span>
          </div>
          <div className="text-3xl font-mono font-bold text-white">{stats.pendingAudits}</div>
          <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">Audits in Queue</div>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-slate-900 border border-slate-800 p-6"
        >
          <div className="flex items-center justify-between mb-4">
            <CheckCircle className="w-5 h-5 text-emerald-500" />
            <span className="text-[9px] font-bold text-emerald-500 uppercase tracking-widest">Completed</span>
          </div>
          <div className="text-3xl font-mono font-bold text-white">{stats.completedAudits}</div>
          <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">Reports Delivered</div>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-slate-900 border border-slate-800 p-6"
        >
          <div className="flex items-center justify-between mb-4">
            <Users className="w-5 h-5 text-blue-500" />
            <span className="text-[9px] font-bold text-blue-500 uppercase tracking-widest">Leads</span>
          </div>
          <div className="text-3xl font-mono font-bold text-white">{stats.totalLeads}</div>
          <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">Total Prospects</div>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-emerald-950 border border-emerald-800 p-6"
        >
          <div className="flex items-center justify-between mb-4">
            <DollarSign className="w-5 h-5 text-emerald-400" />
            <span className="text-[9px] font-bold text-emerald-400 uppercase tracking-widest">Revenue</span>
          </div>
          <div className="text-3xl font-mono font-bold text-emerald-400">
            ${(stats.totalSavingsIdentified * 0.20).toLocaleString()}
          </div>
          <div className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest mt-1">Potential Fees (20%)</div>
        </motion.div>
      </div>

      {/* Recent Leads Table */}
      <div className="bg-slate-900 border border-slate-800 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between">
          <h2 className="text-sm font-black uppercase tracking-[0.2em] text-white">Recent Leads</h2>
          <button className="text-[10px] font-bold uppercase tracking-widest text-emerald-500 hover:text-emerald-400 flex items-center gap-1">
            View All <ArrowUpRight className="w-3 h-3" />
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-800 text-left">
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-500">Email</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-500">State</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-500">Savings</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-500">Status</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-500">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {recentLeads.map((lead) => (
                <tr key={lead.id} className="hover:bg-slate-800/50 transition-colors">
                  <td className="px-6 py-4 text-sm text-white font-medium">{lead.email}</td>
                  <td className="px-6 py-4">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">{lead.state}</span>
                  </td>
                  <td className="px-6 py-4 text-sm font-mono text-emerald-400">
                    ${lead.savings.toLocaleString()}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 text-[9px] font-black uppercase tracking-widest ${
                      lead.status === 'converted' ? 'bg-emerald-500/20 text-emerald-400' :
                      lead.status === 'contacted' ? 'bg-blue-500/20 text-blue-400' :
                      'bg-amber-500/20 text-amber-400'
                    }`}>
                      {lead.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-500">{lead.date}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
