import nextEnv from "@next/env";
import { createClient } from "@supabase/supabase-js";
import { randomUUID, randomBytes } from "node:crypto";
import { launchBrowser } from "./cdp.mjs";
nextEnv.loadEnvConfig(process.cwd());
const base = "http://localhost:8080";
const db = createClient(
  process.env.SUPABASE_URL ?? process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false, autoRefreshToken: false } },
);
const users = [];
const societies = [];
const checks = [];
const providers = [];
let browser;
function assert(value, label) {
  if (!value) throw new Error(label);
  checks.push(label);
}
async function api(cookie, path, body, expected = 200) {
  const r = await fetch(base + path, {
    headers: {
      Cookie: cookie,
      Origin: base,
      ...(body ? { "Content-Type": "application/json" } : {}),
    },
    ...(body ? { method: "POST", body: JSON.stringify(body) } : {}),
  });
  const data = await r.json();
  if (r.status !== expected)
    throw new Error(`${path}: ${r.status} ${data.error ?? ""}`);
  return data;
}
try {
  for (let i = 0; i < 2; i++) {
    const email = `algogym-invite-${randomUUID().slice(0, 8)}@example.invalid`;
    const password = randomBytes(24).toString("base64url");
    const { data, error } = await db.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name: "Society test" },
    });
    if (error) throw error;
    users.push({ id: data.user.id, email, password });
    const response = await fetch(base + "/api/auth/email", {
      method: "POST",
      headers: { "Content-Type": "application/json", Origin: base },
      body: JSON.stringify({ action: "login", email, password }),
    });
    if (!response.ok) throw new Error("Test sign-in failed");
    users[i].cookie = response.headers
      .getSetCookie()
      .map((c) => c.split(";")[0])
      .join("; ");
  }
  const a = users[0].cookie,
    b = users[1].cookie;
  await api("", "/api/societies/register", { name: "Unauthorized group" }, 401);
  const society = await api(
    a,
    "/api/societies/register",
    {
      name: "Integration Coding Circle",
      description: "Temporary integration fixture",
    },
    201,
  );
  societies.push(society.id);
  assert(
    society.status === "active",
    "Any signed-in user creates a society without college, evidence or approval",
  );
  const own = await api(a, `/api/societies?slug=${society.slug}`);
  assert(
    own.memberships.some((m) => m.role === "admin" && m.status === "active"),
    "Creator becomes active organizer",
  );
  await api(
    b,
    "/api/societies/invite",
    { action: "link", societyId: society.id },
    403,
  );
  assert(true, "Nonmembers cannot retrieve private invite tokens");
  const invite = await api(a, "/api/societies/invite", {
    action: "link",
    societyId: society.id,
  });
  const token = new URL(invite.url).pathname.split("/").at(-1);
  assert(
    /^[a-f0-9]{64}$/.test(token) &&
      invite.qr.startsWith("data:image/png;base64,"),
    "Invite contains an unpredictable token and server-generated QR",
  );
  const again = await api(a, "/api/societies/invite", {
    action: "link",
    societyId: society.id,
  });
  assert(again.url === invite.url, "Invite link persists across requests");
  const preview = await api("", `/api/societies/invite?token=${token}`);
  assert(
    preview.society.name === "Integration Coding Circle",
    "Anonymous visitor can preview invitation",
  );
  await api("", `/api/societies/invite?token=${"0".repeat(64)}`, null, 404);
  await api("", "/api/societies/invite", { action: "join", token }, 401);
  const joined = await api(b, "/api/societies/invite", {
    action: "join",
    token,
  });
  await api(b, "/api/societies/invite", { action: "join", token });
  const member = await api(b, `/api/societies?slug=${joined.slug}`);
  assert(
    member.memberships.filter(
      (m) => m.status === "active" && m.role === "member",
    ).length === 1,
    "Invite joins immediately and repeated joins do not duplicate membership",
  );
  const shared = await api(b, "/api/societies/invite", {
    action: "link",
    societyId: society.id,
  });
  assert(
    shared.url === invite.url,
    "Members can share the original invitation",
  );
  const stranger = await api(
    b,
    "/api/societies/register",
    { name: "Another Coding Circle" },
    201,
  );
  societies.push(stranger.id);
  await api(a, "/api/societies", { societyId: stranger.id });
  assert(
    true,
    "Direct joining supports another group without conflicting competitive memberships",
  );
  for (const [platform, username] of [
    ["atcoder", "tourist"],
    ["codechef", "gennady.korotkevich"],
    ["github", "octocat"],
    ["geeksforgeeks", "sandeepjain"],
  ]) {
    const response = await fetch(base + "/api/profile-verification", {
      method: "POST",
      headers: { Cookie: a, Origin: base, "Content-Type": "application/json" },
      body: JSON.stringify({ action: "start", platform, username }),
    });
    const challenge = await response.json();
    if (!response.ok) {
      providers.push({
        platform,
        challengeStarted: false,
        status: response.status,
        error: challenge.error,
      });
      continue;
    }
    const wrong = await fetch(base + "/api/profile-verification", {
      method: "POST",
      headers: { Cookie: a, Origin: base, "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "verify",
        platform,
        username: challenge.username,
        token: "VERIFY-WRONG",
      }),
    });
    assert(wrong.status === 422, `${platform}: incorrect token rejected`);
    const missing = await fetch(base + "/api/profile-verification", {
      method: "POST",
      headers: { Cookie: a, Origin: base, "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "verify",
        platform,
        username: challenge.username,
        token: challenge.token,
      }),
    });
    const result = await missing.json();
    assert(
      missing.status !== 200,
      `${platform}: absent profile token never marks verified`,
    );
    providers.push({
      platform,
      challengeStarted: true,
      verificationStatus: missing.status,
      message: result.error,
    });
  }
  browser = await launchBrowser();
  for (const cookie of a.split("; ")) {
    const split = cookie.indexOf("=");
    await browser.call("Network.setCookie", {
      name: cookie.slice(0, split),
      value: cookie.slice(split + 1),
      url: base,
      httpOnly: true,
      sameSite: "Lax",
    });
  }
  await browser.call("Emulation.setDeviceMetricsOverride", {
    width: 1440,
    height: 1000,
    deviceScaleFactor: 1,
    mobile: false,
  });
  await browser.call("Page.navigate", { url: base + "/onboarding?step=3" });
  await browser.waitFor(
    'document.querySelectorAll(".connections-provider-row").length===6',
    60000,
  );
  await browser.click(".connections-provider-row");
  await browser.waitFor('document.querySelector(".connections-dialog")');
  assert(
    await browser.evaluate(
      'document.querySelectorAll(".connections-picker button").length===6',
    ),
    "Connector includes all six providers",
  );
  await browser.waitFor(
    'getComputedStyle(document.querySelector(".connections-dialog")).opacity==="1"',
  );
  await browser.screenshot(".local-backups/connections-desktop.png");
  await browser.call("Input.dispatchKeyEvent", {
    type: "keyDown",
    key: "Escape",
    code: "Escape",
    windowsVirtualKeyCode: 27,
  });
  await browser.call("Input.dispatchKeyEvent", {
    type: "keyUp",
    key: "Escape",
    code: "Escape",
    windowsVirtualKeyCode: 27,
  });
  await browser.waitFor('!document.querySelector(".connections-dialog")');
  assert(
    await browser.evaluate(
      'document.activeElement.classList.contains("connections-provider-row")',
    ),
    "Connector restores keyboard focus",
  );
  await browser.call("Emulation.setDeviceMetricsOverride", {
    width: 390,
    height: 844,
    deviceScaleFactor: 1,
    mobile: true,
  });
  await browser.click(".connections-provider-row");
  await browser.waitFor('document.querySelector(".connections-dialog")');
  assert(
    await browser.evaluate("document.documentElement.scrollWidth<=innerWidth"),
    "Connector has no mobile overflow",
  );
  await browser.waitFor(
    'getComputedStyle(document.querySelector(".connections-dialog")).opacity==="1"',
  );
  await browser.screenshot(".local-backups/connections-mobile.png");
  await browser.call("Page.navigate", {
    url: base + `/societies/${society.slug}?invite=1`,
  });
  await browser.waitFor('document.querySelector("#society-invite")', 60000);
  assert(
    await browser.evaluate(
      'document.querySelector("#society-invite").value.includes("/societies/join/")',
    ),
    "Invitation dialog loads actual persisted link",
  );
  assert(
    await browser.evaluate("document.documentElement.scrollWidth<=innerWidth"),
    "Invitation dialog fits mobile",
  );
  await browser.screenshot(".local-backups/society-invite-mobile.png");
  await browser.call("Page.navigate", { url: invite.url });
  await browser.waitFor(
    'document.querySelector("h1")?.textContent==="Integration Coding Circle"',
    60000,
  );
  assert(true, "Public join page renders the real society");
  await browser.call("Page.navigate", { url: base + "/societies/register" });
  await browser.waitFor(
    'document.querySelector("input[autocomplete=organization]")',
    60000,
  );
  assert(
    await browser.evaluate(
      '!document.querySelector("input[type=url]")&&document.documentElement.scrollWidth<=innerWidth',
    ),
    "Creation form has no evidence requirement or mobile overflow",
  );
  await browser.screenshot(".local-backups/society-create-mobile.png");
  await browser.call("Network.clearBrowserCookies");
  await browser.call("Page.navigate", { url: invite.url });
  await browser.waitFor('document.querySelector("a[href*=next]")', 60000);
  await browser.click("a[href*=next]");
  await browser.waitFor('document.querySelector("[role=dialog]")');
  await browser.evaluate(
    '[...document.querySelectorAll("button")].find(b=>b.textContent.trim()==="Continue with Email").click()',
  );
  await browser.waitFor('document.querySelector("#auth-email")');
  await browser.click("#auth-email");
  await browser.call("Input.insertText", { text: users[1].email });
  await browser.click("#auth-password");
  await browser.call("Input.insertText", { text: users[1].password });
  await browser.click('form button[type="submit"]');
  await browser.waitFor(
    'location.pathname.startsWith("/societies/join/") && [...document.querySelectorAll("button")].some(b=>b.textContent.trim()==="Join society")',
    60000,
  );
  assert(true, "Email sign-in preserves the original society invitation");
  await browser.evaluate(
    '[...document.querySelectorAll("button")].find(b=>b.textContent.trim()==="Join society").click()',
  );
  await browser.waitFor(
    "location.pathname===" + JSON.stringify("/societies/" + society.slug),
    60000,
  );
  await browser.call("Page.reload");
  await browser.waitFor(
    'document.body.innerText.includes("Active member")',
    60000,
  );
  assert(true, "Join button and membership persist after browser refresh");
  assert(
    browser.events.filter((e) => e.method === "Runtime.exceptionThrown")
      .length === 0,
    "Tested pages have no browser runtime exceptions",
  );
  console.log(JSON.stringify({ checks, providers }, null, 2));
} finally {
  if (browser) await browser.close();
  for (const id of societies) {
    await db.from("memberships").delete().eq("society_id", id);
    const { error } = await db.from("societies").delete().eq("id", id);
    if (error) throw error;
  }
  for (const user of users) {
    const { error } = await db.auth.admin.deleteUser(user.id);
    if (error) throw error;
  }
  console.log("Temporary societies and accounts removed.");
}
