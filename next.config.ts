import type { NextConfig } from "next";

const nextConfig: NextConfig = { reactStrictMode: true, poweredByHeader: false, agentRules: false, images:{qualities:[75,90]}, turbopack: { root: process.cwd() } };
export default nextConfig;
