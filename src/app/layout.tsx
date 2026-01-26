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
  title: "LawAuditor | Enterprise Legal Auditing for Houston, Tampa, & LA",
  description: "Secure, zero-retention AI auditing to recover lost legal spend and ensure UTBMS compliance. Optimized for the California, Texas, and Florida legal markets.",
  keywords: ["legal auditing", "UTBMS compliance", "legal spend recovery", "Houston legal tech", "Tampa legal tech", "Los Angeles legal tech", "zero-retention auditing"],
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
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased selection:bg-blue-600 selection:text-white`}
      >
        {children}
      </body>
    </html>
  );
}
