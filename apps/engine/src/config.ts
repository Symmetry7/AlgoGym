// Environment for the engine API and worker. Fails fast at start-up with a message naming what's missing.
export interface Config {
  port: number;
  redisUrl: string;
  secrets: string[];
  queueName: string;
}

export function readConfig(env: NodeJS.ProcessEnv = process.env): Config {
  const missing = ["REDIS_URL", "ENGINE_HMAC_SECRET"].filter((k) => !env[k]);
  if (missing.length) throw new Error(`Missing environment variables: ${missing.join(", ")}`);
  const secrets = [env.ENGINE_HMAC_SECRET!, env.ENGINE_HMAC_SECRET_PREVIOUS].filter((s): s is string => Boolean(s));
  if (secrets.some((s) => s.length < 32)) throw new Error("ENGINE_HMAC_SECRET must be at least 32 characters.");
  return {
    port: Number(env.PORT ?? 8080),
    redisUrl: env.REDIS_URL!,
    secrets,
    queueName: env.JUDGE_QUEUE ?? "judge",
  };
}
