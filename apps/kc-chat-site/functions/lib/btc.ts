// Shared helpers for BTC recharge → credits.
//
// Architecture (server-push model): the wallet machine runs bitcoind locally and a
// PHP cron (detect.php) that polls `listtransactions` every minute and pushes each
// receive tx to this Worker. The Worker never reaches back to the wallet machine;
// all traffic is server → Worker, authenticated by a shared secret (BTC_INGEST_SECRET).
//
// Money precision: BTC is integer satoshi (1 BTC = 100_000_000 sat); fiat is integer
// cents. We use BigInt for the sat×rate product to avoid float/precision loss.

import type { Env } from "../env.d";
import { randomHex } from "./signing";

export const SATS_PER_BTC = 100_000_000n;

/** Confirmation threshold before a deposit is credited (default 2). */
export function minConfirmations(env: Env): number {
  const n = parseInt(env.BTC_MIN_CONFIRMATIONS || "2", 10);
  return Number.isFinite(n) && n >= 0 ? n : 2;
}

/** Fiat currency used for credits (default usd, kept in sync with CHECKOUT_CURRENCY). */
export function creditCurrency(env: Env): string {
  return (env.BTC_CREDIT_CURRENCY || env.CHECKOUT_CURRENCY || "usd").toLowerCase();
}

/**
 * Constant-time-ish bearer check for the server→Worker ingest/pool endpoints.
 * Returns true only when BTC_INGEST_SECRET is configured and the Authorization
 * header carries the exact matching bearer token.
 */
export function checkIngestAuth(request: Request, env: Env): boolean {
  const secret = (env.BTC_INGEST_SECRET || "").trim();
  if (!secret) return false;
  const header = request.headers.get("authorization") || "";
  const m = /^Bearer\s+(.+)$/i.exec(header.trim());
  const provided = (m?.[1] || "").trim();
  if (provided.length !== secret.length) return false;
  let diff = 0;
  for (let i = 0; i < secret.length; i++) diff |= secret.charCodeAt(i) ^ provided.charCodeAt(i);
  return diff === 0;
}

/** Convert integer satoshi to integer fiat cents at the given rate (cents per 1 BTC), rounded. */
export function satToCents(amountSat: number, rateCentsPerBtc: number): number {
  const num = BigInt(Math.trunc(amountSat)) * BigInt(Math.trunc(rateCentsPerBtc));
  // Round to nearest: add half of the divisor before integer division.
  const half = SATS_PER_BTC / 2n;
  return Number((num + half) / SATS_PER_BTC);
}

/**
 * Current BTC price in integer fiat cents per 1 BTC. Tries Coinbase spot first,
 * then Kraken as a fallback. Returns 0 if every source fails (caller should treat
 * 0 as "rate unavailable" and skip crediting until the next poll).
 */
export async function fetchBtcRateCents(env: Env): Promise<number> {
  const cur = creditCurrency(env).toUpperCase();

  // Source 1: Coinbase spot price.
  try {
    const r = await fetch(`https://api.coinbase.com/v2/prices/BTC-${cur}/spot`, {
      headers: { accept: "application/json" },
      cf: { cacheTtl: 30, cacheEverything: true },
    });
    if (r.ok) {
      const j = (await r.json()) as { data?: { amount?: string } };
      const amt = parseFloat(j?.data?.amount || "");
      if (Number.isFinite(amt) && amt > 0) return Math.round(amt * 100);
    }
  } catch {
    /* fall through */
  }

  // Source 2: Kraken ticker (USD only via XBTUSD; other currencies use XBT<cur>).
  try {
    const pair = cur === "USD" ? "XBTUSD" : `XBT${cur}`;
    const r = await fetch(`https://api.kraken.com/0/public/Ticker?pair=${pair}`, {
      headers: { accept: "application/json" },
    });
    if (r.ok) {
      const j = (await r.json()) as { result?: Record<string, { c?: string[] }> };
      const first = j?.result ? Object.values(j.result)[0] : undefined;
      const last = parseFloat(first?.c?.[0] || "");
      if (Number.isFinite(last) && last > 0) return Math.round(last * 100);
    }
  } catch {
    /* fall through */
  }

  return 0;
}

export interface CreditResult {
  credited: boolean;
  balanceCents: number;
  deltaCents: number;
}

/**
 * Atomically add `deltaCents` to a user's balance and append a ledger row.
 * Uses RETURNING so the post-update balance is read in the same statement.
 */
export async function applyCredit(
  env: Env,
  userId: string,
  deltaCents: number,
  reason: string,
  ref: string | null,
): Promise<CreditResult> {
  const upd = await env.DB.prepare(
    "UPDATE users SET credits_cents = credits_cents + ? WHERE id = ? RETURNING credits_cents",
  )
    .bind(deltaCents, userId)
    .first<{ credits_cents: number }>();

  const balanceCents = upd?.credits_cents ?? 0;

  await env.DB.prepare(
    `INSERT INTO credit_ledger (id, user_id, delta_cents, balance_after_cents, reason, ref, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
  )
    .bind("led_" + randomHex(12), userId, deltaCents, balanceCents, reason, ref, Date.now())
    .run();

  return { credited: true, balanceCents, deltaCents };
}
