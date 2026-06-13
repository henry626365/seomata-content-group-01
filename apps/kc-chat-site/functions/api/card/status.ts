// POST /api/card/status — query a card's current state (no device binding).
//
// Body: { code: string }
// Returns: { ok, status, tier, tier_label, generated_at, activated_at?, expires_at?, days_left? }

import type { Env } from "../../env.d";
import { ok, err, readJson } from "../../lib/http";
import { getCard, TIERS } from "../../lib/cards";

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  const body = await readJson<{ code?: string }>(request);
  if (!body?.code) return err("bad_request", "code required");
  const code = body.code.trim().toUpperCase();

  const card = await getCard(env, code);
  if (!card) return err("bad_code", "Card not found", 404);

  const now = Date.now();
  let derivedStatus = card.status;
  if (derivedStatus === "active" && card.expires_at && card.expires_at < now) {
    derivedStatus = "expired";
  }

  const out: Record<string, unknown> = {
    status: derivedStatus,
    tier: card.tier,
    tier_label: TIERS[card.tier]?.label || card.tier,
    tier_cn: TIERS[card.tier]?.cnLabel || card.tier,
    duration_days: card.duration_days,
    generated_at: card.generated_at,
  };
  if (card.activated_at) out.activated_at = card.activated_at;
  if (card.expires_at) {
    out.expires_at = card.expires_at;
    out.days_left = Math.max(0, Math.ceil((card.expires_at - now) / (86400 * 1000)));
  }
  if (card.device_hash) out.device_hint = card.device_hash.slice(0, 4) + "…" + card.device_hash.slice(-2);
  return ok(out);
};

export const onRequestOptions: PagesFunction<Env> = () =>
  new Response(null, {
    status: 204,
    headers: {
      "access-control-allow-origin": "*",
      "access-control-allow-methods": "POST, OPTIONS",
      "access-control-allow-headers": "content-type",
    },
  });
