import { useCallback, useEffect, useRef, useState } from "react";
import { CONSOLE_GREETING } from "./data.js";
import { AppProvider, useApp } from "./store.jsx";
import { palette, MONO } from "./theme.js";
import { ConstellationBackground } from "./graph.jsx";
import { Nav, PersonaPicker, GuidedPath, NextStop } from "./nav.jsx";
import { CommandPalette } from "./palette.jsx";
import { AchievementToasts, AchievementsPanel, useKonami } from "./meta.jsx";
import {
  HomePage, AboutPage, WorkPage, CommunityPage, ProjectsPage, ArcadePage, RangersPage,
  WellnessPage, BlogPage, ContactPage, CareersPage, ResumePage,
} from "./pages.jsx";

const PAGE_COMPONENTS = {
  Home: HomePage,
  About: AboutPage,
  Work: WorkPage,
  Community: CommunityPage,
  Projects: ProjectsPage,
  Arcade: ArcadePage,
  Rangers: RangersPage,
  Wellness: WellnessPage,
  Blog: BlogPage,
  Contact: ContactPage,
  Careers: CareersPage,
  Resume: ResumePage,
};

const GLOBAL_CSS = `
@import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,wght@0,400;0,500;0,600;0,700;1,400&display=swap');
* { box-sizing: border-box; margin: 0; padding: 0; }
body { margin: 0; }
::selection { background: rgba(196,144,96,0.3); }
::-webkit-scrollbar { width: 10px; height: 10px; }
::-webkit-scrollbar-thumb { background: rgba(196,144,96,0.35); border-radius: 6px; }
.desktop-nav { display: flex !important; }
.mobile-nav, .mobile-dropdown { display: none !important; }
@media (max-width: 940px) {
  .desktop-nav { display: none !important; }
  .mobile-nav { display: flex !important; }
  .mobile-dropdown { display: flex !important; }
}
@keyframes floatIn { from { opacity: 0; transform: translateY(14px); } to { opacity: 1; transform: translateY(0); } }
.page-enter { animation: floatIn 0.45s cubic-bezier(.2,.9,.3,1); }

/* wayfinding animations */
html.reveal-ready [data-reveal]:not(.revealed) { opacity: 0; }
[data-reveal].revealed { animation: revealUp 0.6s cubic-bezier(.2,.9,.3,1) both; }
@keyframes revealUp { from { opacity: 0; translate: 0 22px; } to { opacity: 1; translate: 0 0; } }
@keyframes nudgeX { 0%,100% { translate: 0 0; } 50% { translate: 6px 0; } }
.nudge-x { display: inline-block; animation: nudgeX 1.4s ease-in-out infinite; }
@keyframes nudgePulse { 0%,100% { box-shadow: 0 0 0 0 rgba(139,157,119,0.6); } 50% { box-shadow: 0 0 0 6px rgba(139,157,119,0); } }
.nudge-pulse { animation: nudgePulse 1.8s ease-in-out infinite; }
@keyframes bounceY { 0%,100% { translate: 0 0; } 50% { translate: 0 7px; } }
.bounce-y { display: inline-block; animation: bounceY 1.5s ease-in-out infinite; }
.next-stop { transition: background 0.25s ease, border-color 0.25s ease, transform 0.25s ease; }
.next-stop:hover { background: rgba(196,144,96,0.14) !important; border-color: #C49060 !important; transform: translateY(-2px); }
.scroll-progress { position: fixed; top: 0; left: 0; right: 0; height: 3px; z-index: 1000; transform-origin: 0 50%; transform: scaleX(0); background: linear-gradient(90deg, #8B9D77, #C49060, #E0A970); pointer-events: none; }
@media (prefers-reduced-motion: reduce) {
  [data-reveal].revealed, .nudge-x, .nudge-pulse, .bounce-y { animation: none !important; }
  html.reveal-ready [data-reveal]:not(.revealed) { opacity: 1; }
}
`;

// Thin bar across the top showing how far down the page you are.
function ScrollProgress() {
  const ref = useRef(null);
  useEffect(() => {
    const onScroll = () => {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      if (ref.current) ref.current.style.transform = `scaleX(${max > 0 ? window.scrollY / max : 0})`;
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => { window.removeEventListener("scroll", onScroll); window.removeEventListener("resize", onScroll); };
  }, []);
  return <div ref={ref} className="scroll-progress" />;
}

// Cards and headers marked data-reveal rise into view as you scroll to them.
// Hiding only kicks in once this runs (html.reveal-ready), so content never
// stays invisible if JS or IntersectionObserver is unavailable.
function useScrollReveal() {
  useEffect(() => {
    if (typeof IntersectionObserver === "undefined") return;
    document.documentElement.classList.add("reveal-ready");
    const io = new IntersectionObserver((entries) => {
      entries.filter((e) => e.isIntersecting).forEach((e, i) => {
        e.target.style.animationDelay = `${Math.min(i, 6) * 70}ms`;
        e.target.classList.add("revealed");
        io.unobserve(e.target);
      });
    }, { rootMargin: "0px 0px -8% 0px" });
    const scan = () => document.querySelectorAll("[data-reveal]:not(.revealed)").forEach((el) => io.observe(el));
    scan();
    const mo = new MutationObserver(scan);
    mo.observe(document.body, { childList: true, subtree: true });
    return () => { io.disconnect(); mo.disconnect(); document.documentElement.classList.remove("reveal-ready"); };
  }, []);
}

function Shell() {
  const { dark, visit, unlock, persona } = useApp();
  const p = palette(dark);
  const [page, setPageRaw] = useState("Home");
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [trophiesOpen, setTrophiesOpen] = useState(false);
  const [personaOpen, setPersonaOpen] = useState(false);

  const setPage = useCallback(
    (pg) => {
      setPageRaw(pg);
      visit(pg);
      window.scrollTo({ top: 0, behavior: "smooth" });
    },
    [visit]
  );

  useKonami(() => unlock("konami"));
  useScrollReveal();

  // First visit → offer persona picker once.
  useEffect(() => {
    if (persona === null) {
      const t = setTimeout(() => setPersonaOpen(true), 1200);
      return () => clearTimeout(t);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Hidden console greeting → sourcerer achievement.
  useEffect(() => {
    const parts = CONSOLE_GREETING.split("%c").filter(Boolean);
    console.log(
      "%c" + parts.join("%c"),
      "color:#C49060;font-family:monospace;font-size:13px;font-weight:bold",
      "color:#8B9D77;font-family:monospace;font-size:12px"
    );
    window.solkadhi = () => {
      unlock("sourcerer");
      unlock("solkadhi");
      return "🍜 hospitality unlocked — see you around, curious one.";
    };
    window.help = () => {
      unlock("sourcerer");
      return "You found it. Run solkadhi() for a treat, or open the site's command palette with ⌘K.";
    };
    return () => {
      delete window.solkadhi;
      delete window.help;
    };
  }, [unlock]);

  const PageComp = PAGE_COMPONENTS[page] || HomePage;

  return (
    <div style={{ minHeight: "100vh", background: p.bg, color: p.fg, fontFamily: "'DM Sans', sans-serif", transition: "background 0.4s ease, color 0.4s ease", position: "relative" }}>
      <style>{GLOBAL_CSS}</style>
      <ScrollProgress />
      <ConstellationBackground dark={dark} />

      <Nav
        page={page}
        setPage={setPage}
        onOpenPalette={() => setPaletteOpen(true)}
        onOpenTrophies={() => setTrophiesOpen(true)}
        onOpenPersona={() => setPersonaOpen(true)}
      />

      <GuidedPath page={page} setPage={setPage} />

      <div key={page} className="page-enter">
        <PageComp dark={dark} setPage={setPage} />
      </div>

      <NextStop page={page} setPage={setPage} />

      <footer style={{ textAlign: "center", padding: "32px 24px", position: "relative", zIndex: 1, borderTop: "1px solid " + p.borderSoft }}>
        <p style={{ fontFamily: MONO, fontSize: 12, color: p.faint }}>
          © 2026 amit.sh · built with care, caffeine, and an unreasonable number of terminal prompts · press ⌘K
        </p>
      </footer>

      <CommandPalette
        open={paletteOpen}
        setOpen={setPaletteOpen}
        setPage={setPage}
        onOpenTrophies={() => setTrophiesOpen(true)}
      />
      <AchievementsPanel open={trophiesOpen} onClose={() => setTrophiesOpen(false)} />
      <PersonaPicker open={personaOpen} onClose={() => setPersonaOpen(false)} />
      <AchievementToasts />
    </div>
  );
}

export default function App() {
  return (
    <AppProvider>
      <Shell />
    </AppProvider>
  );
}
