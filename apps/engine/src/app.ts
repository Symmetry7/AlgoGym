// The engine's HTTP API (SYSTEM_ARCHITECTURE.md §6 "Engine"). Built from injected dependencies, so tests need no Redis.
import express, { type Request, type Response } from "express";
import { z } from "zod";
import { SIGNATURE_HEADER, TIMESTAMP_HEADER, verify } from "./hmac.ts";

export const JobSchema = z.object({
  submissionId: z.string().uuid(),
  userId: z.string().uuid(),
  mode: z.enum(["run", "submit"]),
}).strict();
export type Job = z.infer<typeof JobSchema>;

export interface Deps {
  secrets: string[];
  /** Adds the job; must be idempotent per submissionId (BullMQ jobId). Returns the job id. */
  enqueue: (job: Job) => Promise<string>;
  /** Checks the queue backend. Resolves to true when healthy. */
  health: () => Promise<boolean>;
  now?: () => number; // seconds, for tests
  log?: (event: string, fields: Record<string, unknown>) => void;
}

const MAX_BODY = "16kb"; // a job is a few ids; code lives in Postgres, not in the request

export function createApp(deps: Deps) {
  const now = deps.now ?? (() => Math.floor(Date.now() / 1000));
  const log = deps.log ?? ((event, fields) => console.log(JSON.stringify({ event, ...fields })));
  const app = express();
  app.disable("x-powered-by");
  app.set("trust proxy", true);

  app.get("/v1/health", async (_req: Request, res: Response) => {
    const redis = await deps.health().catch(() => false);
    res.status(redis ? 200 : 503).json({ ok: redis, redis: redis ? "up" : "down" });
  });

  // Keep the raw body: the HMAC covers the exact bytes that were sent, not a re-serialised object.
  app.post("/v1/jobs", express.text({ type: "*/*", limit: MAX_BODY }), async (req: Request, res: Response) => {
    const raw = typeof req.body === "string" ? req.body : "";
    const check = verify(deps.secrets, req.get(TIMESTAMP_HEADER), req.get(SIGNATURE_HEADER), raw, now());
    if (!check.ok) {
      log("job.rejected", { reason: check.reason, ip: req.ip });
      res.status(401).json({ error: "Unauthorized" }); // same answer for every reason: don't help a forger
      return;
    }
    let body: unknown;
    try { body = JSON.parse(raw); } catch { res.status(400).json({ error: "Body must be JSON." }); return; }
    const job = JobSchema.safeParse(body);
    if (!job.success) { res.status(400).json({ error: "Invalid job.", issues: job.error.issues.map((i) => `${i.path.join(".") || "body"}: ${i.message}`) }); return; }
    try {
      const jobId = await deps.enqueue(job.data);
      log("job.queued", { jobId, mode: job.data.mode });
      res.status(202).json({ jobId });
    } catch (error) {
      log("job.enqueue_failed", { message: error instanceof Error ? error.message : String(error) });
      res.status(503).json({ error: "The judge queue is unavailable. Try again shortly." });
    }
  });

  app.use((_req: Request, res: Response) => { res.status(404).json({ error: "Not found" }); });
  return app;
}
