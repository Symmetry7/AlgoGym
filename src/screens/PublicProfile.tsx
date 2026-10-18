"use client";
import { useQuery } from "@tanstack/react-query";
import { Layout } from "@/components/layout/Layout";
import {
  Portfolio,
  type PortfolioData,
} from "@/components/analytics/Portfolio";
import { jsonRequest } from "@/hooks/use-account";
import { Button } from "@/components/ui/button";
export default function PublicProfile({ username }: { username: string }) {
  const query = useQuery({
    queryKey: ["public-portfolio", username],
    queryFn: () =>
      jsonRequest<PortfolioData>(
        `/api/public-profile?username=${encodeURIComponent(username)}`,
      ),
    retry: 1,
  });
  return (
    <Layout>
      <div className="space-y-6">
        <header>
          <p className="mb-2 text-xs text-muted-foreground">
            AlgoGym portfolio
          </p>
          <h2 className="text-xl font-medium">@{username}</h2>
        </header>
        {query.isLoading ? (
          <div
            role="status"
            aria-label="Loading public portfolio"
            className="h-[600px] animate-pulse rounded-lg border bg-card"
          />
        ) : query.error ? (
          <section className="rounded-lg border p-8">
            <p role="alert" className="text-sm text-muted-foreground">
              {query.error.message}
            </p>
            <Button
              size="sm"
              variant="outline"
              className="mt-5"
              onClick={() => void query.refetch()}
            >
              Retry profile
            </Button>
          </section>
        ) : query.data ? (
          <Portfolio data={query.data} />
        ) : null}
      </div>
    </Layout>
  );
}
