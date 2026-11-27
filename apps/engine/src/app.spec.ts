import type { AddressInfo } from "node:net";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { createApp, type Job } from "./app.ts";
import { readConfig } from "./config.ts";
import { SIGNATURE_HEADER, TIMESTAMP_HEADER, sign, verify } from "./hmac.ts";

const SECRET = "s".repeat(40);
const OLD = "o".repeat(40);
const NOW = 1_800_000_000;
const job = { submissionId: "7d1f3c2a-1b2c-4d5e-8f90-123456789abc", userId: "a1111111-0000-4000-8000-00000000000a", mode: "run" };

const queued: Job[] = [];
let healthy = true;
let failEnqueue = false;
let base = "";
let close: () => void;

beforeAll(async () => {
  const app = createApp({
    secrets: [SECRET, OLD],
    now: () => NOW,
    log: () => {},
    enqueue: async (j) => { if (failEnqueue) throw new Error("redis down"); queued.push(j); return j.submissionId; },
    health: async () => healthy,
  });
  const server = app.listen(0);
  await new Promise((r) => server.once("listening", r));
  base = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
  close = () => server.close();
});
afterAll(() => close());

const post = (body: string, headers: Record<string, string>) => fetch(`${base}/v1/jobs`, { method: "POST", body, headers: { "content-type": "application/json", ...headers } });
const signed = (body: string, { secret = SECRET, ts = NOW } = {}) => ({ [TIMESTAMP_HEADER]: String(ts), [SIGNATURE_HEADER]: sign(secret, ts, body) });

describe("POST /v1/jobs", () => {
  it("queues a correctly signed job (202), and the old secret still works during rotation", async () => {
    const body = JSON.stringify(job);
    const res = await post(body, signed(body));
    expect(res.status).toBe(202);
    expect(await res.json()).toEqual({ jobId: job.submissionId });
    expect((await post(body, signed(body, { secret: OLD }))).status).toBe(202);
    expect(queued).toHaveLength(2);
  });
  it("rejects forged, tampered, expired and unsigned requests with 401 and queues nothing", async () => {
    const body = JSON.stringify(job);
    const before = queued.length;
    expect((await post(body, signed(body, { secret: "x".repeat(40) }))).status).toBe(401); // forged
    expect((await post(body.replace("run", "submit"), signed(body))).status).toBe(401); // tampered after signing
    expect((await post(body, signed(body, { ts: NOW - 61 }))).status).toBe(401); // expired
    expect((await post(body, signed(body, { ts: NOW + 61 }))).status).toBe(401); // from the future
    expect((await post(body, {})).status).toBe(401); // unsigned
    expect((await post(body, { [TIMESTAMP_HEADER]: String(NOW), [SIGNATURE_HEADER]: "zz" })).status).toBe(401); // malformed
    expect(queued.length).toBe(before);
  });
  it("validates the job after the signature", async () => {
    for (const bad of [JSON.stringify({ ...job, mode: "debug" }), JSON.stringify({ ...job, extra: 1 }), JSON.stringify({ submissionId: "nope" }), "not json"]) {
      const res = await post(bad, signed(bad));
      expect(res.status).toBe(400);
    }
  });
  it("returns 503 with a clear message when the queue is down", async () => {
    failEnqueue = true;
    const body = JSON.stringify(job);
    const res = await post(body, signed(body));
    failEnqueue = false;
    expect(res.status).toBe(503);
    expect((await res.json()).error).toMatch(/unavailable/);
  });
});

describe("GET /v1/health", () => {
  it("is 200 when Redis answers and 503 when it doesn't", async () => {
    expect((await fetch(`${base}/v1/health`)).status).toBe(200);
    healthy = false;
    const res = await fetch(`${base}/v1/health`);
    healthy = true;
    expect(res.status).toBe(503);
    expect(await res.json()).toEqual({ ok: false, redis: "down" });
  });
});

describe("hmac and config", () => {
  it("verifies exactly the signed bytes inside the window", () => {
    const body = '{"a":1}';
    expect(verify([SECRET], String(NOW), sign(SECRET, NOW, body), body, NOW + 60)).toEqual({ ok: true });
    expect(verify([SECRET], String(NOW), sign(SECRET, NOW, body), '{"a": 1}', NOW)).toEqual({ ok: false, reason: "bad-signature" });
  });
  it("fails fast on missing or weak settings", () => {
    expect(() => readConfig({})).toThrow(/REDIS_URL, ENGINE_HMAC_SECRET/);
    expect(() => readConfig({ REDIS_URL: "redis://x", ENGINE_HMAC_SECRET: "short" })).toThrow(/32 characters/);
    expect(readConfig({ REDIS_URL: "redis://x", ENGINE_HMAC_SECRET: SECRET, ENGINE_HMAC_SECRET_PREVIOUS: OLD, PORT: "9000" })).toMatchObject({ port: 9000, secrets: [SECRET, OLD] });
  });
});
