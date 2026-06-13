-- D1 schema for KC Chat Panel card-key MVP
-- Drizzle / wrangler-compatible

CREATE TABLE IF NOT EXISTS cards (
  code            TEXT PRIMARY KEY,                 -- KC-XXXX-XXXX-XXXX
  tier            TEXT NOT NULL,                    -- m30 / m90 / y1 / lifetime
  duration_days   INTEGER NOT NULL,                 -- 30 / 90 / 365 / 36500
  status          TEXT NOT NULL DEFAULT 'unused',   -- unused / active / revoked / expired
  generated_at    INTEGER NOT NULL,                 -- unix ms
  activated_at    INTEGER,                          -- unix ms when first bound
  expires_at      INTEGER,                          -- activated_at + duration*86400e3
  device_hash     TEXT,                             -- 16-char hex from client A6()
  install_secret  TEXT,                             -- 64-char hex issued at first activation
  notes           TEXT,
  batch_id        TEXT                              -- for grouping bulk-generated
);

CREATE INDEX IF NOT EXISTS idx_cards_status  ON cards(status);
CREATE INDEX IF NOT EXISTS idx_cards_device  ON cards(device_hash);
CREATE INDEX IF NOT EXISTS idx_cards_batch   ON cards(batch_id);
CREATE INDEX IF NOT EXISTS idx_cards_expires ON cards(expires_at);

-- Audit log: every activation attempt (success or failure)
CREATE TABLE IF NOT EXISTS activations (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  card_code     TEXT,                               -- nullable: bad codes are logged too
  device_hash   TEXT,
  ip            TEXT,
  ua            TEXT,
  result        TEXT NOT NULL,                      -- ok / bad_code / used / revoked / device_mismatch / expired
  message       TEXT,
  at            INTEGER NOT NULL                    -- unix ms
);

CREATE INDEX IF NOT EXISTS idx_act_card   ON activations(card_code);
CREATE INDEX IF NOT EXISTS idx_act_device ON activations(device_hash);
CREATE INDEX IF NOT EXISTS idx_act_at     ON activations(at);

-- Heartbeat / verify pings (optional, for telemetry)
CREATE TABLE IF NOT EXISTS heartbeats (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  card_code     TEXT,
  device_hash   TEXT,
  ip            TEXT,
  at            INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_hb_card ON heartbeats(card_code);
CREATE INDEX IF NOT EXISTS idx_hb_at   ON heartbeats(at);
