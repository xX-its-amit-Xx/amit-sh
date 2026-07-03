import { createContext, useContext, useEffect, useMemo, useRef, useState, useCallback } from "react";
import { ACHIEVEMENTS, PAGES } from "./data.js";

// ── Persistence helpers ───────────────────────────────────────────────────────
const KEY = "amitsh.v1";
function load() {
  try {
    return JSON.parse(localStorage.getItem(KEY)) || {};
  } catch {
    return {};
  }
}
function save(state) {
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
  } catch {
    /* storage disabled — run in-memory */
  }
}

const AppCtx = createContext(null);
export function useApp() {
  return useContext(AppCtx);
}

export function AppProvider({ children }) {
  const [persisted] = useState(load);

  const [dark, setDarkRaw] = useState(persisted.dark ?? false);
  const [persona, setPersonaRaw] = useState(persisted.persona ?? null);
  const [visited, setVisited] = useState(() => new Set(persisted.visited || ["Home"]));
  const [unlocked, setUnlocked] = useState(() => new Set(persisted.unlocked || []));
  const [toasts, setToasts] = useState([]); // {id, ach}

  const toastSeq = useRef(0);
  // Mirror of `unlocked` used to guard unlock() idempotently OUTSIDE any state
  // updater — so StrictMode's double-invoked updaters can't fire a toast twice.
  const unlockedRef = useRef(unlocked);

  // Persist whenever core state changes.
  useEffect(() => {
    save({
      dark,
      persona,
      visited: [...visited],
      unlocked: [...unlocked],
    });
  }, [dark, persona, visited, unlocked]);

  // ── Achievement engine ──────────────────────────────────────────────────────
  const unlock = useCallback((id) => {
    const ach = ACHIEVEMENTS.find((a) => a.id === id);
    if (!ach) return;
    // Idempotent guard using the ref (runs once per id, even if unlock() is
    // called multiple times or effects double-fire under StrictMode).
    if (unlockedRef.current.has(id)) return;
    const next = new Set(unlockedRef.current);
    next.add(id);
    unlockedRef.current = next;
    setUnlocked(next);
    // Toast — a plain functional update, safely outside any other updater.
    toastSeq.current += 1;
    const tid = toastSeq.current;
    setToasts((t) => [...t, { id: tid, ach }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== tid)), 4600);
  }, []);

  const setDark = useCallback(
    (v) => {
      setDarkRaw(v);
      if (v) unlock("darkmode");
    },
    [unlock]
  );

  const setPersona = useCallback(
    (p) => {
      setPersonaRaw(p);
      if (p) unlock("persona");
    },
    [unlock]
  );

  // Track page visits → cartographer / completionist achievements.
  const visit = useCallback(
    (page) => {
      setVisited((prev) => {
        if (prev.has(page)) return prev;
        const next = new Set(prev);
        next.add(page);
        return next;
      });
    },
    []
  );

  useEffect(() => {
    unlock("boot");
  }, [unlock]);

  useEffect(() => {
    if (visited.size >= 6) unlock("explorer");
    if (visited.size >= PAGES.length) unlock("completionist");
  }, [visited, unlock]);

  const value = useMemo(
    () => ({
      dark, setDark,
      persona, setPersona,
      visited, visit,
      unlocked, unlock,
      toasts,
      progress: {
        visited: visited.size,
        pages: PAGES.length,
        achievements: unlocked.size,
        totalAchievements: ACHIEVEMENTS.length,
      },
    }),
    [dark, setDark, persona, setPersona, visited, visit, unlocked, unlock, toasts]
  );

  return <AppCtx.Provider value={value}>{children}</AppCtx.Provider>;
}
