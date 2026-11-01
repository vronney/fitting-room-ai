# Off the Rack — the in-store try-on app

Snap yourself. Snap anything on the rack. See yourself wearing it in ~15 seconds.

**Status:** MVP live on Vercel (`fitting-room-ai`). Phase 1 = make it sellable: accounts, consent/safety, quotas, Stripe, landing page.

## Stack
- `public/index.html` — single-file mobile web app (camera/library inputs, garment tray, result + saved looks)
- `public/landing/index.html` — marketing landing page, served at `/landing` (CSS-only animations, before/after slider; CTAs link to the app at `/`)
- `api/tryon.js` — Vercel serverless function. Two-step Gemini pipeline: (1) text model describes current outfit + each garment as JSON, (2) image model edits the person photo with explicit replace instructions
- `vercel.json` — 60 s function timeout, 1 GB memory

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
