// POST /api/btc/pool/refill   (server → Worker; Bearer BTC_INGEST_SECRET)
//
// The wallet machine's fill_pool.php generates fresh addresses (getnewaddress) and
// pushes them here to top up the address pool. New rows land as 'free' and get
// claimed/bound to a user on their first recharge.
//
// Body: { addresses: string[] }   (deduped server-side; existing addresses ignored)

import type { Env } from "../../env.d";
import { ok, err, readJson } from "../../lib/http";
import { checkIngestAuth } from "../../lib/btc";

interface RefillBody {
  addresses?: unknown;
}

// Conservative base58 / bech32 address shape check (avoids junk rows; not a full validator).
const ADDR_RE = /^(bc1[a-z0-9]{6,87}|[13][a-km-zA-HJ-NP-Z1-9]{25,39})$/;

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  if (!checkIngestAuth(request, env)) return err("unauthorized", "bad ingest secret", 401);

  const body = await readJson<RefillBody>(request);
  if (!body || !Array.isArray(body.addresses)) return err("bad_request", "addresses[] required", 400);

  const seen = new Set<string>();
  const addrs: string[] = [];
  for (const raw of body.addresses) {
    const a = String(raw || "").trim();
    if (!a || seen.has(a)) continue;
    if (!ADDR_RE.test(a)) continue;
    seen.add(a);
    addrs.push(a);
    if (addrs.length >= 5000) break; // hard cap per call
  }

  if (addrs.length === 0) return err("bad_request", "no valid addresses", 400);

  const now = Date.now();
  const stmt = env.DB.prepare(
    "INSERT OR IGNORE INTO btc_address_pool (address, status, created_at) VALUES (?, 'free', ?)",
  );
  const batch = addrs.map((a) => stmt.bind(a, now));
  const results = await env.DB.batch(batch);

  let inserted = 0;
  for (const r of results) inserted += (r.meta?.changes ?? 0) > 0 ? 1 : 0;

  const free = await env.DB.prepare(
    "SELECT COUNT(*) AS n FROM btc_address_pool WHERE status='free'",
  ).first<{ n: number }>();

  return ok({ received: addrs.length, inserted, free: free?.n ?? 0 });
};
