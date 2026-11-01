import { useEffect, useRef, useState } from "react";

/**
 * The Director's critics catching a supervised baseline that sounds fine and is
 * quietly wrong. Scenarios come from the project's READMEs: the Fireball pair
 * is a real generation pair with real critic scores (PPO/README.md); the three
 * world-state traps (contradiction, hallucination, amnesia) are the World
 * Consistency critic's own taxonomy and scoring (0.0 / 0.3 / 0.5, consistent
 * = 1.0). Intent weights are the README's. The wording of the three
 * world-state responses is illustrative.
 */
type K = "N" | "C" | "W" | "Ch";
const NAMES: Record<K, string> = { N: "Narrative", C: "Causal", W: "World", Ch: "Character" };
const WEIGHTS: Record<string, Record<K, number>> = {
  EXPLORE: { N: 0.4, C: 0.2, W: 0.3, Ch: 0.1 },
  ACTION: { N: 0.2, C: 0.4, W: 0.3, Ch: 0.1 },
  DIALOGUE: { N: 0.2, C: 0.2, W: 0.2, Ch: 0.4 },
};
type Row = { k: K; v: number };
type Side = { text: string; flag?: string; rows: Row[]; verdict: string; gains?: string[] };
type Turn = { tab: string; trap: string; focus: K; state: string[]; player: string; intent: keyof typeof WEIGHTS; base: Side; ppo: Side };

const TURNS: Turn[] = [
  {
    tab: "Ignored action", trap: "causal gap", focus: "C", intent: "ACTION",
    state: ["tavern, evening", "goblins in the far corner"],
    player: "I cast Fireball at the group of goblins in the corner!",
    base: { text: "The tavern erupts in chaos as patrons dive for cover. The bartender shouts something about his establishment. You notice the wooden beams overhead are old and weathered.", flag: "The tavern erupts in chaos as patrons dive for cover.", rows: [{ k: "N", v: 0.61 }, { k: "C", v: 0.09 }, { k: "W", v: 0.54 }], verdict: "Never resolves the spell: no damage, no goblins." },
    ppo: { text: "Your Fireball streaks into the corner and blooms into a sphere of flame. The goblins shriek as it engulfs them. Roll 8d6 fire damage. Two are incinerated outright; the third staggers clear, badly burned, smoke curling off his cloak. What do you do next?", rows: [{ k: "N", v: 0.68 }, { k: "C", v: 0.94 }, { k: "W", v: 0.89 }], verdict: "Resolves the action with consequences.", gains: ["resolves the spell", "damage dice (8d6)", "names who survives"] },
  },
  {
    tab: "Locked door", trap: "contradiction", focus: "W", intent: "ACTION",
    state: ["ancient door: LOCKED", "key: not found"],
    player: "I push on the door.",
    base: { text: "The door gives way with a groan of old hinges, revealing a dark corridor that smells of damp stone. Somewhere ahead, water drips.", flag: "The door gives way with a groan of old hinges", rows: [{ k: "W", v: 0.0 }], verdict: "Door state changed from locked to open with no unlock action." },
    ppo: { text: "The door doesn't budge. The iron lock holds fast, and fresh scratches around the keyhole suggest someone else has tried before you. Something small and brass glints in the dust by the hinge.", rows: [{ k: "W", v: 1.0 }], verdict: "Consistent with the established state.", gains: ["keeps the lock", "adds a clue", "points toward the key"] },
  },
  {
    tab: "Quiet tavern", trap: "hallucination", focus: "W", intent: "EXPLORE",
    state: ["tavern: quiet, dimly lit", "a few patrons, scattered"],
    player: "I look around the room.",
    base: { text: "Two merchants haggle by the fire while a pair of guards share a table near the door. A bard tunes his lute beside three scholars deep in debate, and a cook hauls out a tray of bread.", flag: "Two merchants haggle by the fire while a pair of guards share a table near the door. A bard tunes his lute beside three scholars", rows: [{ k: "W", v: 0.3 }], verdict: "Eight new people in a room established as quiet." },
    ppo: { text: "The tavern is nearly empty. A hooded traveler sits alone in the corner nursing an ale, and glances up when you turn. The only other sound is the crackle of the hearth.", rows: [{ k: "W", v: 1.0 }], verdict: "One new entity: within the acceptable range.", gains: ["one new entity only", "keeps the mood quiet", "gives you a hook"] },
  },
  {
    tab: "Forgotten name", trap: "amnesia", focus: "W", intent: "DIALOGUE",
    state: ["innkeeper: Gregor Thorngage", "halfling, proprietor"],
    player: "I ask the innkeeper about local rumors.",
    base: { text: "The innkeeper leans close and lowers his voice. “Lights in the old quarry, friend. Folk won't go near it after dark,” he says, though you realise you never caught his name.", flag: "though you realise you never caught his name", rows: [{ k: "W", v: 0.5 }], verdict: "He introduced himself as Gregor Thorngage; the name is lost." },
    ppo: { text: "Gregor Thorngage leans across the bar and lowers his voice. “Lights in the old quarry, friend. Folk won't go near it after dark.” He wipes the same glass twice, eyes on the door.", rows: [{ k: "W", v: 1.0 }], verdict: "Keeps the NPC's name and voice.", gains: ["Gregor, by name", "rumor in his own voice", "a hook: the quarry"] },
  },
];

function Flagged({ text, flag }: { text: string; flag?: string }) {
  const i = flag ? text.indexOf(flag) : -1;
  if (i < 0 || !flag) return <>{text}</>;
  return <>{text.slice(0, i)}<mark style={{ background: "color-mix(in srgb, var(--bad) 18%, transparent)", color: "inherit", borderBottom: "2px solid var(--bad)", borderRadius: 2 }}>{flag}</mark>{text.slice(i + flag.length)}</>;
}

function Card({ title, side, tone, w }: { title: string; side: Side; tone: "base" | "ppo"; w: Record<K, number> }) {
  const good = tone === "ppo";
  // One score per answer: the intent-weighted reward over the critics scored, or the lone critic's score.
  const wsum = side.rows.reduce((a, r) => a + w[r.k], 0);
  const score = side.rows.length > 1 ? side.rows.reduce((a, r) => a + w[r.k] * r.v, 0) / wsum : side.rows[0].v;
  const label = side.rows.length > 1 ? "intent-weighted reward" : `${NAMES[side.rows[0].k].toLowerCase()} critic`;
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "0.55rem", border: `1px solid ${good ? "var(--accent)" : "var(--rule)"}`, borderRadius: 10, padding: "0.75rem 0.85rem", background: "var(--card)", minWidth: 0 }}>
      <div className="mono" style={{ fontSize: "0.64rem", letterSpacing: "0.08em", textTransform: "uppercase", color: good ? "var(--accent)" : "var(--ink-3)" }}>{title}</div>
      <p style={{ margin: 0, fontFamily: "var(--serif)", fontSize: "0.9rem", lineHeight: 1.45, flex: 1, color: good ? "var(--ink)" : "var(--ink-2)" }}><Flagged text={side.text} flag={side.flag} /></p>
      {side.gains && <div className="chips">{side.gains.map((g) => <span key={g} className="chip" style={{ background: "color-mix(in srgb, var(--ok) 14%, transparent)", color: "var(--ok)" }}>+ {g}</span>)}</div>}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", borderTop: "1px solid var(--rule)", paddingTop: 6 }}>
        <span className="mono dim" style={{ fontSize: "0.6rem" }}>{label}</span>
        <span style={{ fontFamily: "var(--serif)", fontSize: "1.9rem", lineHeight: 1, color: score < 0.5 ? "var(--bad)" : good ? "var(--ok)" : "var(--ink)" }}>{score.toFixed(2)}</span>
      </div>
      <div className="mono" style={{ fontSize: "0.66rem", lineHeight: 1.4, color: good ? "var(--ok)" : "var(--bad)" }}>{good ? "✓" : "✗"} {side.verdict}</div>
    </div>
  );
}

export default function Critics() {
  const [i, setI] = useState(1);
  const manual = useRef(false);
  useEffect(() => {
    const id = window.setInterval(() => { if (!manual.current) setI((x) => (x + 1) % TURNS.length); }, 9000);
    return () => clearInterval(id);
  }, []);
  const T = TURNS[i];
  const w = WEIGHTS[T.intent];
  const top = Math.max(...Object.values(w));

  return (
    <div className="stage">
      <div className="stage-h">
        <span className="mono">where the supervised model sounds right and is wrong</span>
        <div className="tabs">{TURNS.map((t, k) => <button key={t.tab} className={`sm ${i === k ? "on" : ""}`} onClick={() => { manual.current = true; setI(k); }}>{t.tab}</button>)}</div>
      </div>

      <div className="crit-top">
        <div style={{ display: "grid", gap: "0.55rem" }}>
          <div>
            <div className="mono dim" style={{ fontSize: "0.6rem", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 3 }}>player · trap <b className="acc">{T.trap}</b></div>
            <div style={{ fontFamily: "var(--serif)", fontStyle: "italic", fontSize: "1.08rem", lineHeight: 1.3 }}>“{T.player}”</div>
          </div>
          <div>
            <div className="mono dim" style={{ fontSize: "0.6rem", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 4 }}>world state the critic tracks</div>
            <div className="chips">{T.state.map((s) => <span key={s} className="chip" style={{ fontSize: "0.7rem" }}>{s}</span>)}</div>
          </div>
        </div>
        <div>
          <div className="mono dim" style={{ fontSize: "0.6rem", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 5 }}>intent <b className="acc">{T.intent}</b> → critic weights</div>
          <div style={{ display: "flex", gap: 8, alignItems: "flex-end", height: 62 }} aria-label="Critic weights for this intent">
            {(Object.keys(NAMES) as K[]).map((k) => (
              <div key={k} className="mono" style={{ flex: 1, textAlign: "center" }}>
                <div style={{ height: `${(w[k] / 0.4) * 38}px`, background: w[k] === top ? "var(--accent)" : "var(--ink-3)", opacity: w[k] === top ? 1 : 0.55, borderRadius: 3, transition: "height 0.5s var(--ease)" }} />
                <div style={{ fontSize: "0.56rem", color: w[k] === top ? "var(--accent)" : "var(--ink-3)", marginTop: 3, whiteSpace: "nowrap" }}>{k === "Ch" ? "Char" : NAMES[k].slice(0, 4)} {Math.round(w[k] * 100)}%</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div key={i} className="crit-cards">
        <Card title="Supervised baseline" side={T.base} tone="base" w={w} />
        <Card title="After PPO with the critics" side={T.ppo} tone="ppo" w={w} />
      </div>
    </div>
  );
}
