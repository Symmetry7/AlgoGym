import { beforeEach, describe, expect, it, vi } from "vitest";
import type { ApiResponse } from "../supabase";

const mocks = vi.hoisted(() => ({ getUser: vi.fn(), rpc: vi.fn(), flushCookies: vi.fn() }));
vi.mock("../supabase", () => ({
  originFromRequest: () => "http://localhost:8080",
  serverSupabase: () => ({ client: { auth: { getUser: mocks.getUser }, rpc: mocks.rpc }, flushCookies: mocks.flushCookies }),
}));
vi.mock("../admin", () => ({ adminSupabase: vi.fn() }));
vi.mock("../codeforces-contest-catalog", () => ({ codeforcesContestCatalog: vi.fn(), resolveCodeforcesContestProblem: vi.fn() }));
vi.mock("../society-contest-sync", () => ({ syncSocietyContest: vi.fn() }));

import workspaceHandler from "./society-workspace";
import contestHandler from "./society-contests";

const societyId = "81863c14-6144-4df0-a030-60ee119489f0";
const contentId = "30870cd4-496c-41c2-a76c-f18b9149f593";

async function post(handler: typeof workspaceHandler, body: unknown, url: string) {
  const response = { status: vi.fn().mockReturnThis(), json: vi.fn(), setHeader: vi.fn() };
  await handler({ method: "POST", url, headers: { origin: "http://localhost:8080" }, body }, response as unknown as ApiResponse);
  return response;
}

describe("society admin deletion endpoints", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.getUser.mockResolvedValue({ data: { user: { id: "member" } }, error: null });
    mocks.rpc.mockResolvedValue({ data: null, error: null });
  });

  it("passes the society and announcement IDs to the database permission gate", async () => {
    const response = await post(workspaceHandler, { action: "deleteAnnouncement", announcementId: contentId }, `/api/societies/workspace?societyId=${societyId}`);
    expect(mocks.rpc).toHaveBeenCalledWith("delete_society_announcement", { p_society: societyId, p_announcement: contentId });
    expect(response.status).toHaveBeenCalledWith(200);
  });

  it("passes contest deletion through its database permission gate", async () => {
    const response = await post(contestHandler, { action: "deleteContest", contestId: contentId }, "/api/societies/contests");
    expect(mocks.rpc).toHaveBeenCalledWith("delete_society_contest", { p_contest: contentId });
    expect(response.status).toHaveBeenCalledWith(200);
  });

  it.each(["workspace", "contest"])("returns forbidden for a non-admin %s deletion", async (kind) => {
    mocks.rpc.mockResolvedValue({ data: null, error: { message: "Not authorized" } });
    const handler = kind === "workspace" ? workspaceHandler : contestHandler;
    const body = kind === "workspace" ? { action: "deleteAnnouncement", announcementId: contentId } : { action: "deleteContest", contestId: contentId };
    const response = await post(handler, body, `/api/societies/${kind}?societyId=${societyId}`);
    expect(response.status).toHaveBeenCalledWith(403);
  });

  it("rejects invalid IDs without calling the database", async () => {
    const response = await post(contestHandler, { action: "deleteContest", contestId: "bad" }, "/api/societies/contests");
    expect(response.status).toHaveBeenCalledWith(400);
    expect(mocks.rpc).not.toHaveBeenCalled();
  });
});
