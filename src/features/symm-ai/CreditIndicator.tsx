"use client";
import { Sparkles } from "lucide-react";
import { Dialog,DialogContent,DialogHeader,DialogTitle,DialogDescription } from "@/components/ui/dialog";
import { PlanChoice } from "@/components/billing/PlanChoice";
import "@/components/billing/plan-choice.css";
export type AiCredits={available:number;allowance:number;used:number};
export function CreditIndicator({credits,onClick,compact=false}:{credits:AiCredits|null|undefined;onClick:()=>void;compact?:boolean}){
  if(!credits)return null;
  return <button type="button" onClick={onClick} className={`symm-credit-indicator ${compact?'is-compact':''}`} title={`${credits.available} learning path credits remaining`}><Sparkles size={14}/><span>{credits.available} credits</span></button>;
}
export function CreditDialog({open,onOpenChange,credits}:{open:boolean;onOpenChange:(value:boolean)=>void;credits:AiCredits|null|undefined}){
  return <Dialog open={open} onOpenChange={onOpenChange}><DialogContent overlayClassName="backdrop-blur-md bg-black/65" className="max-w-[700px] max-h-[90vh] overflow-y-auto border-[#51445f] bg-[#131117] text-white shadow-2xl"><DialogHeader><DialogTitle className="text-2xl">{credits?.available===0?"Keep learning with Symm AI":"Your AI credits"}</DialogTitle><DialogDescription className="text-[#bfb5c9]">You have {credits?.available??0} credits. Each new learning path uses one. Choose a monthly plan for more.</DialogDescription></DialogHeader><PlanChoice compact/><p className="text-center text-xs text-[#aaa2b3]">Saved paths remain available. Razorpay test payments only.</p></DialogContent></Dialog>;
}
