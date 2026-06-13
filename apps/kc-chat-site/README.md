# KC Chat Site — Cards MVP

Astro marketing site + Cloudflare Pages Functions backend for the KC Chat Panel **card-key MVP**
(Architecture A: distribute a pre-patched extension, this server only issues tokens).

## Quick start (local)

```bash
# from monorepo root
pnpm install                                # installs astro / wrangler / etc.

cd apps/kc-chat-site

# 1. Set admin token (FIRST — needed for /admin/*)
cp .dev.vars.example .dev.vars
# Edit .dev.vars: paste a random hex string into ADMIN_TOKEN=

# 2. Apply schema FIRST (must come BEFORE `pnpm dev` on the very first run,
#    otherwise miniflare allocates a different SQLite hash for the binding).
#    If you ever get "no such table: cards", do:
#      rm -rf .wrangler/state && pnpm db:migrate:local && pnpm dev
pnpm db:migrate:local

# 3. Start dev server (builds Astro then runs wrangler pages dev)
pnpm dev
# → http://localhost:4322/activate
# → http://localhost:4322/admin
```

> **Note for Windows / wrangler 4.90+:** `wrangler pages dev` cannot run a proxy
> command together with `--d1` bindings; that's why we `astro build` once and serve
> the built `dist/` (no HMR for Astro pages). For Astro hot-reload during page
> editing, run `pnpm dev:astro` in a second terminal — but API calls then bypass
> the D1 binding.

Open:
- `http://localhost:4322/activate` — customer activation page
- `http://localhost:4322/admin`    — admin dashboard (paste ADMIN_TOKEN to log in)

## Endpoints

### Public

| Endpoint | Body | Returns |
|---|---|---|
| `POST /api/card/activate` | `{ code, device_hash }` | `{ token, install_secret, dh, ia, ea, tier }` |
| `POST /api/card/status`   | `{ code }` | `{ status, tier, days_left, … }` |
| `GET  /api/health`        | — | liveness |

### Admin (require `Authorization: Bearer $ADMIN_TOKEN`)

| Endpoint | Body | Use |
|---|---|---|
| `POST /api/admin/generate` | `{ tier, count, notes? }` | bulk-issue cards |
| `GET  /api/admin/cards`    | query: `status`, `batch`, `limit`, `offset` | list/filter |
| `POST /api/admin/revoke`   | `{ code }` | revoke a card |
| `POST /api/admin/transfer` | `{ code, reason? }` | unbind a card for re-activation on new device |

### Tiers (3 only)

| `tier`     | duration   | cnLabel | label    |
|------------|------------|---------|----------|
| `month`    | 30 days    | 月卡     | Monthly  |
| `year`     | 365 days   | 年卡     | Yearly   |
| `lifetime` | 36500 days | 终身     | Lifetime |

Legacy aliases (still accepted on `POST /api/admin/generate` so old code paths keep working):
`m30` / `m90` → `month`, `y1` → `year`.

## Token shape

```jsonc
// base64url( JSON.stringify(...) )
{
  "dh":   "bd40c926370d9072",  // device hash from extension's A6()
  "ia":   1780000000000,       // issued-at (ms)
  "ea":   4933000000000,       // expires-at (ms)
  "sig":  "<64 hex>",          // server signature (random; client only checks shape)
  "csig": "<64 hex>"           // HMAC-SHA256(install_secret_bytes, `${dh}|${ia}|${ea}`)
}
```

This matches the reverse-engineered structure in `D:\wwwroot\massage\forge-token.js`.
Customer pastes the issued `token` into the patched extension; extension verifies `csig` against
its locally stored `install_secret` (which we returned together with the token at activation time).

## Production deploy

```bash
# 1. Create prod D1
pnpm wrangler d1 create kc-cards-prod
# Update wrangler.toml [env.production.d1_databases] with the printed id

# 2. Set ADMIN_TOKEN as a secret
pnpm wrangler pages secret put ADMIN_TOKEN --project-name kcchat-site

# 3. Run migrations
pnpm db:migrate:prod

# 4. Deploy
pnpm deploy
```

## Operations cheat-sheet

```bash
# Generate 50 yearly cards via CLI
curl -X POST https://<your-domain>/api/admin/generate \
  -H "authorization: Bearer $ADMIN_TOKEN" \
  -H "content-type: application/json" \
  -d '{"tier":"y1","count":50,"notes":"may-promo"}'

# List active cards
curl 'https://<your-domain>/api/admin/cards?status=active' \
  -H "authorization: Bearer $ADMIN_TOKEN"

# Customer-side activation (browser console example)
fetch('/api/card/activate', {
  method: 'POST',
  headers: {'content-type': 'application/json'},
  body: JSON.stringify({code: 'KC-XXXX-XXXX-XXXX', device_hash: 'bd40c926370d9072'}),
}).then(r => r.json()).then(console.log);
```

## What this does NOT include (intentional)

- **Payment processing** — handled by Lemon Squeezy (Merchant of Record).
  `/api/checkout/create` opens an LS hosted checkout; the `order_created` webhook at
  `/api/checkout/webhook` verifies `X-Signature` and auto-issues a card-key. See
  `functions/lib/lemonsqueezy.ts` and the secret list in `wrangler.toml`.
- **No periodic verify** — Architecture A patches the extension's defense matrix, so the
  extension never calls back after activation. Revoking a card only stops *new* activations
  on it; tokens already issued remain valid until expiry.
- **No email signup** — cards are anonymous bearer credentials by design.

For full server-mock (Architecture B) you'd need to additionally implement
`/api/license/verify`, `/api/license/heartbeat` (with double HMAC), `/kc-auth/heartbeat`,
and ensure all 9 defense matrices pass. Not recommended for MVP.

## Files

```
apps/kc-chat-site/
├── migrations/0001_cards.sql        — D1 schema (cards, activations, heartbeats)
├── wrangler.toml                    — D1 binding, env, deploy config
├── .dev.vars.example                — local-only secrets template
├── functions/
│   ├── env.d.ts                     — PagesFunction<Env> typings
│   ├── lib/
│   │   ├── http.ts                  — json/ok/err/readJson helpers
│   │   ├── auth.ts                  — Bearer-token admin guard
│   │   ├── signing.ts               — forgeToken() in Web Crypto
│   │   └── cards.ts                 — card code gen + tier defs
│   └── api/
│       ├── health.ts
│       ├── card/{activate,status}.ts
│       └── admin/{generate,cards,revoke,transfer}.ts
└── src/pages/
    ├── activate.astro               — customer self-service page
    └── admin/index.astro            — single-page card dashboard
```
