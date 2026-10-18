import { launchBrowser } from "./cdp.mjs";

const browser = await launchBrowser();
const checks = [];
const assert = (value, label) => {
  if (!value) throw new Error(label);
  checks.push(label);
};
try {
  await browser.call("Emulation.setEmulatedMedia", {
    features: [{ name: "prefers-reduced-motion", value: "reduce" }],
  });
  for (const [width, height] of [
    [1440, 1000],
    [1920, 1080],
    [768, 1024],
    [390, 844],
    [320, 667],
  ]) {
    await browser.call("Emulation.setDeviceMetricsOverride", {
      width,
      height,
      deviceScaleFactor: 1,
      mobile: width < 800,
    });
    await browser.call("Page.navigate", { url: "http://localhost:8080/" });
    await browser.waitFor(
      'document.querySelector(".landing-invitation") && document.querySelector(".hero-cubes img")?.complete',
      60000,
    );
    await browser.evaluate('document.fonts.ready');
    assert(await browser.evaluate('document.fonts.check("16px AlgoGym Plex")'), `${width}px: local IBM Plex font is loaded`);
    assert(await browser.evaluate(`(()=>{const logo=document.querySelector('.brand-monument').getBoundingClientRect();const panel=document.querySelector('.practice-stack').getBoundingClientRect();return logo.width<=440 && panel.top-logo.bottom>=23 && Math.abs((logo.left+logo.width/2)-(panel.left+panel.width/2))<2})()`), `${width}px: original logo is centered, capped, and separated from the panel`);
    assert(
      await browser.evaluate(
        "document.documentElement.scrollWidth <= innerWidth",
      ),
      `${width}px: no horizontal overflow`,
    );
    assert(
      await browser.evaluate(
        'document.querySelector(".landing-stage").getBoundingClientRect().height >= innerHeight',
      ),
      `${width}px: hero fills the viewport`,
    );
    assert(
      await browser.evaluate(
        `(()=>{const copy=document.querySelector('.hero-copy').getBoundingClientRect(), cubes=document.querySelector('.hero-cubes').getBoundingClientRect();return innerWidth>600 || cubes.top>=copy.bottom-8})()`,
      ),
      `${width}px: mobile cubes do not overlap the copy`,
    );
    assert(
      await browser.evaluate(
        '[...document.querySelectorAll(".story-card, .discover-row, .practice-track-links a")].every(a=>a.getAttribute("href")?.startsWith("/"))',
      ),
      `${width}px: product links have application destinations`,
    );
    await browser.screenshot(`.local-backups/landing-fullscreen-${width}.png`);
    await browser.evaluate(
      'document.querySelector(".landing-story").scrollIntoView()',
    );
    await browser.screenshot(`.local-backups/landing-story-${width}.png`);
    if (width === 1440 || width === 390) {
      for (const section of ["brand-moment", "discover", "invitation"]) {
        await browser.evaluate(
          `document.querySelector('.landing-${section}').scrollIntoView()`,
        );
        await browser.screenshot(
          `.local-backups/landing-${section}-${width}.png`,
        );
      }
    }
    if (width === 390) {
      await browser.evaluate("window.scrollTo(0,0)");
      await browser.click(".landing-mobile-menu summary");
      assert(
        await browser.evaluate(
          'document.querySelector(".landing-mobile-menu").open',
        ),
        "Mobile navigation opens",
      );
      await browser.click(".landing-mobile-menu summary");
    }
  }
  assert(
    !browser.events.some((event) => event.method === "Runtime.exceptionThrown"),
    "No browser runtime exceptions",
  );
  console.log(JSON.stringify({ passed: true, checks }, null, 2));
} finally {
  await browser.close();
}
