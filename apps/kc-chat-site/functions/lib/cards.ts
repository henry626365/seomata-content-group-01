// Card-code generation + tier definitions.

import type { Env } from "../env.d";
import { randomHex } from "./signing";

/**
 * Card tiers (updated 2026-06-13 — added day trial + $10 lite month):
 *   day      = 日卡(1 day; expires 24h after activation) — customer trial
 *   month    = 月卡(30 days)
 *   year     = 年卡(365 days)
 *   lifetime = 终身(100 years, internally 36500 days)
 *   lite     = 轻享月卡(30 days, $10) — separate low-price channel
 *
 * NOTE: priceUsd/priceCents are for our own records + display only; the amount
 * actually charged lives on the Lemon Squeezy variant (see lemonsqueezy.ts).
 *
 * Adding more tiers? Append here AND update:
 *   - functions/env.d.ts               (LS_VARIANT_* binding)
 *   - functions/api/checkout/create.ts (variantFor map)
 *   - src/pages/activate.astro         (tier tags / copy)
 *   - src/pages/admin/index.astro      (<select> dropdown)
 *   - src/pages/pricing/index.astro    (plan cards)
 */
export const TIERS: Record<string, { label: string; cnLabel: string; days: number; priceUsd: number; priceCents: number }> = {
  day:      { label: "Day Pass", cnLabel: "日卡",     days: 1,     priceUsd:   5, priceCents:   500 },
  month:    { label: "Monthly",  cnLabel: "月卡",     days: 30,    priceUsd:  98, priceCents:  9800 },
  year:     { label: "Yearly",   cnLabel: "年卡",     days: 365,   priceUsd: 198, priceCents: 19800 },
  lifetime: { label: "Lifetime", cnLabel: "终身",     days: 36500, priceUsd: 298, priceCents: 29800 },
  lite:     { label: "Lite",     cnLabel: "轻享月卡", days: 30,    priceUsd:  10, priceCents:  1000 },
};

/** Legacy aliases for backward compat (so existing cards from earlier batches still resolve). */
const TIER_ALIASES: Record<string, string> = {
  m30: "month",
  m90: "month",  // 90-day was deprecated; map to monthly so old codes still work
  y1:  "year",
};
export function normalizeTier(t: string | undefined | null): string | null {
  if (!t) return null;
  const lower = String(t).toLowerCase();
  return TIER_ALIASES[lower] || lower;
}

export function isValidTier(t: string): t is keyof typeof TIERS {
  const n = normalizeTier(t);
  return n !== null && Object.prototype.hasOwnProperty.call(TIERS, n);
}

/** Generate a single human-typable card code like KC-A7H2-9KM3-WX4P (no 0/O/1/I/L). */
const ALPHABET = "23456789ABCDEFGHJKMNPQRSTUVWXYZ";
function block(n: number): string {
  const u = new Uint8Array(n);
  crypto.getRandomValues(u);
  let s = "";
  for (const b of u) s += ALPHABET[b % ALPHABET.length];
  return s;
}
export function newCardCode(prefix: string): string {
  return `${prefix}-${block(4)}-${block(4)}-${block(4)}`;
}

export interface CardRow {
  code: string;
  tier: string;
  duration_days: number;
  status: string;
  generated_at: number;
  activated_at: number | null;
  expires_at: number | null;
  device_hash: string | null;
  install_secret: string | null;
  notes: string | null;
  batch_id: string | null;
}

export async function generateBatch(
  env: Env,
  args: { tier: string; count: number; notes?: string; batchId?: string },
): Promise<CardRow[]> {
  const tier = normalizeTier(args.tier);
  if (!tier || !isValidTier(tier)) throw new Error(`unknown tier: ${args.tier} (allowed: ${Object.keys(TIERS).join(", ")})`);
  if (!(args.count >= 1 && args.count <= 1000)) throw new Error("count must be 1..1000");

  const prefix = env.CARD_PREFIX || "KC";
  const days = TIERS[tier].days;
  const now = Date.now();
  const batchId = args.batchId || randomHex(8);
  const codes: string[] = [];

  // Generate with collision retry (extremely rare given alphabet size 31^12 ≈ 7.9e17)
  for (let i = 0; i < args.count; i++) {
    let attempts = 0;
    while (attempts < 5) {
      const code = newCardCode(prefix);
      try {
        await env.DB.prepare(
          `INSERT INTO cards (code, tier, duration_days, status, generated_at, notes, batch_id)
           VALUES (?, ?, ?, 'unused', ?, ?, ?)`,
        )
          .bind(code, tier, days, now, args.notes || null, batchId)
          .run();
        codes.push(code);
        break;
      } catch (e) {
        attempts++;
        if (attempts >= 5) throw e;
      }
    }
  }

  // Read them back so we return full rows (including auto-set fields)
  const placeholders = codes.map(() => "?").join(",");
  const rs = await env.DB.prepare(`SELECT * FROM cards WHERE code IN (${placeholders})`)
    .bind(...codes)
    .all<CardRow>();
  return rs.results || [];
}

export async function getCard(env: Env, code: string): Promise<CardRow | null> {
  const rs = await env.DB.prepare("SELECT * FROM cards WHERE code = ?").bind(code).first<CardRow>();
  return rs || null;
}
