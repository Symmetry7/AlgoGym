import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from "react";

export interface AppUser {
  id: string;
  email?: string;
  created_at?: string;
  user_metadata: Record<string, string | undefined>;
  providers?: string[];
}

interface AuthContextValue {
  user: AppUser | null;
  loading: boolean;
  sessionError: string;
  signInWithGoogle: (next?: string) => Promise<void>;
  signOut: () => Promise<void>;
  refreshSession: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

async function readSession() {
  const response = await fetch("/api/auth/session", { credentials: "same-origin", cache: "no-store" });
  if (!response.ok) throw new Error("Your session could not be restored.");
  const result = await response.json();
  return (result.user ?? null) as AppUser | null;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [sessionError, setSessionError] = useState("");

  const refreshSession = useCallback(async () => {
    try { setUser(await readSession()); setSessionError(""); }
    catch (error) { setSessionError(error instanceof Error ? error.message : "Your session could not be restored."); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => {
    let active = true;
    readSession().then((nextUser) => { if (active) setUser(nextUser); })
      .catch((error) => { if (active) setSessionError(error instanceof Error ? error.message : "Your session could not be restored."); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  useEffect(() => {
    const onFocus = () => { if (document.visibilityState === "visible") void refreshSession(); };
    const channel = typeof BroadcastChannel === "undefined" ? null : new BroadcastChannel("algogym-auth");
    if (channel) channel.onmessage = () => { void refreshSession(); };
    window.addEventListener("focus", onFocus);
    const interval = window.setInterval(onFocus, 4 * 60_000);
    return () => { channel?.close(); window.removeEventListener("focus", onFocus); window.clearInterval(interval); };
  }, [refreshSession]);

  const signInWithGoogle = async (next = "/dashboard") => {
    const response = await fetch(`/api/auth/google?next=${encodeURIComponent(next)}`, { credentials: "same-origin", cache: "no-store" });
    const result = await response.json().catch(() => ({}));
    if (!response.ok || !result.url) throw new Error(result.error || "Google sign-in could not be started.");
    window.location.assign(result.url);
  };

  const signOut = async () => {
    const response = await fetch("/api/auth/signout", { method: "POST", credentials: "same-origin" });
    if (!response.ok) throw new Error("Sign-out failed. Please try again.");
    setUser(null);
    for (const key of ["cfHandle", "lcHandle"]) localStorage.removeItem(key);
    if (typeof BroadcastChannel !== "undefined") { const channel = new BroadcastChannel("algogym-auth"); channel.postMessage("signed-out"); channel.close(); }
  };

  return <AuthContext.Provider value={{ user, loading, sessionError, signInWithGoogle, signOut, refreshSession }}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used inside AuthProvider");
  return context;
}
