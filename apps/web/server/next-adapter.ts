import { NextRequest, NextResponse } from "next/server";
import type { ApiRequest, ApiResponse } from "./supabase";

type Handler = (request: ApiRequest, response: ApiResponse) => Promise<unknown>;

export async function runApiHandler(request: NextRequest, handler: Handler) {
  const headers = new Headers();
  let status = 200;
  let body: unknown = null;
  const response: ApiResponse = {
    status(code) {
      status = code;
      return this;
    },
    setHeader(name, value) {
      if (Array.isArray(value)) {
        headers.delete(name);
        value.forEach((part) => headers.append(name, String(part)));
      } else headers.set(name, String(value));
    },
    getHeader(name) {
      return name.toLowerCase() === "set-cookie"
        ? headers.getSetCookie()
        : (headers.get(name) ?? undefined);
    },
    end(value) {
      body = value ?? null;
    },
    json(value) {
      body = value;
    },
    redirect(code, location) {
      status = code;
      headers.set("Location", location);
      body = null;
    },
  };
  let parsedBody: unknown;
  if (!new Set(["GET", "HEAD"]).has(request.method))
    parsedBody = await request.json().catch(() => ({}));
  const apiRequest: ApiRequest = {
    method: request.method,
    url: request.url,
    headers: Object.fromEntries(request.headers.entries()),
    body: parsedBody,
  };
  try {
    await handler(apiRequest, response);
  } catch {
    status = 503;
    body = { error: "This service is temporarily unavailable. Please retry." };
    headers.set("Cache-Control", "private, no-store");
  }
  if (body !== null && typeof body !== "string" && !headers.has("Content-Type"))
    headers.set("Content-Type", "application/json; charset=utf-8");
  const serialized =
    typeof body === "string"
      ? body
      : body === null
        ? null
        : JSON.stringify(body);
  return new NextResponse(serialized, { status, headers });
}
