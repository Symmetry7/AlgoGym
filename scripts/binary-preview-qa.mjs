import { chromium } from "playwright-core";

const browser = await chromium.launch({ executablePath: "C:/Program Files/Google/Chrome/Application/chrome.exe", headless: true });
try {
  for (const reducedMotion of ["no-preference", "reduce"]) {
    const page = await browser.newPage({ viewport: { width: 1440, height: 900 }, reducedMotion });
    const errors = [];
    page.on("pageerror", (error) => errors.push(error.message));
    await page.goto("http://localhost:8080/", { waitUntil: "domcontentloaded" });
    const preview = page.locator(".symm-launch");
    const question = preview.locator(".symm-launch-question p");
    if (await preview.getAttribute("data-visible") !== "false") throw new Error("Preview animation started before it entered view");
    await preview.scrollIntoViewIfNeeded();
    await page.waitForFunction(() => document.querySelector(".symm-launch")?.getAttribute("data-visible") === "true");
    const animation = await question.evaluate((element) => getComputedStyle(element).animationName);
    if (reducedMotion === "reduce" ? animation !== "none" : animation !== "symm-question-reveal") {
      throw new Error(`Unexpected question animation for ${reducedMotion}: ${animation}`);
    }
    await preview.getByRole("button", { name: /Write the solution/ }).click();
    if (await preview.locator(".symm-launch-boundary").getAttribute("data-step") !== "3") throw new Error("Step preview did not advance");
    if (errors.length) throw new Error(errors.join("; "));
    console.log(JSON.stringify({ reducedMotion, animation, stepInteraction: "passed" }));
    await page.close();
  }
} finally { await browser.close(); }
