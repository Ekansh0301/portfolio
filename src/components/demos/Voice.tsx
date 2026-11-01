import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Vox (TARS): hold Right Ctrl, talk, let go. Stage timings are the README's
 * measurements on a GTX 1650 Mobile: Whisper small.en ~0.5 s, first word from
 * Qwen 3.5-4B ~0.35 s, Kokoro's first audio chunk ~0.8 s, about 1.6 s end to end.
 */
const CMDS = [
  { say: "What's on my screen right now?", does: "reads the screen", reply: "“A terminal and a half-written README. Want me to open the diff?”", risky: false },
  { say: "Open Firefox and look up Raft leader election.", does: "drives Firefox", reply: "“Search is up. Reading you the first result.”", risky: false },
  { say: "Delete everything in my downloads folder.", does: "sandboxed shell", reply: "“That deletes files. Should I go ahead?”", risky: true },
];
const STAGES = [
  { n: "Whisper small.en", t: 0.5 },
  { n: "Qwen 3.5 4B · Q4_K_M", t: 0.35 },
  { n: "Kokoro", t: 0.8 },
];

export default function Voice() {
  const [phase, setPhase] = useState<"idle" | "listening" | "thinking" | "done">("idle");
  const [i, setI] = useState(0);
  const [stage, setStage] = useState(-1);
  const timers = useRef<number[]>([]);
  const holding = useRef(false);

  const clear = () => { timers.current.forEach(clearTimeout); timers.current = []; };
  useEffect(() => clear, []);

  const press = useCallback(() => {
    if (holding.current) return;
    holding.current = true;
    clear();
    setStage(-1);
    setPhase("listening");
  }, []);

  const release = useCallback(() => {
    if (!holding.current) return;
    holding.current = false;
    setPhase("thinking");
    let at = 0;
    STAGES.forEach((s, k) => {
      timers.current.push(window.setTimeout(() => setStage(k), at * 1000));
      at += s.t;
    });
    timers.current.push(window.setTimeout(() => { setStage(STAGES.length); setPhase("done"); setI((x) => (x + 1) % CMDS.length); }, at * 1000 + 200));
  }, []);

  useEffect(() => {
    const down = (e: KeyboardEvent) => { if (e.code === "ControlRight" && !e.repeat) press(); };
    const up = (e: KeyboardEvent) => { if (e.code === "ControlRight") release(); };
    window.addEventListener("keydown", down); window.addEventListener("keyup", up);
    return () => { window.removeEventListener("keydown", down); window.removeEventListener("keyup", up); };
  }, [press, release]);

  const cur = CMDS[(i + CMDS.length - (phase === "done" ? 1 : 0)) % CMDS.length];
  const next = CMDS[i];
  const shown = phase === "idle" || phase === "listening" ? next : cur;

  return (
    <div className="stage" style={{ justifyContent: "space-between" }}>
      <div className="stage-h">
        <span className="mono">push-to-talk · fully local</span>
        <span className="mono acc">≈ 1.6 s from key release to first word</span>
      </div>

      <div style={{ display: "grid", placeItems: "center", gap: "0.8rem", padding: "0.4rem 0" }}>
        <button
          onPointerDown={(e) => { (e.target as HTMLElement).setPointerCapture(e.pointerId); press(); }}
          onPointerUp={release} onPointerCancel={release}
          style={{ width: 92, height: 92, borderRadius: "50%", border: "2px solid var(--accent)", background: phase === "listening" ? "var(--accent)" : "transparent", color: phase === "listening" ? "var(--accent-ink)" : "var(--accent)", fontFamily: "var(--mono)", fontSize: "0.68rem", letterSpacing: "0.08em", textTransform: "uppercase", transition: "all 0.2s", transform: phase === "listening" ? "scale(1.06)" : "none", touchAction: "none", userSelect: "none" }}
          aria-label="Hold to talk (or hold Right Ctrl)"
        >
          {phase === "listening" ? "listening" : "hold"}
        </button>
        <div style={{ display: "flex", gap: 3, alignItems: "center", height: 26 }} aria-hidden>
          {Array.from({ length: 28 }, (_, k) => (
            <span key={k} style={{ width: 3, borderRadius: 2, background: "var(--accent)", height: phase === "listening" ? 22 : 4, opacity: phase === "listening" ? 1 : 0.35, transformOrigin: "center", animation: phase === "listening" ? `wave ${0.5 + (k % 7) * 0.09}s ease-in-out ${k * 0.03}s infinite alternate` : "none", transition: "height 0.25s" }} />
          ))}
        </div>
        <div style={{ fontFamily: "var(--serif)", fontStyle: "italic", fontSize: "1.1rem", textAlign: "center", minHeight: "1.6em" }}>
          {phase === "idle" ? <span className="dim">Hold, then say: “{shown.say}”</span> : <>“{shown.say}”</>}
        </div>
      </div>

      <div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0,1fr))", gap: 6 }}>
          {STAGES.map((s, k) => (
            <div key={s.n}>
              <div className="bar" style={{ height: 6 }}><i style={{ width: stage > k ? "100%" : stage === k ? "100%" : "0%", transition: stage === k ? `width ${s.t}s linear` : "none", background: "var(--accent)", opacity: stage >= k ? 1 : 0.2 }} /></div>
              <div className="mono" style={{ fontSize: "0.6rem", marginTop: 3, color: stage >= k ? "var(--ink)" : "var(--ink-3)" }}>{s.n} · {s.t}s</div>
            </div>
          ))}
        </div>
        <div className="log" style={{ marginTop: "0.6rem", minHeight: "3.4em" }}>
          {phase === "done" ? (
            <>
              <div><span className="dim">acts: </span><span className="acc">{cur.does}</span>{cur.risky && <span className="bad"> · risky, so it asks first</span>}</div>
              <div>TARS: {cur.reply}</div>
            </>
          ) : <span className="dim">Hold the button (or Right Ctrl). It never leaves your machine, and it asks before anything risky.</span>}
        </div>
      </div>
      <div className="chips"><span className="chip">67 tools</span><span className="chip">3.7 GB VRAM</span><span className="chip">no cloud</span><span className="chip">stop with a tap</span></div>
    </div>
  );
}
