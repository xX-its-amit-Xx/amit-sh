// Build the knowledge graph from an Obsidian vault stored in a GitHub repo.
// Conventions (see INTEGRATION.md §4):
//   • a note joins the graph only if frontmatter has `site: true`
//   • frontmatter `category:` → node color (self|research|project|community|skill|value|life)
//   • optional `page:` → makes the node click through to that site section
//   • optional `blurb:` (else first non-heading line) → hover text
//   • every [[wikilink]] between two site:true notes → an edge
// Ready but inert until cfg.obsidian.repo is set.
import { fetchJson, log } from "./lib.mjs";

function parseFrontmatter(md) {
  const m = md.match(/^---\n([\s\S]*?)\n---/);
  if (!m) return { fm: {}, body: md };
  const fm = {};
  for (const line of m[1].split("\n")) {
    const kv = line.match(/^([A-Za-z0-9_]+):\s*(.*)$/);
    if (kv) fm[kv[1]] = kv[2].replace(/^["']|["']$/g, "").trim();
  }
  return { fm, body: md.slice(m[0].length) };
}

function firstLine(body) {
  for (const line of body.split("\n")) {
    const t = line.trim();
    if (t && !t.startsWith("#") && !t.startsWith("[[")) return t.replace(/[[\]]/g, "").slice(0, 140);
  }
  return "";
}

// Exported for local unit-testing against sample files (no network).
export function buildGraph(files) {
  // files: [{ title, md }]  (title = filename without .md)
  const notes = files.map((f) => ({ title: f.title, ...parseFrontmatter(f.md) }));
  const site = notes.filter((n) => String(n.fm.site).toLowerCase() === "true");
  const titles = new Set(site.map((n) => n.title.toLowerCase()));

  const idOf = (title) => title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  const nodes = site.map((n) => ({
    id: idOf(n.title),
    label: n.title,
    cat: n.fm.category || "life",
    page: n.fm.page || null,
    size: n.fm.size ? Number(n.fm.size) : 1.5,
    blurb: n.fm.blurb || firstLine(n.body),
  }));

  const edgeSet = new Set();
  const edges = [];
  for (const n of site) {
    const links = [...n.body.matchAll(/\[\[([^\]|#]+)(?:[|#][^\]]*)?\]\]/g)].map((m) => m[1].trim());
    for (const target of links) {
      if (titles.has(target.toLowerCase())) {
        const a = idOf(n.title);
        const b = idOf(target);
        const key = [a, b].sort().join("|");
        if (a !== b && !edgeSet.has(key)) {
          edgeSet.add(key);
          edges.push([a, b]);
        }
      }
    }
  }
  return { nodes, edges };
}

export async function fetchObsidian(cfg) {
  const o = cfg.obsidian || {};
  if (!o.repo) {
    log("obsidian: no vault repo configured, skipping (graph stays from data.js)");
    return null;
  }
  const token = process.env[o.tokenEnv || "VAULT_TOKEN"];
  const headers = { Accept: "application/vnd.github+json" };
  if (token) headers.Authorization = `Bearer ${token}`;
  const branch = o.branch || "main";

  // list all markdown files via the git tree API, then fetch raw contents
  const tree = await fetchJson(
    `https://api.github.com/repos/${o.repo}/git/trees/${branch}?recursive=1`,
    headers
  );
  const mdPaths = (tree.tree || []).filter((t) => t.type === "blob" && t.path.endsWith(".md"));
  const files = [];
  for (const f of mdPaths) {
    const raw = await fetch(
      `https://raw.githubusercontent.com/${o.repo}/${branch}/${f.path}`,
      { headers: token ? { Authorization: `Bearer ${token}` } : {} }
    );
    if (!raw.ok) continue;
    const md = await raw.text();
    if (!/site:\s*true/i.test(md)) continue; // cheap prefilter
    files.push({ title: f.path.split("/").pop().replace(/\.md$/, ""), md });
  }
  const graph = buildGraph(files);
  if (!graph.nodes.length) {
    log("obsidian: 0 site:true notes found, skipping");
    return null;
  }
  // carry category colors from data.js convention
  const categories = {
    self: { label: "me", color: "#C49060" },
    research: { label: "research", color: "#8B9D77" },
    project: { label: "projects", color: "#7FA6C4" },
    community: { label: "community", color: "#C4907F" },
    skill: { label: "skills", color: "#B79FC4" },
    value: { label: "values", color: "#D4A574" },
    life: { label: "life", color: "#9FC4A8" },
  };
  log(`obsidian: ${graph.nodes.length} nodes, ${graph.edges.length} edges from ${o.repo}`);
  return { ...graph, categories, fetchedAt: new Date().toISOString() };
}
