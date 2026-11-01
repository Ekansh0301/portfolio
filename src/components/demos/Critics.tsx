import { useState } from "react";

const CRITICS = ["Narrative", "Causal", "World", "Voice"] as const;
const INTENTS: Record<string, number[]> = {
  "Take action": [0.2, 0.45, 0.25, 0.1],
  "Talk to NPC": [0.2, 0.1, 0.1, 0.6],
  "Explore": [0.15, 0.1, 0.65, 0.1],
  "Push the plot": [0.6, 0.2, 0.1, 0.1],
};
// Illustrative critic scores for three candidate continuations of the same turn.
const CANDS = [
  { text: "The door gives way. Rain follows you into the hall.", s: [0.6, 0.9, 0.7, 0.4] },
  { text: "\"You shouldn't have come,\" the warden says, almost kindly.", s: [0.7, 0.5, 0.4, 0.95] },
  { text: "Beyond the hall, the corridor splits into three lamplit stairs.", s: [0.5, 0.5, 0.95, 0.3] },
];

export default function Critics() {
  const [intent, setIntent] = useState("Take action");
  const w = INTENTS[intent];
  const scores = CANDS.map((c) => c.s.reduce((a, v, i) => a + v * w[i], 0));
  const best = scores.indexOf(Math.max(...scores));

  return (
    <>
      <div className="row-c">
        {Object.keys(INTENTS).map((k) => <button key={k} className={`sm ${intent === k ? "on" : ""}`} onClick={() => setIntent(k)}>{k}</button>)}
      </div>
      <div style={{ display: "grid", gap: "0.45rem" }}>
        {CRITICS.map((c, i) => (
          <div key={c} className="slider" style={{ gridTemplateColumns: "5.5rem 1fr 2.4rem" }}>
            <span>{c}</span><div className="bar"><i style={{ width: `${w[i] * 100 / 0.65 > 100 ? 100 : w[i] * 100 / 0.65}%` }} /></div><span>{w[i].toFixed(2)}</span>
          </div>
        ))}
      </div>
      <div style={{ display: "grid", gap: "0.5rem" }}>
        {CANDS.map((c, i) => (
          <div key={i} style={{ padding: "0.7rem 0.9rem", border: `1px solid ${i === best ? "var(--accent)" : "var(--rule)"}`, borderRadius: 8, background: i === best ? "color-mix(in srgb, var(--accent) 8%, transparent)" : "transparent", transition: "all 0.4s" }}>
            <div style={{ fontSize: "0.9rem" }}>{c.text}</div>
            <div className="mono dim" style={{ marginTop: "0.3rem" }}>weighted reward {scores[i].toFixed(2)}{i === best && <span style={{ color: "var(--accent)" }}> · chosen</span>}</div>
          </div>
        ))}
      </div>
      <div className="readout dim">Illustrative scores. The intent decides which critic dominates the turn.</div>
    </>
  );
}
