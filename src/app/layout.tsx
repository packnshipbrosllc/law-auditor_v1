import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

import { SITE_CONFIG, STATE_METADATA } from "@/config/siteConfig";

const primaryMetadata = STATE_METADATA[SITE_CONFIG.primaryState === 'TX' ? 'texas' : SITE_CONFIG.primaryState === 'CA' ? 'california' : 'florida'];

export const metadata: Metadata = {
  title: `${SITE_CONFIG.companyName} | Enterprise Data Analysis for ${primaryMetadata.name}`,
  description: `Secure, zero-retention AI analysis to recover lost legal spend. Optimized for ${primaryMetadata.name} regulatory standards.`,
  keywords: ["legal data analysis", "UTBMS compliance", "legal spend recovery", `${primaryMetadata.name} legal tech`, "zero-retention AI analysis"],
  openGraph: {
    title: `${SITE_CONFIG.companyName} | Precision Data Analysis`,
    description: "Recover lost legal spend with zero data risk.",
    url: "https://lawauditor.com",
    siteName: SITE_CONFIG.companyName,
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark scroll-smooth">
      <head>
        <link rel="icon" href="/icon-gavel.png?v=3" />
        <link rel="apple-touch-icon" href="/icon-gavel.png?v=3" />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased selection:bg-blue-600 selection:text-white`}
      >
        {children}
      </body>
    </html>
  );
}
