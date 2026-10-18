"use client";
import { useState, type FormEvent } from "react";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
export default function ResetPasswordPage() {
  const [busy, setBusy] = useState(false); const [error, setError] = useState(""); const [done, setDone] = useState(false);
  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault(); setBusy(true); setError(""); const form = new FormData(event.currentTarget);
    if (form.get("password") !== form.get("confirm")) { setError("The passwords do not match."); setBusy(false); return; }
    try { const response = await fetch("/api/auth/email", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "update-password", password: form.get("password") }) }); const result = await response.json(); if (!response.ok) throw new Error(result.error); setDone(true); }
    catch (reason) { setError(reason instanceof Error ? reason.message : "Password could not be updated."); } finally { setBusy(false); }
  };
  return <main className="grid min-h-screen place-items-center px-4"><section className="w-full max-w-sm space-y-5 rounded-lg border bg-card p-6"><h1 className="text-xl font-semibold">Choose a new password</h1>{done ? <><p role="status" className="text-sm text-emerald-300">Your password has been updated.</p><Button asChild className="w-full"><Link href="/dashboard">Continue to Dashboard</Link></Button></> : <form onSubmit={(event) => void submit(event)} className="space-y-4"><div className="space-y-2"><Label htmlFor="new-password">New password</Label><Input id="new-password" name="password" type="password" autoComplete="new-password" minLength={8} maxLength={128} required disabled={busy}/></div><div className="space-y-2"><Label htmlFor="confirm-password">Confirm password</Label><Input id="confirm-password" name="confirm" type="password" autoComplete="new-password" minLength={8} required disabled={busy}/></div>{error && <p role="alert" className="text-sm text-red-300">{error}</p>}<Button disabled={busy} className="w-full">{busy ? "Updating…" : "Update password"}</Button></form>}</section></main>;
}
