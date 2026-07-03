import { useEffect, useState, useMemo, lazy, Suspense } from "react";
import {
  PROFILE, WORK, COMMUNITY, PROJECTS, SKILLS_SHORT, SKILLS_FULL,
  WRITING, PROJECT_CATEGORIES, PROJECT_TYPES, classifyRepo, GALLERY, GAMEDEV,
} from "./data.js";
import { useApp } from "./store.jsx";
import { palette, MONO, SANS } from "./theme.js";
import { Section, SectionHeader, TiltCard, Card, Tag, TerminalBlock, TerminalText, PixelSprite, PixelIcon, LinkButton } from "./ui.jsx";
// three.js is heavy — lazy-load the WebGL graph so it isn't in the initial bundle.
const KnowledgeGraph = lazy(() => import("./graph3d.jsx").then((m) => ({ default: m.KnowledgeGraph })));
import { DockGame, BasePairGame } from "./games.jsx";
import blogData from "./generated/blog.json";
import githubData from "./generated/github.json";
import wellnessData from "./generated/wellness.json";

const HEADSHOT = import.meta.env.BASE_URL + PROFILE.headshot;
const RESUME = import.meta.env.BASE_URL + PROFILE.resumePdf;

// ── Home ─────────────────────────────────────────────────────────────────────
export function HomePage({ dark, setPage }) {
  const { unlock, persona } = useApp();
  const [blink, setBlink] = useState(true);
  const [pokes, setPokes] = useState(0);

  useEffect(() => {
    const t = setInterval(() => setBlink((b) => !b), 530);
    return () => clearInterval(t);
  }, []);

  const p = palette(dark);

  function pokeSprite() {
    setPokes((n) => {
      const v = n + 1;
      if (v >= 7) unlock("sprite");
      return v;
    });
  }

  return (
    <Section style={{ paddingTop: 96 }}>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 40, alignItems: "center", marginBottom: 44 }}>
        <div style={{ flex: "0 0 auto", textAlign: "center" }}>
          <div style={{ position: "relative", display: "inline-block" }}>
            <div
              style={{
                width: 132,
                height: 132,
                borderRadius: "50%",
                background: "url(" + HEADSHOT + ") center/cover",
                border: "3px solid rgba(196,144,96,0.3)",
                boxShadow: dark ? "0 12px 44px rgba(0,0,0,0.5)" : "0 12px 44px rgba(93,64,38,0.14)",
              }}
            />
            <div
              onClick={pokeSprite}
              title="hey!"
              style={{ position: "absolute", bottom: -8, right: -8, transform: pokes ? `rotate(${(pokes % 2 ? -1 : 1) * 8}deg)` : "none", transition: "transform 0.15s ease" }}
            >
              <PixelSprite size={42} onClick={pokeSprite} />
            </div>
          </div>
        </div>
        <div style={{ flex: 1, minWidth: 280 }}>
          <div style={{ fontFamily: MONO, fontSize: 13, color: "#8B9D77", marginBottom: 8 }}>{"> hello_world.sh"}</div>
          <h1 style={{ fontFamily: MONO, fontSize: "clamp(28px, 5vw, 44px)", color: p.fg, margin: "0 0 12px", lineHeight: 1.15, fontWeight: 700 }}>
            {PROFILE.name}
            <span style={{ color: "#C49060", opacity: blink ? 1 : 0, transition: "opacity 0.1s" }}>_</span>
          </h1>
          <p style={{ fontFamily: SANS, fontSize: 17, color: "#C49060", fontWeight: 500, margin: "0 0 16px", fontStyle: "italic", lineHeight: 1.5 }}>
            {PROFILE.tagline}
          </p>
          <p style={{ fontFamily: SANS, fontSize: 15, color: p.muted, lineHeight: 1.7, margin: "0 0 24px" }}>{PROFILE.blurb}</p>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            {[
              { label: "ls work/", page: "Work" },
              { label: "ls community/", page: "Community" },
              { label: "cat contact.md", page: "Contact" },
            ].map((item) => (
              <button
                key={item.page}
                onClick={() => setPage(item.page)}
                style={{
                  background: dark ? "rgba(196,144,96,0.08)" : "rgba(196,144,96,0.06)",
                  color: "#C49060",
                  border: "1px solid rgba(196,144,96,0.22)",
                  cursor: "pointer",
                  padding: "8px 16px",
                  borderRadius: 6,
                  fontFamily: MONO,
                  fontSize: 12,
                  transition: "all 0.2s ease",
                }}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <TerminalBlock dark={dark} prompt="amit@hub ~ $">{PROFILE.motd}</TerminalBlock>

      {/* Knowledge graph centerpiece */}
      <div style={{ marginTop: 28, marginBottom: 12 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
          <PixelIcon type="graph" size={22} />
          <h2 style={{ fontFamily: MONO, fontSize: 20, fontWeight: 700, color: p.fg, margin: 0 }}>Me, as a knowledge graph</h2>
        </div>
        <p style={{ fontFamily: SANS, fontSize: 14, color: p.muted, margin: "0 0 14px", lineHeight: 1.6, maxWidth: 640 }}>
          Everything I do is connected — research feeds projects, values feed community, food feeds everything. Trace the edges,
          or hit <TerminalText dark={dark}>play NODE.LINK</TerminalText> to connect two ideas yourself.
        </p>
      </div>
      <Suspense
        fallback={
          <div style={{ height: "clamp(420px, 64vh, 640px)", borderRadius: 16, border: "1px solid " + p.border, display: "flex", alignItems: "center", justifyContent: "center", background: dark ? "rgba(13,12,10,0.4)" : "rgba(255,250,244,0.4)" }}>
            <span style={{ fontFamily: MONO, fontSize: 13, color: "#8B9D77" }}>booting 3D graph…</span>
          </div>
        }
      >
        <KnowledgeGraph
          dark={dark}
          onNavigate={setPage}
          onExploreNode={() => unlock("graphling")}
          onWinGame={() => unlock("pathfinder")}
        />
      </Suspense>

      <div style={{ display: "flex", gap: 16, flexWrap: "wrap", marginTop: 28 }}>
        {[
          { icon: "molecule", label: "Research", desc: "Computational biophysics & cheminformatics. Molecules in, insights out, existential questions about binding free energy in between.", page: "Work" },
          { icon: "leaf", label: "Community", desc: "Sustainability, accessibility, FOSS. Because someone has to be the person at the meeting who asks 'but have we considered the compost?'", page: "Community" },
          { icon: "controller", label: "Building", desc: "ML pipelines, apps, recipe spreadsheets. The Venn diagram of my hobbies and my work is just a circle at this point.", page: "Projects" },
        ].map((item) => (
          <TiltCard key={item.label} dark={dark} onClick={() => setPage(item.page)} style={{ flex: "1 1 240px", marginBottom: 0 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
              <PixelIcon type={item.icon} size={20} />
              <h3 style={{ fontFamily: MONO, fontSize: 16, fontWeight: 700, color: p.fg, margin: 0 }}>{item.label}</h3>
            </div>
            <p style={{ fontFamily: SANS, fontSize: 14, color: p.muted, margin: 0, lineHeight: 1.6 }}>{item.desc}</p>
          </TiltCard>
        ))}
      </div>

      {!persona && (
        <p style={{ fontFamily: MONO, fontSize: 12, color: p.faint, textAlign: "center", marginTop: 28 }}>
          psst — tap the 🎭 in the nav to tailor this site to you. and ⌘K opens the command palette.
        </p>
      )}
    </Section>
  );
}

// ── About ────────────────────────────────────────────────────────────────────
export function AboutPage({ dark }) {
  const p = palette(dark);
  return (
    <Section style={{ paddingTop: 96 }}>
      <SectionHeader dark={dark} title="About Me" icon="code" sub="The short version: I like solving hard problems and then talking about them at unnecessary length." />
      <div style={{ display: "flex", gap: 32, flexWrap: "wrap", alignItems: "flex-start" }}>
        <div style={{ flex: "0 0 auto", textAlign: "center" }}>
          <div style={{ width: 180, height: 180, borderRadius: 14, background: "url(" + HEADSHOT + ") center/cover", border: "2px solid rgba(196,144,96,0.22)", boxShadow: p.shadowSoft }} />
          <div style={{ marginTop: 12 }}><PixelSprite size={60} /></div>
        </div>
        <div style={{ flex: 1, minWidth: 280 }}>
          <TerminalBlock dark={dark} prompt="amit@about ~ $">whoami</TerminalBlock>
          <p style={aboutP(p)}>
            I'm Amit Shenoy — Konkani, Mangalorean, and improbably from Massachusetts. I graduated from Northeastern University with a
            B.S. in Bioengineering (Computational, Systems & Synthetic Biology), a math minor, and a GPA of 3.91 that I'm told is
            appropriate to mention on a personal website.
          </p>
          <p style={aboutP(p)}>
            My work sits at the intersection of data science and computational biophysics — building analytics pipelines for
            biomedical data, validating models that tell chemists which molecules to actually bother making, and collaborating across
            teams who use very different definitions of the word "significant."
          </p>
          <p style={aboutP(p)}>
            When I'm not staring at UMAP plots, I'm probably lifting, engineering a recipe to be slightly more nutritionally optimal
            than it needs to be, working my way through a puzzle, or advocating loudly for environmental sustainability among other
            things to anyone who will listen — and several people who won't.
          </p>
          <TerminalBlock dark={dark} prompt="amit@about ~ $">cat values.txt</TerminalBlock>
          <p style={aboutP(p)}>
            I grew up in a Konkani household where feeding people well was the baseline unit of caring about them. That's still how I
            operate — whether it's making sure a sustainability initiative actually launches, building a tool that saves a chemist
            three hours, or just making really good dal.
          </p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
            {SKILLS_SHORT.map((s) => (
              <Tag key={s} dark={dark}>{s}</Tag>
            ))}
          </div>
        </div>
      </div>
    </Section>
  );
}
const aboutP = (p) => ({ fontFamily: SANS, fontSize: 15, color: p.soft, lineHeight: 1.8, margin: "0 0 14px" });

// ── Work ─────────────────────────────────────────────────────────────────────
export function WorkPage({ dark }) {
  const p = palette(dark);
  return (
    <Section style={{ paddingTop: 96 }}>
      <SectionHeader dark={dark} title="Work & Research" icon="molecule" sub="Bench platform development and computational hit triage. Two very different types of pipelines." />
      <TerminalBlock dark={dark} prompt="amit@work ~ $">ls -la experience/</TerminalBlock>
      {WORK.map((j) => (
        <TiltCard key={j.id} dark={dark} max={5}>
          <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 8, marginBottom: 4 }}>
            <h3 style={{ fontFamily: MONO, fontSize: 16, fontWeight: 700, color: p.fg, margin: 0 }}>{j.title}</h3>
            <Tag dark={dark}>{j.time}</Tag>
          </div>
          <p style={{ fontFamily: SANS, fontSize: 13, color: p.muted, margin: "2px 0 6px", fontStyle: "italic" }}>{j.org}</p>
          <p style={{ fontFamily: SANS, fontSize: 14, color: "#C49060", margin: "0 0 12px", fontStyle: "italic" }}>{j.note}</p>
          <ul style={{ margin: "0 0 12px", paddingLeft: 18 }}>
            {j.bullets.map((b, bi) => (
              <li key={bi} style={{ fontFamily: SANS, fontSize: 14, color: p.soft, lineHeight: 1.7, marginBottom: 4 }}>{b}</li>
            ))}
          </ul>
          <div style={{ display: "flex", flexWrap: "wrap" }}>
            {j.tags.map((t) => (
              <Tag key={t} dark={dark}>{t}</Tag>
            ))}
          </div>
        </TiltCard>
      ))}

      <ConferenceGallery dark={dark} />
    </Section>
  );
}

// Conferences & talks gallery — populated from GALLERY in data.js as photos land.
function ConferenceGallery({ dark }) {
  const p = palette(dark);
  return (
    <div style={{ marginTop: 24 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
        <PixelIcon type="signal" size={18} />
        <h3 style={{ fontFamily: MONO, fontSize: 16, fontWeight: 700, color: p.fg, margin: 0 }}>Conferences & Talks</h3>
        <span style={{ fontFamily: SANS, fontSize: 12.5, color: p.muted, fontStyle: "italic" }}>15+ presentations · AAAS, MBN, BSCP, SSC, SSLS</span>
      </div>
      {GALLERY.length === 0 ? (
        <Card dark={dark} style={{ textAlign: "center", padding: 28, borderStyle: "dashed" }}>
          <span style={{ fontFamily: MONO, fontSize: 13, color: p.faint }}>📷 photos from SSC, SSLS & other conferences — coming soon</span>
        </Card>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 12 }}>
          {GALLERY.map((g) => (
            <TiltCard key={g.id} dark={dark} max={6} style={{ padding: 0, overflow: "hidden", marginBottom: 0 }} glow={false}>
              <div style={{ height: 150, background: `url(${import.meta.env.BASE_URL + g.img}) center/cover`, backgroundColor: dark ? "#26231F" : "#eee" }} />
              <div style={{ padding: "10px 12px" }}>
                <div style={{ fontFamily: MONO, fontSize: 13, fontWeight: 700, color: p.fg }}>{g.title}{g.year ? ` · ${g.year}` : ""}</div>
                {g.caption && <div style={{ fontFamily: SANS, fontSize: 12.5, color: p.muted, marginTop: 2 }}>{g.caption}</div>}
              </div>
            </TiltCard>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Community ────────────────────────────────────────────────────────────────
export function CommunityPage({ dark }) {
  const p = palette(dark);
  return (
    <Section style={{ paddingTop: 96 }}>
      <SectionHeader dark={dark} title="Community & Leadership" icon="leaf" sub="If you care about something, you probably have to be the one to organize the meeting about it." />
      <TerminalBlock dark={dark} prompt="amit@community ~ $">find . -name "initiative" -type d | wc -l → {COMMUNITY.length}</TerminalBlock>
      {COMMUNITY.map((item) => (
        <TiltCard key={item.id} dark={dark} max={5}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
            <PixelIcon type={item.icon} size={18} />
            <h3 style={{ fontFamily: MONO, fontSize: 16, fontWeight: 700, color: p.fg, margin: 0 }}>{item.title}</h3>
          </div>
          <p style={{ fontFamily: SANS, fontSize: 14, color: "#C49060", margin: "0 0 10px", fontStyle: "italic" }}>{item.note}</p>
          <p style={{ fontFamily: SANS, fontSize: 14, color: p.soft, lineHeight: 1.7, margin: "0 0 12px" }}>{item.desc}</p>
          <div style={{ display: "flex", flexWrap: "wrap" }}>
            {item.tags.map((t) => (
              <Tag key={t} dark={dark}>{t}</Tag>
            ))}
          </div>
        </TiltCard>
      ))}
    </Section>
  );
}

// ── Projects ─────────────────────────────────────────────────────────────────
function RepoCarousel({ dark, repos }) {
  const p = palette(dark);
  const [idx, setIdx] = useState(0);
  const [paused, setPaused] = useState(false);
  useEffect(() => {
    if (paused || repos.length <= 1) return;
    const t = setInterval(() => setIdx((i) => (i + 1) % repos.length), 4500);
    return () => clearInterval(t);
  }, [paused, repos.length]);
  const r = repos[idx];
  if (!r) return null;
  return (
    <div onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
        <PixelIcon type="controller" size={18} />
        <span style={{ fontFamily: MONO, fontSize: 14, fontWeight: 700, color: p.fg }}>Featured repos</span>
        <span style={{ fontFamily: MONO, fontSize: 11, color: p.faint, marginLeft: "auto" }}>★ self-starred · {idx + 1}/{repos.length}</span>
      </div>
      <TiltCard dark={dark} max={6} onClick={() => window.open(r.url, "_blank")} style={{ minHeight: 150 }}>
        <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 8, marginBottom: 6 }}>
          <h3 style={{ fontFamily: MONO, fontSize: 17, fontWeight: 700, color: "#C49060", margin: 0 }}>{r.name}</h3>
          <span style={{ fontFamily: MONO, fontSize: 12, color: p.muted }}>
            {r.language ? r.language + " · " : ""}★ {r.stars}
          </span>
        </div>
        <p style={{ fontFamily: SANS, fontSize: 14, color: p.soft, lineHeight: 1.6, margin: "0 0 12px", minHeight: 40 }}>
          {r.description || "No description yet."}
        </p>
        <div style={{ display: "flex", flexWrap: "wrap" }}>
          {(r.topics || []).slice(0, 5).map((t) => (
            <Tag key={t} dark={dark}>{t}</Tag>
          ))}
        </div>
      </TiltCard>
      <div style={{ display: "flex", gap: 6, justifyContent: "center", marginTop: 4 }}>
        {repos.map((_, i) => (
          <button
            key={i}
            onClick={() => setIdx(i)}
            aria-label={"repo " + (i + 1)}
            style={{ width: i === idx ? 20 : 8, height: 8, borderRadius: 4, border: "none", cursor: "pointer", background: i === idx ? "#C49060" : p.border, transition: "all 0.3s ease" }}
          />
        ))}
      </div>
    </div>
  );
}

// Merge curated projects + auto-classified GitHub repos into one filterable list.
function useUnifiedProjects() {
  return useMemo(() => {
    const curated = PROJECTS.map((pr) => ({
      key: "p-" + pr.id,
      title: pr.title,
      desc: pr.desc,
      note: pr.note,
      tags: pr.tags,
      category: pr.category,
      type: pr.type,
      link: pr.link,
      linkLabel: pr.linkLabel,
      stars: null,
      curated: true,
    }));
    const curatedNames = new Set(PROJECTS.map((pr) => pr.title.toLowerCase()));
    const repos = (githubData.all || [])
      .filter((r) => !curatedNames.has((r.name || "").toLowerCase()) && r.name !== "amit-sh")
      .map((r) => ({
        key: "r-" + r.name,
        title: r.name,
        desc: r.description || "No description yet.",
        note: null,
        tags: r.topics && r.topics.length ? r.topics : (r.language ? [r.language] : []),
        category: classifyRepo(r),
        type: "repo",
        link: r.url,
        linkLabel: "→ github",
        stars: r.stars,
        curated: false,
      }));
    return [...curated, ...repos];
  }, []);
}

export function ProjectsPage({ dark }) {
  const p = palette(dark);
  const featured = githubData.featured || [];
  const all = useUnifiedProjects();
  const [cat, setCat] = useState(null);
  const [type, setType] = useState(null);

  const counts = useMemo(() => {
    const c = {}, t = {};
    for (const pr of all) { c[pr.category] = (c[pr.category] || 0) + 1; t[pr.type] = (t[pr.type] || 0) + 1; }
    return { c, t };
  }, [all]);

  const shown = all.filter((pr) => (!cat || pr.category === cat) && (!type || pr.type === type));

  const chip = (on, color = "#C49060") => ({
    background: on ? color : "transparent",
    color: on ? "#fff" : color,
    border: "1px solid " + (on ? color : "rgba(196,144,96,0.3)"),
    borderRadius: 6, padding: "5px 12px", marginRight: 6, marginBottom: 6,
    fontFamily: MONO, fontSize: 12, fontWeight: 700, cursor: "pointer", transition: "all 0.15s ease",
  });

  return (
    <Section style={{ paddingTop: 96 }}>
      <SectionHeader dark={dark} title="Projects" icon="code" sub="Side quests that became main quests — research, class builds, repos, and hackathons." />

      {featured.length > 0 && (
        <div style={{ marginBottom: 32 }}>
          <RepoCarousel dark={dark} repos={featured} />
        </div>
      )}

      {/* subsection filters */}
      <div style={{ marginBottom: 8 }}>
        <div style={{ fontFamily: MONO, fontSize: 10.5, color: "#8B9D77", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 6 }}>area</div>
        <div style={{ display: "flex", flexWrap: "wrap" }}>
          <button onClick={() => setCat(null)} style={chip(!cat)}>all ({all.length})</button>
          {PROJECT_CATEGORIES.map((c) => counts.c[c.id] ? (
            <button key={c.id} onClick={() => setCat(cat === c.id ? null : c.id)} style={chip(cat === c.id)}>{c.label} ({counts.c[c.id]})</button>
          ) : null)}
        </div>
      </div>
      <div style={{ marginBottom: 20 }}>
        <div style={{ fontFamily: MONO, fontSize: 10.5, color: "#8B9D77", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 6 }}>type</div>
        <div style={{ display: "flex", flexWrap: "wrap" }}>
          <button onClick={() => setType(null)} style={chip(!type, "#8B9D77")}>all</button>
          {PROJECT_TYPES.map((tp) => counts.t[tp.id] ? (
            <button key={tp.id} onClick={() => setType(type === tp.id ? null : tp.id)} style={chip(type === tp.id, "#8B9D77")}>{tp.label} ({counts.t[tp.id]})</button>
          ) : null)}
        </div>
      </div>

      <TerminalBlock dark={dark} prompt="amit@projects ~ $">
        ls ~/builds/{cat ? " | grep " + cat : ""}{type ? " | grep " + type : ""} <span style={{ color: "#6B5E52" }}># {shown.length} shown</span>
      </TerminalBlock>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 14 }}>
        {shown.map((pr) => {
          const catLabel = (PROJECT_CATEGORIES.find((c) => c.id === pr.category) || {}).label;
          return (
            <TiltCard key={pr.key} dark={dark} max={6} style={{ marginBottom: 0, height: "100%" }} onClick={pr.link ? () => window.open(pr.link, "_blank") : undefined}>
              <div style={{ display: "flex", justifyContent: "space-between", gap: 8, marginBottom: 6 }}>
                <h3 style={{ fontFamily: MONO, fontSize: 15, fontWeight: 700, color: pr.curated ? p.fg : "#C49060", margin: 0 }}>{pr.title}</h3>
                {pr.stars != null && <span style={{ fontFamily: MONO, fontSize: 11, color: p.muted, whiteSpace: "nowrap" }}>★ {pr.stars}</span>}
              </div>
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 8 }}>
                {catLabel && <span style={{ fontFamily: MONO, fontSize: 9.5, fontWeight: 700, color: "#8B9D77", background: "rgba(139,157,119,0.12)", border: "1px solid rgba(139,157,119,0.25)", borderRadius: 4, padding: "1px 6px" }}>{catLabel}</span>}
                <span style={{ fontFamily: MONO, fontSize: 9.5, fontWeight: 700, color: p.muted, border: "1px solid " + p.border, borderRadius: 4, padding: "1px 6px" }}>{(PROJECT_TYPES.find((t) => t.id === pr.type) || {}).label}</span>
              </div>
              {pr.note && <p style={{ fontFamily: SANS, fontSize: 13, color: "#C49060", margin: "0 0 8px", fontStyle: "italic" }}>{pr.note}</p>}
              <p style={{ fontFamily: SANS, fontSize: 13.5, color: p.soft, lineHeight: 1.6, margin: "0 0 10px" }}>{pr.desc}</p>
              <div style={{ display: "flex", flexWrap: "wrap" }}>
                {(pr.tags || []).slice(0, 4).map((t) => (<Tag key={t} dark={dark}>{t}</Tag>))}
              </div>
              {pr.link && <div style={{ marginTop: 8, fontFamily: MONO, fontSize: 12, fontWeight: 600, color: "#8B9D77" }}>{pr.linkLabel}</div>}
            </TiltCard>
          );
        })}
      </div>
      {shown.length === 0 && <p style={{ fontFamily: SANS, fontSize: 14, color: p.faint, textAlign: "center", padding: 20 }}>Nothing in this combination yet.</p>}
    </Section>
  );
}

// ── Arcade ───────────────────────────────────────────────────────────────────
export function ArcadePage({ dark, setPage }) {
  const p = palette(dark);
  const { unlock } = useApp();
  return (
    <Section style={{ paddingTop: 96 }}>
      <SectionHeader dark={dark} title="Arcade" icon="controller" sub="Where the hobbies live: game-dev experiments and a few science-flavored mini-games. Non-obstructive by design — play if you want." />

      {/* game-dev hobby site */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
        <PixelIcon type="controller" size={20} />
        <h3 style={{ fontFamily: MONO, fontSize: 18, fontWeight: 700, color: p.fg, margin: 0 }}>justanotherstudies.dev</h3>
      </div>
      <p style={{ fontFamily: SANS, fontSize: 14, color: p.muted, margin: "0 0 12px", lineHeight: 1.7, maxWidth: 640 }}>{GAMEDEV.blurb}</p>
      <NotionEmbed dark={dark} url={GAMEDEV.siteEmbed} openUrl={GAMEDEV.site} label="justanotherstudies.dev" title="Just Another Studies" cta="open the studio →" icon="controller" />

      {/* mini-games */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, margin: "40px 0 14px" }}>
        <PixelIcon type="molecule" size={20} />
        <h3 style={{ fontFamily: MONO, fontSize: 18, fontWeight: 700, color: p.fg, margin: 0 }}>Mini-games</h3>
      </div>
      <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
        <Card dark={dark} style={{ flex: "1 1 320px", marginBottom: 0 }}>
          <BasePairGame dark={dark} />
        </Card>
        <Card dark={dark} style={{ flex: "1 1 320px", marginBottom: 0 }}>
          <p style={{ fontFamily: SANS, fontSize: 13, color: p.muted, margin: "0 0 12px", fontStyle: "italic" }}>Hit-triage, the game. Land the ligand in the pocket.</p>
          <DockGame dark={dark} onDock={() => unlock("docked")} />
        </Card>
      </div>
      <Card dark={dark} style={{ marginTop: 16, textAlign: "center" }}>
        <p style={{ fontFamily: SANS, fontSize: 14, color: p.soft, margin: "0 0 12px" }}>
          There's a third one hiding in plain sight — <strong>NODE.LINK</strong>, played on my knowledge graph.
        </p>
        <button onClick={() => setPage("Home")} style={{ background: "#8B9D77", color: "#fff", border: "none", borderRadius: 8, padding: "9px 20px", fontFamily: MONO, fontSize: 13, fontWeight: 700, cursor: "pointer" }}>
          play NODE.LINK on the graph →
        </button>
      </Card>

      {/* Orbit Swap */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, margin: "40px 0 12px" }}>
        <PixelIcon type="controller" size={20} />
        <h3 style={{ fontFamily: MONO, fontSize: 18, fontWeight: 700, color: p.fg, margin: 0 }}>Orbit Swap</h3>
      </div>
      <Card dark={dark}>
        <p style={{ fontFamily: SANS, fontSize: 14, color: p.soft, lineHeight: 1.7, margin: "0 0 12px" }}>
          The shift-swap app in beta. Follow the build — an Instagram is on the way.
        </p>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <LinkButton href="https://xx-its-amit-xx.github.io/orbit_swap_privacy_policy/index.html">beta_signup.sh →</LinkButton>
          {GAMEDEV.orbitInstagram
            ? <LinkButton href={GAMEDEV.orbitInstagram} filled={false}>@orbitswap on instagram →</LinkButton>
            : <span style={{ display: "inline-flex", alignItems: "center", fontFamily: MONO, fontSize: 12, color: p.faint, border: "1px dashed " + p.border, borderRadius: 8, padding: "9px 16px" }}>instagram — coming soon</span>}
        </div>
      </Card>
    </Section>
  );
}

// ── Rangers ──────────────────────────────────────────────────────────────────
const RANGERS_URL = "https://therooftoprangers.com/";

export function RangersPage({ dark }) {
  const p = palette(dark);
  const [loaded, setLoaded] = useState(false);
  const [blocked, setBlocked] = useState(false);

  // Some sites refuse to be iframed (X-Frame-Options / CSP). If it hasn't loaded
  // shortly, show the framed-preview fallback instead of a blank box.
  useEffect(() => {
    const t = setTimeout(() => { if (!loaded) setBlocked(true); }, 4000);
    return () => clearTimeout(t);
  }, [loaded]);

  return (
    <Section style={{ paddingTop: 96 }}>
      <SectionHeader dark={dark} title="Rooftop Rangers" icon="mountain" sub="Adventures, stories, and questionable summit decisions — live from the Rangers' own site." />

      <TiltCard dark={dark} style={{ padding: 0, overflow: "hidden" }} max={3} glow={false}>
        {/* browser chrome */}
        <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 14px", borderBottom: "1px solid " + p.border, background: dark ? "rgba(255,255,255,0.03)" : "rgba(0,0,0,0.02)" }}>
          <span style={{ display: "flex", gap: 6 }}>
            {["#E06C6C", "#E0B26C", "#8B9D77"].map((c) => <span key={c} style={{ width: 10, height: 10, borderRadius: "50%", background: c }} />)}
          </span>
          <span style={{ fontFamily: MONO, fontSize: 12, color: p.muted, flex: 1, textAlign: "center", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            therooftoprangers.com
          </span>
          <a href={RANGERS_URL} target="_blank" rel="noopener noreferrer" style={{ fontFamily: MONO, fontSize: 11, color: "#C49060", textDecoration: "none" }}>↗ open</a>
        </div>

        {blocked ? (
          <div style={{ padding: 40, textAlign: "center" }}>
            <PixelIcon type="mountain" size={48} color="#C49060" />
            <p style={{ fontFamily: SANS, fontSize: 14, color: p.muted, margin: "16px 0 20px", lineHeight: 1.7 }}>
              The Rangers' site won't load inside a frame (it blocks embedding). No summit left behind — open it full-screen:
            </p>
            <LinkButton href={RANGERS_URL}>cd /rooftop-rangers →</LinkButton>
          </div>
        ) : (
          <iframe
            src={RANGERS_URL}
            title="The Rooftop Rangers"
            onLoad={() => setLoaded(true)}
            style={{ width: "100%", height: "clamp(420px, 68vh, 760px)", border: "none", display: "block", background: "#fff" }}
          />
        )}
      </TiltCard>

      <div style={{ textAlign: "center", marginTop: 16 }}>
        <LinkButton href={RANGERS_URL} filled={false}>visit the full site →</LinkButton>
      </div>
    </Section>
  );
}

// ── Wellness ─────────────────────────────────────────────────────────────────
const FACET_ORDER = ["Category", "Cuisine Tags", "Flavor Profile", "Key Micronutrients"];

function WellnessColumn({ dark, icon, title, sub, items, emptyNote, embedUrl, embedOpenUrl, embedLabel, embedTitle }) {
  const p = palette(dark);
  const list = useMemo(() => items || [], [items]);
  const [q, setQ] = useState("");
  const [active, setActive] = useState({}); // { propName: [values] }
  const [filtersOpen, setFiltersOpen] = useState(false);

  // Build one filter group per Notion facet property (meal type, flavor, …).
  const groups = useMemo(() => {
    const g = {};
    for (const it of list) for (const [k, vals] of Object.entries(it.facets || {})) {
      (g[k] || (g[k] = new Set()));
      vals.forEach((v) => g[k].add(v));
    }
    return Object.keys(g)
      .sort((a, b) => (FACET_ORDER.indexOf(a) + 1 || 99) - (FACET_ORDER.indexOf(b) + 1 || 99))
      .map((k) => ({ name: k, values: [...g[k]].sort() }));
  }, [list]);

  const activeCount = Object.values(active).reduce((s, v) => s + v.length, 0);
  const toggle = (prop, val) => setActive((a) => {
    const cur = new Set(a[prop] || []);
    cur.has(val) ? cur.delete(val) : cur.add(val);
    return { ...a, [prop]: [...cur] };
  });

  const filtered = list.filter((it) => {
    if (q && !(it.name + " " + (it.tags || []).join(" ")).toLowerCase().includes(q.toLowerCase())) return false;
    for (const [prop, vals] of Object.entries(active)) {
      if (!vals.length) continue;
      const iv = (it.facets || {})[prop] || [];
      if (!vals.some((v) => iv.includes(v))) return false;
    }
    return true;
  });

  const fchip = (on) => ({
    background: on ? "#C49060" : "transparent",
    color: on ? "#fff" : "#C49060",
    border: "1px solid rgba(196,144,96,0.3)",
    borderRadius: 4, padding: "2px 8px", marginRight: 4, marginBottom: 4,
    fontFamily: MONO, fontSize: 10.5, fontWeight: 600, cursor: "pointer",
  });

  return (
    <TiltCard dark={dark} style={{ flex: embedUrl ? "1.5 1 420px" : "1 1 340px", padding: 24, marginBottom: 0 }} glow={false} max={3}>
      <div style={{ textAlign: "center" }}>
        <PixelIcon type={icon} size={30} color="#C49060" />
        <h3 style={{ fontFamily: MONO, fontSize: 18, fontWeight: 700, color: p.fg, margin: "10px 0 6px" }}>
          {title} {list.length > 0 && <span style={{ color: p.faint, fontSize: 13 }}>({filtered.length}{filtered.length !== list.length ? "/" + list.length : ""})</span>}
        </h3>
        <p style={{ fontFamily: SANS, fontSize: 13.5, color: p.muted, margin: "0 0 14px", fontStyle: "italic" }}>{sub}</p>
      </div>
      {embedUrl ? (
        <NotionEmbed dark={dark} url={embedUrl} openUrl={embedOpenUrl} label={embedLabel} title={embedTitle} />
      ) : list.length === 0 ? (
        <div style={{ textAlign: "center", padding: "8px 0" }}>
          <TerminalText dark={dark}>{emptyNote || "coming soon"}</TerminalText>
        </div>
      ) : (
        <>
          {list.length > 8 && (
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder={`search ${list.length}…`}
              style={{ width: "100%", background: dark ? "rgba(255,255,255,0.03)" : "rgba(0,0,0,0.02)", border: "1px solid rgba(196,144,96,0.15)", borderRadius: 6, padding: "7px 12px", fontFamily: MONO, fontSize: 12.5, color: p.fg, outline: "none", marginBottom: 8 }}
            />
          )}

          {/* faceted filters — one group per Notion property */}
          {groups.length > 0 && (
            <div style={{ marginBottom: 10 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <button onClick={() => setFiltersOpen((o) => !o)} style={{ background: "none", border: "1px solid " + p.border, borderRadius: 6, padding: "5px 10px", fontFamily: MONO, fontSize: 11.5, color: p.muted, cursor: "pointer" }}>
                  {filtersOpen ? "▾" : "▸"} filters{activeCount ? ` (${activeCount})` : ""}
                </button>
                {activeCount > 0 && (
                  <button onClick={() => setActive({})} style={{ background: "none", border: "none", color: "#8B9D77", fontFamily: MONO, fontSize: 11, cursor: "pointer" }}>clear ✕</button>
                )}
              </div>
              {filtersOpen && (
                <div style={{ marginTop: 8, borderLeft: "2px solid rgba(196,144,96,0.2)", paddingLeft: 10 }}>
                  {groups.map((grp) => (
                    <div key={grp.name} style={{ marginBottom: 8 }}>
                      <div style={{ fontFamily: MONO, fontSize: 10.5, color: "#8B9D77", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 4 }}>{grp.name}</div>
                      <div style={{ display: "flex", flexWrap: "wrap" }}>
                        {grp.values.map((v) => (
                          <button key={v} onClick={() => toggle(grp.name, v)} style={fchip((active[grp.name] || []).includes(v))}>{v}</button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          <div style={{ display: "flex", flexDirection: "column", gap: 8, maxHeight: list.length > 6 ? 420 : "none", overflowY: list.length > 6 ? "auto" : "visible", paddingRight: list.length > 6 ? 4 : 0 }}>
            {filtered.map((it, i) => (
              <a key={i} href={it.link} target="_blank" rel="noopener noreferrer" style={{ textDecoration: "none", borderTop: i ? "1px solid " + p.borderSoft : "none", paddingTop: i ? 8 : 0 }}>
                <div style={{ fontFamily: MONO, fontSize: 13.5, fontWeight: 700, color: p.fg }}>{it.name}</div>
                {it.detail && <div style={{ fontFamily: SANS, fontSize: 12.5, color: p.muted, lineHeight: 1.5, marginTop: 2 }}>{it.detail}</div>}
                {it.tags && it.tags.length > 0 && (
                  <div style={{ marginTop: 6 }}>
                    {it.tags.slice(0, 4).map((t) => (
                      <Tag key={t} dark={dark}>{t}</Tag>
                    ))}
                  </div>
                )}
              </a>
            ))}
            {filtered.length === 0 && <div style={{ fontFamily: SANS, fontSize: 13, color: p.faint, textAlign: "center", padding: 8 }}>no matches</div>}
          </div>
        </>
      )}
    </TiltCard>
  );
}

// Notion's public page URL refuses framing, but its /ebd/ embed endpoint allows
// it — so we iframe the /ebd/ URL and link the pretty URL for "open".
const WORKOUT_EMBED_URL = "https://picayune-replace-c1a.notion.site/ebd/382b647699e881b0b236d759e85573ff";
const WORKOUT_PAGE_URL = "https://picayune-replace-c1a.notion.site/Periodized-Plan-3-382b647699e881b0b236d759e85573ff";

// Reusable "browser window" that embeds an external page (Notion, etc.) inline,
// with a graceful fallback if the site refuses to be iframed. `url` is the iframe
// source; `openUrl` (optional) is where the ↗ open link and fallback point.
function NotionEmbed({ dark, url, openUrl, title, label, cta = "open →", icon = "dumbbell" }) {
  const p = palette(dark);
  const link = openUrl || url;
  const [loaded, setLoaded] = useState(false);
  const [blocked, setBlocked] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => { if (!loaded) setBlocked(true); }, 8000);
    return () => clearTimeout(t);
  }, [loaded]);
  return (
    <div style={{ borderRadius: 10, overflow: "hidden", border: "1px solid " + p.border }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 12px", borderBottom: "1px solid " + p.border, background: dark ? "rgba(255,255,255,0.03)" : "rgba(0,0,0,0.02)" }}>
        <span style={{ display: "flex", gap: 5 }}>
          {["#E06C6C", "#E0B26C", "#8B9D77"].map((c) => <span key={c} style={{ width: 9, height: 9, borderRadius: "50%", background: c }} />)}
        </span>
        <span style={{ fontFamily: MONO, fontSize: 11.5, color: p.muted, flex: 1, textAlign: "center", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{label}</span>
        <a href={link} target="_blank" rel="noopener noreferrer" style={{ fontFamily: MONO, fontSize: 11, color: "#C49060", textDecoration: "none" }}>↗ open</a>
      </div>
      {blocked ? (
        <div style={{ padding: 32, textAlign: "center" }}>
          <PixelIcon type={icon} size={36} color="#C49060" />
          <p style={{ fontFamily: SANS, fontSize: 14, color: p.muted, margin: "14px 0 18px", lineHeight: 1.7 }}>
            Taking a moment to load — open it full-screen if you'd rather:
          </p>
          <LinkButton href={link}>{cta}</LinkButton>
        </div>
      ) : (
        <iframe
          src={url}
          title={title}
          onLoad={() => setLoaded(true)}
          allowFullScreen
          style={{ width: "100%", height: "clamp(460px, 74vh, 900px)", border: "none", display: "block", background: "#fff" }}
        />
      )}
    </div>
  );
}

// Deployed Cloudflare Worker URL (see workers/ + INTEGRATION.md). Empty = the
// form just shows a local thank-you and doesn't hit any backend.
const FORM_ENDPOINT = "amit-sh-recipe-form.ashenoy000.workers.dev";

export function WellnessPage({ dark }) {
  const p = palette(dark);
  const [form, setForm] = useState({ type: "recipe", name: "", details: "", email: "", website: "" }); // website = honeypot
  const [submitted, setSubmitted] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");

  async function submit() {
    if (!form.name || !form.details) return;
    if (!FORM_ENDPOINT) { setSubmitted(true); return; } // no backend wired yet
    setSending(true); setError("");
    try {
      const r = await fetch(FORM_ENDPOINT, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
      if (!r.ok) throw new Error();
      setSubmitted(true);
    } catch {
      setError("Couldn't send just now — try again, or email me instead.");
    } finally {
      setSending(false);
    }
  }

  return (
    <Section style={{ paddingTop: 96 }}>
      <SectionHeader dark={dark} title="Meal Plans & Workouts" icon="dumbbell" sub="Because optimizing macros and optimizing hyperparameters use the same part of my brain." />
      <div style={{ display: "flex", gap: 16, flexWrap: "wrap", marginBottom: 40, alignItems: "flex-start" }}>
        <WellnessColumn dark={dark} icon="chef" title="Meal Plans" sub="Recipes engineered for function. Occasionally also for taste." items={wellnessData.meals} emptyNote="syncing from Notion…" />
        <WellnessColumn dark={dark} icon="dumbbell" title="Workouts" sub="Progressive overload, tracked obsessively. As one does." items={wellnessData.workouts} embedUrl={WORKOUT_EMBED_URL} embedOpenUrl={WORKOUT_PAGE_URL} embedLabel="Periodized-Plan-3" embedTitle="Periodized Plan" />
      </div>
      <Card dark={dark}>
        <h3 style={{ fontFamily: MONO, fontSize: 18, fontWeight: 700, color: p.fg, margin: "0 0 6px" }}>Suggest Something</h3>
        <p style={{ fontFamily: SANS, fontSize: 14, color: p.muted, margin: "0 0 20px", fontStyle: "italic" }}>
          Got a recipe or workout I should try? I take recommendations seriously. Possibly too seriously.
        </p>
        {submitted ? (
          <TerminalBlock dark={dark} prompt="amit@wellness ~ $">echo "Received. Will report back." ✓</TerminalBlock>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <div style={{ display: "flex", gap: 8 }}>
              {["recipe", "workout"].map((t) => (
                <button
                  key={t}
                  onClick={() => setForm({ ...form, type: t })}
                  style={{
                    background: form.type === t ? "#C49060" : "transparent",
                    color: form.type === t ? "#FFF" : "#C49060",
                    border: "1px solid rgba(196,144,96,0.25)",
                    cursor: "pointer",
                    padding: "6px 16px",
                    borderRadius: 4,
                    fontFamily: MONO,
                    fontSize: 12,
                    textTransform: "uppercase",
                  }}
                >
                  {t}
                </button>
              ))}
            </div>
            <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder={form.type === "recipe" ? "Recipe name" : "Workout name"} style={inp(dark, p)} />
            <input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="Your email (optional)" style={inp(dark, p)} />
            <textarea value={form.details} onChange={(e) => setForm({ ...form, details: e.target.value })} placeholder="Details, link, or instructions..." rows={3} style={{ ...inp(dark, p), resize: "vertical" }} />
            {/* honeypot — hidden from humans; bots fill it and get silently dropped */}
            <input tabIndex={-1} autoComplete="off" aria-hidden="true" value={form.website} onChange={(e) => setForm({ ...form, website: e.target.value })} placeholder="Leave this empty" style={{ position: "absolute", left: "-9999px", width: 1, height: 1, opacity: 0 }} />
            {error && <span style={{ fontFamily: MONO, fontSize: 12, color: "#E06C6C" }}>{error}</span>}
            <button
              onClick={submit}
              disabled={sending}
              style={{ background: "#C49060", color: "#FFF", border: "none", cursor: sending ? "wait" : "pointer", opacity: sending ? 0.7 : 1, padding: "10px 20px", borderRadius: 6, alignSelf: "flex-start", fontFamily: MONO, fontSize: 13, fontWeight: 700 }}
            >
              {sending ? "sending…" : "submit →"}
            </button>
          </div>
        )}
      </Card>
    </Section>
  );
}
const inp = (dark, p) => ({
  background: dark ? "rgba(255,255,255,0.03)" : "rgba(0,0,0,0.02)",
  border: "1px solid rgba(196,144,96,0.15)",
  borderRadius: 6,
  padding: "10px 14px",
  fontFamily: MONO,
  fontSize: 14,
  color: p.fg,
  outline: "none",
});

// ── Blog ─────────────────────────────────────────────────────────────────────
const SUBSTACK_URL = "https://substack.com/@knowledgegraphlover";

export function BlogPage({ dark }) {
  const p = palette(dark);
  const posts = blogData.posts || [];

  return (
    <Section style={{ paddingTop: 96 }}>
      <SectionHeader dark={dark} title="Blog & Writing" icon="pen" sub="Thoughts on research, FOSS, sustainability, and the occasionally unreasonable behavior of gradient descent." />

      {/* Published writing (Woof Magazine, etc.) */}
      {WRITING.length > 0 && (
        <div style={{ marginBottom: 32 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
            <PixelIcon type="scroll" size={18} />
            <h3 style={{ fontFamily: MONO, fontSize: 16, fontWeight: 700, color: p.fg, margin: 0 }}>Published</h3>
          </div>
          {WRITING.map((w) => (
            <TiltCard key={w.id} dark={dark} max={5} onClick={() => window.open(w.url, "_blank")}>
              <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 8, marginBottom: 6 }}>
                <h3 style={{ fontFamily: MONO, fontSize: 15.5, fontWeight: 700, color: p.fg, margin: 0, flex: 1, minWidth: 220 }}>{w.title}</h3>
                <Tag dark={dark}>{w.outlet} · {w.year}</Tag>
              </div>
              {w.blurb && <p style={{ fontFamily: SANS, fontSize: 14, color: p.soft, lineHeight: 1.7, margin: "0 0 10px" }}>{w.blurb}</p>}
              <span style={{ fontFamily: MONO, fontSize: 12, fontWeight: 600, color: "#8B9D77" }}>read on {new URL(w.url).hostname.replace("www.", "")} →</span>
            </TiltCard>
          ))}
        </div>
      )}

      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
        <PixelIcon type="pen" size={18} />
        <h3 style={{ fontFamily: MONO, fontSize: 16, fontWeight: 700, color: p.fg, margin: 0 }}>Substack</h3>
      </div>
      {posts.length === 0 ? (
        <TiltCard dark={dark} style={{ textAlign: "center", padding: 40 }}>
          <PixelIcon type="pen" size={36} color="#C49060" />
          <h3 style={{ fontFamily: MONO, fontSize: 20, fontWeight: 700, color: p.fg, margin: "16px 0 8px" }}>Read on Substack</h3>
          <p style={{ fontFamily: SANS, fontSize: 15, color: p.muted, margin: "0 0 24px", fontStyle: "italic" }}>
            Latest posts pull in automatically once the publication goes live. In the meantime:
          </p>
          <LinkButton href={SUBSTACK_URL}>follow on substack →</LinkButton>
        </TiltCard>
      ) : (
        <>
          <TerminalBlock dark={dark} prompt="amit@blog ~ $">curl -s substack/feed | head -{posts.length}</TerminalBlock>
          {posts.map((post, i) => (
            <TiltCard key={i} dark={dark} max={5} onClick={() => window.open(post.link, "_blank")}>
              <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 8, marginBottom: 6 }}>
                <h3 style={{ fontFamily: MONO, fontSize: 16, fontWeight: 700, color: p.fg, margin: 0 }}>{post.title}</h3>
                {post.date && <Tag dark={dark}>{formatDate(post.date)}</Tag>}
              </div>
              {post.excerpt && <p style={{ fontFamily: SANS, fontSize: 14, color: p.soft, lineHeight: 1.7, margin: "0 0 10px" }}>{post.excerpt}…</p>}
              <span style={{ fontFamily: MONO, fontSize: 12, fontWeight: 600, color: "#8B9D77" }}>read on substack →</span>
            </TiltCard>
          ))}
          <div style={{ textAlign: "center", marginTop: 20 }}>
            <LinkButton href={SUBSTACK_URL} filled={false}>see all posts →</LinkButton>
          </div>
        </>
      )}
    </Section>
  );
}
function formatDate(s) {
  const d = new Date(s);
  return isNaN(d) ? s : d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

// ── Contact ──────────────────────────────────────────────────────────────────
export function ContactPage({ dark }) {
  const p = palette(dark);
  const contacts = [
    { label: "EMAIL", value: PROFILE.email, href: "mailto:" + PROFILE.email },
    { label: "PHONE", value: PROFILE.phone, href: PROFILE.phoneHref },
    { label: "LINKEDIN", value: "/in/itsamit", href: PROFILE.linkedin },
    { label: "GITHUB", value: "xX-its-amit-Xx", href: PROFILE.github },
  ];
  return (
    <Section style={{ paddingTop: 96 }}>
      <SectionHeader dark={dark} title="Contact" icon="signal" sub="I respond to emails, calendar invites, and sufficiently interesting DMs." />
      <TerminalBlock dark={dark} prompt="amit@contact ~ $">cat ~/.contact</TerminalBlock>
      <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 24 }}>
        {contacts.map((c) => (
          <TiltCard key={c.label} dark={dark} style={{ flex: "1 1 180px", marginBottom: 0 }} max={6}>
            <p style={{ fontFamily: MONO, fontSize: 11, color: "#8B9D77", margin: "0 0 6px", textTransform: "uppercase", letterSpacing: "0.08em" }}>{c.label}</p>
            <a href={c.href} target="_blank" rel="noopener noreferrer" style={{ fontFamily: MONO, fontSize: 14, fontWeight: 700, color: "#C49060", textDecoration: "none", wordBreak: "break-all" }}>{c.value}</a>
          </TiltCard>
        ))}
      </div>
      <TiltCard dark={dark} style={{ textAlign: "center", padding: 32 }}>
        <h3 style={{ fontFamily: MONO, fontSize: 18, fontWeight: 700, color: p.fg, margin: "0 0 8px" }}>Book a Meeting</h3>
        <p style={{ fontFamily: SANS, fontSize: 14, color: p.muted, margin: "0 0 20px", fontStyle: "italic" }}>I promise I'm more animated in real time than in monospace.</p>
        <LinkButton href={PROFILE.calendly}>open calendly →</LinkButton>
      </TiltCard>
    </Section>
  );
}

// ── Careers ──────────────────────────────────────────────────────────────────
export function CareersPage({ dark }) {
  const p = palette(dark);
  const h3 = { fontFamily: MONO, fontSize: 18, fontWeight: 700, color: p.fg, margin: "0 0 10px" };
  const body = { fontFamily: SANS, fontSize: 14, color: p.muted, margin: "0 0 10px", lineHeight: 1.7 };
  const liStyle = { fontFamily: SANS, fontSize: 14, color: p.muted, lineHeight: 1.7, marginBottom: 6 };
  const codeStyle = { fontFamily: MONO, fontSize: 13, color: "#C49060", background: dark ? "rgba(196,144,96,0.08)" : "rgba(196,144,96,0.06)", padding: "1px 6px", borderRadius: 3 };
  return (
    <Section style={{ paddingTop: 96 }}>
      <SectionHeader dark={dark} title="Careers" icon="scroll" sub="Free templates and a no-fluff guide to building a resume that won't get auto-rejected." />

      <Card dark={dark}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
          <PixelIcon type="scroll" size={20} />
          <h3 style={h3}>Google Docs Resume Template</h3>
        </div>
        <p style={body}>
          A clean one-page template I share with students at Northeastern. Sections for Education, Skills, and Project / Work /
          Volunteer Experience, plus optional Mission Statement and Background blocks. In Google Docs, do <strong>File → Make a copy</strong> to start your own.
        </p>
        <div style={{ borderRadius: 8, overflow: "hidden", border: "1px solid " + p.border, background: "#FFFFFF", marginTop: 12 }}>
          <iframe src="https://docs.google.com/document/d/1MyKi0G6va39nCABmK7Y9FUWh5oAgwUNSo3IriLvyX2g/preview" title="Resume template preview" style={{ width: "100%", height: 600, border: "none", display: "block" }} />
        </div>
        <div style={{ marginTop: 14 }}>
          <LinkButton href="https://docs.google.com/document/d/1MyKi0G6va39nCABmK7Y9FUWh5oAgwUNSo3IriLvyX2g/edit">open in google docs →</LinkButton>
        </div>
      </Card>

      <Card dark={dark}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
          <PixelIcon type="code" size={20} />
          <h3 style={h3}>Notes for Students</h3>
        </div>
        <ul style={{ paddingLeft: 20, margin: "4px 0 0" }}>
          <li style={liStyle}>Keep it to <strong>one page</strong>. Recruiters spend ~7 seconds on the first pass — don't make them scroll.</li>
          <li style={liStyle}>Lead each bullet with an <strong>action verb</strong> (Built, Designed, Led, Analyzed) and end with a <strong>quantifiable outcome</strong> ("reduced runtime 40%", "supported 250+ users", "grew membership from 8 to 32").</li>
          <li style={liStyle}>Order sections by what's strongest <em>for the role you're applying to</em>. Heavy project portfolio? Lead with Projects. New grad with internships? Lead with Experience.</li>
          <li style={liStyle}>The footnote in the template is real: once you have ~2 substantial roles, add a Summary at the top, move Skills directly below it, and push Education to the bottom.</li>
          <li style={liStyle}>Drop the Objective / Mission Statement unless the role explicitly cares (academia, fellowships, mission-driven nonprofits).</li>
          <li style={liStyle}>Skills section: list tools you'd be comfortable being asked about in an interview. If it's on your resume, expect them to ask. If it isn't, don't expect them to.</li>
          <li style={liStyle}>Export as <strong>PDF</strong> (never .docx) before sending. Naming convention: <span style={codeStyle}>Lastname_Firstname_Resume.pdf</span>.</li>
          <li style={liStyle}>Run it past at least one person in the field you're targeting before sending. Northeastern co-op advisors and the Career Design office are free and underused.</li>
        </ul>
      </Card>

      <Card dark={dark}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
          <PixelIcon type="pen" size={20} />
          <h3 style={h3}>Upgrade Path: LaTeX Resume via Overleaf</h3>
        </div>
        <p style={body}>
          Once your resume settles into a stable structure, switching to LaTeX gives you sharper typography, perfectly consistent
          spacing, and version control that actually works. <strong>Overleaf</strong> is a browser-based LaTeX editor — no install needed.
        </p>
        <ol style={{ paddingLeft: 20, margin: "6px 0 14px" }}>
          <li style={liStyle}>Go to <span style={codeStyle}>overleaf.com</span> and click <em>Register</em>. The free tier is plenty for a resume; sign up with your Northeastern email if you want institutional perks.</li>
          <li style={liStyle}>From the dashboard, open <em>Templates</em> → <em>CVs and Résumés</em>. Solid student-friendly options: <strong>Jake's Resume</strong>, <strong>Deedy CV</strong>, and <strong>Awesome CV</strong>. Click <em>Open as Template</em> on whichever fits your style.</li>
          <li style={liStyle}>Edit the <span style={codeStyle}>main.tex</span> file in the left panel. The PDF preview rebuilds automatically on the right whenever you save.</li>
          <li style={liStyle}>Download the PDF (top-right download icon) and you're done. Re-export every time you make changes — don't send the .tex file.</li>
        </ol>
        <p style={body}><em>Tip:</em> keep the Google Doc as your brainstorming surface (easier to draft and rewrite bullets) and treat the LaTeX version as the production renderer.</p>
        <LinkButton href="https://www.overleaf.com">open overleaf →</LinkButton>
      </Card>
    </Section>
  );
}

// ── Resume ───────────────────────────────────────────────────────────────────
export function ResumePage({ dark }) {
  const p = palette(dark);
  return (
    <Section style={{ paddingTop: 96 }}>
      <SectionHeader dark={dark} title="Resume" icon="scroll" sub="The formal version of everything you just read, but with bullet points." />
      <TiltCard dark={dark} style={{ textAlign: "center", padding: 40 }}>
        <PixelIcon type="scroll" size={36} color="#C49060" />
        <h3 style={{ fontFamily: MONO, fontSize: 18, fontWeight: 700, color: p.fg, margin: "16px 0 4px" }}>{PROFILE.name}</h3>
        <p style={{ fontFamily: SANS, fontSize: 14, color: p.muted, margin: "0 0 4px" }}>{PROFILE.degree}</p>
        <p style={{ fontFamily: MONO, fontSize: 13, color: "#C49060", margin: "0 0 20px" }}>{PROFILE.standing}</p>
        <div style={{ display: "flex", gap: 10, justifyContent: "center", flexWrap: "wrap" }}>
          <LinkButton href={RESUME}>open fullscreen →</LinkButton>
          <LinkButton href={RESUME} download="Shenoy_Amit_Resume.pdf" filled={false}>download ↓</LinkButton>
        </div>
      </TiltCard>

      {/* embedded PDF */}
      <TiltCard dark={dark} style={{ padding: 0, overflow: "hidden", marginTop: 20 }} max={2} glow={false}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 14px", borderBottom: "1px solid " + p.border, background: dark ? "rgba(255,255,255,0.03)" : "rgba(0,0,0,0.02)" }}>
          <span style={{ display: "flex", gap: 6 }}>
            {["#E06C6C", "#E0B26C", "#8B9D77"].map((c) => <span key={c} style={{ width: 10, height: 10, borderRadius: "50%", background: c }} />)}
          </span>
          <span style={{ fontFamily: MONO, fontSize: 12, color: p.muted, flex: 1, textAlign: "center" }}>Shenoy_Amit_Resume.pdf</span>
        </div>
        <object data={RESUME + "#view=FitH"} type="application/pdf" style={{ width: "100%", height: "clamp(520px, 82vh, 1000px)", display: "block", background: "#525659" }}>
          <div style={{ padding: 40, textAlign: "center", background: p.card }}>
            <p style={{ fontFamily: SANS, fontSize: 14, color: p.muted, margin: "0 0 16px" }}>
              Your browser won't preview PDFs inline. No problem:
            </p>
            <LinkButton href={RESUME}>open resume.pdf →</LinkButton>
          </div>
        </object>
      </TiltCard>

      <div style={{ marginTop: 24 }}>
        <h3 style={{ fontFamily: MONO, fontSize: 16, fontWeight: 700, color: p.fg, margin: "0 0 12px" }}>skills --list</h3>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
          {SKILLS_FULL.map((s) => (
            <Tag key={s} dark={dark}>{s}</Tag>
          ))}
        </div>
      </div>
    </Section>
  );
}
