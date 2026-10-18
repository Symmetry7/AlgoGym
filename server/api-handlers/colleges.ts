import { z } from "zod";
import {
  originFromRequest,
  serverSupabase,
  type ApiRequest,
  type ApiResponse,
} from "../supabase";
const schema = z.object({
  name: z.string().trim().min(3).max(200),
  city: z.string().trim().min(2).max(120),
  state: z.string().trim().min(2).max(100),
  website: z.string().url().max(2083).optional(),
});
export default async function handler(
  request: ApiRequest,
  response: ApiResponse,
) {
  response.setHeader("Cache-Control", "private, no-store");
  const { client, flushCookies } = serverSupabase(request, response);
  try {
    if (request.method === "GET") {
      const query =
        new URL(request.url ?? "/", "http://localhost").searchParams
          .get("q")
          ?.trim() ?? "";
      if (query.length < 2) return response.status(200).json({ colleges: [] });
      if (query.length > 100)
        return response
          .status(400)
          .json({ error: "Use a shorter college search." });
      const { data, error } = await client.rpc("search_colleges", {
        p_query: query,
      });
      if (error)
        return response
          .status(503)
          .json({
            error:
              "The college directory is temporarily unavailable. Retry in a moment.",
          });
      return response.status(200).json({ colleges: data ?? [] });
    }
    if (request.method !== "POST")
      return response.status(405).json({ error: "Method not allowed." });
    if (
      request.headers.origin &&
      request.headers.origin !== originFromRequest(request)
    )
      return response
        .status(403)
        .json({ error: "This request could not be verified." });
    const {
      data: { user },
      error: authError,
    } = await client.auth.getUser();
    if (authError || !user)
      return response
        .status(401)
        .json({ error: "Sign in to request a college." });
    const parsed = schema.safeParse(request.body);
    if (!parsed.success)
      return response
        .status(400)
        .json({
          error:
            "Enter a college name, city, state, and valid website if provided.",
        });
    const { name, city, state, website } = parsed.data;
    if (website && !/^https?:\/\//.test(website))
      return response
        .status(400)
        .json({ error: "Use an HTTP or HTTPS institution website." });
    const { data, error } = await client.rpc("request_college", {
      p_name: name,
      p_city: city,
      p_state: state,
      p_website: website ?? null,
    });
    if (error)
      return response
        .status(400)
        .json({
          error: error.message.includes("Too many")
            ? "Too many college requests today. Please try again tomorrow."
            : "Your college request could not be saved. Please retry.",
        });
    return response.status(202).json({ id: data, status: "pending" });
  } finally {
    flushCookies();
  }
}
