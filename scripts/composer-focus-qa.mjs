import { chromium } from "playwright-core";
import { readFile } from "node:fs/promises";

const browser = await chromium.launch({ executablePath: "C:/Program Files/Google/Chrome/Application/chrome.exe", headless: true });
try {
  const page = await browser.newPage();
  await page.setContent('<div class="symm-theme"><div class="symm-home-composer"><textarea class="symm-home-textarea" aria-label="SYMM prompt"></textarea></div><div class="symm-tutor-composer"><textarea class="symm-tutor-textarea" aria-label="AI tutor prompt"></textarea></div></div>');
  await page.addStyleTag({ content: await readFile("src/features/symm-ai/symm-workspace.css", "utf8") });
  for (const [textarea, composer] of [[".symm-home-textarea", ".symm-home-composer"], [".symm-tutor-textarea", ".symm-tutor-composer"]]) {
    await page.locator(textarea).focus();
    await page.waitForTimeout(600);
    const styles = await page.locator(textarea).evaluate((element) => ({
      outline: getComputedStyle(element).outlineStyle,
      border: getComputedStyle(element.parentElement).borderColor,
      selection: getComputedStyle(element, "::selection").backgroundColor,
    }));
    if (styles.outline !== "none" || styles.border !== "rgb(201, 169, 238)" || styles.selection !== "rgb(128, 94, 170)") {
      throw new Error(`${composer} focus treatment is incorrect: ${JSON.stringify(styles)}`);
    }
    console.log(`${textarea}: ${JSON.stringify(styles)}`);
  }
  await page.goto("http://localhost:8080/brand/coin.webp");
  if ((await page.locator("img").count()) !== 1) throw new Error("Coin image did not load");
  console.log("Gold coin asset loaded");
} finally {
  await browser.close();
}
