import { useEffect, useRef, useState, useCallback } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { GRAPH } from "./data.js";
import { palette, MONO } from "./theme.js";

// ── 3D knowledge graph (WebGL / three.js) ─────────────────────────────────────
// Real lit sphere meshes in a 3D force layout, orbit-to-spin, task icons on the
// camera-facing surface, and the NODE.LINK pathfinding game (easy/medium/hard).
// Lazy-loaded (see pages.jsx) so three.js stays out of the initial bundle.
const DIFFICULTY = {
  easy: { label: "easy", range: [2, 2] },
  medium: { label: "medium", range: [3, 4] },
  hard: { label: "hard", range: [5, 7] },
};

const ADJ = (() => {
  const a = {};
  GRAPH.nodes.forEach((n) => (a[n.id] = new Set()));
  GRAPH.edges.forEach(([x, y]) => { a[x] && a[x].add(y); a[y] && a[y].add(x); });
  return a;
})();

const NODE_ICONS = {
  me: "🧑‍💻", ucb: "🧬", combine: "🔬", arbor: "🧫", cheminfo: "⚗️", biophysics: "🧲",
  ares: "📚", orbit: "🔄", saliva: "🧪", ml: "🤖", python: "🐍", viz: "📊", cloud: "☁️",
  sustain: "🌱", foss: "🐧", a4c: "♿", aisafety: "🛡️", feeding: "🍲", learning: "📖",
  rangers: "🏔️", lifting: "🏋️", cooking: "🍳", konkani: "🌴", writing: "✍️",
};
const CAT_ICONS = { self: "🧑‍💻", research: "🔬", project: "🛠️", community: "🌍", skill: "⚙️", value: "❤️", life: "✨" };
const iconFor = (n) => n.icon || NODE_ICONS[n.id] || CAT_ICONS[n.cat] || "◆";
const EMOJI_FONT = '"Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",sans-serif';

function makeIconTexture(emoji) {
  const c = document.createElement("canvas");
  c.width = c.height = 128;
  const g = c.getContext("2d");
  g.font = `96px ${EMOJI_FONT}`;
  g.textAlign = "center";
  g.textBaseline = "middle";
  g.fillText(emoji, 64, 70);
  const tex = new THREE.CanvasTexture(c);
  tex.anisotropy = 4;
  return tex;
}
// Floating label: glowing text with a soft category-colored halo so it reads as
// a hologram hanging beside the sphere.
// Floating label rendered as a legible 3D "chip": a dark rounded plate with a
// category-colored border and embossed (drop-shadowed) text, so it reads clearly
// over the busy 3D scene at any distance.
function makeLabelTexture(text, accent) {
  const c = document.createElement("canvas");
  const ctx = c.getContext("2d");
  const font = 'bold 72px "Courier New", monospace';
  ctx.font = font;
  const textW = Math.ceil(ctx.measureText(text).width);
  const padX = 40, padY = 30;
  const w = textW + padX * 2;
  const h = 72 + padY * 2;
  c.width = w; c.height = h;
  ctx.font = font; ctx.textAlign = "center"; ctx.textBaseline = "middle";

  // rounded background plate
  const r = 26;
  ctx.beginPath();
  if (ctx.roundRect) ctx.roundRect(6, 6, w - 12, h - 12, r);
  else ctx.rect(6, 6, w - 12, h - 12);
  ctx.fillStyle = "rgba(16,14,11,0.74)";
  ctx.fill();
  ctx.lineWidth = 4;
  ctx.strokeStyle = accent;
  ctx.globalAlpha = 0.6;
  ctx.stroke();
  ctx.globalAlpha = 1;

  // embossed text: dark drop shadow + bright core
  ctx.shadowColor = "rgba(0,0,0,0.75)";
  ctx.shadowBlur = 8;
  ctx.shadowOffsetY = 3;
  ctx.fillStyle = "#F7ECDD";
  ctx.fillText(text, w / 2, h / 2 + 2);
  ctx.shadowColor = "transparent";
  ctx.shadowOffsetY = 0;

  const tex = new THREE.CanvasTexture(c);
  tex.anisotropy = 8;
  return { tex, aspect: w / h };
}

// A soft round glow dot for energy that travels along active edges.
function makeDotTexture() {
  const c = document.createElement("canvas");
  c.width = c.height = 64;
  const g = c.getContext("2d");
  const grad = g.createRadialGradient(32, 32, 0, 32, 32, 32);
  grad.addColorStop(0, "rgba(255,255,255,1)");
  grad.addColorStop(0.4, "rgba(255,255,255,0.55)");
  grad.addColorStop(1, "rgba(255,255,255,0)");
  g.fillStyle = grad;
  g.fillRect(0, 0, 64, 64);
  const tex = new THREE.CanvasTexture(c);
  return tex;
}

export function KnowledgeGraph({ dark, onNavigate, onExploreNode, onWinGame, height = "clamp(420px, 64vh, 640px)" }) {
  const mountRef = useRef(null);
  const p = palette(dark);

  const [selected, setSelected] = useState(null);
  const [mode, setMode] = useState("explore");
  const [difficulty, setDifficulty] = useState("medium");
  const [game, setGame] = useState(null);
  const [score, setScore] = useState({ streak: 0, best: 0 });
  const [status, setStatus] = useState("");

  const modeRef = useRef(mode); useEffect(() => { modeRef.current = mode; }, [mode]);
  const gameRef = useRef(game); useEffect(() => { gameRef.current = game; }, [game]);
  const selectedRef = useRef(selected); useEffect(() => { selectedRef.current = selected; }, [selected]);
  const hoverRef = useRef(null);

  const bfs = useCallback((start, target) => {
    const q = [[start]];
    const seen = new Set([start]);
    while (q.length) {
      const path = q.shift();
      const last = path[path.length - 1];
      if (last === target) return path;
      for (const nb of ADJ[last] || []) if (!seen.has(nb)) { seen.add(nb); q.push([...path, nb]); }
    }
    return null;
  }, []);
  const label = (id) => GRAPH.nodes.find((n) => n.id === id)?.label || id;

  // Click handler kept in a ref (updated each render via effect) so the WebGL
  // effect never rebuilds and always sees current state.
  const handleSelectRef = useRef(() => {});
  useEffect(() => {
    handleSelectRef.current = (id) => {
      const g = gameRef.current;
      if (!id) { if (modeRef.current === "explore") setSelected(null); return; }
      if (modeRef.current === "game" && g) {
        const last = g.path[g.path.length - 1];
        if (id === g.path[g.path.length - 2]) { setGame({ ...g, path: g.path.slice(0, -1) }); setStatus("backed up a step."); return; }
        if (id === last) return;
        if (!ADJ[last].has(id)) { setStatus(`${label(id)} isn't wired to ${label(last)}. Follow the edges.`); return; }
        const newPath = g.path.includes(id) ? g.path : [...g.path, id];
        setGame({ ...g, path: newPath });
        if (id === g.target) {
          const hops = newPath.length - 1;
          const optimal = hops === g.par;
          setScore((sc) => ({ streak: optimal ? sc.streak + 1 : 0, best: Math.max(sc.best, optimal ? sc.streak + 1 : sc.streak) }));
          setStatus(optimal ? `Optimal! ${hops} hops = par.` : `Connected in ${hops} (par ${g.par}). Try for par.`);
          onWinGame && onWinGame();
        } else setStatus(`${label(id)} → ${newPath.length - 1} hops, heading to ${label(g.target)}.`);
        return;
      }
      setSelected(id);
      onExploreNode && onExploreNode(id);
    };
  });

  function newPuzzle(diff = difficulty) {
    const [lo, hi] = DIFFICULTY[diff].range;
    const ids = GRAPH.nodes.map((n) => n.id);
    let start, target, best;
    for (let t = 0; t < 80; t++) {
      start = ids[Math.floor(Math.random() * ids.length)];
      target = ids[Math.floor(Math.random() * ids.length)];
      if (start === target) continue;
      best = bfs(start, target);
      if (best && best.length - 1 >= lo && best.length - 1 <= hi) break;
    }
    if (!best) best = bfs(start, target) || [start];
    setMode("game");
    setSelected(null);
    setGame({ start, target, path: [start], par: best.length - 1, diff });
    setStatus(`Connect ${label(start)} → ${label(target)} in ${best.length - 1} hops (par). Click connected nodes.`);
  }

  // ── WebGL scene ─────────────────────────────────────────────────────────────
  useEffect(() => {
    const mount = mountRef.current;
    let w = mount.clientWidth || 600;
    let h = mount.clientHeight || 460;
    const reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(50, w / h, 0.1, 3000);
    camera.position.set(0, 0, 340);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setSize(w, h);
    renderer.domElement.style.display = "block";
    renderer.domElement.style.touchAction = "none";
    renderer.domElement.style.cursor = "grab";
    mount.appendChild(renderer.domElement);

    scene.add(new THREE.AmbientLight(0xffffff, 0.6));
    const key = new THREE.DirectionalLight(0xfff0dd, 1.15); key.position.set(1, 1.2, 1); scene.add(key);
    const fill = new THREE.DirectionalLight(0x88a0ff, 0.35); fill.position.set(-1, -0.6, -0.8); scene.add(fill);
    const rim = new THREE.PointLight(0xc49060, 0.5, 1400); rim.position.set(0, 0, 280); scene.add(rim);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.09;
    controls.enablePan = false;
    controls.minDistance = 180;
    controls.maxDistance = 560;
    controls.autoRotate = !reduce;
    controls.autoRotateSpeed = 0.8;
    controls.rotateSpeed = 0.9;

    const R = (n) => 5 + n.size * 5;
    const nodes = GRAPH.nodes.map((n) => ({
      ...n,
      x: (Math.random() - 0.5) * 160, y: (Math.random() - 0.5) * 160, z: (Math.random() - 0.5) * 160,
      vx: 0, vy: 0, vz: 0,
    }));
    const byId = {};
    nodes.forEach((n) => (byId[n.id] = n));
    if (byId.me) { byId.me.x = byId.me.y = byId.me.z = 0; }

    const sphereGeo = new THREE.SphereGeometry(1, 32, 32);
    const group = new THREE.Group();
    scene.add(group);
    const meshById = {};
    const meshes = [];
    const disposables = [];

    for (const n of nodes) {
      const col = new THREE.Color((GRAPH.categories[n.cat] || { color: "#C49060" }).color);
      const mat = new THREE.MeshStandardMaterial({ color: col, roughness: 0.32, metalness: 0.14, emissive: col.clone(), emissiveIntensity: 0 });
      const mesh = new THREE.Mesh(sphereGeo, mat);
      mesh.scale.setScalar(R(n));
      mesh.userData.id = n.id;
      group.add(mesh);
      meshById[n.id] = mesh; meshes.push(mesh);
      disposables.push(mat);

      // icon: hidden until the node is hovered/selected
      const iconTex = makeIconTexture(iconFor(n));
      const iconMat = new THREE.SpriteMaterial({ map: iconTex, transparent: true, depthTest: true, depthWrite: false });
      const icon = new THREE.Sprite(iconMat);
      icon.visible = false;
      group.add(icon);
      n._icon = icon;
      disposables.push(iconMat, iconTex);

      // floating label chip above every node
      const accent = (GRAPH.categories[n.cat] || { color: "#C49060" }).color;
      const { tex, aspect } = makeLabelTexture(n.label, accent);
      const lmat = new THREE.SpriteMaterial({ map: tex, transparent: true, depthTest: false, depthWrite: false });
      const lab = new THREE.Sprite(lmat);
      const lh = n.id === "me" ? 22 : 14 + n.size * 2.4;
      lab.scale.set(lh * aspect, lh, 1);
      lab.renderOrder = 2;
      group.add(lab);
      n._label = lab;
      n._labelHalfH = lh / 2;
      n._phase = Math.random() * Math.PI * 2;
      disposables.push(lmat, tex);
    }

    // ── Edges as 3D lit tubes, colored by MEANING ────────────────────────────
    //   • a spoke touching "me"  → golden identity edge (thick)
    //   • same-category endpoints → single-hue "reinforces" edge
    //   • different categories    → blended two-hue "bridges" edge
    // Each carries an outward-radiating pulse; active edges grow an energy dot.
    const catColor = (id) => new THREE.Color((GRAPH.categories[byId[id].cat] || { color: "#C49060" }).color);
    const UP = new THREE.Vector3(0, 1, 0);
    const edgeGeo = new THREE.CylinderGeometry(1, 1, 1, 8, 1, true);
    const dotTex = makeDotTexture();
    const edges3d = GRAPH.edges
      .filter(([a, b]) => byId[a] && byId[b])
      .map(([x, y]) => {
        const touchesMe = x === "me" || y === "me";
        const sameCat = byId[x].cat === byId[y].cat;
        const color = touchesMe
          ? new THREE.Color("#E0A970")
          : catColor(x).clone().lerp(catColor(y), 0.5);
        const baseRadius = touchesMe ? 1.2 : sameCat ? 0.92 : 0.66;
        const mat = new THREE.MeshStandardMaterial({
          color: color.clone().multiplyScalar(0.45),
          emissive: color.clone(),
          emissiveIntensity: 0.3,
          roughness: 0.4,
          metalness: 0.2,
          transparent: true,
          opacity: 0.9,
        });
        const mesh = new THREE.Mesh(edgeGeo, mat);
        group.add(mesh);
        const dotMat = new THREE.SpriteMaterial({ map: dotTex, color: color.clone(), transparent: true, blending: THREE.AdditiveBlending, depthWrite: false });
        const dot = new THREE.Sprite(dotMat);
        dot.visible = false;
        group.add(dot);
        disposables.push(mat, dotMat);
        return { x, y, mesh, mat, dot, dotMat, color, baseRadius };
      });

    function step() {
      for (let i = 0; i < nodes.length; i++) {
        const a = nodes[i];
        for (let j = i + 1; j < nodes.length; j++) {
          const b = nodes[j];
          const dx = a.x - b.x, dy = a.y - b.y, dz = a.z - b.z;
          const d2 = dx * dx + dy * dy + dz * dz || 0.01;
          const d = Math.sqrt(d2);
          const rep = 9000 / d2;
          a.vx += (dx / d) * rep; a.vy += (dy / d) * rep; a.vz += (dz / d) * rep;
          b.vx -= (dx / d) * rep; b.vy -= (dy / d) * rep; b.vz -= (dz / d) * rep;
        }
      }
      for (const e of edges3d) {
        const a = byId[e.x], b = byId[e.y];
        const dx = b.x - a.x, dy = b.y - a.y, dz = b.z - a.z;
        const d = Math.sqrt(dx * dx + dy * dy + dz * dz) || 0.01;
        const f = (d - 70) * 0.012;
        a.vx += (dx / d) * f; a.vy += (dy / d) * f; a.vz += (dz / d) * f;
        b.vx -= (dx / d) * f; b.vy -= (dy / d) * f; b.vz -= (dz / d) * f;
      }
      for (const n of nodes) {
        n.vx += -n.x * 0.0022; n.vy += -n.y * 0.0022; n.vz += -n.z * 0.0022;
        n.vx *= 0.84; n.vy *= 0.84; n.vz *= 0.84;
        if (n.id === "me") { n.x *= 0.8; n.y *= 0.8; n.z *= 0.8; }
        else { n.x += n.vx; n.y += n.vy; n.z += n.vz; }
      }
    }

    const camDir = new THREE.Vector3();
    const camUp = new THREE.Vector3();
    const edgeDir = new THREE.Vector3();
    const edgeMid = new THREE.Vector3();
    const edgeQuat = new THREE.Quaternion();
    function updateScene() {
      const g = gameRef.current;
      const pathSet = g ? new Set(g.path) : null;
      const pathEdges = new Set();
      if (g) for (let i = 0; i < g.path.length - 1; i++) { pathEdges.add(g.path[i] + "|" + g.path[i + 1]); pathEdges.add(g.path[i + 1] + "|" + g.path[i]); }
      const hover = hoverRef.current;
      const selId = selectedRef.current;
      const t = performance.now();
      camUp.setFromMatrixColumn(camera.matrixWorld, 1); // screen-up in world space

      for (const n of nodes) {
        const m = meshById[n.id];
        m.position.set(n.x, n.y, n.z);
        const emph = hover === n.id || (pathSet && pathSet.has(n.id)) || (g && g.start === n.id) || (g && g.target === n.id) || selId === n.id;
        const isTarget = g && g.target === n.id;
        m.material.emissiveIntensity = emph ? (isTarget ? 0.85 : 0.5) : 0;
        let s = R(n);
        if (isTarget) s *= 1 + 0.09 * Math.sin(t / 220);
        else if (emph) s *= 1.09;
        m.scale.setScalar(s);

        camDir.copy(camera.position).sub(m.position).normalize();

        // icon: revealed only on hover/select, floating on the near surface
        const showIcon = hover === n.id || selId === n.id;
        n._icon.visible = showIcon;
        if (showIcon) {
          n._icon.position.copy(m.position).addScaledVector(camDir, s * 1.05);
          const iconScale = s * 1.5;
          n._icon.scale.set(iconScale, iconScale, 1);
        }

        // label: floats just above the node with a slow bob, fades with distance
        const bob = reduce ? 0 : Math.sin(t / 800 + n._phase) * 1.4;
        n._label.position
          .copy(m.position)
          .addScaledVector(camUp, s + n._labelHalfH + 5 + bob)
          .addScaledVector(camDir, s * 0.5);
        const dist = camera.position.distanceTo(m.position);
        const depthFade = Math.max(0.4, Math.min(1, 1.7 - dist / 420));
        n._label.material.opacity = emph ? 1 : depthFade;
      }

      for (const e of edges3d) {
        const a = byId[e.x], b = byId[e.y];
        edgeDir.set(b.x - a.x, b.y - a.y, b.z - a.z);
        const len = edgeDir.length() || 0.01;
        edgeMid.set((a.x + b.x) / 2, (a.y + b.y) / 2, (a.z + b.z) / 2);
        e.mesh.position.copy(edgeMid);
        edgeQuat.setFromUnitVectors(UP, edgeDir.clone().normalize());
        e.mesh.quaternion.copy(edgeQuat);

        const inPath = pathEdges.has(e.x + "|" + e.y);
        const touchesHover = hover && (hover === e.x || hover === e.y);
        const emph = inPath || touchesHover;

        // pulse radiates outward from the center of the graph
        const wave = 0.5 + 0.5 * Math.sin(t * 0.004 - edgeMid.length() * 0.03);
        const radius = e.baseRadius * (emph ? 1.8 : 1) * (0.82 + 0.34 * wave);
        e.mesh.scale.set(radius, len, radius);
        e.mat.emissiveIntensity = (inPath ? 1.15 : touchesHover ? 0.85 : dark ? 0.34 : 0.3) * (0.55 + 0.75 * wave);
        e.mat.opacity = inPath ? 1 : touchesHover ? 0.95 : 0.82;

        // energy travels along active edges
        if (emph && !reduce) {
          e.dot.visible = true;
          const frac = ((t * (inPath ? 0.0011 : 0.0007)) % 1000) % 1;
          e.dot.position.set(a.x + (b.x - a.x) * frac, a.y + (b.y - a.y) * frac, a.z + (b.z - a.z) * frac);
          const ds = radius * 3.4;
          e.dot.scale.set(ds, ds, 1);
          e.dotMat.opacity = 0.9;
        } else if (e.dot.visible) {
          e.dot.visible = false;
        }
      }
    }

    let raf;
    function animate() {
      raf = requestAnimationFrame(animate);
      step();
      controls.update();
      updateScene();
      renderer.render(scene, camera);
    }
    animate();

    const raycaster = new THREE.Raycaster();
    const ndc = new THREE.Vector2();
    let downPos = null;
    function toNDC(e) {
      const r = renderer.domElement.getBoundingClientRect();
      ndc.x = ((e.clientX - r.left) / r.width) * 2 - 1;
      ndc.y = -((e.clientY - r.top) / r.height) * 2 + 1;
    }
    function pick(e) {
      toNDC(e);
      raycaster.setFromCamera(ndc, camera);
      const hits = raycaster.intersectObjects(meshes, false);
      return hits.length ? hits[0].object.userData.id : null;
    }
    const onMove = (e) => {
      const id = pick(e);
      hoverRef.current = id;
      renderer.domElement.style.cursor = id ? "pointer" : "grab";
    };
    const onDown = (e) => { downPos = { x: e.clientX, y: e.clientY }; };
    const onUp = (e) => {
      if (!downPos) return;
      const moved = Math.hypot(e.clientX - downPos.x, e.clientY - downPos.y);
      downPos = null;
      if (moved > 5) return;
      handleSelectRef.current(pick(e));
    };
    renderer.domElement.addEventListener("pointermove", onMove);
    renderer.domElement.addEventListener("pointerdown", onDown);
    renderer.domElement.addEventListener("pointerup", onUp);

    function resize() {
      w = mount.clientWidth || w; h = mount.clientHeight || h;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    }
    window.addEventListener("resize", resize);
    const ro = typeof ResizeObserver !== "undefined" ? new ResizeObserver(resize) : null;
    ro && ro.observe(mount);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
      ro && ro.disconnect();
      renderer.domElement.removeEventListener("pointermove", onMove);
      renderer.domElement.removeEventListener("pointerdown", onDown);
      renderer.domElement.removeEventListener("pointerup", onUp);
      controls.dispose();
      sphereGeo.dispose();
      edgeGeo.dispose();
      dotTex.dispose();
      disposables.forEach((d) => d.dispose && d.dispose());
      renderer.dispose();
      if (renderer.domElement.parentNode) renderer.domElement.parentNode.removeChild(renderer.domElement);
    };
  }, [dark]);  

  const node = selected ? GRAPH.nodes.find((n) => n.id === selected) : null;

  return (
    <div>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 10, alignItems: "center" }}>
        <button onClick={() => { setMode("explore"); setGame(null); setStatus(""); }} style={tab(mode === "explore", dark)}>explore</button>
        <button onClick={() => newPuzzle()} style={tab(mode === "game", dark)}>play NODE.LINK</button>
        {mode === "game" && (
          <div style={{ display: "flex", gap: 4, alignItems: "center", marginLeft: 4 }}>
            {Object.keys(DIFFICULTY).map((d) => (
              <button key={d} onClick={() => { setDifficulty(d); newPuzzle(d); }} style={chip(difficulty === d, dark)}>{DIFFICULTY[d].label}</button>
            ))}
          </div>
        )}
        <span style={{ fontFamily: MONO, fontSize: 11, color: p.faint, marginLeft: "auto" }}>
          {mode === "game" ? `streak ${score.streak} · best ${score.best}` : "drag to spin · scroll to zoom · click a node"}
        </span>
      </div>

      <div
        style={{
          position: "relative", borderRadius: 16, overflow: "hidden",
          border: "1px solid " + p.border,
          background: dark
            ? "radial-gradient(120% 120% at 50% 0%, rgba(196,144,96,0.07), rgba(13,12,10,0.55))"
            : "radial-gradient(120% 120% at 50% 0%, rgba(196,144,96,0.09), rgba(255,250,244,0.5))",
          boxShadow: p.shadowSoft,
        }}
      >
        <div ref={mountRef} style={{ width: "100%", height }} />

        <div style={{ position: "absolute", top: 12, left: 12, display: "flex", gap: 10, flexWrap: "wrap", maxWidth: "70%", pointerEvents: "none" }}>
          {Object.entries(GRAPH.categories).map(([k, c]) => (
            <span key={k} style={{ display: "flex", alignItems: "center", gap: 5, fontFamily: MONO, fontSize: 10, color: p.muted }}>
              <span style={{ width: 8, height: 8, borderRadius: "50%", background: c.color }} />{c.label}
            </span>
          ))}
        </div>

        {mode === "game" && game && (
          <div style={overlay(dark)}>
            <div style={{ display: "flex", justifyContent: "space-between", gap: 10, flexWrap: "wrap" }}>
              <span><span style={{ color: "#8B9D77" }}>node.link ~ $</span> {status}</span>
              <button onClick={() => newPuzzle()} style={goBtn()}>new puzzle ↻</button>
            </div>
          </div>
        )}
        {mode === "explore" && node && (
          <div style={overlay(dark)}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
              <div><span style={{ color: (GRAPH.categories[node.cat] || {}).color, fontWeight: 700 }}>{node.label}</span><span style={{ color: p.muted }}> — {node.blurb}</span></div>
              {node.page && <button onClick={() => onNavigate && onNavigate(node.page)} style={goBtn()}>open {node.page} →</button>}
            </div>
          </div>
        )}
        {mode === "explore" && !node && (
          <div style={{ ...overlay(dark), color: p.faint }}>
            <span style={{ color: "#8B9D77" }}>graph ~ $</span> drag to spin · scroll to zoom · hover to trace · click a node to explore
          </div>
        )}
      </div>
    </div>
  );
}

function tab(active, dark) {
  const p = palette(dark);
  return { background: active ? "#C49060" : p.card, color: active ? "#FFF" : "#C49060", border: "1px solid rgba(196,144,96,0.25)", cursor: "pointer", padding: "6px 14px", borderRadius: 6, fontFamily: MONO, fontSize: 12, fontWeight: 700, transition: "all 0.2s ease" };
}
function chip(active, dark) {
  const p = palette(dark);
  return { background: active ? "rgba(196,144,96,0.2)" : "transparent", color: active ? "#E0A970" : p.muted, border: "1px solid " + (active ? "rgba(196,144,96,0.4)" : p.border), cursor: "pointer", padding: "4px 10px", borderRadius: 5, fontFamily: MONO, fontSize: 11, fontWeight: 700 };
}
function overlay(dark) {
  return { position: "absolute", left: 12, right: 12, bottom: 12, background: dark ? "rgba(13,12,10,0.86)" : "rgba(30,28,25,0.92)", border: "1px solid rgba(196,144,96,0.2)", borderRadius: 10, padding: "10px 14px", fontFamily: MONO, fontSize: 12.5, color: "#D4C9BC", lineHeight: 1.5, backdropFilter: "blur(6px)" };
}
function goBtn() {
  return { background: "rgba(196,144,96,0.16)", color: "#E0A970", border: "1px solid rgba(196,144,96,0.3)", borderRadius: 6, padding: "5px 10px", fontFamily: MONO, fontSize: 11, fontWeight: 700, cursor: "pointer", whiteSpace: "nowrap" };
}
