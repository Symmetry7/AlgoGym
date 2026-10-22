import { readFileSync, writeFileSync } from "node:fs";

const envPath = new URL("../.env.local", import.meta.url);
const source = readFileSync(envPath, "utf8");
const env = Object.fromEntries(source.split(/\r?\n/).filter(line => /^[A-Z_]+=/.test(line)).map(line => {
  const index = line.indexOf("=");
  return [line.slice(0, index), line.slice(index + 1).trim().replace(/^(["'])(.*)\1$/, "$2")];
}));

if (!env.RAZORPAY_KEY_ID?.startsWith("rzp_test_") || !env.RAZORPAY_KEY_SECRET) {
  throw new Error("Set Razorpay test key ID and secret in .env.local first.");
}

const authorization = `Basic ${Buffer.from(`${env.RAZORPAY_KEY_ID}:${env.RAZORPAY_KEY_SECRET}`).toString("base64")}`;
async function api(path, body) {
  const response = await fetch(`https://api.razorpay.com/v1/${path}`, {
    method: body ? "POST" : "GET",
    headers: { Authorization: authorization, "Content-Type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!response.ok) {
    const detail = response.status === 401
      ? "This account cannot access Razorpay Plans. Check Subscriptions in the dashboard or ask Razorpay to enable it."
      : `Razorpay returned HTTP ${response.status}.`;
    throw new Error(detail);
  }
  return response.json();
}

const list = await api("plans?count=100"); // Verify access before creating either plan.
const specs = [
  { tier: "PRO", name: "AlgoGym Pro", amount: 19900 },
  { tier: "PREMIUM", name: "AlgoGym Premium", amount: 39900 },
];
const updates = {};
for (const spec of specs) {
  const field = `RAZORPAY_PLAN_${spec.tier}`;
  const existing = list.items.find(plan => plan.id === env[field]) ?? list.items.find(plan =>
    plan.period === "monthly" && plan.interval === 1 && plan.item?.name === spec.name &&
    plan.item?.amount === spec.amount && plan.item?.currency === "INR"
  );
  if (env[field] && existing?.id !== env[field]) {
    throw new Error(`${field} is configured but was not found among this account's test plans.`);
  }
  if (existing && (existing.period !== "monthly" || existing.interval !== 1 ||
    existing.item?.amount !== spec.amount || existing.item?.currency !== "INR")) {
    throw new Error(`${field} points to a plan with the wrong price or billing period.`);
  }
  const plan = existing ?? await api("plans", {
    period: "monthly", interval: 1,
    item: { name: spec.name, amount: spec.amount, currency: "INR" },
  });
  updates[field] = plan.id;
  console.log(`${spec.name}: ${plan.id} (${existing ? "existing" : "created"})`);
}

let next = source;
for (const [field, value] of Object.entries(updates)) {
  const line = new RegExp(`^${field}=.*$`, "m");
  next = line.test(next) ? next.replace(line, `${field}=${value}`) : `${next.trimEnd()}\n${field}=${value}\n`;
}
writeFileSync(envPath, next);
console.log("Saved test plan IDs to .env.local. Restart the dev server after configuring the webhook.");
