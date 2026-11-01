import { useEffect, useRef, useState } from "react";

/**
 * Real generations from the project's README (PPO/README.md): the supervised
 * Phi-2 baseline and the PPO-trained policy answering the same player action,
 * with the critics' scores for each. The intent classifier picks the weights,
 * and the reward below is computed live from those scores and weights
 * (renormalised over the critics the README reports for that turn).
 */
type K = "N" | "C" | "W" | "Ch";
const NAMES: Record<K, string> = { N: "Narrative", C: "Causal", W: "World", Ch: "Character" };
type Scores = Partial<Record<K, number>>;
type Turn = { tab: string; intent: "ACTION" | "EXPLORE" | "DIALOGUE"; w: Record<K, number>; player: string; sft: string; ppo: string; ss: Scores; ps: Scores };

const TURNS: Turn[] = [
  {
    tab: "Fireball", intent: "ACTION", w: { N: 0.2, C: 0.4, W: 0.3, Ch: 0.1 },
    player: "I cast Fireball at the group of goblins in the corner!",
    sft: "The tavern erupts in chaos as patrons dive for cover. The bartender shouts something about his establishment. You notice the wooden beams overhead are old and weathered, creating an atmosphere of danger.",
    ppo: "Your Fireball streaks toward the corner, exploding in a brilliant sphere of flame. The goblins shriek as the fire engulfs them. Roll 8d6 fire damage. Two goblins are immediately incinerated, while the third staggers out of the flames, badly burned and smoking. What do you do next?",
    ss: { N: 0.61, C: 0.09, W: 0.54 }, ps: { N: 0.68, C: 0.94, W: 0.89 },
  },
  {
    tab: "Ancient door", intent: "EXPLORE", w: { N: 0.4, C: 0.2, W: 0.3, Ch: 0.1 },
    player: "I examine the ancient door, looking for any traps or mechanisms.",
    sft: "You look at the door. It's made of stone and has some carvings on it. Roll a perception check to see if you find anything.",
    ppo: "The door before you is a masterwork of ancient dwarven craftsmanship. Intricate runes spiral across its surface, glowing faintly with residual magic. The stone is cold to the touch, almost unnaturally so, and you can feel a faint vibration emanating from within. Around the frame, thin channels suggest poison traps or blade mechanisms. The door has no visible handle, only a circular indentation at chest height. Roll Investigation with advantage.",
    ss: { N: 0.27, C: 0.38, W: 0.55 }, ps: { N: 0.91, C: 0.59, W: 0.87 },
  },
  {
    tab: "Innkeeper", intent: "DIALOGUE", w: { N: 0.2, C: 0.2, W: 0.2, Ch: 0.4 },
    player: "I ask the innkeeper what she knows about the mysterious stranger.",
    sft: "The innkeeper tells you about a stranger who came through town recently. They were wearing a dark cloak and didn't talk much. She thinks they might be dangerous. She serves you some food and goes back to work.",
    ppo: "Margery the innkeeper leans in close, her weathered face creased with concern. “Aye, that one,” she whispers in her thick northern accent. “Came in three nights past, paid in gold—old gold, mind you. Kept his hood up the whole time, wouldn't look me in the eye. Asked about the old ruins up north, same as you lot. Left before dawn without a word.” She wipes her hands on her apron nervously. “Bad business, I tell you.”",
    ss: { N: 0.49, C: 0.28, Ch: 0.08 }, ps: { N: 0.79, C: 0.57, Ch: 0.81 },
  },
];
const STEPS = [[0, 0.412], [250, 0.507], [500, 0.571], [750, 0.598], [1000, 0.611]] as const;

const reward = (s: Scores, w: Record<K, number>) => {
  const ks = Object.keys(s) as K[];
  const wsum = ks.reduce((a, k) => a + w[k], 0);
  return ks.reduce((a, k) => a + w[k] * (s[k] as number), 0) / wsum;
};

function Side({ title, text, scores, w, tone }: { title: string; text: string; scores: Scores; w: Record<K, number>; tone: "base" | "ppo" }) {
  const ks = Object.keys(scores) as K[];
  const lead = (Object.keys(w) as K[]).reduce((a, b) => (w[a] >= w[b] ? a : b));
  const r = reward(scores, w);
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", border: `1px solid ${tone === "ppo" ? "var(--accent)" : "var(--rule)"}`, borderRadius: 10, padding: "0.65rem 0.75rem", background: "var(--card)", minWidth: 0 }}>
      <div className="mono" style={{ fontSize: "0.62rem", letterSpacing: "0.08em", textTransform: "uppercase", color: tone === "ppo" ? "var(--accent)" : "var(--ink-3)" }}>{title}</div>
      <p className="resp" style={{ margin: 0, fontFamily: "var(--serif)", fontSize: "0.8rem", lineHeight: 1.42, flex: 1, color: "var(--ink)" }}>{text}</p>
      <div style={{ display: "grid", gap: 4 }}>
        {ks.map((k) => (
          <div key={k} style={{ display: "grid", gridTemplateColumns: "4.4rem 1fr 2rem", gap: 6, alignItems: "center" }} className="mono">
            <span style={{ fontSize: "0.6rem", color: k === lead ? "var(--accent)" : "var(--ink-3)" }}>{NAMES[k]}{k === lead ? " ◂" : ""}</span>
            <div className="bar" style={{ height: 6 }}><i style={{ width: `${(scores[k] as number) * 100}%`, background: k === lead ? "var(--accent)" : "var(--ink-3)" }} /></div>
            <span style={{ fontSize: "0.62rem", textAlign: "right" }}>{(scores[k] as number).toFixed(2)}</span>
          </div>
        ))}
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", borderTop: "1px solid var(--rule)", paddingTop: 6 }}>
        <span className="mono dim" style={{ fontSize: "0.58rem" }}>intent-weighted reward</span>
        <span style={{ fontFamily: "var(--serif)", fontSize: "1.45rem", color: tone === "ppo" ? "var(--accent)" : "var(--ink)", lineHeight: 1 }}>{r.toFixed(2)}</span>
      </div>
    </div>
  );
}

export default function Critics() {
  const [i, setI] = useState(0);
  const manual = useRef(false);
  useEffect(() => {
    const id = window.setInterval(() => { if (!manual.current) setI((x) => (x + 1) % TURNS.length); }, 10000);
    return () => clearInterval(id);
  }, []);
  const T = TURNS[i];
  const keys = Object.keys(NAMES) as K[];

  return (
    <div className="stage">
      <div className="stage-h">
        <span className="mono">same player action, two policies</span>
        <div className="tabs">{TURNS.map((t, k) => <button key={t.tab} className={`sm ${i === k ? "on" : ""}`} onClick={() => { manual.current = true; setI(k); }}>{t.tab}</button>)}</div>
      </div>

      {/* player action → intent classifier → weights */}
      <div style={{ display: "grid", gridTemplateColumns: "minmax(0,1.5fr) auto minmax(0,1.1fr)", gap: "0.6rem", alignItems: "center" }}>
        <div style={{ fontFamily: "var(--serif)", fontStyle: "italic", fontSize: "0.98rem", lineHeight: 1.35 }}>“{T.player}”</div>
        <div className="mono" style={{ textAlign: "center", fontSize: "0.58rem", color: "var(--ink-3)" }}>intent<br /><b style={{ color: "var(--accent)", fontSize: "0.7rem" }}>{T.intent}</b></div>
        <div style={{ display: "flex", gap: 3, alignItems: "flex-end", height: 40 }} aria-label="Critic weights for this intent">
          {keys.map((k) => (
            <div key={k} style={{ flex: 1, textAlign: "center" }} className="mono">
              <div style={{ height: `${T.w[k] * 90}px`, minHeight: 4, background: T.w[k] === Math.max(...Object.values(T.w)) ? "var(--accent)" : "var(--ink-3)", opacity: T.w[k] === Math.max(...Object.values(T.w)) ? 1 : 0.55, borderRadius: 3, transition: "height 0.5s var(--ease)" }} />
              <span style={{ fontSize: "0.52rem", color: "var(--ink-3)" }}>{k} {Math.round(T.w[k] * 100)}</span>
            </div>
          ))}
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.7rem", flex: 1 }}>
        <Side key={`s${i}`} title="Supervised baseline (Phi-2 SFT)" text={T.sft} scores={T.ss} w={T.w} tone="base" />
        <Side key={`p${i}`} title="After PPO with four critics" text={T.ppo} scores={T.ps} w={T.w} tone="ppo" />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "auto 1fr", gap: "0.8rem", alignItems: "center" }}>
        <span className="mono dim" style={{ fontSize: "0.58rem", lineHeight: 1.3 }}>mean reward<br />over PPO steps</span>
        <svg viewBox="0 0 100 22" preserveAspectRatio="none" style={{ height: 26, width: "100%" }} aria-label="Mean reward rising from 0.412 to 0.611 over 1000 PPO steps">
          <polyline points={STEPS.map(([s, r]) => `${s / 10},${20 - ((r - 0.4) / 0.22) * 18}`).join(" ")} fill="none" stroke="var(--accent)" strokeWidth="1.4" vectorEffect="non-scaling-stroke" />
          {STEPS.map(([s, r]) => <circle key={s} cx={s / 10} cy={20 - ((r - 0.4) / 0.22) * 18} r="1.3" fill="var(--accent)" />)}
        </svg>
      </div>
    </div>
  );
}
