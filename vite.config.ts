import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import type { IncomingMessage, ServerResponse } from "node:http";
import googleHandler from "./server/api-handlers/auth/google";
import callbackHandler from "./server/api-handlers/auth/callback";
import sessionHandler from "./server/api-handlers/auth/session";
import signoutHandler from "./server/api-handlers/auth/signout";
import profileVerificationHandler from "./server/api-handlers/profile-verification";
import type { ApiRequest, ApiResponse } from "./server/supabase";

function apiHandler(handler: (request: ApiRequest, response: ApiResponse) => Promise<unknown>, readJson = false) {
  return async (request: IncomingMessage & { body?: unknown }, response: ServerResponse, _next: (error?: unknown) => void) => {
    if (readJson && request.method === "POST") {
      try {
        const chunks: Buffer[] = [];
        for await (const chunk of request) chunks.push(Buffer.from(chunk));
        request.body = JSON.parse(Buffer.concat(chunks).toString("utf8"));
      } catch {
        response.statusCode = 400;
        response.setHeader("Content-Type", "application/json");
        response.end(JSON.stringify({ error: "Invalid request body." }));
        return;
      }
    }
    const apiResponse: ApiResponse = {
      status(code) { response.statusCode = code; return apiResponse; },
      setHeader(name, value) { response.setHeader(name, value); },
      getHeader(name) { return response.getHeader(name); },
      end(body) { response.end(body); },
      json(body) {
        response.setHeader("Content-Type", "application/json; charset=utf-8");
        response.end(JSON.stringify(body));
      },
      redirect(status, url) {
        response.statusCode = status;
        response.setHeader("Location", url);
        response.end();
      },
    };
    try {
      await handler(request as unknown as ApiRequest, apiResponse);
    } catch (error) {
      if (response.headersSent) return;
      response.statusCode = 500;
      response.setHeader("Content-Type", "application/json; charset=utf-8");
      response.end(JSON.stringify({ error: error instanceof Error ? error.message : "Request failed." }));
    }
  };
}

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  process.env.VITE_SUPABASE_URL ||= env.VITE_SUPABASE_URL;
  process.env.VITE_SUPABASE_PUBLISHABLE_KEY ||= env.VITE_SUPABASE_PUBLISHABLE_KEY;
  return {
  server: {
    host: "::",
    port: 8080,
    historyApiFallback: true,
  },
  plugins: [react(), {
    name: "local-api-handlers",
    configureServer(server) {
      server.middlewares.use("/api/auth/google", apiHandler(googleHandler));
      server.middlewares.use("/api/auth/callback", apiHandler(callbackHandler));
      server.middlewares.use("/api/auth/session", apiHandler(sessionHandler));
      server.middlewares.use("/api/auth/signout", apiHandler(signoutHandler));
      server.middlewares.use("/api/profile-verification", apiHandler(profileVerificationHandler, true));
    },
  }],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: undefined,
      },
    },
  },
  };
});
