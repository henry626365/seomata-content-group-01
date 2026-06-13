// POST /api/admin/generate
// Body: { tier: "day"|"month"|"year"|"lifetime"|"lite", count: 1..1000, notes?: string, batchId?: string }
// Auth: Authorization: Bearer <ADMIN_TOKEN>

import type { Env } from "../../env.d";
import { ok, err, readJson } from "../../lib/http";
import { requireAdmin } from "../../lib/auth";
import { generateBatch, TIERS, isValidTier } from "../../lib/cards";

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  const authFail = requireAdmin(request, env);
  if (authFail) return authFail;

  const body = await readJson<{ tier?: string; count?: number; notes?: string; batchId?: string }>(request);
  if (!body) return err("bad_request", "JSON body required");
  if (!body.tier || !isValidTier(body.tier)) {
    return err("bad_tier", `tier must be one of: ${Object.keys(TIERS).join(", ")}`);
  }
  const count = Math.floor(body.count || 0);
  if (!(count >= 1 && count <= 1000)) return err("bad_count", "count must be 1..1000");

  try {
    const rows = await generateBatch(env, { tier: body.tier, count, notes: body.notes, batchId: body.batchId });
    const tierResolved = rows[0]?.tier || body.tier;
    return ok({
      count: rows.length,
      tier: tierResolved,
      tier_label: TIERS[tierResolved]?.label || tierResolved,
      tier_cn:    TIERS[tierResolved]?.cnLabel || tierResolved,
      batch_id: rows[0]?.batch_id,
      codes: rows.map((r) => r.code),
    });
  } catch (e) {
    return err("gen_failed", (e as Error).message, 500);
  }
};
