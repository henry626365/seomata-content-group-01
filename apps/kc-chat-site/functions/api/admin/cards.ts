// GET /api/admin/cards?status=unused|active|revoked|expired&limit=100&offset=0&batch=...
// Auth: Bearer <ADMIN_TOKEN>

import type { Env } from "../../env.d";
import { ok, err } from "../../lib/http";
import { requireAdmin } from "../../lib/auth";

export const onRequestGet: PagesFunction<Env> = async ({ request, env }) => {
  const authFail = requireAdmin(request, env);
  if (authFail) return authFail;

  const url = new URL(request.url);
  const status = url.searchParams.get("status");
  const batch = url.searchParams.get("batch");
  const limit = Math.min(parseInt(url.searchParams.get("limit") || "100", 10) || 100, 1000);
  const offset = Math.max(parseInt(url.searchParams.get("offset") || "0", 10) || 0, 0);

  const where: string[] = [];
  const binds: (string | number)[] = [];
  if (status) {
    where.push("status = ?");
    binds.push(status);
  }
  if (batch) {
    where.push("batch_id = ?");
    binds.push(batch);
  }
  const whereSql = where.length ? `WHERE ${where.join(" AND ")}` : "";

  const totalRow = await env.DB.prepare(`SELECT COUNT(*) AS n FROM cards ${whereSql}`)
    .bind(...binds)
    .first<{ n: number }>();

  const rs = await env.DB.prepare(
    `SELECT code, tier, duration_days, status, generated_at, activated_at, expires_at,
            device_hash, notes, batch_id
     FROM cards ${whereSql}
     ORDER BY generated_at DESC
     LIMIT ? OFFSET ?`,
  )
    .bind(...binds, limit, offset)
    .all();

  const stats = await env.DB.prepare(
    `SELECT status, COUNT(*) AS n FROM cards GROUP BY status`,
  ).all<{ status: string; n: number }>();

  return ok({
    total: totalRow?.n || 0,
    limit,
    offset,
    items: rs.results || [],
    stats: Object.fromEntries((stats.results || []).map((s) => [s.status, s.n])),
  });
};
