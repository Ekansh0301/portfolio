import { useEffect, useRef, useState } from "react";
import { ALPHA, BEATS, FILM, score } from "../../lib/lgsm";

/**
 * LGSM reading one film, beat by beat. Every scene is pushed through the
 * model's two streams and the paper's scalar gate, and you see why it did or
 * did not call the scene salient. Gate value, feature directions and group
 * differences are the paper's; per-scene feature values are illustrative, and
 * the beats are my plain-language summary of the film.
 */
const S = BEATS.map(score);

export default function Lgsm() {
  const [i, setI] = useState(2);
  const manual = useRef(false);
  useEffect(() => {
    const id = window.setInterval(() => { if (!manual.current) setI((x) => (x + 1) % BEATS.length); }, 3600);
    return () => clearInterval(id);
  }, []);

  const b = BEATS[i], s = S[i];
  const hit = s.pred && b.star, miss = !s.pred && b.star, ok = !s.pred && !b.star;

  return (
    <div className="stage">
      <div className="stage-h">
        <span className="mono">LGSM reading <b style={{ color: "var(--ink)" }}>{FILM.title}</b> ({FILM.year}, {FILM.director})</span>
        <span className="mono dim">★ = plot-defining beat</span>
      </div>

      {/* the film as a strip of scenes */}
      <div style={{ display: "grid", gridTemplateColumns: `repeat(${BEATS.length}, 1fr)`, gap: 4 }}>
        {BEATS.map((x, k) => (
          <button key={x.title} onClick={() => { manual.current = true; setI(k); }} aria-label={`Scene ${k + 1}: ${x.title}`} style={{ background: "none", border: 0, padding: 0, display: "grid", gap: 3, justifyItems: "center" }}>
            <span className="mono" style={{ fontSize: "0.6rem", color: x.star ? "var(--accent)" : "transparent", lineHeight: 1 }}>★</span>
            <span className="beat" style={{ width: "100%", borderRadius: 4, background: `color-mix(in srgb, var(--accent) ${Math.round(S[k].fused * 100)}%, var(--bg-2))`, outline: k === i ? "2px solid var(--ink)" : S[k].pred ? "1.5px solid var(--accent)" : "1px solid var(--rule)", outlineOffset: k === i ? 2 : -1, transition: "outline 0.2s" }} />
            <span className="mono dim" style={{ fontSize: "0.55rem" }}>{k + 1}</span>
          </button>
        ))}
      </div>
      <div className="mono dim" style={{ fontSize: "0.58rem", marginTop: -4 }}>shade = fused saliency · outlined = predicted salient</div>

      {/* the scene under the lens */}
      <div key={i} style={{ borderLeft: "2px solid var(--accent)", paddingLeft: "0.7rem" }}>
        <div style={{ fontFamily: "var(--serif)", fontSize: "1.08rem", lineHeight: 1.2 }}>{i + 1}. {b.title}</div>
        <div style={{ fontSize: "0.82rem", color: "var(--ink-2)", marginTop: 2 }}>{b.blurb}</div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "minmax(0,1.35fr) minmax(0,1fr)", gap: "0.9rem" }}>
        {/* linguistic stream */}
        <div>
          <div className="mono dim" style={{ fontSize: "0.58rem", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 5 }}>linguistic stream · feature pushes</div>
          <div style={{ display: "grid", gap: 6 }}>
            {s.contrib.map((c) => (
              <div key={c.k} style={{ display: "grid", gridTemplateColumns: "8.6rem 1fr 2.2rem", gap: 6, alignItems: "center" }} className="mono">
                <span style={{ fontSize: "0.62rem", color: "var(--ink-2)" }} title={c.note}>{c.label}</span>
                <div style={{ position: "relative", height: 8, background: "var(--bg-2)", borderRadius: 4 }}>
                  <div style={{ position: "absolute", left: "50%", top: -2, bottom: -2, width: 1, background: "var(--ink-3)" }} />
                  <div style={{ position: "absolute", top: 0, bottom: 0, borderRadius: 4, background: c.c >= 0 ? "var(--accent)" : "var(--ink-3)", left: c.c >= 0 ? "50%" : `${50 + Math.max(-50, c.c * 28)}%`, width: `${Math.min(50, Math.abs(c.c) * 28)}%`, transition: "all 0.45s var(--ease)" }} />
                </div>
                <span style={{ fontSize: "0.6rem", textAlign: "right", color: c.c >= 0 ? "var(--accent)" : "var(--ink-3)" }}>{c.c >= 0 ? "+" : ""}{c.c.toFixed(2)}</span>
              </div>
            ))}
          </div>
          <div className="mono" style={{ fontSize: "0.62rem", marginTop: 6 }}><span className="dim">h_ling →</span> <b>{s.ling.toFixed(2)}</b></div>
        </div>

        {/* semantic stream + gate */}
        <div style={{ display: "grid", gap: "0.55rem", alignContent: "start" }}>
          <div>
            <div className="mono dim" style={{ fontSize: "0.58rem", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 5 }}>semantic stream · frozen BERT</div>
            <div className="bar" style={{ height: 8 }}><i style={{ width: `${b.sem * 100}%` }} /></div>
            <div className="mono" style={{ fontSize: "0.62rem", marginTop: 4 }}><span className="dim">h_sem →</span> <b>{b.sem.toFixed(2)}</b></div>
          </div>
          <div style={{ border: "1px solid var(--rule)", borderRadius: 8, padding: "0.45rem 0.6rem", background: "var(--card)" }}>
            <div className="mono" style={{ fontSize: "0.6rem" }}>gate α = σ(W[h_sem ; h_ling] + b)</div>
            <div className="mono" style={{ fontSize: "0.8rem", color: "var(--accent)", marginTop: 2 }}>α = {ALPHA.toFixed(2)}</div>
            <div className="mono dim" style={{ fontSize: "0.56rem", marginTop: 2 }}>stable within a film (paper: 0.477 for “Her”)</div>
          </div>
        </div>
      </div>

      {/* fusion and verdict */}
      <div style={{ borderTop: "1px solid var(--rule)", paddingTop: "0.6rem", display: "grid", gap: 6 }}>
        <div className="mono" style={{ fontSize: "0.68rem" }}>
          fused = <span className="acc">{ALPHA.toFixed(2)}</span>·{s.ling.toFixed(2)} + <span className="acc">{(1 - ALPHA).toFixed(2)}</span>·{b.sem.toFixed(2)} = <b style={{ fontSize: "0.8rem" }}>{s.fused.toFixed(2)}</b>
        </div>
        <div style={{ position: "relative", height: 10, background: "var(--bg-2)", borderRadius: 5 }}>
          <div style={{ position: "absolute", inset: "0 auto 0 0", width: `${s.fused * 100}%`, background: s.pred ? "var(--accent)" : "var(--ink-3)", borderRadius: 5, transition: "width 0.5s var(--ease)" }} />
          <div style={{ position: "absolute", left: "50%", top: -3, bottom: -3, width: 2, background: "var(--ink)" }} />
        </div>
        <div className="mono" style={{ fontSize: "0.66rem", lineHeight: 1.45, minHeight: "2.7em" }}>
          {hit && <span className="ok">✓ predicted salient, and it is a plot-defining beat.</span>}
          {ok && <span className="dim">✓ predicted background, correctly.{b.note ? ` ${b.note}` : ""}</span>}
          {miss && <span className="bad">✗ {b.note}</span>}
        </div>
      </div>
    </div>
  );
}
