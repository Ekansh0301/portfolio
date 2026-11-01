import { useState } from "react";

/**
 * A toy of the EMNLP paper's mechanism (LGSM): a text-encoder stream and a
 * linguistic-feature stream each score a scene, and a learned gate decides per
 * scene how far to trust the encoder, here from the encoder's own confidence.
 * Twelve synthetic scenes; the paper's real results are in the text.
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
  { name: "Credits sequence", sb: 0.15, sf: 0.1, cb: 0.5, truth: false },
];
const K = 4;
const sig = (x: number) => 1 / (1 + Math.exp(-x));
type Mode = "bert" | "feat" | "gated";

export default function Gate() {
  const [mode, setMode] = useState<Mode>("gated");
  const [bias, setBias] = useState(0);

  const alpha = (s: Scene) => sig(bias + 6 * (s.cb - 0.5));
  const score = (s: Scene, m: Mode) => (m === "bert" ? s.sb : m === "feat" ? s.sf : alpha(s) * s.sb + (1 - alpha(s)) * s.sf);
  const top = (m: Mode) => new Set(SCENES.map((s, i) => [i, score(s, m)] as const).sort((a, b) => b[1] - a[1]).slice(0, K).map((x) => x[0]));
  const recall = (m: Mode) => [...top(m)].filter((i) => SCENES[i].truth).length / SCENES.filter((s) => s.truth).length;
  const sel = top(mode);

  return (
    <div className="stage">
      <div className="stage-h">
        <span className="mono">pick the {K} most salient of 12 scenes</span>
        <div className="tabs">
          {([["bert", "encoder only"], ["feat", "features only"], ["gated", "gated"]] as const).map(([k, l]) => <button key={k} className={`sm ${mode === k ? "on" : ""}`} onClick={() => setMode(k)}>{l}</button>)}
        </div>
      </div>
      <div style={{ display: "grid", gap: 2 }}>
        {SCENES.map((s, i) => (
          <div key={s.name} className="mono" style={{ display: "grid", gridTemplateColumns: "0.9rem 8.2rem 1fr 2.4rem", gap: "0.45rem", alignItems: "center", padding: "1px 0.3rem", borderRadius: 4, background: sel.has(i) ? "color-mix(in srgb, var(--accent) 12%, transparent)" : "transparent" }}>
            <span className={s.truth ? "acc" : "dim"} title={s.truth ? "annotated salient" : ""}>{s.truth ? "★" : "·"}</span>
            <span style={{ fontSize: "0.62rem", color: "var(--ink-2)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{s.name}</span>
            <div className="bar" style={{ height: 6 }}><i style={{ width: `${score(s, mode) * 100}%` }} /></div>
            <span className="dim" style={{ fontSize: "0.58rem", textAlign: "right" }}>{mode === "gated" ? `α${alpha(s).toFixed(1)}` : score(s, mode).toFixed(2)}</span>
          </div>
        ))}
      </div>
      <div className="sl" style={{ ["--lw" as string]: "6rem", gridTemplateColumns: "6rem 1fr 2.4rem" }}>
        <span>trust encoder</span><input type="range" min={-3} max={3} step={0.25} value={bias} onChange={(e) => setBias(+e.target.value)} aria-label="Gate bias toward the text encoder" /><span>{bias > 0 ? "+" : ""}{bias}</span>
      </div>
      <div className="mono" style={{ display: "flex", gap: "1rem", flexWrap: "wrap" }}>
        {(["bert", "feat", "gated"] as const).map((m) => <span key={m} className={m === mode ? "acc" : "dim"}>{m === "bert" ? "encoder" : m === "feat" ? "features" : "gated"} recall {Math.round(recall(m) * 100)}%</span>)}
      </div>
      <div className="out dim" style={{ fontSize: "0.64rem" }}>★ = annotated salient. Each stream alone is fooled by a different kind of scene; the gate (α) leans on whichever is more reliable per scene. Synthetic data, illustrating the mechanism.</div>
    </div>
  );
}
