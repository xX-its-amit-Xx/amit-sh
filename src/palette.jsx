import { useEffect, useMemo, useRef, useState } from "react";
import { PAGES, PROFILE } from "./data.js";
import { useApp } from "./store.jsx";
import { palette, MONO } from "./theme.js";

// ── Command palette / mini terminal (⌘K or Ctrl-K) ────────────────────────────
// Part launcher, part playable terminal. Type page names to jump, or run
// commands like `help`, `whoami`, `solkadhi`, `sudo`, `theme`. `solkadhi`
// unlocks a secret achievement.
export function CommandPalette({ open, setOpen, setPage, onOpenTrophies }) {
  const { dark, setDark, unlock } = useApp();
  const p = palette(dark);
  const [q, setQ] = useState("");
  const [lines, setLines] = useState([]); // terminal history {t:'in'|'out'|'err', text}
  const inputRef = useRef(null);
  const bodyRef = useRef(null);

  // Global hotkey
  useEffect(() => {
    function onKey(e) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((o) => !o);
      }
      if (e.key === "Escape") setOpen(false);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [setOpen]);

  useEffect(() => {
    if (open) {
      unlock("terminal");
      setTimeout(() => inputRef.current && inputRef.current.focus(), 30);
    } else {
      setQ("");
    }
  }, [open, unlock]);

  useEffect(() => {
    if (bodyRef.current) bodyRef.current.scrollTop = bodyRef.current.scrollHeight;
  }, [lines]);

  const commands = useMemo(
    () => [
      { name: "help", desc: "list available commands" },
      { name: "goto <page>", desc: "jump to a section" },
      { name: "whoami", desc: "about Amit" },
      { name: "theme", desc: "toggle light/dark" },
      { name: "trophies", desc: "open the trophy case" },
      { name: "resume", desc: "open resume.pdf" },
      { name: "contact", desc: "how to reach me" },
      { name: "solkadhi", desc: "???" },
      { name: "clear", desc: "clear the terminal" },
    ],
    []
  );

  function print(entries) {
    setLines((prev) => [...prev, ...entries]);
  }

  function run(raw) {
    const cmd = raw.trim();
    if (!cmd) return;
    print([{ t: "in", text: cmd }]);
    const [name, ...rest] = cmd.split(/\s+/);
    const arg = rest.join(" ");
    const lc = name.toLowerCase();

    // direct page name?
    const pageMatch = PAGES.find((pg) => pg.id.toLowerCase() === lc);
    if (pageMatch) {
      setPage(pageMatch.id);
      print([{ t: "out", text: `→ opening ${pageMatch.id}` }]);
      setOpen(false);
      return;
    }

    switch (lc) {
      case "help":
        print([{ t: "out", text: "commands: " + commands.map((c) => c.name.split(" ")[0]).join(", ") }, { t: "out", text: "tip: just type a page name (work, projects, careers…) to jump there." }]);
        break;
      case "goto":
      case "cd": {
        const target = PAGES.find((pg) => pg.id.toLowerCase() === arg.toLowerCase());
        if (target) {
          setPage(target.id);
          setOpen(false);
        } else {
          print([{ t: "err", text: `no such page: ${arg || "(none)"}` }]);
        }
        break;
      }
      case "whoami":
        print([{ t: "out", text: `${PROFILE.name} — ${PROFILE.blurb}` }]);
        break;
      case "theme":
        setDark(!dark);
        print([{ t: "out", text: `theme → ${!dark ? "dark" : "light"}` }]);
        break;
      case "trophies":
      case "achievements":
        onOpenTrophies();
        setOpen(false);
        break;
      case "resume":
        window.open(import.meta.env.BASE_URL + PROFILE.resumePdf, "_blank");
        print([{ t: "out", text: "→ resume.pdf" }]);
        break;
      case "contact":
        print([{ t: "out", text: `email: ${PROFILE.email}` }, { t: "out", text: `linkedin: ${PROFILE.linkedin}` }]);
        break;
      case "solkadhi":
        unlock("solkadhi");
        print([
          { t: "out", text: "🍜 pouring sol kadhi... a coastal Konkani cooler of coconut milk & kokum." },
          { t: "out", text: "hospitality achievement unlocked. you're always welcome here." },
        ]);
        break;
      case "sudo":
        print([{ t: "err", text: `${PROFILE.name.split(" ")[0]} is not in the sudoers file. This incident will (not) be reported.` }]);
        break;
      case "ls":
        print([{ t: "out", text: PAGES.map((pg) => pg.id.toLowerCase()).join("  ") }]);
        break;
      case "clear":
        setLines([]);
        break;
      default:
        print([{ t: "err", text: `command not found: ${name}. type 'help'.` }]);
    }
  }

  // Filtered launcher suggestions (shown when there's no terminal history yet)
  const suggestions = useMemo(() => {
    const term = q.trim().toLowerCase();
    const pages = PAGES.filter((pg) => pg.id.toLowerCase().includes(term)).map((pg) => ({ kind: "page", id: pg.id, icon: pg.icon }));
    const cmds = commands.filter((c) => c.name.includes(term)).map((c) => ({ kind: "cmd", ...c }));
    return term ? [...pages, ...cmds].slice(0, 8) : [...pages.slice(0, 6), ...cmds.slice(0, 3)];
  }, [q, commands]);

  if (!open) return null;

  return (
    <div
      onClick={() => setOpen(false)}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 400,
        background: "rgba(0,0,0,0.5)",
        backdropFilter: "blur(6px)",
        display: "flex",
        alignItems: "flex-start",
        justifyContent: "center",
        padding: "12vh 16px 16px",
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "min(640px, 100%)",
          background: p.bgTerminal,
          border: "1px solid rgba(196,144,96,0.3)",
          borderRadius: 14,
          boxShadow: "0 30px 80px rgba(0,0,0,0.55)",
          overflow: "hidden",
        }}
      >
        <div style={{ display: "flex", gap: 6, padding: "12px 14px 6px" }}>
          {["#E06C6C", "#E0B26C", "#8B9D77"].map((c) => (
            <span key={c} style={{ width: 10, height: 10, borderRadius: "50%", background: c }} />
          ))}
          <span style={{ marginLeft: 8, fontFamily: MONO, fontSize: 11, color: "#6B5E52" }}>amit@sh — command palette</span>
        </div>

        {lines.length > 0 && (
          <div ref={bodyRef} style={{ maxHeight: 240, overflowY: "auto", padding: "6px 16px", fontFamily: MONO, fontSize: 13, lineHeight: 1.7 }}>
            {lines.map((l, i) => (
              <div key={i} style={{ color: l.t === "in" ? "#C49060" : l.t === "err" ? "#E06C6C" : "#D4C9BC" }}>
                {l.t === "in" ? <span style={{ color: "#8B9D77" }}>amit@sh ~ $ </span> : null}
                {l.text}
              </div>
            ))}
          </div>
        )}

        <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 16px", borderTop: lines.length ? "1px solid rgba(196,144,96,0.12)" : "none" }}>
          <span style={{ fontFamily: MONO, fontSize: 14, color: "#8B9D77" }}>$</span>
          <input
            ref={inputRef}
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                run(q);
                setQ("");
              }
            }}
            placeholder="type a page or command… (try: help, whoami, solkadhi)"
            style={{
              flex: 1,
              background: "transparent",
              border: "none",
              outline: "none",
              fontFamily: MONO,
              fontSize: 14,
              color: "#F5E6D3",
            }}
          />
          <span style={{ fontFamily: MONO, fontSize: 10, color: "#6B5E52" }}>esc</span>
        </div>

        {/* launcher suggestions */}
        <div style={{ borderTop: "1px solid rgba(196,144,96,0.12)", maxHeight: 220, overflowY: "auto" }}>
          {suggestions.map((s, i) => (
            <button
              key={i}
              onClick={() => {
                if (s.kind === "page") {
                  setPage(s.id);
                  setOpen(false);
                } else {
                  run(s.name.split(" ")[0]);
                  setQ("");
                }
              }}
              style={{
                display: "flex",
                width: "100%",
                alignItems: "center",
                gap: 10,
                padding: "9px 16px",
                background: "none",
                border: "none",
                borderBottom: "1px solid rgba(196,144,96,0.06)",
                cursor: "pointer",
                textAlign: "left",
                fontFamily: MONO,
                fontSize: 13,
                color: "#D4C9BC",
              }}
            >
              <span style={{ fontSize: 14 }}>{s.kind === "page" ? s.icon : "›"}</span>
              <span style={{ color: s.kind === "page" ? "#C49060" : "#8B9D77", minWidth: 90 }}>
                {s.kind === "page" ? s.id : s.name}
              </span>
              <span style={{ color: "#6B5E52", fontSize: 12 }}>{s.kind === "page" ? "open section" : s.desc}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
