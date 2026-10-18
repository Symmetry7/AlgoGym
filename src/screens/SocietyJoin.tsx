"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { Users, LoaderCircle } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { jsonRequest } from "@/hooks/use-account";
export default function SocietyJoin({ token }: { token: string }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const query = useQuery({
    queryKey: ["society-invite", token],
    queryFn: () =>
      jsonRequest<{
        society: { name: string; description: string; college: string | null };
      }>(`/api/societies/invite?token=${encodeURIComponent(token)}`),
    retry: 1,
  });
  async function join() {
    setBusy(true);
    setError("");
    try {
      const result = await jsonRequest<{ slug: string }>(
        "/api/societies/invite",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "join", token }),
        },
      );
      router.replace(`/societies/${result.slug}`);
    } catch (reason) {
      setError(
        reason instanceof Error
          ? reason.message
          : "Could not join this society.",
      );
      setBusy(false);
    }
  }
  return (
    <Layout>
      <section className="mx-auto my-10 max-w-lg rounded-2xl border bg-card p-6 sm:p-10">
        <Users size={28} className="mb-6 text-primary" />
        {query.isLoading ? (
          <p role="status">Loading invitation…</p>
        ) : query.error ? (
          <>
            <h1 className="text-xl font-medium">Invitation unavailable</h1>
            <p role="alert" className="mt-3 text-sm text-muted-foreground">
              {query.error.message}
            </p>
            <Button
              variant="outline"
              className="mt-5"
              onClick={() => void query.refetch()}
            >
              Try again
            </Button>
          </>
        ) : (
          query.data && (
            <>
              <p className="text-xs text-muted-foreground">
                You’re invited to join
              </p>
              <h1 className="mt-2 text-2xl font-semibold">
                {query.data.society.name}
              </h1>
              {query.data.society.college && (
                <p className="mt-2 text-sm text-muted-foreground">
                  {query.data.society.college}
                </p>
              )}
              <p className="mt-5 text-sm leading-6 text-muted-foreground">
                {query.data.society.description ||
                  "Join the group and practice together on AlgoGym."}
              </p>
              {user ? (
                <Button
                  className="mt-7 h-11 w-full"
                  disabled={busy}
                  onClick={() => void join()}
                >
                  {busy && <LoaderCircle size={16} className="animate-spin" />}
                  {busy ? "Joining…" : "Join society"}
                </Button>
              ) : (
                <Button asChild disabled={loading} className="mt-7 h-11 w-full">
                  <Link
                    href={`/sign-in?next=${encodeURIComponent(`/societies/join/${token}`)}`}
                  >
                    Sign in to join
                  </Link>
                </Button>
              )}
              {error && (
                <p role="alert" className="mt-4 text-sm text-destructive">
                  {error}
                </p>
              )}
            </>
          )
        )}
      </section>
    </Layout>
  );
}
