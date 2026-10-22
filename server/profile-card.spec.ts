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
    expect(svg).toContain("TOTAL SOLVES");
    expect(svg).toContain("COINS");
    expect(svg).toContain('width="1080" height="720"');
    expect(svg).toContain("—");
  });
  it("uses the supplied metrics and escapes platform labels and embedded image attributes", () => {
    const svg = renderProfileCard({ name: "Ada", username: "ada", college: "A & B", solves: 1234, activeDays: 45, chakra: 678, rating: 1901, publicURL: null, platforms: ['<script>'] }, "", 'data:image/png;base64,a" onload="bad');
    expect(svg).toContain("1,234");
    expect(svg).toContain(">45</text>");
    expect(svg).toContain(">678</text>");
    expect(svg).toContain("1,901");
    expect(svg).toContain("A &amp; B");
    expect(svg).toContain("&lt;script&gt;");
    expect(svg).not.toContain('" onload="bad');
    expect(svg).not.toContain("algogym.vercel.app/u/");
  });
});
