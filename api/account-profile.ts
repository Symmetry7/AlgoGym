import { z } from "zod";
import {
  originFromRequest,
  serverSupabase,
  type ApiRequest,
  type ApiResponse,
} from "../server/supabase";
const secureURL = z
  .string()
  .max(300)
  .url()
  .refine((value) => {
    const url = new URL(value);
    return (
      url.protocol === "https:" && !url.username && !url.password && !url.port
    );
  }, "Use a public HTTPS URL without credentials.")
  .or(z.literal(""))
  .nullable();
const schema = z
  .object({
    displayName: z.string().trim().min(2).max(80).optional(),
    username: z
      .string()
      .trim()
      .regex(/^[a-zA-Z0-9_-]{3,30}$/)
      .optional(),
    isPublic: z.boolean().optional(),
    bio: z.string().trim().max(1000).optional(),
    countryCode: z
      .string()
      .regex(/^[A-Z]{2}$/)
      .or(z.literal(""))
      .nullable()
      .optional(),
    websiteUrl: secureURL.optional(),
    githubUrl: secureURL.optional(),
    linkedinUrl: secureURL.optional(),
    xUrl: secureURL.optional(),
  })
  .strict();
const columns =
  "display_name,username,avatar_url,is_public,bio,country_code,website_url,github_url,linkedin_url,x_url";
export default async function handler(req: ApiRequest, res: ApiResponse) {
  res.setHeader("Cache-Control", "private, no-store");
  if (!["GET", "PATCH"].includes(req.method ?? ""))
    return res.status(405).json({ error: "Method not allowed." });
  if (
    req.method === "PATCH" &&
    req.headers.origin &&
    req.headers.origin !== originFromRequest(req)
  )
    return res
      .status(403)
      .json({ error: "This request could not be verified." });
  const { client, flushCookies } = serverSupabase(req, res);
  try {
    const {
      data: { user },
      error: authError,
    } = await client.auth.getUser();
    if (authError || !user)
      return res.status(401).json({ error: "Sign in to manage your profile." });
    if (req.method === "GET") {
      const { data, error } = await client
        .from("profiles")
        .select(columns)
        .eq("id", user.id)
        .single();
      if (error) throw error;
      return res.status(200).json({ profile: data });
    }
    const parsed = schema.safeParse(req.body);
    if (!parsed.success || !Object.keys(parsed.data).length)
      return res
        .status(400)
        .json({
          error:
            "Check your profile fields. Names must contain 2–80 characters; usernames use 3–30 letters, numbers, underscores or hyphens.",
        });
    const value = parsed.data;
    const update: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };
    const mapping = {
      displayName: "display_name",
      username: "username",
      isPublic: "is_public",
      bio: "bio",
      countryCode: "country_code",
      websiteUrl: "website_url",
      githubUrl: "github_url",
      linkedinUrl: "linkedin_url",
      xUrl: "x_url",
    };
    for (const [key, column] of Object.entries(mapping))
      if (value[key] !== undefined)
        update[column] = value[key] === "" && key !== "bio" ? null : value[key];
    for (const [key, pattern] of [
      ["githubUrl", /^https:\/\/github\.com\/[A-Za-z0-9-]+\/?$/],
      ["linkedinUrl", /^https:\/\/(?:www\.)?linkedin\.com\/in\/[^\s<>]+$/],
      ["xUrl", /^https:\/\/(?:x\.com|twitter\.com)\/[A-Za-z0-9_]+\/?$/],
    ] as const)
      if (value[key] && !pattern.test(value[key]!))
        return res
          .status(400)
          .json({
            error: `Enter a valid ${key === "githubUrl" ? "GitHub" : key === "linkedinUrl" ? "LinkedIn" : "X"} profile URL.`,
          });
    if (value.isPublic && !value.username) {
      const { data } = await client
        .from("profiles")
        .select("username")
        .eq("id", user.id)
        .single();
      if (!data?.username)
        return res
          .status(400)
          .json({
            error:
              "Choose an AlgoGym username in Settings before making your profile public.",
          });
    }
    const { data, error } = await client
      .from("profiles")
      .update(update)
      .eq("id", user.id)
      .select(columns)
      .single();
    if (error?.code === "23505")
      return res
        .status(409)
        .json({ error: "This AlgoGym username is already taken." });
    if (error) throw error;
    return res.status(200).json({ profile: data });
  } catch {
    return res
      .status(503)
      .json({
        error:
          "Your profile settings could not be saved or loaded. Retry shortly.",
      });
  } finally {
    flushCookies();
  }
}
