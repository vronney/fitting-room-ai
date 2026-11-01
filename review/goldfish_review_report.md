# Goldfish Annotated Review Report

**Target:** `design/Main.dc.html`, `design/App-You.dc.html`, `design/App-Clothes.dc.html`, `design/App-Result.dc.html`, `design/Style.dc.html`, `public/index.html`, `public/manifest.json` (`full file`)
**Source findings:** `review/critic_report.md` (Stage 7, C-1 … C-32)
**Resolver context used:** blueprint doc (refreshed pricing + Phase 1 six-week plan), PR #2 (`api/tryon.js` now 120 s), Gemini paid-tier terms (prompts not used for training), the Phase 1 week plan (Week 2 safety, Week 3 accounts/storage, Week 4 Stripe/quotas, Week 5 landing page).

Categories: **PROPOSE FIX** (valid, edit defined) · **CONTEST** (inaccurate, evidence cited) · **ESCALATE** (needs your decision/knowledge) · **DECLINE** (nit, recorded, not fixed).

Tally: 1 escalate · 1 contest · 24 propose fix · 6 decline.

---

## Escalations first (your call, not approval)

### [E-1] C-2 Quota and paid path are fiction against the backend [`design`, `structural`] — Severity: Blocker
* **Affected scope:** `Main.dc.html#L126-L158`, `App-You#L23`, `App-Clothes#L21,L49`, `App-Result#L21,L26,L39-L45`
* **Discrepancy:** Four tiers, Household sharing, 15/day cap, "USES 1 LOOK", "2 LOOKS LEFT" with no counter, identity, Stripe or rate limit behind them.
* **Rationale:** Phantom-credit pattern; unbounded free cost (~$0.07/call).
* ***AI Suggestion:*** **ESCALATE** — this is a scope decision, and two facts the reviewers could not see bear on it:
  1. The Phase 1 plan already sequences accounts (Week 3) and Stripe + quotas (Week 4) *before* the landing page goes live (Week 5). So the tiers are not accidental fiction; they are drawn ahead of the build. The reviewers' point still stands: the artboards show no checkout, no post-purchase return, and no 0-looks state, and the live `index.html` has no cap at all today.
  2. The landing page shows **stale prices**. The blueprint's refreshed pricing is Free 3 · Pack 20 **$5.99** · Shopper **$9.99**/mo 40 · Household **$14.99**/mo 100 ÷ 4 · Founding 10 **$39/yr** · 15/day cap. The artboard still has $4.99 / $7.99 / $12.99 / $29.
* **Options:**
  * **(A) One SKU for launch** — Free 3 → Pack of 20 ($5.99, Stripe Checkout, no account; device-bound credits + receipt email) + Founding 10. Remove Shopper and Household from the landing page until someone asks. Cuts accounts, subscriptions, quota resets and member management from Phase 1 (Week 3 shrinks to "device credits + rate limit"). *My recommendation* — it matches "solo-fulfillable, simplicity first" and the first-10-customers goal; the result screen already upsells only the pack.
  * **(B) Keep all four tiers** per the blueprint; then the fix is: update prices to the refreshed numbers, add `App-Checkout` + `App-Credited` artboards, and ship a per-IP rate limit on `/api/tryon` now so the free funnel is bounded before Week 4.
* Either way C-1 (links) and C-23 (counter model) get fixed below; which price copy lands depends on A/B.

---

## Prioritized findings & AI suggestions

### [1] C-1 Funnel is a closed loop [`design`, `structural`] — Severity: Blocker
* **Affected scope:** `Main.dc.html#L30,L42,L136,L142,L148,L154,L188`; `App-Result.dc.html#L44`
* **Discrepancy:** All CTAs → `#start` → `#top`; nothing reaches the app; result upsell exits to landing pricing and dead-ends.
* ***AI Suggestion:*** PROPOSE FIX
* ***Justification:*** Raised by five reviewers across three stages; no evidence contradicts it.
* ***Proposed edit:***
  * `Main.dc.html` L30, L42, L136, L188: `href="#start"` / `href="#top"` → `href="App-You.dc.html"` (in the built site this becomes `/app`).
  * L142, L148, L154 pricing CTAs → `href="App-You.dc.html?plan=pack"` etc. (placeholder until checkout exists; under option A only the pack button remains).
  * `App-Result.dc.html` L44 "See packs" → `href="App-Checkout.dc.html"` and add a minimal `App-Checkout.dc.html` (pack card, Stripe button, "back to your look" link) so the return path exists.

### [2] C-3 Consent is decorative / absent [`design`, `structural`] — Severity: Blocker
* **Affected scope:** `App-You.dc.html#L41-L55`; `Main.dc.html#L168`; `public/index.html` (none)
* ***AI Suggestion:*** PROPOSE FIX
* ***Justification:*** Blueprint's own control stack requires attestation (SB 441 acknowledgment prong). "Before every upload" on the landing page over-promises.
* ***Proposed edit:***
  * `App-You.dc.html` L41-L44: label → "I'm 18 or older, and this is me." + helper line "Clothes stay on. Undress requests are blocked." (C-20 folded in). L55 Next button rendered in disabled state (opacity .4, `aria-disabled="true"`) with helper "Add your photo and tick the box to continue".
  * `Main.dc.html` L168: "You confirm it's you and that you're 18+ before your first look." (drop "or that you have permission" — single-user MVP).
  * `public/index.html`: add the checkbox under card 1; `ready()` gates on it; remember acceptance in `otr.consent` for 30 days and show "Confirmed on <date>".

### [3] C-4 Trust claims the system cannot honor [`design`, `structural`, `style`] — Severity: Blocker
* **Affected scope:** `Main.dc.html#L45,L80,L120,L168-L171,L198`; `App-You#L56`; `App-Result#L46`; `index.html#L161,L175`
* ***AI Suggestion:*** PROPOSE FIX
* ***Justification:*** `api/tryon.js` is stateless, so "deleted in 24 hours" describes machinery that does not exist, while the build keeps results in `localStorage` forever. Gemini paid tier does not train on prompts, which is the one retention claim we *can* make.
* ***Proposed edit:***
  * One sentence, reused everywhere (L45, L80, L120, L170, `App-You` L56): **"Your photos are never stored on our servers. Results stay on your phone for 24 hours unless you save them."**
  * L169 "and the account is closed" → "and you're blocked" (no accounts). L171 "we act within 48 hours" → "we remove it within 48 hours" and link to a real `/report` page.
  * `index.html` L161/L175: store `{src, at}` in `otr.looks`; drop entries older than 24 h on load; rename "Saved looks (this session)" → "Recent looks · kept on this phone for 24 hours".
  * Add static `public/privacy.html`, `public/terms.html`, `public/report.html` stubs (report = mailto + the 48 h promise) and point footer / "Report this image" at them.

### [4] C-5 Build and artboards are two different products [`design`, `structural`, `style`] — Severity: Blocker
* **Affected scope:** `public/index.html#L10-L13,L61-L62,L74-L107`; `Style.dc.html#L27-L59`
* ***AI Suggestion:*** PROPOSE FIX (partial now; wizard restructure stays a Phase 1 task)
* ***Justification:*** The artboards are the agreed target (you approved the Atelier restyle). Tokens, fonts, name, icons and labels can be ported without changing the app's working logic; converting single-scroll → three-screen wizard is a rebuild and belongs in Week 1–2 of Phase 1, not a resolve edit.
* ***Proposed edit (now):*** `<title>`/h1/`download` → "Off the Rack"; load Fraunces + Manrope; `:root` → Bone/Linen/Line/Ink/Stone/Merlot/Champagne; pill buttons (999px); replace emoji with inline SVG from the artboards; subtitle → "Snap yourself. Snap the hanger. See it on you."; step headings → "Step 1 · You" / "Step 2 · The clothes" / "Your look"; drop the dark-mode block (no dark design exists). **Keep** the before/after slider and Try-again — add both to `App-Result` artboard so the design carries them forward.
* ***Deferred:*** wizard screens, progress bar, looks counter — tracked as Phase 1 "Rebuild index.html to artboards".

### [5] C-6 No moderation-rejected state [`design`, `structural`] — Severity: Blocker
* **Affected scope:** `Main.dc.html#L169`; `index.html#L159,L162`
* ***AI Suggestion:*** PROPOSE FIX
* ***Justification:*** The Week 2 safety PR adds the classifier; the screen must exist before it so the error code has somewhere to land.
* ***Proposed edit:*** New `design/App-Blocked.dc.html` (Merlot header "We can't make this one", plain reason list, "What we can do: clothes on real people, 18+", buttons "Start over" / "Report a problem"). `index.html`: map `error === "blocked"` to that copy with **no** Try-again button.

### [6] C-7 Raw developer strings shown to the shopper [`style`, `design`] — Severity: Blocker
* **Affected scope:** `index.html#L159,L160,L162`
* ***AI Suggestion:*** PROPOSE FIX
* ***Proposed edit:*** server error → "Something went wrong on our end. Tap Try it on again. If it keeps happening, try a different photo."; network → "No connection. Check your signal and tap Try it on again."; `setup` → log to console, show the server-error line; caption → "Wearing: <description list>" in a collapsible "What we saw" row.

### [7] C-8 No loading state; "~15 sec" contradicted [`design`, `structural`, `style`] — Severity: Major
* **Affected scope:** all app artboards; `Main#L40,L62`; `App-Clothes#L50`; `index.html#L153,L156`
* ***AI Suggestion:*** PROPOSE FIX
* ***Justification:*** Verified live: 13.7 s on a two-garment outfit, but the two production timeouts show the tail is > 60 s. "Under a minute" is the only defensible claim until p90 is measured.
* ***Proposed edit:*** New `design/App-Working.dc.html` (garment thumbnails, "Usually 15–30 seconds, up to a minute for a full outfit", live step list Reading → Dressing → Shadows, Cancel, "Keep your screen on"). Copy: `Main` L40 "in under a minute", L62 badge "< 1 MIN"; `App-Clothes` L50 "2 ITEMS · UNDER A MINUTE". `index.html`: full-width working panel instead of text-in-button; Cancel aborts the fetch.

### [8] C-9 No error / empty / out-of-looks states [`design`, `structural`] — Severity: Major
* ***AI Suggestion:*** PROPOSE FIX
* ***Proposed edit:*** `App-Result` gets an inline error variant (red card, "Try again" primary, "Change photo" secondary). `App-Clothes` empty-tray state (dashed frame + big camera CTA). New `App-NoLooks.dc.html` ("You've used your 3 free looks" + pack card + "Start over with a new photo"). `index.html`: Step 2 hint shows the empty-tray message when `S.items` is empty.

### [9] C-10 Step 2 buries the camera [`design`, `structural`] — Severity: Major
* ***AI Suggestion:*** PROPOSE FIX
* ***Proposed edit:*** `App-Clothes.dc.html` L35: insert the Take photo / From library pair (same components as `App-You` L46-L51, labels "Snap the hanger" / "From library") above the grid; the dashed "Add item" tile stays as the tray's add affordance; selected tiles get a 32 px (44 px hit) remove ×.

### [10] C-11 Front-camera full-body selfie [`design`] — Severity: Major
* ***AI Suggestion:*** PROPOSE FIX
* ***Justification:*** You hit exactly this on your phone during testing — the camera opened in selfie mode.
* ***Proposed edit:*** `index.html` L119: drop `capture="user"` (OS camera opens on rear, user can flip). Tips L65 → "Ask a friend, or prop the phone and use the timer. A mirror selfie works if nobody else is in frame." Same copy in `App-You` L38.

### [11] C-12 Type below the style board's own minimum [`design`, `structural`, `style`] — Severity: Major
* ***AI Suggestion:*** PROPOSE FIX
* ***Proposed edit:*** Floor 14 px for pills/counters/footers, 16 px for anything she must read. `App-Result` L27 "AI-generated preview" → 13 px in a filled Stone pill; `App-You` L56, `App-Clothes` L50 → 13 px sentence case; `Style` L45 → "16px body minimum; 13px minimum for labels and pills". `index.html` `.hint` 12 → 14 px, `.status` 13 → 15 px.

### [12] C-13 Touch targets / pinch-zoom [`design`] — Severity: Major
* ***AI Suggestion:*** PROPOSE FIX
* ***Proposed edit:*** remove `maximum-scale=1` (L5); `.btn.sm` min-height 44; `.item .x` 32 px visual with 44 px padding box; `Main` nav links `min-height:44px;display:inline-flex;align-items:center`; `App-Result` L46 report link padded to 44 px.

### [13] C-14 Share without provenance; "Send" vague [`design`, `style`] — Severity: Major
* ***AI Suggestion:*** PROPOSE FIX
* ***Proposed edit:*** `App-Result` L36 "Send" → "Share". `index.html`: on Save/Share, composite a Stone strip "AI preview · Off the Rack" into the exported PNG via canvas; Share uses `navigator.share({files:[File]})` with fallback to Save. SynthID stays as-is from Gemini.

### [14] C-15 Session lost on iOS camera reload [`design`] — Severity: Major
* ***AI Suggestion:*** PROPOSE FIX
* ***Proposed edit:*** persist `S.person` and `S.items` (compressed JPEG data URLs) in IndexedDB (`otr.session`, 2 h TTL) after each change; restore on load; clear on "Start over". Record under Risks in `design/README.md`.

### [15] C-16 Unbacked quality claims [`design`, `style`] — Severity: Major
* ***AI Suggestion:*** PROPOSE FIX
* ***Proposed edit:*** `Main` L108 → "We ask the model to keep your face and body exactly as photographed, and we never apply a filter. What you see is your shape." L90 "unretouched" → "as photographed". `App-Result`: add "Not quite you? Try again" under the frame.

### [16] C-17 No mobile landing artboard; badge overflow [`design`] — Severity: Major
* ***AI Suggestion:*** PROPOSE FIX (overflow now; mobile artboard as a canvas task)
* ***Proposed edit:*** `Main` L62 `right:-34px` → `right:12px; top:16px`; add `overflow-x:hidden` on the hero section. Add a 390 px preview variant on the canvas when the landing page is rebuilt in Week 5.

### [17] C-18 Result actions disagree [`structural`, `design`, `style`] — Severity: Major
* ***AI Suggestion:*** PROPOSE FIX
* ***Proposed edit:*** Reconciled set, both files: primary row **Save · Try again · Share**; secondary link **"Add another item over this look"** (keeps the layering primitive) and **"Back to original photo"** when layered. Drop "Swap item". `Main` L90 → "Save it, try again, or share it with a friend before you buy."

### [18] C-19 Copy and naming inconsistencies [`style`, `structural`, `design`] — Severity: Major
* ***AI Suggestion:*** PROPOSE FIX
* ***Proposed edit:*** apply the terminology table (Off the Rack · look · item · You · Try it on · Try again · Share · From library) across all files; L74 "Three steps, standing in the aisle."; L145 drop "most picked"; L141 "Good for one big thrift run" → "Use them whenever you like" (resolves the 15/day conflict); `index.html` L90 placeholder → "Tuck the shirt in, jacket open"; L166 → "This look is now your photo. Pick the next item and tap Try it on."; L141 → "Couldn't open one of the photos. Take it again or pick a different one."

### [19] C-20 Consent label mixes affirmation and rule [`style`] — Severity: Major
* ***AI Suggestion:*** PROPOSE FIX — folded into [2].

### [20] C-21 Style-board drift [`structural`] — Severity: Major
* ***AI Suggestion:*** PROPOSE FIX
* ***Proposed edit:*** `Style.dc.html`: add Hairline `#E3DDD4`, Dashed `#BDB5AA`, Muted-on-ink `#D9D2C8` swatches; set CTA weight 700 everywhere; `App-You` L47 "Take photo" → Merlot per `Style` L58.

### [21] C-22 Missing Alternatives & Risks [`design`, `structural`] — Severity: Major
* ***AI Suggestion:*** PROPOSE FIX
* ***Proposed edit:*** new `design/README.md`: screen map (incl. new Working / Blocked / NoLooks / Checkout boards), rejected alternatives (single-scroll — what shipped first and why the wizard replaced it; camera-first), risks (iOS reload, abuse cost, face drift, SB 441 / TAKE IT DOWN exposure) and which screen handles each.

### [22] C-32 README says 60 s timeout; `tryon.js` is 120 s [`design`] — Severity: Nit
* ***AI Suggestion:*** **CONTEST** — the code is right; the README predates PR #2 (`fix-timeouts`, merged today, `vercel.json` + `api/tryon.js:3` set 120 s). Will update the README line as a one-word edit rather than leave it, but the finding's implication (copy derived from a 60 s cap) is wrong.

### Nits

| ID | Suggestion | Note |
|---|---|---|
| C-23 counter model | PROPOSE FIX | Use "2 LOOKS LEFT" style (remaining) on all three screens; `App-You`/`App-Clothes` pill → "3 LOOKS LEFT". |
| C-24 upsell at look 1 | DECLINE | Under option A the pack card is the only upsell; revisit after first 10 customers' data. |
| C-25 two tops selected | DECLINE | Document last-wins in `design/README.md`; UI slot grouping later. |
| C-26 aria on progress / remove | PROPOSE FIX | `role="progressbar" aria-valuenow`; `aria-label="Remove item"`. |
| C-27 `[offtherack.app]`, `#safety` links, missing `id` | PROPOSE FIX | Footer → "offtherack.app" (domain still to buy — see your to-do), links → `/report`, `/privacy`, `/terms`; `id="why"` on the section. |
| C-28 "HD", "never expire" ×3, "we act", "No app store" | PROPOSE FIX | "Full-resolution looks"; keep "never expire" in pricing + FAQ only; "we remove it"; "No app store download needed". |
| C-29 caps sentence, mixed-case button, weight 600→400 | PROPOSE FIX | Folded into [11] and [18]. |
| C-30 SVG-only manifest icon / no `apple-touch-icon`; dark mode; ink hex | PROPOSE FIX | Render `icon.svg` → 180/192/512 PNG, add `apple-touch-icon`; dark-mode block removed in [4]; ink → `#1A1917`. |
| C-31 small copy fragments | PROPOSE FIX | Folded into [18]. |
