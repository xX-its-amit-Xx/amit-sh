import { useEffect, useRef, useState, useCallback } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";
import { GRAPH } from "./data.js";
import { palette, MONO } from "./theme.js";
import { buildSymbol, setHighlight, disposeTree } from "./symbols3d.js";

// ── 3D knowledge graph (WebGL / three.js) ─────────────────────────────────────
// Each node is an animated 3D symbol of what it represents (see symbols3d.js),
// floating in a 3D force layout with orbit-to-spin, a guided "start here →
// next" beacon, and the NODE.LINK pathfinding game (easy/medium/hard).
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

// The hub: the "self" node if there is one, else the biggest node.
const HUB = (GRAPH.nodes.find((n) => n.id === "me") || GRAPH.nodes.find((n) => n.cat === "self") ||
  [...GRAPH.nodes].sort((a, b) => (b.size || 1) - (a.size || 1))[0] || {}).id;

// Hops from the hub, used to stagger the nodes materializing on load.
const DEPTH = (() => {
  const d = { [HUB]: 0 };
  const q = [HUB];
  while (q.length) {
    const id = q.shift();
    for (const nb of ADJ[id] || []) if (d[nb] == null) { d[nb] = d[id] + 1; q.push(nb); }
  }
  return d;
})();

const NODE_ICONS = {
  me: "🧑‍💻", ucb: "💊", combine: "🔬", arbor: "🦠", cheminfo: "⚗️", biophysics: "🧲",
  ares: "📚", orbit: "🪐", saliva: "🧪", ml: "🧠", python: "🐍", viz: "📊", cloud: "☁️",
  sustain: "🌱", foss: "🐧", a4c: "♿", aisafety: "🛡️", feeding: "🍲", learning: "📖",
  rangers: "🏔️", lifting: "🏋️", cooking: "🍳", konkani: "🌴", writing: "✍️",
  broad: "🕸️", route9: "💻", studio: "🎮",
};
const CAT_ICONS = { self: "🧑‍💻", research: "🔬", project: "🛠️", community: "🌍", skill: "⚙️", value: "❤️", life: "✨" };
const iconFor = (n) => n.icon || NODE_ICONS[n.id] || CAT_ICONS[n.cat] || "◆";
const catOf = (n) => (GRAPH.categories[n.cat] || { color: "#C49060" }).color;

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

  ctx.shadowColor = "rgba(0,0,0,0.75)";
  ctx.shadowBlur = 8;
  ctx.shadowOffsetY = 3;
  ctx.fillStyle = "#F7ECDD";
  ctx.fillText(text, w / 2, h / 2 + 2);

  const tex = new THREE.CanvasTexture(c);
  tex.anisotropy = 8;
  return { tex, aspect: w / h };
}

// Soft radial glow: energy dots on active edges and the halo behind each symbol.
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
  return new THREE.CanvasTexture(c);
}

// A thin bright ring for the guide beacon's expanding ripples.
function makeRingTexture() {
  const c = document.createElement("canvas");
  c.width = c.height = 128;
  const g = c.getContext("2d");
  const grad = g.createRadialGradient(64, 64, 44, 64, 64, 62);
  grad.addColorStop(0, "rgba(255,255,255,0)");
  grad.addColorStop(0.55, "rgba(255,255,255,0.95)");
  grad.addColorStop(1, "rgba(255,255,255,0)");
  g.fillStyle = grad;
  g.fillRect(0, 0, 128, 128);
  return new THREE.CanvasTexture(c);
}

const easeOutBack = (x) => { const c1 = 1.70158, c3 = c1 + 1; return 1 + c3 * Math.pow(x - 1, 3) + c1 * Math.pow(x - 1, 2); };
const easeOutCubic = (x) => 1 - Math.pow(1 - x, 3);
const clamp01 = (x) => Math.max(0, Math.min(1, x));

// The fly-in intro only plays on the first mount per page load (not on theme flips).
let introPlayed = false;

export function KnowledgeGraph({ dark, onNavigate, onExploreNode, onWinGame, height = "clamp(420px, 64vh, 640px)" }) {
  const mountRef = useRef(null);
  const p = palette(dark);

  const [selected, setSelected] = useState(null);
  const [mode, setMode] = useState("explore");
  const [difficulty, setDifficulty] = useState("medium");
  const [game, setGame] = useState(null);
  const [score, setScore] = useState({ streak: 0, best: 0 });
  const [status, setStatus] = useState("");
  const [visited, setVisited] = useState(() => new Set());
  const [showDragHint, setShowDragHint] = useState(true);

  const modeRef = useRef(mode); useEffect(() => { modeRef.current = mode; }, [mode]);
  const gameRef = useRef(game); useEffect(() => { gameRef.current = game; }, [game]);
  const selectedRef = useRef(selected); useEffect(() => { selectedRef.current = selected; }, [selected]);
  const hoverRef = useRef(null);
  const chipEls = useRef([]);

  // Guide beacons: where we're nudging the visitor next. Read every frame by
  // the WebGL loop to position the ripples and the floating HTML chips.
  const guidesRef = useRef([]);
  useEffect(() => {
    const g = [];
    if (mode === "game" && game) {
      const last = game.path[game.path.length - 1];
      if (last !== game.target) g.push({ id: last, text: "you", color: "#7FA6C4" });
      g.push({ id: game.target, text: last === game.target ? "connected ✓" : "goal", color: "#8B9D77" });
    } else if (mode === "explore") {
      const unvisitedNb = (id) => [...(ADJ[id] || [])]
        .filter((x) => !visited.has(x))
        .sort((a, b) => (GRAPH.nodes.find((n) => n.id === b)?.size || 0) - (GRAPH.nodes.find((n) => n.id === a)?.size || 0))[0];
      if (!visited.size) g.push({ id: HUB, text: "start here", color: "#E0A970" });
      else {
        let next = selected && unvisitedNb(selected);
        if (!next) for (const v of visited) { next = unvisitedNb(v); if (next) break; }
        if (next) g.push({ id: next, text: selected ? "next →" : "try me", color: "#E0A970" });
      }
    }
    guidesRef.current = g;
  }, [mode, game, visited, selected]);

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
      setVisited((v) => (v.has(id) ? v : new Set(v).add(id)));
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

  // Drag hint fades on its own after a few seconds.
  useEffect(() => {
    const t = setTimeout(() => setShowDragHint(false), 7000);
    return () => clearTimeout(t);
  }, []);

  // ── WebGL scene ─────────────────────────────────────────────────────────────
  useEffect(() => {
    const mount = mountRef.current;
    let w = mount.clientWidth || 600;
    let h = mount.clientHeight || 460;
    const reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(50, w / h, 0.1, 3000);
    const HOME_DIST = 420;
    const playIntro = !introPlayed && !reduce;
    introPlayed = true;
    camera.position.set(0, 0, playIntro ? 620 : HOME_DIST);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setSize(w, h);
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = dark ? 1.15 : 1.05;
    renderer.domElement.style.display = "block";
    renderer.domElement.style.touchAction = "none";
    renderer.domElement.style.cursor = "grab";
    mount.appendChild(renderer.domElement);

    // Studio lighting: a soft room reflection map makes the metal plates, glass
    // flasks and glossy capsules read as real materials.
    const pmrem = new THREE.PMREMGenerator(renderer);
    const envTex = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
    scene.environment = envTex;
    scene.environmentIntensity = 0.55;
    scene.add(new THREE.AmbientLight(0xffffff, 0.35));
    const key = new THREE.DirectionalLight(0xfff0dd, 1.6); key.position.set(1, 1.2, 1); scene.add(key);
    const fill = new THREE.DirectionalLight(0x88a0ff, 0.45); fill.position.set(-1, -0.6, -0.8); scene.add(fill);
    const rim = new THREE.PointLight(0xc49060, 0.6, 1400, 0); rim.position.set(0, 0, 280); scene.add(rim);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.09;
    controls.enablePan = false;
    controls.minDistance = 180;
    controls.maxDistance = 620;
    controls.autoRotate = !reduce;
    controls.autoRotateSpeed = 0.7;
    controls.rotateSpeed = 0.9;

    const R = (n) => (5 + (n.size || 1.5) * 5) * 1.55;
    const nodes = GRAPH.nodes.map((n) => ({
      ...n,
      x: (Math.random() - 0.5) * 160, y: (Math.random() - 0.5) * 160, z: (Math.random() - 0.5) * 160,
      vx: 0, vy: 0, vz: 0,
    }));
    const byId = {};
    nodes.forEach((n) => (byId[n.id] = n));
    if (byId[HUB]) { byId[HUB].x = byId[HUB].y = byId[HUB].z = 0; }

    const group = new THREE.Group();
    scene.add(group);
    const hitGeo = new THREE.SphereGeometry(1, 16, 12);
    const hitMat = new THREE.MeshBasicMaterial({ visible: false }); // pickable, never drawn
    const dotTex = makeDotTexture();
    const ringTex = makeRingTexture();
    const hits = [];
    const disposables = [hitGeo, hitMat, dotTex, ringTex, envTex, pmrem];
    const t0 = performance.now();
    const maxDepth = Math.max(1, ...Object.values(DEPTH));

    for (const n of nodes) {
      const accent = catOf(n);
      n._color = new THREE.Color(accent);

      // holder: positioned at the node, billboarded toward the camera
      const holder = new THREE.Group();
      group.add(holder);
      n._holder = holder;

      // category halo behind the symbol keeps the color legend readable
      const haloMat = new THREE.SpriteMaterial({
        map: dotTex, color: n._color, transparent: true, depthWrite: false, toneMapped: false,
        blending: dark ? THREE.AdditiveBlending : THREE.NormalBlending, opacity: dark ? 0.38 : 0.3,
      });
      const halo = new THREE.Sprite(haloMat);
      halo.renderOrder = -1;
      holder.add(halo);
      n._halo = halo;
      disposables.push(haloMat);

      // the animated symbol itself
      const sym = buildSymbol(n, accent);
      const spin = new THREE.Group();
      spin.add(sym.object);
      holder.add(spin);
      n._sym = sym;
      n._spin = spin;
      n._emph = false;

      // invisible, generous sphere for easy clicking
      const hit = new THREE.Mesh(hitGeo, hitMat);
      hit.userData.id = n.id;
      holder.add(hit);
      hits.push(hit);
      n._hit = hit;

      const { tex, aspect } = makeLabelTexture(n.label, accent);
      const lmat = new THREE.SpriteMaterial({ map: tex, transparent: true, depthTest: false, depthWrite: false, toneMapped: false });
      const lab = new THREE.Sprite(lmat);
      const lh = n.id === HUB ? 17 : 9 + (n.size || 1.5) * 1.8;
      lab.scale.set(lh * aspect, lh, 1);
      lab.renderOrder = 2;
      group.add(lab);
      n._label = lab;
      n._labelHalfH = lh / 2;
      n._labelBase = { w: lh * aspect, h: lh };
      n._phase = Math.random() * Math.PI * 2;
      n._appear = playIntro ? 250 + ((DEPTH[n.id] ?? maxDepth) / maxDepth) * 1100 + Math.random() * 200 : -1e9;
      disposables.push(lmat, tex);
    }

    // ── Guide beacons: expanding ripples around the suggested node(s) ────────
    const beacons = [0, 1].map(() => {
      const rings = [0, 1].map(() => {
        const m = new THREE.SpriteMaterial({ map: ringTex, transparent: true, depthWrite: false, depthTest: false, toneMapped: false, blending: THREE.AdditiveBlending });
        const s = new THREE.Sprite(m);
        s.renderOrder = 3;
        s.visible = false;
        group.add(s);
        disposables.push(m);
        return s;
      });
      return { rings };
    });

    // ── Edges as 3D lit tubes, colored by MEANING ────────────────────────────
    //   • a spoke touching the hub → golden identity edge (thick)
    //   • same-category endpoints  → single-hue "reinforces" edge
    //   • different categories     → blended two-hue "bridges" edge
    // Each carries an outward-radiating pulse; active edges grow an energy dot.
    const UP = new THREE.Vector3(0, 1, 0);
    const edgeGeo = new THREE.CylinderGeometry(1, 1, 1, 8, 1, true);
    disposables.push(edgeGeo);
    const edges3d = GRAPH.edges
      .filter(([a, b]) => byId[a] && byId[b])
      .map(([x, y]) => {
        const touchesHub = x === HUB || y === HUB;
        const sameCat = byId[x].cat === byId[y].cat;
        const color = touchesHub ? new THREE.Color("#E0A970") : byId[x]._color.clone().lerp(byId[y]._color, 0.5);
        const baseRadius = touchesHub ? 1.1 : sameCat ? 0.85 : 0.6;
        const mat = new THREE.MeshStandardMaterial({
          color: color.clone().multiplyScalar(0.45), emissive: color.clone(), emissiveIntensity: 0.3,
          roughness: 0.4, metalness: 0.2, transparent: true, opacity: 0.85,
        });
        const mesh = new THREE.Mesh(edgeGeo, mat);
        group.add(mesh);
        const dotMat = new THREE.SpriteMaterial({ map: dotTex, color: color.clone(), transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false });
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
          const rep = 8000 / d2;
          a.vx += (dx / d) * rep; a.vy += (dy / d) * rep; a.vz += (dz / d) * rep;
          b.vx -= (dx / d) * rep; b.vy -= (dy / d) * rep; b.vz -= (dz / d) * rep;
        }
      }
      for (const e of edges3d) {
        const a = byId[e.x], b = byId[e.y];
        const dx = b.x - a.x, dy = b.y - a.y, dz = b.z - a.z;
        const d = Math.sqrt(dx * dx + dy * dy + dz * dz) || 0.01;
        const f = (d - 62) * 0.014;
        a.vx += (dx / d) * f; a.vy += (dy / d) * f; a.vz += (dz / d) * f;
        b.vx -= (dx / d) * f; b.vy -= (dy / d) * f; b.vz -= (dz / d) * f;
      }
      for (const n of nodes) {
        n.vx += -n.x * 0.003; n.vy += -n.y * 0.003; n.vz += -n.z * 0.003;
        n.vx *= 0.84; n.vy *= 0.84; n.vz *= 0.84;
        if (n.id === HUB) { n.x *= 0.8; n.y *= 0.8; n.z *= 0.8; }
        else { n.x += n.vx; n.y += n.vy; n.z += n.vz; }
      }
    }

    const camDir = new THREE.Vector3();
    const camUp = new THREE.Vector3();
    const edgeDir = new THREE.Vector3();
    const edgeMid = new THREE.Vector3();
    const proj = new THREE.Vector3();
    let introDone = !playIntro;

    function updateScene() {
      const g = gameRef.current;
      const pathSet = g ? new Set(g.path) : null;
      const pathEdges = new Set();
      if (g) for (let i = 0; i < g.path.length - 1; i++) { pathEdges.add(g.path[i] + "|" + g.path[i + 1]); pathEdges.add(g.path[i + 1] + "|" + g.path[i]); }
      const hover = hoverRef.current;
      const selId = selectedRef.current;
      const t = performance.now();
      const el = t - t0;

      // camera swoops in from far away on first load
      if (!introDone) {
        const f = clamp01(el / 2400);
        camera.position.setLength(620 + (HOME_DIST - 620) * easeOutCubic(f));
        if (f >= 1) introDone = true;
      }
      camUp.setFromMatrixColumn(camera.matrixWorld, 1); // screen-up in world space

      for (const n of nodes) {
        const holder = n._holder;
        holder.position.set(n.x, n.y, n.z);
        holder.quaternion.copy(camera.quaternion);

        const appear = easeOutBack(clamp01((el - n._appear) / 650));
        n._appearF = clamp01((el - n._appear) / 650);
        const emph = hover === n.id || (pathSet && pathSet.has(n.id)) || (g && g.start === n.id) || (g && g.target === n.id) || selId === n.id;
        const isTarget = g && g.target === n.id;
        const isHover = hover === n.id;

        let s = R(n) * appear;
        if (isTarget) s *= 1 + 0.08 * Math.sin(t / 220);
        else if (emph) s *= 1.14;
        n._sym.object.parent.scale.setScalar(Math.max(0.0001, s));
        n._hit.scale.setScalar(Math.max(0.0001, R(n) * 1.1));

        if (emph !== n._emph) {
          n._emph = emph;
          setHighlight(n._sym.highlight, n._color, emph ? (isTarget ? 0.45 : 0.28) : 0);
        }

        // idle motion: flat symbols wobble toward the viewer, 3D ones spin
        if (!reduce) {
          const speed = isHover ? 2.6 : 1;
          if (n._sym.flat) n._spin.rotation.y = Math.sin(t * 0.0009 * speed + n._phase) * 0.55;
          else n._spin.rotation.y = t * 0.0007 * speed + n._phase;
          n._spin.position.y = Math.sin(t / 900 + n._phase) * 1.6;
          n._spin.rotation.x = 0.18 * Math.sin(t / 1400 + n._phase);
          if (n._sym.tick) n._sym.tick(t + n._phase * 1000);
        }

        const haloS = s * (emph ? 3.1 : 2.5);
        n._halo.scale.set(haloS, haloS, 1);
        n._halo.material.opacity = (dark ? 0.32 : 0.24) * (emph ? 1.9 : 1) * n._appearF;

        camDir.copy(camera.position).sub(holder.position).normalize();
        const bob = reduce ? 0 : Math.sin(t / 800 + n._phase) * 1.4;
        n._label.position
          .copy(holder.position)
          .addScaledVector(camUp, s + n._labelHalfH + 4 + bob)
          .addScaledVector(camDir, s * 0.5);
        const dist = camera.position.distanceTo(holder.position);
        const depthFade = Math.max(0.35, Math.min(0.92, 1.75 - dist / 440));
        n._label.material.opacity = (emph ? 1 : depthFade) * n._appearF;
      }

      for (const e of edges3d) {
        const a = byId[e.x], b = byId[e.y];
        edgeDir.set(b.x - a.x, b.y - a.y, b.z - a.z);
        const len = edgeDir.length() || 0.01;
        edgeMid.set((a.x + b.x) / 2, (a.y + b.y) / 2, (a.z + b.z) / 2);
        e.mesh.position.copy(edgeMid);
        e.mesh.quaternion.setFromUnitVectors(UP, edgeDir.normalize());

        const inPath = pathEdges.has(e.x + "|" + e.y);
        const touchesHover = hover && (hover === e.x || hover === e.y);
        const emph = inPath || touchesHover;
        const grow = Math.min(a._appearF, b._appearF);

        const wave = 0.5 + 0.5 * Math.sin(t * 0.004 - edgeMid.length() * 0.03);
        const radius = e.baseRadius * (emph ? 1.8 : 1) * (0.82 + 0.34 * wave) * grow;
        e.mesh.visible = grow > 0.01;
        e.mesh.scale.set(Math.max(0.0001, radius), len, Math.max(0.0001, radius));
        e.mat.emissiveIntensity = (inPath ? 1.15 : touchesHover ? 0.85 : dark ? 0.34 : 0.3) * (0.55 + 0.75 * wave);
        e.mat.opacity = inPath ? 1 : touchesHover ? 0.95 : 0.78;

        if (emph && !reduce) {
          e.dot.visible = true;
          const frac = (t * (inPath ? 0.0011 : 0.0007)) % 1;
          e.dot.position.set(a.x + (b.x - a.x) * frac, a.y + (b.y - a.y) * frac, a.z + (b.z - a.z) * frac);
          const ds = radius * 3.4;
          e.dot.scale.set(ds, ds, 1);
          e.dotMat.opacity = 0.9;
        } else if (e.dot.visible) {
          e.dot.visible = false;
        }
      }

      // guide beacons + their floating HTML chips (only after the intro)
      const guides = introDone || el > 1800 ? guidesRef.current : [];
      beacons.forEach((bc, i) => {
        const gd = guides[i];
        const n = gd && byId[gd.id];
        const chip = chipEls.current[i];
        if (!n) {
          bc.rings.forEach((r) => (r.visible = false));
          if (chip) chip.style.opacity = "0";
          return;
        }
        const col = new THREE.Color(gd.color);
        const base = R(n) * 1.2;
        bc.rings.forEach((r, j) => {
          const f = reduce ? 0.5 : ((t * 0.0006) + j * 0.5) % 1;
          r.visible = true;
          r.position.copy(n._holder.position);
          const sc = base * (1.2 + f * 1.9);
          r.scale.set(sc, sc, 1);
          r.material.color.copy(col);
          r.material.opacity = (1 - f) * 0.85;
        });
        if (chip) {
          proj.copy(n._holder.position).addScaledVector(camUp, -R(n) * 1.25).project(camera);
          const onScreen = proj.z < 1 && Math.abs(proj.x) < 1.1 && Math.abs(proj.y) < 1.1;
          chip.style.opacity = onScreen ? "1" : "0";
          chip.style.transform = `translate(-50%, 0) translate(${((proj.x + 1) / 2) * w}px, ${((1 - proj.y) / 2) * h}px)`;
          if (chip.dataset.text !== gd.text) { chip.dataset.text = gd.text; chip.textContent = gd.text; chip.style.borderColor = gd.color; chip.style.color = gd.color; }
        }
      });
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
      const hit = raycaster.intersectObjects(hits, false);
      return hit.length ? hit[0].object.userData.id : null;
    }
    const onMove = (e) => {
      const id = pick(e);
      hoverRef.current = id;
      renderer.domElement.style.cursor = id ? "pointer" : "grab";
    };
    const onDown = (e) => {
      downPos = { x: e.clientX, y: e.clientY };
      introDone = true; // grabbing the graph cancels the fly-in
      setShowDragHint(false);
    };
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
      nodes.forEach((n) => disposeTree(n._sym.object));
      disposables.forEach((d) => d.dispose && d.dispose());
      renderer.dispose();
      if (renderer.domElement.parentNode) renderer.domElement.parentNode.removeChild(renderer.domElement);
    };
  }, [dark]);

  const node = selected ? GRAPH.nodes.find((n) => n.id === selected) : null;

  return (
    <div>
      <style>{GRAPH_CSS}</style>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 10, alignItems: "center" }}>
        <button onClick={() => { setMode("explore"); setGame(null); setStatus(""); }} style={tab(mode === "explore", dark)}>explore</button>
        <button onClick={() => newPuzzle()} style={tab(mode === "game", dark)} className={mode === "explore" && visited.size >= 3 ? "kg-attn" : undefined}>play NODE.LINK</button>
        {mode === "game" && (
          <div style={{ display: "flex", gap: 4, alignItems: "center", marginLeft: 4 }}>
            {Object.keys(DIFFICULTY).map((d) => (
              <button key={d} onClick={() => { setDifficulty(d); newPuzzle(d); }} style={chip(difficulty === d, dark)}>{DIFFICULTY[d].label}</button>
            ))}
          </div>
        )}
        <span style={{ fontFamily: MONO, fontSize: 11, color: p.faint, marginLeft: "auto" }}>
          {mode === "game" ? `streak ${score.streak} · best ${score.best}` : `explored ${visited.size}/${GRAPH.nodes.length}`}
        </span>
      </div>

      <div
        style={{
          position: "relative", borderRadius: 16, overflow: "hidden",
          border: "1px solid " + p.border,
          background: dark
            ? "radial-gradient(120% 120% at 50% 0%, rgba(196,144,96,0.1), rgba(13,12,10,0.6))"
            : "radial-gradient(120% 120% at 50% 0%, rgba(196,144,96,0.12), rgba(255,250,244,0.5))",
          boxShadow: p.shadowSoft,
        }}
      >
        <div ref={mountRef} style={{ width: "100%", height }} />

        {/* floating guide chips — positioned every frame by the WebGL loop */}
        {[0, 1].map((i) => (
          <div key={i} ref={(el) => { chipEls.current[i] = el; }} className="kg-chip" style={{ position: "absolute", left: 0, top: 0, opacity: 0, pointerEvents: "none", fontFamily: MONO, fontSize: 11, fontWeight: 700, padding: "3px 9px", borderRadius: 999, border: "1px solid #E0A970", color: "#E0A970", background: "rgba(16,14,11,0.82)", whiteSpace: "nowrap", transition: "opacity 0.3s ease", willChange: "transform" }} />
        ))}

        {showDragHint && (
          <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)", pointerEvents: "none", display: "flex", flexDirection: "column", alignItems: "center", gap: 6, animation: "kgFadeIn 0.6s ease 2.4s both" }}>
            <span className="kg-hand" style={{ fontSize: 34, filter: "drop-shadow(0 4px 10px rgba(0,0,0,0.4))" }}>👆</span>
            <span style={{ fontFamily: MONO, fontSize: 11, color: "#F5E6D3", background: "rgba(16,14,11,0.7)", padding: "3px 10px", borderRadius: 6 }}>drag to spin · click a symbol</span>
          </div>
        )}

        <div style={{ position: "absolute", top: 12, left: 12, display: "flex", gap: 10, flexWrap: "wrap", maxWidth: "70%", pointerEvents: "none" }}>
          {Object.entries(GRAPH.categories).map(([k, c]) => (
            <span key={k} style={{ display: "flex", alignItems: "center", gap: 5, fontFamily: MONO, fontSize: 10, color: p.muted }}>
              <span style={{ width: 8, height: 8, borderRadius: "50%", background: c.color, boxShadow: `0 0 6px ${c.color}` }} />{c.label}
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
          <div key={node.id} style={{ ...overlay(dark), animation: "kgSlideUp 0.35s cubic-bezier(.2,.9,.3,1)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
              <div style={{ flex: 1, minWidth: 200 }}>
                <span style={{ marginRight: 6 }}>{iconFor(node)}</span>
                <span style={{ color: catOf(node), fontWeight: 700 }}>{node.label}</span>
                <span style={{ color: p.muted }}> — {node.blurb}</span>
              </div>
              {node.page && <button onClick={() => onNavigate && onNavigate(node.page)} style={goBtn()} className="kg-attn">open {node.page} →</button>}
            </div>
          </div>
        )}
        {mode === "explore" && !node && (
          <div style={{ ...overlay(dark), color: p.faint }}>
            <span style={{ color: "#8B9D77" }}>graph ~ $</span> {visited.size ? "follow the glowing ring to the next idea · or open a node's page" : "click the pulsing ring to start · drag to spin · scroll to zoom"}
          </div>
        )}
      </div>
    </div>
  );
}

const GRAPH_CSS = `
@keyframes kgAttn { 0%,100% { box-shadow: 0 0 0 0 rgba(224,169,112,0.55); } 50% { box-shadow: 0 0 0 7px rgba(224,169,112,0); } }
.kg-attn { animation: kgAttn 1.8s ease-in-out infinite; }
@keyframes kgHand { 0%,100% { transform: translateX(-26px) rotate(-12deg); } 50% { transform: translateX(26px) rotate(12deg); } }
.kg-hand { animation: kgHand 1.6s ease-in-out infinite; display: inline-block; }
@keyframes kgFadeIn { from { opacity: 0; } to { opacity: 1; } }
@keyframes kgSlideUp { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }
@keyframes kgChip { 0%,100% { margin-top: 0; } 50% { margin-top: 5px; } }
.kg-chip { animation: kgChip 1.4s ease-in-out infinite; }
@media (prefers-reduced-motion: reduce) { .kg-attn, .kg-hand, .kg-chip { animation: none !important; } }
`;

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
