/// <reference types="@cloudflare/workers-types" />
//
// Single Cloudflare Worker entry point for kc-chat-site.
//
// Migrated from Cloudflare Pages Functions (file-based `functions/` routing) to a
// Workers + Static Assets deployment:
//   - The static Astro output (./dist) is served via the [assets] binding.
//   - All /api/* endpoints are dispatched here to the original handlers, authored
//     in the Pages `PagesFunction` style (health, LS checkout/webhook, order status,
//     admin import/list/revoke). Card activation/verification is NOT handled here —
//     that lives on the separate kk-license service; h540 only sells imported stock.
//
import type { Env } from "../functions/env.d";

import * as health from "../functions/api/health";
import * as checkoutCreate from "../functions/api/checkout/create";
import * as checkoutWebhook from "../functions/api/checkout/webhook";
import * as orderStatus from "../functions/api/order/status";
import * as adminImport from "../functions/api/admin/import";
import * as adminCards from "../functions/api/admin/cards";
import * as adminRevoke from "../functions/api/admin/revoke";
import * as adminDelete from "../functions/api/admin/delete";
import * as authGoogleStart from "../functions/api/auth/google/start";
import * as authGoogleCallback from "../functions/api/auth/google/callback";
import * as authMe from "../functions/api/auth/me";
import * as authLogout from "../functions/api/auth/logout";
import * as accountOrders from "../functions/api/account/orders";
import * as accountResend from "../functions/api/account/resend";
import * as btcIngest from "../functions/api/btc/ingest";
import * as btcPoolRefill from "../functions/api/btc/pool_refill";
import * as accountBtcRecharge from "../functions/api/account/btc/recharge";
import * as accountBtcDeposits from "../functions/api/account/btc/deposits";
import * as accountBuy from "../functions/api/account/buy";

type Handler = PagesFunction<Env>;

interface RouteModule {
  onRequest?: Handler;
  onRequestGet?: Handler;
  onRequestPost?: Handler;
  onRequestOptions?: Handler;
}

// Exact-path → handler module map. Keep paths in sync with the front-end fetch calls.
// h540 is a pure distribution front: it sells imported card-keys and never
// activates them (activation/verification lives on kk-license). So there are no
// /api/card/* routes here; admin imports stock instead of generating it.
const routes: Record<string, RouteModule> = {
  "/api/health": health,
  "/api/checkout/create": checkoutCreate,
  "/api/checkout/webhook": checkoutWebhook,
  "/api/order/status": orderStatus,
  "/api/admin/import": adminImport,
  "/api/admin/cards": adminCards,
  "/api/admin/revoke": adminRevoke,
  "/api/admin/delete": adminDelete,
  "/api/auth/google/start": authGoogleStart,
  "/api/auth/google/callback": authGoogleCallback,
  "/api/auth/me": authMe,
  "/api/auth/logout": authLogout,
  "/api/account/orders": accountOrders,
  "/api/account/resend": accountResend,
  // BTC recharge: server→Worker push (Bearer) + user-facing account endpoints.
  "/api/btc/ingest": btcIngest,
  "/api/btc/pool/refill": btcPoolRefill,
  "/api/account/btc/recharge": accountBtcRecharge,
  "/api/account/btc/deposits": accountBtcDeposits,
  "/api/account/buy": accountBuy,
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
