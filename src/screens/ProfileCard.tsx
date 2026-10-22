"use client";
import { useState } from "react";
import Link from "next/link";
import { Download, ArrowLeft, Loader2 } from "lucide-react";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { downloadProfileCard } from "@/lib/profile-card-download";
import "./profile-card.css";

export default function ProfileCard() {
  const [error, setError] = useState("");
  const [downloading, setDownloading] = useState(false);
  const [ready, setReady] = useState(false);
  const download = async () => {
    setError("");
    setDownloading(true);
    try { await downloadProfileCard(); }
    catch (cause) { setError(cause instanceof Error ? cause.message : "Your download failed. Please retry."); }
    finally { setDownloading(false); }
  };
  return (
    <Layout>
      <div className="ag-card-page">
        <Button asChild variant="ghost" size="sm" className="ag-card-back">
          <Link href="/profile"><ArrowLeft size={14} />Back to portfolio</Link>
        </Button>
        <header className="ag-card-heading">
          <div>
            <p className="ag-card-eyebrow">THE WORK ADDS UP</p>
            <h1>Your progress. Your signature.</h1>
            <p>A little proof of the hours you put in. Take your AlgoGym card with you.</p>
          </div>
          <span className="ag-card-edition">THE CODER CARD <span>01 / PERSONAL EDITION</span></span>
        </header>
        <div className="ag-card-stage">
          <div className="ag-card-stage-glow" aria-hidden="true" />
          <img
            src="/api/profile-card"
            alt="Your AlgoGym profile card with total solves, active days, coins and Codeforces rating"
            width={1080} height={720} className="ag-card-preview"
            onLoad={() => setReady(true)}
            onError={() => { setReady(false); setError("Your card could not be loaded. Synchronize your profile and retry."); }}
            loading="eager"
          />
        </div>
        <footer className="ag-card-footer">
          <div><p>Made from your real progress.</p><span>High-resolution JPEG · Your account stays private.</span></div>
          <Button onClick={() => void download()} disabled={!ready || downloading} className="ag-card-download">
            {downloading ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />}
            {downloading ? "Preparing JPEG…" : "Download JPEG"}
          </Button>
        </footer>
        {error && <p role="alert" className="text-sm text-rose-300">{error}</p>}
      </div>
    </Layout>
  );
}
