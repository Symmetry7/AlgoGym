// Landing-page testimonials. Only real quotes from real users, given with their permission, may set verified: true.
// Unverified entries are layout samples: they render in development only, labelled "Sample" (DECISIONS.md 2026-11-27).
export interface Testimonial {
  name: string;
  role: string;
  quote: string;
  verified: boolean;
}

export const TESTIMONIALS: Testimonial[] = [
  { name: "Sample student A", role: "Final-year B.Tech student", quote: "The roadmap told me exactly what to study each week. I stopped wasting evenings deciding what to practise.", verified: false },
  { name: "Sample student B", role: "Second-year CSE student", quote: "Hints that open one at a time made me actually think. By the last hint I usually had it myself.", verified: false },
  { name: "Sample developer C", role: "Backend developer, 2 years", quote: "Company lists by recent frequency helped me focus on what was really being asked before my interviews.", verified: false },
  { name: "Sample student D", role: "MCA student", quote: "Hidden tests caught edge cases I always missed. Getting Accepted here felt earned.", verified: false },
  { name: "Sample developer E", role: "Frontend developer switching to SDE", quote: "Short lessons right before the problems that need them. That ordering is what made it click.", verified: false },
  { name: "Sample student F", role: "Placement season, tier-2 college", quote: "Everything in one place: lessons, problems, HR questions and SQL. I closed ten browser tabs.", verified: false },
];

/** Verified quotes always; unverified samples only outside production. */
export function visibleTestimonials(list: Testimonial[], env: string | undefined): Testimonial[] {
  return env === "production" ? list.filter((t) => t.verified) : list;
}
