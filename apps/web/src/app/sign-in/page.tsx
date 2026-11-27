import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { SignInForm } from "@/components/auth/sign-in-form";
import { Logo } from "@/components/shell/ui";
import { safeNextPath } from "../../../server/auth-policy";
import { currentUser } from "../../../server/session";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Sign in · Algogym", description: "Sign in to Algogym with Google or email." };

export default async function SignInPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const params = await searchParams;
  const next = safeNextPath(typeof params.next === "string" ? params.next : null, "/my-prep");
  const { user } = await currentUser();
  if (user) redirect(next);
  return (
    <div className="relative isolate flex min-h-dvh flex-col bg-black font-ui antialiased">
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(ellipse_55%_45%_at_50%_-5%,rgba(255,255,255,0.11),transparent_70%)]" />
      <header className="mx-auto flex h-16 w-full max-w-[1200px] items-center px-4 sm:px-6">
        <Logo />
      </header>
      <main id="main" className="flex flex-1 items-start justify-center px-4 pb-16 pt-[8vh] sm:items-center sm:pt-0">
        <SignInForm next={next} initialError={params.auth_error ? "That sign-in link didn't work or has expired. Please try again." : undefined} />
      </main>
    </div>
  );
}
