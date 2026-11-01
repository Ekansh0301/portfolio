import { useEffect, useRef, useState } from "react";

/**
 * A toy of the Director's core claim: with one fixed reward weighting a policy
 * collapses to a single style; with intent-conditioned weights it specialises.
 * Real REINFORCE with a baseline over a 5-action bandit, trained live in the page.
 * It is a model of the idea, not the PPO/QLoRA pipeline.
 */
const CRITICS = ["Narrative", "Causal", "World", "Voice"];
const ACTIONS = ["Combat beat", "Banter", "Describe room", "Reveal secret", "Wander off"];
const MEAN = [
  [0.45, 0.85, 0.5, 0.3],
  [0.55, 0.35, 0.4, 0.9],
  [0.35, 0.5, 0.9, 0.35],
  [0.9, 0.6, 0.55, 0.6],
  [0.2, 0.15, 0.6, 0.3],
];
const INTENTS = ["Take action", "Talk to NPC", "Explore", "Push the plot"];
const W0 = [
  [0.1, 0.6, 0.2, 0.1],
  [0.15, 0.1, 0.1, 0.65],
  [0.1, 0.1, 0.7, 0.1],
  [0.65, 0.15, 0.1, 0.1],
];

const norm = (w: number[]) => { const s = w.reduce((a, b) => a + b, 0) || 1; return w.map((x) => x / s); };
const soft = (l: number[]) => { const m = Math.max(...l); const e = l.map((x) => Math.exp(x - m)); const s = e.reduce((a, b) => a + b, 0); return e.map((x) => x / s); };
const dot = (a: number[], b: number[]) => a.reduce((s, x, i) => s + x * b[i], 0);
const expected = (pi: number[], w: number[]) => pi.reduce((s, p, a) => s + p * dot(norm(w), MEAN[a]), 0);

function rng(seed: number) {
  return () => { seed = (seed + 0x6d2b79f5) | 0; let t = Math.imul(seed ^ (seed >>> 15), 1 | seed); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}

type Model = { cond: number[][]; fixed: number[]; bCond: number[]; bFixed: number; steps: number; hist: number[][] };
const fresh = (): Model => ({ cond: INTENTS.map(() => ACTIONS.map(() => 0)), fixed: ACTIONS.map(() => 0), bCond: INTENTS.map(() => 0.5), bFixed: 0.5, steps: 0, hist: [] });

export default function Critics() {
  const [weights, setWeights] = useState(W0.map((w) => [...w]));
  const [sel, setSel] = useState(0);
  const [running, setRunning] = useState(false);
  const [, bump] = useState(0);
  const m = useRef<Model>(fresh());
  const rand = useRef(rng(7));
  const wRef = useRef(weights);
  useEffect(() => { wRef.current = weights; }, [weights]);

  useEffect(() => {
    if (!running) return;
    const id = window.setInterval(() => {
      const M = m.current, W = wRef.current;
      const gauss = () => Math.sqrt(-2 * Math.log(rand.current() + 1e-9)) * Math.cos(2 * Math.PI * rand.current());
      for (let s = 0; s < 8; s++) {
        const intent = Math.floor(rand.current() * INTENTS.length);
        const sample = (pi: number[]) => { let u = rand.current(), a = 0; while (a < pi.length - 1 && u > pi[a]) u -= pi[a++]; return a; };
        const reward = (a: number, w: number[]) => dot(norm(w), MEAN[a].map((x) => x + 0.12 * gauss()));
        // intent-conditioned policy
        const pc = soft(M.cond[intent]); const ac = sample(pc); const rc = reward(ac, W[intent]);
        for (let a = 0; a < ACTIONS.length; a++) M.cond[intent][a] += 0.9 * (rc - M.bCond[intent]) * ((a === ac ? 1 : 0) - pc[a]);
        M.bCond[intent] += 0.05 * (rc - M.bCond[intent]);
        // one policy that only ever sees the average weighting
        const avg = CRITICS.map((_, i) => W.reduce((s, w) => s + norm(w)[i], 0) / W.length);
        const pf = soft(M.fixed); const af = sample(pf); const rf = reward(af, avg);
        for (let a = 0; a < ACTIONS.length; a++) M.fixed[a] += 0.9 * (rf - M.bFixed) * ((a === af ? 1 : 0) - pf[a]);
        M.bFixed += 0.05 * (rf - M.bFixed);
        M.steps++;
      }
      const evalC = INTENTS.reduce((s, _, i) => s + expected(soft(M.cond[i]), W[i]), 0) / INTENTS.length;
      const evalF = INTENTS.reduce((s, _, i) => s + expected(soft(M.fixed), W[i]), 0) / INTENTS.length;
      M.hist = [...M.hist.slice(-59), [evalC, evalF]];
      bump((x) => x + 1);
      if (M.steps >= 4000) setRunning(false);
    }, 60);
    return () => clearInterval(id);
  }, [running]);

  const M = m.current; // eslint-disable-line -- mutated by the training loop, re-rendered via bump()
  const reset = () => { setRunning(false); m.current = fresh(); rand.current = rng(7); bump((x) => x + 1); };
  const setW = (i: number, v: number) => setWeights((ws) => ws.map((w, k) => (k === sel ? w.map((x, j) => (j === i ? v : x)) : w)));
  const last = M.hist[M.hist.length - 1];
  const polyline = (idx: number) => M.hist.map((h, i) => `${(i / 59) * 100},${40 - ((h[idx] - 0.3) / 0.45) * 36}`).join(" ");

  return (
    <div className="stage">
      <div className="stage-h">
        <span className="mono">REINFORCE · {M.steps} steps · toy bandit</span>
        <div className="row">
          <button className={`sm ${running ? "on" : ""}`} onClick={() => setRunning((r) => !r)}>{running ? "pause" : M.steps ? "resume" : "train"}</button>
          <button className="sm" onClick={reset}>reset</button>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "minmax(0,1.5fr) minmax(0,1fr)", gap: "0.8rem" }}>
        <div>
          <div style={{ display: "grid", gridTemplateColumns: "5.2rem repeat(5, 1fr)", gap: "2px", fontFamily: "var(--mono)", fontSize: "0.58rem" }}>
            <span />
            {ACTIONS.map((a) => <span key={a} className="dim" style={{ textAlign: "center", lineHeight: 1.1, paddingBottom: 3 }}>{a}</span>)}
            {[...INTENTS.map((n, i) => ({ n, pi: soft(M.cond[i]), i })), { n: "one weighting", pi: soft(M.fixed), i: -1 }].map((r) => (
              <div key={r.n} style={{ display: "contents" }}>
                <span style={{ alignSelf: "center", color: r.i === sel ? "var(--accent)" : "var(--ink-2)", cursor: r.i >= 0 ? "pointer" : "default", borderTop: r.i < 0 ? "1px solid var(--rule)" : 0, paddingTop: r.i < 0 ? 3 : 0 }} onClick={() => r.i >= 0 && setSel(r.i)}>{r.n}</span>
                {r.pi.map((p, a) => (
                  <span key={a} style={{ textAlign: "center", padding: "0.38rem 0", borderRadius: 3, background: `color-mix(in srgb, var(--accent) ${Math.round(p * 100)}%, var(--bg-2))`, color: p > 0.5 ? "var(--accent-ink)" : "var(--ink-2)" }}>{Math.round(p * 100)}</span>
                ))}
              </div>
            ))}
          </div>
          <div className="mono dim" style={{ marginTop: "0.35rem", fontSize: "0.6rem" }}>cells: % of turns where the policy picks that continuation</div>
        </div>
        <div style={{ display: "grid", gap: "0.3rem", alignContent: "start" }}>
          <div className="mono acc" style={{ fontSize: "0.64rem" }}>weights for “{INTENTS[sel]}”</div>
          {CRITICS.map((c, i) => (
            <div key={c} className="sl" style={{ ["--lw" as string]: "3.8rem", gridTemplateColumns: "3.8rem 1fr 2rem" }}>
              <span>{c}</span>
              <input type="range" min={0} max={1} step={0.05} value={weights[sel][i]} onChange={(e) => setW(i, +e.target.value)} aria-label={`${c} weight for ${INTENTS[sel]}`} />
              <span>{norm(weights[sel])[i].toFixed(2)}</span>
            </div>
          ))}
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "minmax(0,1fr) auto", gap: "0.8rem", alignItems: "center" }}>
        <svg viewBox="0 0 100 44" preserveAspectRatio="none" style={{ height: 52, background: "var(--card)", borderRadius: 6 }} aria-label="Mean intent-weighted reward over training">
          {M.hist.length > 1 && <>
            <polyline points={polyline(1)} fill="none" stroke="var(--ink-3)" strokeWidth="1.2" vectorEffect="non-scaling-stroke" />
            <polyline points={polyline(0)} fill="none" stroke="var(--accent)" strokeWidth="1.8" vectorEffect="non-scaling-stroke" />
          </>}
        </svg>
        <div className="mono" style={{ lineHeight: 1.5 }}>
          <div className="acc">per-intent {last ? last[0].toFixed(3) : "—"}</div>
          <div className="dim">one weighting {last ? last[1].toFixed(3) : "—"}</div>
        </div>
      </div>
      <div className="out dim">Press train, then edit a weight. The intent-conditioned policy re-learns; the single-weighting one can't tell the intents apart.</div>
    </div>
  );
}
