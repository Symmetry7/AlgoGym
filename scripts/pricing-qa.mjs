import { chromium } from "playwright-core";
import { mkdir } from "node:fs/promises";

const browser = await chromium.launch({ executablePath: "C:/Program Files/Google/Chrome/Application/chrome.exe", headless: true });
await mkdir("artifacts/design-qa", { recursive: true });
try {
  for (const width of [375, 768, 1440]) {
    const page = await browser.newPage({ viewport: { width, height: 900 } });
    const errors = [];
    page.on("pageerror", (error) => errors.push(error.message));
    await page.goto("http://localhost:8080/pricing", { waitUntil: "domcontentloaded" });
    await page.getByRole("heading", { name: "Turn Coins into paths." }).waitFor();
    const cards = page.locator(".coin-exchange-card");
    if (await cards.count() !== 2) throw new Error("Missing Coin exchange cards");
    for (const [index, amount] of ["1,000", "10,000"].entries()) {
      if (!await cards.nth(index).getByText(amount).isVisible()) throw new Error(`Missing ${amount} Coin package`);
      if (!await cards.nth(index).locator('img[src="/brand/coin.webp"]').isVisible()) throw new Error("Coin image missing");
    }
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - innerWidth);
    if (overflow > 1 || errors.length) throw new Error(`${width}px: overflow=${overflow}; ${errors.join("; ")}`);
    await page.screenshot({ path: `artifacts/design-qa/after-pricing-${width}.png`, fullPage: true });
    if (width === 375) {
      await cards.first().getByRole("button", { name: /Exchange for 10 credits/ }).click();
      await page.waitForURL(/\/sign-in/);
    }
    console.log(JSON.stringify({ width, page: "pricing", overflow, errors }));
    await page.close();
  }
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  await page.goto("http://localhost:8080/training/symm", { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(1000);
  const gate = (await page.locator("body").innerText()).includes("Welcome to AlgoGym");
  if (!gate) {
    const upgrade = page.getByRole("navigation", { name: "Symm AI navigation" }).getByRole("link", { name: "Upgrade to Pro" });
    await upgrade.waitFor({ timeout: 5000 });
    if (!await upgrade.isVisible()) throw new Error("Upgrade to Pro is missing from the top navigation");
    await page.screenshot({ path: "artifacts/design-qa/after-symm-top-nav-1440.png" });
  } else {
    console.log("SYMM top navigation requires an authenticated session; visual check skipped.");
  }
  await page.close();
} finally { await browser.close(); }
