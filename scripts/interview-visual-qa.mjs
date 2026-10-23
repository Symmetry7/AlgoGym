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
      await page.goto(`${origin}/interview-preparations/package-wise`, {
        waitUntil: "domcontentloaded",
      });
      await page
        .locator(".ip-table tbody tr")
        .first()
        .waitFor({ timeout: 30000 });
      const packageCount = await page.locator(".ip-table tbody tr").count();
      await page
        .getByRole("combobox", { name: "Preparation stage" })
        .selectOption("Challenge");
      const challengeCount = await page.locator(".ip-table tbody tr").count();
      if (
        packageCount < 50 ||
        challengeCount < 1 ||
        challengeCount >= packageCount
      )
        failures.push({
          interaction: "package-stages",
          width,
          packageCount,
          challengeCount,
        });
      await page.screenshot({
        path: resolve(root, `algogym-package-wise-${width}.png`),
      });
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
      for (const [category, minimum] of [
        ["system-design", 10],
        ["hr-questions", 10],
        ["interview-questions", 8],
      ]) {
        await page.goto(`${origin}/interview-preparations/${category}`, {
          waitUntil: "domcontentloaded",
        });
        await page
          .locator(".ip-table tbody tr")
          .first()
          .waitFor({ timeout: 30000 });
        const count = await page.locator(".ip-table tbody tr").count();
        if (count < minimum)
          failures.push({ interaction: category, width, count });
        await page.screenshot({
          path: resolve(root, `algogym-${category}-${width}.png`),
        });
      }
      await page.goto(`${origin}/interview-preparations/cold-email-templates`, {
        waitUntil: "domcontentloaded",
      });
      await page
        .locator(".ip-template-card")
        .first()
        .waitFor({ timeout: 30000 });
      const templates = await page.locator(".ip-template-card").count();
      if (templates !== 8)
        failures.push({ interaction: "template-directory", width, templates });
      await page.screenshot({
        path: resolve(root, `algogym-templates-${width}.png`),
      });
      if (width === 1440) {
        await page
          .getByRole("searchbox", { name: "Search email templates" })
          .fill("alumni");
        if ((await page.locator(".ip-template-card").count()) !== 1)
          failures.push({ interaction: "template-search" });
        await page.locator(".ip-template-card").click();
        const editor = page.getByRole("textbox", { name: "Email body" });
        await editor.fill(
          "Hi [name],\n\nThis is a personalized test.\n\nBest,\n[me]",
        );
        if (!(await editor.inputValue()).includes("personalized test"))
          failures.push({ interaction: "template-edit" });
        await page
          .context()
          .grantPermissions(["clipboard-read", "clipboard-write"], { origin });
        await page.getByRole("button", { name: "Copy email" }).click();
        await page
          .getByRole("button", { name: "Copied" })
          .waitFor({ state: "visible", timeout: 3000 })
          .catch(() => {
            failures.push({ interaction: "template-copy" });
          });
        await page.screenshot({
          path: resolve(root, "algogym-template-detail-1440.png"),
        });
      }
      for (const resource of [
        "role-wise",
        "core-subjects",
        "cool-notes",
        "resume-templates",
      ]) {
        await page.goto(`${origin}/interview-preparations/${resource}`, {
          waitUntil: "domcontentloaded",
        });
        await page
          .locator(".ip-resource-card")
          .first()
          .waitFor({ timeout: 30000 });
        const cards = await page.locator(".ip-resource-card").count();
        const overflow = await page.evaluate(
          () => document.documentElement.scrollWidth - window.innerWidth,
        );
        if (cards < 3 || overflow > 2)
          failures.push({ interaction: resource, width, cards, overflow });
        if (width === 1440)
          await page.screenshot({
            path: resolve(root, `algogym-${resource}-1440.png`),
          });
      }
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
  if (process.env.INTERVIEW_QA_REFERENCE === "1") {
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
  }
  const directoryResponse = await fetch(
    `${origin}/api/interview?mode=directory`,
  );
  const directory = await directoryResponse.json();
  const googleResponse = await fetch(
    `${origin}/api/interview?mode=sheet&company=google`,
  );
  const amazonResponse = await fetch(
    `${origin}/api/interview?mode=sheet&company=amazon`,
  );
  const googleSheet = await googleResponse.json();
  const amazonSheet = await amazonResponse.json();
  if (
    directoryResponse.status !== 200 ||
    directory.companies?.length !== 45 ||
    googleSheet.questions?.length !== 30 ||
    amazonSheet.questions?.length !== 30 ||
    JSON.stringify(googleSheet.questions.map((question) => question.id)) ===
      JSON.stringify(amazonSheet.questions.map((question) => question.id))
  )
    failures.push({
      interaction: "catalog-integrity",
      companies: directory.companies?.length,
      google: googleSheet.questions?.length,
      amazon: amazonSheet.questions?.length,
    });
  const adminResponse = await fetch(`${origin}/api/interview?mode=admin`);
  if (adminResponse.status !== 403)
    failures.push({
      interaction: "admin-access",
      status: adminResponse.status,
    });
} finally {
  await browser.close();
}
if (failures.length) {
  console.error(JSON.stringify(failures, null, 2));
  process.exitCode = 1;
}
