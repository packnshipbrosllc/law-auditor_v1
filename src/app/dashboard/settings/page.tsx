'use client';

import { useState, useEffect, useTransition } from 'react';
import { useUser } from '@clerk/nextjs';
import { motion } from 'framer-motion';
import {
  Settings,
  Shield,
  Building,
  Phone,
  Mail,
  MapPin,
  Key,
  Save,
  Loader2,
  CheckCircle,
  AlertCircle,
  FileText,
  DollarSign,
  Calendar,
  User,
  Lock,
  Eye,
  EyeOff,
} from 'lucide-react';
import { Button } from '@/components/ui/button';

// ═══════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════

interface UserSettingsForm {
  // Investigator Registration
  investigator_registration_number: string;
  registration_state: string;
  registration_expiry: string;
  // Business Info
  business_name: string;
  business_address: string;
  business_phone: string;
  business_email: string;
  // API Keys
  apollo_api_key: string;
  peopledatalabs_api_key: string;
  // Preferences
  default_fee_percentage: number;
  default_min_balance: number;
  auto_fill_contracts: boolean;
}

// ═══════════════════════════════════════════════════════════════════════════
// COMPONENT
// ═══════════════════════════════════════════════════════════════════════════

export default function SettingsPage() {
  const { user, isLoaded } = useUser();
  const [isPending, startTransition] = useTransition();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaved, setIsSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Show/hide API keys
  const [showApolloKey, setShowApolloKey] = useState(false);
  const [showPDLKey, setShowPDLKey] = useState(false);

  // Form state
  const [settings, setSettings] = useState<UserSettingsForm>({
    investigator_registration_number: '',
    registration_state: 'CA',
    registration_expiry: '',
    business_name: '',
    business_address: '',
    business_phone: '',
    business_email: '',
    apollo_api_key: '',
    peopledatalabs_api_key: '',
    default_fee_percentage: 10,
    default_min_balance: 10000,
    auto_fill_contracts: true,
  });

  // Load settings on mount
  useEffect(() => {
    const loadSettings = async () => {
      if (!user?.id) return;
      
      setIsLoading(true);
      try {
        const response = await fetch('/api/settings');
        if (response.ok) {
          const data = await response.json();
          if (data.settings) {
            setSettings({
              investigator_registration_number: data.settings.investigator_registration_number || '',
              registration_state: data.settings.registration_state || 'CA',
              registration_expiry: data.settings.registration_expiry?.split('T')[0] || '',
              business_name: data.settings.business_name || '',
              business_address: data.settings.business_address || '',
              business_phone: data.settings.business_phone || '',
              business_email: data.settings.business_email || '',
              apollo_api_key: data.settings.apollo_api_key || '',
              peopledatalabs_api_key: data.settings.peopledatalabs_api_key || '',
              default_fee_percentage: data.settings.default_fee_percentage || 10,
              default_min_balance: data.settings.default_min_balance || 10000,
              auto_fill_contracts: data.settings.auto_fill_contracts ?? true,
            });
          }
        }
      } catch (err) {
        console.error('Error loading settings:', err);
      } finally {
        setIsLoading(false);
      }
    };

    if (isLoaded) {
      loadSettings();
    }
  }, [user?.id, isLoaded]);

  // Save settings
  const handleSave = async () => {
    setError(null);
    setIsSaved(false);

    startTransition(async () => {
      try {
        const response = await fetch('/api/settings', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(settings),
        });

        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.error || 'Failed to save settings');
        }

        setIsSaved(true);
        setTimeout(() => setIsSaved(false), 3000);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to save settings');
      }
    });
  };

  // Update field
  const updateField = (field: keyof UserSettingsForm, value: string | number | boolean) => {
    setSettings(prev => ({ ...prev, [field]: value }));
  };

  if (!isLoaded || isLoading) {
    return (
      <div className="p-8 bg-slate-950 min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 text-emerald-500 mx-auto animate-spin mb-4" />
          <p className="text-slate-500">Loading settings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8 bg-slate-950 min-h-screen">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <Settings className="w-7 h-7 text-emerald-500" />
            <h1 className="text-2xl font-black tracking-tight text-white">
              Settings
            </h1>
          </div>
          <p className="text-slate-500 text-xs">
            Manage your investigator profile and preferences
          </p>
        </div>

        <Button
          onClick={handleSave}
          disabled={isPending}
          className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold"
        >
          {isPending ? (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          ) : isSaved ? (
            <CheckCircle className="w-4 h-4 mr-2" />
          ) : (
            <Save className="w-4 h-4 mr-2" />
          )}
          {isSaved ? 'Saved!' : 'Save Settings'}
        </Button>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-6 p-4 bg-red-950/50 border border-red-500/30 rounded flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-red-400" />
          <p className="text-red-400 text-sm">{error}</p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* ═══════════════════════════════════════════════════════════════════════
            INVESTIGATOR REGISTRATION (Most Important)
            ═══════════════════════════════════════════════════════════════════════ */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-emerald-950/30 border border-emerald-500/30 rounded p-6"
        >
          <div className="flex items-center gap-2 mb-6">
            <Shield className="w-5 h-5 text-emerald-400" />
            <h2 className="text-sm font-bold text-emerald-400">
              Investigator Registration
            </h2>
          </div>

          <div className="space-y-4">
            {/* Registration Number - PRIMARY FIELD */}
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2">
                Registration Number <span className="text-emerald-400">*</span>
              </label>
              <div className="relative">
                <FileText className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={settings.investigator_registration_number}
                  onChange={(e) => updateField('investigator_registration_number', e.target.value)}
                  placeholder="e.g., CA-INV-2024-12345"
                  className="w-full bg-slate-800 border border-slate-700 text-white pl-10 pr-4 py-3 rounded focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none"
                />
              </div>
              <p className="text-[9px] text-slate-500 mt-1">
                Your California Investigator Registration Number (auto-fills on claim forms)
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {/* State */}
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2">
                  State
                </label>
                <select
                  value={settings.registration_state}
                  onChange={(e) => updateField('registration_state', e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 text-white px-3 py-3 rounded"
                >
                  <option value="CA">California</option>
                  <option value="TX">Texas</option>
                  <option value="FL">Florida</option>
                  <option value="NY">New York</option>
                  <option value="OTHER">Other</option>
                </select>
              </div>

              {/* Expiry */}
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2">
                  Expiry Date
                </label>
                <div className="relative">
                  <Calendar className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="date"
                    value={settings.registration_expiry}
                    onChange={(e) => updateField('registration_expiry', e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 text-white pl-10 pr-4 py-3 rounded"
                  />
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Business Information */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-slate-900 border border-slate-800 rounded p-6"
        >
          <div className="flex items-center gap-2 mb-6">
            <Building className="w-5 h-5 text-blue-400" />
            <h2 className="text-sm font-bold text-white">
              Business Information
            </h2>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2">
                Business Name
              </label>
              <div className="relative">
                <Building className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={settings.business_name}
                  onChange={(e) => updateField('business_name', e.target.value)}
                  placeholder="Your business or DBA name"
                  className="w-full bg-slate-800 border border-slate-700 text-white pl-10 pr-4 py-3 rounded"
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2">
                Business Address
              </label>
              <div className="relative">
                <MapPin className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                <textarea
                  value={settings.business_address}
                  onChange={(e) => updateField('business_address', e.target.value)}
                  placeholder="Street address, City, State ZIP"
                  rows={2}
                  className="w-full bg-slate-800 border border-slate-700 text-white pl-10 pr-4 py-3 rounded resize-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2">
                  Phone
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="tel"
                    value={settings.business_phone}
                    onChange={(e) => updateField('business_phone', e.target.value)}
                    placeholder="+1-916-555-0000"
                    className="w-full bg-slate-800 border border-slate-700 text-white pl-10 pr-4 py-3 rounded"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2">
                  Email
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    value={settings.business_email}
                    onChange={(e) => updateField('business_email', e.target.value)}
                    placeholder="contact@business.com"
                    className="w-full bg-slate-800 border border-slate-700 text-white pl-10 pr-4 py-3 rounded"
                  />
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* API Keys */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-slate-900 border border-slate-800 rounded p-6"
        >
          <div className="flex items-center gap-2 mb-6">
            <Key className="w-5 h-5 text-amber-400" />
            <h2 className="text-sm font-bold text-white">
              API Keys (Enrichment)
            </h2>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2">
                Apollo.io API Key
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type={showApolloKey ? 'text' : 'password'}
                  value={settings.apollo_api_key}
                  onChange={(e) => updateField('apollo_api_key', e.target.value)}
                  placeholder="api_xxxxxxxxxxxxx"
                  className="w-full bg-slate-800 border border-slate-700 text-white pl-10 pr-12 py-3 rounded font-mono text-sm"
                />
                <button
                  type="button"
                  onClick={() => setShowApolloKey(!showApolloKey)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-slate-700 rounded"
                >
                  {showApolloKey ? (
                    <EyeOff className="w-4 h-4 text-slate-400" />
                  ) : (
                    <Eye className="w-4 h-4 text-slate-400" />
                  )}
                </button>
              </div>
              <p className="text-[9px] text-slate-500 mt-1">
                For business contact enrichment (CFO, Owner lookup)
              </p>
            </div>

            <div>
              <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2">
                PeopleDataLabs API Key
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type={showPDLKey ? 'text' : 'password'}
                  value={settings.peopledatalabs_api_key}
                  onChange={(e) => updateField('peopledatalabs_api_key', e.target.value)}
                  placeholder="pdl_xxxxxxxxxxxxx"
                  className="w-full bg-slate-800 border border-slate-700 text-white pl-10 pr-12 py-3 rounded font-mono text-sm"
                />
                <button
                  type="button"
                  onClick={() => setShowPDLKey(!showPDLKey)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-slate-700 rounded"
                >
                  {showPDLKey ? (
                    <EyeOff className="w-4 h-4 text-slate-400" />
                  ) : (
                    <Eye className="w-4 h-4 text-slate-400" />
                  )}
                </button>
              </div>
              <p className="text-[9px] text-slate-500 mt-1">
                For heir/relative search and skip-tracing
              </p>
            </div>
          </div>
        </motion.div>

        {/* Preferences */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-slate-900 border border-slate-800 rounded p-6"
        >
          <div className="flex items-center gap-2 mb-6">
            <DollarSign className="w-5 h-5 text-gold" />
            <h2 className="text-sm font-bold text-white">
              Defaults & Preferences
            </h2>
          </div>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2">
                  Default Fee %
                </label>
                <div className="relative">
                  <DollarSign className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="number"
                    min="1"
                    max="10"
                    step="0.5"
                    value={settings.default_fee_percentage}
                    onChange={(e) => updateField('default_fee_percentage', parseFloat(e.target.value) || 10)}
                    className="w-full bg-slate-800 border border-slate-700 text-white pl-10 pr-4 py-3 rounded"
                  />
                </div>
                <p className="text-[9px] text-slate-500 mt-1">
                  Max 10% per CCP 1582
                </p>
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2">
                  Min Balance Filter
                </label>
                <div className="relative">
                  <span className="text-slate-500 absolute left-3 top-1/2 -translate-y-1/2">$</span>
                  <input
                    type="number"
                    min="1000"
                    step="1000"
                    value={settings.default_min_balance}
                    onChange={(e) => updateField('default_min_balance', parseInt(e.target.value) || 10000)}
                    className="w-full bg-slate-800 border border-slate-700 text-white pl-8 pr-4 py-3 rounded"
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between p-4 bg-slate-800/50 rounded">
              <div>
                <div className="text-sm font-bold text-white">Auto-fill Contracts</div>
                <div className="text-[10px] text-slate-500">
                  Automatically populate claim forms with your registration info
                </div>
              </div>
              <button
                type="button"
                onClick={() => updateField('auto_fill_contracts', !settings.auto_fill_contracts)}
                className={`relative w-12 h-6 rounded-full transition-colors ${
                  settings.auto_fill_contracts ? 'bg-emerald-600' : 'bg-slate-700'
                }`}
              >
                <div
                  className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${
                    settings.auto_fill_contracts ? 'left-7' : 'left-1'
                  }`}
                />
              </button>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Account Info */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="mt-6 p-4 bg-slate-900/50 border border-slate-800 rounded"
      >
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-slate-800 flex items-center justify-center">
            <User className="w-6 h-6 text-slate-400" />
          </div>
          <div>
            <div className="text-sm font-bold text-white">
              {user?.fullName || user?.emailAddresses?.[0]?.emailAddress}
            </div>
            <div className="text-[10px] text-slate-500">
              Clerk ID: {user?.id?.slice(0, 20)}...
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
