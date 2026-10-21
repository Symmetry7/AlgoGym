import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { SymmSidebar } from "./SymmSidebar";

describe("Symm navigation", () => {
  it("links to real saved paths and exposes library search", () => {
    const html = renderToStaticMarkup(<SymmSidebar activeRoute="/training/symm" paths={[{ id: "course-one", title: "Grid DP", updated_at: "2026-10-21" }]} />);
    expect(html).toContain('href="/training/symm/course-one"');
    expect(html).toContain("Grid DP");
    expect(html).toContain('href="/training/symm/library?search=1"');
    expect(html).toContain("Account settings");
    expect(html).toContain('aria-expanded="true"');
  });
  it("shows an honest empty state without invented recent paths", () => {
    const html = renderToStaticMarkup(<SymmSidebar activeRoute="/training/symm/library" paths={[]} />);
    expect(html).toContain("Your learning paths will appear here.");
    expect(html).toContain('aria-current="page"');
  });
});
