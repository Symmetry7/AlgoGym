import { chromium } from "playwright-core";
import { existsSync, mkdirSync } from "node:fs";
import { resolve } from "node:path";

const executablePath = [
  "C:/Program Files/Google/Chrome/Application/chrome.exe",
  "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe",
].find(existsSync);
if (!executablePath) throw new Error("Chrome or Edge is required.");
const browser = await chromium.launch({ headless: true, executablePath });
const root = resolve("artifacts/interview-qa");
mkdirSync(root, { recursive: true });
const origin = process.env.INTERVIEW_QA_ORIGIN ?? "http://127.0.0.1:8080";
const sizes = [
  [375, 812],
  [430, 932],
  [768, 1024],
  [1280, 800],
  [1440, 900],
  [1920, 1080],
];
const failures = [];
try {
  for (const [width, height] of sizes) {
    const page = await browser.newPage({
      viewport: { width, height },
      deviceScaleFactor: 1,
    });
    const errors = [];
    page.on("pageerror", (error) => errors.push(error.message));
    page.on("console", (message) => {
      if (message.type() === "error")
        process.stdout.write(`CONSOLE ${message.text().slice(0, 250)}\n`);
    });
    page.on("response", (response) => {
      if (response.url().includes("/api/interview"))
        process.stdout.write(`API ${response.status()} ${response.url()}\n`);
    });
    page.on("requestfailed", (request) => {
      if (request.url().includes("/api/interview"))
        process.stdout.write(`API FAILED ${request.failure()?.errorText}\n`);
    });
    for (const [name, path] of [
      ["directory", "/interview-preparations/company-wise"],
      ["google", "/interview-preparations/company-wise/google"],
    ]) {
      const response = await page.goto(`${origin}${path}`, {
        waitUntil: "domcontentloaded",
      });
      await page
        .locator(".ip-company-card,.ip-table,.ip-error")
        .first()
        .waitFor({ timeout: 30000 })
        .catch(async (error) => {
          process.stdout.write(
            `LOAD DEBUG ${name} ${width}: ${(await page.locator("body").innerText()).slice(-650)} errors=${JSON.stringify(errors)}\n`,
          );
          await page.screenshot({
            path: resolve(root, `debug-${name}-${width}.png`),
          });
          throw error;
        });
      const measure = await page.evaluate(() => ({
        title: document.querySelector("h1")?.textContent,
        overflow: document.documentElement.scrollWidth - window.innerWidth,
        cards: document.querySelectorAll(".ip-company-card").length,
        rows: document.querySelectorAll(".ip-table tbody tr").length,
        error: document.querySelector(".ip-error")?.textContent,
      }));
      await page.screenshot({
        path: resolve(root, `algogym-${name}-${width}.png`),
        fullPage: false,
      });
      if (
        response?.status() !== 200 ||
        measure.overflow > 2 ||
        measure.error ||
        errors.length ||
        !measure.title ||
        (!measure.cards && !measure.rows)
      )
        failures.push({
          name,
          width,
          status: response?.status(),
          ...measure,
          errors,
        });
      if (name === "directory" && width === 1280) {
        await page
          .getByRole("searchbox", { name: "Search companies" })
          .fill("pAy");
        const names = await page
          .locator(".ip-company-head strong")
          .allTextContents();
        if (
          JSON.stringify(names) !==
          JSON.stringify(["PayPal", "Razorpay", "Paytm"])
        )
          failures.push({ interaction: "search", names });
        await page
          .getByRole("searchbox", { name: "Search companies" })
          .fill("no-such-company");
        if (!(await page.locator(".ip-empty").isVisible()))
          failures.push({ interaction: "search-empty" });
      }
      if (name === "google" && width === 1280) {
        await page.getByRole("button", { name: "Read More" }).click();
        if (
          !(await page.getByRole("button", { name: "Read Less" }).isVisible())
        )
          failures.push({ interaction: "read-more" });
      }
      process.stdout.write(`${name} ${width}: ${JSON.stringify(measure)}\n`);
    }
    if (width === 1280) {
      await page
        .getByRole("combobox", { name: "Difficulty" })
        .selectOption("Hard");
      const hard = await page.locator(".ip-table tbody tr").count();
      await page
        .getByRole("button", { name: "Bookmarked", exact: true })
        .click();
      const bookmarked = await page.locator(".ip-empty").count();
      if (hard < 1 || bookmarked !== 1)
        failures.push({ interaction: "filters", hard, bookmarked });
      process.stdout.write(
        `filters: hard=${hard}, bookmarked-empty=${bookmarked}\n`,
      );
    }
    if (width === 375) {
      await page.getByRole("button", { name: "Open navigation" }).click();
      if (
        !(await page
          .locator(".ip-sidebar")
          .evaluate((node) => node.classList.contains("ip-sidebar-open")))
      )
        failures.push({ interaction: "mobile-menu" });
    }
    if (width === 430 || width === 1440) {
      await page.goto(`${origin}/interview-preparations/sql`, {
        waitUntil: "domcontentloaded",
      });
      await page
        .locator(".ip-table tbody tr")
        .first()
        .waitFor({ timeout: 30000 });
      const sql = await page.locator(".ip-table tbody tr").count();
      if (sql !== 8) failures.push({ interaction: "sql-sheet", width, sql });
      await page.screenshot({
        path: resolve(root, `algogym-sql-${width}.png`),
        fullPage: false,
      });
    }
    if (width === 1440) {
      await page.goto(`${origin}/interview-preparations/patterns`, {
        waitUntil: "domcontentloaded",
      });
      await page
        .locator(".ip-pattern-list section")
        .first()
        .waitFor({ timeout: 30000 });
      const count = await page.locator(".ip-pattern-list section").count();
      await page.getByRole("button", { name: /Fast and Slow Pointer/ }).click();
      const open = await page
        .locator(".ip-pattern-body .ip-table tbody tr")
        .count();
      if (count < 20 || open < 1)
        failures.push({ interaction: "patterns", count, open });
      await page.screenshot({
        path: resolve(root, "algogym-patterns-1440.png"),
        fullPage: false,
      });
    }
    await page.close();
  }
  const reference = await browser.newPage({
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 1,
  });
  await reference.emulateMedia({ colorScheme: "dark" });
  for (const [name, path] of [
    ["directory", "/preparation/company-wise-dsa-sheet/"],
    [
      "google",
      "/preparation/company-wise-dsa-sheet/google-dsa-interview-questions/",
    ],
  ]) {
    try {
      await reference.goto(`https://hynts.in${path}`, {
        waitUntil: "domcontentloaded",
        timeout: 30000,
      });
      await reference.screenshot({
        path: resolve(root, `reference-${name}-1440.png`),
        fullPage: false,
      });
      process.stdout.write(`Reference screenshot: ${name}\n`);
    } catch (error) {
      process.stdout.write(
        `Reference capture failed: ${name}: ${error.message}\n`,
      );
    }
  }
  await reference.close();
} finally {
  await browser.close();
}
if (failures.length) {
  console.error(JSON.stringify(failures, null, 2));
  process.exitCode = 1;
}
