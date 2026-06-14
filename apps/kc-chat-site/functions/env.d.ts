/// <reference types="@cloudflare/workers-types" />

export interface Env {
  DB: D1Database;
  // Static assets binding (Astro ./dist) — Workers Static Assets.
  ASSETS: Fetcher;
  ADMIN_TOKEN: string;
  ADMIN_ALLOW_CIDR?: string;
  CARD_PREFIX?: string;
  PUBLIC_BRAND?: string;
  // Payments (Lemon Squeezy / Merchant of Record) — set via `wrangler secret put ...`
  LEMONSQUEEZY_API_KEY?: string;
  LEMONSQUEEZY_STORE_ID?: string;
  LEMONSQUEEZY_WEBHOOK_SECRET?: string;
  // Variant ids (one LS product, multiple variants) — set as plain vars or secrets
  LS_VARIANT_DAY?: string;       // 日卡 $5 / 24h trial
  LS_VARIANT_MONTH?: string;
  LS_VARIANT_YEAR?: string;
  LS_VARIANT_LIFETIME?: string;
  LS_VARIANT_LITE?: string;      // 轻享月卡 $10 / 30d (separate channel)
  CHECKOUT_CURRENCY?: string; // default "usd"
  SITE_URL?: string;          // optional override for success/redirect URLs
  // Email delivery (Resend) — optional; card is still shown on the success page if unset
  RESEND_API_KEY?: string;
  MAIL_FROM?: string;         // e.g. "KC Chat <noreply@h540.com>"
  // Google OAuth (Sign in with Google) — set via `wrangler secret put ...`
  GOOGLE_CLIENT_ID?: string;
  GOOGLE_CLIENT_SECRET?: string;
  // Comma-separated email whitelist that gets role='admin' on login (e.g. "me@gmail.com,boss@h540.com")
  ADMIN_EMAILS?: string;
  // BTC recharge (self-hosted bitcoind, server-push model) — see functions/lib/btc.ts
  // Shared secret the wallet machine uses to call /api/btc/ingest + /api/btc/pool/refill.
  BTC_INGEST_SECRET?: string;
  BTC_MIN_CONFIRMATIONS?: string; // default "2"
  BTC_CREDIT_CURRENCY?: string;   // default falls back to CHECKOUT_CURRENCY ("usd")
}

declare global {
  type PagesFunction<TEnv = Env, TParams extends string = string> = (
    context: {
      request: Request;
      env: TEnv;
      params: Record<TParams, string | string[]>;
      data: Record<string, unknown>;
      waitUntil(promise: Promise<unknown>): void;
      next(input?: Request | string, init?: RequestInit): Promise<Response>;
    },
  ) => Response | Promise<Response>;
}
