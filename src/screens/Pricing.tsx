"use client";
import Link from "next/link";
import { ArrowLeft, Coins, Sparkles } from "lucide-react";
import { AlgoGymLogo } from "@/components/brand/AlgoGymLogo";
import { ThemeToggle } from "@/components/layout/ThemeToggle";
import { PlanChoice } from "@/components/billing/PlanChoice";
import { CoinExchange } from "@/components/billing/CoinExchange";
import { useBilling } from "@/hooks/use-billing";
import "@/components/billing/plan-choice.css";
import "./pricing.css";

export default function Pricing(){
  const billing=useBilling();
  return <main className="pricing-page">
    <nav className="pricing-nav" aria-label="Pricing navigation"><Link href="/" aria-label="AlgoGym home"><AlgoGymLogo className="w-32"/></Link><div className="flex items-center gap-4"><ThemeToggle/><Link href="/training/symm" className="pricing-back"><ArrowLeft size={15}/> Back to Symm AI</Link></div></nav>
    <div className="pricing-content">
      <div className="pricing-intro"><span className="pricing-eyebrow"><Sparkles size={18}/> SYMM AI</span><h1>More paths to what you want to learn.</h1><p>Choose a monthly plan. One new learning path uses one AI credit.</p></div>
      <div className="pricing-free-balance"><span><Coins size={19}/> Your account</span><strong>{billing.data?.credits?.available??"—"} credits remaining</strong><small>Every account starts with 3 credits. Saved paths stay available.</small></div>
      <PlanChoice/>
      <CoinExchange/>
      <p className="pricing-disclosure">{billing.data?.checkoutReady?"Razorpay test mode · Monthly automatic renewal · Test payments only. Credits are added after each verified charge.":"Test checkout is being connected. Your 3 free learning path credits are ready."}</p>
    </div>
  </main>;
}
