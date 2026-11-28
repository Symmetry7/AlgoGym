import { AccountMenu } from "@/components/shell/account-menu";
import { ButtonLink } from "@/components/shell/ui";
import { currentUser } from "../../../server/session";

/** The app header's right side: the account menu when signed in, otherwise "Log in". */
export async function headerActions(next: string) {
  const { user } = await currentUser();
  if (!user) {
    return (
      <ButtonLink href={`/sign-in?next=${encodeURIComponent(next)}`} variant="secondary" size="sm">
        Log in
      </ButtonLink>
    );
  }
  const name = (user.user_metadata?.full_name as string | undefined) || user.email?.split("@")[0] || "there";
  return <AccountMenu name={name} email={user.email ?? ""} avatarUrl={user.user_metadata?.avatar_url as string | undefined} />;
}
