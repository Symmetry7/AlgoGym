import type { Metadata } from "next";
import { Geist, Geist_Mono, Instrument_Serif } from "next/font/google";
import "@/index.css";
import "@/styles/tokens.css";
import { AppProviders } from "@/components/app-providers";

// Only CSS variables are set here; legacy pages keep their own fonts until M2.
const display = Instrument_Serif({ weight: "400", subsets: ["latin"], variable: "--font-instrument-serif", display: "swap" });
const geist = Geist({ subsets: ["latin"], variable: "--font-geist", display: "swap" });
const geistMono = Geist_Mono({ subsets: ["latin"], variable: "--font-geist-mono", display: "swap" });

export const viewport = { width: "device-width", initialScale: 1 };

export const metadata: Metadata = {
  title: "AlgoGym — Competitive programming, with direction",
  description: "Discover problems, train with purpose, and understand your competitive programming progress.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en" suppressHydrationWarning className={`${display.variable} ${geist.variable} ${geistMono.variable}`}><body><AppProviders>{children}</AppProviders></body></html>;
}
