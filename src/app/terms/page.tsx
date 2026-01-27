'use client';

import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Shield, ChevronLeft } from "lucide-react";
import Link from "next/link";

export default function TermsOfService() {
  return (
    <div className="min-h-screen bg-[#020617] text-slate-50 selection:bg-blue-600 selection:text-white font-sans antialiased relative">
      {/* Visual Texture Overlay */}
      <div className="fixed inset-0 pointer-events-none z-0 opacity-[0.03] mix-blend-overlay bg-[url('https://grainy-gradients.vercel.app/noise.svg')]" />

      <nav className="fixed top-0 w-full z-[150] border-b border-slate-800/50 bg-[#020617]/70 backdrop-blur-xl">
        <div className="container mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 group">
            <ChevronLeft className="w-4 h-4 text-slate-500 group-hover:text-blue-500 transition-colors" />
            <div className="w-8 h-8 bg-blue-600 rounded flex items-center justify-center font-bold text-white border border-blue-400/20">L</div>
            <span className="text-lg font-bold tracking-tighter text-white">LAWAUDITOR</span>
          </Link>
        </div>
      </nav>

      <main className="relative z-10 pt-32 pb-24">
        <div className="container mx-auto px-6 max-w-4xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-12"
          >
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-none border border-blue-500/20 bg-blue-500/5 text-blue-400 text-[10px] font-bold uppercase tracking-[0.2em] mb-8">
              <Shield className="w-3 h-3" />
              Legal Framework 2026
            </div>
            <h1 className="text-4xl md:text-6xl font-black tracking-tighter mb-8 text-white uppercase">Terms of <br/>Service.</h1>
          </motion.div>

          <div className="space-y-12 border-t border-slate-800 pt-12">
            <section className="space-y-4">
              <h2 className="text-xs font-black uppercase tracking-[0.3em] text-blue-500">1. SaaS Platform Disclosure</h2>
              <p className="text-slate-400 text-sm leading-relaxed font-medium">
                LawAuditor is a Software-as-a-Service (SaaS) platform providing data-processing tools for legal bill analysis. 
                We are a technology provider, not a law firm. We do not provide legal advice, legal representation, or 
                attorney-client relationships.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-xs font-black uppercase tracking-[0.3em] text-blue-500">2. No Attorney-Client Relationship</h2>
              <p className="text-slate-400 text-sm leading-relaxed font-medium">
                By using LawAuditor, you acknowledge that no attorney-client relationship is formed between you and 
                the platform or its owners. All interactions are strictly for the purpose of utilizing automated data analysis software.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-xs font-black uppercase tracking-[0.3em] text-blue-500">3. Human-in-the-Loop Requirement</h2>
              <p className="text-slate-400 text-sm leading-relaxed font-medium">
                All software outputs are for informational purposes only. LawAuditor is a Decision Support Tool, 
                not a Decision Maker. In accordance with CA AB 316 and professional responsibility standards, 
                all findings must be verified by a licensed attorney before any action is taken based on the analysis.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-xs font-black uppercase tracking-[0.3em] text-blue-500">4. Zero-Retention Data Policy</h2>
              <p className="text-slate-400 text-sm leading-relaxed font-medium">
                Our architecture is designed for ephemeral processing. We do not persist PII or sensitive document 
                content to permanent storage, in compliance with CCPA 2026 and enterprise security standards.
              </p>
            </section>

            <section className="space-y-4 border-t border-slate-800 pt-12">
              <p className="text-slate-600 text-[10px] font-bold uppercase tracking-widest leading-loose">
                Last Updated: January 2026. LawAuditor is a registered technology provider. 
                Business Address: 123 California St, San Francisco, CA 94104.
              </p>
            </section>
          </div>
        </div>
      </main>

      <footer className="py-16 bg-[#020617] border-t border-slate-800 relative z-10">
        <div className="container mx-auto px-6 text-center">
          <p className="text-slate-600 text-[10px] font-bold uppercase tracking-widest">
            © 2026 LawAuditor SaaS. Not a Lawyer Referral Service.
          </p>
        </div>
      </footer>
    </div>
  );
}

