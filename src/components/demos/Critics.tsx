import { useEffect, useRef, useState } from "react";

/** Numbers below are from the project's README: critic validation scores, the three intent weightings, and SFT vs PPO rewards. */
const CRITICS = [
  { k: "Narrative", model: "DeBERTa-v3", sft: 0.523, ppo: 0.694 },
  { k: "Causal", model: "RoBERTa NLI", sft: 0.189, ppo: 0.567 },
  { k: "World", model: "DeBERTa + Flan-T5", sft: 0.618, ppo: 0.821 },
  { k: "Character", model: "DeBERTa + NPC emb.", sft: 0.138, ppo: 0.268 },
];
const INTENTS = {
  EXPLORE: { w: [0.4, 0.2, 0.3, 0.1], focus: 0, gain: "+0.157", say: "I look down the dark corridor." },
  ACTION: { w: [0.2, 0.4, 0.3, 0.1], focus: 1, gain: "+0.443", say: "I cast Fireball at the goblin horde." },
  DIALOGUE: { w: [0.2, 0.2, 0.2, 0.4], focus: 3, gain: "+0.184", say: "I ask the innkeeper who she's afraid of." },
} as const;
type Intent = keyof typeof INTENTS;
const ORDER: Intent[] = ["EXPLORE", "ACTION", "DIALOGUE"];

export default function Critics() {
  const [intent, setIntent] = useState<Intent>("ACTION");
  const manual = useRef(false);

  useEffect(() => {
    const id = window.setInterval(() => {
      if (!manual.current) setIntent((i) => ORDER[(ORDER.indexOf(i) + 1) % ORDER.length]);
    }, 4800);
    return () => clearInterval(id);
  }, []);

  const I = INTENTS[intent];
  return (
    <div className="stage">
      <div className="stage-h">
        <span className="mono">the player's intent decides which critic leads</span>
        <div className="tabs">
          {ORDER.map((k) => <button key={k} className={`sm ${intent === k ? "on" : ""}`} onClick={() => { manual.current = true; setIntent(k); }}>{k.toLowerCase()}</button>)}
        </div>
      </div>

      <div style={{ padding: "0.55rem 0.8rem", border: "1px solid var(--rule)", borderRadius: 8, background: "var(--card)", fontFamily: "var(--serif)", fontSize: "1.05rem", fontStyle: "italic" }}>
        “{I.say}”
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "minmax(0,1fr) minmax(0,1fr)", gap: "1rem" }}>
        <div>
          <div className="mono dim" style={{ fontSize: "0.6rem", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.08em" }}>critic weight this turn</div>
          {CRITICS.map((c, i) => (
            <div key={c.k} style={{ marginBottom: 7 }}>
              <div className="mono" style={{ display: "flex", justifyContent: "space-between", fontSize: "0.66rem", color: i === I.focus ? "var(--accent)" : "var(--ink-2)" }}>
                <span>{c.k}</span><span>{Math.round(I.w[i] * 100)}%</span>
              </div>
              <div className="bar" style={{ height: 8 }}><i style={{ width: `${I.w[i] * 100 / 0.4 > 100 ? 100 : (I.w[i] * 100) / 0.4}%`, background: i === I.focus ? "var(--accent)" : "var(--ink-3)" }} /></div>
            </div>
          ))}
        </div>
        <div>
          <div className="mono dim" style={{ fontSize: "0.6rem", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.08em" }}>supervised → after PPO</div>
          {CRITICS.map((c, i) => (
            <div key={c.k} style={{ marginBottom: 7 }}>
              <div className="mono" style={{ display: "flex", justifyContent: "space-between", fontSize: "0.66rem", color: i === I.focus ? "var(--accent)" : "var(--ink-2)" }}>
                <span>{c.model}</span><span>{c.sft.toFixed(2)} → {c.ppo.toFixed(2)}</span>
              </div>
              <div style={{ position: "relative", height: 8, background: "var(--bg-2)", borderRadius: 99, overflow: "hidden" }}>
                <div style={{ position: "absolute", inset: "0 auto 0 0", width: `${c.ppo * 100}%`, background: i === I.focus ? "var(--accent)" : "var(--ink-3)", opacity: i === I.focus ? 1 : 0.6, borderRadius: 99 }} />
                <div style={{ position: "absolute", inset: "0 auto 0 0", width: `${c.sft * 100}%`, background: "var(--ink)", opacity: 0.35, borderRadius: 99 }} />
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="log" style={{ minHeight: "3.6em" }}>
        {intent === "ACTION" ? (
          <>
            <div><span className="dim">supervised (causal 0.09): </span>ignores the spell, describes generic tavern chaos.</div>
            <div><span className="acc">after PPO (causal 0.94): </span>“Your Fireball streaks toward the horde… two goblins are incinerated instantly…”</div>
          </>
        ) : (
          <div>In {intent.toLowerCase()} turns the weighted critic improved by <span className="acc">{I.gain}</span> after PPO. The weights re-balance every turn, so no single reward model has to be good at everything.</div>
        )}
      </div>
    </div>
  );
}
