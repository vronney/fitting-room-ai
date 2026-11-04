// GET /api/looks?device=<id>  -> { left, unlimited, free, paid }
import { getDevice, remaining, asJson, validDevice, sql } from "./_looks.js";
import { stripeConfig } from "./_stripe.js";

export default async function handler(req, res) {
  const id = req.query?.device;
  if (!validDevice(id)) return res.status(400).json({ error: "bad device" });
  if (!sql) return res.status(200).json({ left: null, unlimited: true, free: null, paid: null, note: "counter not configured" });
  try { let cfg = null; try { cfg = await stripeConfig(); } catch (e) { console.error("stripe bootstrap failed:", e.message); }
    res.status(200).json({ ...asJson(remaining(await getDevice(id))), packs: !!cfg, founding_url: cfg?.founding_url || process.env.FOUNDING_PAYMENT_LINK || null }); }
  catch (e) { console.error("looks failed:", e.message); res.status(502).json({ error: "db" }); }
}
