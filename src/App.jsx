import { useState, useEffect, useRef } from "react";

const HEADSHOT = import.meta.env.BASE_URL + "Profile_Picture.png";

const PAGES = [
  { id: "Home", icon: "\u{1F3E0}" },
  { id: "About", icon: "\u{1F464}" },
  { id: "Work", icon: "\u{1F52C}" },
  { id: "Community", icon: "\u{1F331}" },
  { id: "Projects", icon: "\u{1F6E0}" },
  { id: "Rangers", icon: "\u{1F3D4}" },
  { id: "Wellness", icon: "\u{1F4AA}" },
  { id: "Blog", icon: "\u{270D}\uFE0F" },
  { id: "Contact", icon: "\u{1F4E1}" },
  { id: "Careers", icon: "\u{1F393}" },
  { id: "Resume", icon: "\u{1F4C4}" }
];

function PixelSprite({ size = 80, style: s = {} }) {
  const grid = [
    "...HHHH...",
    "..HHHHHH..",
    ".HHHHHHH..",
    ".SSSHHHSS.",
    ".SSEESSE..",
    ".SSS.SSS..",
    "..SSSSSS..",
    "..SMMMM...",
    "...BBBB...",
    "..BWWWWB..",
    "..BBBBBB..",
    ".BB.BB.BB.",
    ".B..BB..B.",
  ];
  const colors = { H: "#2D2926", S: "#D4A574", E: "#5C3D2E", M: "#C47070", B: "#2C3E6B", W: "#F0EDE8" };
  return (
    <svg width={size} height={size * 1.3} viewBox="0 0 10 13" style={{ imageRendering: "pixelated", ...s }}>
      {grid.map((row, y) => [...row].map((c, x) => c !== "." ? (
        <rect key={x+"-"+y} x={x} y={y} width={1} height={1} fill={colors[c]} />
      ) : null))}
    </svg>
  );
}

function PixelIcon({ type, size = 24, color = "#C49060" }) {
  const icons = {
    molecule: [[1,0],[2,0],[0,1],[3,1],[1,2],[2,2],[1,3],[2,3],[0,4],[3,4],[1,5],[2,5]],
    dumbbell: [[0,2],[1,2],[2,1],[2,2],[2,3],[3,2],[4,2],[5,1],[5,2],[5,3],[6,2],[7,2]],
    controller: [[2,0],[3,0],[4,0],[5,0],[1,1],[2,1],[3,1],[4,1],[5,1],[6,1],[0,2],[1,2],[2,2],[3,2],[4,2],[5,2],[6,2],[7,2],[1,3],[2,3],[3,3],[4,3],[5,3],[6,3],[2,4],[3,4],[4,4],[5,4]],
    leaf: [[3,0],[2,1],[3,1],[4,1],[1,2],[2,2],[3,2],[0,3],[1,3],[2,3],[0,4],[1,4],[1,5]],
    code: [[1,0],[5,0],[0,1],[2,1],[4,1],[6,1],[0,2],[6,2],[0,3],[6,3],[1,4],[5,4],[2,5],[3,5],[4,5]],
    mountain: [[3,0],[2,1],[4,1],[1,2],[5,2],[0,3],[3,3],[6,3],[0,4],[2,4],[4,4],[6,4],[0,5],[1,5],[2,5],[3,5],[4,5],[5,5],[6,5]],
    chef: [[2,0],[3,0],[1,1],[2,1],[3,1],[4,1],[1,2],[4,2],[2,3],[3,3],[1,4],[2,4],[3,4],[4,4],[0,5],[1,5],[2,5],[3,5],[4,5],[5,5]],
    pen: [[5,0],[4,1],[3,2],[2,3],[1,4],[0,5]],
    signal: [[6,0],[6,1],[4,1],[6,2],[4,2],[2,2],[6,3],[4,3],[2,3],[0,3],[6,4],[4,4],[2,4],[0,4]],
    scroll: [[1,0],[2,0],[3,0],[4,0],[0,1],[5,1],[0,2],[1,2],[2,2],[3,2],[4,2],[5,2],[0,3],[5,3],[0,4],[1,4],[2,4],[3,4],[4,4],[5,4],[1,5],[2,5],[3,5],[4,5]],
  };
  const pts = icons[type] || icons.code;
  const maxX = Math.max(...pts.map(p => p[0])) + 1;
  const maxY = Math.max(...pts.map(p => p[1])) + 1;
  return (
    <svg width={size} height={size * (maxY / maxX)} viewBox={"0 0 " + maxX + " " + maxY} style={{ imageRendering: "pixelated" }}>
      {pts.map(function(p, i) { return <rect key={i} x={p[0]} y={p[1]} width={1} height={1} fill={color} />; })}
    </svg>
  );
}

function PixelParticles({ dark, count = 12 }) {
  const particles = useRef(Array.from({ length: count }, function(_, i) {
    return {
      x: Math.random() * 100, y: Math.random() * 100,
      sz: 3 + Math.random() * 5, dur: 8 + Math.random() * 12,
      delay: Math.random() * -20, opacity: 0.15 + Math.random() * 0.2,
      color: ["#C49060", "#8B9D77", "#D4A574", "#7A6B5D"][i % 4]
    };
  })).current;
  return (
    <div style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 0, overflow: "hidden" }}>
      {particles.map(function(p, i) {
        return <div key={i} style={{
          position: "absolute", left: p.x + "%", top: p.y + "%",
          width: p.sz, height: p.sz, background: p.color, opacity: p.opacity,
          imageRendering: "pixelated",
          animation: "pixelFloat" + (i % 3) + " " + p.dur + "s ease-in-out infinite",
          animationDelay: p.delay + "s"
        }} />;
      })}
    </div>
  );
}

function TerminalText({ children, dark, style: s = {} }) {
  return <span style={{
    fontFamily: "'Courier New', monospace",
    background: dark ? "rgba(196,144,96,0.08)" : "rgba(196,144,96,0.06)",
    color: "#C49060", padding: "2px 8px", borderRadius: 4, fontSize: "0.9em",
    letterSpacing: "0.02em", ...s
  }}>{children}</span>;
}

function TerminalBlock({ dark, children, prompt = "amit@hub ~ $" }) {
  return (
    <div style={{
      background: dark ? "#0D0C0A" : "#1E1C19", borderRadius: 12,
      padding: "16px 20px", fontFamily: "'Courier New', monospace",
      fontSize: 13, lineHeight: 1.8, color: "#8B9D77",
      border: "1px solid rgba(196,144,96,0.15)", marginBottom: 20, overflow: "auto"
    }}>
      <div style={{ color: "#6B5E52", marginBottom: 4 }}>
        <span style={{ color: "#C49060" }}>{prompt}</span>{" "}
        <span style={{ color: "#D4C9BC" }}>{children}</span>
      </div>
    </div>
  );
}

function Nav({ page, setPage, dark, setDark }) {
  const [open, setOpen] = useState(false);
  return (
    <nav style={{
      position: "fixed", top: 0, left: 0, right: 0, zIndex: 100,
      background: dark ? "rgba(30,28,25,0.92)" : "rgba(255,250,244,0.92)",
      backdropFilter: "blur(12px)",
      borderBottom: "2px solid " + (dark ? "rgba(196,144,96,0.15)" : "rgba(196,144,96,0.1)"),
      padding: "0 24px", transition: "all 0.3s ease"
    }}>
      <div style={{ maxWidth: 1200, margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "space-between", height: 64 }}>
        <button onClick={function() { setPage("Home"); }} style={{
          background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: 8
        }}>
          <PixelSprite size={28} />
          <span style={{ fontFamily: "'Courier New', monospace", fontSize: 16, fontWeight: 700, color: "#C49060", letterSpacing: "0.05em" }}>AMIT.SH</span>
        </button>
        <div style={{ display: "flex", gap: 4, alignItems: "center" }} className="desktop-nav">
          {PAGES.map(function(p) {
            return <button key={p.id} onClick={function() { setPage(p.id); }} style={{
              background: page === p.id ? (dark ? "rgba(196,144,96,0.15)" : "rgba(196,144,96,0.1)") : "none",
              border: page === p.id ? "1px solid rgba(196,144,96,0.2)" : "1px solid transparent",
              cursor: "pointer", padding: "5px 12px", borderRadius: 6,
              fontFamily: "'Courier New', monospace", fontSize: 12,
              color: page === p.id ? "#C49060" : (dark ? "#8A7E72" : "#6B5E52"),
              transition: "all 0.2s ease"
            }}>{p.id}</button>;
          })}
          <button onClick={function() { setDark(!dark); }} style={{
            background: dark ? "rgba(196,144,96,0.1)" : "rgba(0,0,0,0.04)",
            border: "1px solid rgba(196,144,96,0.15)", cursor: "pointer",
            width: 32, height: 32, borderRadius: 6, display: "flex", alignItems: "center",
            justifyContent: "center", fontSize: 14, marginLeft: 8,
            fontFamily: "'Courier New', monospace", color: "#C49060"
          }}>{dark ? "\u2600" : "\u263E"}</button>
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }} className="mobile-nav">
          <button onClick={function() { setDark(!dark); }} style={{
            background: "none", border: "1px solid rgba(196,144,96,0.15)", cursor: "pointer",
            width: 32, height: 32, borderRadius: 6, display: "flex", alignItems: "center",
            justifyContent: "center", fontSize: 14, color: "#C49060"
          }}>{dark ? "\u2600" : "\u263E"}</button>
          <button onClick={function() { setOpen(!open); }} style={{
            background: "none", border: "1px solid rgba(196,144,96,0.15)", cursor: "pointer",
            width: 32, height: 32, borderRadius: 6, fontFamily: "'Courier New', monospace",
            fontSize: 16, color: "#C49060", display: "flex", alignItems: "center", justifyContent: "center"
          }}>{open ? "\u00D7" : "\u2261"}</button>
        </div>
      </div>
      {open && (
        <div style={{ padding: "8px 0 16px", display: "flex", flexDirection: "column", gap: 2 }} className="mobile-dropdown">
          {PAGES.map(function(p) {
            return <button key={p.id} onClick={function() { setPage(p.id); setOpen(false); }} style={{
              background: page === p.id ? "rgba(196,144,96,0.1)" : "none",
              border: "none", cursor: "pointer", padding: "10px 12px", borderRadius: 6, textAlign: "left",
              fontFamily: "'Courier New', monospace", fontSize: 13,
              color: page === p.id ? "#C49060" : (dark ? "#8A7E72" : "#6B5E52"),
              display: "flex", gap: 8, alignItems: "center"
            }}><span>{p.icon}</span> {p.id}</button>;
          })}
        </div>
      )}
    </nav>
  );
}

function Section({ children, dark, style: s = {} }) {
  return <section style={{ maxWidth: 900, margin: "0 auto", padding: "80px 24px", position: "relative", zIndex: 1, ...s }}>{children}</section>;
}

function SectionHeader({ dark, icon, title, sub }) {
  return (
    <div style={{ marginBottom: 40 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 8 }}>
        {icon && <PixelIcon type={icon} size={28} color="#C49060" />}
        <h1 style={{
          fontFamily: "'Courier New', monospace", fontSize: "clamp(26px, 4vw, 40px)",
          color: dark ? "#F5E6D3" : "#2D2926", margin: 0, fontWeight: 700
        }}>{title}</h1>
      </div>
      {sub && <p style={{
        fontFamily: "'DM Sans', sans-serif", fontSize: 16, marginTop: 8, marginLeft: icon ? 40 : 0,
        color: dark ? "#9E958A" : "#8A7E72", lineHeight: 1.65, maxWidth: 600, fontStyle: "italic"
      }}>{sub}</p>}
    </div>
  );
}

function Card({ dark, children, style: s = {}, onClick }) {
  return <div onClick={onClick} style={{
    background: dark ? "rgba(255,255,255,0.025)" : "rgba(255,255,255,0.65)",
    border: "1px solid " + (dark ? "rgba(196,144,96,0.1)" : "rgba(196,144,96,0.08)"),
    borderRadius: 12, padding: 24, marginBottom: 16,
    transition: "all 0.25s ease", cursor: onClick ? "pointer" : "default", ...s
  }}>{children}</div>;
}

function Tag({ dark, children }) {
  return <span style={{
    display: "inline-block", padding: "3px 10px", borderRadius: 4,
    background: dark ? "rgba(196,144,96,0.1)" : "rgba(196,144,96,0.08)",
    color: "#C49060", fontSize: 11, fontWeight: 600,
    fontFamily: "'Courier New', monospace", marginRight: 6, marginBottom: 6,
    border: "1px solid rgba(196,144,96,0.12)"
  }}>{children}</span>;
}

function HomePage({ dark, setPage }) {
  const [blink, setBlink] = useState(true);
  useEffect(function() {
    var t = setInterval(function() { setBlink(function(b) { return !b; }); }, 530);
    return function() { clearInterval(t); };
  }, []);
  return (
    <Section dark={dark} style={{ paddingTop: 100 }}>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 40, alignItems: "center", marginBottom: 60 }}>
        <div style={{ flex: "0 0 auto", textAlign: "center" }}>
          <div style={{ position: "relative", display: "inline-block" }}>
            <div style={{
              width: 130, height: 130, borderRadius: "50%",
              background: "url(" + HEADSHOT + ") center/cover",
              border: "3px solid rgba(196,144,96,0.25)",
              boxShadow: dark ? "0 12px 40px rgba(0,0,0,0.5)" : "0 12px 40px rgba(0,0,0,0.08)"
            }} />
            <div style={{ position: "absolute", bottom: -8, right: -8 }}><PixelSprite size={40} /></div>
          </div>
        </div>
        <div style={{ flex: 1, minWidth: 280 }}>
          <div style={{ fontFamily: "'Courier New', monospace", fontSize: 13, color: "#8B9D77", marginBottom: 8 }}>
            {">"} hello_world.sh
          </div>
          <h1 style={{
            fontFamily: "'Courier New', monospace", fontSize: "clamp(28px, 5vw, 44px)",
            color: dark ? "#F5E6D3" : "#2D2926", margin: "0 0 12px", lineHeight: 1.15, fontWeight: 700
          }}>
            Amit Shenoy<span style={{ color: "#C49060", opacity: blink ? 1 : 0, transition: "opacity 0.1s" }}>_</span>
          </h1>
          <p style={{
            fontFamily: "'DM Sans', sans-serif", fontSize: 17, color: "#C49060",
            fontWeight: 500, margin: "0 0 16px", fontStyle: "italic", lineHeight: 1.5
          }}>I believe that we're here to take care of each other and learn together. Let's work together to help people live better.</p>
          <p style={{
            fontFamily: "'DM Sans', sans-serif", fontSize: 15,
            color: dark ? "#9E958A" : "#8A7E72", lineHeight: 1.7, margin: "0 0 24px"
          }}>Data scientist by day. Community builder by slightly later in the day. Konkani kid from Mangalore who ended up building ML pipelines and accidentally reviving student government committees.</p>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            {[{label:"ls work/",page:"Work"},{label:"ls community/",page:"Community"},{label:"cat contact.md",page:"Contact"}].map(function(item) {
              return <button key={item.page} onClick={function(){setPage(item.page);}} style={{
                background: dark ? "rgba(196,144,96,0.08)" : "rgba(196,144,96,0.06)",
                color: "#C49060", border: "1px solid rgba(196,144,96,0.2)",
                cursor: "pointer", padding: "8px 16px", borderRadius: 6,
                fontFamily: "'Courier New', monospace", fontSize: 12, transition: "all 0.2s ease"
              }}>{item.label}</button>;
            })}
          </div>
        </div>
      </div>
      <TerminalBlock dark={dark} prompt="amit@hub ~ $">cat /etc/motd — "Welcome. Grab some sol kadhi and stay awhile."</TerminalBlock>
      <div style={{ display: "flex", gap: 16, flexWrap: "wrap", marginTop: 20 }}>
        {[
          {icon:"molecule",label:"Research",desc:"Computational biophysics & cheminformatics. Molecules in, insights out, existential questions about binding free energy in between.",page:"Work"},
          {icon:"leaf",label:"Community",desc:"Sustainability, accessibility, FOSS. Because someone has to be the person at the meeting who asks 'but have we considered the compost?'",page:"Community"},
          {icon:"controller",label:"Building",desc:"ML pipelines, apps, recipe spreadsheets. The Venn diagram of my hobbies and my work is just a circle at this point.",page:"Projects"},
        ].map(function(item) {
          return <Card key={item.label} dark={dark} onClick={function(){setPage(item.page);}} style={{flex:"1 1 240px",cursor:"pointer"}}>
            <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:10}}>
              <PixelIcon type={item.icon} size={20} />
              <h3 style={{fontFamily:"'Courier New', monospace",fontSize:16,fontWeight:700,color:dark?"#F5E6D3":"#2D2926",margin:0}}>{item.label}</h3>
            </div>
            <p style={{fontFamily:"'DM Sans', sans-serif",fontSize:14,color:dark?"#9E958A":"#8A7E72",margin:0,lineHeight:1.6}}>{item.desc}</p>
          </Card>;
        })}
      </div>
    </Section>
  );
}

function AboutPage({ dark }) {
  return (
    <Section dark={dark} style={{ paddingTop: 100 }}>
      <SectionHeader dark={dark} title="About Me" icon="code" sub="The short version: I like solving hard problems and then talking about them at unnecessary length." />
      <div style={{ display: "flex", gap: 32, flexWrap: "wrap", alignItems: "flex-start" }}>
        <div style={{ flex: "0 0 auto", textAlign: "center" }}>
          <div style={{ width: 180, height: 180, borderRadius: 12, background: "url(" + HEADSHOT + ") center/cover", border: "2px solid rgba(196,144,96,0.2)" }} />
          <div style={{ marginTop: 12 }}><PixelSprite size={60} /></div>
        </div>
        <div style={{ flex: 1, minWidth: 280 }}>
          <TerminalBlock dark={dark} prompt="amit@about ~ $">whoami</TerminalBlock>
          <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 15, color: dark ? "#BEB5AA" : "#5A4E42", lineHeight: 1.8, margin: "0 0 14px" }}>
            I'm Amit Shenoy — Konkani, Mangalorean, and improbably from Massachusetts. I graduated from Northeastern University with a B.S. in Bioengineering (Computational, Systems & Synthetic Biology), a math minor, and a GPA of 3.91 that I'm told is appropriate to mention on a personal website.</p>
          <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 15, color: dark ? "#BEB5AA" : "#5A4E42", lineHeight: 1.8, margin: "0 0 14px" }}>
            My work sits at the intersection of data science and computational biophysics — building analytics pipelines for biomedical data, validating models that tell chemists which molecules to actually bother making, and collaborating across teams who use very different definitions of the word "significant."</p>
          <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 15, color: dark ? "#BEB5AA" : "#5A4E42", lineHeight: 1.8, margin: "0 0 14px" }}>
            When I'm not staring at UMAP plots, I'm probably lifting, engineering a recipe to be slightly more nutritionally optimal than it needs to be, working my way through a puzzle, or advocating loudly for environmental sustainability among other things to anyone who will listen — and several people who won't.</p>
          <TerminalBlock dark={dark} prompt="amit@about ~ $">cat values.txt</TerminalBlock>
          <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 15, color: dark ? "#BEB5AA" : "#5A4E42", lineHeight: 1.8, margin: "0 0 20px" }}>
            I grew up in a Konkani household where feeding people well was the baseline unit of caring about them. That's still how I operate — whether it's making sure a sustainability initiative actually launches, building a tool that saves a chemist three hours, or just making really good dal.</p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
            {["Python","PyTorch","R","SQL","Docker","AWS","Git","SHAP","UMAP","C++","React"].map(function(s) { return <Tag key={s} dark={dark}>{s}</Tag>; })}
          </div>
        </div>
      </div>
    </Section>
  );
}

function WorkPage({ dark }) {
  var jobs = [
    {title:"Data Science Co-op — Targeted Protein Degradation",org:"UCB Biosciences, Cambridge, MA",time:"Jan 2025 – Present",note:"The one where I build models to tell proteins they're fired.",bullets:["Designed 100+ multimodal ML models (SP/CRC data) informing assay selection and OOD risk assessment.","Built modular pipelines enabling 3\u20135\u00D7 faster A/B testing of molecular embeddings (GROVER, ESM-C).","Developed UMAP/SHAP visualizations and stakeholder-ready summaries for computational and experimental teams.","Delivered ML models filtering large HTS libraries to <1% high-confidence candidates."],tags:["Cheminformatics","ML","SHAP","UMAP","Hit Triage"]},
    {title:"Undergraduate Researcher — Computational Biochemistry",org:"COMBINE Lab (Prof. Minkara), Northeastern",time:"May 2023 – Present",note:"Where I dock molecules and occasionally dock my ego at the door.",bullets:["Modeled MBL\u2013glycan recognition mechanisms with docking + MM-GBSA.","Built version-controlled Python/BASH pipelines reducing manual effort by >80%.","Presented findings 15+ times at AAAS, MBN, BSCP. Contributing to two manuscripts."],tags:["Biophysics","Docking","MM-GBSA"]},
    {title:"AAV Gene Therapy Co-op — Upstream Optimization",org:"Arbor Biotechnologies, Cambridge, MA",time:"Jan 2024 – Jun 2024",note:"Where I learned that sometimes the breakthrough is just better lysis conditions.",bullets:["Led DOE-driven optimization yielding >50% increase in adherent AAV harvest.","Proposed and validated a suspension-based workflow achieving >250% productivity gain."],tags:["AAV","Bench Platform","DOE"]}
  ];
  return (
    <Section dark={dark} style={{ paddingTop: 100 }}>
      <SectionHeader dark={dark} title="Work & Research" icon="molecule" sub="Bench platform development and computational hit triage. Two very different types of pipelines." />
      <TerminalBlock dark={dark} prompt="amit@work ~ $">ls -la experience/</TerminalBlock>
      {jobs.map(function(j, i) {
        return <Card key={i} dark={dark}>
          <div style={{display:"flex",justifyContent:"space-between",flexWrap:"wrap",gap:8,marginBottom:4}}>
            <h3 style={{fontFamily:"'Courier New', monospace",fontSize:16,fontWeight:700,color:dark?"#F5E6D3":"#2D2926",margin:0}}>{j.title}</h3>
            <Tag dark={dark}>{j.time}</Tag>
          </div>
          <p style={{fontFamily:"'DM Sans', sans-serif",fontSize:13,color:dark?"#8A7E72":"#9E958A",margin:"2px 0 6px",fontStyle:"italic"}}>{j.org}</p>
          <p style={{fontFamily:"'DM Sans', sans-serif",fontSize:14,color:"#C49060",margin:"0 0 12px",fontStyle:"italic"}}>{j.note}</p>
          <ul style={{margin:"0 0 12px",paddingLeft:18}}>
            {j.bullets.map(function(b, bi) { return <li key={bi} style={{fontFamily:"'DM Sans', sans-serif",fontSize:14,color:dark?"#BEB5AA":"#5A4E42",lineHeight:1.7,marginBottom:4}}>{b}</li>; })}
          </ul>
          <div style={{display:"flex",flexWrap:"wrap"}}>{j.tags.map(function(t){return <Tag key={t} dark={dark}>{t}</Tag>;})}</div>
        </Card>;
      })}
    </Section>
  );
}

function CommunityPage({ dark }) {
  var items = [
    {title:"Co-Chair \u2014 University-Wide Sustainability Committee",icon:"leaf",note:"Tripled the membership, which meant tripling the email threads. Worth it.",desc:"United all sustainability orgs under shared branding, initiated cross-group collaborations, contributed to the Plastics Reduction Campaign (and pushed it to launch a semester early). Created a student sustainability swipe file \u2014 because the hardest part of activism shouldn't be figuring out where to start.",tags:["Sustainability","Leadership"]},
    {title:"GNU@NU Computing Community \u2014 Founder",icon:"code",note:"My pitch: 'What if AI deployment was safe? Hear me out.'",desc:"Founded GNU@NU to educate and advocate for Free and Open Source Software. Attended LibrePlanet two years running and presented on what students can actually do to push for free software in their communities. FOSS isn't a niche concern \u2014 it's infrastructure for trustworthy AI.",tags:["FOSS","Free Software","AI Safety"]},
    {title:"Ambassadors for Change (A4C) \u2014 Founder",icon:"signal",note:"Started because I noticed the people being talked about weren't the ones talking.",desc:"Founded A4C to advocate for the disabled community on campus. Published a mini documentary and case studies drawn from interviews with community members on inclusion and marginalization.",tags:["Accessibility","Disability Advocacy"]},
    {title:"Student Government Sustainability Committee",icon:"leaf",note:"Freshman year energy: 'Why is this committee dead? I'll fix it.'",desc:"Revived the dormant committee, grew membership, and launched several campus sustainability initiatives.",tags:["Student Government"]},
    {title:"Dining Advisory Board",icon:"chef",note:"Pitched a better meal plan. They said yes. Still my best ROI.",desc:"Pitched a more flexible and affordable semesterly meal plan structure alongside fellow board members \u2014 which was adopted by the Northeastern dining team.",tags:["Student Advocacy"]}
  ];
  return (
    <Section dark={dark} style={{ paddingTop: 100 }}>
      <SectionHeader dark={dark} title="Community & Leadership" icon="leaf" sub="If you care about something, you probably have to be the one to organize the meeting about it." />
      <TerminalBlock dark={dark} prompt="amit@community ~ $">find . -name "initiative" -type d | wc -l &rarr; 5</TerminalBlock>
      {items.map(function(item, i) {
        return <Card key={i} dark={dark}>
          <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:6}}>
            <PixelIcon type={item.icon} size={18} />
            <h3 style={{fontFamily:"'Courier New', monospace",fontSize:16,fontWeight:700,color:dark?"#F5E6D3":"#2D2926",margin:0}}>{item.title}</h3>
          </div>
          <p style={{fontFamily:"'DM Sans', sans-serif",fontSize:14,color:"#C49060",margin:"0 0 10px",fontStyle:"italic"}}>{item.note}</p>
          <p style={{fontFamily:"'DM Sans', sans-serif",fontSize:14,color:dark?"#BEB5AA":"#5A4E42",lineHeight:1.7,margin:"0 0 12px"}}>{item.desc}</p>
          <div style={{display:"flex",flexWrap:"wrap"}}>{item.tags.map(function(t){return <Tag key={t} dark={dark}>{t}</Tag>;})}</div>
        </Card>;
      })}
    </Section>
  );
}

function ProjectsPage({ dark }) {
  var projects = [
    {title:"ARES \u2014 Focused Screening Library Generator",note:"For when you have 500,000 compounds and only 200 slots on a plate.",desc:"Built clustering + diversity modules reducing chemist iteration time by ~40% and enabling rapid pilot-screen triage.",tags:["Cheminformatics","Clustering","Drug Discovery"],link:null},
    {title:"Orbit Swap",note:"The shift-swap app nobody asked for but everyone apparently needed.",desc:"A scheduling and shift-swap app currently in beta.",tags:["Mobile App","React Native","Beta"],link:"https://xx-its-amit-xx.github.io/orbit_swap_privacy_policy/index.html",linkLabel:"\u2192 beta_signup.sh"},
    {title:"Point-of-Care Saliva Diagnostics",note:"Capstone project. Yes, saliva. Yes, we're past it.",desc:"Built an OpenCV + SVM LFA quantification pipeline; deployed a Dockerized ML backend + Expo app to AWS.",tags:["Computer Vision","AWS","Docker"],link:null}
  ];
  return (
    <Section dark={dark} style={{ paddingTop: 100 }}>
      <SectionHeader dark={dark} title="Projects" icon="code" sub="Side quests that became main quests." />
      <TerminalBlock dark={dark} prompt="amit@projects ~ $">ls ~/builds/</TerminalBlock>
      {projects.map(function(p, i) {
        return <Card key={i} dark={dark}>
          <h3 style={{fontFamily:"'Courier New', monospace",fontSize:16,fontWeight:700,color:dark?"#F5E6D3":"#2D2926",margin:"0 0 4px"}}>{p.title}</h3>
          <p style={{fontFamily:"'DM Sans', sans-serif",fontSize:14,color:"#C49060",margin:"0 0 10px",fontStyle:"italic"}}>{p.note}</p>
          <p style={{fontFamily:"'DM Sans', sans-serif",fontSize:14,color:dark?"#BEB5AA":"#5A4E42",lineHeight:1.7,margin:"0 0 12px"}}>{p.desc}</p>
          <div style={{display:"flex",flexWrap:"wrap",marginBottom:p.link?12:0}}>{p.tags.map(function(t){return <Tag key={t} dark={dark}>{t}</Tag>;})}</div>
          {p.link && <a href={p.link} target="_blank" rel="noopener noreferrer" style={{fontFamily:"'Courier New', monospace",fontSize:13,fontWeight:600,color:"#8B9D77",textDecoration:"none",background:"rgba(139,157,119,0.08)",padding:"6px 12px",borderRadius:4,border:"1px solid rgba(139,157,119,0.15)"}}>{p.linkLabel}</a>}
        </Card>;
      })}
    </Section>
  );
}

function RangersPage({ dark }) {
  return <Section dark={dark} style={{ paddingTop: 100, textAlign: "center" }}>
    <SectionHeader dark={dark} title="Rooftop Rangers" icon="mountain" />
    <Card dark={dark} style={{ textAlign: "center", padding: 40 }}>
      <PixelIcon type="mountain" size={48} color="#C49060" />
      <h3 style={{fontFamily:"'Courier New', monospace",fontSize:22,fontWeight:700,color:dark?"#F5E6D3":"#2D2926",margin:"16px 0 8px"}}>The Rooftop Rangers</h3>
      <p style={{fontFamily:"'DM Sans', sans-serif",fontSize:15,color:dark?"#9E958A":"#8A7E72",margin:"0 0 24px",lineHeight:1.7,fontStyle:"italic"}}>Adventures, stories, and questionable summit decisions.</p>
      <a href="https://therooftoprangers.com/" target="_blank" rel="noopener noreferrer" style={{display:"inline-block",background:"#C49060",color:"#FFF",padding:"10px 24px",borderRadius:6,textDecoration:"none",fontFamily:"'Courier New', monospace",fontSize:13,fontWeight:700}}>cd /rooftop-rangers &rarr;</a>
    </Card>
  </Section>;
}

function WellnessPage({ dark }) {
  var _s = useState({type:"recipe",name:"",details:"",email:""});
  var form = _s[0]; var setForm = _s[1];
  var _s2 = useState(false); var submitted = _s2[0]; var setSubmitted = _s2[1];
  return (
    <Section dark={dark} style={{ paddingTop: 100 }}>
      <SectionHeader dark={dark} title="Meal Plans & Workouts" icon="dumbbell" sub="Because optimizing macros and optimizing hyperparameters use the same part of my brain." />
      <div style={{ display: "flex", gap: 16, flexWrap: "wrap", marginBottom: 40 }}>
        <Card dark={dark} style={{ flex: "1 1 280px", textAlign: "center", padding: 32 }}>
          <PixelIcon type="chef" size={32} color="#C49060" />
          <h3 style={{fontFamily:"'Courier New', monospace",fontSize:18,fontWeight:700,color:dark?"#F5E6D3":"#2D2926",margin:"12px 0 8px"}}>Meal Plans</h3>
          <p style={{fontFamily:"'DM Sans', sans-serif",fontSize:14,color:dark?"#9E958A":"#8A7E72",margin:"0 0 16px",fontStyle:"italic"}}>Recipes engineered for function. Occasionally also for taste.</p>
          <TerminalText dark={dark}>Notion link: TBD</TerminalText>
        </Card>
        <Card dark={dark} style={{ flex: "1 1 280px", textAlign: "center", padding: 32 }}>
          <PixelIcon type="dumbbell" size={32} color="#C49060" />
          <h3 style={{fontFamily:"'Courier New', monospace",fontSize:18,fontWeight:700,color:dark?"#F5E6D3":"#2D2926",margin:"12px 0 8px"}}>Workouts</h3>
          <p style={{fontFamily:"'DM Sans', sans-serif",fontSize:14,color:dark?"#9E958A":"#8A7E72",margin:"0 0 16px",fontStyle:"italic"}}>Progressive overload, tracked obsessively. As one does.</p>
          <TerminalText dark={dark}>Notion link: TBD</TerminalText>
        </Card>
      </div>
      <Card dark={dark}>
        <h3 style={{fontFamily:"'Courier New', monospace",fontSize:18,fontWeight:700,color:dark?"#F5E6D3":"#2D2926",margin:"0 0 6px"}}>Suggest Something</h3>
        <p style={{fontFamily:"'DM Sans', sans-serif",fontSize:14,color:dark?"#9E958A":"#8A7E72",margin:"0 0 20px",fontStyle:"italic"}}>Got a recipe or workout I should try? I take recommendations seriously. Possibly too seriously.</p>
        {submitted ? (
          <TerminalBlock dark={dark} prompt="amit@wellness ~ $">echo "Received. Will report back." ✓</TerminalBlock>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <div style={{display:"flex",gap:8}}>
              {["recipe","workout"].map(function(t) {
                return <button key={t} onClick={function(){setForm(Object.assign({},form,{type:t}));}} style={{
                  background:form.type===t?"#C49060":"transparent",color:form.type===t?"#FFF":"#C49060",
                  border:"1px solid rgba(196,144,96,0.25)",cursor:"pointer",padding:"6px 16px",borderRadius:4,
                  fontFamily:"'Courier New', monospace",fontSize:12,textTransform:"uppercase"
                }}>{t}</button>;
              })}
            </div>
            <input value={form.name} onChange={function(e){setForm(Object.assign({},form,{name:e.target.value}));}} placeholder={form.type==="recipe"?"Recipe name":"Workout name"} style={{background:dark?"rgba(255,255,255,0.03)":"rgba(0,0,0,0.02)",border:"1px solid rgba(196,144,96,0.15)",borderRadius:6,padding:"10px 14px",fontFamily:"'Courier New', monospace",fontSize:14,color:dark?"#F5E6D3":"#2D2926",outline:"none"}} />
            <input value={form.email} onChange={function(e){setForm(Object.assign({},form,{email:e.target.value}));}} placeholder="Your email (optional)" style={{background:dark?"rgba(255,255,255,0.03)":"rgba(0,0,0,0.02)",border:"1px solid rgba(196,144,96,0.15)",borderRadius:6,padding:"10px 14px",fontFamily:"'Courier New', monospace",fontSize:14,color:dark?"#F5E6D3":"#2D2926",outline:"none"}} />
            <textarea value={form.details} onChange={function(e){setForm(Object.assign({},form,{details:e.target.value}));}} placeholder="Details, link, or instructions..." rows={3} style={{background:dark?"rgba(255,255,255,0.03)":"rgba(0,0,0,0.02)",border:"1px solid rgba(196,144,96,0.15)",borderRadius:6,padding:"10px 14px",fontFamily:"'Courier New', monospace",fontSize:14,resize:"vertical",color:dark?"#F5E6D3":"#2D2926",outline:"none"}} />
            <button onClick={function(){if(form.name&&form.details)setSubmitted(true);}} style={{background:"#C49060",color:"#FFF",border:"none",cursor:"pointer",padding:"10px 20px",borderRadius:6,alignSelf:"flex-start",fontFamily:"'Courier New', monospace",fontSize:13,fontWeight:700}}>submit &rarr;</button>
          </div>
        )}
      </Card>
    </Section>
  );
}

function BlogPage({ dark }) {
  return <Section dark={dark} style={{ paddingTop: 100, textAlign: "center" }}>
    <SectionHeader dark={dark} title="Blog" icon="pen" sub="Thoughts on research, FOSS, sustainability, and the occasionally unreasonable behavior of gradient descent." />
    <Card dark={dark} style={{ textAlign: "center", padding: 40 }}>
      <PixelIcon type="pen" size={36} color="#C49060" />
      <h3 style={{fontFamily:"'Courier New', monospace",fontSize:20,fontWeight:700,color:dark?"#F5E6D3":"#2D2926",margin:"16px 0 8px"}}>Read on Substack</h3>
      <p style={{fontFamily:"'DM Sans', sans-serif",fontSize:15,color:dark?"#9E958A":"#8A7E72",margin:"0 0 24px",fontStyle:"italic"}}>I write when I have something to say. Substack link incoming.</p>
      <span style={{display:"inline-block",background:"rgba(196,144,96,0.08)",padding:"10px 20px",borderRadius:6,fontFamily:"'Courier New', monospace",fontSize:13,color:"#C49060",border:"1px solid rgba(196,144,96,0.15)"}}>echo "coming soon"</span>
    </Card>
  </Section>;
}

function ContactPage({ dark }) {
  return (
    <Section dark={dark} style={{ paddingTop: 100 }}>
      <SectionHeader dark={dark} title="Contact" icon="signal" sub="I respond to emails, calendar invites, and sufficiently interesting DMs." />
      <TerminalBlock dark={dark} prompt="amit@contact ~ $">cat ~/.contact</TerminalBlock>
      <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 24 }}>
        {[
          {label:"EMAIL",value:"ashenoycompany@gmail.com",href:"mailto:ashenoycompany@gmail.com"},
          {label:"PHONE",value:"508-864-5532",href:"tel:5088645532"},
          {label:"LINKEDIN",value:"/in/itsamit",href:"https://www.linkedin.com/in/itsamit"},
          {label:"GITHUB",value:"xX-its-amit-Xx",href:"https://github.com/xX-its-amit-Xx"},
        ].map(function(c) {
          return <Card key={c.label} dark={dark} style={{ flex: "1 1 180px" }}>
            <p style={{fontFamily:"'Courier New', monospace",fontSize:11,color:"#8B9D77",margin:"0 0 6px",textTransform:"uppercase",letterSpacing:"0.08em"}}>{c.label}</p>
            <a href={c.href} target="_blank" rel="noopener noreferrer" style={{fontFamily:"'Courier New', monospace",fontSize:14,fontWeight:700,color:"#C49060",textDecoration:"none",wordBreak:"break-all"}}>{c.value}</a>
          </Card>;
        })}
      </div>
      <Card dark={dark} style={{ textAlign: "center", padding: 32 }}>
        <h3 style={{fontFamily:"'Courier New', monospace",fontSize:18,fontWeight:700,color:dark?"#F5E6D3":"#2D2926",margin:"0 0 8px"}}>Book a Meeting</h3>
        <p style={{fontFamily:"'DM Sans', sans-serif",fontSize:14,color:dark?"#9E958A":"#8A7E72",margin:"0 0 20px",fontStyle:"italic"}}>I promise I'm more animated in real time than in monospace.</p>
        <a href="https://calendly.com/app/scheduling/meeting_types/user/me" target="_blank" rel="noopener noreferrer" style={{display:"inline-block",background:"#C49060",color:"#FFF",padding:"10px 24px",borderRadius:6,textDecoration:"none",fontFamily:"'Courier New', monospace",fontSize:13,fontWeight:700}}>open calendly &rarr;</a>
      </Card>
    </Section>
  );
}

function CareersPage({ dark }) {
  const linkBtn = {display:"inline-block",background:"#C49060",color:"#FFF",padding:"10px 22px",borderRadius:6,textDecoration:"none",fontFamily:"'Courier New', monospace",fontSize:13,fontWeight:700,marginTop:14};
  const h3 = {fontFamily:"'Courier New', monospace",fontSize:18,fontWeight:700,color:dark?"#F5E6D3":"#2D2926",margin:"0 0 10px"};
  const body = {fontFamily:"'DM Sans', sans-serif",fontSize:14,color:dark?"#9E958A":"#8A7E72",margin:"0 0 10px",lineHeight:1.7};
  const liStyle = {fontFamily:"'DM Sans', sans-serif",fontSize:14,color:dark?"#9E958A":"#8A7E72",lineHeight:1.7,marginBottom:6};
  const codeStyle = {fontFamily:"'Courier New', monospace",fontSize:13,color:"#C49060",background:dark?"rgba(196,144,96,0.08)":"rgba(196,144,96,0.06)",padding:"1px 6px",borderRadius:3};
  return (
    <Section dark={dark} style={{ paddingTop: 100 }}>
      <SectionHeader dark={dark} title="Careers" icon="scroll" sub="Free templates and a no-fluff guide to building a resume that won't get auto-rejected." />

      <Card dark={dark}>
        <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:8}}>
          <PixelIcon type="scroll" size={20} />
          <h3 style={h3}>Google Docs Resume Template</h3>
        </div>
        <p style={body}>A clean one-page template I share with students at Northeastern. Sections for Education, Skills, and Project / Work / Volunteer Experience, plus optional Mission Statement and Background blocks. In Google Docs, do <strong>File &rarr; Make a copy</strong> to start your own.</p>
        <div style={{borderRadius:8,overflow:"hidden",border:"1px solid "+(dark?"rgba(196,144,96,0.15)":"rgba(196,144,96,0.12)"),background:"#FFFFFF",marginTop:12}}>
          <iframe src="https://docs.google.com/document/d/1MyKi0G6va39nCABmK7Y9FUWh5oAgwUNSo3IriLvyX2g/preview" title="Resume template preview" style={{width:"100%",height:600,border:"none",display:"block"}} />
        </div>
        <a href="https://docs.google.com/document/d/1MyKi0G6va39nCABmK7Y9FUWh5oAgwUNSo3IriLvyX2g/edit" target="_blank" rel="noopener noreferrer" style={linkBtn}>open in google docs &rarr;</a>
      </Card>

      <Card dark={dark}>
        <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:8}}>
          <PixelIcon type="code" size={20} />
          <h3 style={h3}>Notes for Students</h3>
        </div>
        <ul style={{paddingLeft:20,margin:"4px 0 0"}}>
          <li style={liStyle}>Keep it to <strong>one page</strong>. Recruiters spend ~7 seconds on the first pass &mdash; don't make them scroll.</li>
          <li style={liStyle}>Lead each bullet with an <strong>action verb</strong> (Built, Designed, Led, Analyzed) and end with a <strong>quantifiable outcome</strong> ("reduced runtime 40%", "supported 250+ users", "grew membership from 8 to 32").</li>
          <li style={liStyle}>Order sections by what's strongest <em>for the role you're applying to</em>. Heavy project portfolio? Lead with Projects. New grad with internships? Lead with Experience.</li>
          <li style={liStyle}>The footnote in the template is real: once you have ~2 substantial roles, add a Summary at the top, move Skills directly below it, and push Education to the bottom.</li>
          <li style={liStyle}>Drop the Objective / Mission Statement unless the role explicitly cares (academia, fellowships, mission-driven nonprofits).</li>
          <li style={liStyle}>Skills section: list tools you'd be comfortable being asked about in an interview. If it's on your resume, expect them to ask. If it isn't, don't expect them to.</li>
          <li style={liStyle}>Export as <strong>PDF</strong> (never .docx) before sending. Naming convention: <span style={codeStyle}>Lastname_Firstname_Resume.pdf</span>.</li>
          <li style={liStyle}>Run it past at least one person in the field you're targeting before sending. Northeastern co-op advisors and the Career Design office are free and underused.</li>
        </ul>
      </Card>

      <Card dark={dark}>
        <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:8}}>
          <PixelIcon type="pen" size={20} />
          <h3 style={h3}>Upgrade Path: LaTeX Resume via Overleaf</h3>
        </div>
        <p style={body}>Once your resume settles into a stable structure, switching to LaTeX gives you sharper typography, perfectly consistent spacing, and version control that actually works. <strong>Overleaf</strong> is a browser-based LaTeX editor &mdash; no install needed.</p>
        <ol style={{paddingLeft:20,margin:"6px 0 14px"}}>
          <li style={liStyle}>Go to <span style={codeStyle}>overleaf.com</span> and click <em>Register</em>. The free tier is plenty for a resume; sign up with your Northeastern email if you want institutional perks.</li>
          <li style={liStyle}>From the dashboard, open <em>Templates</em> &rarr; <em>CVs and Résumés</em>. Solid student-friendly options: <strong>Jake's Resume</strong>, <strong>Deedy CV</strong>, and <strong>Awesome CV</strong>. Click <em>Open as Template</em> on whichever fits your style.</li>
          <li style={liStyle}>Edit the <span style={codeStyle}>main.tex</span> file in the left panel. The PDF preview rebuilds automatically on the right whenever you save.</li>
          <li style={liStyle}>Download the PDF (top-right download icon) and you're done. Re-export every time you make changes &mdash; don't send the .tex file.</li>
        </ol>
        <p style={body}><em>Tip:</em> keep the Google Doc as your brainstorming surface (easier to draft and rewrite bullets) and treat the LaTeX version as the production renderer.</p>
        <a href="https://www.overleaf.com" target="_blank" rel="noopener noreferrer" style={linkBtn}>open overleaf &rarr;</a>
      </Card>
    </Section>
  );
}

function ResumePage({ dark }) {
  return (
    <Section dark={dark} style={{ paddingTop: 100 }}>
      <SectionHeader dark={dark} title="Resume" icon="scroll" sub="The formal version of everything you just read, but with bullet points." />
      <Card dark={dark} style={{ textAlign: "center", padding: 40 }}>
        <PixelIcon type="scroll" size={36} color="#C49060" />
        <h3 style={{fontFamily:"'Courier New', monospace",fontSize:18,fontWeight:700,color:dark?"#F5E6D3":"#2D2926",margin:"16px 0 4px"}}>Amit Shenoy</h3>
        <p style={{fontFamily:"'DM Sans', sans-serif",fontSize:14,color:dark?"#9E958A":"#8A7E72",margin:"0 0 4px"}}>B.S. Bioengineering — Northeastern University (Dec 2025)</p>
        <p style={{fontFamily:"'Courier New', monospace",fontSize:13,color:"#C49060",margin:"0 0 20px"}}>GPA: 3.91 · Honors · Seeking July 2026</p>
        <div style={{display:"flex",gap:10,justifyContent:"center",flexWrap:"wrap"}}>
          <a href={import.meta.env.BASE_URL + "26_05_02_Broad_Res_AS.pdf"} target="_blank" rel="noopener noreferrer" style={{display:"inline-block",background:"#C49060",color:"#FFF",padding:"10px 22px",borderRadius:6,textDecoration:"none",fontFamily:"'Courier New', monospace",fontSize:13,fontWeight:700}}>view resume.pdf &rarr;</a>
          <a href={import.meta.env.BASE_URL + "26_05_02_Broad_Res_AS.pdf"} download="Shenoy_Amit_Resume.pdf" style={{display:"inline-block",background:"transparent",color:"#C49060",padding:"10px 22px",borderRadius:6,textDecoration:"none",fontFamily:"'Courier New', monospace",fontSize:13,fontWeight:700,border:"1px solid rgba(196,144,96,0.3)"}}>download &darr;</a>
        </div>
      </Card>
      <div style={{ marginTop: 24 }}>
        <h3 style={{fontFamily:"'Courier New', monospace",fontSize:16,fontWeight:700,color:dark?"#F5E6D3":"#2D2926",margin:"0 0 12px"}}>skills --list</h3>
        <div style={{display:"flex",flexWrap:"wrap",gap:6}}>
          {["Python","PyTorch","TensorFlow","scikit-learn","R","SQL","C++","BASH","Java","TypeScript","React","Node.js","SHAP","UMAP","Markov Chains","AWS","Azure","Docker","Git","CI/CD","SLURM","PyMOL","VMD","AAV production","ddPCR","qPCR","DOE"].map(function(s){return <Tag key={s} dark={dark}>{s}</Tag>;})}
        </div>
      </div>
    </Section>
  );
}

export default function App() {
  var _s = useState("Home"); var page = _s[0]; var setPage = _s[1];
  var _s2 = useState(false); var dark = _s2[0]; var setDark = _s2[1];
  useEffect(function() { window.scrollTo({ top: 0, behavior: "smooth" }); }, [page]);
  var bg = dark ? "#1E1C19" : "#FFFAF4";
  var fg = dark ? "#F5E6D3" : "#2D2926";
  return (
    <div style={{ minHeight: "100vh", background: bg, color: fg, fontFamily: "'DM Sans', sans-serif", transition: "background 0.4s ease, color 0.4s ease", position: "relative" }}>
      <style>{"\
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,wght@0,400;0,500;0,600;0,700;1,400&display=swap');\
        * { box-sizing: border-box; margin: 0; padding: 0; }\
        body { margin: 0; }\
        ::selection { background: rgba(196,144,96,0.3); }\
        .desktop-nav { display: flex !important; }\
        .mobile-nav, .mobile-dropdown { display: none !important; }\
        @media (max-width: 900px) {\
          .desktop-nav { display: none !important; }\
          .mobile-nav { display: flex !important; }\
          .mobile-dropdown { display: flex !important; }\
        }\
        @keyframes pixelFloat0 {\
          0%, 100% { transform: translateY(0) translateX(0); }\
          33% { transform: translateY(-30px) translateX(10px); }\
          66% { transform: translateY(-15px) translateX(-8px); }\
        }\
        @keyframes pixelFloat1 {\
          0%, 100% { transform: translateY(0) translateX(0); }\
          50% { transform: translateY(-20px) translateX(-12px); }\
        }\
        @keyframes pixelFloat2 {\
          0%, 100% { transform: translateY(0) translateX(0); }\
          25% { transform: translateY(-10px) translateX(15px); }\
          75% { transform: translateY(-25px) translateX(-5px); }\
        }\
      "}</style>
      <PixelParticles dark={dark} />
      <Nav page={page} setPage={setPage} dark={dark} setDark={setDark} />
      {page === "Home" && <HomePage dark={dark} setPage={setPage} />}
      {page === "About" && <AboutPage dark={dark} />}
      {page === "Work" && <WorkPage dark={dark} />}
      {page === "Community" && <CommunityPage dark={dark} />}
      {page === "Projects" && <ProjectsPage dark={dark} />}
      {page === "Rangers" && <RangersPage dark={dark} />}
      {page === "Wellness" && <WellnessPage dark={dark} />}
      {page === "Blog" && <BlogPage dark={dark} />}
      {page === "Contact" && <ContactPage dark={dark} />}
      {page === "Careers" && <CareersPage dark={dark} />}
      {page === "Resume" && <ResumePage dark={dark} />}
      <footer style={{ textAlign: "center", padding: "32px 24px", position: "relative", zIndex: 1, borderTop: "1px solid " + (dark ? "rgba(196,144,96,0.08)" : "rgba(196,144,96,0.06)") }}>
        <p style={{ fontFamily: "'Courier New', monospace", fontSize: 12, color: dark ? "#6B5E52" : "#BEB5AA" }}>&copy; 2026 amit.sh &middot; built with care, caffeine, and an unreasonable number of terminal prompts</p>
      </footer>
    </div>
  );
}
