import { z } from "zod";
import { adminSupabase } from "../admin";
import { configuredPlan, plans, razorpay, reconcileSubscription, type PaidTier } from "../billing";
import { creditsEnabled, readAiCredits } from "../ai-credits";
import { originFromRequest, serverSupabase, type ApiRequest, type ApiResponse } from "../supabase";

const input = z.object({ tier: z.enum(["pro", "premium"]) });
type Subscription = { id: string; status: string; tier: PaidTier; paid_count: number; current_end: string | null };

export default async function handler(req: ApiRequest, res: ApiResponse) {
  res.setHeader("Cache-Control", "private, no-store");
  if (req.method !== "GET" && req.method !== "POST") return res.status(405).json({error:"Method not allowed."});
  if (req.method === "POST" && req.headers.origin && req.headers.origin !== originFromRequest(req))
    return res.status(403).json({error:"This request could not be verified."});
  const {client,flushCookies}=serverSupabase(req,res);
  try {
    const {data:{user},error:authError}=await client.auth.getUser();
    if(authError||!user) return res.status(401).json({error:"Sign in to continue."});
    const admin=adminSupabase();
    if(req.method==="POST") {
      if(!creditsEnabled()) return res.status(503).json({error:"Subscription billing is being configured."});
      const parsed=input.safeParse(req.body);
      if(!parsed.success) return res.status(400).json({error:"Choose Pro or Premium."});
      const tier=parsed.data.tier;
      const planId=configuredPlan(tier);
      const existing=await admin.from("billing_subscriptions").select("id,status,tier").eq("user_id",user.id).in("status",["created","authenticated","active","pending","halted","paused"]).order("created_at",{ascending:false}).limit(1);
      if(existing.error) throw existing.error;
      if(existing.data?.length) {
        const current=existing.data[0];
        if(current.status==="created"&&current.tier===tier) return res.status(200).json({subscriptionId:current.id,keyId:process.env.RAZORPAY_KEY_ID,tier,price:plans[tier].price});
        return res.status(409).json({error:"You already have a subscription. Check its status before starting another."});
      }
      const remote=await razorpay<{id:string;plan_id:string;status:string}>("subscriptions",{
        plan_id:planId,total_count:120,quantity:1,customer_notify:1,
        notes:{algogym_user_id:user.id,algogym_tier:tier},
      });
      if(remote.plan_id!==planId || !remote.id) throw new Error("The subscription could not be verified.");
      const inserted=await admin.from("billing_subscriptions").insert({id:remote.id,user_id:user.id,tier,plan_id:planId,status:remote.status});
      if(inserted.error) throw inserted.error;
      return res.status(200).json({subscriptionId:remote.id,keyId:process.env.RAZORPAY_KEY_ID,tier,price:plans[tier].price});
    }
    const subscriptions=await admin.from("billing_subscriptions").select("id,status,tier,paid_count,current_end").eq("user_id",user.id).order("created_at",{ascending:false}).limit(1);
    if(subscriptions.error) throw subscriptions.error;
    let subscription=(subscriptions.data?.[0]??null) as Subscription|null;
    if(subscription && !["cancelled","completed","expired"].includes(subscription.status)) {
      try {
        await reconcileSubscription(admin,subscription.id);
        const refreshed=await admin.from("billing_subscriptions").select("id,status,tier,paid_count,current_end").eq("id",subscription.id).single();
        if(refreshed.error) throw refreshed.error;
        subscription=refreshed.data as Subscription;
      } catch(error) {console.error("Subscription refresh failed",error);}
    }
    const [credits,coins]=await Promise.all([
      readAiCredits(admin,user.id),
      admin.from("chakra_balance_cache").select("balance").eq("user_id",user.id).maybeSingle(),
    ]);
    if(coins.error) throw coins.error;
    const active=subscription?.status==="active" && subscription.paid_count>0 && Boolean(subscription.current_end && Date.parse(subscription.current_end)>Date.now());
    return res.status(200).json({tier:active?subscription!.tier:"free",credits,coins:coins.data?.balance??0,checkoutReady:Boolean(process.env.RAZORPAY_KEY_ID&&process.env.RAZORPAY_KEY_SECRET&&process.env.RAZORPAY_PLAN_PRO&&process.env.RAZORPAY_PLAN_PREMIUM),subscription:subscription?{status:subscription.status,currentEnd:subscription.current_end}:null});
  } catch(error) {
    console.error("Billing request failed",error);
    return res.status(503).json({error:"Billing is temporarily unavailable. Please retry."});
  } finally {flushCookies();}
}
