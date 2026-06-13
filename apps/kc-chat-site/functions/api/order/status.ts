// GET /api/order/status?order=ord_xxx
// The success page polls this until the webhook issues the card.
// The order id (24 random hex) acts as an unguessable claim secret.

import type { Env } from "../../env.d";
import { ok, err } from "../../lib/http";
import { getOrder } from "../../lib/orders";
import { TIERS } from "../../lib/cards";

export const onRequestGet: PagesFunction<Env> = async ({ request, env }) => {
  const url = new URL(request.url);
  const id = url.searchParams.get("order") || url.searchParams.get("id") || "";
  if (!id) return err("bad_request", "order id required");

  const order = await getOrder(env, id);
  if (!order) return err("not_found", "order not found", 404);

  return ok({
    status: order.status, // pending | paid | refunded | failed
    tier: order.tier,
    tier_label: TIERS[order.tier]?.label || order.tier,
    amount_cents: order.amount_cents,
    currency: order.currency,
    // Only reveal the card once payment is confirmed server-side.
    card_code: order.status === "paid" ? order.card_code : null,
  });
};
