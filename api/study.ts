import {
  serverSupabase,
  originFromRequest,
  type ApiRequest,
  type ApiResponse,
} from "../server/supabase";
import { studyAction } from "../server/study-validation";
import { resolveStudyProblem } from "../server/study-problem";
import { allowAuthAttempt } from "../server/auth-policy";
import { ProviderError } from "../server/providers";
import type { SupabaseClient } from "@supabase/supabase-js";
async function ownRows(
  client: SupabaseClient,
  table: string,
  select: string,
  userId: string,
) {
  const rows: any[] = [];
  for (let offset = 0; offset < 10000; offset += 1000) {
    const { data, error } = await client
      .from(table)
      .select(select)
      .eq("user_id", userId)
      .order("id")
      .range(offset, offset + 999);
    if (error) throw error;
    rows.push(...data);
    if (data.length < 1000) return rows;
  }
  throw new Error("The study archive requires pagination.");
}
export default async function handler(req: ApiRequest, res: ApiResponse) {
  res.setHeader("Cache-Control", "private, no-store");
  if (!["GET", "POST"].includes(req.method ?? ""))
    return res.status(405).json({ error: "Method not allowed." });
  if (
    req.method === "POST" &&
    req.headers.origin &&
    req.headers.origin !== originFromRequest(req)
  )
    return res
      .status(403)
      .json({ error: "This request could not be verified." });
  const { client, flushCookies } = serverSupabase(req, res);
  try {
    const {
      data: { user },
      error: authError,
    } = await client.auth.getUser();
    if (authError || !user)
      return res
        .status(401)
        .json({ error: "Sign in to open your study workspace." });
    if (req.method === "POST") {
      if (!allowAuthAttempt(`study:${user.id}`, 120, 60000))
        return res
          .status(429)
          .json({ error: "Too many changes. Wait a minute before retrying." });
      const parsed = studyAction.safeParse(req.body);
      if (!parsed.success)
        return res
          .status(400)
          .json({
            error: parsed.error.issues[0]?.message ?? "Check the form fields.",
          });
      const value = parsed.data;
      let result: any;
      let id: string | undefined;
      switch (value.action) {
        case "question.add": {
          const problem = await resolveStudyProblem(value.url);
          result = await client
            .from("workspace_questions")
            .upsert(
              { user_id: user.id, problem_id: problem },
              { onConflict: "user_id,problem_id", ignoreDuplicates: true },
            );
          break;
        }
        case "question.update":
          result = await client
            .from("workspace_questions")
            .update({
              ...(value.status ? { study_status: value.status } : {}),
              ...(value.starred !== undefined
                ? { starred: value.starred }
                : {}),
              ...(value.tags ? { custom_tags: [...new Set(value.tags)] } : {}),
              ...(value.reviewed
                ? { last_reviewed_at: new Date().toISOString() }
                : {}),
              updated_at: new Date().toISOString(),
            })
            .eq("id", value.id)
            .eq("user_id", user.id)
            .select("id")
            .single();
          break;
        case "question.delete":
          result = await client
            .from("workspace_questions")
            .delete()
            .eq("id", value.id)
            .eq("user_id", user.id)
            .select("id")
            .single();
          break;
        case "note.save": {
          const payload = {
            user_id: user.id,
            title: value.title,
            body: value.body,
            ...(value.questionId !== undefined
              ? { question_id: value.questionId }
              : {}),
            updated_at: new Date().toISOString(),
          };
          result = value.id
            ? await client
                .from("study_notes")
                .update(payload)
                .eq("id", value.id)
                .eq("user_id", user.id)
                .select("id")
                .single()
            : await client
                .from("study_notes")
                .insert(payload)
                .select("id")
                .single();
          break;
        }
        case "note.delete":
          result = await client
            .from("study_notes")
            .delete()
            .eq("id", value.id)
            .eq("user_id", user.id)
            .select("id")
            .single();
          break;
        case "sheet.create":
          result = await client
            .from("training_lists")
            .insert({
              title: value.title,
              description: value.description,
              visibility: value.visibility,
              category: value.category,
              created_by: user.id,
            })
            .select("id")
            .single();
          break;
        case "sheet.update":
          result = await client
            .from("training_lists")
            .update({
              title: value.title,
              description: value.description,
              visibility: value.visibility,
              category: value.category,
              updated_at: new Date().toISOString(),
            })
            .eq("id", value.id)
            .eq("created_by", user.id)
            .select("id")
            .single();
          break;
        case "sheet.delete":
          result = await client
            .from("training_lists")
            .delete()
            .eq("id", value.id)
            .eq("created_by", user.id)
            .select("id")
            .single();
          break;
        case "sheet.add":
          result = await client.rpc("add_sheet_problem", {
            p_sheet: value.sheetId,
            p_problem: value.problemId,
          });
          break;
        case "sheet.remove":
          result = await client
            .from("training_items")
            .delete()
            .eq("id", value.id)
            .select("id")
            .single();
          break;
        case "sheet.follow":
          result = value.follow
            ? await client
                .from("sheet_follows")
                .upsert(
                  { sheet_id: value.sheetId, user_id: user.id },
                  { onConflict: "sheet_id,user_id", ignoreDuplicates: true },
                )
            : await client
                .from("sheet_follows")
                .delete()
                .eq("sheet_id", value.sheetId)
                .eq("user_id", user.id);
          break;
        case "sheet.invite":
          result = await client.rpc("invite_sheet_member", {
            p_sheet: value.sheetId,
            p_username: value.username,
            p_role: value.role,
          });
          break;
        case "sheet.respond":
          result = await client.rpc("respond_sheet_invitation", {
            p_invite: value.id,
            p_accept: value.accept,
          });
          break;
      }
      if (result?.error) {
        if (result.error.code === "23505")
          return res
            .status(409)
            .json({
              error: "This item is already saved. Refresh your workspace.",
            });
        if (result.error.code === "42501" || result.error.code === "PGRST116")
          return res
            .status(403)
            .json({
              error:
                "This item is unavailable or your account cannot change it.",
            });
        return res
          .status(400)
          .json({
            error:
              "The change could not be saved. Check permissions, the selected item, and your college selection.",
          });
      }
      id = result?.data?.id;
      return res.status(200).json({ saved: true, ...(id ? { id } : {}) });
    }
    const sheetId = new URL(
      req.url ?? "/",
      "http://localhost",
    ).searchParams.get("sheetId");
    if (sheetId) {
      if (!/^[a-f0-9-]{36}$/i.test(sheetId))
        return res.status(400).json({ error: "Choose a valid sheet." });
      const [sheet, items, permission] = await Promise.all([
        client
          .from("training_lists")
          .select(
            "id,title,description,visibility,category,created_by,updated_at,source_url,training_items(count)",
          )
          .eq("id", sheetId)
          .maybeSingle(),
        client
          .from("training_items")
          .select(
            "id,position,problem_id,problems(id,provider,external_problem_id,title,url,cf_rating,lc_difficulty,tags)",
          )
          .eq("training_list_id", sheetId)
          .order("position")
          .limit(2000),
        client.rpc("can_edit_sheet", { p_sheet: sheetId }),
      ]);
      if (sheet.error || items.error || permission.error)
        throw new Error("Unavailable");
      if (!sheet.data)
        return res
          .status(404)
          .json({
            error:
              "This sheet is private, deleted, or unavailable to your account.",
          });
      return res
        .status(200)
        .json({
          sheet: sheet.data,
          items: items.data,
          canEdit: permission.data,
        });
    }
    const [questions, notes, sheets, follows, invitations, collaborations] =
      await Promise.all([
        ownRows(
          client,
          "workspace_questions",
          "id,problem_id,study_status,starred,custom_tags,last_reviewed_at,created_at,updated_at,problems(id,provider,external_problem_id,title,url,cf_rating,lc_difficulty,tags)",
          user.id,
        ),
        ownRows(
          client,
          "study_notes",
          "id,question_id,title,body,updated_at",
          user.id,
        ),
        client
          .from("training_lists")
          .select(
            "id,title,description,visibility,category,created_by,updated_at,source_url,training_items(count)",
          )
          .order("updated_at", { ascending: false })
          .limit(200),
        ownRows(client, "sheet_follows", "id,sheet_id", user.id),
        client.rpc("pending_sheet_invitations"),
        ownRows(
          client,
          "sheet_collaborators",
          "id,sheet_id,role,status",
          user.id,
        ),
      ]);
    if (sheets.error || invitations.error) throw new Error("Unavailable");
    const counts = await client.rpc("sheet_follower_counts", {
      p_sheets: (sheets.data ?? []).map((row) => row.id),
    });
    if (counts.error) throw counts.error;
    return res
      .status(200)
      .json({
        questions,
        notes,
        sheets: (sheets.data ?? []).map((row) => ({
          ...row,
          followers:
            counts.data?.find((count: any) => count.sheet_id === row.id)
              ?.followers ?? 0,
        })),
        follows,
        invitations: invitations.data,
        collaborations,
      });
  } catch (error) {
    return res
      .status(
        error instanceof ProviderError && error.code === "provider_not_found"
          ? 400
          : 503,
      )
      .json({
        error:
          error instanceof ProviderError
            ? error.message
            : "Your study workspace is temporarily unavailable. Saved items are preserved; retry shortly.",
      });
  } finally {
    flushCookies();
  }
}
