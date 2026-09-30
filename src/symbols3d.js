import * as THREE from "three";

// ── 3D node symbols ──────────────────────────────────────────────────────────
// Every knowledge-graph node is drawn as a small animated 3D object that *means*
// something — a dumbbell for lifting, a penguin for FOSS, an AAV capsid for
// Arbor Bio. Everything is built from three.js primitives (no model files), so
// the whole library costs a few KB and loads with the graph chunk.
//
// Picking a symbol (first match wins):
//   1. node.symbol           — explicit override (e.g. Obsidian `symbol: trophy`)
//   2. NODE_SYMBOLS[node.id] — hand-picked for the curated graph
//   3. KEYWORD_SYMBOLS       — regex over id/label/blurb, so brand-new nodes
//                              ("HackMIT 2nd place", "Read: AlphaFold 3") get a
//                              sensible symbol with zero config
//   4. CATEGORY_SYMBOLS      — per-category fallback
//
// Each builder returns { group, tick?(t), flat? }. The graph billboards every
// symbol toward the camera; `flat` symbols (shields, figures, pages) wobble
// gently instead of spinning so they never turn edge-on.

const UP = new THREE.Vector3(0, 1, 0);
const TAU = Math.PI * 2;

export const NODE_SYMBOLS = {
  me: "person", ucb: "pill", combine: "molecule", arbor: "virus", cheminfo: "flask",
  biophysics: "magnet", ares: "books", orbit: "planet", saliva: "testTube", ml: "neural",
  python: "snake", viz: "barChart", cloud: "cloud", sustain: "sapling", foss: "penguin",
  a4c: "access", aisafety: "shield", feeding: "bowl", learning: "openBook", rangers: "mountain",
  lifting: "dumbbell", cooking: "pan", konkani: "palm", writing: "quill",
  broad: "kgraph", route9: "laptop", studio: "controller", hackathons: "trophy",
};

const KEYWORD_SYMBOLS = [
  [/hackathon|award|prize|winner|finalist|champion|\b(1st|2nd|3rd)\b|\bplaced?\b/, "trophy"],
  [/paper|preprint|journal|publication|arxiv|biorxiv|\bread(ing)?\b/, "paper"],
  [/lift|gym|weight|strength|workout/, "dumbbell"],
  [/cook|recipe|kitchen/, "pan"],
  [/food|feed|meal|\beat/, "bowl"],
  [/python/, "snake"],
  [/safety|security|align/, "shield"],
  [/\bdna\b|gene|genom|\brna\b|omics|sequenc|crispr|bioinfo/, "dna"],
  [/virus|\baav\b|capsid|phage/, "virus"],
  [/\bml\b|machine learning|neural|deep learning|\bai\b|\bllm/, "neural"],
  [/chem|molecul|drug|dock|compound|protein/, "molecule"],
  [/flask|\blab\b|assay|wet/, "flask"],
  [/cloud|aws|docker|kubernetes|devops/, "cloud"],
  [/data|viz|chart|plot|umap|shap|analytic|dashboard|stat/, "barChart"],
  [/linux|foss|open.?source|gnu/, "penguin"],
  [/access|disab/, "access"],
  [/sustain|climate|environment|compost|green/, "sapling"],
  [/mountain|hike|climb|summit|ranger|outdoor|trail/, "mountain"],
  [/blog|writ|essay|substack|newsletter/, "quill"],
  [/universit|degree|school|college|graduat|northeastern|berkeley/, "gradCap"],
  [/book|learn|teach|course|class|study|tutor/, "openBook"],
  [/knowledge graph|agentic|\bagent/, "kgraph"],
  [/game|studio|arcade|pixel/, "controller"],
  [/app|software|code|engineer|website|github|hack/, "laptop"],
  [/idea|think|curious|explor/, "bulb"],
  [/startup|launch|ship|product|founder/, "rocket"],
  [/diagnos|saliva|clinic|medical|biomarker/, "testTube"],
  [/magnet|physic|force|energy/, "magnet"],
  [/orbit|space|planet|astro/, "planet"],
  [/pill|pharma|therap|degrad|biotech|bioscience/, "pill"],
  [/travel|home|india|mangalore|beach|island/, "palm"],
  [/library|screen/, "books"],
];

const CATEGORY_SYMBOLS = {
  self: "person", research: "molecule", project: "rocket", community: "globe",
  skill: "gear", value: "heart", life: "star",
};

export function symbolFor(n) {
  if (n.symbol && BUILDERS[n.symbol]) return n.symbol;
  if (NODE_SYMBOLS[n.id]) return NODE_SYMBOLS[n.id];
  const text = `${n.id} ${n.label} ${n.blurb || ""}`.toLowerCase();
  for (const [re, sym] of KEYWORD_SYMBOLS) if (re.test(text)) return sym;
  return CATEGORY_SYMBOLS[n.cat] || "star";
}

// ── small construction kit ───────────────────────────────────────────────────
function add(parent, geo, mat, p = [0, 0, 0], r = [0, 0, 0], s) {
  const m = new THREE.Mesh(geo, mat);
  m.position.set(p[0], p[1], p[2]);
  m.rotation.set(r[0], r[1], r[2]);
  if (s != null) Array.isArray(s) ? m.scale.set(s[0], s[1], s[2]) : m.scale.setScalar(s);
  parent.add(m);
  return m;
}
// A cylinder stretched between two points (bonds, limbs, wires).
function rod(parent, a, b, radius, mat, seg = 10) {
  const dir = b.clone().sub(a);
  const m = new THREE.Mesh(new THREE.CylinderGeometry(radius, radius, dir.length(), seg), mat);
  m.position.copy(a).add(b).multiplyScalar(0.5);
  m.quaternion.setFromUnitVectors(UP, dir.normalize());
  parent.add(m);
  return m;
}
const V = (x, y, z = 0) => new THREE.Vector3(x, y, z);
const lathe = (pts, seg = 40) => new THREE.LatheGeometry(pts.map(([x, y]) => new THREE.Vector2(x, y)), seg);
const hemi = (r, top = true) => new THREE.SphereGeometry(r, 32, 16, 0, TAU, top ? 0 : Math.PI / 2, Math.PI / 2);
function extrude(shape, depth = 0.16, bevel = 0.04) {
  const g = new THREE.ExtrudeGeometry(shape, { depth, bevelEnabled: true, bevelThickness: bevel, bevelSize: bevel, bevelSegments: 3, curveSegments: 24 });
  g.center();
  return g;
}

function leafShape() {
  const s = new THREE.Shape();
  s.moveTo(0, 0);
  s.bezierCurveTo(0.25, 0.1, 0.3, 0.45, 0, 0.7);
  s.bezierCurveTo(-0.3, 0.45, -0.25, 0.1, 0, 0);
  return s;
}
function heartShape() {
  const s = new THREE.Shape();
  s.moveTo(0, -0.7);
  s.bezierCurveTo(-0.2, -0.5, -0.75, -0.15, -0.72, 0.22);
  s.bezierCurveTo(-0.7, 0.6, -0.2, 0.72, 0, 0.36);
  s.bezierCurveTo(0.2, 0.72, 0.7, 0.6, 0.72, 0.22);
  s.bezierCurveTo(0.75, -0.15, 0.2, -0.5, 0, -0.7);
  return s;
}
function starShape(points = 5, outer = 0.75, inner = 0.32) {
  const s = new THREE.Shape();
  for (let i = 0; i <= points * 2; i++) {
    const r = i % 2 ? inner : outer;
    const a = (i / (points * 2)) * TAU + Math.PI / 2;
    i ? s.lineTo(Math.cos(a) * r, Math.sin(a) * r) : s.moveTo(Math.cos(a) * r, Math.sin(a) * r);
  }
  return s;
}
function gearShape(teeth = 10, rOut = 0.72, rIn = 0.56, hole = 0.2) {
  const s = new THREE.Shape();
  const step = TAU / teeth;
  for (let i = 0; i < teeth; i++) {
    const a = i * step;
    const pts = [[rIn, a], [rOut, a + step * 0.15], [rOut, a + step * 0.45], [rIn, a + step * 0.6]];
    pts.forEach(([r, t], j) => (i === 0 && j === 0 ? s.moveTo(Math.cos(t) * r, Math.sin(t) * r) : s.lineTo(Math.cos(t) * r, Math.sin(t) * r)));
  }
  s.closePath();
  const h = new THREE.Path();
  h.absarc(0, 0, hole, 0, TAU, true);
  s.holes.push(h);
  return s;
}
function shieldShape() {
  const s = new THREE.Shape();
  s.moveTo(0, 0.78);
  s.quadraticCurveTo(0.35, 0.72, 0.62, 0.58);
  s.lineTo(0.6, 0.05);
  s.quadraticCurveTo(0.52, -0.5, 0, -0.82);
  s.quadraticCurveTo(-0.52, -0.5, -0.6, 0.05);
  s.lineTo(-0.62, 0.58);
  s.quadraticCurveTo(-0.35, 0.72, 0, 0.78);
  return s;
}

// Common colors (real-world objects keep real colors; the category color shows
// up as an accent and in the halo behind every symbol).
const C = {
  metal: 0xc9ccd4, dark: 0x2a2a30, white: 0xf4efe6, gold: 0xe6b450, red: 0xd64541,
  skin: 0xd9a877, green: 0x5fa34a, wood: 0x7a5534, glass: 0xdcecff,
};

// ── builders ─────────────────────────────────────────────────────────────────
const BUILDERS = {
  // Amit: a bust with the graph literally orbiting around him.
  person(k) {
    const g = new THREE.Group();
    add(g, new THREE.SphereGeometry(0.3, 32, 24), k.mat(C.skin, { r: 0.55 }), [0, 0.42, 0]);
    add(g, hemi(0.315), k.mat(0x2b2320, { r: 0.85 }), [0, 0.47, -0.025], [-0.3, 0, 0]);
    const eye = k.mat(0x1d1a18);
    add(g, new THREE.SphereGeometry(0.032, 12, 8), eye, [-0.1, 0.44, 0.27]);
    add(g, new THREE.SphereGeometry(0.032, 12, 8), eye, [0.1, 0.44, 0.27]);
    add(g, new THREE.CylinderGeometry(0.22, 0.46, 0.6, 32), k.mat(k.cat, { r: 0.45 }), [0, -0.16, 0]);
    add(g, hemi(0.46, false), k.mat(k.cat, { r: 0.45 }), [0, -0.46, 0], [0, 0, 0], [1, 0.25, 1]);
    const orbit = new THREE.Group();
    orbit.rotation.set(1.2, 0, 0.3);
    g.add(orbit);
    add(orbit, new THREE.TorusGeometry(0.78, 0.016, 8, 96), k.mat(C.gold, { m: 0.9, r: 0.2, glow: C.gold, gi: 0.4 }));
    const dots = [0x8b9d77, 0x7fa6c4, 0xb79fc4].map((c) =>
      add(orbit, new THREE.SphereGeometry(0.075, 16, 12), k.mat(c, { glow: c, gi: 0.7 }))
    );
    return {
      group: g, flat: true,
      tick(t) { dots.forEach((d, i) => { const a = t * 0.0012 + i * 2.094; d.position.set(Math.cos(a) * 0.78, Math.sin(a) * 0.78, 0); }); },
    };
  },

  // UCB (targeted protein degradation): a drug capsule with a tiny bivalent
  // degrader molecule circling it.
  pill(k) {
    const g = new THREE.Group();
    const cap = new THREE.Group();
    cap.rotation.z = 0.8;
    g.add(cap);
    const a = k.mat(k.cat, { r: 0.22, m: 0.1 });
    const b = k.mat(C.white, { r: 0.3 });
    add(cap, new THREE.CylinderGeometry(0.3, 0.3, 0.5, 32), a, [0, 0.25, 0]);
    add(cap, hemi(0.3), a, [0, 0.5, 0]);
    add(cap, new THREE.CylinderGeometry(0.3, 0.3, 0.5, 32), b, [0, -0.25, 0]);
    add(cap, hemi(0.3, false), b, [0, -0.5, 0]);
    add(cap, new THREE.TorusGeometry(0.3, 0.018, 8, 48), k.mat(C.metal, { m: 0.8 }), [0, 0, 0], [Math.PI / 2, 0, 0]);
    const mol = new THREE.Group();
    g.add(mol);
    add(mol, new THREE.SphereGeometry(0.09, 16, 12), k.mat(0x7fa6c4, { glow: 0x7fa6c4, gi: 0.4 }), [-0.13, 0, 0]);
    add(mol, new THREE.SphereGeometry(0.09, 16, 12), k.mat(0xc4907f, { glow: 0xc4907f, gi: 0.4 }), [0.13, 0, 0]);
    rod(mol, V(-0.13, 0), V(0.13, 0), 0.025, k.mat(C.metal));
    return {
      group: g,
      tick(t) { const a2 = t * 0.0015; mol.position.set(Math.cos(a2) * 0.72, Math.sin(a2 * 1.3) * 0.25, Math.sin(a2) * 0.72); mol.rotation.z = a2 * 2; },
    };
  },

  // Ball-and-stick tetrahedral molecule.
  molecule(k) {
    const g = new THREE.Group();
    add(g, new THREE.SphereGeometry(0.26, 32, 24), k.mat(0x3a3a42, { r: 0.35, m: 0.2 }));
    const dirs = [V(1, 1, 1), V(1, -1, -1), V(-1, 1, -1), V(-1, -1, 1)].map((v) => v.normalize().multiplyScalar(0.72));
    const cols = [C.white, C.red, k.cat, 0x5b8def];
    const bond = k.mat(C.metal, { m: 0.7, r: 0.3 });
    dirs.forEach((d, i) => {
      rod(g, V(0, 0, 0), d, 0.05, bond);
      add(g, new THREE.SphereGeometry(0.17, 24, 16), k.mat(cols[i], { r: 0.3 }), [d.x, d.y, d.z]);
    });
    return { group: g };
  },

  // AAV capsid: faceted icosahedron studded with surface spikes.
  virus(k) {
    const g = new THREE.Group();
    add(g, new THREE.IcosahedronGeometry(0.48, 1), k.mat(k.cat, { r: 0.5, flat: true }));
    const spikes = new THREE.Group();
    g.add(spikes);
    const pos = new THREE.IcosahedronGeometry(1, 0).getAttribute("position");
    const seen = new Set();
    const stalk = k.mat(C.white, { r: 0.4 });
    const knob = k.mat(C.gold, { m: 0.5, r: 0.3, glow: C.gold, gi: 0.25 });
    for (let i = 0; i < pos.count; i++) {
      const v = V(pos.getX(i), pos.getY(i), pos.getZ(i)).normalize();
      const key = v.toArray().map((x) => x.toFixed(2)).join();
      if (seen.has(key)) continue;
      seen.add(key);
      rod(spikes, v.clone().multiplyScalar(0.42), v.clone().multiplyScalar(0.72), 0.03, stalk, 6);
      add(spikes, new THREE.SphereGeometry(0.075, 12, 8), knob, v.clone().multiplyScalar(0.76).toArray());
    }
    return { group: g, tick(t) { spikes.scale.setScalar(1 + 0.05 * Math.sin(t * 0.004)); } };
  },

  // Erlenmeyer flask with glowing reagent and rising bubbles.
  flask(k) {
    const g = new THREE.Group();
    const glass = k.mat(C.glass, { opacity: 0.28, r: 0.05, m: 0, side: THREE.DoubleSide });
    glass.depthWrite = false;
    add(g, lathe([[0, -0.8], [0.55, -0.8], [0.6, -0.74], [0.58, -0.66], [0.2, 0.25], [0.18, 0.7], [0.24, 0.76], [0.24, 0.8]]), glass);
    const liquid = k.mat(k.cat, { glow: k.cat, gi: 0.45, r: 0.2 });
    add(g, lathe([[0, -0.77], [0.52, -0.77], [0.55, -0.66], [0.38, -0.25], [0, -0.25]]), liquid);
    const bub = [];
    for (let i = 0; i < 6; i++) {
      const m = k.mat(C.white, { opacity: 0.8, glow: C.white, gi: 0.3, anim: true });
      bub.push({ mesh: add(g, new THREE.SphereGeometry(0.035 + (i % 3) * 0.015, 12, 8), m), m, off: (i * 0.37) % 1, x: ((i * 7) % 5) / 5 - 0.4 });
    }
    return {
      group: g,
      tick(t) {
        for (const b of bub) {
          const f = (t * 0.00035 + b.off) % 1;
          const y = -0.72 + f * 1.5;
          const wall = y < 0.25 ? 0.58 - ((y + 0.66) / 0.91) * 0.38 : 0.18;
          b.mesh.position.set(b.x * wall * 1.4 + Math.sin(t * 0.004 + b.off * 9) * 0.02, y, 0.05);
          b.m.opacity = y > 0.55 ? Math.max(0, 1 - (y - 0.55) * 4) : 0.8;
        }
      },
    };
  },

  // Horseshoe magnet with pulsing field lines.
  magnet(k) {
    const g = new THREE.Group();
    const red = k.mat(C.red, { r: 0.35, m: 0.2 });
    const steel = k.mat(C.metal, { m: 0.9, r: 0.25 });
    add(g, new THREE.TorusGeometry(0.42, 0.16, 20, 48, Math.PI), red, [0, 0.12, 0]);
    for (const x of [-0.42, 0.42]) {
      add(g, new THREE.CylinderGeometry(0.16, 0.16, 0.46, 24), red, [x, -0.11, 0]);
      add(g, new THREE.CylinderGeometry(0.165, 0.165, 0.18, 24), steel, [x, -0.43, 0]);
    }
    const lines = [0.42, 0.56, 0.7].map((r) => {
      const m = k.mat(k.cat, { glow: k.cat, gi: 0.9, opacity: 0.6, anim: true });
      add(g, new THREE.TorusGeometry(r, 0.014, 6, 48, Math.PI), m, [0, -0.52, 0], [0, 0, Math.PI]);
      return m;
    });
    return { group: g, flat: true, tick(t) { lines.forEach((m, i) => (m.opacity = 0.25 + 0.6 * (0.5 + 0.5 * Math.sin(t * 0.005 - i * 1.3)))); } };
  },

  // ARES: a stack of books (a screening *library*).
  books(k) {
    const g = new THREE.Group();
    const cols = [k.cat, 0x7fa6c4, 0xc4907f];
    const pages = k.mat(C.white, { r: 0.8 });
    const gold = k.mat(C.gold, { m: 0.8, r: 0.3 });
    const stack = cols.map((c, i) => {
      const b = new THREE.Group();
      b.position.y = -0.3 + i * 0.23;
      b.rotation.y = [0.1, -0.2, 0.3][i];
      add(b, new THREE.BoxGeometry(1.1, 0.2, 0.75), k.mat(c, { r: 0.55 }));
      add(b, new THREE.BoxGeometry(1.04, 0.15, 0.72), pages, [0.04, 0, 0]);
      add(b, new THREE.BoxGeometry(0.02, 0.05, 0.76), gold, [-0.4, 0, 0]);
      g.add(b);
      return b;
    });
    return { group: g, tick(t) { stack[2].rotation.y = 0.3 + Math.sin(t * 0.0018) * 0.25; } };
  },

  // Orbit Swap: a ringed planet with a moon.
  planet(k) {
    const g = new THREE.Group();
    const body = add(g, new THREE.SphereGeometry(0.45, 48, 32), k.mat(k.cat, { r: 0.6 }));
    add(body, new THREE.TorusGeometry(0.452, 0.03, 8, 64), k.mat(C.white, { r: 0.7, opacity: 0.5 }), [0, 0.12, 0], [Math.PI / 2, 0, 0]);
    add(g, new THREE.RingGeometry(0.62, 0.95, 72), k.mat(0xd4a574, { side: THREE.DoubleSide, opacity: 0.85, r: 0.5 }), [0, 0, 0], [Math.PI / 2 - 0.35, 0, 0]);
    const moon = add(g, new THREE.SphereGeometry(0.09, 20, 16), k.mat(C.white, { r: 0.9 }));
    return {
      group: g,
      tick(t) { body.rotation.y = t * 0.001; const a = t * 0.0014; moon.position.set(Math.cos(a) * 1.05, Math.sin(a) * 0.35, Math.sin(a) * 1.05); },
    };
  },

  // Saliva Dx: a test tube catching a falling droplet.
  testTube(k) {
    const g = new THREE.Group();
    const tube = new THREE.Group();
    tube.rotation.z = 0.25;
    g.add(tube);
    const glass = k.mat(C.glass, { opacity: 0.3, r: 0.05, m: 0, side: THREE.DoubleSide });
    glass.depthWrite = false;
    add(tube, new THREE.CylinderGeometry(0.2, 0.2, 1.1, 32, 1, true), glass, [0, -0.05, 0]);
    add(tube, hemi(0.2, false), glass, [0, -0.6, 0]);
    add(tube, new THREE.TorusGeometry(0.2, 0.025, 8, 40), k.mat(C.glass, { opacity: 0.6 }), [0, 0.5, 0], [Math.PI / 2, 0, 0]);
    const liquid = k.mat(k.cat, { glow: k.cat, gi: 0.45 });
    add(tube, new THREE.CylinderGeometry(0.17, 0.17, 0.45, 32), liquid, [0, -0.375, 0]);
    add(tube, hemi(0.17, false), liquid, [0, -0.6, 0]);
    const drop = new THREE.Group();
    tube.add(drop);
    add(drop, new THREE.SphereGeometry(0.065, 16, 12), liquid);
    add(drop, new THREE.ConeGeometry(0.063, 0.13, 16), liquid, [0, 0.085, 0]);
    return { group: g, flat: true, tick(t) { const f = (t * 0.0006) % 1; drop.position.y = 1.0 - f * f * 1.15; drop.visible = f < 0.97; } };
  },

  // ML: a tiny neural network with activations sweeping through the layers.
  neural(k) {
    const g = new THREE.Group();
    const layers = [3, 4, 3];
    const xs = [-0.75, 0, 0.75];
    const nodes = [];
    layers.forEach((n, li) => {
      for (let i = 0; i < n; i++) {
        const m = k.mat(k.cat, { glow: k.cat, gi: 0.2, r: 0.3, anim: true });
        const y = (i - (n - 1) / 2) * 0.42;
        nodes.push({ li, m, p: V(xs[li], y, (i % 2 ? 0.08 : -0.08)) });
        add(g, new THREE.SphereGeometry(0.1, 20, 16), m, nodes[nodes.length - 1].p.toArray());
      }
    });
    const wire = k.mat(C.white, { opacity: 0.35, r: 0.5 });
    const conns = [];
    for (const a of nodes) for (const b of nodes) if (b.li === a.li + 1) { rod(g, a.p, b.p, 0.01, wire, 5); conns.push([a.p, b.p]); }
    const pulses = [0, 1, 2, 3].map(() => add(g, new THREE.SphereGeometry(0.035, 10, 8), k.mat(C.white, { glow: C.white, gi: 1 })));
    return {
      group: g, flat: true,
      tick(t) {
        for (const nd of nodes) nd.m.emissiveIntensity = 0.15 + 0.9 * Math.max(0, Math.sin(t * 0.004 - nd.li * 1.1));
        pulses.forEach((pm, i) => {
          const f = (t * 0.0008 + i * 0.25) % 1;
          const [a, b] = conns[(Math.floor(t * 0.0008 + i * 0.25) * 7 + i * 5) % conns.length];
          pm.position.lerpVectors(a, b, f);
        });
      },
    };
  },

  // Python: a coiled snake with a flicking tongue.
  snake(k) {
    const g = new THREE.Group();
    const pts = [];
    for (let i = 0; i <= 34; i++) { const a = i * 0.36; pts.push(V(Math.cos(a) * 0.45, -0.62 + i * 0.026, Math.sin(a) * 0.45)); }
    pts.push(V(0.1, 0.4, 0.2), V(0, 0.55, 0.35));
    const curve = new THREE.CatmullRomCurve3(pts);
    const blue = k.mat(0x3776ab, { r: 0.4, m: 0.1 });
    const yellow = k.mat(0xffd43b, { r: 0.4 });
    add(g, new THREE.TubeGeometry(curve, 180, 0.085, 12), blue);
    for (let i = 1; i < 14; i++) add(g, new THREE.SphereGeometry(0.05, 10, 8), yellow, curve.getPoint(i / 15).toArray(), [0, 0, 0], [1, 0.6, 1]);
    const head = new THREE.Group();
    head.position.copy(curve.getPoint(1));
    head.lookAt(curve.getPoint(1).add(curve.getTangent(1)));
    g.add(head);
    add(head, new THREE.SphereGeometry(0.13, 20, 16), blue, [0, 0, 0.04], [0, 0, 0], [1, 0.75, 1.35]);
    const eye = k.mat(C.dark);
    add(head, new THREE.SphereGeometry(0.03, 10, 8), eye, [0.07, 0.05, 0.1]);
    add(head, new THREE.SphereGeometry(0.03, 10, 8), eye, [-0.07, 0.05, 0.1]);
    const tongue = new THREE.Group();
    tongue.position.z = 0.2;
    head.add(tongue);
    const red = k.mat(C.red);
    add(tongue, new THREE.BoxGeometry(0.015, 0.008, 0.14), red, [0, 0, 0.07]);
    add(tongue, new THREE.BoxGeometry(0.012, 0.008, 0.06), red, [0.02, 0, 0.16], [0, 0.5, 0]);
    add(tongue, new THREE.BoxGeometry(0.012, 0.008, 0.06), red, [-0.02, 0, 0.16], [0, -0.5, 0]);
    return { group: g, tick(t) { tongue.scale.z = Math.max(0.01, Math.sin(t * 0.009)) * (Math.sin(t * 0.0013) > 0.3 ? 1 : 0.01); } };
  },

  // SHAP / UMAP: a living bar chart.
  barChart(k) {
    const g = new THREE.Group();
    add(g, new THREE.BoxGeometry(1.5, 0.06, 0.9), k.mat(C.dark, { r: 0.6 }), [0, -0.53, 0]);
    const heights = [0.5, 0.85, 0.65, 1.1];
    const unit = new THREE.BoxGeometry(0.26, 1, 0.26).translate(0, 0.5, 0);
    const bars = heights.map((h, i) => {
      const col = new THREE.Color(k.cat).lerp(new THREE.Color(0xffffff), i * 0.15);
      const b = add(g, unit, k.mat(col, { r: 0.35, m: 0.15 }), [-0.54 + i * 0.36, -0.5, 0]);
      const dot = add(g, new THREE.SphereGeometry(0.05, 12, 8), k.mat(C.gold, { glow: C.gold, gi: 0.8 }));
      return { b, dot, h, i };
    });
    return {
      group: g,
      tick(t) { for (const { b, dot, h, i } of bars) { const s = h * (1 + 0.15 * Math.sin(t * 0.0022 + i * 1.4)); b.scale.y = s; dot.position.set(b.position.x, -0.5 + s + 0.09, 0); } },
    };
  },

  // Docker / AWS: a cloud with shipping containers bobbing beneath it.
  cloud(k) {
    const g = new THREE.Group();
    const white = k.mat(0xf2f4f8, { r: 0.85 });
    [[-0.4, 0.25, 0, 0.3], [0, 0.42, 0, 0.38], [0.42, 0.27, 0, 0.3], [-0.15, 0.2, 0.18, 0.28], [0.2, 0.18, -0.12, 0.3]]
      .forEach(([x, y, z, r]) => add(g, new THREE.SphereGeometry(r, 28, 20), white, [x, y, z]));
    const boxes = [-0.34, 0, 0.34].map((x, i) => {
      const b = new THREE.Group();
      b.position.set(x, -0.35, 0);
      add(b, new THREE.BoxGeometry(0.28, 0.2, 0.28), k.mat(0x2496ed, { r: 0.4, m: 0.2 }));
      for (let j = -1; j <= 1; j++) add(b, new THREE.BoxGeometry(0.02, 0.18, 0.285), k.mat(0x1b6fb0), [j * 0.08, 0, 0]);
      g.add(b);
      return { b, i };
    });
    return { group: g, tick(t) { for (const { b, i } of boxes) b.position.y = -0.38 + Math.sin(t * 0.003 + i * 1.1) * 0.06; } };
  },

  // Sustainability: a sapling in a terracotta pot.
  sapling(k) {
    const g = new THREE.Group();
    add(g, lathe([[0, -0.75], [0.3, -0.75], [0.38, -0.3], [0.44, -0.28], [0.44, -0.18], [0.39, -0.18], [0.35, -0.3], [0, -0.3]]), k.mat(0xc2693e, { r: 0.8, side: THREE.DoubleSide }));
    add(g, new THREE.CylinderGeometry(0.37, 0.37, 0.04, 32), k.mat(0x4a3322, { r: 1 }), [0, -0.24, 0]);
    const stemCurve = new THREE.CatmullRomCurve3([V(0, -0.24), V(0.04, 0.05), V(-0.02, 0.4)]);
    const leafMat = k.mat(C.green, { r: 0.5, side: THREE.DoubleSide });
    add(g, new THREE.TubeGeometry(stemCurve, 20, 0.028, 8), leafMat);
    const leafGeo = new THREE.ShapeGeometry(leafShape(), 16);
    const pivots = [[-0.02, 0.4, 0.9, 1], [-0.02, 0.4, -0.9, 1], [0.03, 0.08, -1.1, 0.7]].map(([x, y, rz, s]) => {
      const pv = new THREE.Group();
      pv.position.set(x, y, 0);
      pv.rotation.z = rz;
      add(pv, leafGeo, leafMat, [0, 0, 0], [0.3, 0, 0], s);
      g.add(pv);
      return { pv, rz };
    });
    return { group: g, flat: true, tick(t) { pivots.forEach(({ pv, rz }, i) => (pv.rotation.z = rz + Math.sin(t * 0.002 + i) * 0.12)); } };
  },

  // FOSS / GNU@NU: Tux, waddling.
  penguin(k) {
    const g = new THREE.Group();
    const black = k.mat(0x1f2126, { r: 0.5 });
    const white = k.mat(C.white, { r: 0.6 });
    const orange = k.mat(0xf2a33a, { r: 0.4 });
    add(g, new THREE.SphereGeometry(0.46, 32, 24), black, [0, -0.15, 0], [0, 0, 0], [1, 1.2, 0.9]);
    add(g, new THREE.SphereGeometry(0.38, 32, 24), white, [0, -0.2, 0.15], [0, 0, 0], [0.95, 1.1, 0.72]);
    add(g, new THREE.SphereGeometry(0.3, 32, 24), black, [0, 0.55, 0]);
    add(g, new THREE.SphereGeometry(0.22, 24, 16), white, [0, 0.51, 0.15], [0, 0, 0], [1, 0.9, 0.6]);
    for (const x of [-0.09, 0.09]) {
      add(g, new THREE.SphereGeometry(0.055, 12, 8), white, [x, 0.62, 0.25]);
      add(g, new THREE.SphereGeometry(0.03, 10, 8), black, [x, 0.62, 0.3]);
      add(g, new THREE.SphereGeometry(0.13, 16, 10), orange, [x * 2, -0.72, 0.1], [0, 0, 0], [1, 0.35, 1.4]);
    }
    add(g, new THREE.ConeGeometry(0.07, 0.2, 16), orange, [0, 0.5, 0.36], [Math.PI / 2, 0, 0]);
    const fl = [-1, 1].map((sgn) => add(g, new THREE.SphereGeometry(0.16, 16, 12), black, [sgn * 0.46, -0.1, 0], [0, 0, sgn * 0.35], [0.35, 1.1, 0.6]));
    return {
      group: g, flat: true,
      tick(t) { g.rotation.z = Math.sin(t * 0.005) * 0.1; fl.forEach((f, i) => (f.rotation.z = (i ? 1 : -1) * (0.35 + Math.max(0, Math.sin(t * 0.01)) * 0.35))); },
    };
  },

  // A4C: the universal-access figure inside a ring.
  access(k) {
    const g = new THREE.Group();
    const ring = add(g, new THREE.TorusGeometry(0.78, 0.06, 16, 80), k.mat(k.cat, { m: 0.5, r: 0.3 }));
    const w = k.mat(C.white, { r: 0.4 });
    add(g, new THREE.SphereGeometry(0.11, 20, 16), w, [0, 0.45, 0]);
    rod(g, V(-0.45, 0.22), V(0.45, 0.22), 0.055, w);
    rod(g, V(0, 0.28), V(0, -0.15), 0.075, w);
    rod(g, V(0, -0.15), V(-0.26, -0.56), 0.06, w);
    rod(g, V(0, -0.15), V(0.26, -0.56), 0.06, w);
    return { group: g, flat: true, tick(t) { ring.rotation.y = Math.sin(t * 0.002) * 0.6; } };
  },

  // AI Safety: an embossed shield with a glowing check.
  shield(k) {
    const g = new THREE.Group();
    add(g, extrude(shieldShape(), 0.14, 0.05), [k.mat(k.cat, { m: 0.55, r: 0.3 }), k.mat(C.gold, { m: 0.9, r: 0.25 })]);
    const check = k.mat(C.gold, { m: 0.6, glow: C.gold, gi: 0.4, anim: true });
    rod(g, V(-0.26, 0.02, 0.14), V(-0.06, -0.2, 0.14), 0.06, check);
    rod(g, V(-0.06, -0.2, 0.14), V(0.3, 0.3, 0.14), 0.06, check);
    return { group: g, flat: true, tick(t) { check.emissiveIntensity = 0.3 + 0.7 * (0.5 + 0.5 * Math.sin(t * 0.004)); } };
  },

  // Feeding people: a steaming bowl.
  bowl(k) {
    const g = new THREE.Group();
    g.rotation.x = 0.35;
    add(g, lathe([[0, -0.5], [0.25, -0.5], [0.3, -0.45], [0.62, -0.05], [0.66, 0.05], [0.6, 0.05], [0.27, -0.4], [0, -0.42]], 48), k.mat(k.cat, { r: 0.3, side: THREE.DoubleSide }));
    add(g, hemi(0.58), k.mat(0xe0a040, { r: 0.7 }), [0, -0.02, 0], [0, 0, 0], [1, 0.3, 1]);
    const herb = k.mat(C.green);
    [[0.15, 0.1], [-0.2, 0.05], [0.05, -0.2], [-0.05, 0.25]].forEach(([x, z]) => add(g, new THREE.SphereGeometry(0.04, 8, 6), herb, [x, 0.14, z]));
    const steam = [0, 1, 2].map((i) => {
      const m = k.mat(C.white, { opacity: 0.5, r: 1, anim: true });
      m.depthWrite = false;
      return { mesh: add(g, new THREE.SphereGeometry(0.1, 16, 12), m), m, i };
    });
    return {
      group: g, flat: true,
      tick(t) {
        for (const s of steam) {
          const f = (t * 0.0005 + s.i / 3) % 1;
          s.mesh.position.set((s.i - 1) * 0.22 + Math.sin(t * 0.003 + s.i) * 0.06, 0.15 + f * 0.8, 0);
          s.mesh.scale.setScalar(0.6 + f * 1.1);
          s.m.opacity = 0.55 * Math.sin(f * Math.PI);
        }
      },
    };
  },

  // Learning together: an open book with a page turning.
  openBook(k) {
    const g = new THREE.Group();
    g.rotation.x = 0.9;
    add(g, new THREE.BoxGeometry(1.5, 0.05, 1), k.mat(k.cat, { r: 0.6 }), [0, -0.06, 0]);
    const paper = k.mat(C.white, { r: 0.85, side: THREE.DoubleSide });
    const ink = k.mat(0x6b5e52);
    for (const sgn of [-1, 1]) {
      const pg = add(g, new THREE.BoxGeometry(0.7, 0.08, 0.92), paper, [sgn * 0.36, 0, 0], [0, 0, -sgn * 0.1]);
      for (let i = 0; i < 5; i++) add(pg, new THREE.BoxGeometry(0.5, 0.004, 0.03), ink, [0, 0.042, -0.3 + i * 0.14]);
    }
    const pivot = new THREE.Group();
    pivot.position.y = 0.05;
    g.add(pivot);
    add(pivot, new THREE.BoxGeometry(0.7, 0.01, 0.9), paper, [0.35, 0, 0]);
    return { group: g, flat: true, tick(t) { const f = (t * 0.0004) % 1; pivot.rotation.z = -0.1 + Math.min(1, f * 1.6) * (Math.PI + 0.2) * (f < 0.8 ? 1 : 0); } };
  },

  // Rooftop Rangers: twin peaks with a flag on the summit.
  mountain(k) {
    const g = new THREE.Group();
    const rock = k.mat(0x7d8a7a, { flat: true, r: 0.9 });
    const snow = k.mat(C.white, { flat: true, r: 0.6 });
    add(g, new THREE.ConeGeometry(0.6, 1.2, 6), rock, [-0.1, -0.1, 0]);
    add(g, new THREE.ConeGeometry(0.22, 0.44, 6), snow, [-0.1, 0.28, 0], [0, 0, 0], 1.04);
    add(g, new THREE.ConeGeometry(0.42, 0.8, 6), rock, [0.4, -0.3, 0.1], [0, 0.4, 0]);
    add(g, new THREE.ConeGeometry(0.142, 0.27, 6), snow, [0.4, -0.035, 0.1], [0, 0.4, 0], 1.04);
    rod(g, V(-0.1, 0.5), V(-0.1, 0.88), 0.014, k.mat(C.metal, { m: 0.9 }));
    const tri = new THREE.Shape();
    tri.moveTo(0, 0); tri.lineTo(0.28, -0.07); tri.lineTo(0, -0.14);
    const flag = new THREE.Group();
    flag.position.set(-0.1, 0.88, 0);
    add(flag, new THREE.ShapeGeometry(tri), k.mat(k.cat, { side: THREE.DoubleSide, glow: k.cat, gi: 0.3 }));
    g.add(flag);
    return { group: g, flat: true, tick(t) { flag.rotation.y = Math.sin(t * 0.006) * 0.45; } };
  },

  // Lifting: a loaded dumbbell mid-curl.
  dumbbell(k) {
    const g = new THREE.Group();
    const inner = new THREE.Group();
    g.add(inner);
    const steel = k.mat(C.metal, { m: 0.95, r: 0.2 });
    const rubber = k.mat(0x26262b, { r: 0.55, m: 0.1 });
    const plate = k.mat(k.cat, { r: 0.35, m: 0.35 });
    const Z = [0, 0, Math.PI / 2];
    add(inner, new THREE.CylinderGeometry(0.045, 0.045, 1.9, 16), steel, [0, 0, 0], Z);
    add(inner, new THREE.CylinderGeometry(0.062, 0.062, 0.5, 16), k.mat(0x3a3a40, { r: 0.9 }), [0, 0, 0], Z);
    for (const s of [-1, 1]) {
      add(inner, new THREE.CylinderGeometry(0.42, 0.42, 0.11, 40), rubber, [s * 0.52, 0, 0], Z);
      add(inner, new THREE.TorusGeometry(0.42, 0.018, 8, 48), plate, [s * 0.52 + s * 0.056, 0, 0], [0, Math.PI / 2, 0]);
      add(inner, new THREE.CylinderGeometry(0.32, 0.32, 0.1, 40), plate, [s * 0.65, 0, 0], Z);
      add(inner, new THREE.CylinderGeometry(0.075, 0.075, 0.07, 16), steel, [s * 0.74, 0, 0], Z);
    }
    return { group: g, tick(t) { const c = Math.sin(t * 0.003); inner.position.y = Math.max(0, c) * 0.28 - 0.08; inner.rotation.z = c * 0.12; } };
  },

  // Cooking: a pan flipping an egg.
  pan(k) {
    const g = new THREE.Group();
    g.rotation.x = 0.55;
    add(g, lathe([[0, -0.07], [0.5, -0.07], [0.62, 0.08], [0.58, 0.08], [0.47, -0.03], [0, -0.03]], 48), k.mat(C.dark, { m: 0.6, r: 0.35, side: THREE.DoubleSide }));
    add(g, new THREE.BoxGeometry(0.7, 0.06, 0.1), k.mat(C.wood, { r: 0.7 }), [0.95, 0.04, 0]);
    add(g, new THREE.CylinderGeometry(0.06, 0.06, 0.1, 12), k.mat(C.metal, { m: 0.9 }), [0.6, 0.04, 0], [0, 0, Math.PI / 2]);
    const egg = new THREE.Group();
    g.add(egg);
    add(egg, new THREE.SphereGeometry(0.28, 24, 16), k.mat(C.white, { r: 0.4 }), [0, 0, 0], [0, 0, 0], [1.15, 0.12, 1]);
    add(egg, new THREE.SphereGeometry(0.11, 20, 16), k.mat(0xf6b928, { r: 0.3, glow: 0xf6b928, gi: 0.15 }), [0.03, 0.03, 0.02], [0, 0, 0], [1, 0.65, 1]);
    return {
      group: g, flat: true,
      tick(t) { const f = (t * 0.0005) % 1; const air = f < 0.35 ? Math.sin((f / 0.35) * Math.PI) : 0; egg.position.y = 0.0 + air * 0.55; egg.rotation.x = f < 0.35 ? (f / 0.35) * TAU : 0; },
    };
  },

  // Mangalore: a coconut palm on a sandy island.
  palm(k) {
    const g = new THREE.Group();
    add(g, hemi(0.55), k.mat(0xe2c290, { r: 1 }), [0, -0.7, 0], [0, 0, 0], [1, 0.35, 1]);
    const top = V(-0.14, 0.52, 0);
    const trunk = new THREE.CatmullRomCurve3([V(0, -0.62), V(0.1, -0.2), V(0.03, 0.2), top]);
    add(g, new THREE.TubeGeometry(trunk, 30, 0.06, 10), k.mat(0x8a6a45, { r: 0.9 }));
    for (let i = 1; i < 8; i++) add(g, new THREE.TorusGeometry(0.062, 0.012, 6, 16), k.mat(0x6e5236, { r: 1 }), trunk.getPoint(i / 8).toArray(), [Math.PI / 2, 0, 0]);
    const frond = new THREE.ShapeGeometry(leafShape(), 12);
    const leaf = k.mat(0x3f8f4a, { r: 0.6, side: THREE.DoubleSide });
    const fronds = [];
    for (let i = 0; i < 7; i++) {
      const pv = new THREE.Group();
      pv.position.copy(top);
      pv.rotation.y = (i / 7) * TAU;
      add(pv, frond, leaf, [0, 0, 0], [0, 0, -1.95], [0.5, 1.1, 1]);
      g.add(pv);
      fronds.push(pv);
    }
    const nut = k.mat(0x5a3d24, { r: 0.7 });
    [[0.06, -0.06, 0.03], [-0.05, -0.07, 0.05], [0, -0.06, -0.06]].forEach(([x, y, z]) => add(g, new THREE.SphereGeometry(0.065, 12, 10), nut, [top.x + x, top.y + y, z]));
    return { group: g, flat: true, tick(t) { fronds.forEach((pv, i) => (pv.rotation.x = Math.sin(t * 0.002 + i) * 0.1)); } };
  },

  // Blog: a quill writing on a page, line by line.
  quill(k) {
    const g = new THREE.Group();
    add(g, new THREE.BoxGeometry(0.85, 1.05, 0.02), k.mat(C.white, { r: 0.9 }), [-0.12, -0.05, -0.05]);
    const ink = k.mat(0x3a332c);
    const lines = [0.3, 0.14, -0.02, -0.18, -0.34].map((y) => {
      const l = add(g, new THREE.BoxGeometry(0.6, 0.022, 0.005), ink, [-0.12, y, -0.035]);
      l.geometry.translate(0.3, 0, 0);
      l.position.x = -0.42;
      return l;
    });
    const q = new THREE.Group();
    g.add(q);
    const inner = new THREE.Group();
    inner.rotation.z = -0.55;
    q.add(inner);
    add(inner, new THREE.ShapeGeometry(leafShape(), 16), k.mat(k.cat, { side: THREE.DoubleSide, r: 0.6 }), [0, 0.18, 0.02], [0, 0, 0], [0.55, 1.45, 1]);
    rod(inner, V(0, 0.12, 0.03), V(0, 1.12, 0.03), 0.012, k.mat(C.white));
    add(inner, new THREE.ConeGeometry(0.035, 0.16, 12), k.mat(C.gold, { m: 0.9, r: 0.2 }), [0, 0.05, 0.03], [Math.PI, 0, 0]);
    return {
      group: g, flat: true,
      tick(t) {
        const cycle = (t * 0.00025) % 1;
        const li = Math.floor(cycle * lines.length);
        const f = (cycle * lines.length) % 1;
        lines.forEach((l, i) => (l.scale.x = i < li ? 1 : i === li ? Math.max(0.01, f) : 0.01));
        q.position.set(-0.42 + f * 0.6, lines[li].position.y + Math.sin(t * 0.03) * 0.012, 0);
      },
    };
  },

  // ── generic symbols (used by keywords/category for future nodes) ──────────
  trophy(k) {
    const g = new THREE.Group();
    const gold = k.mat(C.gold, { m: 1, r: 0.2 });
    add(g, lathe([[0, 0.05], [0.14, 0.08], [0.32, 0.22], [0.42, 0.45], [0.46, 0.78], [0.42, 0.78], [0.37, 0.48], [0.27, 0.26], [0, 0.2]], 48), k.mat(C.gold, { m: 1, r: 0.2, side: THREE.DoubleSide }), [0, -0.25, 0]);
    for (const s of [-1, 1]) add(g, new THREE.TorusGeometry(0.17, 0.035, 12, 32, Math.PI), gold, [s * 0.42, 0.25, 0], [0, 0, -s * Math.PI / 2]);
    add(g, new THREE.CylinderGeometry(0.05, 0.09, 0.32, 16), gold, [0, -0.36, 0]);
    add(g, new THREE.CylinderGeometry(0.3, 0.34, 0.14, 32), k.mat(C.dark, { r: 0.4 }), [0, -0.58, 0]);
    add(g, new THREE.BoxGeometry(0.28, 0.07, 0.02), k.mat(k.cat, { m: 0.5 }), [0, -0.58, 0.33]);
    const star = add(g, extrude(starShape(5, 0.2, 0.09), 0.05, 0.015), k.mat(C.gold, { m: 0.8, glow: C.gold, gi: 0.6 }), [0, 0.78, 0]);
    return { group: g, tick(t) { star.rotation.y = t * 0.003; star.position.y = 0.78 + Math.sin(t * 0.003) * 0.05; } };
  },

  paper(k) {
    const g = new THREE.Group();
    const sheet = k.mat(C.white, { r: 0.9 });
    [[-0.18, -0.08], [0.1, -0.04], [0, 0]].forEach(([rz, z], i) => {
      const s = add(g, new THREE.BoxGeometry(0.75, 1, 0.015), i === 2 ? sheet : k.mat(0xe8e0d2, { r: 0.9 }), [0, 0, z], [0, 0, rz]);
      if (i === 2) {
        add(s, new THREE.BoxGeometry(0.5, 0.06, 0.005), k.mat(k.cat), [0, 0.38, 0.01]);
        for (let j = 0; j < 5; j++) add(s, new THREE.BoxGeometry(0.55, 0.018, 0.005), k.mat(0x6b5e52), [0, 0.22 - j * 0.09, 0.01]);
        add(s, new THREE.BoxGeometry(0.26, 0.18, 0.005), k.mat(new THREE.Color(k.cat).lerp(new THREE.Color(0xffffff), 0.4)), [-0.12, -0.3, 0.01]);
      }
    });
    const mag = new THREE.Group();
    g.add(mag);
    add(mag, new THREE.TorusGeometry(0.2, 0.035, 12, 40), k.mat(C.dark, { m: 0.6, r: 0.3 }));
    const lens = k.mat(C.glass, { opacity: 0.35, r: 0.05 });
    lens.depthWrite = false;
    add(mag, new THREE.CylinderGeometry(0.19, 0.19, 0.01, 32), lens, [0, 0, 0], [Math.PI / 2, 0, 0]);
    rod(mag, V(0.15, -0.15), V(0.4, -0.4), 0.035, k.mat(C.wood));
    return { group: g, flat: true, tick(t) { const a = t * 0.0015; mag.position.set(Math.cos(a) * 0.22, Math.sin(a) * 0.25, 0.12); } };
  },

  bulb(k) {
    const g = new THREE.Group();
    const glow = k.mat(0xffe08a, { glow: 0xffc940, gi: 0.8, opacity: 0.9, r: 0.1, anim: true });
    add(g, new THREE.SphereGeometry(0.42, 32, 24), glow, [0, 0.18, 0]);
    add(g, lathe([[0.22, -0.2], [0.16, -0.38], [0, -0.38]]), k.mat(C.metal, { m: 0.9, side: THREE.DoubleSide }));
    for (let i = 0; i < 3; i++) add(g, new THREE.TorusGeometry(0.19 - i * 0.012, 0.025, 8, 24), k.mat(C.metal, { m: 0.9, r: 0.3 }), [0, -0.24 - i * 0.05, 0], [Math.PI / 2, 0, 0]);
    add(g, new THREE.SphereGeometry(0.06, 12, 8), k.mat(C.dark), [0, -0.42, 0]);
    return { group: g, flat: true, tick(t) { glow.emissiveIntensity = 0.5 + 0.6 * (0.5 + 0.5 * Math.sin(t * 0.004)); } };
  },

  laptop(k) {
    const g = new THREE.Group();
    g.rotation.x = 0.3;
    const alu = k.mat(C.metal, { m: 0.8, r: 0.3 });
    add(g, new THREE.BoxGeometry(1.2, 0.05, 0.8), alu, [0, -0.3, 0.1]);
    add(g, new THREE.BoxGeometry(1.0, 0.01, 0.42), k.mat(C.dark), [0, -0.27, 0.02]);
    const lid = new THREE.Group();
    lid.position.set(0, -0.28, -0.3);
    lid.rotation.x = -0.2;
    g.add(lid);
    add(lid, new THREE.BoxGeometry(1.2, 0.8, 0.04), alu, [0, 0.4, 0]);
    const screen = k.mat(0x151412, { glow: k.cat, gi: 0.15, anim: true });
    add(lid, new THREE.BoxGeometry(1.1, 0.7, 0.005), screen, [0, 0.4, 0.022]);
    const code = [0, 1, 2, 3, 4].map((i) => {
      const l = add(lid, new THREE.BoxGeometry(0.6, 0.035, 0.004), k.mat(i % 2 ? k.cat : 0x8b9d77, { glow: i % 2 ? k.cat : 0x8b9d77, gi: 0.9 }), [0, 0.64 - i * 0.1, 0.027]);
      l.geometry.translate(0.3, 0, 0);
      l.position.x = -0.45 + (i % 3) * 0.06;
      return l;
    });
    return { group: g, flat: true, tick(t) { const f = (t * 0.0004) % 1; code.forEach((l, i) => (l.scale.x = Math.min(1, Math.max(0.01, f * 5 - i)) * (0.5 + ((i * 37) % 10) / 20))); } };
  },

  gear(k) {
    const g = new THREE.Group();
    const big = add(g, extrude(gearShape(), 0.18, 0.03), k.mat(k.cat, { m: 0.7, r: 0.3 }), [-0.12, 0.1, 0]);
    const small = add(g, extrude(gearShape(8, 0.4, 0.3, 0.12), 0.16, 0.03), k.mat(C.metal, { m: 0.9, r: 0.25 }), [0.55, -0.45, 0.05]);
    return { group: g, flat: true, tick(t) { big.rotation.z = t * 0.0008; small.rotation.z = -t * 0.0008 * 1.25 + 0.2; } };
  },

  heart(k) {
    const g = new THREE.Group();
    const h = add(g, extrude(heartShape(), 0.25, 0.08), k.mat(0xd9534f, { r: 0.3, m: 0.2, glow: 0xd9534f, gi: 0.15 }));
    return { group: g, flat: true, tick(t) { const b = (t % 1200) / 1200; h.scale.setScalar(1 + (b < 0.12 ? Math.sin((b / 0.12) * Math.PI) * 0.12 : b < 0.28 ? Math.sin(((b - 0.12) / 0.16) * Math.PI) * 0.07 : 0)); } };
  },

  star(k) {
    const g = new THREE.Group();
    add(g, extrude(starShape(), 0.2, 0.06), k.mat(C.gold, { m: 0.7, r: 0.25, glow: k.cat, gi: 0.25 }));
    return { group: g, flat: true };
  },

  globe(k) {
    const g = new THREE.Group();
    add(g, new THREE.SphereGeometry(0.55, 40, 28), k.mat(0x4f86b8, { r: 0.5 }));
    add(g, new THREE.SphereGeometry(0.57, 18, 12), new THREE.MeshBasicMaterial({ color: 0xffffff, wireframe: true, transparent: true, opacity: 0.25 }));
    const land = k.mat(C.green, { r: 0.8 });
    [[0.3, 0.2, 0.18], [-0.25, -0.1, 0.22], [0.05, -0.35, 0.14], [-0.1, 0.35, 0.12]].forEach(([y, a, s]) => {
      const v = V(Math.cos(a * 6), y, Math.sin(a * 6)).normalize().multiplyScalar(0.5);
      add(g, new THREE.SphereGeometry(s, 16, 12), land, v.toArray(), [0, 0, 0], [1, 0.5, 1]);
    });
    add(g, new THREE.TorusGeometry(0.8, 0.02, 8, 80), k.mat(k.cat, { m: 0.6, glow: k.cat, gi: 0.3 }), [0, 0, 0], [1.2, 0.2, 0]);
    return { group: g };
  },

  gradCap(k) {
    const g = new THREE.Group();
    g.rotation.x = 0.4;
    const black = k.mat(C.dark, { r: 0.6 });
    add(g, new THREE.BoxGeometry(1.1, 0.05, 1.1), black, [0, 0.12, 0], [0, Math.PI / 4, 0]);
    add(g, new THREE.CylinderGeometry(0.36, 0.42, 0.32, 32), black, [0, -0.06, 0]);
    add(g, new THREE.SphereGeometry(0.05, 12, 8), k.mat(C.gold, { m: 0.8 }), [0, 0.16, 0]);
    const tassel = new THREE.Group();
    tassel.position.set(0.72, 0.14, 0);
    g.add(tassel);
    rod(g, V(0, 0.16), V(0.72, 0.14), 0.012, k.mat(C.gold));
    rod(tassel, V(0, 0), V(0, -0.35), 0.012, k.mat(C.gold));
    add(tassel, new THREE.CylinderGeometry(0.03, 0.06, 0.14, 12), k.mat(k.cat), [0, -0.4, 0]);
    return { group: g, tick(t) { tassel.rotation.z = Math.sin(t * 0.004) * 0.3; } };
  },

  rocket(k) {
    const g = new THREE.Group();
    const r = new THREE.Group();
    r.rotation.z = -0.55;
    g.add(r);
    add(r, lathe([[0, -0.55], [0.2, -0.5], [0.26, -0.1], [0.24, 0.25], [0.15, 0.5], [0, 0.72]]), k.mat(C.white, { r: 0.35, m: 0.2 }));
    add(r, new THREE.TorusGeometry(0.09, 0.022, 8, 24), k.mat(C.metal, { m: 0.9 }), [0, 0.15, 0.235]);
    add(r, new THREE.SphereGeometry(0.08, 16, 12), k.mat(0x7fc4e6, { r: 0.1, m: 0.3 }), [0, 0.15, 0.22], [0, 0, 0], [1, 1, 0.5]);
    const fin = new THREE.Shape();
    fin.moveTo(0, 0); fin.lineTo(0.22, -0.2); fin.lineTo(0.22, -0.34); fin.lineTo(0, -0.18);
    const finGeo = extrude(fin, 0.03, 0.01);
    for (let i = 0; i < 3; i++) {
      const pv = new THREE.Group();
      pv.rotation.y = (i / 3) * TAU;
      add(pv, finGeo, k.mat(k.cat, { r: 0.4 }), [0.3, -0.35, 0]);
      r.add(pv);
    }
    const flame = k.mat(0xff9a3c, { glow: 0xff7a1a, gi: 1, opacity: 0.9, anim: true });
    const fl = add(r, new THREE.ConeGeometry(0.14, 0.4, 16), flame, [0, -0.75, 0], [Math.PI, 0, 0]);
    return { group: g, tick(t) { fl.scale.set(1, 0.8 + Math.random() * 0.4, 1); flame.opacity = 0.7 + Math.random() * 0.3; r.position.y = Math.sin(t * 0.003) * 0.05; } };
  },

  // Knowledge graph: a glowing network of nodes wired together inside a
  // wireframe globe — the Broad/Gyori work is literally this site's metaphor.
  kgraph(k) {
    const g = new THREE.Group();
    const pts = [];
    for (let i = 0; i < 11; i++) {
      const y = 1 - (i / 10) * 2, r = Math.sqrt(1 - y * y), a = i * 2.4;
      pts.push(V(Math.cos(a) * r * 0.62, y * 0.62, Math.sin(a) * r * 0.62));
    }
    pts.push(V(0, 0, 0));
    const cols = [0x8b9d77, 0x7fa6c4, 0xc4907f, 0xb79fc4, 0xd4a574];
    const nodes = pts.map((p, i) => {
      const m = k.mat(i === pts.length - 1 ? C.gold : cols[i % cols.length], { glow: i === pts.length - 1 ? C.gold : cols[i % cols.length], gi: 0.3, anim: true });
      add(g, new THREE.SphereGeometry(i === pts.length - 1 ? 0.13 : 0.075, 16, 12), m, p.toArray());
      return m;
    });
    const wire = k.mat(C.white, { opacity: 0.45 });
    pts.forEach((p, i) => {
      if (i < pts.length - 1) rod(g, p, pts[pts.length - 1], 0.01, wire, 5);
      if (i < pts.length - 2) rod(g, p, pts[i + 1], 0.01, wire, 5);
    });
    add(g, new THREE.SphereGeometry(0.8, 14, 10), new THREE.MeshBasicMaterial({ color: k.cat, wireframe: true, transparent: true, opacity: 0.18 }));
    return { group: g, tick(t) { nodes.forEach((m, i) => (m.emissiveIntensity = 0.2 + 0.8 * Math.max(0, Math.sin(t * 0.003 - i * 0.6)))); } };
  },

  // Just Another Studios: a game controller with a blinking button.
  controller(k) {
    const g = new THREE.Group();
    const body = k.mat(0x2e2c33, { r: 0.45, m: 0.1 });
    add(g, new THREE.CapsuleGeometry(0.3, 0.7, 8, 24), body, [0, 0, 0], [0, 0, Math.PI / 2]);
    for (const s of [-1, 1]) add(g, new THREE.CapsuleGeometry(0.2, 0.25, 8, 16), body, [s * 0.5, -0.22, 0], [0, 0, s * 0.5]);
    const dpad = k.mat(k.cat, { r: 0.4 });
    add(g, new THREE.BoxGeometry(0.22, 0.07, 0.07), dpad, [-0.42, 0.02, 0.28]);
    add(g, new THREE.BoxGeometry(0.07, 0.22, 0.07), dpad, [-0.42, 0.02, 0.28]);
    const btn = [0xd64541, 0x5fa34a, 0x5b8def, 0xe6b450].map((c, i) => {
      const m = k.mat(c, { glow: c, gi: 0.2, anim: true });
      const [x, y] = [[0.5, 0.12], [0.62, 0.02], [0.38, 0.02], [0.5, -0.1]][i];
      add(g, new THREE.SphereGeometry(0.05, 12, 10), m, [x, y, 0.27]);
      return m;
    });
    return { group: g, flat: true, tick(t) { btn.forEach((m, i) => (m.emissiveIntensity = Math.floor(t / 400) % 4 === i ? 1 : 0.15)); } };
  },

  dna(k) {
    const g = new THREE.Group();
    const A = [], B = [];
    for (let i = 0; i <= 16; i++) {
      const a = i * 0.42, y = -0.8 + i * 0.1;
      A.push(V(Math.cos(a) * 0.35, y, Math.sin(a) * 0.35));
      B.push(V(Math.cos(a + Math.PI) * 0.35, y, Math.sin(a + Math.PI) * 0.35));
    }
    add(g, new THREE.TubeGeometry(new THREE.CatmullRomCurve3(A), 120, 0.05, 8), k.mat(k.cat, { r: 0.3, m: 0.2 }));
    add(g, new THREE.TubeGeometry(new THREE.CatmullRomCurve3(B), 120, 0.05, 8), k.mat(0x7fa6c4, { r: 0.3, m: 0.2 }));
    const bases = [0xd9534f, 0x5fa34a, 0xe6b450, 0x5b8def].map((c) => k.mat(c, { r: 0.4 }));
    for (let i = 1; i < 16; i++) rod(g, A[i], B[i], 0.022, bases[i % 4], 6);
    return { group: g };
  },
};

export const SYMBOL_NAMES = Object.keys(BUILDERS);

// Build a node's symbol. Returns the object (normalized to ~unit radius and
// centered), the materials to light up on hover, and a per-frame tick.
export function buildSymbol(node, catHex) {
  const cat = new THREE.Color(catHex);
  const highlight = [];
  const kit = {
    cat,
    mat(color, o = {}) {
      const m = new THREE.MeshStandardMaterial({
        color: color instanceof THREE.Color ? color.clone() : new THREE.Color(color),
        roughness: o.r ?? 0.4,
        metalness: o.m ?? 0.05,
        emissive: new THREE.Color(o.glow ?? 0x000000),
        emissiveIntensity: o.gi ?? 0,
        transparent: o.opacity != null,
        opacity: o.opacity ?? 1,
        side: o.side ?? THREE.FrontSide,
        flatShading: !!o.flat,
      });
      m.userData.e0 = m.emissive.clone();
      m.userData.ei0 = m.emissiveIntensity;
      if (!o.anim) highlight.push(m);
      return m;
    },
  };
  const name = symbolFor(node);
  const built = BUILDERS[name](kit);

  // normalize: center the symbol and scale its bounding sphere to radius 1
  const inner = new THREE.Group();
  inner.add(built.group);
  const sphere = new THREE.Box3().setFromObject(built.group).getBoundingSphere(new THREE.Sphere());
  built.group.position.sub(sphere.center);
  inner.scale.setScalar(1 / (sphere.radius || 1));

  return { name, object: inner, flat: !!built.flat, tick: built.tick || null, highlight };
}

// Light every non-animated material up in the category color (or restore).
export function setHighlight(highlight, color, amount) {
  for (const m of highlight) {
    if (amount > 0) { m.emissive.copy(color); m.emissiveIntensity = Math.max(m.userData.ei0, amount); }
    else { m.emissive.copy(m.userData.e0); m.emissiveIntensity = m.userData.ei0; }
  }
}

// Free every geometry and material under an object.
export function disposeTree(obj) {
  obj.traverse((o) => {
    if (o.geometry) o.geometry.dispose();
    if (o.material) (Array.isArray(o.material) ? o.material : [o.material]).forEach((m) => m.dispose());
  });
}
