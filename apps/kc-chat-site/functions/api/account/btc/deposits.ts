// GET /api/account/btc/deposits   (logged-in user)
//
// Returns the user's current credit balance plus their BTC deposit history
// (pending + credited), so the account page can show recharge progress.

import type { Env } from "../../../env.d";
import { ok, err } from "../../../lib/http";
import { getSessionUser } from "../../../lib/session";
import { creditCurrency } from "../../../lib/btc";

export const onRequestGet: PagesFunction<Env> = async ({ request, env }) => {
  const user = await getSessionUser(request, env);
  if (!user) return err("unauthorized", "login required", 401);

  const bal = await env.DB.prepare("SELECT credits_cents FROM users WHERE id = ?")
    .bind(user.id)
    .first<{ credits_cents: number }>();

  const rs = await env.DB.prepare(
    `SELECT id, txid, address, amount_sat, confirmations, status,
            rate_cents_per_btc, credited_cents, currency, first_seen_at, credited_at
     FROM btc_deposits
     WHERE user_id = ?
     ORDER BY first_seen_at DESC
     LIMIT 200`,
  )
    .bind(user.id)
    .all();

  return ok({
    balance_cents: bal?.credits_cents ?? 0,
    currency: creditCurrency(env),
    items: rs.results || [],
  });
};
