"use client";
import { useState } from "react";
import Link from "next/link";
import { Copy, Download, ArrowLeft } from "lucide-react";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { useAccount } from "@/hooks/use-account";
import "./profile-card.css";
export default function ProfileCard() {
  const account = useAccount();
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(
        `${window.location.origin}/u/${account.data?.profile.username}`,
      );
      setMessage("Public portfolio link copied.");
    } catch {
      setError(
        "Clipboard access is unavailable. Copy your public profile URL from Settings.",
      );
    }
  };
  return (
    <Layout>
      <div className="mx-auto max-w-4xl space-y-6">
        <Button asChild variant="ghost" size="sm">
          <Link href="/profile">
            <ArrowLeft size={14} />
            Back to portfolio
          </Link>
        </Button>
        <header>
          <p className="mb-2 text-xs text-muted-foreground">
            A record worth sharing
          </p>
          <h1 className="text-2xl font-semibold tracking-tight">
            Your AlgoGym Card
          </h1>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            A downloadable snapshot of your actual synchronized progress.
            Generating a card does not make your account public.
          </p>
        </header>
        {error && (
          <p role="alert" className="text-sm text-rose-300">
            {error}
          </p>
        )}
        {message && (
          <p role="status" className="text-sm text-primary">
            {message}
          </p>
        )}
        <div className="ag-card-stage">
          <div className="ag-card-stage-glow" aria-hidden="true" />
          <img
            src="/api/profile-card"
            alt="Your AlgoGym profile card with total solves, active days, coins and Codeforces rating"
            width={720}
            height={1000}
            className="ag-card-preview"
            onError={() => setError("Your card could not be loaded. Synchronize your profile and retry.")}
            loading="eager"
          />
        </div>
        <div className="flex flex-wrap gap-3">
          <Button asChild>
            <a
              href="/api/profile-card?download=1"
              download="algogym-profile.svg"
            >
              <Download size={14} />
              Download SVG
            </a>
          </Button>
          <Button
            variant="outline"
            onClick={() => void copy()}
            disabled={!account.data?.profile.username}
          >
            <Copy size={14} />
            Copy public portfolio link
          </Button>
        </div>
      </div>
    </Layout>
  );
}
