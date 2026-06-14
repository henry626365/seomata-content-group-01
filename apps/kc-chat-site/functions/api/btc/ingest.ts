// POST /api/btc/ingest   (server → Worker; Bearer BTC_INGEST_SECRET)
//
// Called by the wallet machine's detect.php for every `receive` transaction it
// finds via bitcoind `listtransactions`. We record/refresh the deposit and, once
// the confirmation threshold is met, credit the owning user exactly once.
//
// Body: { address, txid, amount_sat, confirmations, time? }
//   amount_sat   : integer satoshi (the PHP side converts from BTC)
//   confirmations: integer (updates over time as blocks arrive)
//
// Idempotent: deposits are keyed by (txid, address); crediting flips status
// pending→credited atomically, so repeated pushes never double-credit.

import type { Env } from "../../env.d";
import { ok, err, readJson } from "../../lib/http";
import {
  checkIngestAuth,
  minConfirmations,
  creditCurrency,
  fetchBtcRateCents,
  satToCents,
  applyCredit,
} from "../../lib/btc";
import { randomHex } from "../../lib/signing";

interface IngestBody {
  address?: string;
  txid?: string;
  amount_sat?: number | string;
  confirmations?: number | string;
  time?: number | string;
}

interface DepositRow {
  id: string;
  user_id: string | null;
  status: string;
  amount_sat: number;
}

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  if (!checkIngestAuth(request, env)) return err("unauthorized", "bad ingest secret", 401);

  const body = await readJson<IngestBody>(request);
  if (!body) return err("bad_request", "json body required", 400);

  const address = String(body.address || "").trim();
  const txid = String(body.txid || "").trim();
  const amountSat = Math.trunc(Number(body.amount_sat));
  const confirmations = Math.max(0, Math.trunc(Number(body.confirmations)));

  if (!address || !txid) return err("bad_request", "address and txid required", 400);
  if (!Number.isFinite(amountSat) || amountSat <= 0) return err("bad_request", "amount_sat must be > 0", 400);
  if (!/^[0-9a-fA-F]{64}$/.test(txid)) return err("bad_request", "txid must be 64 hex chars", 400);

  const now = Date.now();
  const currency = creditCurrency(env);

  // Resolve the owning user from the address pool (NULL = address we don't know).
  const pool = await env.DB.prepare(
    "SELECT user_id FROM btc_address_pool WHERE address = ? AND status = 'assigned'",
  )
    .bind(address)
    .first<{ user_id: string | null }>();
  const userId = pool?.user_id || null;

  // Upsert the deposit row (unique on txid+address). INSERT first; if it already
  // exists, refresh confirmations/amount/user_id while preserving terminal status.
  const depId = "dep_" + randomHex(12);
  await env.DB.prepare(
    `INSERT INTO btc_deposits
       (id, txid, address, user_id, amount_sat, confirmations, status, currency, first_seen_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
     ON CONFLICT(txid, address) DO UPDATE SET
       confirmations = excluded.confirmations,
       amount_sat    = excluded.amount_sat,
       user_id       = COALESCE(btc_deposits.user_id, excluded.user_id),
       updated_at    = excluded.updated_at`,
  )
    .bind(
      depId,
      txid,
      address,
      userId,
      amountSat,
      confirmations,
      userId ? "pending" : "ignored",
      currency,
      now,
      now,
    )
    .run();

  const dep = await env.DB.prepare(
    "SELECT id, user_id, status, amount_sat FROM btc_deposits WHERE txid = ? AND address = ?",
  )
    .bind(txid, address)
    .first<DepositRow>();

  if (!dep) return err("server_error", "deposit upsert failed", 500);

  // Unknown address or already credited → nothing more to do (idempotent).
  if (!dep.user_id) return ok({ recorded: true, credited: false, reason: "unknown_address" });
  if (dep.status === "credited") return ok({ recorded: true, credited: false, reason: "already_credited" });

  // Not enough confirmations yet → stay pending; detect.php will push again later.
  if (confirmations < minConfirmations(env)) {
    return ok({ recorded: true, credited: false, reason: "awaiting_confirmations", confirmations });
  }

  // Lock today's rate; if unavailable, leave pending and retry on the next push.
  const rate = await fetchBtcRateCents(env);
  if (rate <= 0) return ok({ recorded: true, credited: false, reason: "rate_unavailable" });

  const creditedCents = satToCents(dep.amount_sat, rate);

  // Atomic gate: only the caller that flips pending→credited proceeds to add funds.
  const flip = await env.DB.prepare(
    `UPDATE btc_deposits
        SET status='credited', credited_at=?, rate_cents_per_btc=?, credited_cents=?, updated_at=?
      WHERE id=? AND status='pending'`,
  )
    .bind(now, rate, creditedCents, now, dep.id)
    .run();

  if ((flip.meta?.changes ?? 0) === 0) {
    return ok({ recorded: true, credited: false, reason: "race_lost_or_credited" });
  }

  const res = await applyCredit(env, dep.user_id, creditedCents, "btc_deposit", dep.id);

  return ok({
    recorded: true,
    credited: true,
    deposit_id: dep.id,
    credited_cents: creditedCents,
    rate_cents_per_btc: rate,
    balance_cents: res.balanceCents,
  });
};
