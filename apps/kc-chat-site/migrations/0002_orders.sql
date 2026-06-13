-- D1 schema: paid orders → auto card-key issuance (Lemon Squeezy Checkout)
-- Apply:
--   wrangler d1 execute kc-cards-dev  --local  --file=./migrations/0002_orders.sql
--   wrangler d1 execute kc-cards-prod --remote --file=./migrations/0002_orders.sql

CREATE TABLE IF NOT EXISTS orders (
  id            TEXT PRIMARY KEY,                 -- ord_<24hex>  (also acts as the claim secret)
  provider      TEXT NOT NULL DEFAULT 'lemonsqueezy',
  provider_ref  TEXT,                             -- LS checkout id
  tier          TEXT NOT NULL,                    -- month / year / lifetime
  amount_cents  INTEGER NOT NULL,                 -- server-derived from TIERS
  currency      TEXT NOT NULL DEFAULT 'usd',
  email         TEXT,
  status        TEXT NOT NULL DEFAULT 'pending',  -- pending / paid / refunded / failed
  card_code     TEXT,                             -- the card issued on successful payment
  created_at    INTEGER NOT NULL,                 -- unix ms
  paid_at       INTEGER,                          -- unix ms
  ip            TEXT,
  ua            TEXT
);

-- NULLs are distinct in SQLite, so multiple pending orders (provider_ref NULL) don't collide;
-- once set to an LS checkout id, the ref is unique (webhook idempotency aid).
CREATE UNIQUE INDEX IF NOT EXISTS idx_orders_provider_ref ON orders(provider_ref);
CREATE INDEX IF NOT EXISTS idx_orders_status  ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_created ON orders(created_at);
CREATE INDEX IF NOT EXISTS idx_orders_card    ON orders(card_code);
