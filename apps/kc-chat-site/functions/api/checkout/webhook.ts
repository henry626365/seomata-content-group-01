// POST /api/checkout/webhook  (Lemon Squeezy → server)
// Verifies the X-Signature header (HMAC-SHA256, hex), then on a paid order
// idempotently issues a card-key and attaches it to our order.
//
// Configure in Lemon Squeezy Dashboard → Settings → Webhooks:
//   URL:    https://<your-domain>/api/checkout/webhook
//   events: order_created
//   secret: matches LEMONSQUEEZY_WEBHOOK_SECRET

import type { Env } from "../../env.d";
import { verifyWebhookSignature, type LSWebhookPayload } from "../../lib/lemonsqueezy";
import { getOrder, allocateCardForOrder, setOrderEmail, claimEmailSend } from "../../lib/orders";
import { sendCardEmail } from "../../lib/email";
import { TIERS } from "../../lib/cards";

export const onRequestPost: PagesFunction<Env> = async ({ request, env, waitUntil }) => {
  if (!env.LEMONSQUEEZY_WEBHOOK_SECRET) {
    return new Response("webhook unconfigured", { status: 503 });
  }

  const sig = request.headers.get("x-signature") || "";
  const payload = await request.text();

  const valid = await verifyWebhookSignature(payload, sig, env.LEMONSQUEEZY_WEBHOOK_SECRET);
  if (!valid) return new Response("invalid signature", { status: 400 });

  let event: LSWebhookPayload;
  try {
    event = JSON.parse(payload) as LSWebhookPayload;
  } catch {
    return new Response("invalid json", { status: 400 });
  }

  const eventName = event.meta?.event_name || request.headers.get("x-event-name") || "";

  if (eventName === "order_created") {
    const attrs = event.data?.attributes;
    const paid = attrs?.status === "paid";
    const orderId = event.meta?.custom_data?.order_id || "";

    if (paid && orderId) {
      const order = await getOrder(env, orderId);
      if (order) {
        let code: string | null;
        try {
          code = await allocateCardForOrder(env, order);
        } catch (e) {
          // Return 500 so Lemon Squeezy retries; allocation is idempotent.
          console.error("[webhook] allocate card failed:", (e as Error).message);
          return new Response("allocate failed", { status: 500 });
        }

        if (!code) {
          // Out of stock for this tier: order is paid but unfulfilled. Return 200 so
          // LS stops retrying (payment succeeded) — an operator must import more codes
          // for this tier and fulfil the order manually.
          console.error(
            `[webhook] OUT OF STOCK tier="${order.tier}" order=${order.id} — import more card-keys`,
          );
          return new Response("ok (out of stock, pending fulfilment)", { status: 200 });
        }

        // Best-effort email delivery (LS always collects the buyer email).
        const email = attrs?.user_email || order.email;
        if (email && code) {
          if (!order.email) await setOrderEmail(env, order.id, email);
          const maysend = await claimEmailSend(env, order.id);
          if (maysend) {
            const base = (env.SITE_URL || new URL(request.url).origin).replace(/\/+$/, "");
            const tierDef = TIERS[order.tier];
            waitUntil(
              sendCardEmail(env, {
                to: email,
                code,
                tierLabel: tierDef?.label || order.tier,
                days: tierDef?.days || 0,
                activateUrl: `${base}/activate?code=${encodeURIComponent(code)}`,
                brand: env.PUBLIC_BRAND || "KC Chat",
              }).catch((e) => console.error("[webhook] email failed:", (e as Error).message)),
            );
          }
        }
      }
    }
  }

  // Always 200 for handled/ignored events so Lemon Squeezy stops retrying.
  return new Response("ok", { status: 200 });
};
