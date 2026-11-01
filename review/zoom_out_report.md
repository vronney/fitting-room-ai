# Stage 5 — Zoom Out review: Off the Rack (landing page + app artboards + shipped app)

Reviewer: egm-zoom-out (fresh context, no conversation history). Targets: `design/Main.dc.html`, `design/App-You.dc.html`, `design/App-Clothes.dc.html`, `design/App-Result.dc.html`, `design/Style.dc.html`, `public/index.html`, `public/manifest.json`. Baseline: `docs/blueprint-summary.md`, `README.md`.

**Short version:** the artboards describe a coherent three-step product, but the shipped app is a different product (different name, type, colour, layout, and feature set); the landing page sells four price plans and an account system that do not exist; the design has no screens for the three states the user will actually hit most (waiting, failure, out of looks); and the free-trial CTA on the landing page loops back to the top of the landing page.

---

## Blockers

### 1. The shipped app is not the designed app — total drift, not partial
- Scope: `public/index.html:10-13, 61-62, 68-115` vs `design/App-You.dc.html`, `App-Clothes.dc.html`, `App-Result.dc.html`, `Style.dc.html`
- Name: title and h1 say "Fitting Room AI" (`index.html:10, 61`); manifest and artboards say "Off the Rack" (`manifest.json`, `App-You.dc.html:21`).
- Type and colour: app uses Inter and accent `#b4532a` (`index.html:11, 13`); style board specifies Fraunces + Manrope and Merlot `#7A2434` (`Style.dc.html:27-31, 38-44`).
- Structure: app is one long scrolling form with both steps visible at once (`index.html:68-93`); design is a three-step wizard with a progress bar and one job per screen (`App-You.dc.html:26-30`).
- Nothing from the design's trust layer is in the app: no consent checkbox, no looks counter, no "deleted after 24 hours" line, no "AI-generated preview" tag, no report link.
- Rationale: the owner's stated goal is "professional-looking, easy-to-follow flow." Right now there are two products. Pick the artboards as source of truth and rebuild `index.html` to them, or declare the artboards aspirational and stop reviewing against them. Do not keep both.

### 2. The landing page has no path into the app
- Scope: `Main.dc.html:30, 42, 136, 142, 148, 154, 188`
- Every "Try 3 looks free" / "Start free" / "Buy the pack" link goes to `#start`, and `#start`'s button goes to `#top`. The flow "land → trust → upload self" is broken at the first arrow. The result artboard's upsell also sends the user *out* of the app back to `Main.dc.html#pricing` (`App-Result.dc.html:44`) with no way to return with a purchased pack.
- Rationale: a landing page's only job is one transition. Define it: landing CTA → `App-You`. Pricing CTAs → Stripe Checkout → `App-You` with credits. One link each.

### 3. Four price plans, a "Household" multi-user plan, "account is closed", and "Founding 10" — for a product with no accounts, no payments, and zero customers
- Scope: `Main.dc.html:131-157, 169`; README Phase 1 lists accounts/Stripe as *not yet built*.
- Household (`:150-155`) implies shared quotas across 4 people: accounts, invites, per-member tracking. Two monthly subs imply billing cycles, quota resets, cancellation flows. "Account is closed" (`:169`) implies accounts. "Shopper · most picked" (`:145`) is a social-proof claim with no customers behind it.
- Rationale: the first-10-customers goal needs one SKU: 3 free, then Pack of 20 via Stripe Checkout (no account; device-local counter + receipt email). Monthly and Household can be added when someone asks. That removes accounts, subscriptions, quota resets and member management from the solo build. The result screen already does this right — it upsells only the pack (`App-Result.dc.html:39-45`); the landing page should match it.

---

## Major

### 4. No screens for the states users will hit most: waiting, failure, out of looks, rejected photo
- Scope: `App-Clothes.dc.html:49` jumps straight to `App-Result.dc.html`; no intermediate artboard.
- Missing: (a) the ~15–60 s generation wait (the shipped app has copy for this, `index.html:153`, the design has none); (b) generation failed / timed out / network error (`index.html:159, 162` exist in code, not design); (c) "0 looks left" paywall — badge counts down (`App-Result.dc.html:21`) but there is no screen for zero; (d) input rejected by moderation or "no full-body person detected" — the blueprint's control stack requires this, and it is the most likely first-run failure for the target user.
- Rationale: these are not edge cases; they are the second and third screens most users see. The "easy-to-follow flow" goal fails if the flow only exists for the happy path.

### 5. Consent copy contradicts itself across landing and app, and the checkbox is decorative
- Scope: `Main.dc.html:168` ("before every upload") vs `App-You.dc.html:41-44` (one checkbox on step 1 only, not wired to the Next button at `:55`); shipped app has no attestation at all.
- Rationale: Texas SB 441's affirmative defense (per blueprint) needs an actual acknowledgment. One required checkbox per session, gating "Next", is enough. Say that on the landing page. Don't promise per-upload.

### 6. "Deleted in 24 hours" is probably the wrong claim, and the shipped app actively contradicts it
- Scope: `Main.dc.html:45, 120, 170`; `App-You.dc.html:56`; `index.html:161, 175`
- README describes a stateless serverless function. If nothing is stored server-side, "never stored on our servers" is simpler, truer, and needs no deletion job to build. Meanwhile the shipped app persists up to 6 base64 result images in `localStorage` with no expiry (`index.html:161, 175`) — the landing says "we keep it on your phone's session, not a gallery" (`Main.dc.html:80`).
- Rationale: pick the claim that matches the architecture you already have. Don't build a 24 h deletion system to back a marketing line.

### 7. Landing page shows no proof — the hero phone is a placeholder
- Scope: `Main.dc.html:49-63` (`[Your photo]`, `[The hanger]`, `[Result: you, wearing it]`)
- Rationale: a try-on product is sold by one real before/after. Everything else on the page (five "why different" cards, FAQ, ticker) is a substitute for that one image. Get one real result in the hero; cut the "why it's different" section down to the three claims the result image can't show (any rack, real body, deleted).

### 8. Shipped app has grown four features the design never asked for
- Scope: `index.html:46-51, 96-110` (before/after slider), `:104, 166` ("Keep & add more on top" layering), `:112-115, 167` (saved looks gallery), `:54-55, 176-183` (install banner on first visit), `:14` (dark mode)
- Rationale: layering contradicts the landing's "whole outfit at once" promise (`Main.dc.html:116`) and adds a base-photo state machine (`undoBase`) to maintain. The install banner fires before the user has seen a single result. Each is defensible on its own; together they are why the app and the design diverged. Freeze scope to the three artboards until 10 people have paid.

### 9. The landing page is designed desktop-first for a mobile-only, in-aisle product
- Scope: `Main.dc.html:204` (preview 1440×5200), seven sections, four-link nav
- Rationale: the user arrives on a phone from a QR code or a DM. No mobile artboard exists for the landing page. A 5200 px page with pricing, safety, FAQ, and a second CTA band is a lot of scrolling before "Try 3 looks free" — which currently goes nowhere (see #2). Right-size: hero + one real result + three steps + safety line + single CTA.

---

## Nits

### 10. "Swap item" and "Send" on the result screen have undefined behaviour
- Scope: `App-Result.dc.html:33-36`
- Does Swap cost a look? Does it return to step 2 with the selection preserved? Is Send the native share sheet? The shipped app has neither; it has Regenerate instead (`index.html:107`). Define or drop.

### 11. "Report this image", "Privacy", "Terms" are all `#` or `#safety`
- Scope: `App-Result.dc.html:46`; `Main.dc.html:198`
- Blueprint says TAKE IT DOWN needs a real removal path and SB 441 needs a ToS ban. Fine as a placeholder in an artboard; flag so it does not ship as an anchor.

### 12. "~15 sec" claim vs code that waits up to 115 s and tells the user "up to a minute"
- Scope: `Main.dc.html:40, 62`; `App-Clothes.dc.html:50`; `index.html:153, 156`
- Say "under a minute" until p90 is measured.

### 13. "Your closet" dilutes the in-store wedge
- Scope: `Main.dc.html:40, 68`
- The blueprint's positioning is "the in-store try-on app." Closet is a different use case with different competitors (Alta, Acloset). Cut it from the hero and ticker.

### 14. Free-text prompt field is an injection surface the MVP may not need
- Scope: `App-Clothes.dc.html:43-45`; `index.html:90`
- It forces the prompt sanitizer onto the critical path. Consider shipping without it for the first 10 and see if anyone asks.

### 15. Style board and artboards disagree with each other
- `Style.dc.html:45` says "16px minimum in the app" but artboards use 10–13 px for counters and captions (`App-You.dc.html:56`, `App-Clothes.dc.html:50`, `App-Result.dc.html:27`). `Style.dc.html:58` shows "Take photo" in Merlot; `App-You.dc.html:47` renders it in Ink. Step-1 dropzone (`App-You.dc.html:36-39`) plus two buttons below it is three affordances for one action.

---

## Direct answers to the four review questions

| Question | Answer |
|---|---|
| Right-sized for a solo MVP? | No. The app flow (3 screens) is right-sized. The landing/pricing layer is not: 4 plans, multi-user sharing, accounts, subscriptions, and a 24 h deletion system are all speculative. One SKU, no accounts. |
| Flow coherent end to end? | Broken at land → app (#2) and at result → pay → back (#2). Missing waiting, failure, zero-looks, and rejected-input states (#4). Consent exists in the design but not in the build and not wired (#5). |
| Does the shipped app match the artboards? | No — different name, type, colour, layout, and feature set (#1, #8). This is a rebuild, not a touch-up. |
| Is the landing page selling one thing? | The headline is good ("See it on you before the fitting-room line"). It is undercut by no real result image (#7), four plans (#3), "your closet" (#13), and seven sections before a CTA that loops to the top (#2, #9). |

**Recommended order:** fix #2 (one CTA → App-You), collapse pricing to one SKU (#3), rebuild `public/index.html` to the three artboards (#1), then add the four missing state screens (#4). Everything else waits for the first paying customer.
