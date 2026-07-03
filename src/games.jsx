import { useEffect, useRef, useState } from "react";
import { palette, MONO, SANS } from "./theme.js";
import { PixelIcon } from "./ui.jsx";

// ── BASE PAIR ─────────────────────────────────────────────────────────────────
// A science reflex game: a DNA base appears; tap its Watson–Crick complement
// (A↔T, G↔C) as fast as you can before the 30s clock runs out. Wrong pair costs
// 2 seconds. Universally playable (tap only), on-brand for a bioengineer.
const COMPLEMENT = { A: "T", T: "A", G: "C", C: "G" };
const BASES = ["A", "T", "G", "C"];
const BASE_COLOR = { A: "#C49060", T: "#8B9D77", G: "#7FA6C4", C: "#C4907F" };

export function BasePairGame({ dark }) {
  const p = palette(dark);
  const [running, setRunning] = useState(false);
  const [base, setBase] = useState("A");
  const [score, setScore] = useState(0);
  const [best, setBest] = useState(0);
  const [time, setTime] = useState(30);
  const [flash, setFlash] = useState(null); // 'ok' | 'bad'
  const timeRef = useRef(30);

  useEffect(() => {
    if (!running) return;
    const iv = setInterval(() => {
      timeRef.current = Math.max(0, timeRef.current - 1);
      setTime(timeRef.current);
      if (timeRef.current <= 0) {
        setRunning(false);
        setBest((b) => Math.max(b, score));
      }
    }, 1000);
    return () => clearInterval(iv);
  }, [running, score]);

  function start() {
    setScore(0);
    timeRef.current = 30;
    setTime(30);
    setBase(BASES[Math.floor(Math.random() * 4)]);
    setRunning(true);
  }
  function guess(b) {
    if (!running) return;
    if (COMPLEMENT[base] === b) {
      setScore((s) => s + 1);
      setFlash("ok");
      setBase(BASES[Math.floor(Math.random() * 4)]);
    } else {
      setFlash("bad");
      timeRef.current = Math.max(0, timeRef.current - 2);
      setTime(timeRef.current);
    }
    setTimeout(() => setFlash(null), 140);
  }

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12, flexWrap: "wrap", gap: 8 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <PixelIcon type="molecule" size={18} />
          <span style={{ fontFamily: MONO, fontSize: 14, fontWeight: 700, color: p.fg }}>BASE PAIR</span>
        </div>
        <span style={{ fontFamily: MONO, fontSize: 12, color: p.muted }}>score {score} · best {best} · {time}s</span>
      </div>

      <div style={{ textAlign: "center", padding: "8px 0 16px" }}>
        <div style={{ fontFamily: SANS, fontSize: 12, color: p.muted, marginBottom: 8 }}>{running ? "tap the complementary base" : "match A↔T and G↔C before time runs out"}</div>
        <div
          style={{
            display: "inline-flex", alignItems: "center", justifyContent: "center",
            width: 84, height: 84, borderRadius: "50%",
            background: flash === "bad" ? "#E06C6C" : BASE_COLOR[base],
            color: "#fff", fontFamily: MONO, fontSize: 40, fontWeight: 700,
            boxShadow: `0 0 26px ${flash === "bad" ? "rgba(224,108,108,0.6)" : "rgba(196,144,96,0.5)"}`,
            transition: "transform 0.14s ease", transform: flash === "ok" ? "scale(1.12)" : "scale(1)",
          }}
        >
          {running ? base : "?"}
        </div>
      </div>

      {running ? (
        <div style={{ display: "flex", gap: 8, justifyContent: "center", flexWrap: "wrap" }}>
          {BASES.map((b) => (
            <button key={b} onClick={() => guess(b)} style={{
              width: 52, height: 52, borderRadius: 10, cursor: "pointer",
              background: "transparent", color: BASE_COLOR[b], border: "2px solid " + BASE_COLOR[b],
              fontFamily: MONO, fontSize: 22, fontWeight: 700,
            }}>{b}</button>
          ))}
        </div>
      ) : (
        <div style={{ textAlign: "center" }}>
          <button onClick={start} style={{ background: "#C49060", color: "#fff", border: "none", borderRadius: 8, padding: "9px 24px", fontFamily: MONO, fontSize: 13, fontWeight: 700, cursor: "pointer", boxShadow: "0 6px 16px rgba(196,144,96,0.35)" }}>
            {score > 0 ? `again — last: ${score}` : "START"}
          </button>
        </div>
      )}
    </div>
  );
}

// ── DOCK ──────────────────────────────────────────────────────────────────────
// A one-tap timing game: a ligand sweeps across the track; lock it inside the
// binding pocket. Each successful dock shrinks the pocket — how far do you push?
// Non-obstructive: lives in a card, only runs when you start it. A perfect dock
// unlocks the "docked" achievement.
export function DockGame({ dark, onDock }) {
  const p = palette(dark);
  const [running, setRunning] = useState(false);
  const [pos, setPos] = useState(0); // 0..1 ligand position
  const [pocket, setPocket] = useState({ center: 0.5, width: 0.26 });
  const [streak, setStreak] = useState(0);
  const [best, setBest] = useState(0);
  const [msg, setMsg] = useState("Lock the ligand inside the pocket.");
  const dir = useRef(1);
  const raf = useRef(0);
  const posRef = useRef(0);
  const firedRef = useRef(false);

  useEffect(() => {
    if (!running) {
      cancelAnimationFrame(raf.current);
      return;
    }
    const speed = 0.008 + Math.min(streak, 8) * 0.0016;
    function loop() {
      let next = posRef.current + dir.current * speed;
      if (next >= 1) {
        next = 1;
        dir.current = -1;
      } else if (next <= 0) {
        next = 0;
        dir.current = 1;
      }
      posRef.current = next;
      setPos(next);
      raf.current = requestAnimationFrame(loop);
    }
    raf.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf.current);
  }, [running, streak]);

  function start() {
    setStreak(0);
    setPocket({ center: 0.3 + Math.random() * 0.4, width: 0.26 });
    posRef.current = 0;
    dir.current = 1;
    firedRef.current = false;
    setMsg("Tap LOCK when the ligand is in the pocket.");
    setRunning(true);
  }

  function lock() {
    if (!running) return start();
    const { center, width } = pocket;
    const hit = Math.abs(posRef.current - center) <= width / 2;
    if (hit) {
      const perfect = Math.abs(posRef.current - center) <= width / 6;
      const ns = streak + 1;
      setStreak(ns);
      setBest((b) => Math.max(b, ns));
      setMsg(perfect ? `Perfect dock! ×${ns}` : `Bound. ×${ns}`);
      // shrink the pocket & relocate → tactical escalation
      setPocket({ center: 0.2 + Math.random() * 0.6, width: Math.max(0.08, width * 0.86) });
      if (!firedRef.current) {
        firedRef.current = true;
        onDock && onDock();
      }
    } else {
      setMsg(`Missed — ΔG unfavorable. Streak was ${streak}.`);
      setRunning(false);
    }
  }

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10, flexWrap: "wrap", gap: 8 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <PixelIcon type="molecule" size={18} />
          <span style={{ fontFamily: MONO, fontSize: 14, fontWeight: 700, color: p.fg }}>DOCK</span>
        </div>
        <span style={{ fontFamily: MONO, fontSize: 12, color: p.muted }}>streak {streak} · best {best}</span>
      </div>

      {/* track */}
      <div
        style={{
          position: "relative",
          height: 46,
          borderRadius: 10,
          background: dark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.04)",
          border: "1px solid " + p.border,
          overflow: "hidden",
        }}
      >
        {/* pocket */}
        <div
          style={{
            position: "absolute",
            top: 0,
            bottom: 0,
            left: `${(pocket.center - pocket.width / 2) * 100}%`,
            width: `${pocket.width * 100}%`,
            background: "rgba(139,157,119,0.28)",
            borderLeft: "2px dashed rgba(139,157,119,0.6)",
            borderRight: "2px dashed rgba(139,157,119,0.6)",
          }}
        />
        {/* ligand */}
        <div
          style={{
            position: "absolute",
            top: "50%",
            left: `${pos * 100}%`,
            transform: "translate(-50%,-50%)",
            width: 18,
            height: 18,
            borderRadius: "50%",
            background: "#C49060",
            boxShadow: "0 0 14px rgba(196,144,96,0.8)",
            transition: "none",
          }}
        />
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 12, flexWrap: "wrap" }}>
        <button
          onClick={lock}
          style={{
            background: "#C49060",
            color: "#fff",
            border: "none",
            borderRadius: 8,
            padding: "9px 22px",
            fontFamily: MONO,
            fontSize: 13,
            fontWeight: 700,
            cursor: "pointer",
            boxShadow: "0 6px 16px rgba(196,144,96,0.35)",
          }}
        >
          {running ? "LOCK" : "START"}
        </button>
        <span style={{ fontFamily: SANS, fontSize: 13, color: p.muted, fontStyle: "italic" }}>{msg}</span>
      </div>
    </div>
  );
}
