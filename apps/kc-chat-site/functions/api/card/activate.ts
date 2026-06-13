// POST /api/card/activate
//
// Body: { code: string, device_hash: string }
//
// Flow:
//   - if card unused             → bind device, issue token, mark active
//   - if card active + same dh   → re-issue token (idempotent re-activation)
//   - if card active + other dh  → 409 device_mismatch
//   - if card revoked / expired  → 410 / 410
//   - if code unknown            → 404 bad_code
//
// Returns: { ok, token, install_secret, dh, ia, ea, tier }

import type { Env } from "../../env.d";
import { json, ok, err, readJson, clientIp, clientUa } from "../../lib/http";
import { getCard, TIERS } from "../../lib/cards";
import { forgeToken, randomHex } from "../../lib/signing";

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  const body = await readJson<{ code?: string; device_hash?: string }>(request);
  if (!body || !body.code || !body.device_hash) {
    return err("bad_request", "code + device_hash required");
  }
  const code = body.code.trim().toUpperCase();
  const dh = body.device_hash.trim().toLowerCase();
  if (!/^[0-9a-f]{16}$/.test(dh)) return err("bad_dh", "device_hash must be 16 hex chars");

  const ip = clientIp(request);
  const ua = clientUa(request);

  const card = await getCard(env, code);
  if (!card) {
    await logActivation(env, { code, dh, ip, ua, result: "bad_code" });
    return err("bad_code", "Card code not found", 404);
  }
  if (card.status === "revoked") {
    await logActivation(env, { code, dh, ip, ua, result: "revoked" });
    return err("revoked", "This card has been revoked", 410);
  }
  if (card.status === "expired" || (card.expires_at && card.expires_at < Date.now())) {
    await logActivation(env, { code, dh, ip, ua, result: "expired" });
    return err("expired", "This card has expired", 410);
  }

  const now = Date.now();
  let installSecret: string;
  let activated_at: number;
  let expires_at: number;

  if (card.status === "unused") {
    // First activation: generate secret, bind device, set expiration
    installSecret = randomHex(32);
    activated_at = now;
    expires_at = now + card.duration_days * 86400 * 1000;
    await env.DB.prepare(
      `UPDATE cards SET status='active', device_hash=?, install_secret=?, activated_at=?, expires_at=?
       WHERE code=? AND status='unused'`,
    )
      .bind(dh, installSecret, activated_at, expires_at, code)
      .run();
  } else {
    // already active
    if (card.device_hash && card.device_hash !== dh) {
      await logActivation(env, { code, dh, ip, ua, result: "device_mismatch" });
      return err(
        "device_mismatch",
        "Card already bound to a different device. Contact support to transfer.",
        409,
        { bound_to: card.device_hash.slice(0, 6) + "…" },
      );
    }
    installSecret = card.install_secret!;
    activated_at = card.activated_at!;
    expires_at = card.expires_at!;
  }

  const tok = await forgeToken({ dh, installSecret, issuedAt: activated_at, expiresAt: expires_at });

  await logActivation(env, { code, dh, ip, ua, result: "ok", message: "issued" });

  return ok({
    token: tok.token,
    install_secret: installSecret,
    dh,
    ia: activated_at,
    ea: expires_at,
    tier: card.tier,
    tier_label: TIERS[card.tier]?.label || card.tier,
    tier_cn: TIERS[card.tier]?.cnLabel || card.tier,
    tier_price_usd: TIERS[card.tier]?.priceUsd ?? null,
  });
};

// CORS preflight for browser-based activators
export const onRequestOptions: PagesFunction<Env> = () =>
  new Response(null, {
    status: 204,
    headers: {
      "access-control-allow-origin": "*",
      "access-control-allow-methods": "POST, OPTIONS",
      "access-control-allow-headers": "content-type",
      "access-control-max-age": "86400",
    },
  });

async function logActivation(
  env: Env,
  row: { code?: string; dh: string; ip: string; ua: string; result: string; message?: string },
) {
  try {
    await env.DB.prepare(
      `INSERT INTO activations (card_code, device_hash, ip, ua, result, message, at) VALUES (?,?,?,?,?,?,?)`,
    )
      .bind(row.code || null, row.dh, row.ip, row.ua, row.result, row.message || null, Date.now())
      .run();
  } catch (e) {
    console.error("[activation log] insert failed:", (e as Error).message);
  }
}
