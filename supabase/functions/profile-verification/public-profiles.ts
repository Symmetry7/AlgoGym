export type ExtraPlatform = "atcoder" | "codechef" | "github" | "geeksforgeeks";
export type PublicProfile = { exists: boolean; username?: string; challenge?: string };

function text(html: string) {
  return html.replace(/<[^>]*>/g, "").replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&#(?:x([0-9a-f]+)|(\d+));/gi, (_, hex, dec) => String.fromCodePoint(parseInt(hex || dec, hex ? 16 : 10))).trim();
}

/** Parse only the requested user's profile field, never recommendations or page-wide text. */
export function parsePublicProfile(platform: ExtraPlatform, requested: string, body: string, finalUrl: string): PublicProfile {
  if (platform === "github") {
    const data = JSON.parse(body);
    if (typeof data.login !== "string" || data.type !== "User" || typeof data.id !== "number" || data.login.toLowerCase() !== requested.toLowerCase()) throw new Error("GitHub did not return the requested personal profile.");
    if (data.bio !== null && typeof data.bio !== "string") throw new Error("GitHub did not return a readable bio.");
    return { exists: true, username: data.login, challenge: data.bio ?? "" };
  }
  if (platform === "atcoder") {
    const url = new URL(finalUrl);
    const handle = url.pathname.match(/^\/users\/([\w.-]+)\/?$/)?.[1];
    if (!handle || handle.toLowerCase() !== requested.toLowerCase() || !body.includes("Contest Status")) throw new Error("AtCoder did not return the requested profile.");
    const affiliation = body.match(/<th[^>]*>\s*Affiliation\s*<\/th>\s*<td[^>]*>([\s\S]*?)<\/td>/i);
    // An empty affiliation may be omitted entirely. It must appear before verification succeeds.
    return { exists: true, username: handle, challenge: affiliation ? text(affiliation[1]) : "" };
  }
  if (platform === "codechef") {
    const handle = body.match(/<span[^>]*class=['"][^'"]*m-username--link[^'"]*['"][^>]*>([^<]+)<\/span>/i)?.[1];
    const name = body.match(/<div[^>]*class=['"][^'"]*user-details-container[^'"]*['"][^>]*>[\s\S]*?<header[^>]*>[\s\S]*?<h1[^>]*>([\s\S]*?)<\/h1>/i)?.[1];
    const canonical = new URL(finalUrl).pathname.match(/^\/users\/([\w.-]+)\/?$/)?.[1];
    if (!handle || !canonical || text(handle).toLowerCase() !== canonical.toLowerCase() || name === undefined) throw new Error("CodeChef's public name could not be read. Retry later.");
    return { exists: true, username: text(handle), challenge: text(name) };
  }
  let flight = "";
  for (const match of body.matchAll(/self\.__next_f\.push\((\[[\s\S]*?\])\)<\/script>/g)) {
    try { const chunk = JSON.parse(match[1]); if (chunk[0] === 1 && typeof chunk[1] === "string") flight += chunk[1]; } catch { /* Non-data chunks are not profile evidence. */ }
  }
  for (const line of flight.split("\n")) {
    const separator = line.indexOf(":");
    if (separator < 0) continue;
    try {
      const record = JSON.parse(line.slice(separator + 1));
      const props = Array.isArray(record) ? record[3] : null;
      if (props?.username?.toLowerCase() !== requested.toLowerCase() || props?.mentor?.handle?.toLowerCase() !== requested.toLowerCase()) continue;
      if (typeof props.mentor.bio !== "string") throw new Error("Unreadable bio");
      return { exists: true, username: props.mentor.handle, challenge: props.mentor.bio };
    } catch { /* Fail closed if the profile payload changes. */ }
  }
  throw new Error("GeeksforGeeks did not return a readable bio for this account. Verification remains pending.");
}

export async function getExtraPublicProfile(platform: ExtraPlatform, username: string): Promise<PublicProfile> {
  const hosts = { atcoder: "atcoder.jp", codechef: "www.codechef.com", github: "api.github.com", geeksforgeeks: "www.geeksforgeeks.org" };
  const paths = { atcoder: `/users/${encodeURIComponent(username)}?lang=en`, codechef: `/users/${encodeURIComponent(username)}`, github: `/users/${encodeURIComponent(username)}`, geeksforgeeks: `/profile/${encodeURIComponent(username)}` };
  let url = new URL(`https://${hosts[platform]}${paths[platform]}`);
  url.searchParams.set("_algogym", crypto.randomUUID());
  const signal = AbortSignal.timeout(12000);
  for (let redirects = 0; redirects < 4; redirects++) {
    const result = await fetch(url, { redirect: "manual", signal, cache: "no-store", headers: { "User-Agent": "AlgoGym public profile verification", "Cache-Control": "no-cache, no-store", Accept: platform === "github" ? "application/vnd.github+json" : "text/html" } });
    if (result.status >= 300 && result.status < 400 && result.headers.get("location")) {
      const next = new URL(result.headers.get("location")!, url);
      if (next.protocol !== "https:" || next.hostname !== hosts[platform]) throw new Error("Unexpected profile redirect.");
      url = next; continue;
    }
    if (result.status === 404) return { exists: false };
    if (!result.ok) throw new Error(`${platform} could not return the public profile (${result.status}). Please retry later.`);
    if (Number(result.headers.get("content-length") ?? 0) > 2_000_000) throw new Error("Profile response is too large.");
    const body = await result.text();
    if (body.length > 2_000_000) throw new Error("Profile response is too large.");
    return parsePublicProfile(platform, username, body, url.href);
  }
  throw new Error("Too many profile redirects.");
}
