// POST /api/account/btc/recharge   (logged-in user)
//
// Returns the user's permanent BTC deposit address (claiming a free one from the
// pool on first use), plus the current BTC price so the UI can show "send ≈ X BTC
// for $Y". One user ↔ one address (reused across deposits).

import type { Env } from "../../../env.d";
import { ok, err } from "../../../lib/http";
import { getSessionUser } from "../../../lib/session";
import { fetchBtcRateCents, creditCurrency, minConfirmations } from "../../../lib/btc";

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  const user = await getSessionUser(request, env);
  if (!user) return err("unauthorized", "login required", 401);

  // Already has an assigned address? Reuse it.
  const existing = await env.DB.prepare(
    "SELECT address FROM btc_address_pool WHERE user_id = ? AND status = 'assigned'",
  )
    .bind(user.id)
    .first<{ address: string }>();

  let address = existing?.address || "";

  if (!address) {
    const now = Date.now();
    // Atomically claim the oldest free address (D1 serializes writes).
    for (let attempt = 0; attempt < 3 && !address; attempt++) {
      const claimed = await env.DB.prepare(
        `UPDATE btc_address_pool
            SET status='assigned', user_id=?, assigned_at=?
          WHERE address = (
            SELECT address FROM btc_address_pool WHERE status='free' ORDER BY created_at ASC LIMIT 1
          )
        RETURNING address`,
      )
        .bind(user.id, now)
        .first<{ address: string }>();

      if (claimed?.address) {
        address = claimed.address;
        break;
      }

      // No free address claimed — either the pool is empty, or a concurrent
      // request bound one to us. Re-check our own assignment before giving up.
      const mine = await env.DB.prepare(
        "SELECT address FROM btc_address_pool WHERE user_id = ? AND status = 'assigned'",
      )
        .bind(user.id)
        .first<{ address: string }>();
      if (mine?.address) {
        address = mine.address;
        break;
      }
      // Truly empty pool.
      const free = await env.DB.prepare(
        "SELECT COUNT(*) AS n FROM btc_address_pool WHERE status='free'",
      ).first<{ n: number }>();
      if ((free?.n ?? 0) === 0) {
        return err("pool_empty", "no deposit address available, please try again later", 503);
      }
    }
  }

  if (!address) return err("pool_empty", "no deposit address available, please try again later", 503);

  const rate = await fetchBtcRateCents(env);

  return ok({
    address,
    currency: creditCurrency(env),
    rate_cents_per_btc: rate, // 0 if rate source is temporarily unavailable
    min_confirmations: minConfirmations(env),
  });
};
