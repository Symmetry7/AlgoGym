// Landing-page testimonials. Only real quotes from real users, given with their permission, may set verified: true.
// Unverified entries are drafts: they render in development only, labelled "Draft" (DECISIONS.md 2026-11-27).
export interface Testimonial {
  name: string;
  role: string;
  quote: string;
  verified: boolean;
}

// Draft quotes for the people below: each person must read and approve their own quote, then set verified: true.
export const TESTIMONIALS: Testimonial[] = [
  { name: "Shiva Krishna Yadav", role: "Algogym learner", quote: "The roadmap told me exactly what to study each week. I stopped wasting evenings deciding what to practise.", verified: false },
  { name: "Aditya Tiwari", role: "Algogym learner", quote: "Hints that open one at a time made me actually think. By the last hint I usually had the answer myself.", verified: false },
  { name: "Nasib Khan", role: "Algogym learner", quote: "Company lists by recent frequency helped me focus on what was really being asked before my interviews.", verified: false },
  { name: "Kailash Sharma", role: "Algogym learner", quote: "Hidden tests caught the edge cases I always missed. Getting Accepted here felt earned.", verified: false },
  { name: "Rashmi Singh", role: "Algogym learner", quote: "Short lessons right before the problems that need them. That ordering is what made it click for me.", verified: false },
  { name: "Aisha Upadhyay", role: "Algogym learner", quote: "Lessons, problems, HR questions and SQL in one place. I finally closed the ten tabs I prep with.", verified: false },
];

/** Verified quotes always; unverified samples only outside production. */
export function visibleTestimonials(list: Testimonial[], env: string | undefined): Testimonial[] {
  return env === "production" ? list.filter((t) => t.verified) : list;
}
