// Logs every request a page makes for a while, to find what keeps the network busy.
// Usage: node scripts/qa/network-idle-probe.mjs [url] [seconds]
import { existsSync } from "node:fs";
import { chromium } from "playwright-core";

const url = process.argv[2] ?? "http://localhost:8080/";
const seconds = Number(process.argv[3] ?? 30);
const browser = await chromium.launch({
  executablePath: ["C:/Program Files/Google/Chrome/Application/chrome.exe", "/usr/bin/google-chrome"].find(existsSync),
});
const page = await browser.newPage();
const start = Date.now();
const open = new Map();
const t = () => `${((Date.now() - start) / 1000).toFixed(1)}s`;
page.on("request", (r) => { open.set(r, Date.now()); console.log(`${t()} → ${r.method()} ${r.url().replace(/^https?:\/\/[^/]+/, "")} [${r.resourceType()}]`); });
page.on("requestfinished", async (r) => { open.delete(r); const res = await r.response(); console.log(`${t()} ✓ ${res?.status()} ${r.url().replace(/^https?:\/\/[^/]+/, "")}`); });
page.on("requestfailed", (r) => { open.delete(r); console.log(`${t()} ✗ ${r.failure()?.errorText} ${r.url()}`); });
await page.goto(url, { waitUntil: "load" });
await page.waitForTimeout(seconds * 1000);
console.log(`--- still open after ${seconds}s: ${open.size}`);
for (const [r, at] of open) console.log(`  open since ${((at - start) / 1000).toFixed(1)}s: ${r.url()}`);
await browser.close();
