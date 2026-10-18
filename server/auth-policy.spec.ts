import { describe, expect, it } from "vitest";
import { safeNextPath } from "./auth-policy";
describe("authentication redirects", () => {
  it("keeps safe internal return paths", () =>
    expect(safeNextPath("/statistics?period=30")).toBe(
      "/statistics?period=30",
    ));
  it("rejects external, encoded, backslash and auth-loop targets", () => {
    for (const value of [
      "https://evil.example",
      "//evil.example",
      "/%2fevil.example",
      "/\\evil.example",
      "/api/auth/google",
      "/sign-in",
      "/%0aevil",
    ])
      expect(safeNextPath(value)).toBe("/dashboard");
  });
});
