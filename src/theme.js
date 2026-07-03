// Design tokens. One function → the full palette for a given mode.
// Amplified version of the original warm-tan terminal theme.
export function palette(dark) {
  return {
    bg: dark ? "#1E1C19" : "#FFFAF4",
    bgElevated: dark ? "#26231F" : "#FFFFFF",
    bgTerminal: dark ? "#0D0C0A" : "#1E1C19",
    fg: dark ? "#F5E6D3" : "#2D2926",
    muted: dark ? "#9E958A" : "#8A7E72",
    soft: dark ? "#BEB5AA" : "#5A4E42",
    faint: dark ? "#6B5E52" : "#BEB5AA",

    accent: "#C49060",
    accentBright: dark ? "#E0A970" : "#C49060",
    green: "#8B9D77",
    sand: "#D4A574",

    card: dark ? "rgba(255,255,255,0.03)" : "rgba(255,255,255,0.7)",
    cardHover: dark ? "rgba(255,255,255,0.055)" : "rgba(255,255,255,0.92)",
    border: dark ? "rgba(196,144,96,0.14)" : "rgba(196,144,96,0.12)",
    borderSoft: dark ? "rgba(196,144,96,0.1)" : "rgba(196,144,96,0.08)",

    glow: dark ? "rgba(196,144,96,0.28)" : "rgba(196,144,96,0.22)",
    shadow: dark ? "0 18px 50px rgba(0,0,0,0.55)" : "0 18px 50px rgba(93,64,38,0.12)",
    shadowSoft: dark ? "0 8px 24px rgba(0,0,0,0.4)" : "0 8px 24px rgba(93,64,38,0.08)",
  };
}

export const MONO = "'Courier New', ui-monospace, monospace";
export const SANS = "'DM Sans', system-ui, sans-serif";
