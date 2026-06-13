# KC Chat Site — card-key distribution front (h540.com)

Astro marketing site + a single Cloudflare Worker backend.

**Role:** h540.com is a **pure distribution front**. It does **not** generate or
activate card-keys. Card-keys are generated on the separate **kk-license** service
(which also handles KC-plugin activation/verification). h540:

1. **Imports** kk-license card-keys as sellable inventory (admin).
2. **Sells** them via Lemon Squeezy (Merchant of Record) checkout.
3. **Delivers** a card on successful payment (allocates one from stock → success
   page + email). Activation then happens **inside the KC Chat plugin**.

```
kk-license (generate + activate)  ──import──▶  h540 (sell + deliver)  ──▶  buyer
                ▲                                                            │
                └───────────────── buyer activates in plugin ◀──────────────┘
```

## Quick start (local)

```bash
# from monorepo root
pnpm install

cd apps/kc-chat-site

# 1. Set admin token (FIRST — needed for /admin/*). Must be >= 16 chars.
cp .dev.vars.example .dev.vars
# Edit .dev.vars: paste a random hex string into ADMIN_TOKEN=

# 2. Apply schema FIRST (before the first `pnpm dev`).
#    If you ever get "no such table: cards":
#      rm -rf .wrangler/state && pnpm db:migrate:local && pnpm dev
pnpm db:migrate:local

# 3. Start dev server (astro build + wrangler dev)
pnpm dev
# → http://localhost:4322/admin     (paste ADMIN_TOKEN, import stock)
# → http://localhost:4322/pricing
```

## Endpoints

### Public

| Endpoint | Body | Returns |
|---|---|---|
| `POST /api/checkout/create` | `{ tier, email? }` | `{ ok, order_id, url }` — redirect to LS checkout |
| `POST /api/checkout/webhook` | LS `order_created` (signed) | allocates + delivers a card |
| `GET  /api/order/status` | query: `order` | `{ status, tier, card_code? }` (success page polls this) |
| `GET  /api/health` | — | liveness |

> There are **no `/api/card/*` activation endpoints** here — activation/verification
> lives on kk-license; the buyer pastes the code into the KC Chat plugin.

### Admin (require `Authorization: Bearer $ADMIN_TOKEN`)

| Endpoint | Body | Use |
|---|---|---|
| `POST /api/admin/import` | `{ tier, codes[]\|string, notes? }` | import kk-license codes as stock (idempotent) |
| `GET  /api/admin/cards`  | query: `status`, `batch`, `limit`, `offset` | list/filter inventory |
| `POST /api/admin/revoke` | `{ code }` | pull an unsold card from sale |

### Tiers

| `tier`     | duration   | priceUsd | cnLabel    | label    |
|------------|------------|----------|------------|----------|
| `day`      | 1 day*     | 5        | 日卡        | Day Pass |
| `month`    | 30 days    | 98       | 月卡        | Monthly  |
| `year`     | 365 days   | 198      | 年卡        | Yearly   |
| `lifetime` | 36500 days | 298      | 终身        | Lifetime |
| `lite`     | 30 days    | 10       | 轻享月卡    | Lite     |

\* `day` = expires 24 h after activation (trial). `priceUsd` is for display/records
only — the charged amount lives on the Lemon Squeezy variant.

Card `status` lifecycle on h540: `unused` (in stock) → `sold` (allocated to a paid
order) · `revoked` (pulled from sale).

## Production deploy

```bash
cd apps/kc-chat-site

# 1. Prod D1 id is already in wrangler.toml ([env.production.d1_databases]).
# 2. Run migrations (0001–0004)
pnpm db:migrate:prod

# 3. Secrets (each --env production):
#    LEMONSQUEEZY_API_KEY / _STORE_ID / _WEBHOOK_SECRET
#    LS_VARIANT_DAY / LS_VARIANT_MONTH / LS_VARIANT_YEAR / LS_VARIANT_LIFETIME / LS_VARIANT_LITE
#    ADMIN_TOKEN  (>= 16 chars)   RESEND_API_KEY / MAIL_FROM (optional email)
pnpm wrangler secret put ADMIN_TOKEN --env production

# 4. Deploy
pnpm deploy

# 5. LS Dashboard → Webhooks → https://<domain>/api/checkout/webhook  (event: order_created)
```

## Operations cheat-sheet

```bash
# Import a batch of kk-license codes as "year" stock
curl -X POST https://<your-domain>/api/admin/import \
  -H "authorization: Bearer $ADMIN_TOKEN" \
  -H "content-type: application/json" \
  -d '{"tier":"year","codes":["KC-A1B2-C3D4-E5F6","KC-G7H8-J9K0-L1M2"],"notes":"kk batch 2026-06"}'

# List in-stock cards
curl 'https://<your-domain>/api/admin/cards?status=unused' \
  -H "authorization: Bearer $ADMIN_TOKEN"
```

> **Out of stock:** if a tier has no `unused` cards when a buyer pays, the order is
> still marked `paid` but no card is allocated; the webhook logs `OUT OF STOCK` and
> the success page shows "processing". Import more codes for that tier, then fulfil.

## What this does NOT include (intentional)

- **Card generation** — done on kk-license; h540 only imports.
- **Activation / verification** — done in the KC Chat plugin against kk-license.
- **Payment processing** — handled by Lemon Squeezy (Merchant of Record).
- **No user accounts** — cards are anonymous bearer credentials; the order id (24
  random hex) is the unguessable claim secret used by the success page.

## Files

```
apps/kc-chat-site/
├── migrations/
│   ├── 0001_cards.sql               — cards / activations / heartbeats
│   ├── 0002_orders.sql              — orders
│   ├── 0003_orders_email.sql        — email_sent_at guard
│   └── 0004_inventory.sql           — sold_at / source (distribution)
├── wrangler.toml                    — Worker + [assets] + D1 + env
├── .dev.vars.example                — local-only secrets template
├── worker/index.ts                  — single Worker entry; /api/* dispatch
├── functions/
│   ├── env.d.ts                     — Env typings (LS_VARIANT_* etc.)
│   ├── lib/
│   │   ├── http.ts                  — json/ok/err/readJson helpers
│   │   ├── auth.ts                  — Bearer-token admin guard
│   │   ├── cards.ts                 — tier defs + importCards()
│   │   ├── orders.ts                — order persistence + allocateCardForOrder()
│   │   ├── lemonsqueezy.ts          — checkout + webhook signature
│   │   └── email.ts                 — Resend card-key delivery
│   └── api/
│       ├── health.ts
│       ├── checkout/{create,webhook}.ts
│       ├── order/status.ts
│       └── admin/{import,cards,revoke}.ts
└── src/pages/
    ├── pricing/index.astro          — tiers + day trial + lite
    ├── activate.astro               — "activate in the plugin" instructions
    ├── order/success.astro          — post-payment card delivery
    └── admin/index.astro            — import + inventory dashboard
```
