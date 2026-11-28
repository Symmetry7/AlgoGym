import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { SignInForm } from "@/components/auth/sign-in-form";
import { Mascot } from "@/components/brand/mascot";
import { Logo } from "@/components/shell/ui";
import { cn } from "@/lib/utils";
import { safeNextPath } from "../../../server/auth-policy";
import { currentUser } from "../../../server/session";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Sign in · Algogym", description: "Sign in or create your Algogym account with Google or email." };

const STEPS = ["Create your account", "Pick your target company", "Start your roadmap"];
// Film grain over the gradient panel (an SVG noise tile, so no image request).
const GRAIN = "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='180' height='180'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/%3E%3CfeColorMatrix type='saturate' values='0'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.5'/%3E%3C/svg%3E\")";

export default async function SignInPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const params = await searchParams;
  const next = safeNextPath(typeof params.next === "string" ? params.next : null, "/my-prep");
  const { user } = await currentUser();
  if (user) redirect(next);
  const signup = params.mode === "signup";

  return (
    <div className="flex min-h-dvh bg-black font-ui antialiased">
      {/* Left: brand panel (desktop) */}
      <aside className="relative m-3 hidden w-[46%] max-w-[720px] overflow-hidden rounded-[28px] lg:flex lg:flex-col lg:items-center lg:justify-end lg:px-12 lg:pb-16">
        <div aria-hidden className="absolute inset-0 bg-[linear-gradient(180deg,var(--ag-auth-1)_0%,var(--ag-auth-2)_18%,var(--ag-auth-3)_42%,var(--ag-auth-4)_66%,var(--ag-auth-5)_100%)]" />
        <div aria-hidden className="absolute inset-0 opacity-[0.35] mix-blend-overlay" style={{ backgroundImage: GRAIN }} />
        <div aria-hidden className="absolute inset-x-0 top-0 h-1/2 bg-[radial-gradient(ellipse_70%_60%_at_50%_0%,var(--ag-light-5),transparent_70%)]" />
        <div className="relative w-full max-w-[340px] text-center">
          <div className="mx-auto flex items-center justify-center gap-2.5">
            <Mascot className="size-10" />
            <span className="font-display text-[28px] leading-none text-white">Algogym</span>
          </div>
          <h2 className="mt-6 text-[34px] font-semibold leading-tight tracking-[-0.025em] text-white">Get started with Algogym</h2>
          <p className="mt-3 text-pretty text-[16px] leading-relaxed text-white/75">Three quick steps to a prep plan built for the company you want.</p>
          <ol className="mt-9 space-y-3 text-left">
            {STEPS.map((s, i) => (
              <li key={s} className={cn("flex items-center gap-3.5 rounded-xl px-5 py-4 text-[15px]", i === 0 ? "bg-white text-black" : "bg-ag-auth-step text-white/80")}>
                <span className={cn("grid size-6 shrink-0 place-items-center rounded-full text-[12px] font-semibold", i === 0 ? "bg-black text-white" : "bg-white/15 text-white")}>{i + 1}</span>
                {s}
              </li>
            ))}
          </ol>
        </div>
      </aside>

      {/* Right: the form */}
      <main id="main" className="relative flex flex-1 flex-col">
        <header className="flex h-16 items-center px-5 sm:px-8 lg:justify-end">
          <span className="lg:hidden"><Logo /></span>
        </header>
        <div className="flex flex-1 items-start justify-center px-4 pb-16 pt-[4vh] sm:items-center sm:pt-0">
          <SignInForm next={next} initialMode={signup ? "signup" : "login"} initialError={params.auth_error ? "That sign-in link didn't work or has expired. Please try again." : undefined} />
        </div>
      </main>
    </div>
  );
}
