import { useEffect, useRef, useState } from "react";
import { useApp } from "./store.jsx";
import { palette, MONO, SANS } from "./theme.js";

// ── "ask about amit" chatbot ─────────────────────────────────────────────────
// A floating terminal-style chat. Messages go to a Cloudflare Worker
// (workers/chat.js) that holds the Groq API key — the key never ships in the
// site. Until the Worker is deployed (or if it's down), the suggested
// questions still get hand-written answers, so the widget is never broken.
const CHAT_ENDPOINT = "https://amit-sh-chat.ashenoy000.workers.dev";

// Suggested questions: half hype, half roast. Each has an offline answer.
const HYPE = [
  ["How is Amit so awesome?", "Years of research, a 3.91 GPA, and an unreasonable amount of sol kadhi. Mostly the sol kadhi."],
  ["You're telling me he's only 22?", "Twenty-two, already shipped ML at UCB, optimized gene therapy at Arbor, and now builds agents for biomedical knowledge graphs. He will absolutely bring this up."],
  ["Is it true he revived a dead student committee?", "Yes. Freshman year he looked at a dormant sustainability committee and said 'I'll fix it.' He then tripled a different one's membership as co-chair. Email threads also tripled."],
  ["What does he actually do with knowledge graphs?", "He wires biology together — genes, drugs, cells, papers — so AI agents can reason over it. This website is just him doing that to himself."],
  ["Why should I hire him?", "He turns messy biomedical data into models people use: 100+ ML models at UCB, >250% productivity gains at Arbor. Check Work and the Resume page, then say hi on Contact."],
  ["What hackathons has he done?", "BCM Structural Variants, the OpenADMET CYP challenge, DEL-ML, an ultra-rare disease hackathon, Arc's Virtual Cell challenge, and he's mid-way through OpenBind Zika. It's a lifestyle."],
];
const ROAST = [
  ["How come he says he works out but can only curl 20 lbs?", "Progressive overload, baby. It was 15 lbs last month. At this rate he'll curl a Honda Civic by 2071."],
  ["Why does he have more side projects than sleep hours?", "Route9WebCo, a game studio, this website, six hackathons… he says it's 'portfolio building.' His circadian rhythm calls it a hostage situation."],
  ["Is this website more jacked than he is?", "The website has 38 animated 3D symbols and a force-directed physics engine. Amit has… enthusiasm. Next question."],
  ["Does he ever finish the games he starts?", "Just Another Studios's motto is literally about finishing things. It's aspirational. Like the curls."],
  ["Did he really need a 3D knowledge graph of himself?", "Need? No. Did he build one anyway at 2am while explaining it's 'the future of biology'? Absolutely."],
];

const pick = (arr, n) => [...arr].sort(() => Math.random() - 0.5).slice(0, n);
const freshSuggestions = () => [...pick(HYPE, 2), ...pick(ROAST, 1)].sort(() => Math.random() - 0.5);
const OFFLINE = Object.fromEntries([...HYPE, ...ROAST]);

export function ChatWidget() {
  const { dark, unlock } = useApp();
  const p = palette(dark);
  const [open, setOpen] = useState(false);
  const [msgs, setMsgs] = useState([{ role: "assistant", content: "hey! I'm Amit's website bot. Ask me anything about him — hype or roast, I do both." }]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [sugs, setSugs] = useState(freshSuggestions);
  const [peek, setPeek] = useState(false);
  const endRef = useRef(null);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" }); }, [msgs, busy, open]);

  // After a bit, the launcher "peeks" a teaser question to invite a click.
  useEffect(() => {
    const t1 = setTimeout(() => setPeek(true), 9000);
    const t2 = setTimeout(() => setPeek(false), 17000);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, []);

  async function ask(q) {
    const text = q.trim();
    if (!text || busy) return;
    unlock("chatty");
    const next = [...msgs, { role: "user", content: text }];
    setMsgs(next);
    setInput("");
    setBusy(true);
    let reply;
    try {
      const r = await fetch(CHAT_ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: next.slice(1) }),
      });
      if (!r.ok) throw new Error(String(r.status));
      reply = (await r.json()).reply;
    } catch {
      reply = OFFLINE[text] ||
        "My brain is offline right now (even bots need rest days — unlike Amit). Try one of the suggested questions, or reach the real Amit via the Contact page.";
      await new Promise((res) => setTimeout(res, 600));
    }
    setMsgs((m) => [...m, { role: "assistant", content: reply }]);
    setSugs((s) => {
      const remaining = s.filter(([sq]) => sq !== text);
      const pool = [...HYPE, ...ROAST].filter(([sq]) => !remaining.some(([r]) => r === sq) && sq !== text);
      return remaining.length >= 2 ? [...remaining, ...pick(pool, 1)].slice(0, 3) : freshSuggestions();
    });
    setBusy(false);
  }

  return (
    <>
      <style>{CHAT_CSS}</style>
      {!open && (
        <div style={{ position: "fixed", left: 20, bottom: 20, zIndex: 900, display: "flex", alignItems: "flex-end", gap: 10 }}>
          <button onClick={() => { setOpen(true); setPeek(false); }} className="chat-launch" aria-label="Open chat about Amit"
            style={{ width: 56, height: 56, borderRadius: "50%", border: "1px solid rgba(196,144,96,0.5)", background: "#C49060", color: "#fff", fontSize: 24, cursor: "pointer", boxShadow: p.shadow }}>
            💬
          </button>
          {peek && (
            <button onClick={() => { setOpen(true); setPeek(false); ask(sugs[0][0]); }} className="chat-peek"
              style={{ maxWidth: 230, textAlign: "left", fontFamily: SANS, fontSize: 13, color: p.fg, background: p.bgElevated, border: "1px solid " + p.border, borderRadius: "12px 12px 12px 2px", padding: "8px 12px", cursor: "pointer", boxShadow: p.shadowSoft }}>
              {sugs[0][0]}
            </button>
          )}
        </div>
      )}

      {open && (
        <div className="chat-panel" role="dialog" aria-label="Chat about Amit"
          style={{ position: "fixed", left: 16, bottom: 16, zIndex: 950, width: "min(380px, calc(100vw - 32px))", height: "min(540px, calc(100vh - 100px))", display: "flex", flexDirection: "column", background: dark ? "#16140F" : "#FFFDF9", border: "1px solid rgba(196,144,96,0.35)", borderRadius: 16, boxShadow: p.shadow, overflow: "hidden" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 14px", background: "#1E1C19", color: "#F5E6D3", fontFamily: MONO, fontSize: 12 }}>
            <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#8B9D77", boxShadow: "0 0 6px #8B9D77" }} />
            <span style={{ flex: 1 }}>ask-amit ~ $</span>
            <button onClick={() => setOpen(false)} aria-label="Close chat" style={{ background: "none", border: "none", color: "#9E958A", cursor: "pointer", fontSize: 16 }}>✕</button>
          </div>

          <div style={{ flex: 1, overflowY: "auto", padding: 14, display: "flex", flexDirection: "column", gap: 10 }}>
            {msgs.map((m, i) => (
              <div key={i} className="chat-msg" style={{ alignSelf: m.role === "user" ? "flex-end" : "flex-start", maxWidth: "85%", fontFamily: SANS, fontSize: 14, lineHeight: 1.5, padding: "8px 12px", borderRadius: m.role === "user" ? "12px 12px 2px 12px" : "12px 12px 12px 2px", background: m.role === "user" ? "#C49060" : dark ? "rgba(255,255,255,0.06)" : "rgba(196,144,96,0.1)", color: m.role === "user" ? "#fff" : p.fg }}>
                {m.content}
              </div>
            ))}
            {busy && (
              <div style={{ alignSelf: "flex-start", padding: "10px 14px", borderRadius: 12, background: dark ? "rgba(255,255,255,0.06)" : "rgba(196,144,96,0.1)" }}>
                {[0, 1, 2].map((i) => <span key={i} className="chat-dot" style={{ animationDelay: `${i * 0.15}s` }} />)}
              </div>
            )}
            <div ref={endRef} />
          </div>

          <div style={{ padding: "8px 12px 4px", display: "flex", flexWrap: "wrap", gap: 6, alignItems: "center" }}>
            {sugs.map(([q]) => (
              <button key={q} onClick={() => ask(q)} disabled={busy} className="chat-sug"
                style={{ fontFamily: SANS, fontSize: 12, textAlign: "left", color: "#C49060", background: dark ? "rgba(196,144,96,0.08)" : "rgba(196,144,96,0.07)", border: "1px solid rgba(196,144,96,0.3)", borderRadius: 999, padding: "5px 10px", cursor: busy ? "default" : "pointer" }}>
                {q}
              </button>
            ))}
            <button onClick={() => setSugs(freshSuggestions())} title="shuffle questions" aria-label="Shuffle suggested questions"
              style={{ background: "none", border: "none", cursor: "pointer", fontSize: 15 }}>🎲</button>
          </div>

          <form onSubmit={(e) => { e.preventDefault(); ask(input); }} style={{ display: "flex", gap: 8, padding: 12, borderTop: "1px solid " + p.borderSoft }}>
            <input value={input} onChange={(e) => setInput(e.target.value)} maxLength={600} placeholder="ask anything about amit…"
              style={{ flex: 1, fontFamily: MONO, fontSize: 13, padding: "9px 12px", borderRadius: 8, border: "1px solid " + p.border, background: dark ? "rgba(255,255,255,0.04)" : "#fff", color: p.fg, outline: "none" }} />
            <button type="submit" disabled={busy || !input.trim()}
              style={{ fontFamily: MONO, fontSize: 13, fontWeight: 700, padding: "0 14px", borderRadius: 8, border: "none", background: "#C49060", color: "#fff", cursor: "pointer", opacity: busy || !input.trim() ? 0.5 : 1 }}>
              send
            </button>
          </form>
        </div>
      )}
    </>
  );
}

const CHAT_CSS = `
@keyframes chatBob { 0%,100% { translate: 0 0; } 50% { translate: 0 -5px; } }
.chat-launch { animation: chatBob 2.4s ease-in-out infinite; transition: transform 0.2s ease; }
.chat-launch:hover { transform: scale(1.08) rotate(-6deg); }
@keyframes chatPop { from { opacity: 0; transform: translateY(14px) scale(0.96); } to { opacity: 1; transform: none; } }
.chat-panel { animation: chatPop 0.3s cubic-bezier(.2,.9,.3,1); transform-origin: bottom left; }
.chat-peek, .chat-msg { animation: chatPop 0.3s cubic-bezier(.2,.9,.3,1); }
.chat-sug { transition: background 0.2s ease, transform 0.2s ease; }
.chat-sug:hover { background: rgba(196,144,96,0.18) !important; transform: translateY(-1px); }
@keyframes chatDot { 0%,80%,100% { opacity: 0.25; translate: 0 0; } 40% { opacity: 1; translate: 0 -3px; } }
.chat-dot { display: inline-block; width: 6px; height: 6px; margin: 0 2px; border-radius: 50%; background: #C49060; animation: chatDot 1s infinite; }
@media (prefers-reduced-motion: reduce) { .chat-launch, .chat-panel, .chat-peek, .chat-msg, .chat-dot { animation: none !important; } }
`;
