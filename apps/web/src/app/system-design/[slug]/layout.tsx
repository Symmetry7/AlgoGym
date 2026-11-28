import { notFound } from "next/navigation";
import type { ReactNode } from "react";
import { getLesson } from "../lessons";

// The slug check lives here, outside (lesson)/loading.tsx's streaming boundary, so an unknown lesson gets a real 404.
export default async function LessonLayout({ children, params }: { children: ReactNode; params: Promise<{ slug: string }> }) {
  if (!getLesson((await params).slug)) notFound();
  return children;
}
