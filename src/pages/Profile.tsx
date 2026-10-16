import { Layout } from "@/components/layout/Layout";
import { useAuth } from "@/contexts/AuthContext";
import usePersistentState from "@/hooks/usePersistentState";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Code2, ExternalLink, Settings2, ShieldCheck, Sparkles, UserRound } from "lucide-react";
import { Link } from "react-router-dom";
import { toast } from "sonner";

function Profile({ onOpenHandleModal }: { onOpenHandleModal: () => void }) {
  const { user, loading, signInWithGoogle } = useAuth();
  const [cfHandle] = usePersistentState<string>("cfHandle", "");
  const [lcHandle] = usePersistentState<string>("lcHandle", "");
  const handleSignIn = async () => {
    try {
      await signInWithGoogle();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Google sign-in could not be started.");
    }
  };

  if (loading) return <Layout onOpenHandleModal={onOpenHandleModal}><div className="mx-auto max-w-5xl animate-pulse space-y-5"><div className="h-56 rounded-3xl bg-muted"/><div className="h-44 rounded-3xl bg-muted"/></div></Layout>;

  if (!user) return (
    <Layout onOpenHandleModal={onOpenHandleModal}>
      <section className="mx-auto flex min-h-[55vh] max-w-xl flex-col items-center justify-center text-center">
        <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 text-primary"><UserRound className="h-8 w-8" /></div>
        <h1 className="text-3xl font-bold tracking-tight">Your AlgoGym profile</h1>
        <p className="mt-3 max-w-md text-muted-foreground">Sign in to see your account details and manage the coding profiles you use with AlgoGym.</p>
        <Button className="mt-6" onClick={() => void handleSignIn()}>Continue with Google</Button>
      </section>
    </Layout>
  );

  const name = user.user_metadata.full_name || user.user_metadata.name || "AlgoGym member";
  const avatar = user.user_metadata.avatar_url || user.user_metadata.picture;
  const joined = new Date(user.created_at).toLocaleDateString(undefined, { month: "long", year: "numeric" });

  return (
    <Layout onOpenHandleModal={onOpenHandleModal}>
      <main className="mx-auto max-w-5xl space-y-6 pb-10">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div><p className="mb-2 flex items-center gap-2 text-sm font-medium text-primary"><Sparkles className="h-4 w-4"/>YOUR SPACE</p><h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Profile</h1><p className="mt-2 text-muted-foreground">Your account and connected coding platforms.</p></div>
          <Button onClick={onOpenHandleModal} className="gap-2 rounded-xl"><Settings2 className="h-4 w-4"/>Edit handles</Button>
        </div>

        <Card className="overflow-hidden rounded-3xl border-border/70 bg-card shadow-sm">
          <div className="h-36 bg-[radial-gradient(ellipse_at_top_right,_hsl(var(--primary)/.32),_transparent_55%),linear-gradient(120deg,hsl(var(--primary)/.12),transparent_65%)] sm:h-44" />
          <CardContent className="relative px-5 pb-6 sm:px-8">
            <div className="-mt-12 flex flex-wrap items-end justify-between gap-4 sm:-mt-14">
              <Avatar className="h-24 w-24 border-4 border-card bg-card shadow-lg sm:h-28 sm:w-28"><AvatarImage src={avatar} alt={`${name} profile`} /><AvatarFallback className="bg-primary/10 text-3xl font-bold text-primary">{name.slice(0,1).toUpperCase()}</AvatarFallback></Avatar>
              <Badge variant="outline" className="mb-1 gap-1.5 rounded-full border-emerald-500/25 bg-emerald-500/10 px-3 py-1 text-emerald-600 dark:text-emerald-400"><ShieldCheck className="h-3.5 w-3.5"/>Google connected</Badge>
            </div>
            <div className="mt-4 grid gap-5 sm:grid-cols-[1fr_auto] sm:items-end">
              <div className="min-w-0"><h2 className="truncate text-2xl font-semibold">{name}</h2><p className="mt-1 truncate text-muted-foreground">{user.email}</p><p className="mt-3 text-xs text-muted-foreground">Member since {joined}</p></div>
              <div className="rounded-2xl border bg-background/60 px-4 py-3"><p className="text-xs uppercase tracking-wider text-muted-foreground">Account status</p><p className="mt-1 text-sm font-semibold">Active</p></div>
            </div>
          </CardContent>
        </Card>

        <section className="space-y-3">
          <div><h2 className="text-xl font-semibold">Coding profiles</h2><p className="mt-1 text-sm text-muted-foreground">Connect handles to personalize problem discovery and training.</p></div>
          <div className="grid gap-4 md:grid-cols-2">
            <PlatformCard name="LeetCode" handle={lcHandle} url={lcHandle ? `https://leetcode.com/${encodeURIComponent(lcHandle)}/` : undefined} accent="bg-orange-500/10 text-orange-500" monogram="LC" onEdit={onOpenHandleModal}/>
            <PlatformCard name="Codeforces" handle={cfHandle} url={cfHandle ? `https://codeforces.com/profile/${encodeURIComponent(cfHandle)}` : undefined} accent="bg-sky-500/10 text-sky-500" monogram="CF" onEdit={onOpenHandleModal}/>
          </div>
        </section>

        <Card className="rounded-2xl border-border/70 bg-muted/30"><CardContent className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between"><div className="flex items-start gap-3"><div className="rounded-xl bg-primary/10 p-2.5 text-primary"><Code2 className="h-5 w-5"/></div><div><p className="font-medium">Keep your practice moving</p><p className="mt-1 text-sm text-muted-foreground">Explore challenges or jump into a focused training session.</p></div></div><div className="flex gap-2"><Button variant="outline" asChild className="rounded-xl"><Link to="/">Explore problems</Link></Button><Button asChild className="rounded-xl"><Link to="/training">Open training</Link></Button></div></CardContent></Card>
      </main>
    </Layout>
  );
}

function PlatformCard({ name, handle, url, accent, monogram, onEdit }: { name: string; handle: string; url?: string; accent: string; monogram: string; onEdit: () => void }) {
  return <Card className="rounded-2xl border-border/70 transition-colors hover:border-primary/30"><CardContent className="flex min-w-0 items-center gap-4 p-5"><div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl text-sm font-bold ${accent}`}>{monogram}</div><div className="min-w-0 flex-1"><p className="font-semibold">{name}</p>{handle ? <a className="mt-0.5 inline-flex max-w-full items-center gap-1 truncate text-sm text-muted-foreground hover:text-primary" href={url} target="_blank" rel="noreferrer">@{handle}<ExternalLink className="h-3 w-3 shrink-0"/></a> : <p className="mt-0.5 text-sm text-muted-foreground">No handle connected</p>}</div><Button variant="ghost" size="sm" onClick={onEdit} className="shrink-0">{handle ? "Edit" : "Connect"}</Button></CardContent></Card>;
}

export default Profile;
