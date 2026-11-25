import { z } from "zod";
const uuid = z.string().uuid();
const title = z.string().trim().min(1).max(160);
const category = z.enum([
  "competitive",
  "complete-dsa",
  "quick-revision",
  "topic-specific",
  "company-wise",
]);
export const studyAction = z.discriminatedUnion("action", [
  z
    .object({
      action: z.literal("question.add"),
      url: z.string().url().max(500),
    })
    .strict(),
  z
    .object({
      action: z.literal("question.update"),
      id: uuid,
      status: z.enum(["planned", "in_progress", "completed"]).optional(),
      starred: z.boolean().optional(),
      tags: z.array(z.string().trim().min(1).max(32)).max(10).optional(),
      reviewed: z.boolean().optional(),
    })
    .strict(),
  z.object({ action: z.literal("question.delete"), id: uuid }).strict(),
  z
    .object({
      action: z.literal("note.save"),
      id: uuid.optional(),
      questionId: uuid.nullable().optional(),
      title,
      body: z.string().max(40000),
    })
    .strict(),
  z.object({ action: z.literal("note.delete"), id: uuid }).strict(),
  z
    .object({
      action: z.literal("sheet.create"),
      title,
      description: z.string().trim().max(2000),
      visibility: z.enum(["private", "public", "college"]),
      category,
    })
    .strict(),
  z
    .object({
      action: z.literal("sheet.update"),
      id: uuid,
      title,
      description: z.string().trim().max(2000),
      visibility: z.enum(["private", "public", "college"]),
      category,
    })
    .strict(),
  z.object({ action: z.literal("sheet.delete"), id: uuid }).strict(),
  z
    .object({ action: z.literal("sheet.add"), sheetId: uuid, problemId: uuid })
    .strict(),
  z.object({ action: z.literal("sheet.remove"), id: uuid }).strict(),
  z
    .object({
      action: z.literal("sheet.follow"),
      sheetId: uuid,
      follow: z.boolean(),
    })
    .strict(),
  z
    .object({
      action: z.literal("sheet.invite"),
      sheetId: uuid,
      username: z
        .string()
        .trim()
        .regex(/^[a-zA-Z0-9_-]{3,30}$/),
      role: z.enum(["viewer", "editor"]),
    })
    .strict(),
  z
    .object({
      action: z.literal("sheet.respond"),
      id: uuid,
      accept: z.boolean(),
    })
    .strict(),
]);
export function parseProblemURL(value: string) {
  const url = new URL(value);
  if (url.protocol !== "https:" || url.username || url.password || url.port)
    throw new Error("Use a public HTTPS Codeforces or LeetCode problem URL.");
  const host = url.hostname.toLowerCase().replace(/^www\./, "");
  if (host === "codeforces.com") {
    const match = url.pathname.match(
      /^\/(?:problemset\/problem\/(\d+)\/([A-Za-z0-9]+)|contest\/(\d+)\/problem\/([A-Za-z0-9]+))\/?$/,
    );
    if (match) {
      const contest = match[1] ?? match[3];
      const index = match[2] ?? match[4];
      return {
        provider: "codeforces" as const,
        id: `${contest}:${index}`,
        contest: Number(contest),
        index,
        url: `https://codeforces.com/problemset/problem/${contest}/${index}`,
      };
    }
  }
  if (host === "leetcode.com") {
    const match = url.pathname.match(
      /^\/problems\/([a-z0-9-]+)(?:\/(?:description|solutions|submissions|editorial))?\/?$/,
    );
    if (match)
      return {
        provider: "leetcode" as const,
        id: match[1],
        url: `https://leetcode.com/problems/${match[1]}/`,
      };
  }
  throw new Error("Enter a supported Codeforces or LeetCode problem URL.");
}
