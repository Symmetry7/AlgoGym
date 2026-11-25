import type { NextConfig } from "next";

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
  turbopack: { root: process.cwd() },
  redirects: async () => removedRoutes.map((source) => ({ source, destination: "/problems", permanent: false })),
};
export default nextConfig;
