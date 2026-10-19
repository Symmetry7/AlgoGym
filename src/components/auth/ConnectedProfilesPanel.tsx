import Link from "next/link";
import { Check, ExternalLink, Plus } from "lucide-react";
import { CodingPlatformMark, codingProviders } from "@/components/brand/CodingPlatformMark";
import { codingProfileUrl, type VerifiedProfile } from "@/lib/profile-verification";

export function ConnectedProfilesPanel({ profiles, owner }: { profiles: VerifiedProfile[]; owner: boolean }) {
  const providers = owner ? codingProviders : codingProviders.filter((provider) => profiles.some((profile) => profile.platform === provider.id));
  return (
    <section className="portfolio-connections" aria-label="Connected coding profiles">
      <h2>Coding platforms</h2>
      <div className="portfolio-platform-list">
        {providers.map((provider) => {
          const account = profiles.find((profile) => profile.platform === provider.id);
          const content = <>
            <CodingPlatformMark platform={provider.id} className="size-7 rounded-md" />
            <span className="min-w-0 flex-1"><strong>{provider.name}</strong><small>{account ? `@${account.username}` : "Connect account"}</small></span>
            {account ? <><Check size={14} className="text-emerald-400" /><ExternalLink size={12} className="text-muted-foreground" /></> : <Plus size={15} className="text-muted-foreground" />}
          </>;
          return account ? (
            <a key={provider.id} href={codingProfileUrl(account.platform, account.username)} target="_blank" rel="noopener noreferrer" aria-label={`${provider.name}: ${account.username}, connected`} className="portfolio-platform-row">{content}</a>
          ) : (
            <Link key={provider.id} href="/onboarding?step=3" aria-label={`Connect ${provider.name}`} className="portfolio-platform-row">{content}</Link>
          );
        })}
      </div>
      {!providers.length && <p className="text-xs text-muted-foreground">No coding accounts connected.</p>}
    </section>
  );
}
