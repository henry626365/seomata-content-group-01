// GET /api/account/orders
// Returns the logged-in user's orders (matched by their Google email), including
// the issued card-key for paid orders. Requires a valid session cookie.

import type { Env } from "../../env.d";
import { ok, err } from "../../lib/http";
import { getSessionUser } from "../../lib/session";

export const onRequestGet: PagesFunction<Env> = async ({ request, env }) => {
  const user = await getSessionUser(request, env);
  if (!user) return err("unauthorized", "login required", 401);

  const rs = await env.DB.prepare(
    `SELECT id, tier, status, card_code, amount_cents, currency, created_at, paid_at
     FROM orders
     WHERE lower(email) = ?
     ORDER BY created_at DESC
     LIMIT 200`,
  )
    .bind(user.email_lower)
    .all();

  return ok({ email: user.email, items: rs.results || [] });
};
