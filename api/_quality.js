// Result-quality gate: did the model EDIT the photo (good) or RE-RENDER the scene (bad), and did the clothes change at all?
// Cheap pixel statistics with sharp; no ML. Numbers are logged on every try-on so thresholds can be tuned from real traffic.
import sharp from "sharp";

const SZ = 96; // comparison resolution

async function gray(buf) {
  const { data, info } = await sharp(buf).rotate().resize(SZ, SZ, { fit: "fill" }).grayscale().raw().toBuffer({ resolveWithObject: true });
  return { data, w: info.width, h: info.height };
}
const mad = (a, b, idx) => { let s = 0; for (const i of idx) s += Math.abs(a[i] - b[i]); return s / idx.length; };

export async function meta(buf) { const m = await sharp(buf).metadata(); return { w: m.width, h: m.height }; }

// Returns { border, center, full, aspect } — mean absolute gray difference (0-255) for the outer frame
// (background should barely change), the torso box (should change), the whole image, and the aspect-ratio drift.
export async function compare(inBuf, outBuf) {
  const [a, b, ma, mb] = await Promise.all([gray(inBuf), gray(outBuf), meta(inBuf), meta(outBuf)]);
  const border = [], center = [];
  for (let y = 0; y < SZ; y++) for (let x = 0; x < SZ; x++) {
    const i = y * SZ + x;
    const edge = x < SZ * 0.12 || x >= SZ * 0.88 || y < SZ * 0.08 || y >= SZ * 0.95;
    if (edge) border.push(i);
    else if (x >= SZ * 0.3 && x < SZ * 0.7 && y >= SZ * 0.2 && y < SZ * 0.8) center.push(i);
  }
  const all = Array.from({ length: SZ * SZ }, (_, i) => i);
  const aspect = Math.abs((ma.w / ma.h) / (mb.w / mb.h) - 1);
  return { border: +mad(a.data, b.data, border).toFixed(1), center: +mad(a.data, b.data, center).toFixed(1), full: +mad(a.data, b.data, all).toFixed(1), aspect: +aspect.toFixed(3) };
}

// Verdict: "ok" | "scene" (background/framing changed) | "unchanged" (nothing happened)
export function judge(q) {
  if (q.aspect > 0.08 || q.border > 28) return "scene";
  if (q.full < 2.5 && q.center < 4) return "unchanged";
  return "ok";
}
