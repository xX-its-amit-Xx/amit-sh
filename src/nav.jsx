import { useState } from "react";
import { PAGES, PERSONAS } from "./data.js";
import { useApp } from "./store.jsx";
import { palette, MONO, SANS } from "./theme.js";
import { PixelSprite } from "./ui.jsx";

// Order pages by the active persona's path, then append the rest.
function orderedPages(personaId) {
  if (!personaId || !PERSONAS[personaId]) return PAGES;
  const path = PERSONAS[personaId].path;
  const inPath = path.map((id) => PAGES.find((p) => p.id === id)).filter(Boolean);
  const rest = PAGES.filter((p) => !path.includes(p.id));
  return [...inPath, ...rest];
}

export function Nav({ page, setPage, onOpenPalette, onOpenTrophies, onOpenPersona }) {
  const { dark, setDark, persona, progress } = useApp();
  const p = palette(dark);
  const [open, setOpen] = useState(false);
  const pages = orderedPages(persona);
  const activePersona = persona && PERSONAS[persona];

  const iconBtn = {
    background: dark ? "rgba(196,144,96,0.1)" : "rgba(0,0,0,0.04)",
    border: "1px solid rgba(196,144,96,0.18)",
    cursor: "pointer",
    width: 34,
    height: 34,
    borderRadius: 8,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 14,
    color: "#C49060",
    fontFamily: MONO,
  };

  return (
    <nav
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        zIndex: 100,
        background: dark ? "rgba(30,28,25,0.82)" : "rgba(255,250,244,0.82)",
        backdropFilter: "blur(14px)",
        borderBottom: "1px solid " + p.border,
        padding: "0 20px",
        transition: "all 0.3s ease",
      }}
    >
      <div style={{ maxWidth: 1200, margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "space-between", height: 62 }}>
        <button onClick={() => setPage("Home")} style={{ background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: 8 }}>
          <PixelSprite size={26} />
          <span style={{ fontFamily: MONO, fontSize: 16, fontWeight: 700, color: "#C49060", letterSpacing: "0.05em" }}>AMIT.SH</span>
        </button>

        {/* desktop links */}
        <div style={{ display: "flex", gap: 3, alignItems: "center" }} className="desktop-nav">
          {pages.map((pg) => {
            const active = page === pg.id;
            const onPath = activePersona && activePersona.path.includes(pg.id);
            return (
              <button
                key={pg.id}
                onClick={() => setPage(pg.id)}
                title={onPath ? "recommended for you" : undefined}
                style={{
                  background: active ? (dark ? "rgba(196,144,96,0.18)" : "rgba(196,144,96,0.12)") : "none",
                  border: active ? "1px solid rgba(196,144,96,0.28)" : "1px solid transparent",
                  cursor: "pointer",
                  padding: "5px 11px",
                  borderRadius: 6,
                  fontFamily: MONO,
                  fontSize: 12,
                  color: active ? "#C49060" : p.muted,
                  transition: "all 0.2s ease",
                  position: "relative",
                }}
              >
                {pg.id}
                {onPath && !active && (
                  <span style={{ position: "absolute", top: 3, right: 3, width: 4, height: 4, borderRadius: "50%", background: "#8B9D77" }} />
                )}
              </button>
            );
          })}
        </div>

        {/* right controls */}
        <div style={{ display: "flex", gap: 6, alignItems: "center" }} className="desktop-nav">
          <button onClick={onOpenPalette} title="Command palette (⌘K)" style={{ ...iconBtn, width: "auto", padding: "0 10px", gap: 5, fontSize: 12 }}>
            ⌘K
          </button>
          <button onClick={onOpenPersona} title="Who are you?" style={iconBtn}>
            {activePersona ? activePersona.icon : "\u{1F3AD}"}
          </button>
          <button onClick={onOpenTrophies} title="Trophy case" style={{ ...iconBtn, position: "relative" }}>
            {"\u{1F3C6}"}
            <span style={{ position: "absolute", top: -6, right: -6, background: "#8B9D77", color: "#fff", fontSize: 9, fontFamily: MONO, borderRadius: 8, padding: "0 4px", fontWeight: 700 }}>
              {progress.achievements}
            </span>
          </button>
          <button onClick={() => setDark(!dark)} title="Toggle theme" style={iconBtn}>
            {dark ? "☀" : "☾"}
          </button>
        </div>

        {/* mobile controls */}
        <div style={{ display: "flex", gap: 6, alignItems: "center" }} className="mobile-nav">
          <button onClick={onOpenPalette} style={iconBtn}>⌘K</button>
          <button onClick={() => setDark(!dark)} style={iconBtn}>{dark ? "☀" : "☾"}</button>
          <button onClick={() => setOpen(!open)} style={iconBtn}>{open ? "×" : "≡"}</button>
        </div>
      </div>

      {open && (
        <div style={{ padding: "8px 0 16px", display: "flex", flexDirection: "column", gap: 2 }} className="mobile-dropdown">
          {pages.map((pg) => {
            const onPath = activePersona && activePersona.path.includes(pg.id);
            return (
              <button
                key={pg.id}
                onClick={() => {
                  setPage(pg.id);
                  setOpen(false);
                }}
                style={{
                  background: page === pg.id ? "rgba(196,144,96,0.12)" : "none",
                  border: "none",
                  cursor: "pointer",
                  padding: "10px 12px",
                  borderRadius: 6,
                  textAlign: "left",
                  fontFamily: MONO,
                  fontSize: 13,
                  color: page === pg.id ? "#C49060" : p.muted,
                  display: "flex",
                  gap: 8,
                  alignItems: "center",
                }}
              >
                <span>{pg.icon}</span> {pg.id}
                {onPath && <span style={{ marginLeft: "auto", fontSize: 10, color: "#8B9D77" }}>★</span>}
              </button>
            );
          })}
          <div style={{ display: "flex", gap: 8, padding: "8px 12px 0" }}>
            <button onClick={() => { onOpenPersona(); setOpen(false); }} style={{ ...mobBtn(p) }}>
              {activePersona ? `${activePersona.icon} ${activePersona.label}` : "🎭 who are you?"}
            </button>
            <button onClick={() => { onOpenTrophies(); setOpen(false); }} style={mobBtn(p)}>
              🏆 {progress.achievements}/{progress.totalAchievements}
            </button>
          </div>
        </div>
      )}
    </nav>
  );
}

function mobBtn(p) {
  return {
    flex: 1,
    background: "none",
    border: "1px solid " + p.border,
    borderRadius: 6,
    padding: "8px 10px",
    fontFamily: MONO,
    fontSize: 12,
    color: p.muted,
    cursor: "pointer",
  };
}

// ── Persona picker modal ──────────────────────────────────────────────────────
export function PersonaPicker({ open, onClose }) {
  const { dark, persona, setPersona } = useApp();
  const p = palette(dark);
  if (!open) return null;
  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 260,
        background: "rgba(0,0,0,0.55)",
        backdropFilter: "blur(6px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 16,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{ width: "min(560px, 100%)", background: p.bgElevated, border: "1px solid " + p.border, borderRadius: 16, padding: 24, boxShadow: p.shadow }}
      >
        <div style={{ fontFamily: MONO, fontSize: 12, color: "#8B9D77", marginBottom: 4 }}>{"> who's visiting?"}</div>
        <h3 style={{ fontFamily: MONO, fontSize: 20, fontWeight: 700, color: p.fg, margin: "0 0 6px" }}>Tune the site to you</h3>
        <p style={{ fontFamily: SANS, fontSize: 14, color: p.muted, margin: "0 0 18px", lineHeight: 1.6 }}>
          Same me — different route. Pick a lens and the nav reorders to put your best stops first. Change it anytime.
        </p>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px,1fr))", gap: 10 }}>
          {Object.values(PERSONAS).map((ps) => {
            const active = persona === ps.id;
            return (
              <button
                key={ps.id}
                onClick={() => {
                  setPersona(ps.id);
                  onClose();
                }}
                style={{
                  textAlign: "left",
                  background: active ? (dark ? "rgba(196,144,96,0.12)" : "rgba(196,144,96,0.08)") : p.card,
                  border: "1px solid " + (active ? "rgba(196,144,96,0.4)" : p.border),
                  borderRadius: 12,
                  padding: 16,
                  cursor: "pointer",
                  transition: "all 0.2s ease",
                }}
              >
                <div style={{ fontSize: 24, marginBottom: 6 }}>{ps.icon}</div>
                <div style={{ fontFamily: MONO, fontSize: 14, fontWeight: 700, color: p.fg }}>{ps.label}</div>
                <div style={{ fontFamily: SANS, fontSize: 12.5, color: p.muted, marginTop: 3, lineHeight: 1.5 }}>{ps.blurb}</div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ── Guided-path banner (shows the persona's recommended next stops) ──────────
export function GuidedPath({ page, setPage }) {
  const { dark, persona } = useApp();
  const p = palette(dark);
  if (!persona || !PERSONAS[persona]) return null;
  const ps = PERSONAS[persona];
  const idx = ps.path.indexOf(page);
  const next = idx >= 0 && idx < ps.path.length - 1 ? ps.path[idx + 1] : ps.path.find((x) => x !== page);
  return (
    <div style={{ maxWidth: 900, margin: "0 auto", padding: "0 24px", position: "relative", zIndex: 20 }}>
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 8,
          background: dark ? "rgba(30,32,28,0.96)" : "rgba(238,242,235,0.98)",
          border: "1px solid rgba(139,157,119,0.3)",
          borderRadius: 12,
          padding: "10px 16px",
          marginTop: 84,
          marginBottom: -60,
          backdropFilter: "blur(6px)",
          boxShadow: dark ? "0 8px 24px rgba(0,0,0,0.35)" : "0 8px 24px rgba(93,64,38,0.08)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
          <span style={{ fontSize: 18 }}>{ps.icon}</span>
          <span style={{ fontFamily: SANS, fontSize: 13.5, color: p.soft, flex: 1, minWidth: 200 }}>
            <strong style={{ color: p.fg }}>{ps.label} route:</strong> {ps.greeting}
          </span>
        </div>
        {/* clickable route — every stop navigates */}
        <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
          {ps.path.map((pg, i) => {
            const isCurrent = pg === page;
            const isNext = pg === next;
            return (
              <span key={pg} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <button
                  onClick={() => setPage(pg)}
                  title={isCurrent ? "you're here" : `go to ${pg}`}
                  style={{
                    background: isCurrent ? "#8B9D77" : isNext ? "rgba(139,157,119,0.22)" : "transparent",
                    color: isCurrent ? "#fff" : "#8B9D77",
                    border: "1px solid " + (isCurrent ? "#8B9D77" : "rgba(139,157,119,0.35)"),
                    borderRadius: 6,
                    padding: "4px 11px",
                    fontFamily: MONO,
                    fontSize: 12,
                    fontWeight: 700,
                    cursor: "pointer",
                    transition: "all 0.15s ease",
                  }}
                >
                  {pg.toLowerCase()}{isNext ? " →" : ""}
                </button>
                {i < ps.path.length - 1 && <span style={{ color: p.faint, fontFamily: MONO, fontSize: 11 }}>›</span>}
              </span>
            );
          })}
        </div>
      </div>
    </div>
  );
}
