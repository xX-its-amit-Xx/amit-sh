# amit.sh — Self-Update & Integration Guide

The site is **living and self-updating**. Content comes from two places:

1. **`src/data.js`** — the hand-written source of truth (edit + push to change the site).
2. **External sources** — GitHub, Substack, Notion, and an Obsidian vault, pulled
   in automatically at **build time** and written to `src/generated/*.json`.

A GitHub Action rebuilds on every push **and daily at noon UTC**, so posts/repos/
notes appear on their own without you touching code.

```
  integrations.config.json   ← non-secret settings you edit (handles, usernames)
  GitHub Actions secrets      ← tokens (NOTION_TOKEN, VAULT_TOKEN, …) — never in code
        │
        ▼
  scripts/build-data.mjs      ← runs before `vite build` (npm "prebuild" hook)
        │  each source isolated in try/catch — a failure keeps the last good copy
        ▼
  src/generated/*.json        ← blog / github / wellness / graph
        │
        ▼
  the pages read these; if empty, they fall back to data.js defaults
```

**Nothing breaks if a source is down or unconfigured** — the build always
succeeds and ships the last good data.

---

## Status of each integration

| Source | State | What's needed |
|---|---|---|
| **GitHub repos** | ✅ Live | Nothing — working now |
| **Substack blog** | 🟡 Wired, waiting on posts | Confirm publication subdomain; publish a post |
| **Notion** (wellness) | ⚙️ Ready, needs secrets | Steps in §3 below |
| **Obsidian** (graph) | ⚙️ Ready, needs vault repo | Steps in §4 below |

---

## 1. GitHub repos — done ✅

The Projects page shows:
- **A rotating carousel of "featured" repos** = repos you **own and have starred**.
  To feature a repo, just **star your own repo** on GitHub. To un-feature it, unstar.
- **All repositories** further down (newest first, forks/archived excluded).

Configured in `integrations.config.json` → `github`. Currently featuring:
`pxr-effector-uncoupling, BayesBio, ATAC-QC, scRNA-flow, OmicsQC, amit-sh`.
(If you don't want the website's own repo shown, unstar `amit-sh`.)

No token required, but the deploy passes the built-in `GITHUB_TOKEN` to raise API
rate limits. Nothing for you to do.

---

## 2. Substack blog — 🟡 almost there

Configured in `integrations.config.json` → `substack.publication` (currently
`knowledgegraphlover`). The build reads `https://<publication>.substack.com/feed`.

Right now that feed returns **0 posts** — either the publication has no posts yet,
or your posts live on a different subdomain than the profile `@knowledgegraphlover`.

**To finish:**
1. Publish at least one post on Substack.
2. Open your **publication's** home page and check its subdomain (the part before
   `.substack.com`). If it isn't `knowledgegraphlover`, update
   `substack.publication` in `integrations.config.json` and push.
3. That's it — posts then appear on the Blog page automatically (title, date,
   excerpt, link), refreshed on every build.

Until a post exists, the Blog page shows a tasteful "follow on Substack" card.

---

## 3. Notion → Wellness (meal plans + workouts) — ⚙️ step by step

The fetcher (`scripts/fetch-notion.mjs`) is ready. It reads two Notion databases
and renders them as lists on the Wellness page. Do this once:

### Step 1 — Create a Notion integration
1. Go to <https://www.notion.so/my-integrations> → **New integration**.
2. Name it `amit-sh site`, pick your workspace, **Internal** integration.
3. Under **Capabilities**, "Read content" is enough. Save.
4. Copy the **Internal Integration Secret** (starts with `ntn_` or `secret_`).

### Step 2 — Share your databases with the integration
For **each** database (meal plans, workouts):
1. Open the database as a full page in Notion.
2. Top-right **⋯** menu → **Connections** (or "Add connections") → select
   `amit-sh site`. **This is the step people miss — without it the API sees nothing.**

### Step 3 — Get each database ID
Open each database and copy the **32-character ID** from the URL:
```
https://www.notion.so/yourworkspace/<THIS_32_CHAR_ID>?v=...
```
(It's the block right before the `?v=`.)

### Step 4 — Add secrets to the repo
GitHub → your `amit-sh` repo → **Settings → Secrets and variables → Actions →
New repository secret**. Add three:
| Secret name | Value |
|---|---|
| `NOTION_TOKEN` | the integration secret from Step 1 |
| `NOTION_MEALS_DB` | the meal-plan database ID |
| `NOTION_WORKOUTS_DB` | the workout database ID |

### Step 5 — Column conventions
The fetcher maps columns by name. In each database use:
- a **Title** column (any name — it's auto-detected) → the item name
- a text column named **`Detail`** (or `Notes` / `Description`) → the description
- a **Multi-select** column named **`Tags`** → shown as tags (optional)

Extra columns are ignored, so your databases can hold whatever else you like.

### Step 6 — Trigger a build
Push anything, or GitHub → **Actions → Deploy → Run workflow**, or just wait for
the daily run. The Wellness page fills in automatically. Done — no code.

> **Just want a quick link instead?** Publish the Notion page and embed it in an
> `<iframe>` (like the Careers-page Google Doc). Faster, but less "in your style"
> than the rendered lists.

---

## 4. Obsidian → knowledge graph — ⚙️ when your vault is ready

The graph on the Home page is currently the hand-written one in `data.js`. Once
you point the build at a vault repo, it **regenerates the graph from your notes**
and takes over automatically (`src/data.js` prefers the generated graph when it exists).

### Step 1 — Put the vault in a GitHub repo
Keep editing in Obsidian; commit/push the vault to a repo (e.g. `xX-its-amit-Xx/brain`).

### Step 2 — Point the site at it
In `integrations.config.json` → `obsidian.repo`, set `"owner/repo"` and `branch`.
If the repo is **private**, also create a fine-grained token (Settings → Developer
settings → Fine-grained tokens; **Contents: read-only**, that repo only) and add
it as GitHub secret **`VAULT_TOKEN`**.

### Step 3 — Mark notes for the graph (conventions)
The parser (`scripts/fetch-obsidian.mjs`) only includes notes you opt in. In a
note's frontmatter:
```markdown
---
site: true            # required — only these notes appear (private notes stay private)
category: research    # self | research | project | community | skill | value | life  → node color
page: Work            # optional — makes the node click through to that site section
blurb: ML for TPD.    # optional — hover text (else the first non-heading line is used)
size: 2               # optional — node size (default 1.5; "me" should be biggest)
---
# UCB Biosciences
Working on [[Cheminformatics]] and [[ML]]…
```
Every `[[wikilink]]` between two `site: true` notes becomes an **edge**. Name one
central note `Amit` with `category: self` and it becomes the hub. The graph
self-lays-out — no coordinates to manage. New notes even become new `NODE.LINK`
puzzles for free.

Verified: the parser correctly ignores non-`site:true` notes and de-duplicates
edges, so your private thoughts never leak.

---

## 5. Where things live

| File | Responsibility |
|---|---|
| `integrations.config.json` | non-secret handles/usernames you edit |
| `scripts/build-data.mjs` | orchestrator (runs before build, never fails the build) |
| `scripts/fetch-*.mjs` | one fetcher per source (github/blog/notion/obsidian) |
| `src/generated/*.json` | committed data snapshots (fallback + initial state) |
| `src/data.js` | hand-written content + graph + personas + achievements |
| `src/pages.jsx` | pages; read generated JSON, fall back to `data.js` |
| `.github/workflows/deploy.yml` | build + deploy on push **and** daily cron |

### Everyday updates
- **Content** (jobs, projects, bio): edit `src/data.js`, push.
- **Repos**: star/unstar on GitHub — nothing else.
- **Blog**: just write on Substack.
- **Wellness**: edit your Notion databases.
- **Graph**: edit your Obsidian vault and push it.

Everything is picked up on the next build (push, manual, or the daily cron).

---

## 6. Tracking LinkedIn posts & "ideas I'm interested in" (an Updates feed)

The goal: a live **"Now / Updates"** strip on the site that reflects what you're
posting and thinking about, without manual copy-paste. Reuse the same build-time
pattern (`scripts/fetch-*.mjs` → `src/generated/updates.json` → a page section).

### LinkedIn — the honest version
LinkedIn has **no official public feed** for personal posts (their API needs an
approved OAuth app, and scraping violates their ToS). So don't fetch LinkedIn
directly. Three ToS-safe options, best first:

1. **Notion "Updates" database (recommended).** Keep a simple database:
   `Title`, `Detail`, `Link`, `Date`, `Type` (post / idea / milestone). When you
   post on LinkedIn, drop a one-line row in Notion (or automate it — next option).
   A `fetch-updates.mjs` (copy of `fetch-notion.mjs`) renders it as a feed. Fully
   in your control, ToS-clean, and doubles as your idea inbox.
2. **Zapier / Make automation (automated + safe).** Trigger: "New LinkedIn post
   by me" → Action: "Create Notion row." Now the Updates database fills itself,
   and the site picks it up on the daily build. Zero manual work after setup.
3. **RSS bridge (fastest, least robust).** Services like `rss.app` generate an
   RSS URL from a public LinkedIn profile. Add it to `integrations.config.json`
   → `updates.feed` and reuse the Substack RSS parser. These bridges break when
   LinkedIn changes markup, so treat it as best-effort.

### Ideas / interests
Model interests as first-class content so they can show as a feed **and** as graph
nodes. Two low-effort sources:
- an **Obsidian note per idea** with `site: true` + `category: value` (or a new
  `interest` category) → they appear in the knowledge graph automatically; or
- an **"Exploring" Notion database** → rendered as a "Currently exploring" list on
  Home or Blog.

Either way it becomes part of the living map — someone can literally watch your
interests connect to your work in the graph.

## 7. Making bullets "modern to match" (optional AI polish step)

Raw LinkedIn blurbs and idea notes rarely match the site's tight, witty,
action-verb voice. Add a build-time pass that **rewrites incoming text into
on-brand bullets** using the Claude API, so everything reads consistently without
you hand-editing each item.

Sketch — `scripts/polish.mjs`, run inside `build-data.mjs` after the fetchers:
```js
import Anthropic from "@anthropic-ai/sdk";
const client = new Anthropic(); // reads ANTHROPIC_API_KEY from env/secret

const VOICE = `You rewrite career/update blurbs in Amit Shenoy's voice:
concise, one line each, lead with a strong action verb, end with a concrete
outcome or number when available, dry wit allowed, no buzzword soup. Return JSON
{"bullets": string[]}.`;

export async function polish(rawText) {
  const msg = await client.messages.create({
    model: "claude-haiku-4-5-20251001",   // cheap + fast is plenty here
    max_tokens: 400,
    system: VOICE,
    messages: [{ role: "user", content: rawText }],
  });
  return JSON.parse(msg.content[0].text).bullets;
}
```
Notes:
- Store the key as GitHub secret **`ANTHROPIC_API_KEY`**; `npm i @anthropic-ai/sdk`.
- **Cache by content hash** (write `polished[hash] = bullets` to a JSON) so a given
  post is only rewritten once — the daily build then spends ~0 tokens on unchanged
  items. Only new/edited text hits the API.
- Keep the raw text too, so you can always fall back or diff.
- Same trick can auto-generate a node `blurb:` for new Obsidian notes that lack one.

This closes the loop: you post a rough thought on LinkedIn → it lands in Notion →
the build polishes it into a crisp, on-brand bullet → it shows up on the site and,
if you tagged it, as a new node in your knowledge graph. Hands-off and consistent.

---

## 8. Suggestion form → Notion (with bot protection)

**Why it needs a helper:** the site is static (GitHub Pages). A browser can't hold
your Notion token or write to Notion directly without exposing the secret. So a
tiny serverless function sits in between. Code is in `workers/` (a free Cloudflare
Worker).

### Set it up (once, ~10 min)
1. **Create a "Suggestions" database** in Notion (just needs a Title/Name column;
   details go into each page's body). Share it with your `amit-sh-recs` integration
   (⋯ → Connections).
2. **Install Wrangler** and deploy the Worker:
   ```bash
   npm i -g wrangler
   cd workers
   wrangler deploy
   wrangler secret put NOTION_TOKEN            # your integration secret
   wrangler secret put NOTION_SUGGESTIONS_DB   # the Suggestions database id
   ```
3. **Lock the origin:** in `workers/wrangler.toml` set `ALLOWED_ORIGIN` to your
   site (`https://xX-its-amit-Xx.github.io`) and redeploy.
4. **Point the form at it:** set `FORM_ENDPOINT` in `src/pages.jsx` to the Worker
   URL Wrangler prints (e.g. `https://amit-sh-recipe-form.<you>.workers.dev`).
   Push. Submissions now create Notion pages.

Until `FORM_ENDPOINT` is set, the form just shows a local "thank you" and posts
nowhere — so nothing is broken in the meantime.

### Keeping bots out (layered, all in the Worker)
- **Honeypot (already live):** the form has a hidden `website` field. Humans leave
  it blank; bots fill it. The Worker silently drops those. Zero friction.
- **Cloudflare Turnstile (recommended):** a free, privacy-friendly CAPTCHA. Create
  a widget in the Cloudflare dashboard, `wrangler secret put TURNSTILE_SECRET`,
  add the Turnstile script + widget to the form, and send its token as `token` in
  the POST. The Worker rejects requests without a valid token.
- **Length caps & required fields:** enforced server-side in the Worker.
- **Rate limiting (optional):** uncomment the KV binding in `wrangler.toml` to cap
  each IP to 5 submissions/hour.

> Prefer zero code? A form backend like **Formspree** or **Basin** gives you an
> endpoint + built-in spam filtering; pipe it to Notion via Zapier. Less control,
> but no Worker to maintain.

## 9. Auto-updating Projects (and the LinkedIn question)

The Projects page already self-updates from **GitHub**: it merges your curated
projects (in `src/data.js`) with your public repos, auto-classifies each into a
subsection (bioinformatics / cheminformatics / wet lab / engineering) via
`classifyRepo()`, and tags it by type (research / class / repo / hackathon /
product). Star your own repo to feature it in the carousel.

**LinkedIn, honestly:** there's no public API for personal LinkedIn posts/projects
(their API needs an approved OAuth app; scraping breaks their ToS). So the site
can't pull LinkedIn directly. The robust, ToS-safe equivalent — and the one I'd
recommend — is a **Notion "Projects" database** that the build reads, exactly like
meals:
- Columns: `Name`, `Description`, `Area` (select: bioinformatics/…/engineering),
  `Type` (select: class/hackathon/…), `Link`, `Featured` (checkbox).
- A `fetch-projects.mjs` (copy of the meals query in `fetch-notion.mjs`) writes
  `src/generated/projects.json`; the Projects page merges it in with the curated +
  GitHub lists.
- Now you add a project once in Notion (or auto-create a row from LinkedIn via a
  Zapier "new post → Notion row" rule, per §6) and it appears on the next build.

To classify a **hackathon** or **class project** that lives only on GitHub, add a
GitHub **topic** like `hackathon` or `coursework` to the repo — `classifyRepo` and
the type filter can key off topics.
