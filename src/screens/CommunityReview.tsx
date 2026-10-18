"use client";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ExternalLink, LoaderCircle, ShieldCheck } from "lucide-react";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CollegeAutocomplete } from "@/components/auth/CollegeAutocomplete";
import { jsonRequest, type College } from "@/hooks/use-account";
interface ReviewItem {
  id: string;
  name: string;
  description?: string;
  college?: string;
  evidence?: string;
  city?: string;
  state?: string;
  createdAt: string;
}
export default function CommunityReview() {
  const query = useQuery({
    queryKey: ["community-review"],
    queryFn: () =>
      jsonRequest<{ societies: ReviewItem[]; colleges: ReviewItem[] }>(
        "/api/admin/review",
      ),
    retry: false,
  });
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const decide = async (
    kind: string,
    id: string,
    approve: boolean,
    reason: string,
    collegeId?: string,
  ) => {
    setBusy(id);
    setError("");
    try {
      await jsonRequest("/api/admin/review", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          kind,
          id,
          approve,
          reason,
          collegeId: collegeId ?? null,
        }),
      });
      setMessage(
        `Request ${approve ? "approved" : "declined"}. The decision is recorded in the audit log.`,
      );
      await query.refetch();
    } catch (reason) {
      setError(
        reason instanceof Error ? reason.message : "Review could not be saved.",
      );
    } finally {
      setBusy("");
    }
  };
  return (
    <Layout>
      <div className="mx-auto max-w-5xl space-y-7">
        <header>
          <p className="mb-2 text-xs text-muted-foreground">
            Authorized platform operations
          </p>
          <h1 className="flex items-center gap-3 text-2xl font-semibold tracking-tight">
            <ShieldCheck size={23} className="text-primary" />
            Community Review
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Approve legitimate society applications and resolve canonical
            institution requests.
          </p>
        </header>
        {message && (
          <p role="status" className="text-xs text-primary">
            {message}
          </p>
        )}
        {error && (
          <p role="alert" className="text-sm text-rose-300">
            {error}
          </p>
        )}
        {query.isLoading ? (
          <p role="status" className="flex gap-2 text-sm text-muted-foreground">
            <LoaderCircle className="animate-spin" size={15} />
            Checking administrative access…
          </p>
        ) : query.error ? (
          <section className="rounded-lg border p-7">
            <h2 className="text-base font-medium">
              Administrative access required
            </h2>
            <p
              role="alert"
              className="mt-3 text-sm leading-6 text-muted-foreground"
            >
              {query.error.message}
            </p>
            <p className="mt-3 text-xs leading-6 text-muted-foreground">
              A project owner must designate the initial platform administrator.
              Signing in or registering a society does not grant this role.
            </p>
          </section>
        ) : query.data ? (
          <>
            {(["societies", "colleges"] as const).map((kind) => (
              <section key={kind} className="space-y-4">
                <h2 className="text-sm font-medium">
                  {kind === "societies"
                    ? "Society applications"
                    : "Missing college requests"}{" "}
                  · {query.data[kind].length}
                </h2>
                {query.data[kind].length ? (
                  query.data[kind].map((item) => (
                    <ReviewCard
                      key={item.id}
                      item={item}
                      kind={kind === "societies" ? "society" : "college"}
                      busy={busy === item.id}
                      decide={decide}
                    />
                  ))
                ) : (
                  <p className="rounded-lg border border-dashed p-7 text-sm text-muted-foreground">
                    No pending requests.
                  </p>
                )}
              </section>
            ))}
          </>
        ) : null}
      </div>
    </Layout>
  );
}
function ReviewCard({
  item,
  kind,
  busy,
  decide,
}: {
  item: ReviewItem;
  kind: string;
  busy: boolean;
  decide: (
    kind: string,
    id: string,
    approve: boolean,
    reason: string,
    collegeId?: string,
  ) => Promise<void>;
}) {
  const [reason, setReason] = useState("");
  const [college, setCollege] = useState<College | null>(null);
  return (
    <article className="space-y-4 rounded-lg border bg-card p-5">
      <div>
        <h3 className="text-sm font-medium">{item.name}</h3>
        <p className="mt-1 text-xs text-muted-foreground">
          {item.college ?? [item.city, item.state].filter(Boolean).join(", ")} ·
          Submitted {new Date(item.createdAt).toLocaleDateString()}
        </p>
        {item.description && (
          <p className="mt-3 text-xs leading-6 text-muted-foreground">
            {item.description}
          </p>
        )}
      </div>
      {item.evidence && (
        <a
          href={item.evidence}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-xs text-primary"
        >
          Review public evidence
          <ExternalLink size={12} />
        </a>
      )}
      {kind === "college" && (
        <div>
          <p className="mb-2 text-xs">
            Match an existing canonical institution, or approve this reviewed
            name as a new institution.
          </p>
          <CollegeAutocomplete value={college} onSelect={setCollege} />
          {college && (
            <button
              onClick={() => setCollege(null)}
              className="mt-2 text-[11px] text-muted-foreground"
            >
              Clear canonical match
            </button>
          )}
        </div>
      )}
      <label className="block text-xs">
        Decision reason
        <Input
          value={reason}
          onChange={(event) => setReason(event.target.value)}
          maxLength={500}
          placeholder="Record the evidence or reason for this decision"
          className="mt-2"
        />
      </label>
      <div className="flex flex-wrap gap-3">
        <Button
          size="sm"
          disabled={busy}
          onClick={() => void decide(kind, item.id, true, reason, college?.id)}
        >
          {busy && <LoaderCircle size={13} className="animate-spin" />}
          {kind === "college"
            ? college
              ? "Approve canonical match"
              : "Approve new institution"
            : "Approve society"}
        </Button>
        <Button
          size="sm"
          variant="outline"
          disabled={busy || !reason.trim()}
          onClick={() => void decide(kind, item.id, false, reason)}
        >
          Decline
        </Button>
      </div>
    </article>
  );
}
