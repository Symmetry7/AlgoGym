import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { RichText } from "./LessonContent";

describe("educational Markdown", () => {
  it("uses the copyable syntax highlighter for fenced code", () => {
    const html = renderToStaticMarkup(<RichText>{"## Example\n\n```cpp\nint paths = 3;\n```\n\nUse `paths` next."}</RichText>);
    expect(html).toContain('aria-label="Copy code"');
    expect(html).toContain('lesson-rich-text');
    expect(html).not.toContain('<pre><div');
    expect(html).not.toMatch(/<code[^>]*><div/);
  });
  it("renders tables and mathematical notation as semantic content", () => {
    const html = renderToStaticMarkup(<RichText>{"| State | Value |\n| --- | --- |\n| start | 1 |\n\n$dp[i][j] = dp[i-1][j] + dp[i][j-1]$"}</RichText>);
    expect(html).toContain('<table');
    expect(html).toContain('katex');
  });
});
