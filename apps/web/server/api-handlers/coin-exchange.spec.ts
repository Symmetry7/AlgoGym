import { beforeEach, describe, expect, it, vi } from "vitest";
import type { ApiResponse } from "../supabase";

const mocks = vi.hoisted(() => ({ getUser: vi.fn(), rpc: vi.fn(), flushCookies: vi.fn() }));
vi.mock("../admin", () => ({ adminSupabase: () => ({ rpc: mocks.rpc }) }));
vi.mock("../ai-credits", () => ({ creditsEnabled: () => true }));
vi.mock("../supabase", () => ({
  originFromRequest: () => "http://localhost:8080",
  serverSupabase: () => ({ client: { auth: { getUser: mocks.getUser } }, flushCookies: mocks.flushCookies }),
}));
import handler from "./coin-exchange";

const operationKey = "81863c14-6144-4df0-a030-60ee119489f0";
async function post(body: unknown, origin = "http://localhost:8080") {
  const response = { status: vi.fn().mockReturnThis(), json: vi.fn(), setHeader: vi.fn() };
  await handler({ method: "POST", headers: { origin }, body }, response as unknown as ApiResponse);
  return response;
}

describe("Coin to AI credit exchange", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.getUser.mockResolvedValue({ data: { user: { id: "owner-id" } }, error: null });
    mocks.rpc.mockResolvedValue({ data: { coins: 9000, credits: 103, exchanged: 10 }, error: null });
  });

  it("passes the authenticated user and idempotency key to the atomic database function", async () => {
    const response = await post({ coins: 1000, operationKey });
    expect(mocks.rpc).toHaveBeenCalledWith("exchange_coins_for_ai_credits", {
      p_user: "owner-id", p_operation_key: operationKey, p_coins: 1000,
    });
    expect(response.status).toHaveBeenCalledWith(200);
    expect(response.json).toHaveBeenCalledWith({ coins: 9000, credits: 103, exchanged: 10 });
    expect(mocks.flushCookies).toHaveBeenCalledOnce();
  });

  it.each([100, 5000, -1000])("rejects unsupported amount %d", async (coins) => {
    const response = await post({ coins, operationKey });
    expect(response.status).toHaveBeenCalledWith(400);
    expect(mocks.rpc).not.toHaveBeenCalled();
  });

  it("rejects a cross-origin request before touching the account", async () => {
    const response = await post({ coins: 1000, operationKey }, "https://other.example");
    expect(response.status).toHaveBeenCalledWith(403);
    expect(mocks.getUser).not.toHaveBeenCalled();
  });

  it("reports insufficient Coins without crediting the account", async () => {
    mocks.rpc.mockResolvedValue({ data: null, error: { message: "Not enough Coins" } });
    const response = await post({ coins: 10000, operationKey });
    expect(response.status).toHaveBeenCalledWith(409);
  });
});
