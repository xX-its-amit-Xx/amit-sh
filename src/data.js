import generatedGraph from "./generated/graph.json";

// ============================================================================
//  amit.sh — SINGLE SOURCE OF TRUTH
//  Everything on the site reads from this file. To update the website, edit
//  the data below — you almost never need to touch the components.
//  See INTEGRATION.md for how to pipe Notion / Substack / GitHub in here.
// ============================================================================

export const PROFILE = {
  name: "Amit Shenoy",
  handle: "amit.sh",
  tagline:
    "I believe that we're here to take care of each other and learn together. Let's work together to help people live better.",
  blurb:
    "Data scientist by day. Community builder by slightly later in the day. Konkani kid from Mangalore who ended up building ML pipelines and accidentally reviving student government committees.",
  motd: 'cat /etc/motd — "Welcome. Grab some sol kadhi and stay awhile."',
  email: "ashenoycompany@gmail.com",
  phone: "508-864-5532",
  phoneHref: "tel:5088645532",
  linkedin: "https://www.linkedin.com/in/itsamit",
  github: "https://github.com/xX-its-amit-Xx",
  calendly: "https://calendly.com/app/scheduling/meeting_types/user/me",
  resumePdf: "Amit_Shenoy_Resume.pdf",
  headshot: "Profile_Picture.png",
  degree: "B.S. Bioengineering — Northeastern University (Dec 2025)",
  standing: "GPA: 3.91 · Honors · Exploring PhD & Fellowship opportunities · open to post-grad roles April 2027",
};

// Nav order + icons. `persona` weights control persona-aware sorting (see PERSONAS).
export const PAGES = [
  { id: "Home", icon: "\u{1F3E0}" },
  { id: "About", icon: "\u{1F464}" },
  { id: "Work", icon: "\u{1F52C}" },
  { id: "Community", icon: "\u{1F331}" },
  { id: "Projects", icon: "\u{1F6E0}" },
  { id: "Arcade", icon: "\u{1F3AE}" },
  { id: "Rangers", icon: "\u{1F3D4}" },
  { id: "Wellness", icon: "\u{1F4AA}" },
  { id: "Blog", icon: "\u{270D}️" },
  { id: "Contact", icon: "\u{1F4E1}" },
  { id: "Careers", icon: "\u{1F393}" },
  { id: "Resume", icon: "\u{1F4C4}" },
];

// ── Personas ────────────────────────────────────────────────────────────────
// The site tailors itself to who's visiting. Each persona highlights a path
// through the site and reorders the nav so the most relevant stops come first.
export const PERSONAS = {
  explorer: {
    id: "explorer",
    label: "Just exploring",
    icon: "\u{1F9ED}",
    blurb: "No agenda. Here's the scenic route.",
    greeting: "Wander freely. The knowledge graph below is the best map.",
    path: ["Home", "About", "Work", "Community", "Projects", "Arcade", "Rangers"],
  },
  student: {
    id: "student",
    label: "Student / junior",
    icon: "\u{1F393}",
    blurb: "Here to learn how to break in.",
    greeting:
      "Start with Careers for free resume templates, then Blog and Community to see how the sausage gets made.",
    path: ["Careers", "Blog", "Community", "About", "Work"],
  },
  peer: {
    id: "peer",
    label: "Peer / collaborator",
    icon: "\u{1F91D}",
    blurb: "Let's build something.",
    greeting:
      "Projects and the knowledge graph show what I'm hacking on. Rangers is where we go when the code compiles.",
    path: ["Projects", "Arcade", "Work", "Community", "Rangers", "Contact"],
  },
  senior: {
    id: "senior",
    label: "Recruiter / senior",
    icon: "\u{1F50E}",
    blurb: "Here to check the work.",
    greeting:
      "Straight to it: Work and Research, the Resume, and Projects for depth. Contact when you're ready.",
    path: ["Work", "Resume", "Projects", "About", "Contact"],
  },
};

// ── Work / Research ──────────────────────────────────────────────────────────
export const WORK = [
  {
    id: "ucb",
    title: "Data Science Co-op — Targeted Protein Degradation",
    org: "UCB Biosciences, Cambridge, MA",
    time: "Jan 2025 – Present",
    note: "The one where I build models to tell proteins they're fired.",
    bullets: [
      "Designed 100+ multimodal ML models (SP/CRC data) informing assay selection and OOD risk assessment.",
      "Built modular pipelines enabling 3–5× faster A/B testing of molecular embeddings (GROVER, ESM-C).",
      "Developed UMAP/SHAP visualizations and stakeholder-ready summaries for computational and experimental teams.",
      "Delivered ML models filtering large HTS libraries to <1% high-confidence candidates.",
    ],
    tags: ["Cheminformatics", "ML", "SHAP", "UMAP", "Hit Triage"],
  },
  {
    id: "combine",
    title: "Undergraduate Researcher — Computational Biochemistry",
    org: "COMBINE Lab (Prof. Minkara), Northeastern",
    time: "May 2023 – Present",
    note: "Where I dock molecules and occasionally dock my ego at the door.",
    bullets: [
      "Modeled MBL–glycan recognition mechanisms with docking + MM-GBSA.",
      "Built version-controlled Python/BASH pipelines reducing manual effort by >80%.",
      "Presented findings 15+ times at AAAS, MBN, BSCP. Contributing to two manuscripts.",
    ],
    tags: ["Biophysics", "Docking", "MM-GBSA"],
  },
  {
    id: "arbor",
    title: "AAV Gene Therapy Co-op — Upstream Optimization",
    org: "Arbor Biotechnologies, Cambridge, MA",
    time: "Jan 2024 – Jun 2024",
    note: "Where I learned that sometimes the breakthrough is just better lysis conditions.",
    bullets: [
      "Led DOE-driven optimization yielding >50% increase in adherent AAV harvest.",
      "Proposed and validated a suspension-based workflow achieving >250% productivity gain.",
    ],
    tags: ["AAV", "Bench Platform", "DOE"],
  },
];

// ── Community / Leadership ────────────────────────────────────────────────────
export const COMMUNITY = [
  {
    id: "sustain-committee",
    title: "Co-Chair — University-Wide Sustainability Committee",
    icon: "leaf",
    note: "Tripled the membership, which meant tripling the email threads. Worth it.",
    desc: "United all sustainability orgs under shared branding, initiated cross-group collaborations, contributed to the Plastics Reduction Campaign (and pushed it to launch a semester early). Created a student sustainability swipe file — because the hardest part of activism shouldn't be figuring out where to start.",
    tags: ["Sustainability", "Leadership"],
  },
  {
    id: "gnu",
    title: "GNU@NU Computing Community — Founder",
    icon: "code",
    note: "My pitch: 'What if AI deployment was safe? Hear me out.'",
    desc: "Founded GNU@NU to educate and advocate for Free and Open Source Software. Attended LibrePlanet two years running and presented on what students can actually do to push for free software in their communities. FOSS isn't a niche concern — it's infrastructure for trustworthy AI.",
    tags: ["FOSS", "Free Software", "AI Safety"],
  },
  {
    id: "a4c",
    title: "Ambassadors for Change (A4C) — Founder",
    icon: "signal",
    note: "Started because I noticed the people being talked about weren't the ones talking.",
    desc: "Founded A4C to advocate for the disabled community on campus. Published a mini documentary and case studies drawn from interviews with community members on inclusion and marginalization.",
    tags: ["Accessibility", "Disability Advocacy"],
  },
  {
    id: "sga-sustain",
    title: "Student Government Sustainability Committee",
    icon: "leaf",
    note: "Freshman year energy: 'Why is this committee dead? I'll fix it.'",
    desc: "Revived the dormant committee, grew membership, and launched several campus sustainability initiatives.",
    tags: ["Student Government"],
  },
  {
    id: "dining",
    title: "Dining Advisory Board",
    icon: "chef",
    note: "Pitched a better meal plan. They said yes. Still my best ROI.",
    desc: "Pitched a more flexible and affordable semesterly meal plan structure alongside fellow board members — which was adopted by the Northeastern dining team.",
    tags: ["Student Advocacy"],
  },
  {
    id: "coved",
    title: "CovEd — Volunteer Educator",
    icon: "code",
    note: "Turns out the best way to learn something is to teach it to someone else.",
    desc: "Volunteering with CovEd, a student-founded nonprofit pairing mentors with K–12 students for free educational support — helping bridge learning gaps with one-on-one mentorship.",
    tags: ["Education", "Mentorship", "Volunteering"],
  },
  {
    id: "jumpstart",
    title: "Jumpstart — Volunteer",
    icon: "leaf",
    note: "Little kids, big energy, bigger crayon ambitions.",
    desc: "Volunteering with Jumpstart, serving preschool children in under-resourced communities to promote early literacy and school readiness through structured play and reading.",
    tags: ["Early Education", "Literacy", "Volunteering"],
  },
];

// ── Writing (Woof Magazine + elsewhere) ──────────────────────────────────────
export const WRITING = [
  {
    id: "woof-coops",
    title: "I Spent Over 5 Hours Per Week Applying to Co-ops as a First-Time Searcher. Here's What I Learned.",
    outlet: "Woof Magazine",
    year: "2023",
    blurb: "Hard-won tactics from a first co-op search — where the hours actually go, and how to spend them better.",
    url: "https://woof-mag.com/2023/12/11/i-spent-over-5-hours-per-week-applying-to-co-ops-as-a-first-time-searcher-heres-what-i-learned/",
  },
  {
    id: "woof-second-brain",
    title: "Your Second Brain is in your Pocket. Use it!",
    outlet: "Woof Magazine",
    year: "2023",
    blurb: "On building a personal knowledge system before it was a buzzword — capture, connect, recall.",
    url: "https://woof-mag.com/2023/05/04/your-second-brain-is-in-your-pocket-use-it/",
  },
];

// ── Projects ───────────────────────────────────────────────────────────────
// Every project (and auto-fetched repo) is tagged with a `category` subsection
// and a `type`. The Projects page filters by these.
export const PROJECT_CATEGORIES = [
  { id: "bioinformatics", label: "Bioinformatics", icon: "molecule" },
  { id: "cheminformatics", label: "Cheminformatics", icon: "molecule" },
  { id: "wetlab", label: "Wet Lab", icon: "chef" },
  { id: "engineering", label: "Engineering / Cornerstone", icon: "code" },
];
export const PROJECT_TYPES = [
  { id: "research", label: "Research" },
  { id: "class", label: "Class" },
  { id: "repo", label: "GitHub" },
  { id: "hackathon", label: "Hackathon" },
  { id: "product", label: "Product" },
];

export const PROJECTS = [
  {
    id: "ares",
    title: "ARES — Focused Screening Library Generator",
    note: "For when you have 500,000 compounds and only 200 slots on a plate.",
    desc: "Built clustering + diversity modules reducing chemist iteration time by ~40% and enabling rapid pilot-screen triage.",
    tags: ["Cheminformatics", "Clustering", "Drug Discovery"],
    category: "cheminformatics",
    type: "research",
    link: null,
  },
  {
    id: "orbit",
    title: "Orbit Swap",
    note: "The shift-swap app nobody asked for but everyone apparently needed.",
    desc: "A scheduling and shift-swap app currently in beta.",
    tags: ["Mobile App", "React Native", "Beta"],
    category: "engineering",
    type: "product",
    link: "https://xx-its-amit-xx.github.io/orbit_swap_privacy_policy/index.html",
    linkLabel: "→ beta_signup.sh",
  },
  {
    id: "saliva",
    title: "Point-of-Care Saliva Diagnostics",
    note: "Capstone project. Yes, saliva. Yes, we're past it.",
    desc: "Built an OpenCV + SVM LFA quantification pipeline; deployed a Dockerized ML backend + Expo app to AWS.",
    tags: ["Computer Vision", "AWS", "Docker"],
    category: "engineering",
    type: "class",
    link: null,
  },
];

// Heuristic classifier for auto-fetched GitHub repos → a project category.
export function classifyRepo(repo) {
  const s = ((repo.name || "") + " " + (repo.description || "") + " " + (repo.language || "") + " " + (repo.topics || []).join(" ")).toLowerCase();
  const has = (...w) => w.some((x) => s.includes(x));
  if (has("chem", "molecul", "ligand", "dock", "admet", "pxr", "drug", "hit ", "screening", "smiles", "rdkit")) return "cheminformatics";
  if (has("rna", "seq", "omics", "atac", "scrna", "genom", "phylo", "variant", "single-cell", "nextflow", "anndata", "proteom", "onco", "bioinform", "bayesbio", "scp", "cell")) return "bioinformatics";
  if (has("aav", "assay", "pcr", "lysis", "wetlab", "bench")) return "wetlab";
  return "engineering";
}

export const SKILLS_SHORT = ["Python", "PyTorch", "R", "SQL", "Docker", "AWS", "Git", "SHAP", "UMAP", "C++", "React"];
export const SKILLS_FULL = [
  "Python", "PyTorch", "TensorFlow", "scikit-learn", "R", "SQL", "C++", "BASH", "Java",
  "TypeScript", "React", "Node.js", "SHAP", "UMAP", "Markov Chains", "AWS", "Azure",
  "Docker", "Git", "CI/CD", "SLURM", "PyMOL", "VMD", "AAV production", "ddPCR", "qPCR", "DOE",
];

// ── Gallery: conferences & talks ─────────────────────────────────────────────
// Drop entries here as photos arrive (SSC, SSLS, AAAS, etc). Put image files in
// /public and reference them by filename. Renders a gallery when non-empty.
export const GALLERY = [
  // { id: "sslc-2025", title: "SSLS Conference", caption: "Poster session.", img: "gallery/ssls_2025.jpg", year: "2025" },
];

// ── Game dev / Arcade ────────────────────────────────────────────────────────
export const GAMEDEV = {
  site: "https://justanotherstudies.dev",
  siteEmbed: "https://justanotherstudies.dev",
  blurb: "My game-dev hobby lab — experiments in mechanics, pixel art, and finishing things.",
  orbitInstagram: null, // Orbit Swap IG — coming soon
};

// ── Knowledge Graph ──────────────────────────────────────────────────────────
// This is the heart of the site — Amit's world as a connected graph.
// Categories drive color. `page` links a node to a section. Add nodes/edges
// freely; the layout self-organizes with a force simulation.
// GRAPH_DEFAULT is the hand-written version; if an Obsidian vault has been wired
// up (see INTEGRATION.md §4), the generated graph takes over automatically.
const GRAPH_DEFAULT = {
  categories: {
    self:      { label: "me",        color: "#C49060" },
    research:  { label: "research",  color: "#8B9D77" },
    project:   { label: "projects",  color: "#7FA6C4" },
    community: { label: "community", color: "#C4907F" },
    skill:     { label: "skills",    color: "#B79FC4" },
    value:     { label: "values",    color: "#D4A574" },
    life:      { label: "life",      color: "#9FC4A8" },
  },
  nodes: [
    { id: "me", label: "Amit", cat: "self", page: "About", size: 3, blurb: "Bioengineer, data scientist, community builder." },

    // research
    { id: "ucb", label: "UCB Biosciences", cat: "research", page: "Work", size: 2, blurb: "ML for targeted protein degradation." },
    { id: "combine", label: "COMBINE Lab", cat: "research", page: "Work", size: 2, blurb: "Computational biochemistry & docking." },
    { id: "arbor", label: "Arbor Bio", cat: "research", page: "Work", size: 1.6, blurb: "AAV upstream process optimization." },
    { id: "cheminfo", label: "Cheminformatics", cat: "research", page: "Work", size: 1.6, blurb: "Molecules in, insights out." },
    { id: "biophysics", label: "Biophysics", cat: "research", page: "Work", size: 1.4, blurb: "MM-GBSA, docking, free energy." },

    // projects
    { id: "ares", label: "ARES", cat: "project", page: "Projects", size: 1.6, blurb: "Focused screening library generator." },
    { id: "orbit", label: "Orbit Swap", cat: "project", page: "Projects", size: 1.4, blurb: "Shift-swap app in beta." },
    { id: "saliva", label: "Saliva Dx", cat: "project", page: "Projects", size: 1.4, blurb: "Point-of-care diagnostics + CV." },

    // skills
    { id: "ml", label: "ML", cat: "skill", page: "Resume", size: 2, blurb: "The through-line of everything." },
    { id: "python", label: "Python", cat: "skill", page: "Resume", size: 1.6, blurb: "First language of choice." },
    { id: "viz", label: "SHAP / UMAP", cat: "skill", page: "Resume", size: 1.4, blurb: "Making models legible." },
    { id: "cloud", label: "Docker / AWS", cat: "skill", page: "Resume", size: 1.3, blurb: "Ship it reproducibly." },

    // community
    { id: "sustain", label: "Sustainability", cat: "community", page: "Community", size: 1.8, blurb: "Co-chaired the university committee." },
    { id: "foss", label: "FOSS", cat: "community", page: "Community", size: 1.7, blurb: "Founded GNU@NU. Free software = trustworthy AI." },
    { id: "a4c", label: "A4C", cat: "community", page: "Community", size: 1.4, blurb: "Accessibility & disability advocacy." },
    { id: "aisafety", label: "AI Safety", cat: "community", page: "Community", size: 1.3, blurb: "Where FOSS and ML meet." },

    // values
    { id: "feeding", label: "Feeding people", cat: "value", page: "Wellness", size: 1.6, blurb: "The baseline unit of caring." },
    { id: "learning", label: "Learning together", cat: "value", page: "Blog", size: 1.5, blurb: "Why this site teaches, too." },

    // life
    { id: "rangers", label: "Rooftop Rangers", cat: "life", page: "Rangers", size: 1.4, blurb: "Summit decisions, questionable." },
    { id: "lifting", label: "Lifting", cat: "life", page: "Wellness", size: 1.3, blurb: "Progressive overload, tracked obsessively." },
    { id: "cooking", label: "Cooking", cat: "life", page: "Wellness", size: 1.4, blurb: "Konkani food is home." },
    { id: "konkani", label: "Mangalore", cat: "life", page: "About", size: 1.3, blurb: "Konkani kid, improbably from Massachusetts." },
    { id: "writing", label: "Blog", cat: "value", page: "Blog", size: 1.3, blurb: "Thoughts on research, FOSS, and gradient descent." },
  ],
  edges: [
    ["me", "ucb"], ["me", "combine"], ["me", "sustain"], ["me", "foss"],
    ["me", "ml"], ["me", "feeding"], ["me", "konkani"], ["me", "learning"],
    ["ucb", "cheminfo"], ["ucb", "ml"], ["combine", "biophysics"], ["combine", "cheminfo"],
    ["arbor", "biophysics"], ["me", "arbor"],
    ["cheminfo", "ares"], ["ares", "ml"], ["ml", "python"], ["ml", "viz"], ["ml", "cloud"],
    ["me", "orbit"], ["me", "saliva"], ["saliva", "ml"], ["saliva", "cloud"],
    ["foss", "aisafety"], ["aisafety", "ml"], ["sustain", "a4c"], ["me", "a4c"],
    ["feeding", "cooking"], ["cooking", "konkani"], ["me", "lifting"], ["me", "rangers"],
    ["feeding", "sustain"], ["learning", "writing"], ["me", "writing"], ["lifting", "feeding"],
    ["python", "cheminfo"],
  ],
};

// Prefer the generated (Obsidian-sourced) graph when it exists; else the default.
export const GRAPH =
  generatedGraph && Array.isArray(generatedGraph.nodes) && generatedGraph.nodes.length
    ? {
        categories: generatedGraph.categories || GRAPH_DEFAULT.categories,
        nodes: generatedGraph.nodes,
        edges: generatedGraph.edges || [],
      }
    : GRAPH_DEFAULT;

export const GRAPH_SOURCE =
  generatedGraph && Array.isArray(generatedGraph.nodes) && generatedGraph.nodes.length ? "obsidian" : "curated";

// ── Meta-game: Achievements ───────────────────────────────────────────────────
// Unlocked via the engine in store.jsx. `secret: true` ones are hidden until found.
export const ACHIEVEMENTS = [
  { id: "boot", icon: "\u{1F680}", title: "Cold Boot", desc: "You arrived. Welcome to amit.sh." },
  { id: "explorer", icon: "\u{1F5FA}️", title: "Cartographer", desc: "Visit 6 different pages." },
  { id: "completionist", icon: "\u{1F3C6}", title: "Full Sweep", desc: "Visit every page on the site." },
  { id: "graphling", icon: "\u{1F578}️", title: "Graph Theorist", desc: "Explore a node in the knowledge graph." },
  { id: "pathfinder", icon: "\u{1F517}", title: "Pathfinder", desc: "Win a round of NODE.LINK." },
  { id: "docked", icon: "\u{1F9EC}", title: "Perfect Dock", desc: "Land a molecule in the binding pocket." },
  { id: "persona", icon: "\u{1F3AD}", title: "Know Thyself", desc: "Tell the site who you are." },
  { id: "terminal", icon: "\u{2328}️", title: "Root Access", desc: "Open the command palette (⌘K / Ctrl-K)." },
  { id: "darkmode", icon: "\u{1F319}", title: "Night Owl", desc: "Flip the lights off." },
  { id: "konami", icon: "\u{1F47E}", title: "The Old Ways", desc: "↑↑↓↓←→←→ B A", secret: true },
  { id: "sprite", icon: "\u{1F9CD}", title: "Poke the Sprite", desc: "Click the pixel avatar 7 times.", secret: true },
  { id: "solkadhi", icon: "\u{1F35B}", title: "Sol Kadhi", desc: "Run a certain hospitable command.", secret: true },
  { id: "sourcerer", icon: "\u{1F4DC}", title: "Sourcerer", desc: "Find the message in the source.", secret: true },
];

// A tiny greeting hidden in the HTML/console for the Sourcerer achievement.
export const CONSOLE_GREETING =
  "%c> amit.sh — you found the console.\n%cType help() for a secret. Or run `solkadhi` in the command palette (⌘K). Curious people get along with me.";
