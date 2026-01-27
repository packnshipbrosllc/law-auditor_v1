'use client';

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Activity } from "lucide-react";
import { getStateName } from "@/lib/utils";
import Image from "next/image";

export function Header() {
  const [activeStateCode, setActiveStateCode] = useState<string>('CA');

  useEffect(() => {
    const checkCookie = () => {
      const cookieValue = document.cookie
        .split('; ')
        .find((row) => row.startsWith('user-state='))
        ?.split('=')[1];
      if (cookieValue && cookieValue.toUpperCase() !== activeStateCode) {
        setActiveStateCode(cookieValue.toUpperCase());
      }
    };

    checkCookie();
    const interval = setInterval(checkCookie, 1000);
    return () => clearInterval(interval);
  }, [activeStateCode]);

  return (
    <nav className="fixed top-8 w-full z-[150] border-b border-slate-800/50 bg-[#020617]/70 backdrop-blur-xl">
      <div className="container mx-auto px-6 h-16 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-3">
            <Image 
              src="/logo.png" 
              alt="LawAuditor Official Logo" 
              height={40}
              width={40}
              className="h-10 w-auto"
              priority
            />
            <span className="text-lg font-bold tracking-tighter text-white">LAWAUDITOR</span>
          </div>
          <div className="h-4 w-px bg-slate-800 hidden md:block" />
          <div className="hidden md:flex items-center gap-2 text-gold text-[10px] font-black uppercase tracking-widest">
            <div className="relative flex h-1.5 w-1.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-gold opacity-75"></span>
              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-gold-light"></span>
            </div>
            Active in {getStateName(activeStateCode)}
          </div>
        </div>
        <div className="hidden md:flex items-center gap-8 text-[11px] font-bold uppercase tracking-widest text-slate-500">
          <a href="#dashboard" className="hover:text-white transition-colors">Intelligence</a>
          <a href="#security" className="hover:text-white transition-colors">Architecture</a>
          <a href="#calculator" className="hover:text-white transition-colors">ROI</a>
          <a href="#faq" className="hover:text-white transition-colors">FAQ</a>
        </div>
        <div className="flex items-center gap-4">
          <a href="#demo">
            <Button className="bg-gold hover:bg-gold-light text-[#020617] px-5 h-9 text-xs font-bold uppercase tracking-widest rounded-none border border-gold-light/20 shadow-none">
              Request Analysis
            </Button>
          </a>
        </div>
      </div>
    </nav>
  );
}

