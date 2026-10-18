import Link from "next/link";
import { Layout } from "@/components/layout/Layout";

export default function Privacy() {
  return (
    <Layout>
      <article className="mx-auto max-w-3xl space-y-7 py-8 sm:py-12">
        <header className="space-y-3 border-b pb-6">
          <p className="text-sm font-medium text-primary">ALGOGYM</p>
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Privacy policy
          </h1>
          <p className="text-sm text-muted-foreground">
            Last updated October 17, 2026
          </p>
        </header>
        <p className="leading-7 text-muted-foreground">
          This notice explains what AlgoGym handles when you use its problem
          discovery and training tools.
        </p>
        <section className="space-y-2">
          <h2 className="text-lg font-semibold">
            Information you choose to provide
          </h2>
          <p className="leading-7 text-muted-foreground">
            If you sign in with Google, AlgoGym receives your email address and
            basic profile information, such as your name and profile picture,
            through Supabase Authentication. Google sign-in is used to create
            and maintain your AlgoGym session.
          </p>
        </section>
        <section className="space-y-2">
          <h2 className="text-lg font-semibold">Connected coding profiles</h2>
          <p className="leading-7 text-muted-foreground">
            Verified Codeforces and LeetCode usernames, their platform, and
            verification timestamps are associated with your signed-in AlgoGym
            account. Temporary verification codes expire after 10 minutes and
            are stored as hashes. You can remove the temporary code from your
            public platform profile after verification. AlgoGym never asks for
            your Codeforces or LeetCode password, cookies, or private account
            data.
          </p>
        </section>
        <section className="space-y-2">
          <h2 className="text-lg font-semibold">How information is used</h2>
          <p className="leading-7 text-muted-foreground">
            Account information is used to sign you in and display your profile.
            Handles are used to personalize your experience. AlgoGym does not
            request access to your Google Drive, contacts, or other Google data
            through this sign-in flow.
          </p>
        </section>
        <section className="space-y-2">
          <h2 className="text-lg font-semibold">
            Service providers and external sites
          </h2>
          <p className="leading-7 text-muted-foreground">
            Supabase provides authentication and session services. AlgoGym also
            links to LeetCode and Codeforces, which have their own privacy
            practices. Information you provide to those services is governed by
            their policies.
          </p>
        </section>
        <section className="space-y-2">
          <h2 className="text-lg font-semibold">Your choices and questions</h2>
          <p className="leading-7 text-muted-foreground">
            You can sign out from the account menu and remove locally saved
            handles by clearing them in your profile settings or clearing this
            site's browser storage. For questions about this notice, contact{" "}
            <a
              className="text-primary underline underline-offset-4"
              href="mailto:2405099@kiit.ac.in"
            >
              2405099@kiit.ac.in
            </a>
            .
          </p>
        </section>
        <div className="border-t pt-5">
          <Link className="text-sm text-primary hover:underline" href="/">
            Return to AlgoGym
          </Link>
        </div>
      </article>
    </Layout>
  );
}
