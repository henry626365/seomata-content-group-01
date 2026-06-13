// Order persistence + idempotent card-key issuance on successful payment.

import type { Env } from "../env.d";
import { randomHex } from "./signing";
import { TIERS, normalizeTier, newCardCode } from "./cards";

export interface OrderRow {
  id: string;
  provider: string;
  provider_ref: string | null;
  tier: string;
  amount_cents: number;
  currency: string;
  email: string | null;
  status: string;
  card_code: string | null;
  created_at: number;
  paid_at: number | null;
  ip: string | null;
  ua: string | null;
  email_sent_at: number | null;
}

export async function getOrder(env: Env, id: string): Promise<OrderRow | null> {
  const row = await env.DB.prepare("SELECT * FROM orders WHERE id = ?").bind(id).first<OrderRow>();
  return row || null;
}

export async function createOrder(
  env: Env,
  args: { tier: string; currency: string; email?: string; ip?: string; ua?: string; provider?: string },
): Promise<OrderRow> {
  const tier = normalizeTier(args.tier);
  if (!tier || !TIERS[tier]) throw new Error(`unknown tier: ${args.tier}`);

  const id = "ord_" + randomHex(12);
  const amount = TIERS[tier].priceCents;
  const provider = args.provider || "lemonsqueezy";
  const now = Date.now();

  await env.DB.prepare(
    `INSERT INTO orders (id, provider, tier, amount_cents, currency, email, status, created_at, ip, ua)
     VALUES (?, ?, ?, ?, ?, ?, 'pending', ?, ?, ?)`,
  )
    .bind(id, provider, tier, amount, args.currency, args.email || null, now, args.ip || null, args.ua || null)
    .run();

  const created = await getOrder(env, id);
  if (!created) throw new Error("order insert failed");
  return created;
}

export async function setOrderRef(env: Env, id: string, providerRef: string): Promise<void> {
  await env.DB.prepare("UPDATE orders SET provider_ref = ? WHERE id = ?").bind(providerRef, id).run();
}

/** Record the buyer email (learned from the payment provider) if we don't have one yet. */
export async function setOrderEmail(env: Env, id: string, email: string): Promise<void> {
  await env.DB.prepare("UPDATE orders SET email = ? WHERE id = ? AND (email IS NULL OR email = '')")
    .bind(email, id)
    .run();
}

/**
 * Atomically claim the right to send the card-key email exactly once.
 * Returns true only for the caller that flips email_sent_at from NULL → now
 * (guards against duplicate webhook deliveries sending duplicate emails).
 */
export async function claimEmailSend(env: Env, id: string): Promise<boolean> {
  const r = await env.DB.prepare(
    "UPDATE orders SET email_sent_at = ? WHERE id = ? AND email_sent_at IS NULL AND card_code IS NOT NULL",
  )
    .bind(Date.now(), id)
    .run();
  return (r.meta?.changes ?? 0) > 0;
}

/**
 * Idempotently mark an order paid and issue a fresh card-key.
 * Safe against duplicate webhook deliveries: the card is only generated once;
 * a re-fetch guards the tiny race window between concurrent deliveries.
 */
export async function markPaidAndIssueCard(env: Env, order: OrderRow): Promise<string> {
  if (order.card_code) return order.card_code;

  // Guard against a concurrent webhook that already issued.
  const fresh = await getOrder(env, order.id);
  if (fresh?.card_code) return fresh.card_code;

  const tier = normalizeTier(order.tier);
  if (!tier || !TIERS[tier]) throw new Error(`unknown tier on order: ${order.tier}`);

  const prefix = env.CARD_PREFIX || "KC";
  const days = TIERS[tier].days;
  const now = Date.now();

  let code = "";
  let attempts = 0;
  while (attempts < 5) {
    code = newCardCode(prefix);
    try {
      await env.DB.prepare(
        `INSERT INTO cards (code, tier, duration_days, status, generated_at, notes, batch_id)
         VALUES (?, ?, ?, 'unused', ?, ?, 'paid')`,
      )
        .bind(code, tier, days, now, `order:${order.id}`)
        .run();
      break;
    } catch (e) {
      attempts++;
      if (attempts >= 5) throw e;
    }
  }

  // Attach the card to the order only if not already set (winner-takes-all on the race).
  await env.DB.prepare(
    "UPDATE orders SET status='paid', card_code=?, paid_at=? WHERE id=? AND card_code IS NULL",
  )
    .bind(code, now, order.id)
    .run();

  const after = await getOrder(env, order.id);
  return after?.card_code || code;
}
