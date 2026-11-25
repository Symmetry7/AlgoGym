import { beforeEach, describe, expect, it, vi } from "vitest";
import type { ApiResponse } from "../supabase";

const mocks = vi.hoisted(() => ({
  getUser: vi.fn(),
  update: vi.fn(),
  eq: vi.fn(),
  single: vi.fn(),
  flushCookies: vi.fn(),
}));
vi.mock("../supabase", () => ({
  originFromRequest: () => "http://localhost:8080",
  serverSupabase: () => ({
    client: {
      auth: { getUser: mocks.getUser },
      from: () => ({
        update: mocks.update,
      }),
    },
    flushCookies: mocks.flushCookies,
  }),
}));
import handler from "./account-profile";

async function patch(body: unknown) {
  const response = {
    status: vi.fn().mockReturnThis(),
    json: vi.fn(),
    setHeader: vi.fn(),
  };
  await handler(
    { method: "PATCH", headers: { origin: "http://localhost:8080" }, body },
    response as unknown as ApiResponse,
  );
  return response;
}

describe("profile settings updates", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.getUser.mockResolvedValue({ data: { user: { id: "owner-id" } }, error: null });
    mocks.update.mockReturnValue({ eq: mocks.eq });
    mocks.eq.mockReturnValue({ select: () => ({ single: mocks.single }) });
    mocks.single.mockResolvedValue({ data: { username: "new_username" }, error: null });
  });

  it("saves a changed username when all optional portfolio links are empty", async () => {
    const response = await patch({
      displayName: "Member",
      username: "new_username",
      bio: "",
      countryCode: "",
      websiteUrl: "",
      githubUrl: "",
      linkedinUrl: "",
      xUrl: "",
    });
    expect(response.status).toHaveBeenCalledWith(200);
    expect(mocks.update).toHaveBeenCalledWith(expect.objectContaining({
      username: "new_username", bio: "", country_code: null,
      website_url: null, github_url: null, linkedin_url: null, x_url: null,
    }));
    expect(mocks.eq).toHaveBeenCalledWith("id", "owner-id");
    expect(mocks.flushCookies).toHaveBeenCalledOnce();
  });

  it.each(["not-a-url", "http://example.com", "https://user:pass@example.com", "https://example.com:8443"])(
    "returns a validation error for %s without throwing", async (websiteUrl) => {
      const response = await patch({ username: "new_username", websiteUrl });
      expect(response.status).toHaveBeenCalledWith(400);
      expect(mocks.update).not.toHaveBeenCalled();
    },
  );

  it("accepts an HTTPS portfolio link", async () => {
    const response = await patch({ websiteUrl: "https://example.com/about" });
    expect(response.status).toHaveBeenCalledWith(200);
  });

  it("supports updating only the username", async () => {
    const response = await patch({ username: "new-name" });
    expect(response.status).toHaveBeenCalledWith(200);
    expect(mocks.update).toHaveBeenCalledWith({ username: "new-name", updated_at: expect.any(String) });
  });

  it("reports a username conflict", async () => {
    mocks.single.mockResolvedValue({ data: null, error: { code: "23505" } });
    const response = await patch({ username: "taken_name" });
    expect(response.status).toHaveBeenCalledWith(409);
    expect(response.json).toHaveBeenCalledWith({ error: "This AlgoGym username is already taken." });
  });
});
