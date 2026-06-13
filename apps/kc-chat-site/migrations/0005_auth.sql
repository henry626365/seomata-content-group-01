-- D1 schema: Google OAuth login (admin + customer accounts)
-- Apply:
--   wrangler d1 migrations apply DB --local
--   wrangler d1 migrations apply DB --remote --env production

-- App users created via Google Sign-In.
CREATE TABLE IF NOT EXISTS users (
  id            TEXT PRIMARY KEY,                 -- usr_<24hex>
  email         TEXT NOT NULL,                    -- lowercased Google email
  email_lower   TEXT NOT NULL,                    -- normalized for lookup (unique)
  name          TEXT,
  picture       TEXT,
  google_sub    TEXT,                             -- Google account subject id (stable)
  role          TEXT NOT NULL DEFAULT 'user',     -- 'user' | 'admin'
  created_at    INTEGER NOT NULL,                 -- unix ms
  last_login_at INTEGER                           -- unix ms
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_users_email_lower ON users(email_lower);
CREATE UNIQUE INDEX IF NOT EXISTS idx_users_google_sub  ON users(google_sub);

-- Opaque server-side sessions. Cookie holds the random token; we look it up here.
CREATE TABLE IF NOT EXISTS sessions (
  id            TEXT PRIMARY KEY,                 -- random 64-hex token (the cookie value)
  user_id       TEXT NOT NULL,
  created_at    INTEGER NOT NULL,                 -- unix ms
  expires_at    INTEGER NOT NULL,                 -- unix ms
  ip            TEXT,
  ua            TEXT
);

CREATE INDEX IF NOT EXISTS idx_sessions_user    ON sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_expires ON sessions(expires_at);
