// Looks counter backed by Neon Postgres (HTTP driver; no connection pool to manage).
// A look = every request that returns an image (Try again included). Errors, blocks and cancels are free.
import { neon } from "@neondatabase/serverless";

const FREE = parseInt(process.env.FREE_LOOKS || "3", 10);
const GLOBAL_CAP = parseInt(process.env.DAILY_GLOBAL_CAP || "400", 10);
const DEVICE_RE = /^[a-z0-9-]{16,64}$/;

export const sql = process.env.DATABASE_URL ? neon(process.env.DATABASE_URL) : null;
export const validDevice = (d) => typeof d === "string" && DEVICE_RE.test(d);

export function remaining(row) {
  if (!row) return { left: FREE, unlimited: false };
  const unlimited = row.unlimited_until && new Date(row.unlimited_until) > new Date();
  return { left: unlimited ? Infinity : row.free_left + row.paid_left, unlimited, paid: row.paid_left, free: row.free_left };
}

// Ensure the device row exists; return its counters.
export async function getDevice(id) {
  if (!sql) return null;
  const rows = await sql`INSERT INTO devices (id) VALUES (${id}) ON CONFLICT (id) DO UPDATE SET last_seen = now() RETURNING *`;
  return rows[0];
}

// Throws { nolooks } or { cap } when the device or the whole service is out of budget.
export async function checkBudget(id) {
  if (!sql) return { left: Infinity, unlimited: true, row: null };
  const row = await getDevice(id);
  if (row.blocked) throw Object.assign(new Error("blocked device"), { status: 422, blocked: true });
  const r = remaining(row);
  if (r.left <= 0) throw Object.assign(new Error("no looks left"), { status: 402, nolooks: true, left: 0 });
  const [{ n }] = await sql`SELECT count(*)::int AS n FROM looks WHERE outcome = 'ok' AND at > date_trunc('day', now())`;
  if (n >= GLOBAL_CAP) throw Object.assign(new Error("global cap"), { status: 503, cap: true, global: true });
  return { ...r, row };
}

// Record the outcome; decrement only on 'ok'. Returns looks remaining after this call.
export async function record(id, { outcome, ms, garments, ip }) {
  if (!sql) return null;
  await sql`INSERT INTO looks (device_id, outcome, ms, garments, ip) VALUES (${id}, ${outcome}, ${ms ?? null}, ${garments ?? null}, ${ip ?? null})`;
  if (outcome !== "ok") { const r = await getDevice(id); return remaining(r); }
  const rows = await sql`UPDATE devices SET
      free_left = CASE WHEN unlimited_until > now() THEN free_left WHEN free_left > 0 THEN free_left - 1 ELSE free_left END,
      paid_left = CASE WHEN unlimited_until > now() THEN paid_left WHEN free_left > 0 THEN paid_left WHEN paid_left > 0 THEN paid_left - 1 ELSE paid_left END,
      last_seen = now()
    WHERE id = ${id} RETURNING *`;
  return remaining(rows[0]);
}

export const asJson = (r) => ({ left: r.unlimited ? null : r.left, unlimited: !!r.unlimited, free: r.free ?? null, paid: r.paid ?? null });
