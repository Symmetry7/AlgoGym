"use client";

import { useState, type ReactNode } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider } from "next-themes";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/sonner";
import { AuthProvider } from "@/contexts/AuthContext";
import { AuthGate } from "@/components/auth/AuthGate";

export function AppProviders({ children }: { children: ReactNode }) {
  const [queryClient] = useState(() => new QueryClient());
  return <QueryClientProvider client={queryClient}><ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange><AuthProvider><TooltipProvider><AuthGate>{children}</AuthGate><Toaster /></TooltipProvider></AuthProvider></ThemeProvider></QueryClientProvider>;
}
