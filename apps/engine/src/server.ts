// Engine API process: Express + BullMQ producer. Start with `npm start -w @algogym/engine` after `build`.
import { Queue } from "bullmq";
import { Redis } from "ioredis";
import { createApp } from "./app.ts";
import { readConfig } from "./config.ts";

const config = readConfig();
// The API is a producer: fail fast when Redis is down (503) instead of queueing commands offline and hanging.
// family: 0 lets ioredis use IPv6, which Railway's private network (redis.railway.internal) needs.
const connection = new Redis(config.redisUrl, { maxRetriesPerRequest: 1, enableOfflineQueue: false, family: 0 });
connection.on("error", (e) => console.error(JSON.stringify({ event: "redis.error", message: e.message })));
const within = <T>(ms: number, p: Promise<T>) => Promise.race([p, new Promise<never>((_, reject) => setTimeout(() => reject(new Error("timeout")), ms))]);
const queue = new Queue(config.queueName, { connection });

const app = createApp({
  secrets: config.secrets,
  enqueue: async (job) => {
    // BullMQ would wait for Redis to come back; the web app should get a 503 now and keep the user's code.
    if (connection.status !== "ready") throw new Error(`redis ${connection.status}`);
    // jobId = submissionId: a retried POST can't queue the same submission twice.
    const added = await within(5000, queue.add(job.mode, job, {
      jobId: job.submissionId,
      attempts: 3,
      backoff: { type: "exponential", delay: 2000 },
      removeOnComplete: { age: 24 * 3600, count: 5000 },
      removeOnFail: { age: 7 * 24 * 3600 },
    }));
    return added.id ?? job.submissionId;
  },
  health: async () => (await within(2000, connection.ping())) === "PONG",
});

const server = app.listen(config.port, () => console.log(JSON.stringify({ event: "engine.listening", port: config.port })));

const shutdown = async () => {
  server.close();
  await queue.close();
  connection.disconnect();
  process.exit(0);
};
process.on("SIGTERM", shutdown);
process.on("SIGINT", shutdown);
