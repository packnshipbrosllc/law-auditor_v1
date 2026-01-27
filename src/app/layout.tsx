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

export const metadata: Metadata = {
  title: "LawAuditor | Enterprise Legal Auditing for Texas, Florida, & California",
  description: "Secure, zero-retention AI auditing to recover lost legal spend and ensure UTBMS compliance. Optimized for the statewide legal markets of Texas, Florida, and California.",
  keywords: ["legal auditing", "UTBMS compliance", "legal spend recovery", "Texas legal tech", "Florida legal tech", "California legal tech", "zero-retention auditing"],
  openGraph: {
    title: "LawAuditor | Precision Legal Auditing",
    description: "Recover lost legal spend with zero data risk.",
    url: "https://lawauditor.com",
    siteName: "LawAuditor",
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
