import { mkdir, writeFile } from "node:fs/promises";

// Public brand favicons are used only to identify companies in AlgoGym's
// independently authored preparation directory. No Hynts imagery is reused.
const domains = {
  google: "google.com", meta: "meta.com", microsoft: "microsoft.com",
  netflix: "netflix.com", amazon: "amazon.com", apple: "apple.com",
  linkedin: "linkedin.com", atlassian: "atlassian.com", uber: "uber.com",
  bloomberg: "bloomberg.com",
  "tower-research-capital": "tower-research.com", stripe: "stripe.com",
  paypal: "paypal.com", salesforce: "salesforce.com", adobe: "adobe.com",
  flipkart: "flipkart.com", phonepe: "phonepe.com", meesho: "meesho.com",
  cred: "cred.club", razorpay: "razorpay.com", zomato: "zomato.com",
  swiggy: "swiggy.com", zepto: "zeptonow.com", paytm: "paytm.com",
  servicenow: "servicenow.com", intuit: "intuit.com", walmart: "walmart.com",
  "goldman-sachs": "goldmansachs.com", "j-p-morgan-chase": "jpmorganchase.com",
  "morgan-stanley": "morganstanley.com", oracle: "oracle.com",
  cisco: "cisco.com", visa: "visa.com", mastercard: "mastercard.com",
  barclays: "barclays.com", hsbc: "hsbc.com", accenture: "accenture.com",
  "tcs-tcs-nqt": "tata.com", infosys: "infosys.com",
  cognizant: "cognizant.com", wipro: "wipro.com", hcltech: "hcl.com",
  "tech-mahindra": "techmahindra.com", capgemini: "capgemini.com",
};
await mkdir("public/company-icons", { recursive: true });
const entries = Object.entries(domains);
const failed = [];
for (let offset = 0; offset < entries.length; offset += 8) {
  await Promise.all(entries.slice(offset, offset + 8).map(async ([slug, domain]) => {
    try {
      const response = await fetch(`https://www.google.com/s2/favicons?domain=${domain}&sz=128`, { signal: AbortSignal.timeout(15000) });
      const bytes = Buffer.from(await response.arrayBuffer());
      if (!response.ok || !response.headers.get("content-type")?.startsWith("image/") || bytes.length < 50)
        throw new Error(`bad favicon response: ${response.status}`);
      await writeFile(`public/company-icons/${slug}.png`, bytes);
    } catch (error) { failed.push(`${slug}: ${error.message}`); }
  }));
}
console.log(`Saved ${entries.length - failed.length}/${entries.length} company icons.`);
if (failed.length) { console.error(failed.join("\n")); process.exitCode = 1; }
