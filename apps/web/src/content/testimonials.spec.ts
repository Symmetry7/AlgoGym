import { describe, expect, it } from "vitest";
import { TESTIMONIALS, visibleTestimonials, type Testimonial } from "./testimonials";

const real: Testimonial = { name: "A", role: "B", quote: "C", verified: true };
const sample: Testimonial = { name: "S", role: "R", quote: "Q", verified: false };

describe("visibleTestimonials", () => {
  it("never shows unverified samples in production", () => {
    expect(visibleTestimonials([sample, real], "production")).toEqual([real]);
    expect(visibleTestimonials(TESTIMONIALS.filter((t) => !t.verified), "production")).toEqual([]);
  });
  it("shows everything in development so the layout can be reviewed", () => {
    expect(visibleTestimonials([sample, real], "development")).toEqual([sample, real]);
  });
});
