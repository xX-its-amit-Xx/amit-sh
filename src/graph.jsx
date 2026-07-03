import { useEffect, useRef } from "react";

// ── Constellation background ──────────────────────────────────────────────────
// Full-viewport 2D canvas: drifting points joined by lines when close, with a
// gentle pull toward the cursor. Cheap ambient depth behind everything.
// (Kept dependency-free and separate from the WebGL graph so three.js can be
// lazy-loaded — see graph3d.jsx.)
export function ConstellationBackground({ dark }) {
  const canvasRef = useRef(null);
  const mouse = useRef({ x: -9999, y: -9999 });

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    let raf;
    let w = 0, h = 0;
    let dpr = Math.min(window.devicePixelRatio || 1, 2);
    const reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const COLORS = ["#C49060", "#8B9D77", "#D4A574", "#7FA6C4"];
    let pts = [];

    function seed() {
      const density = Math.min(70, Math.floor((w * h) / 22000));
      pts = Array.from({ length: density }, (_, i) => ({
        x: Math.random() * w, y: Math.random() * h,
        z: 0.3 + Math.random() * 0.7,
        vx: (Math.random() - 0.5) * 0.15, vy: (Math.random() - 0.5) * 0.15,
        c: COLORS[i % COLORS.length],
      }));
    }
    function resize() {
      w = canvas.clientWidth; h = canvas.clientHeight;
      canvas.width = w * dpr; canvas.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      seed();
    }
    function frame() {
      ctx.clearRect(0, 0, w, h);
      const linkDist = 130;
      for (let i = 0; i < pts.length; i++) {
        const p = pts[i];
        if (!reduce) {
          p.x += p.vx * p.z; p.y += p.vy * p.z;
          const dx = mouse.current.x - p.x, dy = mouse.current.y - p.y;
          const d2 = dx * dx + dy * dy;
          if (d2 < 200 * 200 && d2 > 1) {
            const f = (1 - Math.sqrt(d2) / 200) * 0.06 * p.z;
            p.x += dx * f * 0.02; p.y += dy * f * 0.02;
          }
        }
        if (p.x < -20) p.x = w + 20; if (p.x > w + 20) p.x = -20;
        if (p.y < -20) p.y = h + 20; if (p.y > h + 20) p.y = -20;
        for (let j = i + 1; j < pts.length; j++) {
          const q = pts[j];
          const dx = p.x - q.x, dy = p.y - q.y;
          const d = Math.sqrt(dx * dx + dy * dy);
          if (d < linkDist) {
            ctx.strokeStyle = `rgba(196,144,96,${(1 - d / linkDist) * 0.18 * Math.min(p.z, q.z)})`;
            ctx.lineWidth = 0.6;
            ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(q.x, q.y); ctx.stroke();
          }
        }
      }
      for (const p of pts) {
        ctx.fillStyle = p.c; ctx.globalAlpha = 0.35 * p.z + 0.1;
        const s = 1.4 + p.z * 2.2;
        ctx.fillRect(p.x - s / 2, p.y - s / 2, s, s);
      }
      ctx.globalAlpha = 1;
      raf = requestAnimationFrame(frame);
    }
    const onMove = (e) => { mouse.current = { x: e.clientX, y: e.clientY }; };
    resize();
    window.addEventListener("resize", resize);
    window.addEventListener("pointermove", onMove);
    raf = requestAnimationFrame(frame);
    return () => { cancelAnimationFrame(raf); window.removeEventListener("resize", resize); window.removeEventListener("pointermove", onMove); };
  }, []);

  return <canvas ref={canvasRef} style={{ position: "fixed", inset: 0, width: "100%", height: "100%", pointerEvents: "none", zIndex: 0, opacity: dark ? 0.9 : 0.7 }} />;
}
