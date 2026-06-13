-- D1 schema: track card-key email delivery (idempotent send guard)
-- Apply:
--   wrangler d1 execute kc-cards-dev  --local  --file=./migrations/0003_orders_email.sql
--   wrangler d1 execute kc-cards-prod --remote --file=./migrations/0003_orders_email.sql

ALTER TABLE orders ADD COLUMN email_sent_at INTEGER;
