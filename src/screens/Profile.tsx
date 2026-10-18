"use client";
import { useState } from "react";
import { Layout } from "@/components/layout/Layout";
import { Portfolio } from "@/components/analytics/Portfolio";
import { TrackerFeedback } from "@/components/analytics/TrackerFeedback";
import { useTracker } from "@/hooks/use-tracker";
import { useAccount, jsonRequest } from "@/hooks/use-account";
export default function Profile() {
  const account = useAccount();
  const tracker = useTracker(0);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const privacy = async (isPublic: boolean) => {
    setPending(true);
    setError("");
    try {
      await jsonRequest("/api/account/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isPublic }),
      });
      await account.refetch();
    } catch (reason) {
      setError(
        reason instanceof Error
          ? reason.message
          : "Visibility could not be changed.",
      );
    } finally {
      setPending(false);
    }
  };
  return (
    <Layout>
      <div className="space-y-6">
        <header>
          <p className="mb-2 text-xs text-muted-foreground">
            Your coding portfolio
          </p>
          <h2 className="text-2xl font-semibold tracking-tight">
            A record of your practice.
          </h2>
        </header>
        <TrackerFeedback tracker={tracker} />
        {error && (
          <p role="alert" className="text-sm text-rose-300">
            {error}
          </p>
        )}
        {account.error && (
          <p role="alert" className="text-sm text-rose-300">
            {account.error.message}
          </p>
        )}
        {account.data && tracker.data ? (
          <Portfolio
            owner
            data={{ ...tracker.data, profile: account.data.profile }}
            privacyPending={pending}
            onPrivacyChange={(value) => void privacy(value)}
          />
        ) : (
          <div
            role="status"
            aria-label="Loading coding portfolio"
            className="h-[600px] animate-pulse rounded-lg border bg-card"
          />
        )}
      </div>
    </Layout>
  );
}
