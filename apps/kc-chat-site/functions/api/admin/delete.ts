// POST /api/admin/delete
// Single:  { code: string, force?: boolean }
// Batch:   { codes: string[] | string, force?: boolean }   // string = newline/comma/space separated
// ByStatus:{ status: "unused"|"sold"|"revoked", force?: boolean }  // delete ALL cards of one status (across pages)
// Permanently removes card-key row(s) from the cards table.
//
// Safety: a `sold` card is linked to a paid order (orders.card_code), so deleting
// it would orphan that reference. Sold cards are NOT deleted unless { force: true }.
//   - Single mode:   sold without force → 409 sold_card.
//   - Batch mode:    sold without force → skipped (reported in skipped_sold), others deleted.
//   - ByStatus mode: status="sold" requires force=true, else 409 sold_card.
// unused / revoked cards delete freely.
// Auth: Authorization: Bearer <ADMIN_TOKEN>

import type { Env } from "../../env.d";
import { ok, err, readJson } from "../../lib/http";
import { requireAdmin } from "../../lib/auth";

function parseCodes(input: unknown): string[] {
  const raw = Array.isArray(input)
    ? input.map((c) => String(c))
    : typeof input === "string"
      ? input.split(/[\s,;]+/)
      : [];
  const seen = new Set<string>();
  const out: string[] = [];
  for (const r of raw) {
    const code = String(r ?? "").trim().toUpperCase();
    if (!code || seen.has(code)) continue;
    seen.add(code);
    out.push(code);
  }
  return out;
}

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  const authFail = await requireAdmin(request, env);
  if (authFail) return authFail;

  const body = await readJson<{ code?: string; codes?: unknown; status?: string; force?: boolean }>(request);
  if (!body) return err("bad_request", "JSON body required");

  const force = body.force === true;
  const statusMode = body.status !== undefined;
  const batchMode = body.codes !== undefined;

  // ---- ByStatus mode: delete every card matching one status (across all pages) ----
  if (statusMode) {
    const status = String(body.status).trim().toLowerCase();
    const allowed = ["unused", "sold", "revoked"];
    if (!allowed.includes(status)) {
      return err("bad_status", `status must be one of: ${allowed.join(", ")}`);
    }
    if (status === "sold" && !force) {
      return err(
        "sold_card",
        "deleting sold cards (linked to orders) requires force=true",
        409,
      );
    }
    const r = await env.DB.prepare(`DELETE FROM cards WHERE status = ?`).bind(status).run();
    return ok({ status, deleted: r.meta?.changes ?? 0 });
  }

  // ---- Single mode (back-compat) ----
  if (!batchMode) {
    if (!body.code) return err("bad_request", "code or codes required");
    const code = body.code.trim().toUpperCase();

    const card = await env.DB.prepare(`SELECT status FROM cards WHERE code = ?`)
      .bind(code)
      .first<{ status: string }>();
    if (!card) return err("not_found", "no card matched", 404);

    if (card.status === "sold" && !force) {
      return err(
        "sold_card",
        "card is sold and linked to an order; pass force=true to delete anyway",
        409,
      );
    }

    const r = await env.DB.prepare(`DELETE FROM cards WHERE code = ?`).bind(code).run();
    if (!r.meta?.changes) return err("not_found", "no card matched", 404);

    return ok({ code, deleted: true, previous_status: card.status });
  }

  // ---- Batch mode ----
  const codes = parseCodes(body.codes);
  if (codes.length === 0) return err("no_codes", "codes required (array or separated string)");
  if (codes.length > 5000) return err("too_many", "too many codes in one request (max 5000)", 400);

  const deleted: string[] = [];
  const skippedSold: string[] = [];
  const notFound: string[] = [];

  for (const code of codes) {
    const card = await env.DB.prepare(`SELECT status FROM cards WHERE code = ?`)
      .bind(code)
      .first<{ status: string }>();
    if (!card) {
      notFound.push(code);
      continue;
    }
    if (card.status === "sold" && !force) {
      skippedSold.push(code);
      continue;
    }
    const r = await env.DB.prepare(`DELETE FROM cards WHERE code = ?`).bind(code).run();
    if (r.meta?.changes) deleted.push(code);
    else notFound.push(code);
  }

  return ok({
    requested: codes.length,
    deleted: deleted.length,
    deleted_codes: deleted,
    skipped_sold: skippedSold,
    not_found: notFound,
  });
};
