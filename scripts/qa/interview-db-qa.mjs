import { readFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";

const environment = Object.fromEntries(
  readFileSync(".env.local", "utf8")
    .split(/\r?\n/)
    .map((line) => {
      const index = line.indexOf("=");
      return index < 0
        ? []
        : [
            line.slice(0, index),
            line.slice(index + 1).replace(/^['"]|['"]$/g, ""),
          ];
    })
    .filter((pair) => pair.length === 2),
);
const url = environment.SUPABASE_URL ?? environment.NEXT_PUBLIC_SUPABASE_URL;
const publicKey =
  environment.SUPABASE_PUBLISHABLE_KEY ??
  environment.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
const serviceKey = environment.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !publicKey || !serviceKey)
  throw new Error("Local Supabase QA credentials are missing.");
const admin = createClient(url, serviceKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});
const client = createClient(url, publicKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});
const email = `interview-qa-${crypto.randomUUID()}@example.invalid`;
const password = `${crypto.randomUUID()}Aa9!`;
let userId;
try {
  const created = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });
  if (created.error || !created.data.user)
    throw created.error ?? new Error("Test user was not created.");
  userId = created.data.user.id;
  const signedIn = await client.auth.signInWithPassword({ email, password });
  if (signedIn.error) throw signedIn.error;
  const saved = await client.from("interview_user_questions").upsert(
    {
      user_id: userId,
      question_id: "lc-two-sum",
      completed: true,
      bookmarked: true,
    },
    { onConflict: "user_id,question_id" },
  );
  if (saved.error) throw saved.error;
  await client.auth.signOut();
  const resumed = await client.auth.signInWithPassword({ email, password });
  if (resumed.error) throw resumed.error;
  const read = await client
    .from("interview_user_questions")
    .select("completed,bookmarked")
    .eq("question_id", "lc-two-sum")
    .single();
  if (read.error || !read.data?.completed || !read.data?.bookmarked)
    throw (
      read.error ?? new Error("Progress did not survive sign-out and sign-in.")
    );
  const undone = await client
    .from("interview_user_questions")
    .update({ completed: false, bookmarked: false })
    .eq("user_id", userId)
    .eq("question_id", "lc-two-sum")
    .select("completed,bookmarked")
    .single();
  if (undone.error || undone.data?.completed || undone.data?.bookmarked)
    throw undone.error ?? new Error("Progress reversal failed.");
  const visitor = createClient(url, publicKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const privateRead = await visitor
    .from("interview_user_questions")
    .select("question_id")
    .eq("user_id", userId);
  if (privateRead.error || privateRead.data?.length)
    throw (
      privateRead.error ??
      new Error("Anonymous visitor could read private progress.")
    );
  const contentWrite = await client.from("interview_companies").insert({
    slug: "qa-unauthorized-company",
    name: "Unauthorized QA company",
  });
  if (!contentWrite.error)
    throw new Error("A normal account could edit preparation content.");
  console.log(
    "PASS: saved state survived sign-out, reversal worked, visitor progress was private, and normal accounts could not edit content.",
  );
} finally {
  if (userId) {
    const deleted = await admin.auth.admin.deleteUser(userId);
    if (deleted.error)
      console.error("QA test user cleanup failed:", deleted.error.message);
  }
}
