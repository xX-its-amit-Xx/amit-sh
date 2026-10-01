// Build the chatbot's knowledge base: text from Amit's other sites and his
// Notion recipes/workouts, cut into small passages that api/chat.js searches
// per question (retrieval-augmented generation). Runs last in build-data.mjs so
// it can read the freshly generated wellness/workout JSON.
//
// Sites come from integrations.config.json → chatKnowledge.sites:
//   { name, url, maxPages?, extraScripts? }
// Pages are fetched as plain HTML (no browser), so text that a site renders
// with JavaScript only appears if its data file is listed in extraScripts.
import { writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { readGenerated, log } from "./lib.mjs";

const OUT = join(dirname(fileURLToPath(import.meta.url)), "..", "api", "_knowledge.js");
const UA = "Mozilla/5.0 (compatible; amit-sh-builder/1.0; +https://amit-sh.vercel.app)";
const CHUNK = 700;

async function get(url) {
  const r = await fetch(url, { headers: { "User-Agent": UA }, signal: AbortSignal.timeout(12000), redirect: "follow" });
  if (!r.ok) throw new Error(`${r.status} for ${url}`);
  return { text: await r.text(), url: r.url };
}

const decode = (s) => s
  .replace(/&nbsp;/g, " ").replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">")
  .replace(/&quot;/g, '"').replace(/&#39;|&apos;/g, "'").replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(+n));

// HTML → readable text: title, meta descriptions, JSON-LD descriptions, body.
export function htmlToText(html) {
  const bits = [];
  const title = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1];
  if (title) bits.push(decode(title.trim()));
  for (const m of html.matchAll(/<meta[^>]+(?:name|property)=["'](?:description|og:description)["'][^>]*>/gi)) {
    const c = m[0].match(/content=["']([^"']*)["']/i)?.[1];
    if (c) bits.push(decode(c));
  }
  for (const m of html.matchAll(/<script[^>]+application\/ld\+json[^>]*>([\s\S]*?)<\/script>/gi)) {
    for (const d of m[1].matchAll(/"(?:description|slogan|name)"\s*:\s*"([^"]{8,})"/g)) bits.push(d[1]);
  }
  const body = html
    .replace(/<(script|style|noscript|svg|template)[^>]*>[\s\S]*?<\/\1>/gi, " ")
    .replace(/<!--[\s\S]*?-->/g, " ")
    .replace(/<\/(p|div|h[1-6]|li|section|article|br|tr|dd|dt)>/gi, "\n")
    .replace(/<[^>]+>/g, " ");
  bits.push(decode(body));
  return [...new Set(bits)].join("\n").replace(/[ \t]+/g, " ").replace(/\n\s*\n+/g, "\n").trim();
}

// Human-readable string literals from a JS data file (e.g. a game catalog).
export function scriptStrings(js) {
  const out = new Set();
  for (const m of js.matchAll(/(["'`])((?:\\.|(?!\1)[^\\\n]){12,400})\1/g)) {
    const s = m[2].replace(/\\n/g, " ").replace(/\\(.)/g, "$1").trim();
    if (/\s/.test(s) && /[a-z]{3}/i.test(s) && !/^[\w-]+(\s[\w-]+)?$/.test(s) && !/[{}<>;=]|https?:/.test(s)) out.add(s);
  }
  return [...out].join("\n");
}

function sameSiteLinks(html, base) {
  const origin = new URL(base).origin;
  const links = new Set();
  for (const m of html.matchAll(/<a[^>]+href=["']([^"'#]+)["']/gi)) {
    try {
      const u = new URL(m[1], base);
      if (u.origin === origin && !/\.(png|jpe?g|gif|svg|webp|pdf|zip|css|js|xml|ico)$/i.test(u.pathname)) {
        u.hash = ""; links.add(u.href);
      }
    } catch { /* ignore bad hrefs */ }
  }
  return [...links];
}

function chunk(source, url, text) {
  const out = [];
  const paras = text.split("\n").map((p) => p.trim()).filter((p) => p.length > 2);
  let buf = "";
  for (const p of paras) {
    if (buf && (buf + "\n" + p).length > CHUNK) { out.push({ source, url, text: buf }); buf = ""; }
    buf = buf ? buf + "\n" + p : p.slice(0, CHUNK * 2);
  }
  if (buf) out.push({ source, url, text: buf });
  return out;
}

async function crawlSite(site) {
  const seen = new Set();
  const queue = [site.url];
  const chunks = [];
  const max = site.maxPages || 6;
  while (queue.length && seen.size < max) {
    const url = queue.shift();
    if (seen.has(url)) continue;
    seen.add(url);
    try {
      const { text: html, url: finalUrl } = await get(url);
      chunks.push(...chunk(site.name, finalUrl, htmlToText(html)));
      for (const l of sameSiteLinks(html, finalUrl)) if (!seen.has(l)) queue.push(l);
    } catch (e) {
      log(`knowledge: ${site.name} — ${e.message}`);
    }
  }
  for (const path of site.extraScripts || []) {
    try {
      const { text } = await get(new URL(path, site.url).href);
      chunks.push(...chunk(site.name, site.url, scriptStrings(text)));
    } catch (e) {
      log(`knowledge: ${site.name} script ${path} — ${e.message}`);
    }
  }
  return chunks;
}

// Notion workout page blocks → indented text, split at headings.
function blocksToText(blocks, depth = 0) {
  const lines = [];
  for (const b of blocks || []) {
    const t = (b.rt || []).map((r) => r.t).join("") || b.title || "";
    if (b.type === "table_row") lines.push((b.cells || []).map((c) => c.map((r) => r.t).join("")).join(" | "));
    else if (/^heading/.test(b.type)) lines.push("\n" + t);
    else if (t) lines.push("  ".repeat(depth) + (b.type === "to_do" ? "- [ ] " : /list/.test(b.type) ? "- " : "") + t);
    if (b.children) lines.push(blocksToText(b.children, depth + 1));
  }
  return lines.join("\n");
}

export async function fetchKnowledge(cfg) {
  const sites = cfg.chatKnowledge?.sites || [];
  const chunks = [];
  for (const site of sites) {
    const c = await crawlSite(site);
    log(`knowledge: ${site.name} → ${c.length} passages`);
    chunks.push(...c);
  }

  const wellness = await readGenerated("wellness.json");
  const meals = wellness?.meals || [];
  if (meals.length) {
    chunks.push({ source: "Recipes (Wellness page)", url: null, text: "Amit's recipes: " + meals.map((m) => m.name).join("; ") });
    for (const m of meals) {
      const facets = Object.entries(m.facets || {}).map(([k, v]) => `${k}: ${v.join(", ")}`).join(". ");
      chunks.push({ source: "Recipes (Wellness page)", url: m.link || null, text: `Recipe: ${m.name}. ${m.detail || ""} ${facets}`.trim() });
    }
  }
  const workout = await readGenerated("workout.json");
  if (workout?.blocks?.length) {
    const text = `${workout.title || "Workout plan"}\n${blocksToText(workout.blocks)}`;
    chunks.push(...chunk(`Workout plan: ${workout.title || "Periodized Plan"}`, workout.url || null, text));
  }
  log(`knowledge: ${meals.length} recipes, ${workout?.blocks?.length ? "workout plan" : "no workout plan"}`);

  if (!chunks.length) { log("knowledge: nothing collected, keeping last good copy"); return null; }
  const body = `// Generated by scripts/fetch-knowledge.mjs at build time — do not edit.\n// Passages the chatbot searches per question (see api/chat.js).\nexport default ${JSON.stringify({ fetchedAt: new Date().toISOString(), chunks }, null, 1)};\n`;
  await writeFile(OUT, body);
  log(`✓ wrote api/_knowledge.js (${chunks.length} passages, ${Math.round(body.length / 1024)} KB)`);
  return null; // written directly (it lives next to the function, not in src/generated)
}
