"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowUpRight,
  Check,
  MapPin,
  Plus,
  Search,
  ShieldCheck,
  Users,
} from "lucide-react";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CollegeAutocomplete } from "@/components/auth/CollegeAutocomplete";
import { useAuth } from "@/contexts/AuthContext";
import { jsonRequest, type College } from "@/hooks/use-account";
export interface SocietyData {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  college_id: string | null;
  join_policy?: "open" | "approval" | "invite";
  colleges: { name: string; city: string | null; state: string | null } | null;
  summary: {
    members: number;
    eligible_members: number;
    average_cf_rating: number | null;
  };
}
export interface SocietyDirectory {
  societies: SocietyData[];
  memberships: Array<{ society_id: string; status: string; role: string }>;
  members: Array<{
    username: string;
    display_name: string;
    role: string;
    joined_at: string;
  }>;
  total: number;
}
export default function Societies() {
  const { user } = useAuth();
  const [search, setSearch] = useState("");
  const [debounced, setDebounced] = useState("");
  const [college, setCollege] = useState<College | null>(null);
  const [page, setPage] = useState(0);
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");
  useEffect(() => {
    const timeout = setTimeout(() => {
      setDebounced(search);
      setPage(0);
    }, 300);
    return () => clearTimeout(timeout);
  }, [search]);
  const params = new URLSearchParams({
    search: debounced,
    offset: String(page * 50),
  });
  if (college) params.set("collegeId", college.id);
  const query = useQuery({
    queryKey: ["society-directory", user?.id, params.toString()],
    queryFn: () => jsonRequest<SocietyDirectory>(`/api/societies?${params}`),
    staleTime: 30000,
    retry: 1,
  });
  const join = async (id: string) => {
    setBusy(id);
    setError("");
    try {
      await jsonRequest("/api/societies", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ societyId: id }),
      });
      await query.refetch();
    } catch (reason) {
      setError(
        reason instanceof Error ? reason.message : "Membership request failed.",
      );
    } finally {
      setBusy("");
    }
  };
  return (
    <Layout>
      <div className="mx-auto max-w-6xl space-y-6">
        <header className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="mb-2 text-xs text-muted-foreground">
              Find your people
            </p>
            <h1 className="text-2xl font-semibold tracking-tight">
              College Communities
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Find a programming group, or start your own.
            </p>
          </div>
          <Button asChild size="sm" variant="outline">
            <Link href="/societies/register">
              <Plus size={14} />
              Create a society
            </Link>
          </Button>
        </header>
        <div className="grid gap-4 rounded-lg border bg-card p-5 md:grid-cols-2">
          <label className="relative">
            <span className="mb-2 block text-[11px] text-muted-foreground">
              Society name
            </span>
            <Input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search CP societies"
              maxLength={80}
            />
          </label>
          <div>
            <p className="mb-2 text-[11px] text-muted-foreground">College</p>
            <CollegeAutocomplete
              value={college}
              onSelect={(value) => {
                setCollege(value);
                setPage(0);
              }}
            />
            {college && (
              <button
                onClick={() => {
                  setCollege(null);
                  setPage(0);
                }}
                className="mt-2 text-[11px] text-primary"
              >
                Clear college filter
              </button>
            )}
          </div>
        </div>
        {error && (
          <p role="alert" className="text-sm text-rose-300">
            {error}
          </p>
        )}
        {query.error ? (
          <div role="alert" className="rounded-lg border p-6">
            <p className="text-sm text-rose-300">{query.error.message}</p>
            <Button
              variant="outline"
              size="sm"
              className="mt-4"
              onClick={() => void query.refetch()}
            >
              Retry communities
            </Button>
          </div>
        ) : query.isLoading ? (
          <div
            role="status"
            aria-label="Loading approved societies"
            className="h-72 animate-pulse rounded-lg border bg-card"
          />
        ) : query.data?.societies.length ? (
          <>
            <div className="grid gap-4 md:grid-cols-2">
              {query.data.societies.map((society) => {
                const membership = query.data?.memberships.find(
                  (item) => item.society_id === society.id,
                );
                return (
                  <article
                    key={society.id}
                    className="rounded-lg border bg-card p-5"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <Link
                        href={`/societies/${society.slug}`}
                        className="text-base font-medium hover:text-primary"
                      >
                        {society.name}
                        <ArrowUpRight size={13} className="ml-1 inline" />
                      </Link>
                      
                    </div>
                    <p className="mt-3 flex items-start gap-2 text-xs leading-6 text-muted-foreground">
                      <MapPin size={13} className="mt-1 shrink-0" />
                      {society.colleges?.name ?? "Independent community"}
                    </p>
                    <p className="mt-3 line-clamp-2 min-h-10 text-xs leading-5 text-muted-foreground">
                      {society.description ||
                        "A programming community for consistent practice and shared progress."}
                    </p>
                    <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t pt-4">
                      <span className="inline-flex items-center gap-1.5 text-[11px] text-muted-foreground">
                        <Users size={12} />
                        {society.summary.members} members
                      </span>
                      {membership?.status === "active" ? (
                        <span className="text-xs text-emerald-400">
                          ✓ Member
                        </span>
                      ) : membership?.status === "pending" ? (
                        <span className="text-xs text-amber-300">Request pending</span>
                      ) : membership?.status === "suspended" ? (
                        <span className="text-xs text-muted-foreground">Membership unavailable</span>
                      ) : society.join_policy === "invite" ? (
                        <span className="text-xs text-muted-foreground">Invitation only</span>
                      ) : user ? (
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={busy === society.id}
                          onClick={() => void join(society.id)}
                        >
                          {society.join_policy === "open" ? "Join society" : "Request to join"}
                        </Button>
                      ) : (
                        <Link href="/sign-in" className="text-xs text-primary">
                          Sign in to join
                        </Link>
                      )}
                    </div>
                  </article>
                );
              })}
            </div>
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>{query.data.total} matching communities</span>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page === 0}
                  onClick={() => setPage(page - 1)}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={(page + 1) * 50 >= query.data.total}
                  onClick={() => setPage(page + 1)}
                >
                  Next
                </Button>
              </div>
            </div>
          </>
        ) : (
          <section className="rounded-lg border border-dashed px-6 py-14 text-center">
            <Users size={28} className="mx-auto mb-4 text-muted-foreground" />
            <h2 className="text-base font-medium">
              No societies match yet.
            </h2>
            <p className="mt-3 text-sm text-muted-foreground">
              Try another college or create your own society.
            </p>
            <Button asChild size="sm" variant="outline" className="mt-5">
              <Link href="/societies/register">Create a society</Link>
            </Button>
          </section>
        )}
        <p className="text-[11px] leading-6 text-muted-foreground">
          Join an open society, request approval, or use an invitation link.
        </p>
      </div>
    </Layout>
  );
}
