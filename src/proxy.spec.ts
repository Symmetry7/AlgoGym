import { describe, expect, it } from "vitest";
import { unstable_doesMiddlewareMatch } from "next/experimental/testing/server";
import { config } from "./proxy";

describe("session refresh routing", () => {
  it.each(["/_next/hmr", "/_next/static/chunk.js", "/_next/image?url=x", "/api/auth/session", "/brand/logo.webp"])("leaves infrastructure request %s alone", (url) => {
    expect(unstable_doesMiddlewareMatch({ config, nextConfig: {}, url })).toBe(false);
  });
  it.each(["/pricing", "/training/symm", "/dashboard", "/statistics"])("refreshes sessions for %s", (url) => {
    expect(unstable_doesMiddlewareMatch({ config, nextConfig: {}, url })).toBe(true);
  });
});
