'use client';

import { useState, useEffect, use } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Shield, Lock, Server, ShieldCheck, TrendingUp, Activity, Scale, Gavel, BarChart3, Globe, Zap, MapPin } from "lucide-react";
import { ContactForm } from "@/components/contact-form";
import { ComplianceShields } from "@/components/compliance-shields";
import { ComplianceBanner } from "@/components/compliance-banner";
import { VerificationModal } from "@/components/verification-modal";
import Link from "next/link";
import { getActiveStateMetadata, SITE_CONFIG, STATE_METADATA } from "@/config/siteConfig";

const STATE_MAP: Record<string, string> = {
  tx: "texas",
  fl: "florida",
  ca: "california",
};

interface PageProps {
  params: Promise<{ state?: string[] }>;
}

export default function Home({ params }: PageProps) {
  const resolvedParams = use(params);
  const stateParam = resolvedParams.state?.[0]?.toLowerCase();
  
  // The client-side logic in getActiveStateMetadata will try to use the cookie
  // then fallback to SITE_CONFIG.primaryState ('TX'), but the middleware
  // now defaults to 'CA' if no geo is detected.
  const normalizedState = stateParam ? (STATE_MAP[stateParam] || stateParam) : undefined;
  const stateMetadata = getActiveStateMetadata(normalizedState);
  const activeStateKey = stateMetadata.name.toLowerCase();
  
  const [terminalStep, setTerminalStep] = useState(0);
  const terminalMessages = [
    "Analyzing data for inconsistencies...",
    "UTBMS Syntax Validated",
    "Purging sensitive data...",
    "Status: Secure"
  ];

  // Mock Dashboard Data
  const [recoveredFees, setRecoveredFees] = useState(1248500);
  const [invoicesAnalyzed, setInvoicesAnalyzed] = useState(842);

  // ROI Calculator State
  const [monthlySpend, setMonthlySpend] = useState(50000);
  const projectedRecoveryMin = monthlySpend * 0.12;

  const [verified, setVerified] = useState(false);
  const [isVerificationModalOpen, setIsVerificationModalOpen] = useState(false);
  const [hasProfessionalVerification, setHasProfessionalVerification] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => {
      setTerminalStep((prev) => (prev + 1) % terminalMessages.length);
    }, 3000);
    
    const dataTimer = setInterval(() => {
      setRecoveredFees(prev => prev + Math.floor(Math.random() * 1000));
      setInvoicesAnalyzed(prev => prev + (Math.random() > 0.8 ? 1 : 0));
    }, 5000);

    return () => {
      clearInterval(timer);
      clearInterval(dataTimer);
    };
  }, []);

  return (
    <div className="min-h-screen bg-[#020617] text-slate-50 selection:bg-blue-600 selection:text-white font-sans antialiased relative">
      {/* SaaS Notice Banner */}
      <div className="bg-blue-600/10 border-b border-blue-500/20 py-2 text-center relative z-[200]">
        <p className="text-[10px] font-bold uppercase tracking-widest text-blue-400">
          LawAuditor is a technology platform. We are not a law firm and do not provide legal advice.
        </p>
      </div>

      {/* Visual Texture Overlay */}
      <div className="fixed inset-0 pointer-events-none z-0 opacity-[0.03] mix-blend-overlay bg-[url('https://grainy-gradients.vercel.app/noise.svg')]" />

      {/* Navbar: Sticky with glassmorphism */}
      <nav className="fixed top-8 w-full z-[150] border-b border-slate-800/50 bg-[#020617]/70 backdrop-blur-xl">
        <div className="container mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-600 rounded flex items-center justify-center font-bold text-white border border-blue-400/20">L</div>
            <span className="text-lg font-bold tracking-tighter text-white">LAWAUDITOR</span>
          </div>
          <div className="hidden md:flex items-center gap-8 text-[11px] font-bold uppercase tracking-widest text-slate-500">
            <a href="#dashboard" className="hover:text-white transition-colors" aria-label="Go to Dashboard section">Intelligence</a>
            <a href="#security" className="hover:text-white transition-colors" aria-label="Go to Security Architecture section">SaaS Architecture</a>
            <a href="#calculator" className="hover:text-white transition-colors" aria-label="Go to ROI Calculator section">Recovery Projection</a>
            <a href="#faq" className="hover:text-white transition-colors" aria-label="Go to FAQ section">FAQ</a>
          </div>
          <div className="flex items-center gap-4">
            <a href="#demo">
              <Button className="bg-blue-600 hover:bg-blue-700 text-white px-5 h-9 text-xs font-bold uppercase tracking-widest rounded-none border border-blue-400/20 shadow-none" aria-label="Request Demo">
                Request Analysis
              </Button>
            </a>
          </div>
        </div>
      </nav>

      <main className="relative z-10">
        {/* Hero Section */}
        <section className="relative pt-48 pb-24 overflow-hidden">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[600px] bg-blue-600/5 blur-[120px] rounded-full pointer-events-none" />
          
          <div className="container mx-auto px-6 relative">
            <div className="max-w-4xl mx-auto text-center">
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="inline-flex items-center gap-2 px-3 py-1 rounded-none border border-blue-500/20 bg-blue-500/5 text-blue-400 text-[10px] font-bold uppercase tracking-[0.2em] mb-8"
              >
                <ShieldCheck className="w-3 h-3" />
                Enterprise Data Processing
              </motion.div>
              <motion.h1 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="text-5xl md:text-7xl font-black tracking-tighter mb-8 leading-[0.9] text-white"
              >
                Recover Lost <br className="hidden md:block" /> Legal Spend.
              </motion.h1>
              <motion.p 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="text-lg md:text-xl text-slate-400 mb-10 max-w-2xl mx-auto leading-relaxed font-medium"
              >
                {stateMetadata.regionalTies} <br/>
                We isolate fee inconsistencies with absolute technical security.
              </motion.p>
              
              {/* State Indicator */}
              <div className="flex justify-center gap-4 mb-12">
                <div className="border border-blue-600 bg-blue-600/10 text-blue-400 text-[10px] font-black uppercase tracking-widest px-6 py-2">
                  Software Active in: {stateMetadata.name}
                </div>
              </div>

              {/* AB 316 Verification Step */}
              <div className="max-w-md mx-auto mb-12 p-4 border border-slate-800 bg-slate-900/20 text-left">
                <label className="flex items-start gap-3 cursor-pointer group">
                  <input 
                    type="checkbox" 
                    checked={verified} 
                    onChange={(e) => setVerified(e.target.checked)}
                    className="mt-1 w-4 h-4 rounded-none border-slate-700 bg-slate-950 text-blue-600 focus:ring-offset-0 focus:ring-blue-600"
                  />
                  <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500 group-hover:text-slate-300 transition-colors">
                    I understand this is an automated analysis and I will perform a human review of all findings before taking action.
                  </span>
                </label>
              </div>

              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="flex flex-col sm:flex-row items-center justify-center gap-4"
              >
                <div className="relative group">
                  <div className="absolute -inset-1 bg-blue-600 rounded-none blur-xl opacity-20 group-hover:opacity-40 transition duration-1000 group-hover:duration-200"></div>
                  <Button 
                    size="lg" 
                    onClick={() => {
                      if (!verified) return;
                      if (!hasProfessionalVerification) {
                        setIsVerificationModalOpen(true);
                      } else {
                        const demoSection = document.getElementById('demo');
                        demoSection?.scrollIntoView({ behavior: 'smooth' });
                      }
                    }}
                    className="relative bg-blue-600 hover:bg-blue-700 text-white px-8 h-12 text-sm font-bold uppercase tracking-widest rounded-none border border-blue-400/20 disabled:opacity-30 disabled:cursor-not-allowed" 
                    aria-label="Secure Analysis Request"
                  >
                    Secure Data Analysis
                  </Button>
                </div>
                <Button size="lg" variant="outline" className="border-slate-800 bg-transparent hover:bg-slate-900 text-slate-300 px-8 h-12 text-sm font-bold uppercase tracking-widest rounded-none" aria-label="Software Technicals">
                  Software Technicals
                </Button>
              </motion.div>
            </div>
          </div>
        </section>

            {/* Compliance Shields Injection */}
            <section className="pb-32">
              <div className="container mx-auto px-6">
                <div className="max-w-5xl mx-auto">
                  <ComplianceBanner />
                  <ComplianceShields state={activeStateKey as any} />
                </div>
              </div>
            </section>

            {/* Dashboard Preview Section */}
            <section id="dashboard" className="pb-32">
              <div className="container mx-auto px-6">
                <div className="max-w-5xl mx-auto">
                  <div className="p-1 bg-gradient-to-br from-slate-700/50 via-slate-800/20 to-slate-900/50 rounded-xl">
                    <div className="bg-[#020617] border border-slate-800 rounded-lg overflow-hidden relative group">
                      <div className="absolute inset-0 bg-blue-500/[0.02] pointer-events-none" />
                      
                      {!hasProfessionalVerification && (
                        <div className="absolute inset-0 z-50 flex items-center justify-center bg-[#020617]/80 backdrop-blur-sm">
                          <div className="text-center p-8">
                            <Lock className="w-12 h-12 text-blue-500 mx-auto mb-4" />
                            <h3 className="text-xl font-black uppercase tracking-widest text-white mb-2">Analysis Results Locked</h3>
                            <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-6 max-w-xs mx-auto">
                              Professional user verification required to view data-processing outputs.
                            </p>
                            <Button 
                              onClick={() => setIsVerificationModalOpen(true)}
                              className="bg-blue-600 hover:bg-blue-700 text-white font-black uppercase tracking-widest rounded-none px-8"
                            >
                              Verify Professional Status
                            </Button>
                          </div>
                        </div>
                      )}

                      {/* Dashboard Header */}
                  <div className="border-b border-slate-800 px-6 py-4 flex items-center justify-between bg-slate-900/20">
                    <div className="flex items-center gap-4">
                      <div className="flex gap-1.5">
                        <div className="w-2.5 h-2.5 rounded-full bg-slate-800" />
                        <div className="w-2.5 h-2.5 rounded-full bg-slate-800" />
                        <div className="w-2.5 h-2.5 rounded-full bg-slate-800" />
                      </div>
                      <div className="h-4 w-px bg-slate-800" />
                          <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500 flex items-center gap-2">
                            <Activity className="w-3 h-3 text-blue-500" />
                            Data Inconsistency Feed: {stateMetadata.name}
                          </span>
                        </div>
                        <div className="text-[10px] font-mono text-slate-600">v4.0.2 // STABLE</div>
                      </div>

                      {/* Dashboard Content */}
                      <div className="grid md:grid-cols-3 gap-px bg-slate-800">
                        <div className="bg-[#020617] p-8">
                          <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-4">Invoices Analyzed</div>
                          <div className="text-4xl font-mono font-medium text-white tabular-nums">
                            {invoicesAnalyzed.toLocaleString()}
                          </div>
                          <div className="mt-4 flex items-center gap-2 text-green-500 text-[10px] font-bold">
                            <TrendingUp className="w-3 h-3" />
                            +12.4% THIS MONTH
                          </div>
                        </div>
                        <div className="bg-[#020617] p-8">
                          <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-4">Projected Fee Recovery</div>
                          <div className="text-4xl font-mono font-medium text-blue-500 tabular-nums">
                            ${recoveredFees.toLocaleString()}
                          </div>
                          <div className="mt-4 flex items-center gap-2 text-slate-500 text-[10px] font-bold uppercase tracking-widest">
                            Software Analysis Data
                          </div>
                        </div>
                        <div className="bg-[#020617] p-8">
                          <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-4">Market Parity Index</div>
                          <div className="text-4xl font-mono font-medium text-white tabular-nums">
                            98.2<span className="text-slate-600">%</span>
                          </div>
                          <div className="mt-4 flex items-center gap-2 text-blue-400 text-[10px] font-bold">
                            {stateMetadata.complianceRefs.join(' • ')}
                          </div>
                        </div>
                      </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Security Architecture Section */}
        <section id="security" className="py-32 bg-slate-950 border-y border-slate-800 relative overflow-hidden">
          <div className="container mx-auto px-6 relative">
            <div className="max-w-4xl mx-auto text-center mb-20">
              <h2 className="text-3xl md:text-5xl font-black mb-6 tracking-tight uppercase">Security Architecture.</h2>
              <p className="text-slate-400 text-lg font-medium">
                We reclaim capital without ever compromising your data's sovereignty.
              </p>
            </div>

            <div className="grid lg:grid-cols-2 gap-16 items-center max-w-6xl mx-auto">
              <div className="space-y-6">
                <div className="p-8 border border-slate-800 bg-slate-900/20 relative group">
                  <div className="flex gap-6">
                    <div className="w-12 h-12 border border-blue-500/20 bg-blue-500/5 flex items-center justify-center flex-shrink-0">
                      <Shield className="w-6 h-6 text-blue-500" />
                    </div>
                    <div>
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-bold uppercase tracking-tight">Zero-Retention Policy</h3>
                        <div className="flex gap-1">
                          {stateMetadata.complianceRefs.map(c => (
                            <span key={c} className="px-1.5 py-0.5 border border-green-500/30 bg-green-500/10 text-green-500 text-[8px] font-black tracking-widest uppercase">{c}</span>
                          ))}
                        </div>
                      </div>
                      <p className="text-slate-400 text-sm leading-relaxed font-medium">
                        Sensitive legal data is processed exclusively in volatile RAM. 
                        We store zero bytes of document content on permanent disk. 
                        Full compliance for {stateMetadata.name} firms.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="p-8 border border-slate-800 bg-slate-900/20">
                  <div className="flex gap-6">
                    <div className="w-12 h-12 border border-blue-500/20 bg-blue-500/5 flex items-center justify-center flex-shrink-0">
                      <Server className="w-6 h-6 text-blue-500" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold mb-2 uppercase tracking-tight">Cloudflare + Vercel Stack</h3>
                      <p className="text-slate-400 text-sm leading-relaxed font-medium">
                        Isolated serverless execution through Vercel, protected by Cloudflare's 
                        global edge WAF. Our architecture is built to withstand enterprise-scale risk.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="relative">
                <div className="border border-slate-800 bg-[#020617] p-6 shadow-none overflow-hidden group min-h-[380px]">
                  <div className="flex items-center justify-between mb-8 pb-4 border-b border-slate-800">
                    <div className="flex gap-1.5">
                      <div className="w-2 h-2 bg-slate-800" />
                      <div className="w-2 h-2 bg-slate-800" />
                    </div>
                    <div className="text-[9px] font-mono text-slate-500 uppercase tracking-widest">Secure_Data_Tunnel_v4</div>
                  </div>
                  <div className="space-y-3 font-mono text-[11px] min-h-[160px]">
                    <div className="text-blue-500 flex gap-2 opacity-50"><span>&gt;</span> <span>Initializing secure analysis...</span></div>
                    <AnimatePresence mode="wait">
                      <motion.div
                        key={terminalStep}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className={`${terminalStep === 3 ? 'text-green-500 font-bold' : 'text-slate-300'} flex gap-2`}
                      >
                        <span>&gt;</span> <span>{terminalMessages[terminalStep]}</span>
                      </motion.div>
                    </AnimatePresence>
                    {terminalStep === 3 && (
                      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-green-500 font-bold flex gap-2">
                        <span>&gt;</span> <span>ANALYSIS COMPLETE: 0 BYTES RETAINED</span>
                      </motion.div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ROI Calculator Section */}
        <section id="calculator" className="py-32 bg-[#020617]">
          <div className="container mx-auto px-6">
            <div className="max-w-4xl mx-auto text-center mb-16">
              <h2 className="text-3xl font-black mb-6 uppercase tracking-widest">Savings Calculator.</h2>
              <p className="text-slate-500 font-medium">Project your annual recovery based on enterprise benchmarks.</p>
            </div>
            
            <Card className="max-w-2xl mx-auto bg-slate-900/10 border-slate-800 rounded-none p-8 md:p-12 relative overflow-hidden">
              <div className="absolute top-0 left-0 w-1 h-full bg-blue-600" />
              <div className="space-y-12">
                <div className="space-y-4">
                  <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">
                    <span>Monthly Legal Spend</span>
                    <span className="text-white font-mono">${monthlySpend.toLocaleString()}</span>
                  </div>
                  <input 
                    type="range" 
                    min="10000" 
                    max="1000000" 
                    step="5000"
                    value={monthlySpend}
                    onChange={(e) => setMonthlySpend(parseInt(e.target.value))}
                    className="w-full h-1.5 bg-slate-800 rounded-none appearance-none cursor-pointer accent-blue-600"
                    aria-label="Monthly Legal Spend Slider"
                  />
                  <div className="flex justify-between text-[8px] font-mono text-slate-600 uppercase tracking-widest">
                    <span>$10k</span>
                    <span>$500k</span>
                    <span>$1M+</span>
                  </div>
                </div>

                <div className="grid sm:grid-cols-2 gap-8 border-t border-slate-800 pt-12">
                  <div>
                    <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">Est. Monthly Recovery</div>
                    <div className="text-3xl font-mono font-medium text-blue-500">
                      ${Math.floor(projectedRecoveryMin).toLocaleString()}
                    </div>
                  </div>
                  <div>
                    <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">Est. Annual Recovery</div>
                    <div className="text-3xl font-mono font-medium text-white">
                      ${Math.floor(projectedRecoveryMin * 12).toLocaleString()}
                    </div>
                  </div>
                </div>
                
                <div className="text-[9px] text-slate-600 font-medium italic">
                  * Based on average legal spend recovery of 12-18% for enterprise firms.
                </div>
              </div>
            </Card>
          </div>
        </section>

        {/* Regional Compliance Trust Bar */}
        <section className="py-24 border-y border-slate-800 bg-slate-950/50 overflow-hidden">
          <div className="container mx-auto px-6">
            <h2 className="text-center text-[10px] font-black uppercase tracking-[0.4em] text-slate-600 mb-12">Regulatory Compliance Standards</h2>
            <div className="flex flex-wrap justify-center gap-12 md:gap-24 items-center grayscale opacity-40 hover:grayscale-0 hover:opacity-100 transition duration-500">
              {stateMetadata.complianceRefs.map((ref) => (
                <div key={ref} className="flex flex-col items-center gap-3">
                  <ShieldCheck className="w-8 h-8 text-blue-500" />
                  <span className="text-[9px] font-black tracking-widest uppercase text-white text-center">{ref}</span>
                </div>
              ))}
              <div className="flex flex-col items-center gap-3">
                <Activity className="w-8 h-8 text-blue-500" />
                <span className="text-[9px] font-black tracking-widest uppercase text-white text-center">UTBMS Verified</span>
              </div>
            </div>
          </div>
        </section>

        {/* Lead Capture Section */}
        <section id="demo" className="py-32 relative">
          <div className="container mx-auto px-6 relative">
            <div className="max-w-4xl mx-auto border border-blue-500/30 bg-blue-600/5 p-12 md:p-20 text-center relative overflow-hidden">
              <h2 className="text-4xl md:text-6xl font-black mb-8 text-white tracking-tighter uppercase leading-[0.9]">Secure Your <br/>Analysis.</h2>
              <p className="text-slate-400 text-lg mb-12 max-w-2xl mx-auto font-medium">
                Optimized for the {stateMetadata.name} legal market. Process data inconsistencies within 14 business days.
              </p>
              <ContactForm />
            </div>
          </div>
        </section>

        {/* FAQ Section */}
        <section id="faq" className="py-32 border-t border-slate-800">
          <div className="container mx-auto px-6 max-w-3xl">
            <h2 className="text-2xl font-black mb-16 text-center tracking-widest uppercase">Software Technicals FAQ</h2>
            <Accordion type="single" collapsible className="w-full">
              <AccordionItem value="item-1" className="border-slate-800">
                <AccordionTrigger className="text-xs font-bold uppercase tracking-widest hover:text-blue-500 no-underline py-6 text-left">Regulatory Data Processing</AccordionTrigger>
                <AccordionContent className="text-slate-400 text-sm leading-relaxed font-medium pb-6">
                  LawAuditor is a technology platform designed to automate data processing. We are natively built for UTBMS, CCPA, CPRA, and {stateMetadata.rule} standards. Our software assists in identifying billing inconsistencies but does not provide legal conclusions or advice.
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="item-2" className="border-slate-800">
                <AccordionTrigger className="text-xs font-bold uppercase tracking-widest hover:text-blue-500 no-underline py-6 text-left">Data Analysis Timeline</AccordionTrigger>
                <AccordionContent className="text-slate-400 text-sm leading-relaxed font-medium pb-6">
                  Initial spend data analysis is completed within 72 hours using proprietary software optimized for {stateMetadata.name} regulatory standards. Reports are delivered via secure tunnel for human review.
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </div>
        </section>
      </main>

      {/* Market Connectivity Bar */}
      <div className="bg-[#020617] border-y border-slate-800 py-4 relative z-10">
        <div className="container mx-auto px-6 flex flex-wrap justify-center items-center gap-x-12 gap-y-4 text-[9px] font-black tracking-[0.3em] uppercase text-slate-500">
          {(Object.keys(STATE_MAP) as Array<keyof typeof STATE_MAP>).map((key) => {
            const configKey = STATE_MAP[key];
            const config = STATE_METADATA[configKey];
            return (
              <div key={key} className="flex items-center gap-2.5">
                <div className="relative flex h-1.5 w-1.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-green-500"></span>
                </div>
                {config.name.toUpperCase()} DATA HUB: ACTIVE
              </div>
            );
          })}
          <div className="text-slate-800 hidden lg:block">//</div>
          <div className="flex items-center gap-2.5 text-blue-500">
            SOFTWARE_STATUS: NOMINAL
          </div>
        </div>
      </div>

      <footer className="py-16 bg-[#020617] border-t border-slate-800 relative z-10">
        <div className="container mx-auto px-6">
          <div className="grid md:grid-cols-2 gap-12 items-start mb-16">
            <div>
              <div className="flex items-center gap-2 mb-6">
                <div className="w-6 h-6 bg-blue-600 rounded flex items-center justify-center font-bold text-[10px] text-white">L</div>
                <span className="font-bold tracking-tighter text-base text-white">LAWAUDITOR</span>
              </div>
              <div className="space-y-4">
                <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest leading-loose max-w-sm">
                  Entity: {SITE_CONFIG.entityName} <br/>
                  Address: {SITE_CONFIG.address}
                </p>
                <p className="text-slate-600 text-[10px] font-bold uppercase tracking-widest leading-loose max-w-sm">
                  {SITE_CONFIG.companyName} is a SaaS provider, not a law firm. We do not provide legal advice, legal representation, or lawyer referral services. Use of this software does not create an attorney-client relationship.
                </p>
              </div>
              <div className="flex gap-8 mt-8 text-slate-500 text-[10px] font-black uppercase tracking-widest items-center">
                <Link href="/terms" className="hover:text-blue-500 transition-colors" aria-label="Terms of Service">Terms of Service</Link>
                <Link href="/terms" className="hover:text-blue-500 transition-colors" aria-label="Privacy Policy">Privacy Policy</Link>
                <a href="#demo" className="hover:text-white transition-colors" aria-label="Contact Us">Contact</a>
                <div className="h-3 w-px bg-slate-800 mx-2" />
                <button 
                  onClick={() => {
                    const states: ('TX' | 'CA' | 'FL')[] = ['TX', 'CA', 'FL'];
                    const currentState = document.cookie.split('; ').find(row => row.startsWith('user-state='))?.split('=')[1];
                    const nextState = states[(states.indexOf((currentState as any) || 'CA') + 1) % states.length];
                    document.cookie = `user-state=${nextState}; path=/; max-age=${60 * 60 * 24 * 30}`;
                    window.location.reload();
                  }}
                  className="text-slate-700 hover:text-blue-500 transition-colors"
                >
                  Force State Swap
                </button>
              </div>
            </div>
            
            <div className="md:text-right space-y-4">
              <div className="flex items-center md:justify-end gap-2 text-slate-500">
                <MapPin className="w-3 h-3 text-blue-500" />
                <span className="text-[10px] font-bold uppercase tracking-widest">
                  LawAuditor | {stateMetadata.name} Hub | {stateMetadata.address}
                </span>
              </div>
              <p className="text-slate-600 text-[10px] font-bold uppercase tracking-widest">
                © 2026 LawAuditor SaaS
              </p>
            </div>
          </div>
        </div>
      </footer>

      <VerificationModal 
        isOpen={isVerificationModalOpen} 
        onClose={() => setIsVerificationModalOpen(false)}
        onVerify={() => setHasProfessionalVerification(true)}
        stateCode={activeStateKey}
      />
    </div>
  );
}
