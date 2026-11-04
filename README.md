# Off the Rack — the in-store try-on app

Snap yourself. Snap anything on the rack. See yourself wearing it in under a minute.

**Status:** MVP live on Vercel (`fitting-room-ai`). Phase 1 = make it sellable: accounts, consent/safety, quotas, Stripe, landing page.

## Stack
- `public/index.html` — marketing landing page at `/` (CSS-only animations, before/after slider; every CTA goes to `/app`)
- `public/app/index.html` — the single-file mobile web app at `/app` (camera/library inputs, garment tray, result + saved looks); PWA `start_url` points here
- `api/_looks.js`, `api/looks.js` — looks counter on Neon Postgres (`devices`, `looks`): 3 free per device, paid credits, `unlimited_until` for Founding 10, global daily cap
- `api/tryon.js` — Vercel serverless function. Two-step Gemini pipeline: (1) text model describes current outfit + each garment as JSON, (2) image model edits the person photo with explicit replace instructions
- `vercel.json` — 120 s function timeout, 1 GB memory

## Run locally
```bash
npm i -g vercel
cp .env.example .env   # fill GEMINI_API_KEY
vercel dev
```

## Deploy
Push to `main` → Vercel auto-deploys (once the repo is connected), or `vercel --prod`.

## Docs
- `docs/blueprint-summary.md` — pricing, unit economics, safety/legal, competitor wedge (distilled)
- `design/` — Design canvas artboards (landing page static + animated `Motion.dc.html`, app screens, style board) exported from Claude Design
- Full blueprint: https://claude.ai/artifact/8jaP9Uv2NysuQybwxF3kes

## Safety posture (non-negotiable)
Dresses people, never undresses them. 18+ and consent attestation, input + output moderation, prompt sanitizer, 24 h deletion, 48 h takedown. See `docs/blueprint-summary.md`.

## Payments (Stripe, test mode)
- `api/checkout.js` — Stripe-hosted Checkout for the $5.99 Pack of 20 (`STRIPE_PRICE_PACK`), `client_reference_id` = device id
- `api/stripe-webhook.js` — `checkout.session.completed` → `paid_left += 20` (pack) or `unlimited_until + 365 d` (Founding 10 Payment Link, device code from the custom field); idempotent on session id; unmatched devices logged to `payments` for hand fixing
- `api/_stripe.js` — self-provisioning: on first use it creates the product + price (lookup keys `otr_pack_20`, `otr_founding_10`), the Founding 10 Payment Link and the webhook endpoint **in whatever account `STRIPE_SECRET_KEY` belongs to**, and caches ids + the webhook secret in Neon `settings`
- Env: only `STRIPE_SECRET_KEY` and `APP_URL` are required. `STRIPE_WEBHOOK_SECRET` / `STRIPE_PRICE_*` / `FOUNDING_PAYMENT_LINK` are optional overrides.
- Go live: swap `STRIPE_SECRET_KEY` for the live key and redeploy; the bootstrap creates everything again in live mode.

## Founding 10 (manual fallback)
A customer emails from the app; the mail body carries their device id. Grant a year:
```sql
UPDATE devices SET unlimited_until = now() + interval '1 year' WHERE id = '<device id>';
```
Grant a 20-pack: `UPDATE devices SET paid_left = paid_left + 20 WHERE id = '<device id>';`

## Analytics (PostHog)
Shared project with other R&E apps; every event carries `app: off-the-rack`. Autocapture, session replay, heatmaps and web vitals are **off** (pages hold photos of people). Funnel: `$pageview` (landing) → `otr_cta_click` → `otr_app_open` → `otr_consent` → `otr_person_added` / `otr_item_added` → `otr_generate` → `otr_result` | `otr_error` | `otr_blocked` | `otr_timeout` → `otr_save` / `otr_share` → `otr_paywall_view` → `otr_founding_click`. App users are identified by their device id. Note: the project's "filter test accounts" setting hides `*.vercel.app` hosts — untick it until the real domain is live.
