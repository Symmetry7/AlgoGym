// Judge worker process (separate from the API). M10: consumes jobs and logs them. M11 adds the Judge0 call,
// comparison and result writes (SYSTEM_ARCHITECTURE.md §4.1-4.2). The worker never runs user code itself.
import { Worker } from "bullmq";
import { Redis } from "ioredis";
import { readConfig } from "./config.ts";
import type { Job } from "./app.ts";

const config = readConfig();
const connection = new Redis(config.redisUrl, { maxRetriesPerRequest: null, family: 0 });

const worker = new Worker<Job>(
  config.queueName,
  async (job) => {
    console.log(JSON.stringify({ event: "job.received", jobId: job.id, mode: job.data.mode, attempt: job.attemptsMade + 1 }));
    // shortcut: no judging until M11; the job completes so the queue drains in staging.
    return { status: "accepted-by-skeleton" };
  },
  { connection, concurrency: 4 },
);

worker.on("failed", (job, error) => console.error(JSON.stringify({ event: "job.failed", jobId: job?.id, message: error.message })));

const shutdown = async () => {
  await worker.close();
  connection.disconnect();
  process.exit(0);
};
process.on("SIGTERM", shutdown);
process.on("SIGINT", shutdown);
