# Stage 7 — Critic review: Off the Rack (landing page + app artboards + shipped app)

Reviewers (fresh contexts, run in parallel): egm-design (feature-spec standard), egm-structural (feature-spec standard), egm-style (no standard). All three completed. Findings below are deduplicated across the three reports; the `Raised by` column shows which reviewers independently hit the same issue. Stage 5 and 6 overlap is noted so you can see what has now been raised by five separate reviewers.

Standard compliance (feature-spec-standard): **Alternatives considered — missing** (the build is a single-scroll page, the artboards a 3-step wizard; neither explains why). **Risks & mitigations — missing** (no loading, error, blocked, out-of-looks, offline or reload states anywhere).

---

## 🔴 Blockers

| ID | Finding | Scope | Raised by | Proposed fix |
|---|---|---|---|---|
| C-1 | **Funnel is a closed loop.** Every landing CTA → `#start`; `#start`'s button → `#top`. Nothing links to the app. Result "See packs" → landing pricing → `#start` → `#top`. | `Main.dc.html:30,42,136-154,188`; `App-Result.dc.html:44` | design, structural (+ Stage 5, 6) | Free CTAs → the app URL. Paid CTAs → checkout (new `App-Checkout` artboard) → post-purchase return artboard. |
| C-2 | **Quota and paid path are fiction against the backend.** "3 FREE LOOKS / USES 1 LOOK / 2 LOOKS LEFT / $4.99 pack / 4 tiers / Household / 15-day cap" with no counter, identity, Stripe or rate limit in `api/tryon.js`. A `localStorage` counter resets on reload; free-funnel cost (~$0.07/call) is unbounded. Reads as the "phantom credits" pattern competitors get 1-star reviews for. | `App-You:23`, `App-Clothes:21,49`, `App-Result:21,26,39-45`, `Main:126-158` | design, structural (+ Stage 5, 6) | Pick one: (a) server-side counter + Stripe before any quota UI, or (b) strip quota/pack copy from app screens, make pricing "Founding 10 waitlist" + email capture, add per-IP rate limit on `/api/tryon` now. Define once whether Regenerate / Swap cost a look. |
| C-3 | **Consent is decorative in the design, absent in the build.** Checkbox unchecked, "Next" fully enabled, no disabled state; `index.html` has no attestation; landing says "before every upload", artboard asks once. "Or I have this person's permission" quietly enables photographing strangers. | `App-You.dc.html:41-55`; `Main.dc.html:168`; `index.html` (none) | design, structural (+ Stage 5, 6) | Take photo / Library / Next `disabled` until checked; remember per device 30 days ("You confirmed on <date>"). Same gate in `index.html` now. Drop the "permission" clause for single-user MVP or make it a separate explicit choice. |
| C-4 | **Trust claims the system cannot honor.** "Deleted in 24 hours", "account is closed", "we act within 48 hours", Report/Privacy/Terms — all `#safety` or `#`. Backend is stateless (nothing to delete); build persists results in `localStorage` indefinitely, contradicting the claim. Gemini-side retention unmentioned. | `Main:45,120,168-171,198`; `App-You:56`; `App-Result:46`; `index.html:161,175` | design, structural, style (+ Stage 5, 6) | Say what is true today ("Never stored on our servers; results stay on your phone until you clear them"); timestamp `otr.looks` and expire at 24 h; ship real static `/privacy`, `/terms`, `/report` before the landing page goes live. Keep 24 h / 48 h promises off until a report inbox exists. |
| C-5 | **Build and artboards are two different products.** `<title>`/h1 "Fitting Room AI" vs manifest/install-banner "Off the Rack"; Inter vs Fraunces+Manrope; `#b4532a` vs Merlot `#7A2434`; emoji vs SVG icons; 10 px vs pill radius; single-scroll vs wizard; dark mode in build only. Build has slider, Regenerate, add-on-top/undo, plan readout, saved-looks gallery — none in the design. | `index.html:10-13,61,74-107,98-115`; `Style.dc.html:27-59` | design, structural, style (+ Stage 5, 6) | Artboards are the target. Port Style tokens into `:root`, load the fonts, rename title/h1/`download` to "Off the Rack" immediately. Write a one-page migration list; **keep** the before/after slider and Regenerate (strongest proof + recovery elements — the design lacks both). |
| C-6 | **No moderation-rejected state anywhere.** Landing promises undress requests are "blocked and the account is closed"; no classifier exists; build shows whatever `j.message` the server sends in a red box and offers "Tap Regenerate" — the wrong affordance for a refused request. | `Main.dc.html:169`; `index.html:159,162` | design, structural | Add `App-Blocked` artboard (why refused, what's allowed, report/terms link); build maps a specific error code to it. |
| C-7 | **Raw developer strings shown to the shopper.** "❌ HTTP 500", "Network error: Failed to fetch", "⚙️ Setup needed: GEMINI_API_KEY…", and the result caption "Understood: #1 top — … \| #2 jeans — …". None say what to do next. | `index.html:159,160,162` | style, design | Server error: "Something went wrong on our end. Tap Try it on again. If it keeps happening, try a different photo." Network: "No connection. Check your signal and tap Try it on again." Setup text → console only. Caption → "Wearing: blue striped shirt, dark jeans." or a collapsible "What we saw" row. |

---

## 🟡 Major

| ID | Finding | Scope | Raised by | Proposed fix |
|---|---|---|---|---|
| C-8 | **No loading state designed** for a 15–90 s wait — the most-seen state in the product. Build rotates text inside a disabled button, no cancel, no "keep screen on" warning. "~15 SEC" stated 3× in design; build says "up to a minute", aborts at 115 s. | all app artboards; `Main:40,62`; `App-Clothes:50`; `index.html:153,156` | design, structural, style (+ Stage 5, 6) | `App-Working` artboard: garment thumbnails, honest range ("Usually 15–30 s, up to a minute for full outfits"), Cancel, keep-screen-on note, Reading/Dressing/Shadows as a real progress list. One timing claim everywhere, derived from measured p50/p90. |
| C-9 | **No error / empty / out-of-looks states.** 422, 504, 503, HEIC failure, network loss, Step 2 with zero items, Step 1 with no photo, 0 looks left. | artboards (none); `index.html:140,159` | design, structural (+ Stage 5, 6) | One artboard per class: inline error on Result with "Try again" + "Change photo"; Step 2 empty tray with large camera CTA; 0-looks screen. |
| C-10 | **Step 2 buries the primary action.** Headline says "Snap what's on the hanger" but there is no camera button — "Add item" is the 4th grid tile. Build's "Snap item"/"Library" pair is right. | `App-Clothes.dc.html:35-41` | design, structural | Full-width Merlot "Snap the hanger" + secondary "Choose from library" under the headline; tile grid below as the tray with a remove (×) affordance. |
| C-11 | **Full-body selfie is physically hard alone.** Build forces `capture="user"` (front cam); tips say mirrors are "not OK", removing the one practical workaround. | `index.html:65,119`; `App-You:34-38` | design | Drop `capture` or use `environment`; empty-state tip: "Ask a friend, or prop the phone and use the timer. Mirror selfies work if nobody else is in frame." Validate mirror input before banning it. |
| C-12 | **Type sizes break the style board's own 16 px rule.** 10 px "AI-GENERATED PREVIEW", 11 px deletion/cost footers, 12–13 px pills, labels and links — the lines a cautious 45-year-old most needs, read under store lighting. | `Style:45`; `App-Result:27,42,46`; `App-You:41,56`; `App-Clothes:33,36-38,44,50`; `index.html:36` | design, structural, style (+ Stage 5, 6) | Floor: 14 px labels, 16 px anything she must read; amend Style board. AI disclosure at 13 px+ in a filled pill, and baked into the exported image (C-14). |
| C-13 | **Touch targets under 44 px** — nav links, "Report this image", 22 px tray remove, ~30 px `.btn.sm`. Plus `maximum-scale=1` blocks pinch-zoom (WCAG 1.4.4). | `Main:27-29`; `App-Result:46`; `index.html:5,24,32` | design | `min-height:44px` on every control; 44 px hit area on remove; delete `maximum-scale`. |
| C-14 | **"Send" distributes an AI image of a real person with no provenance.** 10 px overlay is not in the file. Label is vague (send where?). | `App-Result.dc.html:36` | design, style | Rename "Share"; on Save/Share composite "AI preview · offtherack.app" into the PNG via canvas; Web Share API with a `File` (data URLs don't share on iOS), fall back to Save. |
| C-15 | **No session persistence; iOS Safari reloads after the camera returns**, wiping the person photo and tray mid-aisle. | `index.html:126`; artboards are separate `<a href>` pages | design | Persist compressed person JPEG + tray to IndexedDB with a TTL; restore on load. Record as a Risk. |
| C-16 | **Unbacked quality claims.** "No slimming, no smoothing, no swapped face" / "unretouched" — only the prompt asks for it; face drift is a known failure. Also contradicts "If it won't fit you, you should see that here first" vs FAQ "can't promise the tag size fits". | `Main.dc.html:90,108,180` | design, style | "We ask the model to keep your face and body exactly as photographed, and we never apply a filter." + visible "Not quite you? Try again" on Result. Line 108 → "What you see is your shape." |
| C-17 | **Landing has no mobile artboard and a known overflow** (badge at `right:-34px` inside a 320 px mock; preview is 1440 only) for a product used on a phone in an aisle. | `Main.dc.html:62,204` | design (+ Stage 5) | Add a 390 px landing artboard; move the badge inside the frame. |
| C-18 | **Result actions disagree with no mapping.** Artboard: Save / Swap item / Send. Build: Keep & add more / Back to original / Save image / Regenerate + slider + gallery. Landing promises "keep it, toss it, or text it" — "toss" and "text" exist nowhere. "Swap item" undefined. | `App-Result:31-36`; `index.html:103-115`; `Main:90` | structural, design, style | One reconciled action set; artboard per secondary action's state. Label table: Save / Share / Try again / Add another item over this look. |
| C-19 | **Copy and naming inconsistencies across files.** Step names ("1 · The person" vs "Step 1 · You"); "her current jeans" third-person placeholder; "Regenerate", "base photo", "item(s)", "garment" developer vocabulary; three labels for two actions (Library / From library / Snap item); emoji in every button; "Shopper · most picked" with zero customers; "Pack of 20 — one big thrift run" vs 15/day cap; "Three taps" is 5–6 taps. | `index.html:62,69,74-75,85-86,90,104-107,146,153,166`; `Main:74,141,145,157`; `Style:59` | style, structural, design (+ Stage 6) | Adopt the terminology table below. "Three steps, standing in the aisle." Drop "most picked" until true. Resolve 20-pack vs daily cap. |
| C-20 | **Consent checkbox label mixes an affirmation with a rule** ("…No nudity, ever.") in a 14 px em-dash sentence. | `App-You.dc.html:43` | style | Checkbox: "I'm 18 or older, and this is me or someone who gave me permission." Line below: "Clothes stay on. Undress requests are blocked." |
| C-21 | **Style-board drift inside the artboards.** "Take photo" Merlot on Style, Ink on App-You; weight 600 vs 700 on CTAs; `#BDB5AA`, `#E3DDD4`, `#D9D2C8` not in the palette; `.dashed`/hairline swatches undocumented. | `Style:57-59`; `App-You:36,47`; `App-Clothes:39,44`; `Main:147,165` | structural (+ Stage 5) | Add Hairline / Dashed / Muted swatches to the Style board; pick one CTA weight; fix "Take photo" colour. |
| C-22 | **Missing Alternatives & Risks.** Wizard vs single-scroll vs camera-first never argued; reload, abuse cost, face drift, legal exposure never listed. | design set as a whole | design, structural | Short `design/README.md`: rejected flows + the failure state each screen handles. |

---

## 🟢 Nits

| ID | Finding | Scope |
|---|---|---|
| C-23 | "3 FREE LOOKS" (total) vs "2 LOOKS LEFT" (remaining) — one counter model on all three screens. | `App-You:23`, `App-Result:21` |
| C-24 | Upsell shown at Look 1 of 3 competes with Save/Share; show after Look 2 or at exhaustion. | `App-Result:39-45` |
| C-25 | Nothing prevents selecting two tops → two REMOVE-top instructions; group by slot or document last-wins. | `App-Clothes:33`; `tryon.js:53-57` |
| C-26 | `aria-label` on a plain `div` progress bar is ignored; use `role="progressbar"`. `✕` remove button has no accessible name. | `App-You:26`; `index.html:146` |
| C-27 | `[offtherack.app]` bracket placeholder in footer; Privacy/Terms/Report all → `#safety`; "Why it's different" section has no `id`. | `Main:95,196,198` |
| C-28 | "HD looks" means nothing for a generated image → "Full-resolution looks"; "never expire" stated 3×; "we act within 48 hours" → "we remove it within 48 hours"; "No app store" → "No app store download needed". | `Main:112,135-153,171,189` |
| C-29 | Caps rule says "never sentences"; `PHOTOS DELETED AFTER 24 HOURS` is one. Mixed case inside "Try it on · USES 1 LOOK"; inline style sets weight 600 then 400 on the same span. | `Style:50`; `App-You:56`; `App-Clothes:49` |
| C-30 | Manifest icon is SVG-only; iOS ignores it and there is no `apple-touch-icon` → blank home-screen tile. Dark-mode palette exists in build only. Ink `#1d1b19` vs `#1A1917`. No `preconnect` for fonts on app pages. | `manifest.json`; `index.html:13,14,39` ; `Main:11` |
| C-31 | "Add to Home Screen: tap Share, then 'Add to Home Screen'" repeats itself; "✓ wear" lowercase fragment; "Result" heading → "Your look"; "Reading the garment…" → "Reading the item…". | `index.html:97,146,153,180` |
| C-32 | README says 60 s function timeout; `api/tryon.js` sets 120 s — out of scope, but the timing copy should derive from whichever is real. | `README.md`; `api/tryon.js:3` |

---

## Terminology to settle (from the style reviewer)

| Concept | Landing | Artboards | Shipped | Use |
|---|---|---|---|---|
| Product | Off the Rack | Off the Rack | Fitting Room AI / Off the Rack | **Off the Rack** |
| One generated image | look | look | result / saved look | **look** |
| Garment | hanger / piece / item | item | item / garment | **item** |
| Step 1 subject | yourself | You | The person | **You** |
| Primary action | Try 3 looks free | Try it on | ✨ Try it on | **Try it on** |
| Retry | — | — | Regenerate | **Try again** |
| Share | text it to a friend | Send | — | **Share** |
| Library | — | Library / From library | Library | **Choose from library** |

---

## Cross-stage traceability

| Issue | Stage 5 | Stage 6 | Stage 7 |
|---|---|---|---|
| Landing CTA loop / no entry to app | #2 | B1, B2 | C-1 |
| Quota/pricing fiction, 4 tiers, Household | #3 | B3, M10 | C-2 |
| Consent decorative / absent | #5 | B5, M13 | C-3 |
| 24 h deletion claim vs localStorage | #6 | M7 | C-4 |
| Build ≠ design (name, type, colour, layout) | #1, #8 | B5, N24 | C-5 |
| Missing loading / error / blocked / 0-looks | #4 | B3, B4 | C-6, C-8, C-9 |
| "~15 sec" vs real timing | #12 | M9 | C-8 |
| Text sizes below 16 px | #15 | M18 | C-12 |
| "What costs a look?" | #10 | M6 | C-2, C-18 |

**Minimum to unblock Stage 8:** C-1 through C-7. The reviewers converge on one scope decision that drives most of them: either build accounts + Stripe + server-side quota before any pricing UI ships, or strip quota/pack UI to a Founding-10 waitlist and ship the honest, stateless version first.
