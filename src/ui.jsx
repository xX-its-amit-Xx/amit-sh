import { useRef, useState } from "react";
import { palette, MONO, SANS } from "./theme.js";

// ── Pixel avatar ──────────────────────────────────────────────────────────────
export function PixelSprite({ size = 80, style: s = {}, onClick }) {
  const grid = [
    "...HHHH...",
    "..HHHHHH..",
    ".HHHHHHH..",
    ".SSSHHHSS.",
    ".SSEESSE..",
    ".SSS.SSS..",
    "..SSSSSS..",
    "..SMMMM...",
    "...BBBB...",
    "..BWWWWB..",
    "..BBBBBB..",
    ".BB.BB.BB.",
    ".B..BB..B.",
  ];
  const colors = { H: "#2D2926", S: "#D4A574", E: "#5C3D2E", M: "#C47070", B: "#2C3E6B", W: "#F0EDE8" };
  return (
    <svg
      width={size}
      height={size * 1.3}
      viewBox="0 0 10 13"
      onClick={onClick}
      style={{ imageRendering: "pixelated", cursor: onClick ? "pointer" : "inherit", ...s }}
    >
      {grid.map((row, y) =>
        [...row].map((c, x) =>
          c !== "." ? <rect key={x + "-" + y} x={x} y={y} width={1} height={1} fill={colors[c]} /> : null
        )
      )}
    </svg>
  );
}

export function PixelIcon({ type, size = 24, color = "#C49060" }) {
  const icons = {
    molecule: [[1,0],[2,0],[0,1],[3,1],[1,2],[2,2],[1,3],[2,3],[0,4],[3,4],[1,5],[2,5]],
    dumbbell: [[0,2],[1,2],[2,1],[2,2],[2,3],[3,2],[4,2],[5,1],[5,2],[5,3],[6,2],[7,2]],
    controller: [[2,0],[3,0],[4,0],[5,0],[1,1],[2,1],[3,1],[4,1],[5,1],[6,1],[0,2],[1,2],[2,2],[3,2],[4,2],[5,2],[6,2],[7,2],[1,3],[2,3],[3,3],[4,3],[5,3],[6,3],[2,4],[3,4],[4,4],[5,4]],
    leaf: [[3,0],[2,1],[3,1],[4,1],[1,2],[2,2],[3,2],[0,3],[1,3],[2,3],[0,4],[1,4],[1,5]],
    code: [[1,0],[5,0],[0,1],[2,1],[4,1],[6,1],[0,2],[6,2],[0,3],[6,3],[1,4],[5,4],[2,5],[3,5],[4,5]],
    mountain: [[3,0],[2,1],[4,1],[1,2],[5,2],[0,3],[3,3],[6,3],[0,4],[2,4],[4,4],[6,4],[0,5],[1,5],[2,5],[3,5],[4,5],[5,5],[6,5]],
    chef: [[2,0],[3,0],[1,1],[2,1],[3,1],[4,1],[1,2],[4,2],[2,3],[3,3],[1,4],[2,4],[3,4],[4,4],[0,5],[1,5],[2,5],[3,5],[4,5],[5,5]],
    pen: [[5,0],[4,1],[3,2],[2,3],[1,4],[0,5]],
    signal: [[6,0],[6,1],[4,1],[6,2],[4,2],[2,2],[6,3],[4,3],[2,3],[0,3],[6,4],[4,4],[2,4],[0,4]],
    scroll: [[1,0],[2,0],[3,0],[4,0],[0,1],[5,1],[0,2],[1,2],[2,2],[3,2],[4,2],[5,2],[0,3],[5,3],[0,4],[1,4],[2,4],[3,4],[4,4],[5,4],[1,5],[2,5],[3,5],[4,5]],
    graph: [[3,0],[2,1],[3,1],[4,1],[0,2],[3,2],[6,2],[1,3],[2,3],[4,3],[5,3],[0,4],[6,4],[3,5]],
  };
  const pts = icons[type] || icons.code;
  const maxX = Math.max(...pts.map((p) => p[0])) + 1;
  const maxY = Math.max(...pts.map((p) => p[1])) + 1;
  return (
    <svg width={size} height={size * (maxY / maxX)} viewBox={"0 0 " + maxX + " " + maxY} style={{ imageRendering: "pixelated" }}>
      {pts.map((p, i) => (
        <rect key={i} x={p[0]} y={p[1]} width={1} height={1} fill={color} />
      ))}
    </svg>
  );
}

// ── Terminal bits ─────────────────────────────────────────────────────────────
export function TerminalText({ children, dark, style: s = {} }) {
  return (
    <span
      style={{
        fontFamily: MONO,
        background: dark ? "rgba(196,144,96,0.1)" : "rgba(196,144,96,0.08)",
        color: "#C49060",
        padding: "2px 8px",
        borderRadius: 4,
        fontSize: "0.9em",
        letterSpacing: "0.02em",
        ...s,
      }}
    >
      {children}
    </span>
  );
}

export function TerminalBlock({ dark, children, prompt = "amit@hub ~ $" }) {
  const p = palette(dark);
  return (
    <div
      style={{
        background: p.bgTerminal,
        borderRadius: 12,
        padding: "16px 20px",
        fontFamily: MONO,
        fontSize: 13,
        lineHeight: 1.8,
        color: "#8B9D77",
        border: "1px solid rgba(196,144,96,0.18)",
        marginBottom: 20,
        overflow: "auto",
        boxShadow: "inset 0 0 40px rgba(0,0,0,0.25)",
        position: "relative",
      }}
    >
      <div style={{ position: "absolute", top: 12, left: 16, display: "flex", gap: 6 }}>
        {["#E06C6C", "#E0B26C", "#8B9D77"].map((c) => (
          <span key={c} style={{ width: 9, height: 9, borderRadius: "50%", background: c, opacity: 0.8 }} />
        ))}
      </div>
      <div style={{ color: "#6B5E52", marginTop: 14 }}>
        <span style={{ color: "#C49060" }}>{prompt}</span>{" "}
        <span style={{ color: "#D4C9BC" }}>{children}</span>
      </div>
    </div>
  );
}

// ── Layout ────────────────────────────────────────────────────────────────────
export function Section({ children, style: s = {} }) {
  return (
    <section style={{ maxWidth: 900, margin: "0 auto", padding: "80px 24px", position: "relative", zIndex: 1, ...s }}>
      {children}
    </section>
  );
}

export function SectionHeader({ dark, icon, title, sub }) {
  const p = palette(dark);
  return (
    <div style={{ marginBottom: 40 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 8 }}>
        {icon && <PixelIcon type={icon} size={28} color="#C49060" />}
        <h1
          style={{
            fontFamily: MONO,
            fontSize: "clamp(26px, 4vw, 40px)",
            color: p.fg,
            margin: 0,
            fontWeight: 700,
            letterSpacing: "0.01em",
          }}
        >
          {title}
        </h1>
      </div>
      {sub && (
        <p
          style={{
            fontFamily: SANS,
            fontSize: 16,
            marginTop: 8,
            marginLeft: icon ? 40 : 0,
            color: p.muted,
            lineHeight: 1.65,
            maxWidth: 600,
            fontStyle: "italic",
          }}
        >
          {sub}
        </p>
      )}
    </div>
  );
}

// ── 3D tilt card ──────────────────────────────────────────────────────────────
// A card that tilts toward the cursor with a soft accent glow. Falls back to a
// flat card on touch / reduced-motion. This is the workhorse of the "3D" feel.
export function TiltCard({ dark, children, style: s = {}, onClick, max = 8, glow = true }) {
  const p = palette(dark);
  const ref = useRef(null);
  const [t, setT] = useState({ rx: 0, ry: 0, gx: 50, gy: 50, active: false });

  function onMove(e) {
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width;
    const py = (e.clientY - r.top) / r.height;
    setT({
      rx: (0.5 - py) * max * 2,
      ry: (px - 0.5) * max * 2,
      gx: px * 100,
      gy: py * 100,
      active: true,
    });
  }
  function onLeave() {
    setT({ rx: 0, ry: 0, gx: 50, gy: 50, active: false });
  }

  return (
    <div
      ref={ref}
      onMouseMove={onMove}
      onMouseLeave={onLeave}
      onClick={onClick}
      style={{
        background: t.active ? p.cardHover : p.card,
        border: "1px solid " + (t.active ? "rgba(196,144,96,0.35)" : p.border),
        borderRadius: 14,
        padding: 24,
        marginBottom: 16,
        cursor: onClick ? "pointer" : "default",
        transformStyle: "preserve-3d",
        transform: `perspective(900px) rotateX(${t.rx}deg) rotateY(${t.ry}deg) translateZ(0) scale(${t.active ? 1.012 : 1})`,
        transition: t.active ? "transform 0.08s ease-out, border-color 0.2s ease" : "transform 0.4s ease, border-color 0.3s ease",
        boxShadow: t.active ? p.shadow : p.shadowSoft,
        position: "relative",
        overflow: "hidden",
        ...s,
      }}
    >
      {glow && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            pointerEvents: "none",
            opacity: t.active ? 1 : 0,
            transition: "opacity 0.3s ease",
            background: `radial-gradient(340px circle at ${t.gx}% ${t.gy}%, ${p.glow}, transparent 65%)`,
          }}
        />
      )}
      <div style={{ position: "relative", transform: "translateZ(30px)" }}>{children}</div>
    </div>
  );
}

// Plain (non-tilt) card, for dense lists.
export function Card({ dark, children, style: s = {}, onClick }) {
  const p = palette(dark);
  return (
    <div
      onClick={onClick}
      style={{
        background: p.card,
        border: "1px solid " + p.borderSoft,
        borderRadius: 12,
        padding: 24,
        marginBottom: 16,
        transition: "all 0.25s ease",
        cursor: onClick ? "pointer" : "default",
        ...s,
      }}
    >
      {children}
    </div>
  );
}

export function Tag({ dark, children }) {
  return (
    <span
      style={{
        display: "inline-block",
        padding: "3px 10px",
        borderRadius: 4,
        background: dark ? "rgba(196,144,96,0.1)" : "rgba(196,144,96,0.08)",
        color: "#C49060",
        fontSize: 11,
        fontWeight: 600,
        fontFamily: MONO,
        marginRight: 6,
        marginBottom: 6,
        border: "1px solid rgba(196,144,96,0.14)",
      }}
    >
      {children}
    </span>
  );
}

export function LinkButton({ href, children, download, filled = true }) {
  const base = {
    display: "inline-block",
    padding: "10px 22px",
    borderRadius: 8,
    textDecoration: "none",
    fontFamily: MONO,
    fontSize: 13,
    fontWeight: 700,
    transition: "all 0.2s ease",
  };
  const style = filled
    ? { ...base, background: "#C49060", color: "#FFF", boxShadow: "0 6px 18px rgba(196,144,96,0.35)" }
    : { ...base, background: "transparent", color: "#C49060", border: "1px solid rgba(196,144,96,0.3)" };
  return (
    <a href={href} download={download} target={download ? undefined : "_blank"} rel="noopener noreferrer" style={style}>
      {children}
    </a>
  );
}
