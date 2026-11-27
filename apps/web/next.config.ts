import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { parseEnv } from "node:util";
import type { NextConfig } from "next";

// npm workspaces: Next runs from apps/web, but dependencies are hoisted to the repo root and the
// local env files live there too (shared with scripts/). Load them in Next's precedence order without
// overriding anything already set; Vercel injects real env vars, so these files don't exist there.
// (@next/env's loadEnvConfig can't do this: it returns its cached apps/web result on a second call.)
const repoRoot = resolve(process.cwd(), "../..");
const mode = process.env.NODE_ENV === "production" ? "production" : "development";
for (const file of [`.env.${mode}.local`, ".env.local", `.env.${mode}`, ".env"]) {
  const path = resolve(repoRoot, file);
  if (!existsSync(path)) continue;
  for (const [key, value] of Object.entries(parseEnv(readFileSync(path, "utf8")))) process.env[key] ??= value;
}

// Legacy routes removed in M2 (docs/BUILD_GUIDE.md). Temporary redirects: M13 points them at /roadmap.
// `:path*` also matches the bare prefix, e.g. /training.
const removedRoutes = [
  "/dashboard",
  "/onboarding",
  "/training/:path*",
  "/train/:path*",
  "/upsolve",
  "/sheets",
  "/resources",
  "/workspace",
  "/notes",
  "/statistics",
  "/leaderboards",
  "/contests",
  "/societies/:path*",
  "/admin",
  "/profile/:path*",
  "/u/:path*",
];

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  agentRules: false,
  images: { qualities: [75, 90] },
  turbopack: { root: repoRoot },
  redirects: async () => [
    ...removedRoutes.map((source) => ({ source, destination: "/problems", permanent: false })),
    // M6: HR and SQL moved to /interview. Other /interview-preparations sections stay until they have a new home.
    { source: "/interview-preparations/hr-questions/:path*", destination: "/interview?kind=hr", permanent: true },
    { source: "/interview-preparations/sql/:path*", destination: "/interview?kind=sql", permanent: true },
  ],
};
export default nextConfig;
