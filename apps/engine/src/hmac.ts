// Request signing between the web app (/api/judge, M11) and the engine (SYSTEM_ARCHITECTURE.md §6, §7).
// signature = hex(HMAC-SHA256(secret, `${timestamp}.${rawBody}`)), sent with the Unix timestamp in seconds.
import { createHmac, timingSafeEqual } from "node:crypto";

export const TIMESTAMP_HEADER = "x-algogym-timestamp";
export const SIGNATURE_HEADER = "x-algogym-signature";
export const WINDOW_SECONDS = 60;

export function sign(secret: string, timestamp: number, rawBody: string): string {
  return createHmac("sha256", secret).update(`${timestamp}.${rawBody}`).digest("hex");
}

export type Verdict = { ok: true } | { ok: false; reason: "missing" | "expired" | "bad-signature" };

/**
 * Accept only a fresh timestamp (±60 s, so a captured request can't be replayed later) and a signature that matches
 * one of the configured secrets (two during rotation). Comparison is constant-time.
 */
export function verify(secrets: string[], timestampHeader: string | undefined, signatureHeader: string | undefined, rawBody: string, nowSeconds: number): Verdict {
  if (!timestampHeader || !signatureHeader || !/^\d{1,12}$/.test(timestampHeader) || !/^[0-9a-f]{64}$/.test(signatureHeader)) return { ok: false, reason: "missing" };
  const timestamp = Number(timestampHeader);
  if (Math.abs(nowSeconds - timestamp) > WINDOW_SECONDS) return { ok: false, reason: "expired" };
  const given = Buffer.from(signatureHeader, "hex");
  const match = secrets.some((secret) => {
    const expected = Buffer.from(sign(secret, timestamp, rawBody), "hex");
    return expected.length === given.length && timingSafeEqual(expected, given);
  });
  return match ? { ok: true } : { ok: false, reason: "bad-signature" };
}
