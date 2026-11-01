import { useState } from "react";

/**
 * The EMNLP paper's mechanism (LGSM) on twelve synthetic scenes: a frozen text
 * encoder and an explicit stream of linguistic/discourse features each score a
 * scene, and an adaptive gate decides, scene by scene, how far to trust the
 * encoder. Each stream alone is fooled by a different kind of scene. The paper's
 * real result is in the text above; this shows why a gate helps.
 */
type Scene = { name: string; sb: number; sf: number; cb: number; truth: boolean };
const SCENES: Scene[] = [
  { name: "Heist goes wrong", sb: 0.9, sf: 0.3, cb: 0.9, truth: true },
  { name: "The confession", sb: 0.85, sf: 0.4, cb: 0.8, truth: true },
  { name: "Quiet kitchen talk", sb: 0.35, sf: 0.9, cb: 0.2, truth: true },
  { name: "A change of subject", sb: 0.3, sf: 0.62, cb: 0.4, truth: true },
  { name: "Loud argument", sb: 0.8, sf: 0.2, cb: 0.3, truth: false },
  { name: "Dramatic weather", sb: 0.78, sf: 0.35, cb: 0.5, truth: false },
  { name: "Gossip over lunch", sb: 0.3, sf: 0.85, cb: 0.85, truth: false },
  { name: "Long goodbye", sb: 0.25, sf: 0.78, cb: 0.8, truth: false },
  { name: "Car ride", sb: 0.2, sf: 0.2, cb: 0.5, truth: false },
  { name: "Phone call", sb: 0.22, sf: 0.18, cb: 0.5, truth: false },
  { name: "Walking home", sb: 0.18, sf: 0.22, cb: 0.5, truth: false },
  { name: "Credits", sb: 0.15, sf: 0.1, cb: 0.5, truth: false },
];
const K = 4;
const sig = (x: number) => 1 / (1 + Math.exp(-x));
type Mode = "bert" | "feat" | "gated";
const alpha = (s: Scene) => sig(6 * (s.cb - 0.5));
const score = (s: Scene, m: Mode) => (m === "bert" ? s.sb : m === "feat" ? s.sf : alpha(s) * s.sb + (1 - alpha(s)) * s.sf);
const top = (m: Mode) => new Set(SCENES.map((s, i) => [i, score(s, m)] as const).sort((a, b) => b[1] - a[1]).slice(0, K).map((x) => x[0]));
const recall = (m: Mode) => [...top(m)].filter((i) => SCENES[i].truth).length / SCENES.filter((s) => s.truth).length;

export default function Gate() {
  const [mode, setMode] = useState<Mode>("gated");
  const sel = top(mode);
  const hits = [...sel].filter((i) => SCENES[i].truth).length;

  return (
    <div className="stage">
      <div className="stage-h">
        <span className="mono">which 4 of 12 scenes matter?</span>
        <div className="tabs">
          {([["bert", "encoder"], ["feat", "features"], ["gated", "gated"]] as const).map(([k, l]) => <button key={k} className={`sm ${mode === k ? "on" : ""}`} onClick={() => setMode(k)}>{l}</button>)}
        </div>
      </div>
      <div style={{ display: "grid", gap: 3 }}>
        {SCENES.map((s, i) => (
          <div key={s.name} className="mono" style={{ display: "grid", gridTemplateColumns: "0.9rem 8.4rem 1fr 2.6rem", gap: "0.5rem", alignItems: "center", padding: "2px 0.35rem", borderRadius: 4, background: sel.has(i) ? "color-mix(in srgb, var(--accent) 13%, transparent)" : "transparent", transition: "background 0.3s" }}>
            <span className={s.truth ? "acc" : "dim"}>{s.truth ? "★" : "·"}</span>
            <span style={{ fontSize: "0.64rem", color: "var(--ink-2)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{s.name}</span>
            <div className="bar" style={{ height: 6 }}><i style={{ width: `${score(s, mode) * 100}%` }} /></div>
            <span className="dim" style={{ fontSize: "0.58rem", textAlign: "right" }}>{mode === "gated" ? `α ${alpha(s).toFixed(1)}` : score(s, mode).toFixed(2)}</span>
          </div>
        ))}
      </div>
      <div className="mono" style={{ display: "flex", justifyContent: "space-between", gap: "0.8rem", flexWrap: "wrap" }}>
        <span>found <b className="acc">{hits} of 4</b> salient scenes ({Math.round(recall(mode) * 100)}%)</span>
        <span className="dim">★ annotated salient · α = trust in the encoder</span>
      </div>
    </div>
  );
}
