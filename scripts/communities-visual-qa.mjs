import { chromium } from "playwright-core";
import { existsSync, mkdirSync } from "node:fs";
import { resolve } from "node:path";

const executablePath = [
  "C:/Program Files/Google/Chrome/Application/chrome.exe",
  "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe",
].find(existsSync);
if (!executablePath) throw new Error("Chrome or Edge is required.");
const root = resolve("artifacts/communities-qa");
mkdirSync(root, { recursive: true });
const browser = await chromium.launch({ headless: true, executablePath });
const origin = process.env.COMMUNITIES_QA_ORIGIN ?? "http://127.0.0.1:8080";
const widths = process.argv.includes("--quick") ? [430] : [375, 430, 768, 1280, 1440, 1920];
const routes = ["/societies", "/leaderboards"];
const failures = [];
try {
  for (const width of widths) {
    const page = await browser.newPage({ viewport: { width, height: 900 }, deviceScaleFactor: 1 });
    page.on("response", (response) => { if (response.url().includes("/api/societies") || response.url().includes("/api/leaderboards")) process.stdout.write(`API ${response.status()} ${new URL(response.url()).pathname}\n`); });
    page.on("pageerror", (error) => process.stdout.write(`PAGE ERROR ${error.message}\n`));
    page.on("console", (message) => { if (message.type() === "error") process.stdout.write(`CONSOLE ERROR ${message.text()}\n`); });
    page.on("requestfailed", (request) => { if (request.failure()?.errorText !== "net::ERR_ABORTED") process.stdout.write(`REQUEST FAILED ${request.url()} ${request.failure()?.errorText}\n`); });
    for (const route of routes) {
      const response = await page.goto(`${origin}${route}`, { waitUntil: "domcontentloaded" });
      await page.locator("main").first().waitFor({ state: "visible", timeout: 20000 }).catch(() => undefined);
      const loadingSelector = '[aria-label="Loading approved societies"], [aria-label="Calculating leaderboard"]';
      await page.locator(loadingSelector).first().waitFor({ state: "hidden", timeout: 30000 }).catch(() => undefined);
      const layout = await page.evaluate(() => ({ scroll: document.documentElement.scrollWidth, viewport: window.innerWidth, h1: document.querySelector("h1")?.textContent?.trim(), errors: [...document.querySelectorAll('[role="alert"]')].map((node) => node.textContent?.trim()).filter(Boolean), loading: !!document.querySelector('[aria-label="Loading approved societies"], [aria-label="Calculating leaderboard"]'), scripts: document.scripts.length }));
      await page.screenshot({ path: resolve(root, `${route.slice(1)}-${width}.png`), fullPage: true });
      if (response?.status() !== 200 || layout.scroll > width + 2 || !layout.h1 || layout.loading || layout.errors.length) failures.push({ route, width, status: response?.status(), ...layout });
      process.stdout.write(`${route} ${width}: status=${response?.status()} h1=${layout.h1} overflow=${layout.scroll - width} loading=${layout.loading} scripts=${layout.scripts}\n`);
    }
    await page.close();
  }
} finally { await browser.close(); }
if (failures.length) { console.error(JSON.stringify(failures, null, 2)); process.exitCode = 1; }
