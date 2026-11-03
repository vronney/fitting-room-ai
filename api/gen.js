// TEMPORARY, token-gated: text-to-image for marketing assets (synthetic shopper for the landing hero). Remove after use.
export const config = { maxDuration: 120 };
const MODEL = process.env.GEMINI_MODEL || "gemini-2.5-flash-image";
export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end();
  if (!process.env.ADMIN_TOKEN || req.headers["x-admin-token"] !== process.env.ADMIN_TOKEN) return res.status(404).end();
  let body = req.body; if (typeof body === "string") { try { body = JSON.parse(body); } catch { body = {}; } }
  const prompt = String(body.prompt || "").slice(0, 2000); if (!prompt) return res.status(400).json({ error: "prompt" });
  const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${process.env.GEMINI_API_KEY}`, { method: "POST", headers: { "content-type": "application/json" },
    body: JSON.stringify({ contents: [{ role: "user", parts: [{ text: prompt }] }], generationConfig: { responseModalities: ["IMAGE", "TEXT"], temperature: body.temperature ?? 1.0, imageConfig: body.aspect ? { aspectRatio: body.aspect } : undefined } }) });
  const j = await r.json(); if (!r.ok) return res.status(r.status).json({ error: j?.error?.message || r.status });
  const parts = j?.candidates?.[0]?.content?.parts || []; const im = parts.find(p => p.inlineData || p.inline_data);
  if (!im) return res.status(422).json({ error: "noimage", text: parts.map(p => p.text).join(" "), finish: j?.candidates?.[0]?.finishReason });
  const d = im.inlineData || im.inline_data; res.status(200).json({ image: `data:${d.mimeType || d.mime_type || "image/png"};base64,${d.data}` });
}
