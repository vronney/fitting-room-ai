// POST /api/stripe-webhook — checkout.session.completed → credit the device. Idempotent on session id.
import Stripe from "stripe";
import { sql, validDevice, getDevice } from "./_looks.js";

export const config = { api: { bodyParser: false } };

const rawBody = (req) => new Promise((res, rej) => { const c = []; req.on("data", (d) => c.push(d)); req.on("end", () => res(Buffer.concat(c))); req.on("error", rej); });

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end();
  const key = process.env.STRIPE_SECRET_KEY, whsec = process.env.STRIPE_WEBHOOK_SECRET;
  if (!key || !whsec || !sql) return res.status(503).json({ error: "setup" });
  const stripe = new Stripe(key);
  let event;
  try { event = stripe.webhooks.constructEvent(await rawBody(req), req.headers["stripe-signature"], whsec); }
  catch (e) { console.warn("bad signature:", e.message); return res.status(400).json({ error: "signature" }); }
  if (event.type !== "checkout.session.completed") return res.status(200).json({ ignored: event.type });

  const s = event.data.object;
  if (s.payment_status !== "paid") return res.status(200).json({ ignored: "unpaid" });

  // Which device? Checkout: client_reference_id. Payment Link: the "device" custom field.
  const field = (s.custom_fields || []).find((f) => f.key === "device");
  const device = (s.client_reference_id || field?.text?.value || "").trim().toLowerCase();
  const kind = s.metadata?.offer === "founding10" || s.metadata?.unlimited_days ? "founding" : "pack";
  const email = s.customer_details?.email || s.customer_email || null;

  if (!validDevice(device)) {
    console.error(JSON.stringify({ evt: "payment_unmatched", session: s.id, email, kind }));
    await sql`INSERT INTO payments (session_id, device_id, kind, amount, currency, email, raw) VALUES (${s.id}, NULL, ${kind + "_unmatched"}, ${s.amount_total}, ${s.currency}, ${email}, ${JSON.stringify({ custom_fields: s.custom_fields, ref: s.client_reference_id })}) ON CONFLICT DO NOTHING`;
    return res.status(200).json({ ok: true, unmatched: true }); // 200 so Stripe stops retrying; fix by hand from the log
  }

  await getDevice(device);
  const ins = await sql`INSERT INTO payments (session_id, device_id, kind, amount, currency, email) VALUES (${s.id}, ${device}, ${kind}, ${s.amount_total}, ${s.currency}, ${email}) ON CONFLICT (session_id) DO NOTHING RETURNING session_id`;
  if (!ins.length) return res.status(200).json({ ok: true, duplicate: true });

  if (kind === "founding") await sql`UPDATE devices SET unlimited_until = GREATEST(coalesce(unlimited_until, now()), now()) + interval '365 days' WHERE id = ${device}`;
  else await sql`UPDATE devices SET paid_left = paid_left + 20 WHERE id = ${device}`;
  console.log(JSON.stringify({ evt: "payment", kind, device, amount: s.amount_total, session: s.id }));
  res.status(200).json({ ok: true, kind });
}
