'use client';

import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Users,
  Phone,
  Mail,
  MapPin,
  Copy,
  CheckCircle,
  Loader2,
  Search,
  ExternalLink,
  Linkedin,
  FileText,
  Download,
  Building,
  User,
  AlertCircle,
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
} from '@/components/ui/sheet';
import type { PotentialHeir, HeirSearchResult } from '@/lib/peopledatalabs';

// ═══════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════

interface ResearchPanelProps {
  isOpen: boolean;
  onClose: () => void;
  decedentName: string;
  county: string | null;
  lastKnownAddress: string | null;
  propertyId: string;
  availableBalance: number;
  onSearchComplete?: (result: HeirSearchResult) => void;
}

// ═══════════════════════════════════════════════════════════════════════════
// COMPONENT
// ═══════════════════════════════════════════════════════════════════════════

export default function ResearchPanel({
  isOpen,
  onClose,
  decedentName,
  county,
  lastKnownAddress,
  propertyId,
  availableBalance,
  onSearchComplete,
}: ResearchPanelProps) {
  const [isSearching, setIsSearching] = useState(false);
  const [searchResult, setSearchResult] = useState<HeirSearchResult | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const [selectedHeir, setSelectedHeir] = useState<PotentialHeir | null>(null);

  // Search for heirs
  const handleSearch = useCallback(async () => {
    setIsSearching(true);
    setSearchResult(null);

    try {
      const response = await fetch('/api/research-heirs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          decedentName,
          county,
          lastKnownAddress,
        }),
      });

      const result: HeirSearchResult = await response.json();
      setSearchResult(result);
      
      if (onSearchComplete) {
        onSearchComplete(result);
      }
    } catch (error) {
      console.error('Error searching for heirs:', error);
      setSearchResult({
        success: false,
        decedent_name: decedentName,
        search_county: county,
        total_found: 0,
        potential_heirs: [],
        search_timestamp: new Date().toISOString(),
        error: 'Search failed. Please try again.',
      });
    } finally {
      setIsSearching(false);
    }
  }, [decedentName, county, lastKnownAddress, onSearchComplete]);

  // Copy phone number to clipboard
  const copyPhoneNumber = (phone: string, heirId: string) => {
    navigator.clipboard.writeText(phone);
    setCopiedId(`${heirId}-phone`);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Generate Standard Agreement PDF
  const handleGenerateAgreement = async (heir?: PotentialHeir) => {
    setIsGeneratingPDF(true);
    setSelectedHeir(heir || null);

    try {
      const response = await fetch('/api/generate-agreement', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          decedentName,
          propertyId,
          availableBalance,
          county,
          heirName: heir?.full_name || '',
          heirAddress: heir?.full_address || '',
          heirPhone: heir?.phone_numbers?.[0] || '',
          heirEmail: heir?.emails?.[0] || '',
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate agreement');
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      
      // Download the PDF
      const a = document.createElement('a');
      a.href = url;
      a.download = `Agreement_${propertyId}_${heir?.last_name || 'Standard'}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error generating agreement:', error);
      alert('Failed to generate agreement. Please try again.');
    } finally {
      setIsGeneratingPDF(false);
      setSelectedHeir(null);
    }
  };

  // Get confidence badge color
  const getConfidenceBadge = (score: number) => {
    if (score >= 80) return 'bg-emerald-500/20 text-emerald-400';
    if (score >= 60) return 'bg-amber-500/20 text-amber-400';
    return 'bg-slate-700 text-slate-400';
  };

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent className="w-full sm:max-w-2xl bg-slate-900 border-l border-slate-800 overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="text-white flex items-center gap-2">
            <Users className="w-5 h-5 text-purple-500" />
            Research Potential Heirs
          </SheetTitle>
          <SheetDescription className="text-slate-400">
            Search for relatives of {decedentName}
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-6">
          {/* Search Card */}
          <div className="bg-purple-950/30 border border-purple-500/30 rounded p-4">
            <div className="flex items-center gap-2 mb-3">
              <Sparkles className="w-4 h-4 text-purple-400" />
              <h4 className="text-sm font-bold text-purple-400">
                People Data Labs Search
              </h4>
            </div>
            
            <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
              <div>
                <div className="text-[9px] font-bold uppercase tracking-widest text-slate-500 mb-1">
                  Decedent
                </div>
                <div className="text-white">{decedentName}</div>
              </div>
              <div>
                <div className="text-[9px] font-bold uppercase tracking-widest text-slate-500 mb-1">
                  County
                </div>
                <div className="text-white">{county || 'Unknown'}</div>
              </div>
            </div>

            <Button
              onClick={handleSearch}
              disabled={isSearching}
              className="w-full bg-purple-600 hover:bg-purple-500 text-white font-bold"
            >
              {isSearching ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Searching...
                </>
              ) : (
                <>
                  <Search className="w-4 h-4 mr-2" />
                  Search for Potential Heirs
                </>
              )}
            </Button>
          </div>

          {/* Search Results */}
          <AnimatePresence>
            {searchResult && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-4"
              >
                {/* Results Header */}
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <Users className="w-4 h-4 text-purple-500" />
                    Potential Heirs
                    <span className="text-slate-500">({searchResult.total_found})</span>
                  </h3>
                  
                  {searchResult.total_found > 0 && (
                    <Button
                      onClick={() => handleGenerateAgreement()}
                      disabled={isGeneratingPDF}
                      size="sm"
                      variant="outline"
                      className="border-slate-700 text-slate-400 text-[10px]"
                    >
                      <FileText className="w-3 h-3 mr-1" />
                      Blank Agreement
                    </Button>
                  )}
                </div>

                {/* Error State */}
                {searchResult.error && (
                  <div className="p-4 bg-red-950/30 border border-red-500/30 rounded">
                    <div className="flex items-center gap-2 text-red-400">
                      <AlertCircle className="w-4 h-4" />
                      <span className="text-sm">{searchResult.error}</span>
                    </div>
                  </div>
                )}

                {/* Empty State */}
                {searchResult.success && searchResult.total_found === 0 && (
                  <div className="p-8 text-center bg-slate-800/30 rounded border border-dashed border-slate-700">
                    <Users className="w-8 h-8 text-slate-600 mx-auto mb-2" />
                    <p className="text-slate-500 text-sm">No potential heirs found</p>
                    <p className="text-slate-600 text-xs mt-1">
                      Try expanding your search criteria
                    </p>
                  </div>
                )}

                {/* Heirs List */}
                {searchResult.success && searchResult.potential_heirs.length > 0 && (
                  <div className="space-y-3">
                    {searchResult.potential_heirs.map((heir, idx) => (
                      <motion.div
                        key={heir.id}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: idx * 0.1 }}
                        className="p-4 bg-slate-800/50 rounded border border-slate-700 hover:border-slate-600 transition-colors"
                      >
                        {/* Header */}
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <div className="flex items-center gap-2">
                              <User className="w-4 h-4 text-slate-400" />
                              <span className="font-bold text-white">{heir.full_name}</span>
                              {heir.age && (
                                <span className="text-xs text-slate-500">
                                  ({heir.age} years old)
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-2 mt-1">
                              <span className="text-xs text-purple-400">{heir.possible_relation}</span>
                              <span className={`px-2 py-0.5 text-[9px] font-bold rounded ${getConfidenceBadge(heir.confidence_score)}`}>
                                {heir.confidence_score}% match
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Location */}
                        {(heir.city || heir.state) && (
                          <div className="flex items-center gap-2 text-sm text-slate-400 mb-3">
                            <MapPin className="w-3 h-3" />
                            {[heir.city, heir.state].filter(Boolean).join(', ')}
                          </div>
                        )}

                        {/* Contact Info */}
                        <div className="space-y-2 mb-3">
                          {/* Phone Numbers */}
                          {heir.phone_numbers.length > 0 && (
                            <div className="flex flex-wrap gap-2">
                              {heir.phone_numbers.map((phone, phoneIdx) => (
                                <div
                                  key={phoneIdx}
                                  className="flex items-center gap-2 bg-slate-900/50 px-3 py-1.5 rounded"
                                >
                                  <Phone className="w-3 h-3 text-emerald-400" />
                                  <a
                                    href={`tel:${phone}`}
                                    className="text-sm text-emerald-400 hover:text-emerald-300"
                                  >
                                    {phone}
                                  </a>
                                  <button
                                    onClick={() => copyPhoneNumber(phone, heir.id)}
                                    className="p-1 hover:bg-slate-700 rounded"
                                  >
                                    {copiedId === `${heir.id}-phone` ? (
                                      <CheckCircle className="w-3 h-3 text-emerald-400" />
                                    ) : (
                                      <Copy className="w-3 h-3 text-slate-500 hover:text-white" />
                                    )}
                                  </button>
                                </div>
                              ))}
                            </div>
                          )}

                          {/* Emails */}
                          {heir.emails.length > 0 && (
                            <div className="flex flex-wrap gap-2">
                              {heir.emails.map((email, emailIdx) => (
                                <a
                                  key={emailIdx}
                                  href={`mailto:${email}`}
                                  className="flex items-center gap-2 bg-slate-900/50 px-3 py-1.5 rounded text-sm text-blue-400 hover:text-blue-300"
                                >
                                  <Mail className="w-3 h-3" />
                                  {email}
                                </a>
                              ))}
                            </div>
                          )}
                        </div>

                        {/* Professional Info */}
                        {(heir.job_title || heir.company) && (
                          <div className="flex items-center gap-2 text-sm text-slate-500 mb-3">
                            <Building className="w-3 h-3" />
                            {[heir.job_title, heir.company].filter(Boolean).join(' at ')}
                          </div>
                        )}

                        {/* Actions */}
                        <div className="flex items-center gap-2 pt-3 border-t border-slate-700">
                          {heir.linkedin_url && (
                            <a
                              href={heir.linkedin_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300"
                            >
                              <Linkedin className="w-3 h-3" />
                              LinkedIn
                              <ExternalLink className="w-2 h-2" />
                            </a>
                          )}
                          
                          <div className="flex-1" />
                          
                          <Button
                            onClick={() => handleGenerateAgreement(heir)}
                            disabled={isGeneratingPDF && selectedHeir?.id === heir.id}
                            size="sm"
                            className="bg-emerald-600 hover:bg-emerald-500 text-white text-[10px] font-bold"
                          >
                            {isGeneratingPDF && selectedHeir?.id === heir.id ? (
                              <Loader2 className="w-3 h-3 animate-spin" />
                            ) : (
                              <>
                                <Download className="w-3 h-3 mr-1" />
                                Generate Agreement
                              </>
                            )}
                          </Button>
                        </div>

                        {/* Data Source */}
                        <div className="text-[9px] text-slate-600 mt-2">
                          Source: {heir.data_source}
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Initial State */}
          {!searchResult && !isSearching && (
            <div className="p-8 text-center bg-slate-800/20 rounded border border-dashed border-slate-700">
              <Search className="w-12 h-12 text-slate-700 mx-auto mb-4" />
              <p className="text-slate-500 text-sm">
                Click &ldquo;Search for Potential Heirs&rdquo; to begin
              </p>
              <p className="text-slate-600 text-xs mt-1">
                Uses People Data Labs to find relatives
              </p>
            </div>
          )}

          {/* Legal Compliance */}
          <div className="p-4 bg-slate-900/50 border border-slate-800 rounded">
            <div className="flex items-center gap-2 mb-2">
              <Shield className="w-4 h-4 text-emerald-500" />
              <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">
                Compliance
              </span>
            </div>
            <div className="space-y-1 text-[10px] text-slate-500">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-3 h-3 text-emerald-500" />
                CCP 1582 Compliant Agreement
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-3 h-3 text-emerald-500" />
                10% Fee Cap Enforced
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-3 h-3 text-emerald-500" />
                Required Disclosures Included
              </div>
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
