"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { ArrowRight, Check, Crown, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { jsonRequest } from "@/hooks/use-account";
import { useAuth } from "@/contexts/AuthContext";
import { useBilling } from "@/hooks/use-billing";

type Tier="pro"|"premium";
type Checkout={subscriptionId:string;keyId:string;price:number};
type RazorpayWindow=Window & {Razorpay?:new (options:Record<string,unknown>)=>{open:()=>void}};
let scriptPromise:Promise<void>|null=null;
function loadRazorpay(){
  if((window as RazorpayWindow).Razorpay)return Promise.resolve();
  if(!scriptPromise) scriptPromise=new Promise((resolve,reject)=>{
    const script=document.createElement("script");script.src="https://checkout.razorpay.com/v1/checkout.js";
    script.onload=()=>resolve();script.onerror=()=>reject(new Error("Payment window could not load."));
    document.head.appendChild(script);
  });
  return scriptPromise;
}

const plans=[
  {tier:"pro" as const,name:"Pro",price:199,credits:50,icon:Sparkles,benefits:["50 new learning paths each month","All Training Gym levels","Saved paths stay available"]},
  {tier:"premium" as const,name:"Premium",price:399,credits:150,icon:Crown,benefits:["150 new learning paths each month","All Training Gym levels","Saved paths stay available"]},
];

export function PlanChoice({compact=false}:{compact?:boolean}){
  const {user}=useAuth();const billing=useBilling();const router=useRouter();const queryClient=useQueryClient();
  const [pending,setPending]=useState<Tier|null>(null);
  const start=async(tier:Tier)=>{
    if(!user){router.push("/sign-in?next=%2Fpricing");return;}
    setPending(tier);
    try{
      await loadRazorpay();
      const checkout=await jsonRequest<Checkout>("/api/billing",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({tier})});
      const Razorpay=(window as RazorpayWindow).Razorpay;
      if(!Razorpay)throw new Error("Payment window could not load.");
      new Razorpay({key:checkout.keyId,subscription_id:checkout.subscriptionId,name:"AlgoGym",description:`${tier==="pro"?"Pro":"Premium"} · monthly renewal`,prefill:{email:user.email},theme:{color:tier==="pro"?"#9270d9":"#c7964d"},handler:async()=>{await queryClient.invalidateQueries({queryKey:["billing"]});await queryClient.invalidateQueries({queryKey:["symm"]});toast.success("Payment received. Your credits will appear after verification.");},modal:{ondismiss:()=>setPending(null)}}).open();
    }catch(error){toast.error(error instanceof Error?error.message:"Could not start checkout.");}
    finally{setPending(null);}
  };
  return <div className={`ag-plan-grid ${compact?"is-compact":""}`}>
    {plans.map(plan=>{
      const Icon=plan.icon;const current=billing.data?.tier===plan.tier;
      return <article key={plan.tier} className={`ag-plan-card ag-plan-${plan.tier}`}>
        <div className="ag-plan-heading"><span className="ag-plan-icon"><Icon size={21}/></span><span>{plan.name}</span>{current&&<span className="ag-plan-current">Your plan</span>}</div>
        <p className="ag-plan-price">₹{plan.price}<span>/ month</span></p>
        <p className="ag-plan-credits"><strong>{plan.credits}</strong> AI credits / month</p>
        <ul>{plan.benefits.map(item=><li key={item}><Check size={15}/>{item}</li>)}</ul>
        <button type="button" disabled={Boolean(pending)||current||!billing.data?.checkoutReady||Boolean(billing.data?.subscription && ["authenticated","active","pending","halted","paused"].includes(billing.data.subscription.status))} onClick={()=>void start(plan.tier)}>{current?"Current plan":!billing.data?.checkoutReady?"Test checkout setup pending":pending===plan.tier?"Opening checkout…":`Choose ${plan.name}`}<ArrowRight size={16}/></button>
      </article>;
    })}
  </div>;
}
