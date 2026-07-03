// Pull Notion content at build time:
//   • meal database → rows with per-property facets (for the same filters as Notion)
//   • workout page  → the page's block tree, rendered natively on the site
//     (the page can't be iframed — Notion sends frame-ancestors 'self').
// Requires NOTION_TOKEN. DB/page ids are auto-discovered or set in config.
import { log } from "./lib.mjs";

const NOTION_VERSION = "2022-06-28";
const headers = (token) => ({ Authorization: `Bearer ${token}`, "Notion-Version": NOTION_VERSION, "Content-Type": "application/json" });

const titleOf = (db) => (db.title || []).map((t) => t.plain_text).join("").toLowerCase();
function plain(prop) {
  if (!prop) return "";
  if (prop.title) return prop.title.map((t) => t.plain_text).join("");
  if (prop.rich_text) return prop.rich_text.map((t) => t.plain_text).join("");
  if (prop.select) return prop.select?.name || "";
  if (prop.status) return prop.status?.name || "";
  if (prop.number != null) return String(prop.number);
  if (prop.url) return prop.url;
  return "";
}

async function listDatabases(token) {
  const res = await fetch("https://api.notion.com/v1/search", {
    method: "POST", headers: headers(token),
    body: JSON.stringify({ filter: { property: "object", value: "database" }, page_size: 100 }),
  });
  if (!res.ok) throw new Error(`notion search ${res.status}`);
  return (await res.json()).results || [];
}
const matchDb = (dbs, keywords) => dbs.find((d) => keywords.some((k) => titleOf(d).includes(k)));

const DETAIL_KEYS = ["Detail", "Notes", "Description", "Summary", "Estimated Macros", "Ingredients", "Recipe Steps"];
function bestDetail(props) {
  for (const k of DETAIL_KEYS) { const v = plain(props[k]); if (v) return v.slice(0, 220); }
  for (const k of Object.keys(props)) if (props[k].type === "rich_text") { const v = plain(props[k]); if (v) return v.slice(0, 220); }
  return "";
}
// Every select / multi-select / status property becomes a filterable facet,
// keyed by its Notion property name — so the site filters mirror Notion's.
function facetsOf(props) {
  const f = {};
  for (const k of Object.keys(props)) {
    const pr = props[k];
    if (pr.type === "multi_select") { const v = pr.multi_select.map((o) => o.name); if (v.length) f[k] = v; }
    else if (pr.type === "select" && pr.select) f[k] = [pr.select.name];
    else if (pr.type === "status" && pr.status) f[k] = [pr.status.name];
  }
  return f;
}

async function queryDb(id, token) {
  const rows = [];
  let cursor;
  do {
    const res = await fetch(`https://api.notion.com/v1/databases/${id}/query`, {
      method: "POST", headers: headers(token),
      body: JSON.stringify({ page_size: 100, start_cursor: cursor }),
    });
    if (!res.ok) throw new Error(`notion query ${res.status} for db ${id}`);
    const j = await res.json();
    rows.push(...j.results);
    cursor = j.has_more ? j.next_cursor : null;
  } while (cursor);
  return rows
    .map((page) => {
      const props = page.properties || {};
      const nameKey = Object.keys(props).find((k) => props[k].type === "title") || "Name";
      const facets = facetsOf(props);
      const tags = [...new Set(Object.values(facets).flat())].slice(0, 6);
      return { name: plain(props[nameKey]), detail: bestDetail(props), tags, facets, link: page.url };
    })
    .filter((x) => x.name);
}

// ── Workout page → block tree ────────────────────────────────────────────────
const rich = (rt) => (rt || []).map((t) => ({
  t: t.plain_text, b: !!t.annotations?.bold, i: !!t.annotations?.italic,
  c: !!t.annotations?.code, s: !!t.annotations?.strikethrough, href: t.href || null,
}));

function serializeBlock(b) {
  const type = b.type;
  const d = b[type] || {};
  const node = { type };
  if (d.rich_text) node.rt = rich(d.rich_text);
  if (type === "to_do") node.checked = !!d.checked;
  if (type === "code") node.language = d.language || "";
  if (type === "child_page") node.title = d.title || "";
  if (type === "callout") node.icon = d.icon?.emoji || "💡";
  if (type === "table") { node.width = d.table_width; node.hasHeader = !!d.has_column_header; }
  if (type === "table_row") node.cells = (d.cells || []).map((c) => rich(c));
  if (type === "image") { node.url = d.file?.url || d.external?.url || null; node.caption = rich(d.caption); }
  return node;
}

async function fetchBlocks(blockId, token, depth, budget) {
  const out = [];
  let cursor;
  do {
    const url = new URL(`https://api.notion.com/v1/blocks/${blockId}/children`);
    url.searchParams.set("page_size", "100");
    if (cursor) url.searchParams.set("start_cursor", cursor);
    const res = await fetch(url, { headers: headers(token) });
    if (!res.ok) throw new Error(`notion blocks ${res.status}`);
    const j = await res.json();
    out.push(...j.results);
    cursor = j.has_more ? j.next_cursor : null;
  } while (cursor);

  const nodes = [];
  for (const b of out) {
    if (budget.n <= 0) break;
    budget.n -= 1;
    const node = serializeBlock(b);
    if ((b.has_children || b.type === "child_page") && depth > 0) {
      node.children = await fetchBlocks(b.id, token, depth - 1, budget);
    }
    nodes.push(node);
  }
  return nodes;
}

export async function fetchWorkout(cfg) {
  const token = process.env.NOTION_TOKEN;
  const pageId = (cfg.notion || {}).workoutPageId;
  if (!token || !pageId) { log("workout: token or workoutPageId missing, skipping"); return null; }
  const budget = { n: 600 };
  const blocks = await fetchBlocks(pageId, token, 4, budget);
  if (!blocks.length) { log("workout: 0 blocks (is the page shared with the integration?)"); return null; }
  log(`workout: ${blocks.length} top-level blocks (${600 - budget.n} total)`);
  return { title: (cfg.notion || {}).workoutTitle || "Periodized Plan", url: (cfg.notion || {}).workoutUrl || null, blocks, fetchedAt: new Date().toISOString() };
}

export async function fetchNotion(cfg) {
  const token = process.env.NOTION_TOKEN;
  if (!token) { log("notion: NOTION_TOKEN missing, skipping"); return null; }
  const n = cfg.notion || {};
  let mealsId = process.env[n.mealsDbEnv || "NOTION_MEALS_DB"];
  let workoutsId = process.env[n.workoutsDbEnv || "NOTION_WORKOUTS_DB"];
  if (!mealsId || !workoutsId) {
    const dbs = await listDatabases(token);
    if (!dbs.length) { log("notion: integration sees 0 databases — share them with the integration, then rebuild."); return null; }
    if (!mealsId) mealsId = matchDb(dbs, ["meal", "recipe", "food", "nutrition"])?.id;
    if (!workoutsId) workoutsId = matchDb(dbs, ["workout", "exercise", "lift", "training", "gym"])?.id;
    log(`notion: discovered ${dbs.length} shared db(s); meals=${mealsId ? "yes" : "no"} workouts=${workoutsId ? "yes" : "no"}`);
  }
  const meals = mealsId ? await queryDb(mealsId, token) : [];
  const workouts = workoutsId ? await queryDb(workoutsId, token) : [];
  if (!meals.length && !workouts.length) { log("notion: 0 rows found, skipping"); return null; }
  log(`notion: ${meals.length} meals, ${workouts.length} workouts`);
  return { meals, workouts, fetchedAt: new Date().toISOString() };
}
