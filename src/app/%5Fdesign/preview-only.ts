import { notFound } from "next/navigation";

/** Design previews exist in local dev and Vercel previews only. */
export function previewOnly() {
  if (process.env.VERCEL_ENV === "production") notFound();
}
