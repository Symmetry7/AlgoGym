import { createServerClient } from "@supabase/ssr";

export interface ApiRequest {
  method?: string;
  url?: string;
  headers: Record<string, string | string[] | undefined>;
  body?: unknown;
}

export interface ApiResponse {
  status(code: number): ApiResponse;
  setHeader(name: string, value: string | string[]): void;
  getHeader?(name: string): string | string[] | number | undefined;
  end(body?: string): void;
  json(body: unknown): void;
  redirect(status: number, url: string): void;
}

type CookieOptions = Record<string, unknown> & {
  maxAge?: number;
  expires?: Date;
  path?: string;
  sameSite?: string;
  secure?: boolean;
};
type CookieValue = { name: string; value: string; options: CookieOptions };

function header(request: ApiRequest, name: string) {
  const value = request.headers[name] ?? request.headers[name.toLowerCase()];
  return Array.isArray(value) ? value[0] : value;
}

function parseCookies(value = "") {
  return value
    .split(";")
    .map((part) => part.trim())
    .filter(Boolean)
    .map((part) => {
      const index = part.indexOf("=");
      if (index < 0) return [part, ""];
      const key = part.slice(0, index);
      try {
        return [key, decodeURIComponent(part.slice(index + 1))];
      } catch {
        return [key, part.slice(index + 1)];
      }
    }) as Array<[string, string]>;
}

function serializeCookie({ name, value, options }: CookieValue) {
  const parts = [
    `${name}=${encodeURIComponent(value)}`,
    `Path=${options.path ?? "/"}`,
    "HttpOnly",
    "SameSite=Lax",
  ];
  if (typeof options.maxAge === "number")
    parts.push(`Max-Age=${Math.floor(options.maxAge)}`);
  if (options.expires instanceof Date)
    parts.push(`Expires=${options.expires.toUTCString()}`);
  if (process.env.NODE_ENV === "production") parts.push("Secure");
  return parts.join("; ");
}

export function getSupabaseEnv() {
  const url =
    process.env.SUPABASE_URL ??
    process.env.NEXT_PUBLIC_SUPABASE_URL ??
    process.env.VITE_SUPABASE_URL;
  const key =
    process.env.SUPABASE_PUBLISHABLE_KEY ??
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
    process.env.VITE_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key)
    throw new Error(
      "Set SUPABASE_URL and SUPABASE_PUBLISHABLE_KEY in the server environment.",
    );
  return { url, key };
}

export function serverSupabase(request: ApiRequest, response: ApiResponse) {
  const { url, key } = getSupabaseEnv();
  const incoming = new Map(parseCookies(header(request, "cookie")));
  const outgoing: string[] = [];
  const client = createServerClient(url, key, {
    auth: {
      flowType: "pkce",
      autoRefreshToken: true,
      detectSessionInUrl: false,
      persistSession: true,
    },
    cookies: {
      getAll: () => [...incoming].map(([name, value]) => ({ name, value })),
      setAll: (cookies) => {
        for (const cookie of cookies as CookieValue[]) {
          incoming.set(cookie.name, cookie.value);
          outgoing.push(serializeCookie(cookie));
        }
      },
    },
  });

  const flushCookies = () => {
    if (!outgoing.length) return;
    const prior = response.getHeader?.("Set-Cookie");
    const values = [
      ...(Array.isArray(prior) ? prior : prior ? [String(prior)] : []),
      ...outgoing,
    ];
    response.setHeader("Set-Cookie", values);
    outgoing.length = 0;
  };
  return { client, flushCookies, incoming };
}

export function originFromRequest(request: ApiRequest) {
  const host =
    header(request, "x-forwarded-host") ??
    header(request, "host") ??
    "localhost:8080";
  if (
    process.env.NODE_ENV !== "production" &&
    /^(localhost|127\.0\.0\.1)(:\d{1,5})?$/.test(host)
  )
    return `http://${host}`;
  const configured =
    process.env.APP_ORIGIN ??
    process.env.NEXT_PUBLIC_SITE_URL ??
    "https://algogym.vercel.app";
  const allowed = new Set(
    [
      new URL(configured).host,
      process.env.VERCEL_URL,
      process.env.VERCEL_PROJECT_PRODUCTION_URL,
    ].filter(Boolean),
  );
  return allowed.has(host) ? `https://${host}` : new URL(configured).origin;
}

export function methodNotAllowed(response: ApiResponse, allowed: string[]) {
  response.setHeader("Allow", allowed.join(", "));
  response.status(405).json({ error: "Method not allowed." });
}
