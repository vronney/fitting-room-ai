// POST /api/checkout { device } -> { url }   Stripe-hosted Checkout for the Pack of 20.
import { validDevice, getDevice, sql } from "./_looks.js";
import { stripeConfig } from "./_stripe.js";

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "POST only" });
  const base = process.env.APP_URL;
  let cfg = null; try { cfg = await stripeConfig(); } catch (e) { console.error("stripe bootstrap failed:", e.message); }
  if (!cfg || !sql) return res.status(503).json({ error: "setup", message: "Packs aren't on sale yet." });
  let body = req.body; if (typeof body === "string") { try { body = JSON.parse(body); } catch { body = {}; } }
  const device = body?.device;
  if (!validDevice(device)) return res.status(400).json({ error: "bad device" });
  try {
    await getDevice(device); // make sure the row exists before money moves
    const session = await cfg.stripe.checkout.sessions.create({
      mode: "payment",
      line_items: [{ price: cfg.packPrice, quantity: 1 }],
      client_reference_id: device,
      metadata: { app: "off-the-rack", device, looks: "20" },
      success_url: `${base}/app?paid=1&cs={CHECKOUT_SESSION_ID}`,
      cancel_url: `${base}/app?paid=0`,
      allow_promotion_codes: true,
    });
    res.status(200).json({ url: session.url });
  } catch (e) {
    console.error("checkout failed:", e.message);
    res.status(502).json({ error: "stripe", message: "Couldn't start checkout. Try again in a moment." });
  }
}
