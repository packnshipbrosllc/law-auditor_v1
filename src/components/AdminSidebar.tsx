'use client';

import { useUser } from "@clerk/nextjs";
import { useState } from "react";
import { 
  Scale, 
  Coins, 
  LayoutDashboard, 
  FileSpreadsheet, 
  Users, 
  Settings,
  ChevronLeft,
  ChevronRight,
  Shield,
  TrendingUp,
  Skull,
  Crown,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

type AdminMode = 'LEGAL' | 'RECOVERY';

export default function AdminSidebar() {
  const { user, isLoaded } = useUser();
  const pathname = usePathname();
  const [mode, setMode] = useState<AdminMode>('LEGAL');
  const [collapsed, setCollapsed] = useState(false);

  // High-Security Check: Only admins see this
  if (!isLoaded) return null;
  if (user?.publicMetadata?.role !== 'admin') return null;

  const legalLinks = [
    { href: '/admin', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/admin/audits', label: 'Audit Queue', icon: FileSpreadsheet },
    { href: '/admin/leads', label: 'Legal Leads', icon: Users },
    { href: '/admin/settings', label: 'Settings', icon: Settings },
  ];

  const recoveryLinks = [
    { href: '/admin/recovery', label: 'Whale Dashboard', icon: LayoutDashboard },
    { href: '/admin/recovery/deceased', label: 'Deceased Module', icon: Crown },
    { href: '/admin/recovery/deceased-leads', label: 'Deceased Leads', icon: Skull },
    { href: '/admin/recovery/leads', label: 'Asset Leads', icon: Coins },
    { href: '/admin/recovery/outreach', label: 'Outreach Queue', icon: Users },
    { href: '/admin/recovery/contracts', label: 'Contracts', icon: FileSpreadsheet },
  ];

  const activeLinks = mode === 'LEGAL' ? legalLinks : recoveryLinks;

  return (
    <aside 
      className={`fixed left-0 top-0 h-screen bg-slate-950 border-r border-slate-800 z-[200] transition-all duration-300 ${
        collapsed ? 'w-16' : 'w-64'
      }`}
    >
      {/* Header */}
      <div className="p-4 border-b border-slate-800">
        <div className="flex items-center justify-between">
          {!collapsed && (
            <div className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-gold" />
              <span className="text-sm font-black uppercase tracking-widest text-white">Admin</span>
            </div>
          )}
          <button 
            onClick={() => setCollapsed(!collapsed)}
            className="p-1 hover:bg-slate-800 rounded"
          >
            {collapsed ? (
              <ChevronRight className="w-4 h-4 text-slate-400" />
            ) : (
              <ChevronLeft className="w-4 h-4 text-slate-400" />
            )}
          </button>
        </div>
      </div>

      {/* Mode Toggle */}
      <div className="p-4 border-b border-slate-800">
        {!collapsed ? (
          <div className="grid grid-cols-2 gap-2">
            <button 
              onClick={() => setMode('LEGAL')}
              className={`p-3 text-center rounded transition-all ${
                mode === 'LEGAL' 
                  ? 'bg-emerald-600 text-white' 
                  : 'bg-slate-900 text-slate-400 hover:bg-slate-800'
              }`}
            >
              <Scale className="w-5 h-5 mx-auto mb-1" />
              <span className="text-[9px] font-bold uppercase tracking-widest">Legal</span>
            </button>
            <button 
              onClick={() => setMode('RECOVERY')}
              className={`p-3 text-center rounded transition-all ${
                mode === 'RECOVERY' 
                  ? 'bg-gold text-slate-900' 
                  : 'bg-slate-900 text-slate-400 hover:bg-slate-800'
              }`}
            >
              <Coins className="w-5 h-5 mx-auto mb-1" />
              <span className="text-[9px] font-bold uppercase tracking-widest">Recovery</span>
            </button>
          </div>
        ) : (
          <div className="space-y-2">
            <button 
              onClick={() => setMode('LEGAL')}
              className={`w-full p-2 rounded ${mode === 'LEGAL' ? 'bg-emerald-600' : 'bg-slate-900'}`}
            >
              <Scale className="w-4 h-4 mx-auto text-white" />
            </button>
            <button 
              onClick={() => setMode('RECOVERY')}
              className={`w-full p-2 rounded ${mode === 'RECOVERY' ? 'bg-gold' : 'bg-slate-900'}`}
            >
              <Coins className="w-4 h-4 mx-auto text-slate-900" />
            </button>
          </div>
        )}
      </div>

      {/* Navigation Links */}
      <nav className="p-4 space-y-2">
        {activeLinks.map((link) => {
          const Icon = link.icon;
          const isActive = pathname === link.href;
          
          return (
            <Link
              key={link.href}
              href={link.href}
              className={`flex items-center gap-3 p-3 rounded transition-all ${
                isActive 
                  ? 'bg-slate-800 text-white' 
                  : 'text-slate-400 hover:bg-slate-900 hover:text-white'
              }`}
            >
              <Icon className="w-4 h-4 flex-shrink-0" />
              {!collapsed && (
                <span className="text-xs font-bold uppercase tracking-widest">{link.label}</span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Mode Indicator */}
      {!collapsed && (
        <div className="absolute bottom-4 left-4 right-4">
          <div className={`p-3 rounded text-center ${
            mode === 'LEGAL' ? 'bg-emerald-950 border border-emerald-800' : 'bg-amber-950 border border-amber-800'
          }`}>
            <TrendingUp className={`w-4 h-4 mx-auto mb-1 ${mode === 'LEGAL' ? 'text-emerald-500' : 'text-amber-500'}`} />
            <span className={`text-[9px] font-bold uppercase tracking-widest ${
              mode === 'LEGAL' ? 'text-emerald-400' : 'text-amber-400'
            }`}>
              {mode === 'LEGAL' ? 'Billing Audit Mode' : 'Asset Recovery Mode'}
            </span>
          </div>
        </div>
      )}
    </aside>
  );
}
