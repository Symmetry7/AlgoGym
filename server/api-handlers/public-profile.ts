import {
  serverSupabase,
  type ApiRequest,
  type ApiResponse,
} from "../supabase";
export default async function handler(req: ApiRequest, res: ApiResponse) {
  res.setHeader("Cache-Control", "private, no-store");
  if (req.method !== "GET")
    return res.status(405).json({ error: "Method not allowed." });
  const username =
    new URL(req.url ?? "/", "http://localhost").searchParams.get("username") ??
    "";
  if (!/^[a-zA-Z0-9_-]{3,30}$/.test(username))
    return res.status(400).json({ error: "Enter a valid AlgoGym username." });
  const { client, flushCookies } = serverSupabase(req, res);
  try {
    const { data, error } = await client.rpc("get_public_portfolio", {
      p_username: username,
    });
    if (error)
      return res
        .status(503)
        .json({
          error: "Public portfolios are temporarily unavailable. Please retry.",
        });
    if (!data)
      return res
        .status(404)
        .json({ error: "This portfolio is private or does not exist." });
    return res.status(200).json(data);
  } finally {
    flushCookies();
  }
}
