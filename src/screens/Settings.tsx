"use client";
import { useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Check, Copy, LoaderCircle } from "lucide-react";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/contexts/AuthContext";
import { jsonRequest } from "@/hooks/use-account";
import { countryCodes, countryLabel } from "@/lib/countries";
interface SettingsProfile {
  display_name: string | null;
  username: string | null;
  is_public: boolean;
  bio: string;
  country_code: string | null;
  website_url: string | null;
  github_url: string | null;
  linkedin_url: string | null;
  x_url: string | null;
}
export default function Settings() {
  const { user } = useAuth();
  const cache = useQueryClient();
  const query = useQuery({
    queryKey: ["profile-settings", user?.id],
    queryFn: () =>
      jsonRequest<{ profile: SettingsProfile }>("/api/account/profile"),
    enabled: Boolean(user),
    retry: 1,
  });
  const [ready, setReady] = useState(false);
  const [fields, setFields] = useState({
    displayName: "",
    username: "",
    isPublic: false,
    bio: "",
    countryCode: "",
    websiteUrl: "",
    githubUrl: "",
    linkedinUrl: "",
    xUrl: "",
  });
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  useEffect(() => {
    if (query.data && !ready) {
      const p = query.data.profile;
      setFields({
        displayName: p.display_name ?? "",
        username: p.username ?? "",
        isPublic: p.is_public,
        bio: p.bio ?? "",
        countryCode: p.country_code ?? "",
        websiteUrl: p.website_url ?? "",
        githubUrl: p.github_url ?? "",
        linkedinUrl: p.linkedin_url ?? "",
        xUrl: p.x_url ?? "",
      });
      setReady(true);
    }
  }, [query.data, ready]);
  const save = async (event: FormEvent) => {
    event.preventDefault();
    setSaving(true);
    setMessage("");
    setError("");
    try {
      await jsonRequest("/api/account/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...fields,
          ...(!fields.username ? { username: undefined } : {}),
        }),
      });
      await Promise.all([
        cache.invalidateQueries({ queryKey: ["account", user?.id] }),
        query.refetch(),
      ]);
      setMessage("Profile settings saved.");
    } catch (reason) {
      setError(
        reason instanceof Error
          ? reason.message
          : "Settings could not be saved.",
      );
    } finally {
      setSaving(false);
    }
  };
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(
        `${window.location.origin}/u/${query.data?.profile.username}`,
      );
      setMessage("Public profile link copied.");
    } catch {
      setError(
        "The clipboard is unavailable. You can copy the profile link below.",
      );
    }
  };
  return (
    <Layout>
      <div className="mx-auto max-w-3xl space-y-7">
        <header>
          <p className="mb-2 text-xs text-muted-foreground">
            Your identity and visibility
          </p>
          <h1 className="text-2xl font-semibold tracking-tight">
            Edit Profile
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Keep your portfolio accurate and choose what you share.
          </p>
        </header>
        {query.error && (
          <div role="alert" className="text-sm text-rose-300">
            {query.error.message}
            <button
              className="ml-3 underline"
              onClick={() => void query.refetch()}
            >
              Retry
            </button>
          </div>
        )}
        {error && (
          <p role="alert" className="text-sm text-rose-300">
            {error}
          </p>
        )}
        {message && (
          <p role="status" className="text-sm text-emerald-400">
            {message}
          </p>
        )}
        {query.isLoading ? (
          <div
            role="status"
            aria-label="Loading settings"
            className="h-96 animate-pulse rounded-lg border bg-card"
          />
        ) : (
          ready && (
            <form onSubmit={(event) => void save(event)} className="space-y-7">
              <section className="space-y-5 rounded-lg border bg-card p-5 sm:p-6">
                <h2 className="text-sm font-medium">Basic information</h2>
                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="block text-xs">
                    Display name
                    <Input
                      required
                      minLength={2}
                      maxLength={80}
                      value={fields.displayName}
                      onChange={(event) =>
                        setFields({
                          ...fields,
                          displayName: event.target.value,
                        })
                      }
                      className="mt-2"
                    />
                  </label>
                  <label className="block text-xs">
                    AlgoGym username
                    <Input
                      minLength={3}
                      maxLength={30}
                      pattern="[a-zA-Z0-9_-]{3,30}"
                      value={fields.username}
                      onChange={(event) =>
                        setFields({ ...fields, username: event.target.value })
                      }
                      placeholder="your_username"
                      className="mt-2"
                    />
                  </label>
                </div>
                <label className="block text-xs">
                  Verified account email
                  <Input
                    type="email"
                    readOnly
                    value={user?.email ?? ""}
                    className="mt-2 text-muted-foreground"
                  />
                  <span className="mt-2 block text-[11px] leading-5 text-muted-foreground">
                    This is your authentication identity. Contact details in
                    your portfolio never change this email.
                  </span>
                </label>
                <label className="block text-xs">
                  Bio
                  <textarea
                    rows={4}
                    maxLength={1000}
                    value={fields.bio}
                    onChange={(event) =>
                      setFields({ ...fields, bio: event.target.value })
                    }
                    className="mt-2 w-full rounded-md border bg-background p-3 text-sm leading-6"
                    placeholder="What are you learning or working toward?"
                  />
                </label>
                <label className="block text-xs">
                  Country
                  <select
                    value={fields.countryCode}
                    onChange={(event) =>
                      setFields({ ...fields, countryCode: event.target.value })
                    }
                    className="mt-2 h-10 w-full rounded-md border bg-background px-3 text-xs"
                  >
                    <option value="">Not specified</option>
                    {countryCodes
                      .map((code) => ({ code, label: countryLabel(code) }))
                      .sort((a, b) => a.label.localeCompare(b.label))
                      .map(({ code, label }) => (
                        <option key={code} value={code}>
                          {label}
                        </option>
                      ))}
                  </select>
                </label>
                <Link
                  href="/onboarding?step=1"
                  className="inline-block text-xs text-primary"
                >
                  Update your college and academic year →
                </Link>
              </section>
              <section className="space-y-5 rounded-lg border bg-card p-5 sm:p-6">
                <h2 className="text-sm font-medium">Portfolio links</h2>
                {(
                  [
                    ["websiteUrl", "Website", "https://your-site.example"],
                    [
                      "githubUrl",
                      "GitHub profile",
                      "https://github.com/username",
                    ],
                    [
                      "linkedinUrl",
                      "LinkedIn",
                      "https://www.linkedin.com/in/username",
                    ],
                    ["xUrl", "X", "https://x.com/username"],
                  ] as const
                ).map(([key, label, placeholder]) => (
                  <label key={key} className="block text-xs">
                    {label}
                    <Input
                      type="url"
                      maxLength={300}
                      value={fields[key]}
                      onChange={(event) =>
                        setFields({ ...fields, [key]: event.target.value })
                      }
                      className="mt-2"
                      placeholder={placeholder}
                    />
                  </label>
                ))}
                <p className="text-[11px] leading-6 text-muted-foreground">
                  A GitHub link is a portfolio link, not OAuth ownership
                  verification or a connected analytics integration.
                </p>
              </section>
              <section className="space-y-4 rounded-lg border bg-card p-5 sm:p-6">
                <h2 className="text-sm font-medium">Public visibility</h2>
                <label className="flex items-start gap-3">
                  <input
                    type="checkbox"
                    checked={fields.isPublic}
                    onChange={(event) =>
                      setFields({ ...fields, isPublic: event.target.checked })
                    }
                    className="mt-1 size-4 accent-primary"
                  />
                  <span>
                    <span className="block text-sm">
                      Make my coding portfolio public
                    </span>
                    <span className="mt-2 block text-xs leading-6 text-muted-foreground">
                      Your name, bio, college, country, portfolio links,
                      verified coding handles, and synchronized coding
                      statistics become visible. Email, saved questions, private
                      notes and sheets remain private.
                    </span>
                  </span>
                </label>
                {query.data?.profile.is_public &&
                  query.data.profile.username && (
                    <p className="flex flex-wrap items-center gap-2 text-xs">
                      <Link
                        href={`/u/${query.data.profile.username}`}
                        className="text-primary"
                      >
                        /u/{query.data.profile.username}
                      </Link>
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        onClick={() => void copy()}
                      >
                        <Copy size={12} />
                        Copy link
                      </Button>
                    </p>
                  )}
              </section>
              <Button type="submit" disabled={saving}>
                {saving ? (
                  <LoaderCircle size={15} className="animate-spin" />
                ) : (
                  <Check size={15} />
                )}
                Save changes
              </Button>
            </form>
          )
        )}
      </div>
    </Layout>
  );
}
