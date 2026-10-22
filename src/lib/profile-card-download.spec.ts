import { afterEach, describe, expect, it, vi } from "vitest";
import { downloadProfileCard } from "./profile-card-download";

afterEach(() => { vi.unstubAllGlobals(); vi.restoreAllMocks(); vi.useRealTimers(); });

function browser(encoded: Blob | null = new Blob([new Uint8Array([255, 216, 255])], { type: "image/jpeg" })) {
  vi.useFakeTimers();
  const preview = new Blob(["<svg/>"], { type: "image/svg+xml" });
  vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true, blob: async () => preview }));
  const create = vi.spyOn(URL, "createObjectURL").mockReturnValueOnce("blob:preview").mockReturnValueOnce("blob:jpeg");
  const revoke = vi.spyOn(URL, "revokeObjectURL").mockImplementation(() => {});
  vi.stubGlobal("Image", class {
    naturalWidth = 1080;
    naturalHeight = 720;
    onload = () => {};
    set src(_: string) { this.onload(); }
  });
  const context = { fillRect: vi.fn(), drawImage: vi.fn(), fillStyle: "" };
  const canvas = { width: 0, height: 0, getContext: () => context, toBlob: vi.fn((callback: (blob: Blob | null) => void) => callback(encoded)) };
  const link = { href: "", download: "", click: vi.fn(), remove: vi.fn() };
  vi.stubGlobal("document", { createElement: (tag: string) => tag === "canvas" ? canvas : link, body: { appendChild: vi.fn() } });
  vi.stubGlobal("window", { setTimeout });
  return { create, revoke, canvas, link, encoded };
}

describe("profile card JPEG download", () => {
  it("encodes a 2x JPEG and downloads a .jpg, then releases both object URLs", async () => {
    const b = browser();
    await downloadProfileCard();
    expect(fetch).toHaveBeenCalledWith("/api/profile-card", { credentials: "same-origin", cache: "no-store" });
    expect(b.canvas.width).toBe(2160);
    expect(b.canvas.height).toBe(1440);
    expect(b.canvas.toBlob).toHaveBeenCalledWith(expect.any(Function), "image/jpeg", 0.95);
    expect(b.create).toHaveBeenLastCalledWith(b.encoded);
    expect(b.link.download).toBe("algogym-profile.jpg");
    expect(b.link.href).toBe("blob:jpeg");
    expect(b.link.click).toHaveBeenCalledOnce();
    expect(b.link.remove).toHaveBeenCalledOnce();
    vi.runAllTimers();
    expect(b.revoke.mock.calls).toEqual([["blob:preview"], ["blob:jpeg"]]);
  });
  it.each([null, new Blob(["png"], { type: "image/png" })])("does not disguise a failed or unsupported encoding as JPEG", async (blob) => {
    const b = browser(blob);
    await expect(downloadProfileCard()).rejects.toThrow("JPEG export is unavailable");
    expect(b.link.click).not.toHaveBeenCalled();
    expect(b.revoke).toHaveBeenCalledWith("blob:preview");
  });
  it("does not download an authentication or server error response", async () => {
    const b = browser();
    vi.mocked(fetch).mockResolvedValue({ ok: false } as Response);
    await expect(downloadProfileCard()).rejects.toThrow("could not be loaded");
    expect(b.create).not.toHaveBeenCalled();
    expect(b.link.click).not.toHaveBeenCalled();
  });
});
