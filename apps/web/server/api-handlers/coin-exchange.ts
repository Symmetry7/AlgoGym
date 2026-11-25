import { z } from "zod";
import { adminSupabase } from "../admin";
import { creditsEnabled } from "../ai-credits";
import { originFromRequest, serverSupabase, type ApiRequest, type ApiResponse } from "../supabase";

const input = z.object({ coins: z.union([z.literal(1000), z.literal(10000)]), operationKey: z.string().uuid() });

export default async function handler(req: ApiRequest, res: ApiResponse) {
  res.setHeader("Cache-Control", "private, no-store");
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed." });
  if (req.headers.origin && req.headers.origin !== originFromRequest(req))
    return res.status(403).json({ error: "This request could not be verified." });
  const { client, flushCookies } = serverSupabase(req, res);
  try {
    const { data: { user }, error: authError } = await client.auth.getUser();
    if (authError || !user) return res.status(401).json({ error: "Sign in to exchange Coins." });
    if (!creditsEnabled()) return res.status(503).json({ error: "AI credits are being configured." });
    const parsed = input.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: "Choose a valid Coin exchange." });
    const { data, error } = await adminSupabase().rpc("exchange_coins_for_ai_credits", {
      p_user: user.id,
      p_operation_key: parsed.data.operationKey,
      p_coins: parsed.data.coins,
    });
    if (error) {
      if (error.message.includes("Not enough Coins")) return res.status(409).json({ error: "You need more Coins for this exchange." });
      throw error;
    }
    return res.status(200).json(data);
  } catch (error) {
    console.error("Coin exchange failed", error);
    return res.status(503).json({ error: "Coin exchange is temporarily unavailable. Please retry." });
  } finally {
    flushCookies();
  }
}
