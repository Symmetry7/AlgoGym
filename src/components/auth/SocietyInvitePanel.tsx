"use client";
import { useEffect, useState } from "react";
import { Check, Copy, Link2, LoaderCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { jsonRequest } from "@/hooks/use-account";
export function SocietyInvitePanel({
  societyId,
  name,
}: {
  societyId: string;
  name: string;
}) {
  const [open, setOpen] = useState(false);
  const [invite, setInvite] = useState<{ url: string; qr: string } | null>(
    null,
  );
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    if (new URLSearchParams(window.location.search).get("invite") === "1")
      setOpen(true);
  }, []);
  async function load() {
    setBusy(true);
    setError("");
    try {
      setInvite(
        await jsonRequest("/api/societies/invite", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "link", societyId }),
        }),
      );
    } catch (reason) {
      setError(
        reason instanceof Error
          ? reason.message
          : "Invitation could not be loaded.",
      );
    } finally {
      setBusy(false);
    }
  }
  useEffect(() => {
    if (open && !invite) void load();
  }, [open, societyId]);
  async function copy() {
    try {
      await navigator.clipboard.writeText(invite!.url);
      setCopied(true);
    } catch {
      setError("Copy was unavailable. Select and copy the link below.");
    }
  }
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm">
          <Link2 size={15} />
          Invite members
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[90svh] max-w-2xl overflow-y-auto rounded-2xl p-6 sm:p-8">
        <DialogTitle className="pr-6 text-xl">
          Invite people to {name}
        </DialogTitle>
        <DialogDescription>
          Share this invitation. New members join immediately after signing in.
        </DialogDescription>
        {busy ? (
          <p
            role="status"
            className="flex gap-2 py-10 text-sm text-muted-foreground"
          >
            <LoaderCircle size={18} className="animate-spin" />
            Preparing your invitation…
          </p>
        ) : (
          invite && (
            <div className="mt-4 grid items-center gap-6 sm:grid-cols-[1fr_180px]">
              <div className="min-w-0">
                <label htmlFor="society-invite" className="text-sm font-medium">
                  Invite link
                </label>
                <input
                  id="society-invite"
                  readOnly
                  value={invite.url}
                  onFocus={(e) => e.currentTarget.select()}
                  className="mt-3 h-11 w-full rounded-md border bg-muted/30 px-3 text-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                />
                <Button
                  onClick={() => void copy()}
                  className="mt-3 h-11 w-full"
                >
                  {copied ? <Check size={16} /> : <Copy size={16} />}{" "}
                  {copied ? "Link copied" : "Copy invite link"}
                </Button>
                <p
                  role="status"
                  className="mt-3 text-xs leading-5 text-muted-foreground"
                >
                  This link stays the same when you reopen it.
                </p>
              </div>
              <figure className="mx-auto">
                <img
                  src={invite.qr}
                  width={180}
                  height={180}
                  alt={`Scan to join ${name}`}
                  className="rounded-lg bg-white"
                />
                <figcaption className="mt-2 text-center text-xs text-muted-foreground">
                  Scan to join
                </figcaption>
              </figure>
            </div>
          )
        )}
        {error && (
          <div role="alert" className="text-sm text-destructive">
            {error}
            {!invite && (
              <Button
                variant="outline"
                className="ml-3"
                disabled={busy}
                onClick={() => void load()}
              >
                Retry
              </Button>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
