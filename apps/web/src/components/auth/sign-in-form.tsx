"use client";

import { Loader2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { focusRing } from "@/components/shell/ui";
import { cn } from "@/lib/utils";
import { GoogleMark } from "./GoogleMark";

type Mode = "login" | "signup" | "reset";

const field = cn("h-11 w-full rounded-xl border border-white/12 bg-white/[0.03] px-3.5 text-[15px] text-[#f0f0f0] placeholder:text-[#86888a] transition-colors duration-ag-hover hover:border-white/20 focus:border-white/40 focus:outline-none");
const primary = cn("ag-glass-button inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl text-[15px] font-semibold text-white transition-[filter] duration-ag-hover hover:brightness-125 disabled:opacity-60", focusRing);

/** Sign in with Google (Supabase OAuth, server-side PKCE) or email and password. */
export function SignInForm({ next, initialError }: { next: string; initialError?: string }) {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("login");
  const [busy, setBusy] = useState<"google" | "email" | null>(null);
  const [error, setError] = useState(initialError ?? "");
  const [notice, setNotice] = useState("");

  const google = async () => {
    setBusy("google"); setError("");
    try {
      const res = await fetch(`/api/auth/google?next=${encodeURIComponent(next)}`, { credentials: "same-origin" });
      const body = await res.json().catch(() => ({}));
      if (!res.ok || !body.url) throw new Error(body.error ?? "Google sign-in could not be started. Please try again.");
      window.location.assign(body.url);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Google sign-in could not be started.");
      setBusy(null);
    }
  };

  const submit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    setBusy("email"); setError(""); setNotice("");
    try {
      const res = await fetch("/api/auth/email", {
        method: "POST",
        credentials: "same-origin",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ action: mode, email: form.get("email"), password: form.get("password") || undefined, fullName: form.get("fullName") || undefined, next }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body.error ?? "Something went wrong. Please try again.");
      if (mode === "reset") { setNotice(body.message ?? "If that email has an account, a reset link is on its way."); setBusy(null); return; }
      if (body.confirmationRequired) { setNotice("Check your inbox to confirm your email, then sign in."); setMode("login"); setBusy(null); return; }
      router.replace(body.next ?? next);
      router.refresh(); // pick up the new session cookie in server components
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
      setBusy(null);
    }
  };

  const title = mode === "login" ? "Sign in to Algogym" : mode === "signup" ? "Create your account" : "Reset your password";
  return (
    <div className="w-full max-w-[380px]">
      <h1 className="text-center text-[28px] font-semibold tracking-[-0.02em] text-[#f0f0f0]">{title}</h1>
      <p className="mt-2 text-center text-[15px] text-[#a1a4a5]">
        {mode === "reset" ? "We'll email you a link to set a new one." : "Your roadmap, problems and progress, in one place."}
      </p>

      {mode !== "reset" && (
        <>
          <button type="button" onClick={google} disabled={busy !== null} className={cn("mt-8 inline-flex h-11 w-full items-center justify-center gap-2.5 rounded-xl bg-white text-[15px] font-semibold text-black transition-colors duration-ag-hover hover:bg-white/90 disabled:opacity-60", focusRing)}>
            {busy === "google" ? <Loader2 className="size-4 animate-spin" aria-hidden /> : <GoogleMark />}
            Continue with Google
          </button>
          <div className="my-6 flex items-center gap-3 text-[13px] text-[#86888a]" role="separator">
            <span className="h-px flex-1 bg-white/10" /> or with email <span className="h-px flex-1 bg-white/10" />
          </div>
        </>
      )}

      <form onSubmit={submit} className={cn("space-y-3", mode === "reset" && "mt-8")} noValidate={false}>
        {mode === "signup" && (
          <div>
            <label htmlFor="fullName" className="mb-1.5 block text-[13px] text-[#a1a4a5]">Full name</label>
            <input id="fullName" name="fullName" required minLength={2} maxLength={80} autoComplete="name" className={field} />
          </div>
        )}
        <div>
          <label htmlFor="email" className="mb-1.5 block text-[13px] text-[#a1a4a5]">Email</label>
          <input id="email" name="email" type="email" required autoComplete="email" placeholder="you@college.edu" className={field} />
        </div>
        {mode !== "reset" && (
          <div>
            <div className="mb-1.5 flex items-center justify-between">
              <label htmlFor="password" className="text-[13px] text-[#a1a4a5]">Password</label>
              {mode === "login" && <button type="button" onClick={() => { setMode("reset"); setError(""); }} className={cn("rounded-sm text-[13px] text-[#a1a4a5] hover:text-white", focusRing)}>Forgot password?</button>}
            </div>
            <input id="password" name="password" type="password" required minLength={mode === "signup" ? 8 : 1} autoComplete={mode === "signup" ? "new-password" : "current-password"} className={field} />
          </div>
        )}
        <div aria-live="polite" className="min-h-[20px] text-[13px]">
          {error && <p className="text-ag-hard" role="alert">{error}</p>}
          {notice && <p className="text-ag-accent">{notice}</p>}
        </div>
        <button type="submit" disabled={busy !== null} className={primary}>
          {busy === "email" && <Loader2 className="size-4 animate-spin" aria-hidden />}
          {mode === "login" ? "Sign in" : mode === "signup" ? "Create account" : "Send reset link"}
        </button>
      </form>

      <p className="mt-6 text-center text-[14px] text-[#a1a4a5]">
        {mode === "login" ? "New to Algogym? " : "Already have an account? "}
        <button type="button" onClick={() => { setMode(mode === "login" ? "signup" : "login"); setError(""); setNotice(""); }} className={cn("rounded-sm font-medium text-white underline-offset-4 hover:underline", focusRing)}>
          {mode === "login" ? "Create an account" : "Sign in"}
        </button>
      </p>
      <p className="mt-8 text-center text-[12px] leading-relaxed text-[#86888a]">
        By continuing you agree to our <Link href="/privacy" className="underline underline-offset-2 hover:text-[#a1a4a5]">Privacy Policy</Link>.
      </p>
    </div>
  );
}
