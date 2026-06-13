// POST /api/admin/import
// Body: { tier: "day"|"month"|"year"|"lifetime"|"lite", codes: string[] | string, notes?: string, batchId?: string }
//   - `codes` may be an array, or a single string with codes separated by
//     newlines / commas / spaces (admin can paste a block straight from kk-license).
// Auth: Authorization: Bearer <ADMIN_TOKEN>
//
// h540 NEVER generates card codes — it only imports codes generated on
// kk-license as sellable inventory. Existing codes are skipped (idempotent).

import type { Env } from "../../env.d";
import { ok, err, readJson } from "../../lib/http";
import { requireAdmin } from "../../lib/auth";
import { importCards, TIERS, isValidTier } from "../../lib/cards";

function parseCodes(input: unknown): string[] {
  if (Array.isArray(input)) return input.map((c) => String(c));
  if (typeof input === "string") return input.split(/[\s,;]+/);
  return [];
}

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  const authFail = await requireAdmin(request, env);
  if (authFail) return authFail;

  const body = await readJson<{ tier?: string; codes?: unknown; notes?: string; batchId?: string }>(request);
  if (!body) return err("bad_request", "JSON body required");
  if (!body.tier || !isValidTier(body.tier)) {
    return err("bad_tier", `tier must be one of: ${Object.keys(TIERS).join(", ")}`);
  }

  const codes = parseCodes(body.codes);
  if (codes.length === 0) return err("no_codes", "codes required (array or separated string)");

  try {
    const r = await importCards(env, { tier: body.tier, codes, notes: body.notes, batchId: body.batchId });
    return ok({
      tier: r.tier,
      tier_label: TIERS[r.tier]?.label || r.tier,
      imported: r.imported,
      duplicates: r.duplicates,
      invalid: r.invalid,
      batch_id: r.batchId,
    });
  } catch (e) {
    return err("import_failed", (e as Error).message, 500);
  }
};
