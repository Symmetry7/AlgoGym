// M2 checks: node scripts/qa/legacy-freeze-qa.mjs [baseUrl]  (server must be running)
import { existsSync } from "node:fs";
import assert from "node:assert/strict";
import { chromium } from "playwright-core";

const base = process.argv[2] ?? "http://localhost:8080";
const removed = [
  "/dashboard", "/onboarding", "/training", "/training/symm", "/training/symm/library", "/train/1", "/upsolve",
  "/sheets", "/resources", "/workspace", "/notes", "/statistics", "/leaderboards", "/contests", "/societies",
  "/societies/some-club/manage", "/admin", "/profile", "/profile/card", "/u/someone",
];
const kept = ["/", "/sign-in", "/pricing", "/privacy", "/problems", "/interview-preparations", "/settings"];
const results = [];
const check = async (name, fn) => {
  try {
    await fn();
    results.push(`PASS ${name}`);
  } catch (error) {
    results.push(`FAIL ${name}: ${error.message.split("\n")[0]}`);
  }
};

for (const path of removed) {
  await check(`${path} redirects to /problems`, async () => {
    const res = await fetch(base + path, { redirect: "manual" });
    assert.equal(res.status, 307);
    assert.equal(new URL(res.headers.get("location"), base).pathname, "/problems");
  });
}
for (const path of kept) {
  await check(`${path} responds 200`, async () => assert.equal((await fetch(base + path)).status, 200));
}

const browser = await chromium.launch({
  executablePath: ["C:/Program Files/Google/Chrome/Application/chrome.exe", "/usr/bin/google-chrome"].find(existsSync),
});
for (const width of [375, 1440]) {
  const page = await browser.newPage({ viewport: { width, height: 900 } });
  const errors = [];
  page.on("console", (m) => m.type() === "error" && !m.text().startsWith("Failed to load resource") && errors.push(m.text()));
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto(base + "/", { waitUntil: "load" });
  await check(`${width}px holding page: one h1, links to problems and interview prep`, async () => {
    assert.equal(await page.locator("h1").count(), 1);
    assert.ok(await page.getByRole("main").getByRole("link", { name: "Browse problems" }).isVisible());
    assert.ok(await page.getByRole("main").getByRole("link", { name: "Interview prep" }).isVisible());
  });
  await check(`${width}px holding page: no horizontal scroll`, async () => {
    assert.ok((await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)) <= 0);
  });
  await check(`${width}px holding page: no console errors`, async () => assert.deepEqual(errors, [], errors.join(" | ")));
  await page.screenshot({ path: `artifacts/design-qa/holding-${width}.png` });
  await page.close();
}
await browser.close();

console.log(results.join("\n"));
if (results.some((r) => r.startsWith("FAIL"))) process.exit(1);
