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

export interface CardRow {
  code: string;
  tier: string;
  duration_days: number;
  status: string;            // unused (in stock) / sold / revoked
  generated_at: number;      // unix ms when imported into h540
  activated_at: number | null;  // (kk-license concern — unused on h540)
  expires_at: number | null;    // (kk-license concern — unused on h540)
  device_hash: string | null;   // (kk-license concern — unused on h540)
  install_secret: string | null;// (kk-license concern — unused on h540)
  notes: string | null;
  batch_id: string | null;
  sold_at: number | null;    // unix ms when allocated to a paid order
  source: string | null;     // 'import' (from kk-license)
}

export interface ImportResult {
  tier: string;
  imported: number;     // newly inserted
  duplicates: number;   // codes already present (INSERT OR IGNORE skipped)
  invalid: number;      // codes that failed the shape guard
  batchId: string;
}

/**
 * Import externally-generated (kk-license) card codes as sellable inventory.
 * h540 never generates codes itself — it only takes what kk-license issued and
 * stores them as `unused` stock for sale. Existing codes are skipped (idempotent).
 */
export async function importCards(
  env: Env,
  args: { tier: string; codes: string[]; notes?: string; batchId?: string },
): Promise<ImportResult> {
  const tier = normalizeTier(args.tier);
  if (!tier || !isValidTier(tier)) {
    throw new Error(`unknown tier: ${args.tier} (allowed: ${Object.keys(TIERS).join(", ")})`);
  }

  const days = TIERS[tier].days;
  const now = Date.now();
  const batchId = args.batchId || randomHex(8);

  // Normalize → validate shape → dedupe within the batch.
  const seen = new Set<string>();
  const codes: string[] = [];
  let invalid = 0;
  for (const raw of args.codes) {
    const code = String(raw ?? "").trim().toUpperCase();
    if (!code) continue;
    if (!/^[A-Z0-9][A-Z0-9-]{5,63}$/.test(code)) { invalid++; continue; }
    if (seen.has(code)) continue;
    seen.add(code);
    codes.push(code);
  }
  if (codes.length > 5000) throw new Error("too many codes in one import (max 5000)");

  let imported = 0;
  for (const code of codes) {
    const r = await env.DB.prepare(
      `INSERT OR IGNORE INTO cards (code, tier, duration_days, status, generated_at, notes, batch_id, source)
       VALUES (?, ?, ?, 'unused', ?, ?, ?, 'import')`,
    )
      .bind(code, tier, days, now, args.notes || null, batchId)
      .run();
    if ((r.meta?.changes ?? 0) > 0) imported++;
  }

  return { tier, imported, duplicates: codes.length - imported, invalid, batchId };
}

export async function getCard(env: Env, code: string): Promise<CardRow | null> {
  const rs = await env.DB.prepare("SELECT * FROM cards WHERE code = ?").bind(code).first<CardRow>();
  return rs || null;
}
