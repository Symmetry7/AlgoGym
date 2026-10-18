import Link from "next/link";
import { CheckCircle2, ExternalLink } from "lucide-react";
import {
  CodingPlatformMark,
  codingProviders,
} from "@/components/brand/CodingPlatformMark";
import {
  codingProfileUrl,
  type VerifiedProfile,
} from "@/lib/profile-verification";

export function ConnectedProfilesPanel({
  profiles,
  owner,
}: {
  profiles: VerifiedProfile[];
  owner: boolean;
}) {
  const providers = owner
    ? codingProviders
    : codingProviders.filter((provider) =>
        profiles.some((profile) => profile.platform === provider.id),
      );
  return (
    <section
      className="mt-5 rounded-2xl border bg-card p-3"
      aria-label="Connected coding profiles"
    >
      <h2 className="px-2 pb-3 pt-1 text-sm font-medium">Coding accounts</h2>
      <div className="space-y-2">
        {providers.map((provider) => {
          const account = profiles.find(
            (profile) => profile.platform === provider.id,
          );
          const content = (
            <>
              <span className="min-w-0">
                <span className="block text-xs font-medium">
                  {provider.name}
                </span>
                <span className="mt-1 flex items-center gap-1 text-[11px] text-muted-foreground">
                  {account ? (
                    <>
                      <CheckCircle2
                        size={11}
                        className="shrink-0 text-emerald-400"
                      />
                      <span className="truncate">@{account.username}</span>
                      <ExternalLink size={10} className="shrink-0" />
                    </>
                  ) : (
                    "Not connected"
                  )}
                </span>
              </span>
              <CodingPlatformMark
                platform={provider.id}
                className="size-8 rounded-lg"
              />
            </>
          );
          return account ? (
            <a
              key={provider.id}
              href={codingProfileUrl(account.platform, account.username)}
              target="_blank"
              rel="noopener noreferrer"
              className="flex min-h-16 items-center justify-between gap-2 rounded-xl bg-muted/50 p-3 transition-colors hover:bg-muted"
              aria-label={`${provider.name}: ${account.username}, verified`}
            >
              {content}
            </a>
          ) : (
            <div
              key={provider.id}
              className="flex min-h-16 items-center justify-between gap-2 rounded-xl bg-muted/40 p-3"
            >
              {content}
            </div>
          );
        })}
      </div>
      {!providers.length && (
        <p className="px-2 text-xs text-muted-foreground">
          No coding accounts connected.
        </p>
      )}
      {owner && (
        <Link
          href="/onboarding?step=3"
          className="mt-4 flex min-h-11 items-center justify-center rounded-xl bg-primary px-3 text-xs font-medium text-primary-foreground transition-opacity hover:opacity-90"
        >
          Manage connections
        </Link>
      )}
    </section>
  );
}
