-- D1 schema: h540 becomes a pure DISTRIBUTION front (no card generation).
-- Cards are GENERATED on kk-license, then IMPORTED here as sellable inventory and
-- ALLOCATED to an order on successful payment. Activation/verification stays on
-- kk-license, so the device/secret/expiry columns are unused on this side.
--
-- card.status lifecycle here:  unused (in stock) -> sold (allocated to an order)
--                              revoked (pulled from sale)
--
-- Apply:
--   wrangler d1 migrations apply DB --local            (dev)
--   wrangler d1 migrations apply DB --remote --env production
--   (db:migrate:local / db:migrate:prod npm scripts run these)

ALTER TABLE cards ADD COLUMN sold_at INTEGER;            -- unix ms when allocated to an order
ALTER TABLE cards ADD COLUMN source  TEXT DEFAULT 'import'; -- 'import' (from kk-license) by default

CREATE INDEX IF NOT EXISTS idx_cards_tier_status ON cards(tier, status);
CREATE INDEX IF NOT EXISTS idx_cards_sold        ON cards(sold_at);
