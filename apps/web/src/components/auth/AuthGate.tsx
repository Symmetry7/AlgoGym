"use client";
import type { ReactNode } from "react";
import { usePathname } from "next/navigation";
import { LoaderCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { useAccount } from "@/hooks/use-account";
import { SignInDialog } from "./SignInDialog";
export function AuthGate({ children }: { children: ReactNode }) {
  const { user, loading, sessionError, refreshSession } = useAuth();
  const path = usePathname();
  const publicPage =
    path === "/" ||
    path === "/sign-in" ||
    path === "/privacy" ||
    path === "/pricing" ||
    path.startsWith("/_design") ||
    path.startsWith("/problems") ||
    path === "/interview";
  const setupPage = path === "/account/reset-password";
  const account = useAccount(!publicPage && !setupPage);
  if (publicPage) return <>{children}</>;
  if (loading) return <Loading label="Restoring your session…" />;
  if (sessionError)
    return (
      <Failure message={sessionError} retry={() => void refreshSession()} />
    );
  if (!user) return <SignInDialog />;
  if (setupPage) return <>{children}</>;
  if (account.isError)
    return (
      <Failure
        message={account.error.message}
        retry={() => void account.refetch()}
      />
    );
  if (!account.data) return <Loading label="Loading your profile…" />;
  return <>{children}</>;
}
function Loading({ label }: { label: string }) {
  return (
    <div
      className="flex min-h-screen items-center justify-center gap-3 px-4 text-sm text-muted-foreground"
      role="status"
    >
      <LoaderCircle className="size-4 animate-spin" />
      {label}
    </div>
  );
}
function Failure({ message, retry }: { message: string; retry: () => void }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 px-4 text-center">
      <p role="alert" className="max-w-md text-sm text-red-300">
        {message}
      </p>
      <Button onClick={retry}>Try again</Button>
    </div>
  );
}
