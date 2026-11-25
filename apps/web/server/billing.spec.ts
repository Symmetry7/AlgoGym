import {createHmac} from "node:crypto";
import {describe,expect,it,vi} from "vitest";
import type {SupabaseClient} from "@supabase/supabase-js";
vi.mock("server-only",()=>({}));
import {validHmac,reconcileSubscription} from "./billing";

describe("subscription verification",()=>{
  it("accepts only the matching HMAC",()=>{
    const body='{"event":"subscription.charged"}';
    const signature=createHmac("sha256","webhook-secret").update(body).digest("hex");
    expect(validHmac(body,signature,"webhook-secret")).toBe(true);
    expect(validHmac(body+" ",signature,"webhook-secret")).toBe(false);
    expect(validHmac(body,"bad","webhook-secret")).toBe(false);
  });
  it("rejects a remote subscription on the wrong plan before credits are granted",async()=>{
    vi.stubEnv("RAZORPAY_KEY_ID","rzp_test_example");vi.stubEnv("RAZORPAY_KEY_SECRET","secret");
    const fetchMock=vi.spyOn(globalThis,"fetch").mockResolvedValue({ok:true,json:async()=>({id:"sub_1",plan_id:"plan_other",paid_count:1,status:"active"})} as Response);
    const rpc=vi.fn();
    const db={from:()=>({select:()=>({eq:()=>({maybeSingle:async()=>({data:{id:"sub_1",plan_id:"plan_expected",paid_count:0},error:null})})})}),rpc} as unknown as SupabaseClient;
    await expect(reconcileSubscription(db,"sub_1")).rejects.toThrow("could not be verified");
    expect(rpc).not.toHaveBeenCalled();fetchMock.mockRestore();vi.unstubAllEnvs();
  });
});
