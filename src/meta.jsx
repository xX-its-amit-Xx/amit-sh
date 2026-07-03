import { useEffect, useRef, useState } from "react";
import { ACHIEVEMENTS } from "./data.js";
import { useApp } from "./store.jsx";
import { palette, MONO, SANS } from "./theme.js";

// ── Toast stack ───────────────────────────────────────────────────────────────
export function AchievementToasts() {
  const { toasts, dark } = useApp();
  return (
    <div style={{ position: "fixed", right: 16, bottom: 16, zIndex: 300, display: "flex", flexDirection: "column", gap: 10, pointerEvents: "none" }}>
      {toasts.map((t) => (
        <Toast key={t.id} ach={t.ach} dark={dark} />
      ))}
    </div>
  );
}

function Toast({ ach, dark }) {
  const [enter, setEnter] = useState(false);
  useEffect(() => {
    const r = requestAnimationFrame(() => setEnter(true));
    return () => cancelAnimationFrame(r);
  }, []);
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 12,
        minWidth: 260,
        maxWidth: 340,
        background: dark ? "rgba(13,12,10,0.96)" : "rgba(30,28,25,0.97)",
        border: "1px solid rgba(196,144,96,0.4)",
        borderRadius: 12,
        padding: "12px 16px",
        boxShadow: "0 12px 40px rgba(0,0,0,0.4)",
        transform: enter ? "translateX(0)" : "translateX(120%)",
        opacity: enter ? 1 : 0,
        transition: "all 0.45s cubic-bezier(.2,.9,.3,1)",
      }}
    >
      <span style={{ fontSize: 26, filter: "drop-shadow(0 0 6px rgba(196,144,96,0.6))" }}>{ach.icon}</span>
      <div>
        <div style={{ fontFamily: MONO, fontSize: 10, color: "#8B9D77", letterSpacing: "0.08em", textTransform: "uppercase" }}>
          achievement unlocked
        </div>
        <div style={{ fontFamily: MONO, fontSize: 14, color: "#F5E6D3", fontWeight: 700 }}>{ach.title}</div>
        <div style={{ fontFamily: SANS, fontSize: 12, color: "#BEB5AA", marginTop: 2 }}>{ach.desc}</div>
      </div>
    </div>
  );
}

// ── Achievements panel (trophy case) ──────────────────────────────────────────
export function AchievementsPanel({ open, onClose }) {
  const { unlocked, dark, progress } = useApp();
  const p = palette(dark);
  if (!open) return null;
  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 250,
        background: "rgba(0,0,0,0.5)",
        backdropFilter: "blur(4px)",
        display: "flex",
        alignItems: "flex-start",
        justifyContent: "center",
        padding: "80px 16px 16px",
        overflowY: "auto",
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "min(560px, 100%)",
          background: p.bgElevated,
          border: "1px solid " + p.border,
          borderRadius: 16,
          boxShadow: p.shadow,
          overflow: "hidden",
        }}
      >
        <div style={{ padding: "18px 20px", borderBottom: "1px solid " + p.border, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <h3 style={{ fontFamily: MONO, fontSize: 17, fontWeight: 700, color: p.fg, margin: 0 }}>Trophy Case</h3>
            <p style={{ fontFamily: SANS, fontSize: 13, color: p.muted, margin: "4px 0 0" }}>
              {progress.achievements} / {progress.totalAchievements} unlocked · {progress.visited}/{progress.pages} pages explored
            </p>
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 20, color: p.muted, fontFamily: MONO }}>
            ×
          </button>
        </div>

        {/* progress bar */}
        <div style={{ height: 6, background: dark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.05)" }}>
          <div
            style={{
              height: "100%",
              width: `${(progress.achievements / progress.totalAchievements) * 100}%`,
              background: "linear-gradient(90deg,#8B9D77,#C49060)",
              transition: "width 0.5s ease",
            }}
          />
        </div>

        <div style={{ padding: 16, display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))", gap: 10 }}>
          {ACHIEVEMENTS.map((a) => {
            const got = unlocked.has(a.id);
            const hidden = a.secret && !got;
            return (
              <div
                key={a.id}
                style={{
                  border: "1px solid " + (got ? "rgba(196,144,96,0.35)" : p.borderSoft),
                  background: got ? (dark ? "rgba(196,144,96,0.08)" : "rgba(196,144,96,0.06)") : "transparent",
                  borderRadius: 10,
                  padding: "12px 12px",
                  opacity: got ? 1 : 0.55,
                }}
              >
                <div style={{ fontSize: 22, marginBottom: 4, filter: got ? "none" : "grayscale(1)" }}>
                  {hidden ? "\u{2753}" : a.icon}
                </div>
                <div style={{ fontFamily: MONO, fontSize: 12.5, fontWeight: 700, color: p.fg }}>
                  {hidden ? "???" : a.title}
                </div>
                <div style={{ fontFamily: SANS, fontSize: 11.5, color: p.muted, marginTop: 2, lineHeight: 1.4 }}>
                  {hidden ? "A hidden secret. Keep poking around." : a.desc}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ── Secret hooks ──────────────────────────────────────────────────────────────
// Konami code → unlocks "konami".
export function useKonami(onUnlock) {
  const seq = useRef([]);
  useEffect(() => {
    const CODE = ["ArrowUp", "ArrowUp", "ArrowDown", "ArrowDown", "ArrowLeft", "ArrowRight", "ArrowLeft", "ArrowRight", "b", "a"];
    function onKey(e) {
      seq.current.push(e.key);
      if (seq.current.length > CODE.length) seq.current.shift();
      if (CODE.every((k, i) => (seq.current[i] || "").toLowerCase() === k.toLowerCase())) {
        onUnlock();
        seq.current = [];
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onUnlock]);
}
