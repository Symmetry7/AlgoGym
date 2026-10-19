import { NextRequest, NextResponse } from "next/server";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { runApiHandler } from "../next-adapter";
import { serverSupabase } from "../supabase";
import { renderProfileCard } from "../profile-card";
export async function GET(request: NextRequest) {
  return runApiHandler(request, async (req, res) => {
    res.setHeader("Cache-Control", "private, no-store");
    const { client, flushCookies } = serverSupabase(req, res);
    try {
      const {
        data: { user },
      } = await client.auth.getUser();
      if (!user)
        return res
          .status(401)
          .json({ error: "Sign in to export your AlgoGym card." });
      const [profile, summary, cf, lc, accounts, solves] = await Promise.all([
        client
          .from("profiles")
          .select("display_name,username,is_public,colleges(name)")
          .eq("id", user.id)
          .single(),
        client.rpc("get_my_portfolio_summary"),
        client
          .from("provider_snapshots")
          .select("summary")
          .eq("user_id", user.id)
          .eq("provider", "codeforces")
          .maybeSingle(),
        client
          .from("provider_snapshots")
          .select("summary")
          .eq("user_id", user.id)
          .eq("provider", "leetcode")
          .maybeSingle(),
        client.from("coding_profiles").select("platform").eq("user_id", user.id),
        client.from("solves").select("id", { count: "exact", head: true }).eq("user_id", user.id).eq("proof_status", "verified"),
      ]);
      if (profile.error || summary.error || cf.error || lc.error || accounts.error || solves.error)
        throw new Error("Unavailable");
      const logo = (
        await readFile(join(process.cwd(), "public/brand/algogym-wordmark.png"))
      ).toString("base64");
      const favicon = (
        await readFile(join(process.cwd(), "public/brand/ninja-favicon.png"))
      ).toString("base64");
      let photoData: string | undefined;
      try {
        const rawPhoto = user.user_metadata?.avatar_url ?? user.user_metadata?.picture;
        if (typeof rawPhoto === "string") {
          const avatarURL = new URL(rawPhoto);
          if (avatarURL.protocol === "https:" && (avatarURL.hostname === "googleusercontent.com" || avatarURL.hostname.endsWith(".googleusercontent.com"))) {
            const avatar = await fetch(avatarURL, { signal: AbortSignal.timeout(5000) });
            const mime = avatar.headers.get("content-type")?.split(";")[0];
            if (avatar.ok && mime && ["image/jpeg", "image/png", "image/webp"].includes(mime)) {
              const bytes = Buffer.from(await avatar.arrayBuffer());
              if (bytes.length <= 1_000_000) photoData = `data:${mime};base64,${bytes.toString("base64")}`;
            }
          }
        }
      } catch { /* The card has an initial fallback. */ }
      const p = profile.data;
      const college = Array.isArray(p.colleges)
        ? p.colleges[0]?.name
        : (p.colleges as { name?: string } | null)?.name;
      const svg = renderProfileCard(
        {
          name: p.display_name ?? "AlgoGym member",
          username: p.username,
          college: college ?? null,
          solves: (solves.count ?? 0) + Number(lc.data?.summary?.totalSolved ?? 0),
          activeDays: summary.data.activeDays,
          chakra: summary.data.chakra,
          rating: cf.data?.summary.rating ?? null,
          publicURL:
            p.is_public && p.username
              ? `algogym.vercel.app/u/${p.username}`
              : null,
          platforms: (accounts.data ?? []).map((item) => item.platform),
        },
        logo,
        photoData,
        favicon,
      );
      res.setHeader("Content-Type", "image/svg+xml; charset=utf-8");
      res.setHeader("X-Content-Type-Options", "nosniff");
      res.setHeader(
        "Content-Security-Policy",
        "default-src 'none'; img-src data:; style-src 'unsafe-inline'; sandbox",
      );
      if (request.nextUrl.searchParams.get("download") === "1")
        res.setHeader(
          "Content-Disposition",
          'attachment; filename="algogym-profile.svg"',
        );
      return res.end(svg);
    } catch {
      return res
        .status(503)
        .json({
          error: "Your profile card could not be generated. Retry shortly.",
        });
    } finally {
      flushCookies();
    }
  });
}
