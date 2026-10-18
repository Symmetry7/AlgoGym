"use client";
import { useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { LoaderCircle, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useAuth } from "@/contexts/AuthContext";
import { AlgoGymLogo } from "@/components/brand/AlgoGymLogo";
import { GoogleMark } from "@/components/auth/GoogleMark";

export function SignInDialog() {
  const { user, signInWithGoogle, refreshSession } = useAuth();
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [emailOpen, setEmailOpen] = useState(false);
  const [mode, setMode] = useState<"login" | "signup" | "reset">("login");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  useEffect(() => {
    if (new URLSearchParams(window.location.search).has("auth_error"))
      setError(
        "Sign-in could not be completed. Try again in this browser, or request a new email link.",
      );
  }, []);
  const destination = () => { const next = new URLSearchParams(window.location.search).get("next") ?? ""; return /^\/societies\/join\/[a-f0-9]{64}$/.test(next) ? next : "/dashboard"; };
  useEffect(() => {
    if (user) router.replace(destination());
  }, [user, router]);
  const google = async () => {
    setPending(true);
    setError("");
    try {
      await signInWithGoogle(destination());
    } catch (reason) {
      setError(
        reason instanceof Error
          ? reason.message
          : "Google sign-in could not be started.",
      );
      setPending(false);
    }
  };
  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setPending(true);
    setError("");
    setMessage("");
    const form = new FormData(event.currentTarget);
    try {
      const response = await fetch("/api/auth/email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: mode,
          next: destination(),
          email: form.get("email"),
          ...(mode !== "reset" ? { password: form.get("password") } : {}),
          ...(mode === "signup" ? { fullName: form.get("fullName") } : {}),
        }),
      });
      const result = await response.json();
      if (!response.ok)
        throw new Error(result.error || "Sign-in could not be completed.");
      if (result.authenticated) {
        await refreshSession();
        router.replace(destination());
        router.refresh();
      } else
        setMessage(
          result.confirmationRequired
            ? "Check your inbox to confirm your email. Open the link in this browser, then continue your setup."
            : result.message,
        );
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Please try again.");
    } finally {
      setPending(false);
    }
  };
  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open) router.push("/");
      }}
    >
      <DialogContent className="max-h-[calc(100dvh-2rem)] max-w-[420px] overflow-y-auto rounded-lg bg-card p-6 sm:p-8">
        <AlgoGymLogo className="mb-4 w-[112px]" />
        <DialogHeader className="space-y-2 pr-3">
          <DialogTitle className="text-2xl font-semibold tracking-tight">
            Welcome to AlgoGym
          </DialogTitle>
          <DialogDescription>
            Join a community of competitive programmers.
          </DialogDescription>
        </DialogHeader>
        <div className="mt-2 space-y-3">
          <Button
            onClick={() => void google()}
            disabled={pending}
            variant="outline"
            className="h-11 w-full bg-background"
          >
            {pending && !emailOpen ? (
              <LoaderCircle className="size-4 animate-spin" />
            ) : (
              <GoogleMark />
            )}
            Continue with Google
          </Button>
          {!emailOpen ? (
            <Button
              onClick={() => setEmailOpen(true)}
              disabled={pending}
              variant="outline"
              className="h-11 w-full bg-transparent"
            >
              <Mail className="size-4" />
              Continue with Email
            </Button>
          ) : (
            <>
              <div
                className="flex gap-5 border-b border-border pt-2"
                role="group"
                aria-label="Email authentication"
              >
                {(["login", "signup"] as const).map((item) => (
                  <button
                    aria-pressed={mode === item}
                    key={item}
                    disabled={pending}
                    onClick={() => {
                      setMode(item);
                      setError("");
                      setMessage("");
                    }}
                    className={`border-b-2 pb-2 text-sm ${mode === item ? "border-primary text-foreground" : "border-transparent text-muted-foreground"}`}
                  >
                    {item === "login" ? "Sign in" : "Create account"}
                  </button>
                ))}
              </div>
              <form
                onSubmit={(event) => void submit(event)}
                className="space-y-4 pt-1"
              >
                {mode === "reset" && (
                  <p className="text-sm text-muted-foreground">
                    Enter your account email to receive a password recovery
                    link.
                  </p>
                )}
                {mode === "signup" && (
                  <div className="space-y-2">
                    <Label htmlFor="auth-name">Full name</Label>
                    <Input
                      id="auth-name"
                      name="fullName"
                      autoComplete="name"
                      required
                      minLength={2}
                      maxLength={80}
                      disabled={pending}
                    />
                  </div>
                )}
                <div className="space-y-2">
                  <Label htmlFor="auth-email">Email</Label>
                  <Input
                    id="auth-email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    maxLength={254}
                    disabled={pending}
                  />
                </div>
                {mode !== "reset" && (
                  <div className="space-y-2">
                    <Label htmlFor="auth-password">Password</Label>
                    <Input
                      id="auth-password"
                      name="password"
                      type="password"
                      autoComplete={
                        mode === "signup" ? "new-password" : "current-password"
                      }
                      required
                      minLength={mode === "signup" ? 8 : 1}
                      maxLength={128}
                      disabled={pending}
                    />
                    {mode === "signup" && (
                      <p className="text-xs text-muted-foreground">
                        Use at least 8 characters.
                      </p>
                    )}
                  </div>
                )}
                <Button
                  type="submit"
                  disabled={pending}
                  className="h-11 w-full"
                >
                  {pending && <LoaderCircle className="size-4 animate-spin" />}
                  {mode === "signup"
                    ? "Create account"
                    : mode === "reset"
                      ? "Send recovery link"
                      : "Sign in"}
                </Button>
                {mode === "login" && (
                  <button
                    type="button"
                    onClick={() => {
                      setMode("reset");
                      setError("");
                    }}
                    className="text-xs text-muted-foreground hover:text-foreground"
                  >
                    Forgot your password?
                  </button>
                )}
              </form>
            </>
          )}
          {error && (
            <p role="alert" className="text-sm text-red-300">
              {error}
            </p>
          )}
          {message && (
            <p
              role="status"
              className="rounded-md border border-emerald-500/20 bg-emerald-500/5 p-3 text-sm text-emerald-300"
            >
              {message}
            </p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
