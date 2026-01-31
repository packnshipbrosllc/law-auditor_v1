'use client';

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Activity } from "lucide-react";
import { getStateName } from "@/lib/utils";
import Image from "next/image";
import { UserButton, SignedIn, SignedOut, SignInButton } from "@clerk/nextjs";

export function Header() {
  const [activeStateCode, setActiveStateCode] = useState<string>('CA');
  const [isDetecting, setIsDetecting] = useState(true);

  useEffect(() => {
    // Check cookie first
    const checkCookie = () => {
      const cookieValue = document.cookie
        .split('; ')
        .find((row) => row.startsWith('user-state='))
        ?.split('=')[1];
      if (cookieValue && ['CA', 'TX', 'FL'].includes(cookieValue.toUpperCase())) {
        setActiveStateCode(cookieValue.toUpperCase());
        setIsDetecting(false);
        return true;
      }
      return false;
    };

    // IP-based geolocation fallback (no popup required)
    const applyLocalCompliance = async () => {
      // Skip if already detected from cookie
      if (checkCookie()) return;

      try {
        const response = await fetch('https://ipapi.co/json/', { 
          signal: AbortSignal.timeout(3000) // 3s timeout
        });
        const data = await response.json();
        const state = data.region_code;

        if (['TX', 'FL', 'CA'].includes(state)) {
          setActiveStateCode(state);
          // Set cookie for future visits
          document.cookie = `user-state=${state};path=/;max-age=86400`;
          // Dispatch event for other components
          window.dispatchEvent(new CustomEvent('state-detected', { detail: state }));
        }
      } catch (err) {
        // Silent fail - default to CA
      } finally {
        setIsDetecting(false);
      }
    };

    applyLocalCompliance();

    // Continue checking cookie for manual overrides
    const interval = setInterval(checkCookie, 2000);
    return () => clearInterval(interval);
  }, []);

  return (
    <nav className="absolute md:fixed top-0 md:top-8 w-full z-[150] border-b border-slate-800/50 bg-[#020617]/70 backdrop-blur-xl">
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

