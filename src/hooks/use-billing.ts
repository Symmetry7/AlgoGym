"use client";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { jsonRequest } from "./use-account";

export type BillingStatus = {
  tier: "free" | "pro" | "premium";
  credits: { available:number; allowance:number; used:number } | null;
  coins:number;
  checkoutReady:boolean;
  subscription: {status:string;currentEnd:string|null}|null;
};

export function useBilling() {
  const {user}=useAuth();
  return useQuery({queryKey:["billing",user?.id],queryFn:()=>jsonRequest<BillingStatus>("/api/billing"),enabled:Boolean(user),staleTime:30_000,retry:1});
}
