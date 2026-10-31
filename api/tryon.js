// POST /api/tryon  { person:{data,mime}, garments:[{data,mime}], note?:string }
// -> { image:"data:image/png;base64,...", plan:{...}, model }
export const config = { maxDuration: 120 };

const IMG_MODEL = process.env.GEMINI_MODEL || "gemini-2.5-flash-image";
const TXT_MODEL = process.env.GEMINI_TEXT_MODEL || "gemini-2.5-flash";
const API = (m, key) => `https://generativelanguage.googleapis.com/v1beta/models/${m}:generateContent?key=${key}`;
const img = (g) => ({ inline_data: { mime_type: g.mime || "image/jpeg", data: g.data } });

async function gemini(model, key, parts, generationConfig, timeoutMs = 90000) {
  const ctl = new AbortController(); const t = setTimeout(() => ctl.abort(), timeoutMs);
  let r;
  try {
    r = await fetch(API(model, key), { method: "POST", headers: { "content-type": "application/json" }, signal: ctl.signal,
      body: JSON.stringify({ contents: [{ role: "user", parts }], generationConfig }) });
  } catch (e) {
    if (e.name === "AbortError") throw Object.assign(new Error(`${model} took longer than ${Math.round(timeoutMs/1000)} s`), { status: 504, timeout: true });
    throw e;
  } finally { clearTimeout(t); }
  const j = await r.json();
  if (!r.ok) throw Object.assign(new Error(j?.error?.message || `HTTP ${r.status}`), { status: r.status });
  return j?.candidates?.[0]?.content?.parts || [];
}

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "POST only" });
  const key = process.env.GEMINI_API_KEY;
  if (!key) return res.status(503).json({ error: "setup", message: "GEMINI_API_KEY is not set on the server yet." });

  let body = req.body;
  if (typeof body === "string") { try { body = JSON.parse(body); } catch { return res.status(400).json({ error: "bad json" }); } }
  const { person, garments = [], note = "" } = body || {};
  if (!person?.data || !garments.length) return res.status(400).json({ error: "Need a person photo and at least one garment." });

  try {
    // ---- Step 1: understand the inputs (cheap text call) ----
    const p1 = [
      { text: "PHOTO A (the person):" }, img(person),
      ...garments.flatMap((g, i) => [{ text: `GARMENT ${i + 1}:` }, img(g)]),
      { text: `Return ONLY JSON, no markdown:
{"current":{"top":"...","bottom":"...","shoes":"...","outer":"..."},
 "garments":[{"n":1,"type":"top|bottom|dress|outerwear|shoes|accessory","description":"color, material, neckline/collar, sleeve length, fit, pattern, notable details","replaces":"top|bottom|top+bottom|outer|shoes|none"}]}
Describe PHOTO A's current clothing precisely (color, type, sleeve, fit). For each GARMENT describe it so a painter could reproduce it exactly, ignoring hangers, tags, racks and background.` }
    ];
    let plan = {};
    try {
      const t = await gemini(TXT_MODEL, key, p1, { temperature: 0.2, responseMimeType: "application/json" }, 20000);
      try { plan = JSON.parse(t.map(p => p.text || "").join("")); } catch {}
    } catch (e) { if (!e.timeout) throw e; console.warn("description step timed out; continuing without it"); }
    const cur = plan.current || {}; const gs = Array.isArray(plan.garments) ? plan.garments : [];

    // ---- Step 2: the edit, with explicit replace instructions ----
    const changes = gs.map(g => {
      const slot = g.replaces || g.type;
      const now = slot === "bottom" ? cur.bottom : slot === "shoes" ? cur.shoes : slot === "outer" ? cur.outer : slot === "top+bottom" ? `${cur.top} and ${cur.bottom}` : cur.top;
      return `• REMOVE the ${slot} she/he is wearing now (${now || "current " + slot}) and REPLACE it with GARMENT ${g.n}: ${g.description}.`;
    }).join("\n") || garments.map((_, i) => `• Replace the matching clothing with GARMENT ${i + 1}.`).join("\n");

    const p2 = [
      { text: "PHOTO A — the person to dress:" }, img(person),
      ...garments.flatMap((g, i) => [{ text: `GARMENT ${i + 1} — reference of the clothing item (ignore hanger, tag, rack, background):` }, img(g)]),
      { text: `TASK: Edit PHOTO A so the person is wearing the garment(s) below. This is a virtual try-on; the clothing MUST visibly change.
${changes}
KEEP IDENTICAL to PHOTO A: face, hair, skin tone, body shape, pose, hands, bag/watch/jewelry, the background, camera angle, framing and lighting. Any clothing not being replaced stays exactly as is.
RENDER the new garment(s) with their true color, pattern, material, length and fit from the reference image(s), draped naturally on the body with realistic folds and shadows. Returning PHOTO A unchanged is a failure.${note ? "\nUSER NOTE: " + note : ""}
Output only the edited image.` }
    ];
    const t0 = Date.now();
    const out = await gemini(IMG_MODEL, key, p2, { responseModalities: ["IMAGE", "TEXT"], temperature: 1.0 }, 85000);
    console.log(JSON.stringify({ evt: "tryon", model: IMG_MODEL, garments: garments.length, ms: Date.now() - t0 }));
    const im = out.find(p => p.inlineData || p.inline_data);
    const text = out.filter(p => p.text).map(p => p.text).join(" ").trim();
    if (!im) return res.status(422).json({ error: "noimage", message: text || "Model returned no image. Try a clearer full-body photo or a flat garment photo." });
    const d = im.inlineData || im.inline_data;
    res.status(200).json({ image: `data:${d.mimeType || d.mime_type || "image/png"};base64,${d.data}`, text, plan, model: IMG_MODEL });
  } catch (e) {
    console.error("tryon failed:", e.message);
    res.status(e.status && e.status >= 400 && e.status < 600 ? e.status : 502).json({ error: e.timeout ? "timeout" : "gemini", message: e.timeout ? "That one took too long. Tap Regenerate — it usually works on the second try." : e.message });
  }
}
