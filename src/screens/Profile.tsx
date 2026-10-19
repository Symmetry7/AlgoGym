"use client";
import { Layout } from "@/components/layout/Layout";
import { Portfolio } from "@/components/analytics/Portfolio";
import { TrackerFeedback } from "@/components/analytics/TrackerFeedback";
import { useTracker } from "@/hooks/use-tracker";
import { useAccount } from "@/hooks/use-account";
export default function Profile() {
  const account = useAccount();
  const tracker = useTracker(0);
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
        {account.error && (
          <p role="alert" className="text-sm text-rose-300">
            {account.error.message}
          </p>
        )}
        {account.data && tracker.data ? (
          <Portfolio
            owner
            data={{ ...tracker.data, profile: account.data.profile }}
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
