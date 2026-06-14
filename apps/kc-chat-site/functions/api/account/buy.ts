// POST /api/account/buy   (logged-in user)
//
// Spend credit balance to buy a card-key. Deducts credits atomically (guarded so
// it can never go negative), creates a `credits` order, allocates a card from
// stock, writes a ledger debit, and best-effort emails the code. If the tier is
// out of stock the credits are refunded and the order is marked refunded.
//
// Body: { tier }   (day | month | year | lifetime | lite)

import type { Env } from "../../env.d";
import { ok, err, readJson } from "../../lib/http";
import { getSessionUser } from "../../lib/session";
import { TIERS, normalizeTier } from "../../lib/cards";
import { createOrder, allocateCardForOrder, claimEmailSend } from "../../lib/orders";
import { sendCardEmail } from "../../lib/email";
import { randomHex } from "../../lib/signing";

interface BuyBody {
  tier?: string;
}

export const onRequestPost: PagesFunction<Env> = async ({ request, env, waitUntil }) => {
  const user = await getSessionUser(request, env);
  if (!user) return err("unauthorized", "login required", 401);

  const body = await readJson<BuyBody>(request);
  const tier = normalizeTier(body?.tier);
  if (!tier || !TIERS[tier]) return err("bad_tier", "unknown tier", 400);

  const price = TIERS[tier].priceCents;
  const currency = (env.CHECKOUT_CURRENCY || "usd").toLowerCase();

  // 1) Atomically deduct credits (guard prevents overdraft / double-spend).
  const deducted = await env.DB.prepare(
    "UPDATE users SET credits_cents = credits_cents - ? WHERE id = ? AND credits_cents >= ? RETURNING credits_cents",
  )
    .bind(price, user.id, price)
    .first<{ credits_cents: number }>();

  if (!deducted) {
    const bal = await env.DB.prepare("SELECT credits_cents FROM users WHERE id = ?")
      .bind(user.id)
      .first<{ credits_cents: number }>();
    return err("insufficient_credits", "not enough balance", 402, {
      balance_cents: bal?.credits_cents ?? 0,
      price_cents: price,
    });
  }

  const balanceAfter = deducted.credits_cents;

  // 2) Create the order (provider 'credits') tied to the buyer's email.
  const order = await createOrder(env, {
    tier,
    currency,
    email: user.email,
    provider: "credits",
    ip: request.headers.get("cf-connecting-ip") || undefined,
    ua: (request.headers.get("user-agent") || "").slice(0, 240) || undefined,
  });

  // 3) Allocate a card from stock.
  let code: string | null = null;
  try {
    code = await allocateCardForOrder(env, order);
  } catch (e) {
    console.error("[buy] allocate failed:", (e as Error).message);
    code = null;
  }

  if (!code) {
    // Out of stock → refund and mark the order refunded; no card was issued.
    const refunded = await env.DB.prepare(
      "UPDATE users SET credits_cents = credits_cents + ? WHERE id = ? RETURNING credits_cents",
    )
      .bind(price, user.id)
      .first<{ credits_cents: number }>();
    await env.DB.prepare("UPDATE orders SET status='refunded' WHERE id = ?").bind(order.id).run();
    await env.DB.prepare(
      `INSERT INTO credit_ledger (id, user_id, delta_cents, balance_after_cents, reason, ref, created_at)
       VALUES (?, ?, ?, ?, 'refund', ?, ?)`,
    )
      .bind("led_" + randomHex(12), user.id, price, refunded?.credits_cents ?? balanceAfter + price, order.id, Date.now())
      .run();
    return err("out_of_stock", "this plan is temporarily out of stock; your balance was not charged", 409, {
      balance_cents: refunded?.credits_cents ?? balanceAfter + price,
    });
  }

  // 4) Ledger debit for the successful purchase.
  await env.DB.prepare(
    `INSERT INTO credit_ledger (id, user_id, delta_cents, balance_after_cents, reason, ref, created_at)
     VALUES (?, ?, ?, ?, 'purchase', ?, ?)`,
  )
    .bind("led_" + randomHex(12), user.id, -price, balanceAfter, order.id, Date.now())
    .run();

  // 5) Best-effort card-key email (success response always carries the code too).
  const maysend = await claimEmailSend(env, order.id);
  if (maysend) {
    const base = (env.SITE_URL || new URL(request.url).origin).replace(/\/+$/, "");
    const tierDef = TIERS[tier];
    waitUntil(
      sendCardEmail(env, {
        to: user.email,
        code,
        tierLabel: tierDef.label,
        days: tierDef.days,
        activateUrl: `${base}/activate?code=${encodeURIComponent(code)}`,
        brand: env.PUBLIC_BRAND || "KC Chat",
      }).catch((e) => console.error("[buy] email failed:", (e as Error).message)),
    );
  }

  return ok({
    order_id: order.id,
    tier,
    card_code: code,
    spent_cents: price,
    balance_cents: balanceAfter,
    currency,
  });
};
