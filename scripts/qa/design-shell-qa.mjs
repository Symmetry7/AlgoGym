// M1 shell checks: node scripts/qa/design-shell-qa.mjs [baseUrl]  (dev server must be running)
// Screenshots go to artifacts/design-qa/ (git-ignored).
import { existsSync, mkdirSync } from "node:fs";
import { chromium } from "playwright-core";
import assert from "node:assert/strict";

const base = process.argv[2] ?? "http://localhost:8080";
const executablePath = ["C:/Program Files/Google/Chrome/Application/chrome.exe", "/usr/bin/google-chrome"].find(existsSync);
const out = "artifacts/design-qa";
mkdirSync(out, { recursive: true });

const browser = await chromium.launch({ executablePath, headless: true });
const results = [];
const check = async (name, fn) => {
  try {
    await fn();
    results.push(`PASS ${name}`);
  } catch (error) {
    results.push(`FAIL ${name}: ${error.message.split("\n")[0]}`);
  }
};

for (const width of [375, 1440]) {
  const page = await browser.newPage({ viewport: { width, height: 900 } });
  const errors = [];
  // Production prefetches nav links; these routes arrive in later milestones (docs/BUILD_GUIDE.md).
  const notBuiltYet = ["/roadmap", "/companies", "/interview", "/arena", "/study-plans", "/credits", "/terms"];
  page.on("response", (r) => {
    const path = new URL(r.url()).pathname;
    if (r.status() === 404 && !notBuiltYet.includes(path)) errors.push(`404 ${path}`);
  });
  page.on("console", (m) => m.type() === "error" && !m.text().startsWith("Failed to load resource") && errors.push(m.text()));
  page.on("pageerror", (e) => errors.push(e.message));

  for (const path of ["/_design", "/_design/marketing"]) {
    await page.goto(base + path, { waitUntil: "load" });
    await check(`${width}px ${path}: no horizontal scroll`, async () => {
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
      assert.ok(overflow <= 0, `page is ${overflow}px wider than the viewport`);
    });
    await check(`${width}px ${path}: one <main>, robots noindex`, async () => {
      assert.equal(await page.locator("main").count(), 1);
      assert.match((await page.locator('meta[name="robots"]').getAttribute("content")) ?? "", /noindex/);
    });
    await check(`${width}px ${path}: first Tab reaches the skip link, with a visible focus ring`, async () => {
      await page.keyboard.press("Tab");
      const focused = await page.evaluate(() => {
        const el = document.activeElement;
        const s = getComputedStyle(el);
        return { text: el.textContent, ring: s.boxShadow };
      });
      assert.equal(focused.text, "Skip to content");
      assert.notEqual(focused.ring, "none");
    });
    await page.screenshot({ path: `${out}/${path.replaceAll("/", "_") || "root"}-${width}.png`, fullPage: false });
  }

  await page.goto(base + "/_design", { waitUntil: "load" });
  if (width === 375) {
    await check("375px: menu opens from the keyboard, Escape closes it and returns focus", async () => {
      const toggle = page.getByRole("button", { name: "Open menu" });
      await toggle.focus();
      await page.keyboard.press("Enter");
      await page.getByRole("link", { name: "Problems" }).waitFor({ state: "visible" });
      await page.keyboard.press("Escape");
      assert.equal(await page.getByRole("link", { name: "Problems" }).isVisible(), false);
      assert.equal(await page.evaluate(() => document.activeElement?.getAttribute("aria-label")), "Open menu");
    });
  } else {
    await check("1440px: desktop nav visible, menu toggle hidden", async () => {
      assert.ok(await page.getByRole("navigation", { name: "Main" }).getByRole("link", { name: "Problems" }).isVisible());
      assert.equal(await page.getByRole("button", { name: "Open menu" }).isVisible(), false);
    });
  }

  await check(`${width}px: tabs move with arrow keys and skip the disabled tab`, async () => {
    const dsa = page.getByRole("tab", { name: "DSA" });
    await dsa.click();
    await page.keyboard.press("ArrowRight");
    assert.equal(await page.getByRole("tab", { name: "Patterns" }).getAttribute("aria-selected"), "true");
    await page.keyboard.press("End");
    assert.equal(await page.getByRole("tab", { name: "HR" }).getAttribute("aria-selected"), "true");
    await page.keyboard.press("ArrowRight");
    assert.equal(await dsa.getAttribute("aria-selected"), "true");
    assert.equal(await page.evaluate(() => document.activeElement?.textContent), "DSA");
  });

  await check(`${width}px: no console errors`, async () => assert.deepEqual(errors, [], errors.join(" | ").slice(0, 400)));
  await page.close();
}

await browser.close();
console.log(results.join("\n"));
if (results.some((r) => r.startsWith("FAIL"))) process.exit(1);
