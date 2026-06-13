// POST /api/checkout/create
// Body: { tier: "day"|"month"|"year"|"lifetime"|"lite", email?: string }
// Creates a Lemon Squeezy hosted checkout (price lives on the LS variant) and a
// pending order. Returns: { ok, order_id, url } — front-end redirects to `url`.

import type { Env } from "../../env.d";
import { ok, err, readJson, clientIp, clientUa } from "../../lib/http";
import { TIERS, normalizeTier, isValidTier } from "../../lib/cards";
import { createCheckout } from "../../lib/lemonsqueezy";
import { createOrder, setOrderRef } from "../../lib/orders";

/** Map a tier to its configured Lemon Squeezy variant id. */
function variantFor(env: Env, tier: string): string | undefined {
  const map: Record<string, string | undefined> = {
    day: env.LS_VARIANT_DAY,
    month: env.LS_VARIANT_MONTH,
    year: env.LS_VARIANT_YEAR,
    lifetime: env.LS_VARIANT_LIFETIME,
    lite: env.LS_VARIANT_LITE,
  };
  return map[tier];
}

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  if (!env.LEMONSQUEEZY_API_KEY || !env.LEMONSQUEEZY_STORE_ID) {
    return err("payment_unconfigured", "Payments are not configured on the server yet.", 503);
  }

  const body = await readJson<{ tier?: string; email?: string }>(request);
  if (!body || !body.tier || !isValidTier(body.tier)) {
    return err("bad_tier", `tier must be one of: ${Object.keys(TIERS).join(", ")}`);
  }
  const tier = normalizeTier(body.tier)!;

  const variantId = variantFor(env, tier);
  if (!variantId) {
    return err("payment_unconfigured", `No Lemon Squeezy variant configured for tier "${tier}".`, 503);
  }

  const currency = (env.CHECKOUT_CURRENCY || "usd").toLowerCase();
  const email =
    typeof body.email === "string" && body.email.includes("@")
      ? body.email.trim().slice(0, 200)
      : undefined;

  const base = (env.SITE_URL || new URL(request.url).origin).replace(/\/+$/, "");

  const order = await createOrder(env, {
    tier,
    currency,
    email,
    ip: clientIp(request),
    ua: clientUa(request),
    provider: "lemonsqueezy",
  });

  try {
    const checkout = await createCheckout({
      apiKey: env.LEMONSQUEEZY_API_KEY,
      storeId: env.LEMONSQUEEZY_STORE_ID,
      variantId,
      orderId: order.id,
      redirectUrl: `${base}/order/success?order=${order.id}`,
      email,
      receiptThankYouNote: `Your ${TIERS[tier].label} card-key is on its way — check ${base}/order/success?order=${order.id}`,
    });
    await setOrderRef(env, order.id, checkout.id);
    return ok({ order_id: order.id, url: checkout.url });
  } catch (e) {
    return err("checkout_failed", (e as Error).message, 502);
  }
};
