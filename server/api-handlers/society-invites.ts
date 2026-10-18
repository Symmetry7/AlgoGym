import QRCode from "qrcode";
import { z } from "zod";
import {
  originFromRequest,
  serverSupabase,
  type ApiRequest,
  type ApiResponse,
} from "../supabase";

export default async function handler(req: ApiRequest, res: ApiResponse) {
  res.setHeader("Cache-Control", "private, no-store");
  res.setHeader("Referrer-Policy", "no-referrer");
  if (!["GET", "POST"].includes(req.method ?? ""))
    return res.status(405).json({ error: "Method not allowed." });
  if (
    req.method === "POST" &&
    req.headers.origin &&
    req.headers.origin !== originFromRequest(req)
  )
    return res
      .status(403)
      .json({ error: "This request could not be verified." });
  const { client, flushCookies } = serverSupabase(req, res);
  try {
    if (req.method === "GET") {
      const token =
        new URL(req.url ?? "/", originFromRequest(req)).searchParams.get(
          "token",
        ) ?? "";
      if (!/^[a-f0-9]{64}$/.test(token))
        return res
          .status(404)
          .json({ error: "This invitation is unavailable." });
      const { data, error } = await client.rpc("preview_society_invite", {
        p_token: token,
      });
      if (error || !data)
        return res
          .status(404)
          .json({ error: "This invitation is unavailable." });
      return res.status(200).json({ society: data });
    }
    const {
      data: { user },
    } = await client.auth.getUser();
    if (!user) return res.status(401).json({ error: "Sign in to continue." });
    const body = req.body as Record<string, unknown>;
    if (
      body?.action === "link" &&
      z.string().uuid().safeParse(body.societyId).success
    ) {
      const { data, error } = await client.rpc("get_society_invite", {
        p_society: body.societyId,
      });
      if (error || !data)
        return res
          .status(403)
          .json({ error: "Join this society before sharing its invitation." });
      const url = `${originFromRequest(req)}/societies/join/${data}`;
      const qr = await QRCode.toDataURL(url, {
        width: 320,
        margin: 4,
        errorCorrectionLevel: "M",
      });
      return res.status(200).json({ url, qr });
    }
    if (
      body?.action === "join" &&
      typeof body.token === "string" &&
      /^[a-f0-9]{64}$/.test(body.token)
    ) {
      const { data, error } = await client.rpc("join_society_invite", {
        p_token: body.token,
      });
      if (error)
        return res
          .status(409)
          .json({
            error:
              "Could not join. The invitation may be unavailable or your membership may be restricted.",
          });
      return res.status(200).json({ slug: data, status: "active" });
    }
    return res.status(400).json({ error: "Choose a valid invitation action." });
  } catch {
    return res
      .status(503)
      .json({
        error: "Invitations are temporarily unavailable. Please retry.",
      });
  } finally {
    flushCookies();
  }
}
