// POST /api/admin/transfer — unbind a card from its device so it can be activated on a new machine.
// Body: { code: string, reason?: string }
// Auth: Bearer <ADMIN_TOKEN>

import type { Env } from "../../env.d";
import { ok, err, readJson } from "../../lib/http";
import { requireAdmin } from "../../lib/auth";

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  const authFail = requireAdmin(request, env);
  if (authFail) return authFail;

  const body = await readJson<{ code?: string; reason?: string }>(request);
  if (!body?.code) return err("bad_request", "code required");
  const code = body.code.trim().toUpperCase();

  // Reset to 'unused' state but KEEP duration/expiry semantics by also nulling them
  // — next activation re-binds and resets expiry from `now`.
  const r = await env.DB.prepare(
    `UPDATE cards
     SET status='unused', device_hash=NULL, install_secret=NULL,
         activated_at=NULL, expires_at=NULL,
         notes = COALESCE(notes,'') || ?
     WHERE code = ? AND status IN ('active','expired')`,
  )
    .bind(`\n[transfer @ ${new Date().toISOString()}] ${body.reason || ""}`, code)
    .run();

  if (!r.meta?.changes) return err("not_found", "card not active or not found", 404);
  return ok({ code, status: "unused", message: "Card unbound, ready for re-activation" });
};
