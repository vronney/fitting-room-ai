Status: resolved — Stage 8 B1, B2, M2, M3, N1–N4 applied in PR #5 (merged); M1 (wizard vs single-scroll) and N5 (note field, now sanitized) recorded as accepted for Phase 1.

# Stage 8 — Intermediate Zoom Out: Off the Rack (post Stage 5–7 fixes)

Reviewer: egm-zoom-out, fresh context. Read: all 10 artboards, `design/README.md`, `public/index.html`, `public/app/index.html`, the three static pages; context only: Stage 5 report, goldfish report, blueprint summary, `api/tryon.js`.

**Short version:** the two Stage 5 blockers about links and plan count are genuinely closed (one CTA → `/app`, one SKU). The third (build ≠ design) is closed at the token level and still open at the structural level, and the landing page has now diverged a second time. The bigger problem is that the fixes moved the fiction from pricing to safety and quota: the live landing page promises blocking, barring, and a free-look cap that the stateless, moderation-free backend cannot deliver, and the design README claims a per-device counter that is not in the build.

---

## Blockers

### B1. Live landing page makes safety promises the backend cannot honor
- Scope: `public/index.html:277` ("blocked, and you're barred"), `:279`; `public/terms.html:7`; `public/report.html:13`; `design/App-Blocked.dc.html:31`; `api/tryon.js` (whole file).
- `tryon.js` has no moderation step, sets no Gemini `safetySettings`, never returns `error: "blocked"`, and passes the free-text `note` straight into the prompt (`:65`). The build's `blocked()` path (`public/app/index.html:208-209, 222`) is unreachable; the only guard is Gemini's default filter. "Barred" is impossible without identity.
- Cheapest honest fix: add `safetySettings` to both Gemini calls, map a safety refusal to the existing `blocked` code, cut "barred" everywhere until there is something to bar.

### B2. Free funnel is unbounded in the build and, by design, in the artboards
- Scope: `design/README.md:21` ("Try again … do not consume a look"), `:39` ("per-device counter now"); `public/app/index.html:91` (pill "Free preview"), `:212-213` (no count); `design/App-Result.dc.html:21,35`.
- README says a per-device counter exists now. It does not. And "Try again" is a full ~$0.07 generation the README says is free — three free looks with unlimited retries is unlimited free looks.
- Fix: decide the unit of cost at the architecture level (simplest: every returned image costs a look, Try again included); ship a per-IP limit inside `/api/tryon` before any Checkout board gets built; fix README:39.

---

## Major

### M1. Build matches design cosmetically; structurally still two apps, and now two landing pages
- Scope: `design/README.md:29`; `public/app/index.html:100-157` (single page, no progress bar, no counter) vs ten 390×844 artboards; `design/Main.dc.html` (static ticker, five cards, FAQ) vs `public/index.html` (marquee, four cards, no FAQ, new "See the difference" slider, ~50 lines of keyframe/scroll-timeline CSS).
- Stage 5 said pick one source of truth. Both were kept; the design expanded to ten boards for a wizard the build does not implement; the landing build grew features the landing artboard lacks.
- Cheaper reconciliation: redraw the design to the shipped single-scroll page (three boards) rather than rebuild the app to ten screens. The README's three reasons for the wizard are already answered by the build (consent lives in card 1, the header pill is where the counter goes). If the wizard is still wanted, freeze both live pages until it lands.

### M2. Checkout / Credited / NoLooks drawn ahead of the first stateful component; live pack button leads nowhere
- Scope: `design/App-Checkout.dc.html:29`, `App-Credited.dc.html:30`; `public/index.html:256-260` ("Buy the pack" → `/app`, where there is no pack); `public/index.html:259` + `App-NoLooks.dc.html:30` ("no label" on paid looks) vs `public/app/index.html:235-241` (strip baked into every export) and `README.md:42`.
- "Device-bound credits, no account" still needs the first KV/DB in the system. "No label" on paid output cancels the provenance strip the README relies on.
- Fix: Founding 10 by email is the only paid path needed for the first ten; hide "Buy the pack" on the live page until Stripe exists; the strip stays on every export, paid or free; change "no label" → "full resolution".

### M3. Landing page grew instead of shrinking; proof still a placeholder; a bracketed editor note is live
- Scope: `public/index.html:192` (visible: "[Swap the illustration for a real before/after once you have a consented customer photo.]"); `:100-144` (9 s stick-figure animation), `:185-214` (stick-figure slider); `design/Main.dc.html` still 1440×5200, no mobile board; eight sections before the CTA.
- Stage 5 asked for one real image; what shipped is an animation system to dress up its absence. The owner can be the model — one photo, one result. Delete the compare section until that exists.

---

## Nits
- **N1.** Consent pre-ticked for 30 days (`app/index.html:248-249`) is weaker than the design's unchecked box and a new photo may be a different person. Tie it to the 2 h session instead.
- **N2.** `App-Result.dc.html:21` "2 LOOKS LEFT" and `:27` "LOOK 1 OF 3" contradict README's "never looks used". Drop one.
- **N3.** Artboard links to `report.html` / `terms.html` / `privacy.html` are relative to `design/`, where they don't exist.
- **N4.** `privacy.html:12` says only the 18+ flag is kept; the build also keeps the session photo (IndexedDB, 2 h). Add one clause.
- **N5.** Free-text note field still shipped (`App-Clothes:49-50`, `app/index.html:118`) — the injection path in B1. Ship without it for the first 10.

---

## Stage 5 findings — status

| # | Finding | Status |
|---|---|---|
| 1 | Build ≠ design | **Open (structural)** — tokens ported; layout still single-scroll vs wizard; landing diverged too (M1) |
| 2 | No path into app | Closed |
| 3 | Four plans / accounts | Closed — new issue: pack button live with no checkout (M2) |
| 4 | Missing states | Closed in design, partial in build — Blocked unreachable (B1), NoLooks has no counter (B2) |
| 5 | Consent decorative | Closed (N1) |
| 6 | 24 h deletion claim | Closed |
| 7 | No real proof image | **Open** (M3) |
| 8 | Four unasked features | Closed by decision (slider, layering, gallery ratified into design) |
| 9 | Desktop-first landing | **Open** (M3) |
| 10 | Swap/Send undefined | Closed |
| 11 | `#` placeholder links | Closed (N3 for artboard copies) |
| 12 | "~15 sec" | Closed |
| 13 | "Your closet" | Closed |
| 14 | Free-text prompt | **Open** (N5, part of B1) |
| 15 | Style-board drift | Closed |

**Recommended order:** B1 → B2 → M2 → M3 → M1. Everything else waits for the first paying customer.
