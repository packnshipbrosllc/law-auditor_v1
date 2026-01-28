'use client';

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Activity } from "lucide-react";
import { getStateName } from "@/lib/utils";
import Image from "next/image";
import { UserButton, SignedIn, SignedOut, SignInButton } from "@clerk/nextjs";

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
            <div className="relative h-10 w-10 rounded-full overflow-hidden border border-white/10 shadow-[0_0_12px_rgba(255,255,255,0.1)]">
              <Image 
                src="/wmremove-transformed.jpeg" 
                alt="LawAuditor Logo" 
                fill
                className="object-cover"
                priority
              />
            </div>
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
          <SignedOut>
            <SignInButton mode="modal">
              <Button variant="outline" className="border-gold/30 text-gold hover:bg-gold/10 px-5 h-9 text-xs font-bold uppercase tracking-widest rounded-none">
                Sign In
              </Button>
            </SignInButton>
          </SignedOut>
          <a href="#demo">
            <Button className="bg-gold hover:bg-gold-light text-[#020617] px-5 h-9 text-xs font-bold uppercase tracking-widest rounded-none border border-gold-light/20 shadow-none">
              Request Analysis
            </Button>
          </a>
          <SignedIn>
            <div className="flex items-center gap-4 ml-2 pl-4 border-l border-slate-800">
              <UserButton 
                appearance={{
                  elements: {
                    userButtonAvatarBox: "h-9 w-9 rounded-none border border-gold/30 shadow-[0_0_10px_rgba(212,175,55,0.1)]",
                    userButtonTrigger: "rounded-none",
                  }
                }}
              />
            </div>
          </SignedIn>
        </div>
      </div>
    </nav>
  );
}

