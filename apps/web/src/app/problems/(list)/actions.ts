"use server";

import { revalidatePath } from "next/cache";
import { currentUser } from "../../../../server/session";

export type ListState = { error?: string; ok?: boolean };

/** Create one of the visitor's lists. RLS ("own rows") is the real check; this only validates the name. */
export async function createList(_: ListState, form: FormData): Promise<ListState> {
  const name = String(form.get("name") ?? "").trim();
  if (!name) return { error: "Give the list a name." };
  if (name.length > 80) return { error: "Keep the name under 80 characters." };
  const { db, user } = await currentUser();
  if (!db || !user) return { error: "Sign in to create lists." };
  const { error } = await db.from("lists").insert({ user_id: user.id, name });
  if (error) return { error: "Couldn't create the list. Try again." };
  revalidatePath("/problems");
  return { ok: true };
}
