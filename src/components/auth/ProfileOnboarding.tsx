import { useEffect, useState } from "react";
import {
  Check,
  CheckCircle2,
  Clipboard,
  ExternalLink,
  LoaderCircle,
  ShieldCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  profileVerificationRequest,
  type CodingPlatform,
  type VerifiedProfile,
} from "@/lib/profile-verification";
import { SiCodeforces, SiLeetcode } from "react-icons/si";
import { CodingPlatformMark } from "@/components/brand/CodingPlatformMark";

type Challenge = { username: string; token: string; expiresAt: string };
export type PlatformState = {
  username: string;
  challenge: Challenge | null;
  pending: boolean;
  verified: VerifiedProfile | null;
};

const platformDetails: Record<
  CodingPlatform,
  {
    name: string;
    monogram: string;
    link: string;
    instructions: string[];
    field: string;
  }
> = {
  codeforces: {
    name: "Codeforces",
    monogram: "CF",
    link: "https://codeforces.com/settings/social",
    field: "First Name (English)",
    instructions: [
      "Open your Codeforces account.",
      "Go to Settings → Social.",
      "Locate First Name (English).",
      "Temporarily replace its value with this code.",
      "Save your changes.",
    ],
  },
  leetcode: {
    name: "LeetCode",
    monogram: "LC",
    link: "https://leetcode.com/profile/",
    field: "Summary",
    instructions: [
      "Open your LeetCode profile settings.",
      "Find the Summary section.",
      "Paste this code into your Summary. You can append it to your existing text.",
      "Save your changes.",
    ],
  },
  codechef: {
    name: "CodeChef", monogram: "CC", link: "https://www.codechef.com/", field: "Full Name",
    instructions: ["Open the account menu on CodeChef and choose Edit Profile.", "Save your current Full Name somewhere safe.", "Temporarily replace Full Name with this exact code and save. This also temporarily changes the name shown on your CodeChef certificates.", "Return here to verify, then restore your original name."],
  },
  atcoder: {
    name: "AtCoder", monogram: "AC", link: "https://atcoder.jp/settings", field: "Affiliation",
    instructions: ["Sign in to AtCoder and open Settings, then Profile.", "Save your current Affiliation somewhere safe.", "Temporarily replace Affiliation with this exact code and save.", "Return here to verify, then restore your original affiliation."],
  },
  github: {
    name: "GitHub", monogram: "GH", link: "https://github.com/settings/profile", field: "Bio",
    instructions: ["Open your GitHub public profile settings.", "Append this code to your Bio, separated from other text by a space.", "Save your profile. The official GitHub API must show the updated bio.", "Return here to verify. You can remove the code after success."],
  },
  geeksforgeeks: {
    name: "GeeksforGeeks", monogram: "GFG", link: "https://www.geeksforgeeks.org/profile/", field: "Bio",
    instructions: ["Sign in to GeeksforGeeks and open your public profile.", "Choose Edit profile and find your Bio or About section.", "Append this code, separated by spaces, and save. Make sure it appears on your public profile.", "Return here to verify. If the public bio cannot be read, verification remains pending."],
  },
};

export function PlatformCard({
  platform,
  value,
  onVerified,
  embedded = false,
  onPendingChange,
}: {
  platform: CodingPlatform;
  value: PlatformState;
  onVerified: (profile: VerifiedProfile) => void;
  embedded?: boolean;
  onPendingChange?: (pending: boolean) => void;
}) {
  const detail = platformDetails[platform];
  const [username, setUsername] = useState(
    value.verified?.username ?? value.username,
  );
  const [challenge, setChallenge] = useState<Challenge | null>(value.challenge);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
  useEffect(() => {
    if (value.username) setUsername(previous => previous || value.username);
  }, [value.username]);

  const request = async (action: "start" | "verify") => {
    setBusy(true);
    setError("");
    try {
      const result = await profileVerificationRequest<{
        username?: string;
        token?: string;
        expiresAt?: string;
        verified?: boolean;
        verified_at?: string;
        platform?: CodingPlatform;
        error?: string;
      }>({
        action,
        platform,
        username: value.verified?.username ?? username.trim(),
        token: challenge?.token,
      });
      if (
        action === "start" &&
        result.token &&
        result.username &&
        result.expiresAt
      ) {
        setChallenge({
          username: result.username,
          token: result.token,
          expiresAt: result.expiresAt,
        });
        setUsername(result.username);
        onPendingChange?.(true);
      }
      if (action === "verify" && result.verified && result.username && result.verified_at) {
        onVerified({
          platform,
          username: result.username,
          verified_at: result.verified_at,
        });
        setChallenge(null);
        onPendingChange?.(false);
      }
    } catch (reason) {
      setError(
        reason instanceof Error
          ? reason.message
          : "Verification could not be completed. Please retry.",
      );
    } finally {
      setBusy(false);
    }
  };

  const copyCode = async () => {
    if (!challenge) return;
    try {
      await navigator.clipboard.writeText(challenge.token);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      setError("Copy failed. Select and copy the code manually.");
    }
  };

  return (
    <Card className={embedded ? "rounded-none border-0 bg-transparent shadow-none" : "border-border/80 transition-colors duration-200 hover:border-border"}>
      {!embedded && <CardHeader className="flex flex-row items-center justify-between gap-3 space-y-0 pb-4">
        <CardTitle className="flex items-center gap-3 text-base font-semibold">
          <span
            aria-hidden="true"
            className={`flex h-9 w-9 items-center justify-center rounded-md ${platform === "codeforces" ? "bg-sky-500/10 text-sky-400" : "bg-orange-500/10 text-orange-400"}`}
          >
            <CodingPlatformMark platform={platform} />
          </span>
          {detail.name}
        </CardTitle>
        <span
          className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs ${value.verified ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-400" : challenge || value.pending ? "border-amber-500/30 bg-amber-500/10 text-amber-300" : "border-border text-muted-foreground"}`}
        >
          {value.verified ? (
            <>
              <CheckCircle2 className="h-3.5 w-3.5" />
              Verified
            </>
          ) : challenge || value.pending ? (
            "Pending verification"
          ) : (
            "Not connected"
          )}
        </span>
      </CardHeader>}
      <CardContent className={embedded ? "space-y-4 px-4 pb-5 pt-1 sm:px-5" : "space-y-4"}>
        {value.verified ? (
          <div
            role="status"
            className="flex items-center gap-2 rounded-md bg-emerald-500/5 p-3 text-sm"
          >
            <Check className="h-4 w-4 text-emerald-400" />
            <span>
              <strong>{detail.name} account verified</strong>
              <span className="block text-muted-foreground">
                Your {detail.name} account has been successfully connected.
              </span>
              <span className="text-foreground">
                @{value.verified.username}
              </span>
              {platform === "codeforces" && (
                <span className="block text-xs text-muted-foreground">
                  You can restore your original first name now.
                </span>
              )}
              {platform === "leetcode" && (
                <span className="block text-xs text-muted-foreground">
                  You can remove the verification code from your Summary now.
                </span>
              )}
              {platform !== "codeforces" && platform !== "leetcode" && <span className="block text-xs text-muted-foreground">You can now remove the code or restore your original {detail.field}.</span>}
            </span>
          </div>
        ) : (
          <>
            <div className="space-y-2">
              <Label htmlFor={`${platform}-username`}>
                {detail.name} username
              </Label>
              <Input
                id={`${platform}-username`}
                value={username}
                onChange={(event) => setUsername(event.target.value)}
                placeholder={
                  `Your ${detail.name} handle`
                }
                autoComplete="off"
                disabled={Boolean(challenge) || busy}
              />
            </div>
            {challenge ? (
              <div className="space-y-4 border-t border-border/70 pt-4 animate-in fade-in slide-in-from-top-1 duration-200">
                <div className="space-y-2">
                  <Label htmlFor={`${platform}-code`}>
                    Your verification code
                  </Label>
                  <div className="flex gap-2">
                    <Input
                      id={`${platform}-code`}
                      readOnly
                      value={challenge.token}
                      className="font-mono tracking-wide"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={() => void copyCode()}
                      aria-label="Copy verification code"
                    >
                      <Clipboard className="h-4 w-4" />
                    </Button>
                  </div>
                  <p
                    aria-live="polite"
                    className="min-h-4 text-xs text-muted-foreground"
                  >
                    {copied
                      ? "Code copied"
                      : `Code expires ${new Date(challenge.expiresAt).toLocaleTimeString()}`}
                  </p>
                </div>
                <ol className="list-inside list-decimal space-y-2 text-sm leading-relaxed text-muted-foreground">
                  {detail.instructions.map((instruction) => (
                    <li key={instruction}>{instruction}</li>
                  ))}
                  <li>
                    Return here and verify that the code appears on your public
                    profile.
                  </li>
                </ol>
                <a
                  href={detail.link}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 text-sm text-primary underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  Open {detail.name} settings{" "}
                  <ExternalLink className="h-3.5 w-3.5" />
                </a>
                {platform === "leetcode" && (
                  <p className="text-xs text-muted-foreground">
                    The public Summary field is checked directly. If LeetCode
                    does not return it, verification stays pending.
                  </p>
                )}
                <Button
                  type="button"
                  onClick={() => void request("verify")}
                  disabled={busy}
                  className="w-full"
                >
                  {busy ? (
                    <LoaderCircle className="h-4 w-4 animate-spin" />
                  ) : (
                    <ShieldCheck className="h-4 w-4" />
                  )}
                  {busy ? "Checking public profile…" : "Verify Account"}
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => void request("start")}
                  disabled={busy}
                  className="w-full"
                >
                  Generate a new code
                </Button>
              </div>
            ) : (
              <Button
                type="button"
                onClick={() => void request("start")}
                disabled={busy || !username.trim()}
                className="w-full"
              >
                {busy ? (
                  <LoaderCircle className="h-4 w-4 animate-spin" />
                ) : null}
                {busy
                  ? "Checking username…"
                  : value.pending
                    ? "Generate a new code"
                    : `Connect ${detail.name}`}
              </Button>
            )}
          </>
        )}
        {error && (
          <p role="alert" className="text-sm text-destructive">
            {error}
          </p>
        )}
      </CardContent>
    </Card>
  );
}

export function ProfileOnboarding({
  profiles,
  challenges,
  onVerified,
  onContinue,
  onBack,
  onboardingCompleted,
}: {
  profiles: VerifiedProfile[];
  challenges: Array<{
    platform: CodingPlatform;
    username: string;
    expires_at: string;
  }>;
  onVerified: (profile: VerifiedProfile) => void;
  onContinue: () => Promise<void>;
  onBack?: () => void;
  onboardingCompleted: boolean;
}) {
  const [continuing, setContinuing] = useState(false);
  const [continueError, setContinueError] = useState("");
  const states = (platform: CodingPlatform): PlatformState => ({
    username:
      challenges.find((challenge) => challenge.platform === platform)
        ?.username ?? "",
    challenge: null,
    pending: challenges.some((challenge) => challenge.platform === platform),
    verified: profiles.find((profile) => profile.platform === platform) ?? null,
  });
  const requiredVerifiedCount = profiles.filter(profile => ["codeforces", "leetcode"].includes(profile.platform)).length;
  const done =
    profiles.some((profile) => profile.platform === "codeforces") &&
    profiles.some((profile) => profile.platform === "leetcode");

  const continueToApp = async () => {
    setContinuing(true);
    setContinueError("");
    try {
      await onContinue();
    } catch (reason) {
      setContinueError(
        reason instanceof Error
          ? reason.message
          : "Unable to continue. Please retry.",
      );
    } finally {
      setContinuing(false);
    }
  };

  return (
    <main className="min-h-screen bg-background px-4 py-10 sm:py-16">
      <div className="mx-auto w-full max-w-2xl">
        {done && !onboardingCompleted ? (
          <Card className="mx-auto max-w-lg border-border/80 text-center">
            <CardContent className="space-y-5 p-7 sm:p-9">
              <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-400">
                <CheckCircle2 className="h-6 w-6" />
              </span>
              <div className="space-y-2">
                <h1 className="text-2xl font-semibold">
                  All accounts verified
                </h1>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  Your Google, Codeforces, and LeetCode accounts are
                  successfully connected.
                </p>
              </div>
              <div className="space-y-2 text-left text-sm">
                <p className="flex items-center justify-between rounded-md border border-border/70 px-3 py-2">
                  <span>Google</span>
                  <span className="inline-flex items-center gap-1 text-emerald-400">
                    <Check className="h-4 w-4" />
                    Connected
                  </span>
                </p>
                {profiles.map((profile) => (
                  <p
                    key={profile.platform}
                    className="flex items-center justify-between rounded-md border border-border/70 px-3 py-2"
                  >
                    <span>{platformDetails[profile.platform].name}</span>
                    <span className="inline-flex items-center gap-1 text-emerald-400">
                      <Check className="h-4 w-4" />
                      Verified
                    </span>
                  </p>
                ))}
              </div>
              {continueError && (
                <p role="alert" className="text-sm text-destructive">
                  {continueError}
                </p>
              )}
              <Button
                onClick={() => void continueToApp()}
                disabled={continuing}
                className="w-full"
              >
                {continuing && (
                  <LoaderCircle className="h-4 w-4 animate-spin" />
                )}
                {continuing ? "Opening AlgoGym…" : "Continue to Dashboard"}
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-7">
            <header className="space-y-3">
              {onBack && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={onBack}
                  className="-ml-3"
                >
                  ← Back to AlgoGym
                </Button>
              )}
              <p className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">
                Account setup
              </p>
              <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
                Connect your coding profiles
              </h1>
              <p className="max-w-xl text-sm leading-relaxed text-muted-foreground">
                Verify ownership of your Codeforces and LeetCode accounts to
                connect them securely.
              </p>
              <div
                className="flex items-center gap-3 pt-1"
                aria-label={`${requiredVerifiedCount} of 2 profiles verified`}
              >
                <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full bg-primary transition-all duration-300"
                    style={{ width: `${(requiredVerifiedCount / 2) * 100}%` }}
                  />
                </div>
                <span className="text-xs tabular-nums text-muted-foreground">
                  {requiredVerifiedCount} of 2 verified
                </span>
              </div>
            </header>
            <section
              className="grid gap-4"
              aria-label="Coding profile verification"
            >
              <PlatformCard
                key={`cf-${states("codeforces").verified?.username ?? "empty"}`}
                platform="codeforces"
                value={states("codeforces")}
                onVerified={onVerified}
              />
              <PlatformCard
                key={`lc-${states("leetcode").verified?.username ?? "empty"}`}
                platform="leetcode"
                value={states("leetcode")}
                onVerified={onVerified}
              />
            </section>
            {onboardingCompleted && done && (
              <Button onClick={onBack} className="w-full">
                Continue to Dashboard
              </Button>
            )}
          </div>
        )}
      </div>
    </main>
  );
}
