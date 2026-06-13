// Minimal Lemon Squeezy (Merchant of Record) client for Cloudflare Workers.
// No SDK — just fetch + Web Crypto. Mirrors the surface the card-key shop needs:
//   - createCheckout()         → hosted LS Checkout for a given variant, carries our order_id
//   - verifyWebhookSignature() → validate the X-Signature header (HMAC-SHA256, hex)
//
// Why Lemon Squeezy: it acts as Merchant of Record, so chargebacks, global
// sales-tax/VAT and the payout account itself sit with LS — we only receive the
// net amount and a signed `order_created` webhook to fulfil against.

const LS_API = "https://api.lemonsqueezy.com/v1";

export interface LSCheckoutParams {
  apiKey: string;
  storeId: string;
  variantId: string;
  /** Our internal order id — echoed back in the webhook under meta.custom_data.order_id. */
  orderId: string;
  redirectUrl: string;
  email?: string;
  /** Optional buyer-facing receipt note. */
  receiptThankYouNote?: string;
}

/**
 * Create a hosted Lemon Squeezy checkout for a single variant.
 * Returns the checkout URL the browser should be redirected to.
 *
 * The variant price is configured in the LS dashboard, so we never send an
 * amount here — that keeps prices authoritative on LS and avoids tampering.
 */
export async function createCheckout(p: LSCheckoutParams): Promise<{ id: string; url: string }> {
  const payload = {
    data: {
      type: "checkouts",
      attributes: {
        // custom values MUST be strings; they come back verbatim in the webhook.
        checkout_data: {
          ...(p.email ? { email: p.email } : {}),
          custom: { order_id: p.orderId },
        },
        product_options: {
          redirect_url: p.redirectUrl,
          ...(p.receiptThankYouNote ? { receipt_thank_you_note: p.receiptThankYouNote } : {}),
        },
        checkout_options: { embed: false },
      },
      relationships: {
        store: { data: { type: "stores", id: String(p.storeId) } },
        variant: { data: { type: "variants", id: String(p.variantId) } },
      },
    },
  };

  const resp = await fetch(`${LS_API}/checkouts`, {
    method: "POST",
    headers: {
      accept: "application/vnd.api+json",
      "content-type": "application/vnd.api+json",
      authorization: `Bearer ${p.apiKey}`,
    },
    body: JSON.stringify(payload),
  });

  const data = (await resp.json().catch(() => null)) as
    | { data?: { id?: string; attributes?: { url?: string } }; errors?: Array<{ detail?: string }> }
    | null;

  const url = data?.data?.attributes?.url;
  const id = data?.data?.id;
  if (!resp.ok || !url || !id) {
    const msg = data?.errors?.[0]?.detail || `checkout failed (${resp.status})`;
    throw new Error(`lemonsqueezy ${resp.status}: ${msg}`);
  }
  return { id, url };
}

function bytesToHex(buf: ArrayBuffer): string {
  const u = new Uint8Array(buf);
  let s = "";
  for (const b of u) s += b.toString(16).padStart(2, "0");
  return s;
}

/** Constant-time-ish hex compare. */
function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

/**
 * Verify a Lemon Squeezy webhook signature.
 * LS signs the raw request body with HMAC-SHA256 keyed by the webhook signing
 * secret and sends the lowercase hex digest in the `X-Signature` header.
 */
export async function verifyWebhookSignature(
  rawBody: string,
  signatureHeader: string,
  secret: string,
): Promise<boolean> {
  if (!signatureHeader || !secret) return false;

  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(rawBody));
  const expected = bytesToHex(sig);

  return timingSafeEqual(expected, signatureHeader.trim().toLowerCase());
}

// ---- Webhook payload shape (only the fields we consume) -------------------

export interface LSWebhookPayload {
  meta?: {
    event_name?: string;
    custom_data?: Record<string, string> | null;
  };
  data?: {
    type?: string;
    id?: string;
    attributes?: {
      status?: string; // pending | failed | paid | refunded
      user_email?: string | null;
      user_name?: string | null;
      total?: number;
      currency?: string;
      order_number?: number;
      identifier?: string;
    };
  };
}
