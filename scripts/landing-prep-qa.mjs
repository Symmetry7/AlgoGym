import { chromium } from "playwright-core";
import { existsSync, mkdirSync } from "node:fs";
import { resolve } from "node:path";

const executablePath = ["C:/Program Files/Google/Chrome/Application/chrome.exe", "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe"].find(existsSync);
if (!executablePath) throw new Error("Chrome or Edge required");
const browser = await chromium.launch({ headless: true, executablePath });
const origin = process.env.INTERVIEW_QA_ORIGIN ?? "http://127.0.0.1:8087";
mkdirSync("artifacts/interview-qa", { recursive: true });
try {
  for (const width of [375, 768, 1440]) {
    const page = await browser.newPage({ viewport: { width, height: 900 } });
    const errors = [];
    page.on("pageerror", (error) => errors.push(error.message));
    await page.goto(origin, { waitUntil: "domcontentloaded" });
    const hrefs = await page.locator(".hero-destinations a").evaluateAll((links) => links.map((link) => link.getAttribute("href")));
    if (JSON.stringify(hrefs) !== JSON.stringify(["/interview-preparations/company-wise", "/training", "/societies"])) throw new Error(`Landing quick links missing at ${width}: ${hrefs}`);
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - innerWidth);
    if (overflow > 2 || errors.length) throw new Error(`Landing ${width}: overflow=${overflow}, errors=${errors}`);
    await page.screenshot({ path: resolve(`artifacts/interview-qa/landing-${width}.png`) });
    await page.goto(`${origin}/interview-preparations/company-wise`, { waitUntil: "domcontentloaded" });
    await page.getByRole("link", { name: /Back to dashboard/ }).waitFor();
    if ((await page.getByRole("link", { name: /Back to dashboard/ }).getAttribute("href")) !== "/dashboard") throw new Error("Dashboard return link missing");
    await page.close();
  }
  console.log("PASS: landing feature links and interview dashboard return at 375, 768, 1440px.");
} finally { await browser.close(); }
