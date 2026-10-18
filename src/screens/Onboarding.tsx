"use client";
import { AlgoGymLogo } from "@/components/brand/AlgoGymLogo";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Code2,
  LoaderCircle,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import {
  useAccount,
  jsonRequest,
  type AccountState,
  type College,
} from "@/hooks/use-account";
import {
  CollegeAutocomplete,
  RequestCollegeForm,
} from "@/components/auth/CollegeAutocomplete";
import { PlatformConnections } from "@/components/auth/PlatformConnections";
import type { VerifiedProfile } from "@/lib/profile-verification";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
const steps = ["Profile", "College", "Connect", "Verify", "Community", "Ready"];
const years = [
  "First Year",
  "Second Year",
  "Third Year",
  "Fourth Year",
  "Fifth Year",
  "Graduated",
];
export default function Onboarding() {
  const { user } = useAuth();
  const account = useAccount();
  const queryClient = useQueryClient();
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [step, setStep] = useState(1);
  const [name, setName] = useState("");
  const [year, setYear] = useState("");
  const [college, setCollege] = useState<College | null>(null);
  const [localProfiles, setLocalProfiles] = useState<VerifiedProfile[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [societies, setSocieties] = useState<
    Array<{ id: string; name: string; description: string | null }>
  >([]);
  const [societyError, setSocietyError] = useState("");
  const [societyLoading, setSocietyLoading] = useState(false);
  useEffect(() => {
    if (account.data && !ready) {
      setName(
        account.data.profile.display_name ??
          user?.user_metadata.full_name ??
          "",
      );
      setYear(account.data.profile.academic_year ?? "");
      setCollege(account.data.profile.colleges);
      const requested = Number(
        new URLSearchParams(window.location.search).get("step"),
      );
      setStep(
        requested >= 1 && requested <= 6
          ? requested
          : account.data.profile.onboarding_completed_at
            ? 1
            : Math.min(account.data.profile.onboarding_step + 1, 6),
      );
      setReady(true);
    }
  }, [account.data, ready, user]);
  useEffect(() => {
    if (step !== 5 || !college) return;
    const controller = new AbortController();
    setSocietyLoading(true);
    setSocietyError("");
    jsonRequest<{ societies: typeof societies }>(
      `/api/societies?collegeId=${encodeURIComponent(college.id)}`,
      { signal: controller.signal },
    )
      .then((result) => setSocieties(result.societies))
      .catch((reason) => {
        if (!controller.signal.aborted) setSocietyError(reason.message);
      })
      .finally(() => {
        if (!controller.signal.aborted) setSocietyLoading(false);
      });
    return () => controller.abort();
  }, [step, college?.id]);
  if (account.isLoading || (!ready && !account.isError))
    return (
      <main className="grid min-h-screen place-items-center">
        <p role="status" className="flex gap-2 text-sm text-muted-foreground">
          <LoaderCircle className="size-4 animate-spin" />
          Loading your setup…
        </p>
      </main>
    );
  if (account.isError)
    return (
      <main className="grid min-h-screen place-items-center px-4">
        <div className="max-w-md space-y-4 text-center">
          <p role="alert" className="text-sm text-red-300">
            {account.error.message}
          </p>
          <Button onClick={() => void account.refetch()}>Retry</Button>
        </div>
      </main>
    );
  const data = account.data!;
  const profiles = [
    ...data.accounts,
    ...localProfiles.filter(
      (profile) =>
        !data.accounts.some((other) => other.platform === profile.platform),
    ),
  ];
  const pendingCollege = data.collegeRequests.some(
    (request) => request.status === "pending",
  );
  const advance = async () => {
    setBusy(true);
    setError("");
    try {
      if (step === 2 && !college && !pendingCollege)
        throw new Error(
          "Choose a college from the results, or submit a missing-college request.",
        );
      const saved = await jsonRequest<AccountState>("/api/onboarding", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          displayName: name,
          academicYear: year,
          collegeId: college?.id ?? null,
          step,
        }),
      });
      queryClient.setQueryData(["account", user?.id], saved);
      if (step === 6) {
        for (const profile of profiles.filter(item => ["codeforces", "leetcode"].includes(item.platform))) {
          try {
            await jsonRequest("/api/sync", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ provider: profile.platform }),
            });
          } catch {
            /* Setup is saved even if a sync must be retried from the dashboard. */
          }
        }
        router.replace("/dashboard");
      } else setStep(step + 1);
    } catch (reason) {
      setError(
        reason instanceof Error
          ? reason.message
          : "Your setup could not be saved.",
      );
    } finally {
      setBusy(false);
    }
  };
  const join = async (id: string) => {
    setBusy(true);
    setError("");
    try {
      await jsonRequest("/api/societies", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ societyId: id }),
      });
      await account.refetch();
    } catch (reason) {
      setError(
        reason instanceof Error
          ? reason.message
          : "Your request could not be sent.",
      );
    } finally {
      setBusy(false);
    }
  };
  return (
    <main className="min-h-screen px-4 py-8 sm:py-12">
      <div className="mx-auto max-w-2xl">
        <header className="mb-8 flex items-center justify-between">
          <Link
            href="/"
            className="flex items-center gap-2 text-base font-semibold"
          >
            <AlgoGymLogo />
          </Link>
          <span className="text-xs text-muted-foreground">Account setup</span>
        </header>
        <ol
          aria-label="Onboarding progress"
          className="mb-10 grid grid-cols-6 gap-2"
        >
          {steps.map((label, index) => (
            <li
              key={label}
              aria-current={step === index + 1 ? "step" : undefined}
            >
              <span
                className={`mb-2 block h-1 rounded ${step > index ? "bg-primary" : "bg-muted"}`}
              />
              <span
                className={`text-[10px] sm:text-xs ${step === index + 1 ? "text-foreground" : "text-muted-foreground"}`}
              >
                {label}
              </span>
            </li>
          ))}
        </ol>
        <div className="mb-7">
          <p className="mb-2 text-xs text-muted-foreground">Step {step} of 6</p>
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
            {
              [
                "Let's set up your profile",
                "Find your college",
                "Connect your coding profiles",
                "Verify account ownership",
                "Find your community",
                "You're ready to begin.",
              ][step - 1]
            }
          </h1>
          <p className="mt-3 text-sm leading-6 text-muted-foreground">
            {
              [
                "A few details to make AlgoGym your own.",
                "Choose your institution's canonical record, or request an addition.",
                "Bring your competitive programming progress into one place.",
                "Use a short-lived public profile challenge to confirm ownership. You can finish this later.",
                "Join society an approved CP society. Membership requires approval.",
                "Your setup is saved. Your coding journey is ready to continue.",
              ][step - 1]
            }
          </p>
        </div>
        {step === 1 && (
          <section className="space-y-5 rounded-lg border bg-card p-5 sm:p-6">
            <div className="space-y-2">
              <Label htmlFor="setup-name">Full name</Label>
              <Input
                id="setup-name"
                autoComplete="name"
                value={name}
                onChange={(event) => setName(event.target.value)}
                minLength={2}
                maxLength={80}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="setup-email">Account email</Label>
              <Input
                id="setup-email"
                type="email"
                value={user?.email ?? ""}
                readOnly
                className="text-muted-foreground"
              />
              <p className="text-xs text-muted-foreground">
                Your authentication email identifies your account. Email changes
                require a separate confirmation flow.
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="setup-year">Current academic year</Label>
              <select
                id="setup-year"
                value={year}
                onChange={(event) => setYear(event.target.value)}
                className="h-10 w-full rounded-md border bg-background px-3 text-sm"
              >
                <option value="">Select academic year</option>
                {years.map((item) => (
                  <option key={item}>{item}</option>
                ))}
              </select>
            </div>
          </section>
        )}
        {step === 2 && (
          <div className="space-y-5">
            <section className="rounded-lg border bg-card p-5 sm:p-6">
              <CollegeAutocomplete value={college} onSelect={setCollege} />
            </section>
            {data.collegeRequests
              .filter((request) => request.status === "pending")
              .map((request) => (
                <p
                  key={request.id}
                  role="status"
                  className="text-sm text-amber-300"
                >
                  {request.name} — addition request pending review.
                </p>
              ))}
            <RequestCollegeForm onSaved={() => void account.refetch()} />
          </div>
        )}
        {(step === 3 || step === 4) && (
          <PlatformConnections
            profiles={profiles}
            onVerified={(profile) => {
              setLocalProfiles((current) => [
                ...current.filter((item) => item.platform !== profile.platform),
                profile,
              ]);
              void account.refetch();
            }}
          />
        )}
        {step === 5 && (
          <section className="space-y-4 rounded-lg border bg-card p-5 sm:p-6">
            {!college ? (
              <p className="text-sm text-muted-foreground">
                College communities will appear once your institution request is
                approved.
              </p>
            ) : societyLoading ? (
              <p role="status" className="text-sm text-muted-foreground">
                Loading your college's societies…
              </p>
            ) : societyError ? (
              <p role="alert" className="text-sm text-amber-300">
                {societyError}
              </p>
            ) : !societies.length ? (
              <p className="text-sm text-muted-foreground">
                No societies are listed for {college.name} yet.
              </p>
            ) : (
              societies.map((society) => {
                const membership = data.memberships.find(
                  (item) => item.society_id === society.id,
                );
                return (
                  <div
                    className="flex flex-wrap items-center justify-between gap-3 border-b py-3 last:border-0"
                    key={society.id}
                  >
                    <div>
                      <h2 className="text-sm font-medium">{society.name}</h2>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {society.description}
                      </p>
                    </div>
                    {membership?.status === "active" ? (
                      <span className="text-xs text-primary">
                        {membership.status === "active"
                          ? "Member"
                          : "Request pending"}
                      </span>
                    ) : (
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={busy}
                        onClick={() => void join(society.id)}
                      >
                        Join society
                      </Button>
                    )}
                  </div>
                );
              })
            )}
            <p className="text-xs leading-5 text-muted-foreground">
              You can skip this step and join a society later.
            </p>
            <Link
              href="/societies/register"
              className="inline-block text-sm text-primary hover:underline"
            >
              Apply to register a society{" "}
              <ArrowRight className="inline size-3.5" />
            </Link>
          </section>
        )}
        {step === 6 && (
          <section className="divide-y rounded-lg border bg-card px-5 sm:px-6">
            {[
              ["Profile created", name],
              ["College", college?.name ?? "Addition pending review"],
              [
                "Coding platforms",
                profiles.length
                  ? `${profiles.length} verified account${profiles.length > 1 ? "s" : ""}`
                  : "Not connected — add accounts from your profile",
              ],
              [
                "Society",
                data.memberships.some((item) => item.status === "active")
                  ? "Active member"
                  : data.memberships.length
                    ? "Membership request pending"
                    : "Not joined",
              ],
            ].map(([label, value]) => (
              <div className="flex gap-3 py-4" key={label}>
                <Check className="mt-0.5 size-4 shrink-0 text-emerald-400" />
                <div>
                  <p className="text-sm font-medium">{label}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{value}</p>
                </div>
              </div>
            ))}
          </section>
        )}
        {error && (
          <p role="alert" className="mt-4 text-sm text-red-300">
            {error}
          </p>
        )}
        <div className="mt-7 flex items-center justify-between gap-3">
          {step > 1 ? (
            <Button
              variant="ghost"
              disabled={busy}
              onClick={() => {
                setStep(step - 1);
                setError("");
              }}
            >
              <ArrowLeft size={15} />
              Back
            </Button>
          ) : (
            <span />
          )}
          <Button disabled={busy} onClick={() => void advance()}>
            {busy ? <LoaderCircle size={15} className="animate-spin" /> : null}
            {step === 6
              ? "Go to Dashboard"
              : step === 3 || step === 4 || step === 5
                ? "Continue"
                : "Save and continue"}
            <ArrowRight size={15} />
          </Button>
        </div>
        {data.profile.onboarding_completed_at && (
          <Link
            href="/dashboard"
            className="mt-5 block text-center text-xs text-muted-foreground hover:text-foreground"
          >
            Back to Dashboard
          </Link>
        )}
      </div>
    </main>
  );
}
