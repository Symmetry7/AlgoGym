import { launchBrowser } from "./cdp.mjs";

const browser = await launchBrowser();
const results = [];
const baseUrl = process.env.ALGOGYM_TEST_URL ?? "http://localhost:8080";
try {
  for (const [width, height, label] of [
    [1440, 1000, "desktop"],
    [390, 844, "mobile"],
  ]) {
    await browser.call("Emulation.setDeviceMetricsOverride", {
      width,
      height,
      deviceScaleFactor: 1,
      mobile: width < 600,
    });
    await browser.call("Page.navigate", { url: `${baseUrl}/` });
    await browser.waitFor('document.querySelector(".symm-preview-generate")');
    await browser.waitFor('document.readyState === "complete"');
    await new Promise((resolve) => setTimeout(resolve, 1200));
    const before = await browser.evaluate(
      `({headline:document.querySelector('#symm-showcase-title')?.innerText,scrollWidth:document.documentElement.scrollWidth,viewport:innerWidth,cta:document.querySelector('.symm-showcase-action a,.symm-showcase-action button')?.innerText})`,
    );
    if (
      !before.headline.includes(
        "Learn competitive programming from first principles.",
      ) ||
      before.scrollWidth > width ||
      !before.cta.includes("Explore Symm AI")
    )
      throw new Error(`${label}: ${JSON.stringify(before)}`);
    await browser.evaluate(
      'document.querySelector(".symm-preview-generate").click()',
    );
    await browser.waitFor(
      'document.querySelectorAll(".symm-preview-grid li").length === 6',
    );
    await browser.evaluate(
      'document.querySelectorAll(".symm-preview-languages button")[2].click()',
    );
    const after = await browser.evaluate(
      `({selected:document.querySelector('.symm-preview-languages button[aria-pressed=true]')?.innerText,code:document.querySelector('.symm-preview-lesson code')?.innerText,modules:document.querySelectorAll('.symm-preview-grid li').length,scrollWidth:document.documentElement.scrollWidth})`,
    );
    if (
      after.selected !== "Python" ||
      !after.code.includes("dp =") ||
      after.scrollWidth > width
    )
      throw new Error(`${label}: ${JSON.stringify(after)}`);
    await browser.evaluate(
      'document.querySelector(".symm-showcase").scrollIntoView({block:"start"})',
    );
    await browser.screenshot(`.local-backups/symm-showcase-${label}.png`);
    results.push({ label, ...before, ...after });
  }
  const errors = browser.events.filter(
    (event) => event.method === "Runtime.exceptionThrown",
  );
  if (errors.length) throw new Error(`Browser exceptions: ${errors.length}`);
  console.log(JSON.stringify({ passed: true, results }, null, 2));
} finally {
  await browser.close();
}
