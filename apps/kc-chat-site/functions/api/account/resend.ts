// POST /api/account/resend
// Body: { orderId: string }
// Re-sends the card-key email for one of the logged-in user's own paid orders.
// Requires a valid session; the order's email must match the user's email.

import type { Env } from "../../env.d";
import { ok, err, readJson } from "../../lib/http";
import { getSessionUser } from "../../lib/session";
import { getOrder } from "../../lib/orders";
import { sendCardEmail } from "../../lib/email";
import { TIERS } from "../../lib/cards";

const RESEND_COOLDOWN_MS = 60_000; // 1 minute between resends per order

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  const user = await getSessionUser(request, env);
  if (!user) return err("unauthorized", "login required", 401);

  if (!env.RESEND_API_KEY) {
    return err("email_unconfigured", "Email delivery is not configured on the server", 503);
  }

  const body = await readJson<{ orderId?: string }>(request);
  if (!body?.orderId) return err("bad_request", "orderId required");

  const order = await getOrder(env, body.orderId.trim());
  if (!order) return err("not_found", "order not found", 404);

  // Ownership: the order email must match the logged-in user's email.
  if (!order.email || order.email.trim().toLowerCase() !== user.email_lower) {
    return err("forbidden", "this order does not belong to you", 403);
  }
  if (order.status !== "paid" || !order.card_code) {
    return err("not_deliverable", "order has no issued card-key yet", 409);
  }

  // Soft cooldown to prevent inbox spamming.
  if (order.email_sent_at && Date.now() - order.email_sent_at < RESEND_COOLDOWN_MS) {
    const wait = Math.ceil((RESEND_COOLDOWN_MS - (Date.now() - order.email_sent_at)) / 1000);
    return err("rate_limited", `please wait ${wait}s before resending`, 429);
  }

  const base = (env.SITE_URL || new URL(request.url).origin).replace(/\/+$/, "");
  const tierDef = TIERS[order.tier];

  try {
    await sendCardEmail(env, {
      to: order.email,
      code: order.card_code,
      tierLabel: tierDef?.label || order.tier,
      days: tierDef?.days || 0,
      activateUrl: `${base}/activate?code=${encodeURIComponent(order.card_code)}`,
      brand: env.PUBLIC_BRAND || "KC Chat",
    });
  } catch (e) {
    return err("send_failed", (e as Error).message, 502);
  }

  await env.DB.prepare(`UPDATE orders SET email_sent_at = ? WHERE id = ?`)
    .bind(Date.now(), order.id)
    .run();

  return ok({ sent: true, to: order.email });
};
