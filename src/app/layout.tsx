import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { cookies } from "next/headers";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

import { SITE_CONFIG, STATE_METADATA } from "@/config/siteConfig";

export async function generateMetadata(): Promise<Metadata> {
  const cookieStore = await cookies();
  const stateCode = cookieStore.get('user-state')?.value || 'CA';
  
  const stateKey = stateCode.toLowerCase() === 'tx' ? 'texas' : 
                   stateCode.toLowerCase() === 'fl' ? 'florida' : 
                   'california';
                   
  const primaryMetadata = STATE_METADATA[stateKey];

  return {
    title: `${SITE_CONFIG.companyName} | Enterprise Data Analysis for ${primaryMetadata.name}`,
    description: `Secure, zero-retention AI analysis to recover lost legal spend. Optimized for ${primaryMetadata.name} regulatory standards.`,
    keywords: ["legal data analysis", "UTBMS compliance", "legal spend recovery", `${primaryMetadata.name} legal tech`, "zero-retention AI analysis"],
    icons: { 
      icon: [
        { url: '/favicon-32x32.png' },
      ],
      apple: [
        { url: '/favicon-32x32.png' },
      ],
    },
    openGraph: {
      title: `${SITE_CONFIG.companyName} | Precision Data Analysis`,
      description: "Recover lost legal spend with zero data risk.",
      url: "https://lawauditor.com",
      siteName: SITE_CONFIG.companyName,
      type: "website",
    },
  };
}

export const viewport = {
  themeColor: '#1e3a8a',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark scroll-smooth">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased selection:bg-blue-600 selection:text-white`}
      >
        {children}
      </body>
    </html>
  );
}
