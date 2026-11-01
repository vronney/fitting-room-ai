# Off the Rack — design set

Atelier system (see `Style.dc.html`): Bone / Linen / Ink / Stone / Merlot / Champagne, Fraunces 500 for display, Manrope for everything else. Mobile artboards are 390×844.

## Screen map

| Screen | File | Reached from | Leads to |
|---|---|---|---|
| Landing page | `Main.dc.html` | QR code, DM, search | App-You (every CTA), App-Checkout (pack button) |
| Step 1 · You | `App-You.dc.html` | Landing, Start over | App-Clothes (only once a photo is added and the 18+ box is ticked) |
| Step 2 · The clothes | `App-Clothes.dc.html` | App-You, "Add another item over this look" | App-Working |
| Working | `App-Working.dc.html` | Try it on | App-Result · App-Error · App-Blocked; Cancel → App-Clothes |
| Your look | `App-Result.dc.html` | Working | Save / Try again / Share; App-Checkout; App-NoLooks (after look 3) |
| Error | `App-Error.dc.html` | timeout, network, no image, maintenance | Try again → Working; Change photo → App-You |
| Blocked | `App-Blocked.dc.html` | moderation refusal (input or output) | Start over → App-You; Report → `report.html` |
| Out of looks | `App-NoLooks.dc.html` | Try it on with 0 left | App-Checkout; See my looks → App-Result |
| Checkout | `App-Checkout.dc.html` | Result upsell, NoLooks, landing pack button | Stripe → App-Credited |
| Credits added | `App-Credited.dc.html` | Stripe return URL | App-Clothes (session preserved) |
| Privacy / Terms / Report | `public/privacy.html`, `terms.html`, `report.html` | footer, Result, Blocked | — |

Counter model: the pill always shows **looks remaining** ("3 LOOKS LEFT"), never looks used. **A look is every request that returns an image — Try again included.** Cancel, errors and blocked requests do not consume a look. The counter itself is not built yet; today the only guard is a per-IP cap of 15/day inside `/api/tryon` (best-effort, per function instance).

## Pricing (launch — option A)

Free 3 → Founding 10 (a year unlimited for $39, by email — the only paid path until Stripe exists) → Pack of 20 for $5.99 (Stripe Checkout, device-bound credits in KV, receipt by email; the "Buy the pack" button stays hidden on the live page until then). Monthly plans (Shopper $9.99 / Household $14.99) are deferred until a customer asks. 15 looks/day cap on paid.

## Alternatives considered

- **Single-scroll page (what shipped first).** Both steps visible at once, result appended below. Rejected for launch: on a 390 px screen the primary button is below the fold until both cards are filled, the consent box has no natural home, and there is nowhere to put the looks counter. Kept as the `public/index.html` layout until the wizard rebuild lands; the restyle brings it onto the Atelier tokens so the two stop looking like different products.
- **Camera-first (open on the viewfinder).** Fastest in the aisle, but the user has to understand consent and "snap yourself, not the rack" before the first shutter. Rejected until there is a returning-user mode that can skip Step 1.
- **Clothes first, then you.** Matches the moment (she is holding the hanger). Rejected because the person photo is the one that needs the 18+ gate, and asking for it second buries the gate.

## Risks and which screen handles them

| Risk | Handled by |
|---|---|
| iOS Safari reloads the tab after the camera app returns | session persisted in IndexedDB (2 h) and restored; App-Credited returns to a preserved session |
| Generation tail > 60 s (two production timeouts seen) | 120 s function limit, Working screen with honest range + Cancel, App-Error with Try again |
| Free-funnel cost unbounded (~$0.07/look) | per-IP cap of 15/day in `/api/tryon` (live, best-effort); KV-backed device counter with the Stripe work (Phase 1 Week 3–4) |
| Face drift / "not me" results | "Not quite you? Try again" on Result; copy promises no filter, not a perfect likeness |
| Misuse: photos of others, minors, undress prompts | 18+/it's-me gate on Step 1; Gemini safety thresholds set explicitly on both calls; description step flags minors / nudity / underwear and the request is refused before any image is generated; note sanitizer; App-Blocked; terms ban; `report.html` with 48 h removal |
| Shared AI image passed off as real | "AI-generated preview" pill on screen and a provenance strip baked into every saved/shared PNG, **free and paid alike** (it is the control, not a watermark to sell off); Gemini SynthID |
| Two tops selected at once | last one wins in the prompt; UI slot grouping deferred |
