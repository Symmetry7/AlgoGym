"use client";

import { Eye, EyeOff } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { MascotLoader } from "@/components/brand/mascot";
import { focusRing } from "@/components/shell/ui";
import { cn } from "@/lib/utils";
import { GoogleMark } from "./GoogleMark";

export type AuthMode = "login" | "signup" | "reset";

const field = cn("h-12 w-full rounded-xl border border-transparent bg-white/[0.06] px-4 text-[15px] text-ag-text placeholder:text-ag-text-faint transition-colors duration-ag-hover hover:bg-white/[0.08] focus:border-white/30 focus:bg-white/[0.08] focus:outline-none");
const label = "mb-2 block text-[14px] font-medium text-ag-text";

/** Email/password (login, sign-up, reset) and Google (Supabase OAuth, server-side PKCE). */
export function SignInForm({ next, initialMode = "login", initialError }: { next: string; initialMode?: AuthMode; initialError?: string }) {
  const router = useRouter();
  const [mode, setMode] = useState<AuthMode>(initialMode);
  const [busy, setBusy] = useState<"google" | "email" | null>(null);
  const [error, setError] = useState(initialError ?? "");
  const [notice, setNotice] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const switchMode = (m: AuthMode) => { setMode(m); setError(""); setNotice(""); };

  const google = async () => {
    setBusy("google"); setError("");
    try {
      const res = await fetch(`/api/auth/google?next=${encodeURIComponent(next)}`, { credentials: "same-origin" });
      const body = await res.json().catch(() => ({}));
      if (!res.ok || !body.url) throw new Error(body.error ?? "Google sign-in could not be started. Please try again.");
      window.location.assign(body.url); // leaves the app for Google's consent screen
    } catch (e) {
      setError(e instanceof Error ? e.message : "Google sign-in could not be started.");
      setBusy(null);
    }
  };

  const submit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const fullName = `${form.get("firstName") ?? ""} ${form.get("lastName") ?? ""}`.trim();
    setBusy("email"); setError(""); setNotice("");
    try {
      const res = await fetch("/api/auth/email", {
        method: "POST",
        credentials: "same-origin",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ action: mode, email: form.get("email"), password: form.get("password") || undefined, fullName: mode === "signup" ? fullName : undefined, next }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body.error ?? "Something went wrong. Please try again.");
      if (mode === "reset") { setNotice(body.message ?? "If that email has an account, a reset link is on its way."); setBusy(null); return; }
      if (body.confirmationRequired) { setNotice("Almost there: we've emailed you a confirmation link. Open it, then log in."); setMode("login"); setBusy(null); return; }
      router.replace(body.next ?? next);
      router.refresh(); // pick up the new session cookie in server components
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
      setBusy(null);
    }
  };

  // While we hand off to Google or open the app, the mascot keeps the user company.
  if (busy === "google") return <MascotLoader label="Taking you to Google" className="min-h-[420px]" />;

  const heading = { login: "Log in to your account", signup: "Sign up account", reset: "Reset your password" }[mode];
  const sub = { login: "Welcome back. Pick up your prep where you left off.", signup: "Enter your details to create your account.", reset: "Enter your email and we'll send you a reset link." }[mode];

  return (
    <div className="w-full max-w-[400px]">
      <h1 className="text-center text-[28px] font-semibold tracking-[-0.02em] text-ag-text">{heading}</h1>
      <p className="mt-2 text-center text-[15px] text-ag-text-muted">{sub}</p>

      {mode !== "reset" && (
        <>
          <button type="button" onClick={google} disabled={busy !== null} className={cn("mt-9 inline-flex h-12 w-full items-center justify-center gap-2.5 rounded-xl border border-white/15 bg-transparent text-[15px] font-semibold text-white transition-colors duration-ag-hover hover:border-white/30 hover:bg-white/[0.04] disabled:opacity-60", focusRing)}>
            <GoogleMark /> Continue with Google
          </button>
          <div className="my-7 flex items-center gap-3 text-[13px] text-ag-text-faint" role="separator">
            <span className="h-px flex-1 bg-white/10" /> Or <span className="h-px flex-1 bg-white/10" />
          </div>
        </>
      )}

      <form onSubmit={submit} className={cn("space-y-5", mode === "reset" && "mt-9")}>
        {mode === "signup" && (
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="firstName" className={label}>First name</label>
              <input id="firstName" name="firstName" required minLength={1} maxLength={40} autoComplete="given-name" placeholder="eg. Aditi" className={field} />
            </div>
            <div>
              <label htmlFor="lastName" className={label}>Last name</label>
              <input id="lastName" name="lastName" maxLength={40} autoComplete="family-name" placeholder="eg. Sharma" className={field} />
            </div>
          </div>
        )}
        <div>
          <label htmlFor="email" className={label}>Email</label>
          <input id="email" name="email" type="email" required autoComplete="email" placeholder="eg. aditi@college.edu" className={field} />
        </div>
        {mode !== "reset" && (
          <div>
            <div className="flex items-center justify-between">
              <label htmlFor="password" className={label}>Password</label>
              {mode === "login" && <button type="button" onClick={() => switchMode("reset")} className={cn("mb-2 rounded-sm text-[13px] text-ag-text-muted hover:text-white", focusRing)}>Forgot password?</button>}
            </div>
            <div className="relative">
              <input id="password" name="password" type={showPassword ? "text" : "password"} required minLength={mode === "signup" ? 8 : 1} maxLength={128} autoComplete={mode === "signup" ? "new-password" : "current-password"} placeholder="Enter your password" className={cn(field, "pr-12")} aria-describedby={mode === "signup" ? "password-hint" : undefined} />
              <button type="button" onClick={() => setShowPassword((s) => !s)} aria-label={showPassword ? "Hide password" : "Show password"} aria-pressed={showPassword} className={cn("absolute right-2 top-1/2 grid size-9 -translate-y-1/2 place-items-center rounded-lg text-ag-text-muted hover:text-white", focusRing)}>
                {showPassword ? <EyeOff className="size-[18px]" aria-hidden /> : <Eye className="size-[18px]" aria-hidden />}
              </button>
            </div>
            {mode === "signup" && <p id="password-hint" className="mt-2 text-[13px] text-ag-text-muted">Must be at least 8 characters.</p>}
          </div>
        )}

        <div aria-live="polite" className="min-h-[20px] text-[13px]">
          {error && <p className="text-ag-hard" role="alert">{error}</p>}
          {notice && <p className="text-ag-accent">{notice}</p>}
        </div>

        <button type="submit" disabled={busy !== null} className={cn("inline-flex h-12 w-full items-center justify-center rounded-xl bg-white text-[15px] font-semibold text-black transition-colors duration-ag-hover hover:bg-white/90 disabled:opacity-60", focusRing)}>
          {busy === "email" ? "Please wait…" : mode === "login" ? "Log in" : mode === "signup" ? "Sign up" : "Send reset link"}
        </button>
      </form>

      <p className="mt-7 text-center text-[14px] text-ag-text-muted">
        {mode === "login" ? "Don't have an account? " : "Already have an account? "}
        <button type="button" onClick={() => switchMode(mode === "login" ? "signup" : "login")} className={cn("rounded-sm font-semibold text-white underline-offset-4 hover:underline", focusRing)}>
          {mode === "login" ? "Sign up" : "Log in"}
        </button>
      </p>
      <p className="mt-6 text-center text-[12px] leading-relaxed text-ag-text-faint">
        By continuing you agree to our <Link href="/privacy" className="underline underline-offset-2 hover:text-ag-text-muted">Privacy Policy</Link>.
      </p>
    </div>
  );
}
