import { chromium } from "playwright-core";
import { mkdir } from "node:fs/promises";

const executablePath = "C:/Program Files/Google/Chrome/Application/chrome.exe";
const browser = await chromium.launch({ executablePath, headless: true });
const widths = [375, 430, 768, 1280, 1440, 1920];
const phase = process.argv[2] || "after";
await mkdir("artifacts/design-qa", { recursive: true });
try {
  for (const width of widths) {
    const page = await browser.newPage({ viewport: { width, height: 900 }, deviceScaleFactor: 1 });
    const errors = [];
    page.on("pageerror", (error) => errors.push(error.message));
    await page.goto("http://localhost:8080/", { waitUntil: "domcontentloaded" });
    await page.locator(".hero-cubes").first().waitFor();
    await page.waitForTimeout(900);
    await page.locator(".landing-stage").screenshot({ path: `artifacts/design-qa/${phase}-hero-${width}.png` });
    if (phase === "after") {
      const flow = page.locator(".symm-launch");
      await flow.getByRole("button", { name: /Write the solution/ }).click();
      if (!/can\(mid\)/.test(await flow.locator(".symm-launch-code").innerText())) throw new Error(`Learning path did not update at ${width}px`);
      if (await flow.getByRole("button", { name: /Write the solution/ }).getAttribute("aria-pressed") !== "true") throw new Error("Selected step is not announced");
      if (await flow.locator(".symm-launch-boundary").getAttribute("data-step") !== "3") throw new Error("Boundary preview did not advance");
      await flow.getByRole("button", { name: /Build the intuition/ }).click();
    }
    await page.locator(".symm-launch-section").scrollIntoViewIfNeeded();
    await page.locator(".symm-launch-section").screenshot({ path: `artifacts/design-qa/${phase}-symm-intro-${width}.png` });
    await page.locator(".symm-showcase").scrollIntoViewIfNeeded();
    await page.screenshot({ path: `artifacts/design-qa/${phase}-landing-${width}.png`, fullPage: true });
    await page.locator(".symm-showcase").screenshot({ path: `artifacts/design-qa/${phase}-showcase-${width}.png` });
    if (phase === "after") {
      if (await page.locator("video").count()) throw new Error("Video remains on landing page");
      if (await page.locator(".landing-stage .hero-cubes").count() !== 1) throw new Error("Flying-cube hero is missing");
      const introTargets = await page.locator("#symm-ai").count();
      const previewTargets = await page.locator("#product-preview").count();
      if (introTargets !== 1 || previewTargets !== 1) throw new Error(`SYMM navigation targets: intro=${introTargets}, preview=${previewTargets}`);
      if (await page.locator(".symm-showcase .living-field").count() !== 1) throw new Error("Showcase field is missing");
      await page.getByRole("button", { name: "Row 3, column 3: 6 paths" }).click();
      if (!/3\s*\+\s*3\s*=\s*6/.test(await page.locator(".symm-grid-equation").innerText())) throw new Error("Grid interaction failed");
      const nav = page.getByRole("navigation", { name: "Main navigation" });
      if (width >= 1280 && await nav.getByRole("link", { name: "Symm AI" }).count() === 0) throw new Error("Missing SYMM AI navigation");
      await page.getByRole("button", { name: "Preview learning path" }).click();
      await page.locator(".symm-preview-roadmap").waitFor();
      await page.getByRole("button", { name: "Python" }).click();
      const code = await page.locator(".symm-preview-lesson code").innerText();
      if (!code.includes("dp =")) throw new Error(`Preview language did not switch at ${width}px`);
      await page.getByRole("button", { name: /Recursion & states/ }).click();
      if (!await page.getByRole("heading", { name: "Recursion & states" }).isVisible()) throw new Error("Module selection failed");
      await page.locator(".symm-showcase").screenshot({ path: `artifacts/design-qa/${phase}-roadmap-${width}.png` });
    }
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - innerWidth);
    if (overflow > 1) throw new Error(`Horizontal overflow at ${width}px: ${overflow}`);
    if (errors.length) throw new Error(`Page errors at ${width}px: ${errors.join("; ")}`);
    console.log(JSON.stringify({ phase, width, page: "landing", overflow, errors }));
    await page.close();
  }
  if (phase === "after") {
    const page = await browser.newPage({ viewport: { width: 1280, height: 900 }, reducedMotion: "reduce" });
    await page.goto("http://localhost:8080/", { waitUntil: "domcontentloaded" });
    await page.locator(".symm-showcase").scrollIntoViewIfNeeded();
    await page.waitForTimeout(1000);
    await page.getByRole("button", { name: "Preview learning path" }).click();
    await page.locator(".symm-preview-roadmap").waitFor();
    const animation = await page.locator(".symm-preview-roadmap").evaluate((element) => getComputedStyle(element).animationName);
    if (animation !== "none") throw new Error(`Reduced-motion animation: ${animation}`);
    const headlineAnimation = await page.locator(".launch-line > span").first().evaluate((element) => getComputedStyle(element).animationName);
    if (headlineAnimation !== "none") throw new Error(`Reduced-motion headline animation: ${headlineAnimation}`);
    const boundaryAnimation = await page.locator(".symm-launch-boundary-cells > span").first().evaluate((element) => getComputedStyle(element).animationName);
    if (boundaryAnimation !== "none") throw new Error(`Reduced-motion boundary animation: ${boundaryAnimation}`);
    await page.close();
  }
} finally {
  await browser.close();
}
