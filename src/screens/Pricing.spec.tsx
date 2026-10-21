import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import Pricing from "./Pricing";

describe("pricing preview", () => {
  it("provides an accessible plan comparison with recurring credit allowances", () => {
    const markup = renderToStaticMarkup(<Pricing />);
    expect(markup).toContain("Compare planned benefits");
    expect(markup).toContain('<table');
    expect(markup).toContain("50 per month");
    expect(markup).toContain("150 per month");
    expect(markup).toContain("No credits for opening saved content");
  });
});
