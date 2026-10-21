import type { Metadata } from "next";
import Link from "next/link";
import { Inter_Tight, JetBrains_Mono } from "next/font/google";
import { NavLinks } from "@/components/NavLinks";
import "./globals.css";

const inter = Inter_Tight({ subsets: ["latin"], variable: "--font-inter-tight", display: "swap" });
const mono = JetBrains_Mono({ subsets: ["latin"], variable: "--font-jetbrains", display: "swap" });

export const metadata: Metadata = {
  title: "Claim Check",
  description: "Grounds every claim in an outreach draft against the lead's research card before the morning approval.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${mono.variable}`}>
      <body>
        <header className="topnav">
          <Link href="/story" className="brand">
            <span className="brandMark" aria-hidden />
            Claim Check <small>for AI outreach</small>
          </Link>
          <NavLinks />
        </header>
        {children}
      </body>
    </html>
  );
}
