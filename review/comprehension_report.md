# Stage 6 — Comprehension review: Off the Rack / Fitting Room AI

Reviewer: egm-comprehension (fresh context; read only the targets, not README/docs). Targets: `design/Main.dc.html`, `App-You.dc.html`, `App-Clothes.dc.html`, `App-Result.dc.html`, `Style.dc.html`, `public/index.html`.

## What this proposes (the landing page, as a first-time visitor reads it)

Something called "Off the Rack" is a website that runs in my phone's browser (no app store). I take a photo of a piece of clothing on its hanger in a store, take a photo of myself, and about 15 seconds later I see a picture of me wearing it. It works for any clothes anywhere — thrift, resale, "off-price" stores, or my own closet — and can put a top, jeans and jacket on me at once. It's for adults (18+), and it won't make me look thinner or swap my face.

Cost, as I read it: the first 3 "looks" are free with a small watermark and "standard quality". Then either $4.99 one-time for 20 "HD looks" that never expire, $7.99/month for 40 looks, or $12.99/month for 100 looks shared by up to 4 people. Something called "Founding 10" gives the first 10 people a year for $29. Every plan stops me at 15 looks a day.

My photos: deleted automatically in 24 hours, no face/body profile is built, step 1 says the photo is kept "on your phone's session, not a gallery", I can save results to my own phone, and anyone can ask for an image of them to be removed within 48 hours.

## How the existing system works, per the app screens and the shipped page

**Artboards (3 steps).** Step 1: take or choose a full-body photo of myself, tick a box saying I'm 18+ and it's me (or I have permission), press "Next: the clothes". Step 2: photograph items on the hanger, tap which ones to wear together, optionally type a note like "tuck the shirt in", press "Try it on · USES 1 LOOK". Step 3: I see the result with a "LOOK 1 OF 3" badge and a tiny "AI-generated preview" label; the top says "2 LOOKS LEFT". I can Save, Swap item, or Send. A box says "Keep going for $4.99 — See packs", which takes me back to the landing page's pricing section. There's a "Report this image" link.

What happens when I run out of free looks: **not shown anywhere**. What happens when it fails: **not shown anywhere in the artboards**. What happens when I want to buy: I'm sent to the landing page pricing cards, whose buttons scroll to "Try 3 looks free", which scrolls to the top of the page. There is no checkout, sign-in, or payment anywhere.

**Shipped page (`public/index.html`).** A single scrolling page titled "Fitting Room AI" (not "Off the Rack"), subtitle "Photo of the person + photos of clothes → AI puts them on". Two cards: "1 · The person" (Take photo / Library) and "2 · The clothes" (Snap item / Library, tap items to select, optional note). A greyed-out "Try it on" button. On success: a before/after slider, "Keep & add more on top", "Back to original photo", "Save image", "Regenerate", a line of text starting "Understood: #1 top — …", and a "Saved looks (this session)" strip. On failure: a red status box saying "Setup needed: …", "❌ …", or "That one took too long. Tap Regenerate." Progress text says big outfits "take up to a minute". There is no free-look counter, no price, no 18+ checkbox, no watermark, no deletion notice, and no mention of buying anything.

---

## Findings

### Blockers

**1. There is no way to start the product from the landing page.**
`Main.dc.html:30, 42, 136, 188` — every "Try 3 looks free" / "Start free" button is `href="#start"`, and the `#start` section's button (line 188) is `href="#top"`. A visitor taps "Try 3 looks free" three times and ends up back at the headline. Nothing links to the app screens.

**2. There is no way to buy anything, from either the landing page or the result screen.**
`App-Result.dc.html:44` "See packs" → `Main.dc.html#pricing`. `Main.dc.html:142, 148, 154` "Buy the pack" / "Get Shopper" / "Get Household" → `#start` → `#top`. "Founding 10" (line 157) has no button at all. No account, sign-in, email, or payment step exists in any file.

**3. The "out of free looks" state does not exist.**
The landing page (`Main.dc.html:135`) and the counters (`App-You.dc.html:23`, `App-Clothes.dc.html:21`, `App-Result.dc.html:21`) promise exactly 3 free looks, and the result shows "2 LOOKS LEFT". No artboard shows what she sees at 0 left: is "Try it on" disabled, does it show a price, does it block her? The shipped page has no counter and never stops her.

**4. The "generation failed" state does not exist in the design.**
Nothing in `App-Clothes.dc.html` or `App-Result.dc.html` shows what happens if it takes too long or errors, or whether a failed try costs one of her 3 looks. The shipped page has failure text (`index.html:159, 162`), but one of those messages is "⚙️ Setup needed: …" — a developer message that means nothing to a shopper in an aisle.

**5. The shipped page is a different product by name and by promises.**
`index.html:10` `<title>Fitting Room AI</title>`, `index.html:61` `<h1>👗 Fitting Room AI</h1>` — but the install prompt (`index.html:179`) and `apple-mobile-web-app-title` (line 9) say "Off the Rack". A visitor who read the landing page and arrives here will think she's on the wrong site. Every landing-page promise she might rely on is absent from the shipped page: the 18+ / permission checkbox (`App-You.dc.html:41-44`, `Main.dc.html:168` says "before every upload"), the 3-free counter, the watermark, the "deleted in 24 hours" line, and all pricing. I cannot tell which document describes the real rules.

### Major

**6. "Look" is never defined, and the things that might cost one are unclear.**
`App-Clothes.dc.html:49` "USES 1 LOOK" with 2 items selected suggests one look = one generated image regardless of item count. But: does "Swap item" (`App-Result.dc.html:34`) cost a look? Does going Back (`App-Result.dc.html:19`) and pressing "Try it on" again? On the shipped page, does "Regenerate" (`index.html:107`) or "Keep & add more on top" (`index.html:104`) cost one? Not stated anywhere.

**7. Where photos live contradicts itself.**
`Main.dc.html:80` "we keep it on your phone's session, not a gallery" vs `Main.dc.html:45, 120, 170` "deleted in 24 hours". If it never leaves my phone, what is being deleted, and from where? "Session" is jargon to this reader. The shipped page actually POSTs the photo to `/api/tryon` (`index.html:157`) and keeps results in `localStorage` that survive a refresh (`index.html:161, 174-175`), while labelling that strip "Saved looks (this session)" (`index.html:113`) — the label says they vanish, the code keeps them.

**8. "Pack of 20 … Good for one big thrift run" vs "capped at 15 looks a day".**
`Main.dc.html:141` and `Main.dc.html:157` directly conflict: she cannot use 20 looks on one run if she's capped at 15 a day.

**9. Time promise: ~15 seconds vs up to a minute vs two minutes.**
`Main.dc.html:40, 62`, `App-Clothes.dc.html:50` say ~15 sec. `index.html:153` tells her "big outfits take up to a minute" and the request is allowed to run 115 seconds (`index.html:156`) before it gives up.

**10. "Household … shared by up to 4 people" with no account anywhere.**
`Main.dc.html:153`. There is no sign-in, email, or code in any screen. How 4 people share a plan is unexplained. Same problem for "Packs never expire" (line 112) — expire for whom, tied to what, if there's no account?

**11. Free-look watermark and quality are described but never shown.**
`Main.dc.html:135` "Standard quality, small watermark"; `App-Result.dc.html:42` "no watermark". The free result artboard (`App-Result.dc.html:25-27`) shows no watermark, only a 10px "AI-GENERATED PREVIEW" corner label. She can't tell whether that label is the watermark, or what "standard" vs "HD" will look like on her phone.

**12. Save / Send / Swap item destinations are unstated.**
`App-Result.dc.html:32, 34, 36`. Save to camera roll? Send by text, share sheet, link? Swap item back to step 2 or a picker? The landing page says "text it to a friend" (`Main.dc.html:90`) but the button just says "Send". "Report this image" (`App-Result.dc.html:46`) is `href="#"` and goes nowhere.

**13. Step 1 lets her continue with nothing done.**
`App-You.dc.html:55` "Next: the clothes" is a plain link, active with no photo and the checkbox unticked. The landing page says she confirms 18+ "before every upload" (`Main.dc.html:168`), but the checkbox appears only on step 1, not on the clothes step. Is it required? For every photo? Once?

**14. Step 2 already has three items in it on first visit, and only an "Add item" tile.**
`App-Clothes.dc.html:36-40`. A first-time visitor arrives at an empty rack; the artboard shows [Top], [Jeans], [Jacket] pre-loaded with no indication whether these are samples or hers. Step 1 offered "Take photo" and "Library"; step 2 offers only "Add item" — camera or library? Where did the hanger photos come from?

**15. Shipped page's "Try it on" is greyed out with no explanation.**
`index.html:93` (`class="… off"`), enabled by `ready()` (`index.html:137`) only when a person photo exists and at least one item is selected. Nothing on screen says "add your photo and pick an item first". The "USES 1 LOOK" cost label from the design is absent, and there is no mention that anything costs anything.

**16. Shipped page shows debug text as the result caption.**
`index.html:160` — `'Understood: #1 top — ' + description` style output. To a shopper this reads like a system log, not a caption.

**17. Shipped page tip says "keep her current jeans".**
`index.html:90` placeholder. The landing page and step 1 are all "you / yourself"; this placeholder assumes she's dressing someone else and is the only place the product talks about a third person.

**18. Text sizes in the app are below the design's own readable minimum.**
`Style.dc.html:45` "16px minimum in the app". `App-You.dc.html:56` (11px), `App-Clothes.dc.html:49-50` (12px / 11px), `App-Result.dc.html:27` (10px "AI-GENERATED PREVIEW"). For a 30–55 year old on a phone under store lighting, the deletion notice, the look cost, and the "AI preview" disclaimer are the smallest text on the screen.

### Nit

**19. "Off-price", "resale", "HD", "watermark", "session", "HEIC".** `Main.dc.html:40, 68, 80, 135, 141`, `index.html:140`. "Off-price" is retail-trade wording; "session" is developer wording; "HEIC" is only meaningful because the shipped message also tells her where the iPhone setting is, which is fine.

**20. "Three taps, standing in the aisle" (`Main.dc.html:74`)** — the flow as drawn is photo, tick box, next, snap item(s), select, try it on. More than three.

**21. "No surprise weekly subscription" (`Main.dc.html:112`)** then two monthly subscriptions below it. Reads as a dig at competitors but a first-timer may wonder if "monthly" is the surprise.

**22. "LOOK 1 OF 3" badge (`App-Result.dc.html:26`)** sits where a "Step 3 of 3" progress label would be; easy to misread as the step counter, especially since the progress bar from steps 1–2 is gone on this screen.

**23. Footer placeholders.** `Main.dc.html:196` "[offtherack.app]" and line 198 "Privacy" / "Terms" / "Report a photo" all point to `#safety`; no actual privacy policy or terms exist for her to read.

**24. Shipped page visual language doesn't match the style sheet.** `index.html:11-13` uses Inter and an orange accent (#b4532a); `Style.dc.html` specifies Fraunces/Manrope and Merlot (#7A2434). Compounds finding 5 — nothing visual tells her this is the same product.

**25. "Add it to your home screen" (`Main.dc.html:179`)** — no how. The shipped page does explain it (`index.html:180`), so this is only a landing-page gap.

---

## Summary

The landing page explains the pitch, pricing and photo rules well enough that a first-timer can paraphrase them. The design breaks down at every transition: the landing page cannot reach the app, the app cannot reach a purchase, and the three states the task asked about (out of free looks, failure, buying) are absent from the artboards. The shipped page is a different product by name and drops every promise the landing page makes (free counter, 18+ gate, deletion, watermark, pricing), so a visitor who reads both cannot tell which set of rules is true.
