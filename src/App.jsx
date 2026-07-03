import { useCallback, useEffect, useState } from "react";
import { CONSOLE_GREETING } from "./data.js";
import { AppProvider, useApp } from "./store.jsx";
import { palette, MONO } from "./theme.js";
import { ConstellationBackground } from "./graph.jsx";
import { Nav, PersonaPicker, GuidedPath } from "./nav.jsx";
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
`;

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
