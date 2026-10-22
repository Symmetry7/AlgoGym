import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";
import type { SupabaseClient } from "@supabase/supabase-js";

export type PaidTier = "pro" | "premium";
export const plans = {
  pro: { price: 199, credits: 50, planEnv: "RAZORPAY_PLAN_PRO" },
  premium: { price: 399, credits: 150, planEnv: "RAZORPAY_PLAN_PREMIUM" },
} as const;

type RazorSubscription = {
  id: string;
  plan_id: string;
  status: string;
  paid_count: number;
  current_start: number | null;
  current_end: number | null;
};

export function configuredPlan(tier: PaidTier) {
  const planId = process.env[plans[tier].planEnv];
  if (!planId) throw new Error("Subscription plans are not configured yet.");
  return planId;
}

export async function razorpay<T>(path: string, body?: Record<string, unknown>): Promise<T> {
  const key = process.env.RAZORPAY_KEY_ID;
  const secret = process.env.RAZORPAY_KEY_SECRET;
  if (!key?.startsWith("rzp_test_") || !secret) throw new Error("Razorpay test mode is not configured.");
  const response = await fetch(`https://api.razorpay.com/v1/${path}`, {
    method: body ? "POST" : "GET",
    headers: { Authorization: `Basic ${Buffer.from(`${key}:${secret}`).toString("base64")}`, "Content-Type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
    cache: "no-store",
  });
  if (!response.ok) {
    console.error("Razorpay API request failed", path, response.status);
    throw new Error("Subscription service is unavailable. Please retry.");
  }
  return await response.json() as T;
}

export function validHmac(message: string, signature: string, secret: string) {
  if (!/^[a-f0-9]{64}$/i.test(signature)) return false;
  const expected = createHmac("sha256", secret).update(message).digest();
  return timingSafeEqual(expected, Buffer.from(signature, "hex"));
}

const timestamp = (unix: number | null) => unix ? new Date(unix * 1000).toISOString() : null;

export async function reconcileSubscription(admin: SupabaseClient, subscriptionId: string) {
  const { data: stored, error } = await admin.from("billing_subscriptions")
    .select("id,plan_id,paid_count").eq("id", subscriptionId).maybeSingle();
  if (error) throw error;
  if (!stored) throw new Error("Subscription not found.");
  const remote = await razorpay<RazorSubscription>(`subscriptions/${encodeURIComponent(subscriptionId)}`);
  if (remote.id !== stored.id || remote.plan_id !== stored.plan_id || !Number.isInteger(remote.paid_count))
    throw new Error("Subscription details could not be verified.");
  const result = await admin.rpc("apply_billing_cycle", {
    p_subscription: subscriptionId,
    p_paid_count: remote.paid_count,
    p_status: remote.status,
    p_start: timestamp(remote.current_start),
    p_end: timestamp(remote.current_end),
  });
  if (result.error) throw result.error;
  return result.data as { available: number; tier: PaidTier; paid_count: number };
}
