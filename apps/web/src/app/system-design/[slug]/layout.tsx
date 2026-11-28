import { notFound } from "next/navigation";
import type { ReactNode } from "react";
import { getLesson, getLessons } from "../lessons";

// Only known lessons are routes: any other slug is a real 404 before rendering starts (a notFound()
// from inside the streamed render arrives after the 200 status has gone out).
export const dynamicParams = false;
export const generateStaticParams = () => getLessons().map((l) => ({ slug: l.slug }));

export default async function LessonLayout({ children, params }: { children: ReactNode; params: Promise<{ slug: string }> }) {
  if (!getLesson((await params).slug)) notFound();
  return children;
}
