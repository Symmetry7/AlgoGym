import { NextRequest, NextResponse } from "next/server";
import { adminSupabase } from "../admin";
import { reconcileSubscription, validHmac } from "../billing";

export async function POST(request:NextRequest) {
  const secret=process.env.RAZORPAY_WEBHOOK_SECRET;
  if(!secret) return NextResponse.json({error:"Webhook is not configured."},{status:503});
  const body=await request.text();
  const signature=request.headers.get("x-razorpay-signature")??"";
  if(!validHmac(body,signature,secret)) return NextResponse.json({error:"Invalid signature."},{status:401});
  try {
    const event=JSON.parse(body) as {event?:string;payload?:{subscription?:{entity?:{id?:string}}}};
    const id=event.payload?.subscription?.entity?.id;
    if(!id || !event.event?.startsWith("subscription.")) return NextResponse.json({ok:true});
    await reconcileSubscription(adminSupabase(),id);
    return NextResponse.json({ok:true});
  } catch(error) {
    console.error("Subscription webhook failed",error);
    return NextResponse.json({error:"Could not process subscription."},{status:500});
  }
}
