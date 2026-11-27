import { redirect } from "next/navigation";
import type { ReactNode } from "react";
import { currentUser } from "../../../server/session";

export const dynamic = "force-dynamic";

// The sign-in check lives here, outside loading.tsx's streaming boundary, so signed-out visitors get a real redirect.
export default async function MyPrepLayout({ children }: { children: ReactNode }) {
  const { user } = await currentUser();
  if (!user) redirect("/sign-in?next=/my-prep");
  return children;
}
