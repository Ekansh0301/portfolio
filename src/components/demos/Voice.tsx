import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Vox (TARS) on a desktop. Hold Right Ctrl, talk, let go. Tool names and tiers
 * are from the repo's TOOLS.md (68 tools; T0 read-only, T1 reversible, risky
 * ones ask first, sudo is never available). Stage timings are the README's
 * measurements on a GTX 1650 Mobile: Whisper small.en ~0.5 s, first word from
 * Qwen 3.5-4B ~0.35 s, Kokoro's first audio chunk ~0.8 s, about 1.6 s end to
 * end. The orange border is what TARS draws when it clicks or types.
 */
type Cmd = { chip: string; say: string; tool: string; tier: string };
const CMDS: Cmd[] = [
  { chip: "screen", say: "What's on my screen right now?", tool: "read_screen", tier: "T0 · runs at once" },
  { chip: "search", say: "Open Firefox and look up Raft leader election.", tool: "open_url → type_into", tier: "T1 · reversible, logged" },
  { chip: "trash", say: "Move the build folder in Downloads to the trash.", tool: "trash_path", tier: "asks first" },
  { chip: "timer", say: "Set a timer for ten minutes.", tool: "set_timer", tier: "T1 · reversible, logged" },
  { chip: "find PDFs", say: "Find the PDFs I changed this week.", tool: "find_files", tier: "T0 · runs at once" },
  { chip: "volume", say: "Turn the volume down a bit.", tool: "set_volume", tier: "T1 · reversible, logged" },
  { chip: "disk", say: "How full is my disk?", tool: "run_command", tier: "T0 · read-only sandbox" },
  { chip: "sudo", say: "Run sudo apt upgrade.", tool: "run_command", tier: "never available" },
];
const STAGES = [{ n: "Whisper small.en", t: 0.5 }, { n: "Qwen 3.5 4B · Q4_K_M", t: 0.35 }, { n: "Kokoro", t: 0.8 }];
const QUERY = "raft leader election";
const ORANGE = "#ff8a1f";
const PDFS = [["paper-draft.pdf", "today"], ["invoice-march.pdf", "tue"], ["slides-final.pdf", "mon"]];

type Phase = "idle" | "listening" | "thinking" | "acting" | "ask" | "done";

export default function Voice() {
  const [phase, setPhase] = useState<Phase>("idle");
  const [sel, setSel] = useState(0);
  const [stage, setStage] = useState(-1);
  const [scan, setScan] = useState(false);
  const [ff, setFf] = useState(false);
  const [typed, setTyped] = useState(0);
  const [term, setTerm] = useState<string[] | null>(null);
  const [timer, setTimer] = useState<number | null>(null);
  const [vol, setVol] = useState<number | null>(null);
  const [pdfs, setPdfs] = useState(false);
  const [cursor, setCursor] = useState({ x: 60, y: 55 });
  const [trashed, setTrashed] = useState(false);
  const [reply, setReply] = useState("");
  const timers = useRef<number[]>([]);
  const holding = useRef(false);
  const selRef = useRef(sel);
  useEffect(() => { selRef.current = sel; }, [sel]);
  const clear = () => { timers.current.forEach(clearTimeout); timers.current = []; };
  const at = (ms: number, f: () => void) => timers.current.push(window.setTimeout(f, ms));
  useEffect(() => clear, []);

  // The timer pill really counts down.
  useEffect(() => {
    if (timer === null) return;
    const id = window.setInterval(() => setTimer((t) => (t === null ? t : Math.max(0, t - 1))), 1000);
    return () => clearInterval(id);
  }, [timer === null]); // eslint-disable-line react-hooks/exhaustive-deps

  const press = useCallback(() => {
    if (holding.current) return;
    holding.current = true; clear();
    setStage(-1); setScan(false); setTyped(0); setReply(""); setFf(false); setTerm(null); setVol(null); setPdfs(false); setTrashed(false);
    setCursor({ x: 60, y: 55 }); setPhase("listening");
  }, []);

  const finish = useCallback((txt: string) => { setReply(txt); setPhase("done"); }, []);

  const release = useCallback(() => {
    if (!holding.current) return;
    holding.current = false;
    const k = selRef.current;
    setPhase("thinking");
    let t = 0;
    STAGES.forEach((s, n) => { at(t * 1000, () => setStage(n)); t += s.t; });
    at(t * 1000 + 150, () => { setStage(STAGES.length); setPhase("acting"); });
    const b = t * 1000 + 300;
    switch (k) {
      case 0: at(b, () => setScan(true)); at(b + 1500, () => { setScan(false); finish("“VS Code with your README open, and a Downloads folder. Nothing urgent.”"); }); break;
      case 1:
        at(b, () => setCursor({ x: 50, y: 93 })); at(b + 700, () => setFf(true)); at(b + 1300, () => setCursor({ x: 70, y: 27 }));
        for (let c = 1; c <= QUERY.length; c++) at(b + 1700 + c * 70, () => setTyped(c));
        at(b + 1700 + QUERY.length * 70 + 500, () => finish("“Search is up. The first result is the Raft paper summary.”")); break;
      case 2: at(b, () => setCursor({ x: 22, y: 58 })); at(b + 600, () => setPhase("ask")); break;
      case 3: at(b + 300, () => setTimer(600)); at(b + 900, () => finish("“Timer's running: ten minutes.”")); break;
      case 4: at(b, () => setCursor({ x: 24, y: 52 })); at(b + 700, () => setPdfs(true)); at(b + 1500, () => finish("“Three PDFs, newest first. The top one is paper-draft.”")); break;
      case 5: at(b, () => setVol(60)); at(b + 500, () => setVol(50)); at(b + 1600, () => { setVol(null); finish("“Volume's at fifty percent.”"); }); break;
      case 6:
        at(b, () => setTerm(["$ "])); for (let c = 1; c <= 7; c++) at(b + 300 + c * 70, () => setTerm([`$ ${"df -h /".slice(0, c)}`]));
        at(b + 1100, () => setTerm(["$ df -h /", "/dev/nvme0n1p2  466G  284G  158G  65% /"]));
        at(b + 1900, () => finish("“Your main disk is sixty-five percent full.”")); break;
      default:
        at(b, () => setTerm(["$ "])); for (let c = 1; c <= 20; c++) at(b + 300 + c * 55, () => setTerm([`$ ${"sudo apt upgrade".slice(0, c)}`]));
        at(b + 1500, () => setTerm(["$ sudo apt upgrade", "sudo: not available in the sandbox"]));
        at(b + 2200, () => finish("“I can't use sudo. It's never available to me.”"));
    }
  }, [finish]);

  useEffect(() => {
    const d = (e: KeyboardEvent) => { if (e.code === "ControlRight" && !e.repeat) press(); };
    const u = (e: KeyboardEvent) => { if (e.code === "ControlRight") release(); };
    window.addEventListener("keydown", d); window.addEventListener("keyup", u);
    return () => { window.removeEventListener("keydown", d); window.removeEventListener("keyup", u); };
  }, [press, release]);

  const answer = (ok: boolean) => {
    if (ok) setTrashed(true);
    finish(ok ? "“Moved build to the Trash. You can restore it from there.”" : "“Okay, I left it alone.”");
  };

  const C = CMDS[sel];
  const busy = phase === "thinking" || phase === "acting" || phase === "ask";
  const border = phase === "acting" && (sel === 1 ? ff : sel === 4 ? pdfs : sel === 6 || sel === 7 ? term !== null : false);
  const win = (extra: React.CSSProperties, title: string, children: React.ReactNode) => (
    <div style={{ position: "absolute", background: "#1c1d21", border: "1px solid #34363c", borderRadius: 7, overflow: "hidden", boxShadow: "0 8px 22px rgba(0,0,0,0.45)", ...extra }}>
      <div style={{ height: 16, background: "#27292e", display: "flex", alignItems: "center", gap: 4, padding: "0 6px" }}>
        {["#ff5f57", "#febc2e", "#28c840"].map((c) => <span key={c} style={{ width: 6, height: 6, borderRadius: 3, background: c }} />)}
        <span style={{ fontSize: 8, color: "#9ba0aa", marginLeft: 6, fontFamily: "var(--mono)" }}>{title}</span>
      </div>
      {children}
    </div>
  );
  const mmss = (s: number) => `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;

  return (
    <div className="stage" style={{ gap: "0.7rem" }}>
      <div className="stage-h">
        <span className="mono">push-to-talk · everything local</span>
        <span className="mono acc">≈ 1.6 s from key release to first word</span>
      </div>

      <div className="row">
        {CMDS.map((c, k) => <button key={c.chip} className={`sm ${sel === k ? "on" : ""}`} disabled={busy || phase === "listening"} onClick={() => { setSel(k); setPhase("idle"); setReply(""); setStage(-1); setFf(false); setTerm(null); setPdfs(false); setVol(null); }}>{c.chip}</button>)}
      </div>

      {/* the desktop */}
      <div style={{ position: "relative", aspectRatio: "16 / 8.6", borderRadius: 10, overflow: "hidden", background: "linear-gradient(135deg, #1b2438 0%, #2a2140 55%, #3b2330 100%)", outline: border || scan ? `3px solid ${ORANGE}` : "3px solid transparent", outlineOffset: -3, boxShadow: border ? `inset 0 0 28px ${ORANGE}66` : "none", transition: "outline-color 0.2s, box-shadow 0.2s" }}>
        <div style={{ position: "absolute", inset: "0 0 auto 0", height: 14, background: "rgba(10,10,14,0.55)", display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0 8px", fontFamily: "var(--mono)", fontSize: 8, color: "#cfd2da" }}>
          <span>Activities</span>
          <span style={{ display: "flex", gap: 10 }}>{timer !== null && <span style={{ color: ORANGE }}>⏱ {mmss(timer)}</span>}<span>10:42</span></span>
          <span style={{ color: phase === "listening" ? ORANGE : "#cfd2da" }}>● TARS</span>
        </div>
        {win({ left: "4%", top: "13%", width: "52%", height: "62%" }, "README.md — VS Code",
          <div style={{ padding: "6px 8px", fontFamily: "var(--mono)", fontSize: 8, color: "#a9b1c6", lineHeight: 1.55 }}>
            <div style={{ color: "#7aa2f7" }}># Voxd</div><div>Hold Right Ctrl, talk,</div><div>let go.</div>
            {[70, 90, 55, 80, 40, 66].map((w, k) => <div key={k} style={{ height: 4, width: `${w}%`, background: "#2d3040", borderRadius: 2, marginTop: 5 }} />)}
          </div>)}
        {win({ left: "9%", top: "40%", width: "38%", height: "42%" }, pdfs ? "Search — *.pdf this week" : "Files — ~/Downloads",
          <div style={{ padding: "5px 8px", fontFamily: "var(--mono)", fontSize: 8, color: "#cfd2da", lineHeight: 1.7 }}>
            {pdfs ? PDFS.map(([n, d], k) => <div key={n} style={{ color: k === 0 ? ORANGE : "#cfd2da" }}>📄 {n} <span style={{ color: "#8b90a0" }}>· {d}</span></div>) : <>
              <div>📄 invoice-march.pdf</div><div>📄 notes.txt</div>
              <div style={{ color: trashed ? "#555" : ORANGE, textDecoration: trashed ? "line-through" : "none", opacity: trashed ? 0.4 : 1, transition: "all 0.5s" }}>📁 build/ <span style={{ color: "#8b90a0" }}>212 MB</span></div>
              <div>🗜 data.zip</div></>}
          </div>)}
        {ff && win({ right: "3%", top: "14%", width: "46%", height: "64%", animation: "popin 0.35s ease-out" }, "Firefox",
          <div>
            <div style={{ margin: "5px 6px", height: 11, borderRadius: 6, background: "#2e3036", fontFamily: "var(--mono)", fontSize: 7, color: "#9ba0aa", display: "flex", alignItems: "center", padding: "0 6px" }}>duckduckgo.com</div>
            <div style={{ margin: "10px 10px 6px", height: 16, borderRadius: 8, background: "#f4f4f6", fontFamily: "var(--mono)", fontSize: 9, color: "#222", display: "flex", alignItems: "center", padding: "0 8px" }}>{QUERY.slice(0, typed)}{phase === "acting" && typed < QUERY.length && <span className="caret">|</span>}</div>
            {typed >= QUERY.length && <div style={{ padding: "2px 12px", fontFamily: "var(--mono)", fontSize: 7.5, color: "#aab0c0", lineHeight: 1.6 }}><div style={{ color: "#8ab4f8" }}>In Search of an Understandable Consensus Algorithm</div><div>raft.github.io · the Raft paper, explained…</div><div style={{ color: "#8ab4f8", marginTop: 4 }}>Raft (algorithm) — Wikipedia</div></div>}
          </div>)}
        {term && win({ right: "3%", top: "34%", width: "48%", height: "40%", animation: "popin 0.35s ease-out" }, "Terminal — sandbox",
          <div style={{ padding: "6px 8px", fontFamily: "var(--mono)", fontSize: 8.5, color: "#c8f0c0", lineHeight: 1.6 }}>{term.map((l, k) => <div key={k} style={{ color: l.startsWith("sudo:") ? "#ff9d8f" : "#c8f0c0" }}>{l}</div>)}</div>)}
        {vol !== null && (
          <div style={{ position: "absolute", left: "50%", top: "42%", transform: "translateX(-50%)", background: "rgba(10,10,14,0.8)", borderRadius: 10, padding: "8px 14px", fontFamily: "var(--mono)", fontSize: 9, color: "#eceef3", textAlign: "center", width: 120 }}>
            🔉 Volume<div style={{ height: 5, background: "#33363f", borderRadius: 3, marginTop: 6 }}><div style={{ width: `${vol}%`, height: "100%", background: ORANGE, borderRadius: 3, transition: "width 0.5s" }} /></div>
          </div>
        )}
        {scan && <div style={{ position: "absolute", left: 0, right: 0, height: 22, background: `linear-gradient(180deg, transparent, ${ORANGE}55, transparent)`, animation: "sweep 1.4s ease-in-out" }} />}
        {phase === "ask" && (
          <div style={{ position: "absolute", left: "50%", top: "50%", transform: "translate(-50%,-50%)", background: "#1e2026", border: `1.5px solid ${ORANGE}`, borderRadius: 9, padding: "0.7rem 0.9rem", width: "70%", boxShadow: "0 12px 30px rgba(0,0,0,0.5)", textAlign: "center" }}>
            <div style={{ fontFamily: "var(--mono)", fontSize: 9, color: ORANGE, marginBottom: 4 }}>TARS asks first</div>
            <div style={{ fontFamily: "var(--serif)", fontSize: 12, color: "#eceef3", lineHeight: 1.3 }}>Move <b>~/Downloads/build</b> (212 MB) to the Trash?</div>
            <div style={{ display: "flex", gap: 8, justifyContent: "center", marginTop: 8 }}>
              <button onClick={() => answer(true)} className="sm on" style={{ background: ORANGE, borderColor: ORANGE, color: "#1a0b05" }}>Allow</button>
              <button onClick={() => answer(false)} className="sm" style={{ color: "#cfd2da", borderColor: "#444" }}>Cancel</button>
            </div>
          </div>
        )}
        <div style={{ position: "absolute", left: `${cursor.x}%`, top: `${cursor.y}%`, transition: "left 0.6s var(--ease), top 0.6s var(--ease)", fontSize: 14, color: "#fff", filter: "drop-shadow(0 1px 2px #000)", pointerEvents: "none" }}>➤</div>
        <div style={{ position: "absolute", left: "50%", bottom: 4, transform: "translateX(-50%)", display: "flex", gap: 5, padding: "3px 7px", background: "rgba(10,10,14,0.55)", borderRadius: 8 }}>
          {["F", "‹›", "▸", "▤"].map((g) => <span key={g} style={{ width: 14, height: 14, borderRadius: 4, background: "#2c2f38", color: "#cfd2da", fontSize: 8, display: "grid", placeItems: "center", fontFamily: "var(--mono)" }}>{g}</span>)}
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "auto 1fr", gap: "0.9rem", alignItems: "center" }}>
        <button
          onPointerDown={(e) => { (e.target as HTMLElement).setPointerCapture(e.pointerId); press(); }}
          onPointerUp={release} onPointerCancel={release}
          style={{ width: 70, height: 70, borderRadius: "50%", border: "2px solid var(--accent)", background: phase === "listening" ? "var(--accent)" : "transparent", color: phase === "listening" ? "var(--accent-ink)" : "var(--accent)", fontFamily: "var(--mono)", fontSize: "0.62rem", letterSpacing: "0.08em", textTransform: "uppercase", transition: "all 0.2s", transform: phase === "listening" ? "scale(1.07)" : "none", touchAction: "none", userSelect: "none" }}
          aria-label="Hold to talk (or hold Right Ctrl)">{phase === "listening" ? "listening" : "hold"}</button>
        <div>
          <div style={{ fontFamily: "var(--serif)", fontStyle: "italic", fontSize: "1.08rem", lineHeight: 1.3 }}>
            {phase === "idle" ? <span className="dim">Hold, then say: “{C.say}”</span> : <>“{C.say}”</>}
          </div>
          <div className="mono" style={{ fontSize: "0.68rem", marginTop: 4, minHeight: "1.5em" }}>
            {(phase === "acting" || phase === "ask" || phase === "done") && <><span className="dim">tool </span><span className="acc">{C.tool}</span> <span className="dim">· {C.tier}</span></>}
          </div>
          <div style={{ fontSize: "0.9rem", color: "var(--ink)", minHeight: "1.4em" }}>{phase === "done" && reply ? <><span className="dim mono" style={{ fontSize: "0.66rem" }}>TARS </span>{reply}</> : null}</div>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0,1fr))", gap: 8 }}>
        {STAGES.map((s, k) => (
          <div key={s.n}>
            <div className="bar" style={{ height: 6 }}><i style={{ width: stage >= k ? "100%" : "0%", transition: stage === k ? `width ${s.t}s linear` : "none", opacity: stage >= k ? 1 : 0.2 }} /></div>
            <div className="mono" style={{ fontSize: "0.62rem", marginTop: 3, color: stage >= k ? "var(--ink)" : "var(--ink-3)" }}>{s.n} · {s.t}s</div>
          </div>
        ))}
      </div>
      <div className="chips"><span className="chip">68 tools</span><span className="chip">3.7 GB VRAM (GTX 1650)</span><span className="chip">no cloud</span><span className="chip">tap Right Ctrl to stop</span></div>
    </div>
  );
}
