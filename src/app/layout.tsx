import type { Metadata } from "next";
import "@/index.css";
import { AppProviders } from "@/components/app-providers";

export const viewport = { width: "device-width", initialScale: 1 };

export const metadata: Metadata = {
  title: "AlgoGym — Competitive programming, with direction",
  description: "Discover problems, train with purpose, and understand your competitive programming progress.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en" suppressHydrationWarning><body><AppProviders>{children}</AppProviders></body></html>;
}
