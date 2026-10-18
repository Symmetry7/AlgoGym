import { describe, it, expect } from "vitest";
import { escapeXML, renderProfileCard } from "./profile-card";
describe("portfolio export", () => {
  it("escapes profile text as XML", () => {
    expect(escapeXML('<script a="x">&')).toBe(
      "&lt;script a=&quot;x&quot;&gt;&amp;",
    );
    const svg = renderProfileCard(
      {
        name: "<script>alert(1)</script>",
        username: null,
        college: null,
        solves: null,
        activeDays: null,
        chakra: 0,
        rating: null,
        publicURL: null,
      },
      "",
    );
    expect(svg).not.toContain("<script>");
    expect(svg).toContain("VERIFIED SOLVES");
  });
});
