import { beforeEach, describe, expect, it, vi } from "vitest";
const mocks=vi.hoisted(()=>({send:vi.fn(),admin:vi.fn()}));
vi.mock("server-only", () => ({}));
vi.mock("./admin", () => ({ adminSupabase: mocks.admin }));
vi.mock("resend",()=>({Resend:class {emails={send:mocks.send}}}));
import { processSocietyEmailOutbox, societyEmailHtml } from "./society-email";

beforeEach(()=>{vi.unstubAllEnvs();mocks.send.mockReset();mocks.admin.mockReset();});

describe("society email template", () => {
  it("escapes notification text and links to the configured app origin", () => {
    const html=societyEmailHtml({subject:"Contest <ready>",body:"Solve & learn",href:"/societies/abc"});
    expect(html).toContain("Contest &lt;ready&gt;");
    expect(html).toContain("Solve &amp; learn");
    expect(html).toContain("https://algogym.vercel.app/societies/abc");
  });
  it("rejects external notification links", () => {
    const html=societyEmailHtml({subject:"Update",body:"",href:"//attacker.example/collect"});
    expect(html).not.toContain("attacker.example");
    expect(societyEmailHtml({subject:"Update",body:"",href:"/\\attacker.example/collect"})).not.toContain("attacker.example");
  });
});

describe("society email delivery",()=>{
  it("does not claim messages without server credentials",async()=>{
    expect(await processSocietyEmailOutbox()).toMatchObject({sent:0,skipped:expect.any(String)});
    expect(mocks.admin).not.toHaveBeenCalled();
  });
  it("uses an idempotency key and marks a successful send",async()=>{
    vi.stubEnv("RESEND_API_KEY","test-only");vi.stubEnv("RESEND_FROM_EMAIL","AlgoGym <mail@example.com>");
    const eq=vi.fn().mockResolvedValue({error:null});const update=vi.fn().mockReturnValue({eq});
    mocks.admin.mockReturnValue({rpc:vi.fn().mockResolvedValue({data:[{id:"notice-1",recipient_email:"student@example.com",subject:"Contest",body:"Ready",href:"/societies",attempts:1}],error:null}),from:vi.fn().mockReturnValue({update})});
    mocks.send.mockResolvedValue({data:{id:"resend-1"},error:null});
    expect(await processSocietyEmailOutbox()).toEqual({sent:1,failed:0});
    expect(mocks.send.mock.calls[0][1]).toEqual({idempotencyKey:"society-notification/notice-1"});
    expect(update.mock.calls[0][0]).toMatchObject({status:"sent",provider_id:"resend-1"});
  });
  it("keeps a failed delivery retryable without affecting the notification",async()=>{
    vi.stubEnv("RESEND_API_KEY","test-only");vi.stubEnv("RESEND_FROM_EMAIL","mail@example.com");
    const update=vi.fn().mockReturnValue({eq:vi.fn().mockResolvedValue({error:null})});
    mocks.admin.mockReturnValue({rpc:vi.fn().mockResolvedValue({data:[{id:"notice-2",recipient_email:"student@example.com",subject:"Contest",body:"Ready",href:"/societies",attempts:1}],error:null}),from:vi.fn().mockReturnValue({update})});
    mocks.send.mockResolvedValue({data:null,error:{message:"Provider unavailable"}});
    expect(await processSocietyEmailOutbox()).toEqual({sent:0,failed:1});
    expect(update.mock.calls[0][0]).toMatchObject({status:"pending",last_error:"Provider unavailable"});
  });
});
