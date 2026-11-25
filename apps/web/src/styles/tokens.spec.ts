import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const css = readFileSync(new URL("./tokens.css", import.meta.url), "utf8");
const token = (name: string) => {
  const hex = css.match(new RegExp(`--ag-${name}:\\s*(#[0-9a-f]{6})`, "i"))?.[1];
  if (!hex) throw new Error(`missing hex token --ag-${name}`);
  return hex;
};

// WCAG 2.1 relative luminance and contrast ratio.
const luminance = (hex: string) => {
  const [r, g, b] = [1, 3, 5].map((i) => {
    const c = parseInt(hex.slice(i, i + 2), 16) / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};
const contrast = (a: string, b: string) => {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
};

const surfaces = ["bg", "bg-app", "surface-1", "surface-2", "surface-3"];

describe("design tokens meet WCAG AA (4.5:1 for normal text)", () => {
  for (const fg of ["text", "text-muted", "text-faint", "accent", "easy", "medium", "hard", "pro"]) {
    for (const bg of surfaces) {
      it(`${fg} on ${bg}`, () => expect(contrast(token(fg), token(bg))).toBeGreaterThanOrEqual(4.5));
    }
  }
  for (const bg of ["accent", "accent-hover"]) {
    it(`on-accent on ${bg}`, () => expect(contrast(token("on-accent"), token(bg))).toBeGreaterThanOrEqual(4.5));
  }
});
