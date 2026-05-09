-- D1 schema: Stripe Checkout → entitlement rows (buyer cookie session id + product slug)
-- Apply with: wrangler d1 migrations apply DB --remote  (and/or --local for dev)

CREATE TABLE IF NOT EXISTS entitlements (
	id INTEGER PRIMARY KEY AUTOINCREMENT,
	buyer_session_id TEXT NOT NULL,
	product_slug TEXT NOT NULL,
	stripe_checkout_session_id TEXT NOT NULL UNIQUE,
	customer_email TEXT,
	created_at INTEGER NOT NULL DEFAULT (unixepoch())
);

CREATE INDEX IF NOT EXISTS idx_entitlements_buyer_slug
	ON entitlements (buyer_session_id, product_slug);

-- Idempotent Stripe webhook processing (event id)
CREATE TABLE IF NOT EXISTS stripe_webhook_events (
	id TEXT PRIMARY KEY,
	received_at INTEGER NOT NULL DEFAULT (unixepoch())
);
