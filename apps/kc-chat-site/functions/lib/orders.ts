// Order persistence + idempotent card-key issuance on successful payment.

import type { Env } from "../env.d";
import { randomHex } from "./signing";
import { TIERS, normalizeTier } from "./cards";

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
 * Idempotently mark an order paid and ALLOCATE a card from inventory.
 *
 * h540 is a pure distribution front: it never generates codes. Cards are
 * generated on kk-license, imported here as `unused` stock, then allocated to a
 * paid order (status `unused` -> `sold`).
 *
 * Returns the allocated card code, or `null` when this tier is out of stock
 * (the order is still marked paid so the buyer can be fulfilled later — the
 * caller should alert an operator to import more codes for that tier).
 *
 * Safe against duplicate webhook deliveries: an already-attached order short
 * circuits; a card claimed in a lost order-attach race is released back to stock.
 */
export async function allocateCardForOrder(env: Env, order: OrderRow): Promise<string | null> {
  if (order.card_code) return order.card_code;

  const fresh = await getOrder(env, order.id);
  if (fresh?.card_code) return fresh.card_code;

  const tier = normalizeTier(order.tier);
  if (!tier || !TIERS[tier]) throw new Error(`unknown tier on order: ${order.tier}`);

  const now = Date.now();

  for (let attempt = 0; attempt < 3; attempt++) {
    // Atomically claim the oldest unused card of this tier (D1 serializes writes).
    const claimed = await env.DB.prepare(
      `UPDATE cards
          SET status='sold', sold_at=?, notes = COALESCE(notes,'') || ?
        WHERE code = (
          SELECT code FROM cards
           WHERE tier = ? AND status = 'unused'
           ORDER BY generated_at ASC
           LIMIT 1
        )
      RETURNING code`,
    )
      .bind(now, `\n[sold order:${order.id} @ ${new Date(now).toISOString()}]`, tier)
      .first<{ code: string }>();

    if (!claimed?.code) {
      // Out of stock for this tier → keep the order paid but unfulfilled.
      await env.DB.prepare(
        "UPDATE orders SET status='paid', paid_at=COALESCE(paid_at, ?) WHERE id=? AND card_code IS NULL",
      )
        .bind(now, order.id)
        .run();
      return null;
    }

    // Attach the claimed card to the order (winner-takes-all if two webhooks race).
    const attach = await env.DB.prepare(
      "UPDATE orders SET status='paid', card_code=?, paid_at=? WHERE id=? AND card_code IS NULL",
    )
      .bind(claimed.code, now, order.id)
      .run();

    if ((attach.meta?.changes ?? 0) > 0) return claimed.code;

    // Lost the race: release the card we claimed back into stock, return the winner's.
    await env.DB.prepare(
      "UPDATE cards SET status='unused', sold_at=NULL WHERE code=? AND status='sold'",
    )
      .bind(claimed.code)
      .run();

    const winner = await getOrder(env, order.id);
    if (winner?.card_code) return winner.card_code;
  }

  return null;
}
