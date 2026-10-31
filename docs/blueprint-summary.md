---
title: Fitting Room AI (Off the Rack) — try-on blueprint, unit economics, and the Gemini subtle-edit lesson
date: 2026-10-30
domain: [Offers & Pricing, AI Engineering, Strategy & Focus]
pull_when: Fitting Room / Off the Rack work, virtual try-on, Gemini image editing that returns the input unchanged, per-try-on cost, try-on pricing or quotas, consent/deepfake safety for photo apps, TAKE IT DOWN Act, Texas SB 441, competitor try-on apps, offtherack.ai domain, lane-jump check on a new side bet
times_applied: 0
notion: https://app.notion.com/p/40afc8324df881dab28be6983b0dd28c
blueprint: https://claude.ai/artifact/8jaP9Uv2NysuQybwxF3kes
tags: [knowledge, fitting-room, try-on, pricing, safety]
---

# Fitting Room AI — distilled

**Status (2026-10-30):** MVP live on Vercel project `fitting-room-ai`. Framed as a capped validation bet (≤6 hrs/wk, $100, 10 paying strangers in 90 days) — [[Authority Engine]] stays the primary lane per [[charter]].

---

## Engineering lessons

- `gemini-2.5-flash-image` ignores subtle edits (cream sweater → cream sweater) and returns the input. Fix: (1) cheap text call that describes current outfit + each garment as JSON, (2) explicit "REMOVE X, REPLACE with GARMENT n: …" instructions, (3) upgrade to `gemini-3.1-flash-image`. ~13 s per try-on.
- Google rotates model names; keep model ids in env vars (`GEMINI_MODEL`, `GEMINI_TEXT_MODEL`).
- JS `.click()` on file inputs and `capture` camera inputs don't work inside the Claude app artifact viewer — use native `<label for>` and open in Safari/Chrome.

---

## Unit economics

- Variable cost per HD try-on ≈ **$0.071** (3.1 Flash Image 1K $0.067 + moderation $0.003 + tokens); 0.5K output $0.045; 3-pro $0.134.
- Vercel Hobby forbids commercial use → Pro $20/mo. Stripe 2.9% + $0.30.
- Plans: Free 3 looks (0.5K, watermark) · Pack 20/$4.99 one-time (63% margin at cap) · Shopper $7.99/mo 40 looks (58%) · Household $12.99/mo 100 looks / 4 people · Founding 10 at $29/yr. Hard cap 15 looks/day on every plan.
- Break-even on fixed cost ≈ 4 subscribers; $150K rung ≈ 1,700 customers at this mix → needs referral loop + B2B widget.

---

## Market

- Wedge: Google Try On, Amazon, Walmart, Zara are catalog-locked; closet apps (Alta, Acloset, Doji) dress an avatar; consumer apps that accept any photo (FitRoom, DressTry clones) get 1-star reviews for failed uploads, slimmed bodies, face drift, pay-before-preview, weekly subs, phantom credits. Google killed Doppl Apr 2026.
- Promises that answer the complaints: anything on the rack on *you* · your real body, unflattered · first look free then packs that never expire · full outfit in one go · deleted in 24 h.
- Category ([[Obviously Awesome — positioning]]): "the in-store try-on app" (thrift / off-price / resale), not "virtual try-on".

---

## Safety / legal (US + TX)

- TAKE IT DOWN Act live since May 2026: public removal process, act within 48 h, FTC fines ~$53k/violation.
- Texas SB 441: affirmative defense for AI-app providers that (1) ban sexual deepfakes in ToS, (2) require user acknowledgment, (3) take technical steps. Build exactly that.
- CUBI / BIPA cover face-geometry records, not plain photos → never compute/store face templates.
- Gemini: 18+ required, SynthID on outputs, paid tier doesn't train on data, safety thresholds default off on new models → set explicitly.
- Control stack: 18+/consent attestation, input + output NSFW classifier (Rekognition $1/1k), prompt sanitizer, Gemini thresholds, rate limits, 24 h deletion, report/remove page, audit hashes.

---

## Domain

- `offtherack.ai` ($160/2 yr) + `offtherack.app` ($9.99) available 2026-10-30; backups hangerhero.com, rackmirror.com.

---

## Frameworks applied (Times applied bumped in Notion 2026-10-30)

[[Dan Martell — Flip the Funnel (sell before you build)]] · [[Obviously Awesome — positioning]] · [[Traction — Bullseye channel framework]] · [[$100M Offers — Alex Hormozi]] · [[The Mom Test — Rob Fitzpatrick]]
