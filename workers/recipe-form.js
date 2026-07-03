// ── Cloudflare Worker: form → Notion ─────────────────────────────────────────
// Receives the Wellness "suggest a recipe/workout" form and creates a page in a
// Notion database. The Notion token lives ONLY here (as a Worker secret), never
// in the website. Free tier is plenty.
//
// Anti-spam, cheapest → strongest:
//   1. Honeypot field  — a hidden `website` input; real users leave it blank,
//      bots fill it. Filled → we silently accept and drop.
//   2. Cloudflare Turnstile — a free, privacy-friendly CAPTCHA. If TURNSTILE_SECRET
//      is set, the form must send a valid token.
//   3. Length caps + required fields.
//   4. Optional per-IP rate limit via a KV namespace (see wrangler.toml note).
//
// Deploy:  npm i -g wrangler && wrangler deploy
// Secrets: wrangler secret put NOTION_TOKEN
//          wrangler secret put NOTION_SUGGESTIONS_DB   (the target database id)
//          wrangler secret put TURNSTILE_SECRET        (optional)
// Then set FORM_ENDPOINT in src/pages.jsx to the deployed Worker URL.

const json = (obj, status, cors) =>
  new Response(JSON.stringify(obj), { status, headers: { "Content-Type": "application/json", ...cors } });

async function verifyTurnstile(token, secret, ip) {
  if (!token) return false;
  const form = new FormData();
  form.append("secret", secret);
  form.append("response", token);
  if (ip) form.append("remoteip", ip);
  const r = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", { method: "POST", body: form });
  const data = await r.json();
  return !!data.success;
}

export default {
  async fetch(request, env) {
    const cors = {
      "Access-Control-Allow-Origin": env.ALLOWED_ORIGIN || "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    };
    if (request.method === "OPTIONS") return new Response(null, { headers: cors });
    if (request.method !== "POST") return json({ error: "method not allowed" }, 405, cors);

    let body;
    try { body = await request.json(); } catch { return json({ error: "bad json" }, 400, cors); }

    // 1) honeypot — pretend success, drop silently
    if (body.website) return json({ ok: true }, 200, cors);

    // 2) Turnstile (if configured)
    if (env.TURNSTILE_SECRET) {
      const ok = await verifyTurnstile(body.token, env.TURNSTILE_SECRET, request.headers.get("CF-Connecting-IP"));
      if (!ok) return json({ error: "captcha failed" }, 403, cors);
    }

    // 3) validate + cap lengths
    const name = String(body.name || "").trim().slice(0, 200);
    const details = String(body.details || "").trim().slice(0, 2000);
    const type = String(body.type || "recipe").slice(0, 20);
    const email = String(body.email || "").trim().slice(0, 200);
    if (!name || !details) return json({ error: "missing fields" }, 400, cors);

    // 4) optional per-IP rate limit (needs a KV binding named RL; safe if absent)
    if (env.RL) {
      const ip = request.headers.get("CF-Connecting-IP") || "anon";
      const key = `rl:${ip}`;
      const count = parseInt((await env.RL.get(key)) || "0", 10);
      if (count >= 5) return json({ error: "slow down" }, 429, cors);
      await env.RL.put(key, String(count + 1), { expirationTtl: 3600 });
    }

    // Write a row to the "Meal Prep Suggestions" database. Column names match the
    // database you created: Recipe Name (title), Email (email),
    // Details/Link/Instructions (rich_text). The details field is prefixed with
    // the suggestion type so recipe vs workout is still distinguishable.
    const properties = {
      "Recipe Name": { title: [{ text: { content: name } }] },
      "Details/Link/Instructions": { rich_text: [{ text: { content: `[${type}] ${details}` } }] },
    };
    if (email) properties["Email"] = { email };

    const res = await fetch("https://api.notion.com/v1/pages", {
      method: "POST",
      headers: { Authorization: `Bearer ${env.NOTION_TOKEN}`, "Notion-Version": "2022-06-28", "Content-Type": "application/json" },
      body: JSON.stringify({ parent: { database_id: env.NOTION_SUGGESTIONS_DB }, properties }),
    });
    if (!res.ok) return json({ error: "notion write failed", status: res.status }, 502, cors);
    return json({ ok: true }, 200, cors);
  },
};
