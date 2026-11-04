// Self-provisioning Stripe setup: whatever account STRIPE_SECRET_KEY belongs to, make sure our product, price,
// Payment Link and webhook endpoint exist there. Idempotent via lookup_key / metadata; results cached in Neon `settings`.
import Stripe from "stripe";
import { sql } from "./_looks.js";

const PACK_LOOKUP = "otr_pack_20", FOUNDING_LOOKUP = "otr_founding_10";
let cache = null;

async function setting(k, v) {
  if (!sql) return null;
  if (v === undefined) { const r = await sql`SELECT v FROM settings WHERE k = ${k}`; return r[0]?.v ?? null; }
  await sql`INSERT INTO settings (k, v) VALUES (${k}, ${v}) ON CONFLICT (k) DO UPDATE SET v = EXCLUDED.v`; return v;
}

async function ensurePrice(stripe, lookup, { name, description, amount, metadata }) {
  const found = await stripe.prices.list({ lookup_keys: [lookup], active: true, limit: 1 });
  if (found.data[0]) return found.data[0].id;
  const product = await stripe.products.create({ name, description, metadata, statement_descriptor: "OFFTHERACK", tax_code: "txcd_10103001" });
  const price = await stripe.prices.create({ product: product.id, unit_amount: amount, currency: "usd", lookup_key: lookup, transfer_lookup_key: true });
  return price.id;
}

export async function stripeConfig() {
  if (cache) return cache;
  const key = process.env.STRIPE_SECRET_KEY, base = process.env.APP_URL;
  if (!key || !base) return null;
  const stripe = new Stripe(key);
  const acct = await stripe.accounts.retrieve().then(a => a.id).catch(() => "unknown");
  const stored = await setting("stripe_cfg");
  if (stored) { try { const c = JSON.parse(stored); if (c.acct === acct) return (cache = { ...c, stripe }); } catch {} }

  const packPrice = await ensurePrice(stripe, PACK_LOOKUP, { name: "Pack of 20 looks", description: "20 full-resolution AI try-on looks. Never expire. Tied to the phone you buy on.", amount: 599, metadata: { app: "off-the-rack", looks: "20" } });
  const foundingPrice = await ensurePrice(stripe, FOUNDING_LOOKUP, { name: "Founding 10 — one year unlimited", description: "A full year of unlimited AI try-on looks (up to 15 a day). Founding-customer price, first 10 only.", amount: 3900, metadata: { app: "off-the-rack", unlimited_days: "365" } });

  // Founding 10 Payment Link (device code as a custom field), 10-use limit
  let founding_url = null;
  const links = await stripe.paymentLinks.list({ active: true, limit: 100 });
  const existing = links.data.find(l => l.metadata?.offer === "founding10");
  if (existing) founding_url = existing.url;
  else {
    const pl = await stripe.paymentLinks.create({ line_items: [{ price: foundingPrice, quantity: 1 }], metadata: { app: "off-the-rack", offer: "founding10" },
      custom_fields: [{ key: "device", label: { type: "custom", custom: "Your device code (shown in the app)" }, type: "text", optional: false }],
      after_completion: { type: "redirect", redirect: { url: `${base}/app?founding=1` } }, restrictions: { completed_sessions: { limit: 10 } } });
    founding_url = pl.url;
  }

  // Webhook endpoint → secret kept in Neon (Stripe only shows it once)
  let whsec = process.env.STRIPE_WEBHOOK_SECRET || null;
  const url = `${base}/api/stripe-webhook`;
  const hooks = await stripe.webhookEndpoints.list({ limit: 100 });
  const mine = hooks.data.find(h => h.url === url);
  const storedWh = await setting("stripe_whsec_" + acct);
  if (mine && storedWh) whsec = storedWh;
  else if (!mine) { const h = await stripe.webhookEndpoints.create({ url, enabled_events: ["checkout.session.completed"], description: "Off the Rack: credit looks after Checkout / Payment Link" }); whsec = h.secret; await setting("stripe_whsec_" + acct, whsec); }
  else if (mine && !storedWh && !whsec) { await stripe.webhookEndpoints.del(mine.id); const h = await stripe.webhookEndpoints.create({ url, enabled_events: ["checkout.session.completed"], description: "Off the Rack: credit looks (recreated)" }); whsec = h.secret; await setting("stripe_whsec_" + acct, whsec); }

  const cfg = { acct, packPrice, foundingPrice, founding_url, whsec };
  await setting("stripe_cfg", JSON.stringify(cfg));
  console.log(JSON.stringify({ evt: "stripe_bootstrap", acct, packPrice, foundingPrice }));
  return (cache = { ...cfg, stripe });
}
