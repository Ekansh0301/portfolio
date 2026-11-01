import { useEffect, useRef, useState } from "react";

/**
 * The idea at the heart of the project: the Naming Server answers "where is it?"
 * and then steps out of the way, so file bytes flow client ↔ storage server
 * directly. Two clients loop through reads; click a storage server to drop it.
 * A reconnecting server re-syncs its index with the Naming Server's tree.
 */
const NS = { x: 200, y: 36 };
const CLIENTS = [{ x: 56, y: 118, n: "Client A" }, { x: 344, y: 118, n: "Client B" }];
const SS = [{ x: 70, y: 232 }, { x: 200, y: 232 }, { x: 330, y: 232 }];
const FILES = ["/docs/paper.pdf", "/src/main.c", "/media/talk.mp3", "/docs/paper.pdf", "/log/0.log", "/src/main.c"]; // repeats → LRU hits
const OWNER = [0, 1, 2, 0, 1, 1];
const CYCLE = 4600;

const lerp = (a: { x: number; y: number }, b: { x: number; y: number }, t: number) => ({ x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t });

export default function Planes() {
  const [t, setT] = useState(0);
  const [down, setDown] = useState<number | null>(null);
  const [sync, setSync] = useState<number | null>(null);
  const start = useRef(performance.now());
  const downRef = useRef<number | null>(null);
  const mb = useRef(0);
  const prev = useRef(performance.now());

  useEffect(() => { downRef.current = down; }, [down]);

  useEffect(() => {
    let raf = 0;
    const loop = (now: number) => {
      const dt = now - prev.current;
      prev.current = now;
      const el = now - start.current;
      CLIENTS.forEach((_, ci) => {
        const tt = el + (ci ? CYCLE / 2 : 0);
        const p = (tt % CYCLE) / CYCLE;
        const f = (Math.floor(tt / CYCLE) * 2 + ci) % FILES.length;
        if (p >= 0.27 && downRef.current !== OWNER[f]) mb.current += dt * 0.011; // bytes only flow while streaming
      });
      setT(el);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, []);

  const drop = (i: number) => {
    if (down === i) { setDown(null); setSync(i); window.setTimeout(() => setSync(null), 1800); }
    else setDown(i);
  };

  const rows = CLIENTS.map((c, ci) => {
    const tt = t + (ci ? CYCLE / 2 : 0);
    const cyc = Math.floor(tt / CYCLE), p = (tt % CYCLE) / CYCLE;
    const f = (cyc * 2 + ci) % FILES.length;
    const ss = OWNER[f];
    return { c, ci, p, f, ss, dead: down === ss, cyc };
  });
  // Each lookup is one request plus one reply, and the count is a pure function of time.
  const msgs = rows.reduce((a, r) => a + 2 * (r.cyc + (r.p >= 0.27 ? 1 : 0)), 0);

  return (
    <div className="stage">
      <div className="stage-h">
        <span className="mono">control plane vs data plane · click a storage server</span>
      </div>
      <svg viewBox="0 0 400 276" role="img" aria-label="Clients ask the Naming Server where a file is, then stream directly from a storage server" style={{ maxHeight: 290 }}>
        {SS.map((s, i) => <line key={i} x1={NS.x} y1={NS.y + 18} x2={s.x} y2={s.y - 20} stroke="var(--rule)" strokeDasharray="3 4" />)}
        {rows.map(({ c, ci, p, ss, dead }) => {
          const meta = p < 0.27;
          const ssn = SS[ss];
          const toNs = p < 0.13 ? lerp(c, NS, p / 0.13) : null;
          const back = p >= 0.13 && p < 0.27 ? lerp(NS, c, (p - 0.13) / 0.14) : null;
          return (
            <g key={ci}>
              <line x1={c.x} y1={c.y} x2={NS.x} y2={NS.y} stroke="var(--ink-3)" strokeDasharray="4 4" strokeWidth="1.2" opacity="0.6" />
              <line x1={c.x} y1={c.y} x2={ssn.x} y2={ssn.y} stroke={!meta && !dead ? "var(--accent)" : "var(--rule)"} strokeWidth={!meta && !dead ? 3 : 1.5} style={{ transition: "stroke 0.3s" }} />
              {toNs && <circle cx={toNs.x} cy={toNs.y} r="4.5" fill="var(--ink)" />}
              {back && <circle cx={back.x} cy={back.y} r="4.5" fill="var(--accent)" />}
              {!meta && !dead && Array.from({ length: 7 }, (_, k) => {
                const q = (((p - 0.27) * 5.2 + k / 7) % 1 + 1) % 1;
                const d = lerp(ssn, c, q);
                return <rect key={k} x={d.x - 3} y={d.y - 3} width="6" height="6" rx="1.5" fill="var(--accent)" />;
              })}
              {!meta && dead && <text x={(c.x + ssn.x) / 2} y={(c.y + ssn.y) / 2} textAnchor="middle" fontSize="12" style={{ fill: "var(--bad)" }}>unavailable ✗</text>}
            </g>
          );
        })}
        {/* nodes */}
        <rect x={NS.x - 82} y={NS.y - 18} width="164" height="36" rx="9" fill="var(--card)" stroke="var(--ink-2)" strokeWidth="1.5" />
        <text x={NS.x} y={NS.y - 2} textAnchor="middle" fontSize="11" style={{ fill: "var(--ink)" }}>Naming Server</text>
        <text x={NS.x} y={NS.y + 11} textAnchor="middle" fontSize="8.5" style={{ fill: "var(--ink-3)" }}>tree + LRU cache · no file bytes</text>
        {CLIENTS.map((c, ci) => (
          <g key={c.n}>
            <rect x={c.x - 34} y={c.y - 15} width="68" height="30" rx="8" fill="var(--card)" stroke="var(--ink-2)" strokeWidth="1.5" />
            <text x={c.x} y={c.y + 4} textAnchor="middle" fontSize="10.5" style={{ fill: "var(--ink)" }}>{c.n}</text>
            <text x={c.x} y={c.y - 22} textAnchor="middle" fontSize="8.5" style={{ fill: "var(--accent)" }}>{FILES[rows[ci].f]}</text>
          </g>
        ))}
        {SS.map((s, i) => (
          <g key={i} role="button" tabIndex={0} aria-label={`Storage server ${i + 1}: ${down === i ? "disconnected, click to reconnect" : "click to disconnect"}`} style={{ cursor: "pointer", outline: "none" }} onClick={() => drop(i)} onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && (e.preventDefault(), drop(i))}>
            <rect x={s.x - 46} y={s.y - 20} width="92" height="40" rx="9" fill={down === i ? "var(--bg-2)" : "var(--card)"} stroke={down === i ? "var(--bad)" : sync === i ? "var(--ok)" : "var(--ink-2)"} strokeWidth="1.5" strokeDasharray={down === i ? "4 3" : "0"} />
            <text x={s.x} y={s.y - 2} textAnchor="middle" fontSize="11" style={{ fill: down === i ? "var(--bad)" : "var(--ink)" }}>Storage {i + 1}</text>
            <text x={s.x} y={s.y + 11} textAnchor="middle" fontSize="8.5" style={{ fill: sync === i ? "var(--ok)" : "var(--ink-3)" }}>{down === i ? "disconnected" : sync === i ? "re-syncing index…" : "POSIX threads"}</text>
          </g>
        ))}
      </svg>
      <div className="mono" style={{ display: "flex", justifyContent: "space-between", gap: "0.8rem", flexWrap: "wrap" }}>
        <span>Naming Server handled <b className="acc">{msgs}</b> tiny messages</span>
        <span>storage servers streamed <b className="acc">{Math.round(mb.current)}</b> MB directly</span>
      </div>
    </div>
  );
}
