"use client";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import type { VerifiedProfile } from "@/lib/profile-verification";
export interface College {
  id: string;
  name: string;
  city: string | null;
  state: string | null;
}
export interface AccountState {
  profile: {
    id: string;
    display_name: string | null;
    avatar_url: string | null;
    username: string | null;
    is_public: boolean;
    bio: string;
    country_code: string | null;
    website_url: string | null;
    github_url: string | null;
    linkedin_url: string | null;
    x_url: string | null;
    academic_year: string | null;
    college_id: string | null;
    onboarding_step: number;
    onboarding_completed_at: string | null;
    created_at: string;
    colleges: College | null;
  };
  accounts: VerifiedProfile[];
  collegeRequests: Array<{
    id: string;
    name: string;
    status: string;
    college_id: string | null;
  }>;
  memberships: Array<{
    id: string;
    society_id: string;
    status: string;
    role: string;
    societies: { name: string; slug: string } | null;
  }>;
}
export async function jsonRequest<T>(
  path: string,
  options?: RequestInit,
): Promise<T> {
  const response = await fetch(path, { cache: "no-store", ...options });
  const result = await response.json();
  if (!response.ok)
    throw Object.assign(new Error(result.error || "The request could not be completed."), {
      status: response.status,
      code: typeof result.code === "string" ? result.code : undefined,
    });
  return result;
}
export function useAccount(enabled = true) {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["account", user?.id],
    queryFn: () => jsonRequest<AccountState>("/api/onboarding"),
    enabled: enabled && Boolean(user),
    staleTime: 60_000,
    refetchOnWindowFocus: false,
    retry: 1,
  });
}
