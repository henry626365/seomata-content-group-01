// POST /api/admin/revoke
// Body: { code: string }
// Marks card as revoked (cannot be activated again; existing tokens issued for it still work
// until expiry because we don't have a real server-side verify — that's by design of architecture A).

import type { Env } from "../../env.d";
import { ok, err, readJson } from "../../lib/http";
import { requireAdmin } from "../../lib/auth";

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  const authFail = await requireAdmin(request, env);
  if (authFail) return authFail;

  const body = await readJson<{ code?: string }>(request);
  if (!body?.code) return err("bad_request", "code required");
  const code = body.code.trim().toUpperCase();

  const r = await env.DB.prepare(`UPDATE cards SET status='revoked' WHERE code = ?`).bind(code).run();
  if (!r.meta?.changes) return err("not_found", "no card matched", 404);

  return ok({ code, status: "revoked" });
};
