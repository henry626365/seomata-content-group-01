/// <reference types="@cloudflare/workers-types" />
//
// Single Cloudflare Worker entry point for kc-chat-site.
//
// Migrated from Cloudflare Pages Functions (file-based `functions/` routing) to a
// Workers + Static Assets deployment:
//   - The static Astro output (./dist) is served via the [assets] binding.
//   - All /api/* endpoints are dispatched here to the original handlers. Those
//     handlers are UNCHANGED and still authored in the Pages `PagesFunction` style,
//     so the business logic (D1 issuance, license activation, LS webhook) is identical.
//
// NOTE: the legacy GET /i-kc Cursor-patch installer route is intentionally NOT wired
// into this Worker (it is the extension-patching delivery mechanism, dropped as part
// of moving to a legitimate product surface). See the migration report for details.

import type { Env } from "../functions/env.d";

import * as health from "../functions/api/health";
import * as checkoutCreate from "../functions/api/checkout/create";
import * as checkoutWebhook from "../functions/api/checkout/webhook";
import * as orderStatus from "../functions/api/order/status";
import * as cardStatus from "../functions/api/card/status";
import * as cardActivate from "../functions/api/card/activate";
import * as adminGenerate from "../functions/api/admin/generate";
import * as adminCards from "../functions/api/admin/cards";
import * as adminRevoke from "../functions/api/admin/revoke";
import * as adminTransfer from "../functions/api/admin/transfer";

type Handler = PagesFunction<Env>;

interface RouteModule {
  onRequest?: Handler;
  onRequestGet?: Handler;
  onRequestPost?: Handler;
  onRequestOptions?: Handler;
}

// Exact-path → handler module map. Keep paths in sync with the front-end fetch calls.
const routes: Record<string, RouteModule> = {
  "/api/health": health,
  "/api/checkout/create": checkoutCreate,
  "/api/checkout/webhook": checkoutWebhook,
  "/api/order/status": orderStatus,
  "/api/card/status": cardStatus,
  "/api/card/activate": cardActivate,
  "/api/admin/generate": adminGenerate,
  "/api/admin/cards": adminCards,
  "/api/admin/revoke": adminRevoke,
  "/api/admin/transfer": adminTransfer,
};

function pickHandler(mod: RouteModule, method: string): Handler | undefined {
  switch (method) {
    case "GET":
    case "HEAD":
      return mod.onRequestGet || mod.onRequest;
    case "POST":
      return mod.onRequestPost || mod.onRequest;
    case "OPTIONS":
      return mod.onRequestOptions || mod.onRequest;
    default:
      return mod.onRequest;
  }
}

const worker: ExportedHandler<Env> = {
  async fetch(request, env, ctx): Promise<Response> {
    const url = new URL(request.url);
    const mod = routes[url.pathname];

    if (mod) {
      const handler = pickHandler(mod, request.method.toUpperCase());
      if (!handler) {
        return new Response("method not allowed", { status: 405 });
      }
      return handler({
        request,
        env,
        params: {},
        data: {},
        functionPath: url.pathname,
        waitUntil: (p: Promise<unknown>) => ctx.waitUntil(p),
        passThroughOnException: () => ctx.passThroughOnException(),
        next: async () => new Response("not found", { status: 404 }),
      });
    }

    // Not an API route → serve the static Astro site. 404 handling is configured
    // in wrangler.toml ([assets].not_found_handling = "404-page").
    return env.ASSETS.fetch(request);
  },
};

export default worker;
