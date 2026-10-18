"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Check, LoaderCircle, X } from "lucide-react";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";

type Request = { id: string; applicant_name: string; requested_at: string };
export default function SocietyManage({ slug }: { slug: string }) {
  const [requests, setRequests] = useState<Request[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState("");
  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const response = await fetch(
        `/api/societies/manage?slug=${encodeURIComponent(slug)}`,
        { cache: "no-store" },
      );
      const result = await response.json();
      if (!response.ok) throw new Error(result.error);
      setRequests(result.requests);
    } catch (reason) {
      setError(
        reason instanceof Error
          ? reason.message
          : "Review queue could not be loaded.",
      );
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    void load();
  }, [slug]);
  const decide = async (requestId: string, decision: "active" | "rejected") => {
    setBusy(requestId);
    setError("");
    try {
      const response = await fetch(
        `/api/societies/manage?slug=${encodeURIComponent(slug)}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ membershipId: requestId, decision }),
        },
      );
      const result = await response.json();
      if (!response.ok) throw new Error(result.error);
      setRequests((items) => items.filter((item) => item.id !== requestId));
    } catch (reason) {
      setError(
        reason instanceof Error
          ? reason.message
          : "Request could not be updated.",
      );
    } finally {
      setBusy("");
    }
  };
  return (
    <Layout>
      <div className="mx-auto max-w-4xl space-y-7">
        <Link
          href={`/societies/${slug}`}
          className="inline-flex items-center gap-2 text-sm text-[#929bae] hover:text-[#e8edf5]"
        >
          <ArrowLeft size={15} />
          Society profile
        </Link>
        <header>
          <p className="mb-2 text-sm text-[#929bae]">Society administration</p>
          <h1 className="text-2xl font-semibold tracking-tight">
            Membership requests
          </h1>
          <p className="mt-2 text-sm text-[#929bae]">
            Requests are visible to approved society moderators and
            administrators.
          </p>
        </header>
        {error && (
          <p role="alert" className="text-sm text-amber-200">
            {error}
          </p>
        )}
        {loading ? (
          <p
            role="status"
            className="flex items-center gap-2 text-sm text-[#929bae]"
          >
            <LoaderCircle size={15} className="animate-spin" />
            Loading review queue…
          </p>
        ) : !requests.length && !error ? (
          <div className="rounded-md border border-[#252a36] bg-[#10131b] p-5 text-sm text-[#929bae]">
            There are no pending membership requests.
          </div>
        ) : (
          <div className="divide-y divide-[#252a36] border-y border-[#252a36]">
            {requests.map((item) => (
              <div
                key={item.id}
                className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between"
              >
                <div>
                  <p className="text-sm font-medium">{item.applicant_name}</p>
                  <p className="mt-1 text-xs text-[#929bae]">
                    Requested {new Date(item.requested_at).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    disabled={busy === item.id}
                    onClick={() => void decide(item.id, "active")}
                    className="bg-[#a78bfa] text-[#0b0d12] hover:bg-[#b7a2ff]"
                  >
                    {busy === item.id ? (
                      <LoaderCircle className="animate-spin" size={14} />
                    ) : (
                      <Check size={14} />
                    )}
                    Approve
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={busy === item.id}
                    onClick={() => void decide(item.id, "rejected")}
                    className="border-[#2d3342] bg-transparent"
                  >
                    <X size={14} />
                    Decline
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}
