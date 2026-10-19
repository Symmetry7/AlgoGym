"use client";
import { useEffect, useRef, useState } from "react";
import { CheckCircle2, Search, ShieldCheck } from "lucide-react";
import { PlatformCard } from "./ProfileOnboarding";
import {
  CodingPlatformMark,
  codingProviders,
  type ProviderId,
} from "@/components/brand/CodingPlatformMark";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  profileVerificationRequest,
  type VerificationStatus,
  type VerifiedProfile,
} from "@/lib/profile-verification";
import "./connections.css";

export function PlatformConnections({
  profiles,
  onVerified,
}: {
  profiles: VerifiedProfile[];
  onVerified: (profile: VerifiedProfile) => void;
}) {
  const [open, setOpen] = useState(false);
  const opener = useRef<HTMLButtonElement | null>(null);
  const [selected, setSelected] = useState<ProviderId>("codeforces");
  const [search, setSearch] = useState("");
  const [pending, setPending] = useState<Partial<Record<ProviderId, boolean>>>(
    {},
  );
  const [handles, setHandles] = useState<Partial<Record<ProviderId, string>>>(
    {},
  );
  const [statusError, setStatusError] = useState("");
  useEffect(() => {
    let active = true;
    profileVerificationRequest<VerificationStatus>({
      action: "status",
      platform: "codeforces",
    })
      .then((result) => {
        if (!active) return;
        setPending(
          Object.fromEntries(
            result.challenges.map((item) => [item.platform, true]),
          ),
        );
        setHandles(
          Object.fromEntries(
            result.challenges.map((item) => [item.platform, item.username]),
          ),
        );
      })
      .catch(() => {
        if (active)
          setStatusError(
            "Pending verification status could not be restored. Open a platform to retry with a new code.",
          );
      });
    return () => {
      active = false;
    };
  }, []);
  const active = codingProviders.find((provider) => provider.id === selected)!;
  const matches = codingProviders.filter((provider) =>
    provider.name.toLowerCase().includes(search.trim().toLowerCase()),
  );
  const status = (id: ProviderId, available: boolean) =>
    profiles.some((profile) => profile.platform === id)
      ? "Verified"
      : pending[id]
        ? "Pending verification"
        : available
          ? "Not connected"
          : "Integration unavailable";
  return (
    <section
      className="connections-panel"
      aria-label="Coding account connections"
    >
      <header className="connections-heading">
        <h2>Coding accounts</h2>
        <p>Choose a platform to connect your profile.</p>
      </header>
      <div className="connections-provider-list">
        {codingProviders.map((provider) => (
          <button
            type="button"
            key={provider.id}
            className="connections-provider-row"
            onClick={(event) => {
              opener.current = event.currentTarget;
              setSelected(provider.id);
              setSearch("");
              setOpen(true);
            }}
          >
            <span>
              <strong>{provider.name}</strong>
              <span
                className={
                  profiles.some((profile) => profile.platform === provider.id)
                    ? "connection-verified"
                    : ""
                }
              >
                {status(provider.id, provider.available)}
              </span>
            </span>
            <CodingPlatformMark platform={provider.id} />
          </button>
        ))}
      </div>
      <p className="connections-security">
        <ShieldCheck size={16} /> No coding-platform passwords required.
      </p>
      {statusError && (
        <p
          role="status"
          className="mt-3 text-xs leading-5 text-muted-foreground"
        >
          {statusError}
        </p>
      )}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent
          className="connections-dialog"
          aria-describedby="connection-description"
          onCloseAutoFocus={(event) => {
            event.preventDefault();
            opener.current?.focus();
          }}
        >
          <div className="connections-sidebar">
            <DialogTitle className="connections-dialog-title">
              Connect a profile
            </DialogTitle>
            <label className="connections-search">
              <Search size={15} aria-hidden="true" />
              <input
                aria-label="Search coding platforms"
                placeholder="Search platforms"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
              />
            </label>
            <nav
              className="connections-picker"
              aria-label="Choose coding platform"
            >
              {matches.map((provider) => (
                <button
                  key={provider.id}
                  type="button"
                  aria-pressed={selected === provider.id}
                  onClick={() => setSelected(provider.id)}
                >
                  <CodingPlatformMark platform={provider.id} />
                  <span>{provider.name}</span>
                  {profiles.some(
                    (profile) => profile.platform === provider.id,
                  ) && (
                    <CheckCircle2
                      className="connection-verified"
                      size={14}
                      aria-label="Verified"
                    />
                  )}
                </button>
              ))}
              {!matches.length && (
                <p className="connections-no-results">No matching platforms.</p>
              )}
            </nav>
            <p className="connections-sidebar-note">
              Your accounts stay yours. AlgoGym checks ownership through public
              profile information.
            </p>
          </div>
          <div className="connections-detail">
            <div className="connections-detail-heading">
              <CodingPlatformMark platform={selected} />
              <div>
                <h3>{active.name}</h3>
                <p
                  className={
                    profiles.some((profile) => profile.platform === selected)
                      ? "connection-verified"
                      : ""
                  }
                >
                  {status(selected, active.available)}
                </p>
              </div>
            </div>
            <DialogDescription
              id="connection-description"
              className="connections-description"
            >
              {active.available
                ? "Verify your handle to connect this account securely."
                : "This platform is not available for connection yet."}
            </DialogDescription>
            {codingProviders
              .filter((provider) => provider.available)
              .map(({ id: platform }) => (
                <div hidden={selected !== platform} key={platform}>
                  <PlatformCard
                    embedded
                    platform={platform}
                    value={{
                      username: handles[platform] ?? "",
                      challenge: null,
                      pending: Boolean(pending[platform]),
                      verified:
                        profiles.find(
                          (profile) => profile.platform === platform,
                        ) ?? null,
                    }}
                    onPendingChange={(value) =>
                      setPending((previous) => ({
                        ...previous,
                        [platform]: value,
                      }))
                    }
                    onVerified={onVerified}
                  />
                </div>
              ))}
            {!active.available && (
              <div className="connections-unavailable">
                <ShieldCheck size={30} strokeWidth={1.3} />
                <h4>Connection support is still in progress</h4>
                <p>
                  Profile verification and activity sync are not available for{" "}
                  {active.name}. Your account will not be marked connected or
                  verified.
                </p>
                <button type="button" onClick={() => setSelected("codeforces")}>
                  Connect Codeforces
                </button>
              </div>
            )}
            <p className="connections-detail-note">
              {selected === "leetcode"
                ? "LeetCode ownership verification does not enable Coins rewards. Individual accepted solutions must be reliably confirmed first."
                : "Verification confirms ownership. Activity synchronization is a separate step."}
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </section>
  );
}
