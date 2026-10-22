"use client";
import { useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Link2, Users, LoaderCircle } from "lucide-react";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CollegeAutocomplete } from "@/components/auth/CollegeAutocomplete";
import { useAccount, jsonRequest, type College } from "@/hooks/use-account";
export default function SocietyRegistration() {
  const account = useAccount();
  const router = useRouter();
  const [college, setCollege] = useState<College | null>(null);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  useEffect(() => {
    if (account.data?.profile.colleges)
      setCollege(account.data.profile.colleges);
  }, [account.data?.profile.colleges]);
  async function submit(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      const result = await jsonRequest<{ slug: string }>(
        "/api/societies/register",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: name.trim(),
            description: description.trim(),
            collegeId: college?.id ?? null,
          }),
        },
      );
      router.push(`/societies/${result.slug}?invite=1`);
    } catch (reason) {
      setError(
        reason instanceof Error
          ? reason.message
          : "Your society could not be created.",
      );
      setBusy(false);
    }
  }
  return (
    <Layout>
      <div className="mx-auto max-w-4xl py-4 sm:py-10">
        <header className="mb-8">
          <h1 className="text-2xl font-semibold tracking-tight">
            Create a society
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            A shared space for your programming group. Review new members or
            invite people directly.
          </p>
        </header>
        <div className="grid overflow-hidden rounded-2xl border bg-card md:grid-cols-[.8fr_1.2fr]">
          <aside className="flex flex-col gap-8 border-b bg-muted/20 p-6 sm:p-8 md:border-b-0 md:border-r">
            <div className="flex size-12 items-center justify-center rounded-xl border border-primary/25 bg-primary/10 text-primary">
              <Users size={24} />
            </div>
            <div>
              <h2 className="text-lg font-medium">Your group, together.</h2>
              <p className="mt-3 text-sm leading-6 text-muted-foreground">
                Start a college society, a study circle, or a team of friends.
              </p>
            </div>
            <div className="mt-auto flex gap-3 text-sm leading-6 text-muted-foreground">
              <Link2 className="mt-1 shrink-0 text-primary" size={18} />
              <p>
                Share an invite link with trusted members. Other students can
                request access for your review.
              </p>
            </div>
          </aside>
          <form onSubmit={submit} className="space-y-6 p-6 sm:p-8">
            <label className="block text-sm font-medium">
              Society name
              <Input
                autoComplete="organization"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                minLength={3}
                maxLength={100}
                disabled={busy}
                placeholder="e.g. Campus Coding Club"
                className="mt-2 h-11"
              />
            </label>
            <div>
              <p className="mb-2 text-sm font-medium">
                College{" "}
                <span className="font-normal text-muted-foreground">
                  (optional)
                </span>
              </p>
              <CollegeAutocomplete value={college} onSelect={setCollege} />
              {college && (
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => setCollege(null)}
                  className="mt-2 text-xs text-muted-foreground underline underline-offset-4"
                >
                  Remove college
                </button>
              )}
            </div>
            <label className="block text-sm font-medium">
              About your group{" "}
              <span className="font-normal text-muted-foreground">
                (optional)
              </span>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                maxLength={2000}
                rows={3}
                disabled={busy}
                placeholder="What do you practice together?"
                className="mt-2 w-full rounded-md border bg-background p-3 text-sm font-normal leading-6 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
            </label>
            {error && (
              <p role="alert" className="text-sm text-destructive">
                {error}
              </p>
            )}
            <Button type="submit" disabled={busy} className="h-11 w-full">
              {busy ? (
                <LoaderCircle size={16} className="animate-spin" />
              ) : (
                <ArrowRight size={16} />
              )}{" "}
              {busy ? "Creating society…" : "Create society"}
            </Button>
          </form>
        </div>
      </div>
    </Layout>
  );
}
