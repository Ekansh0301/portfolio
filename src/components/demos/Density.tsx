import { useMemo, useState } from "react";

/**
 * Type a post and watch the narrative-density idea from the Truth Gradient
 * README at work. A conspiracy narrative has five slots (Actor, Action,
 * Effect, Evidence, Victim); believers fill all five and pack more markers
 * into a post (6.53 vs 4.35 per post, Cohen's d = 0.56; full narratives 41.3%
 * vs 22.2%). The predictor below is a small, transparent lexicon-and-slots
 * scorer with the project's decision threshold (tau = 0.595). It is an
 * illustration of the signal, not the submitted DeBERTa-v3-large system.
 */
type Slot = "actor" | "action" | "effect" | "evidence" | "victim";
const SLOTS: { k: Slot; label: string; hue: number; terms: string[] }[] = [
  { k: "actor", label: "Actor", hue: 14, terms: ["they", "them", "the elites", "elites", "the government", "government", "the media", "mainstream media", "insiders", "the same few", "big pharma", "the establishment", "those in power", "politicians", "the banks", "corporations", "officials", "the agency"] },
  { k: "action", label: "Action", hue: 42, terms: ["covered up", "cover-up", "cover up", "hid", "hiding", "hidden", "lied", "lying", "quietly rewrote", "rewrote", "controlled", "controlling", "manipulated", "silenced", "planned", "orchestrated", "staged", "faked", "destroyed", "deleted", "buried", "suppressed", "censored", "paid off", "run everything", "behind the scenes", "walked away", "changed the story"] },
  { k: "effect", label: "Effect", hue: 150, terms: ["which is why", "as a result", "nobody can", "no one can", "left paying", "ruined", "never found", "kept from", "the result is", "ended up", "that's how", "can't trace", "cannot trace"] },
  { k: "evidence", label: "Evidence", hue: 205, terms: ["i checked", "i pulled", "i looked it up", "i looked into", "don't line up", "doesn't line up", "doesn't add up", "don't add up", "records show", "filings", "documents", "leaked", "footage", "the timing", "not a coincidence", "coincidence", "no explanation", "why else", "i did the math"] },
  { k: "victim", label: "Victim", hue: 285, terms: ["ordinary people", "ordinary families", "families like mine", "people like me", "our children", "our kids", "taxpayers", "the public", "regular folks", "the rest of us", "working people", "normal people"] },
];
const col = (k: Slot, a = 1) => `hsl(${SLOTS.find((s) => s.k === k)!.hue} 68% 52% / ${a})`;
const TAU = 0.595;
const sig = (x: number) => 1 / (1 + Math.exp(-x));
const esc = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const MATCHERS = SLOTS.map((s) => ({ k: s.k, re: new RegExp(`(?<![\\w'])(${[...s.terms].sort((a, b) => b.length - a.length).map(esc).join("|")})(?![\\w'])`, "gi") }));

const PRESETS: Record<string, string> = {
  "reads like a believer": "They quietly rewrote the funding records the week the story broke, which is why nobody can trace the money now. I pulled the original filings myself and the dates don't line up. Ordinary families like mine were left paying for it while the same few insiders walked away untouched.",
  "just discussing it": "My uncle spent dinner insisting the elites run everything from behind the scenes. I told him people have been saying that for decades. We argued for a while, then watched the match and he complained about the referee.",
};

type Hit = { s: number; e: number; k: Slot };
function analyse(text: string) {
  const all: Hit[] = [];
  for (const { k, re } of MATCHERS) { re.lastIndex = 0; for (const m of text.matchAll(re)) all.push({ s: m.index!, e: m.index! + m[0].length, k }); }
  all.sort((a, b) => a.s - b.s || b.e - a.e);
  const hits: Hit[] = [];
  for (const h of all) if (!hits.length || h.s >= hits[hits.length - 1].e) hits.push(h);
  const counts = Object.fromEntries(SLOTS.map((s) => [s.k, hits.filter((h) => h.k === s.k).length])) as Record<Slot, number>;
  const filled = SLOTS.filter((s) => counts[s.k] > 0).length;
  const p = sig(0.5 * (hits.length - 5) + 0.6 * (filled - 3));
  return { hits, counts, filled, p };
}

export default function Density() {
  const [text, setText] = useState(PRESETS["reads like a believer"]);
  const r = useMemo(() => analyse(text), [text]);
  const believes = r.p >= TAU;

  const parts: React.ReactNode[] = [];
  let at = 0;
  r.hits.forEach((h, i) => {
    if (h.s > at) parts.push(<span key={`t${i}`}>{text.slice(at, h.s)}</span>);
    parts.push(<span key={`h${i}`} style={{ background: col(h.k, 0.16), borderBottom: `2.5px solid ${col(h.k)}`, borderRadius: 2 }}>{text.slice(h.s, h.e)}</span>);
    at = h.e;
  });
  if (at < text.length) parts.push(<span key="end">{text.slice(at)}</span>);

  return (
    <div className="stage">
      <div className="stage-h">
        <span className="mono">type a post, get a prediction</span>
        <div className="tabs">{Object.keys(PRESETS).map((k) => <button key={k} className={`sm ${text === PRESETS[k] ? "on" : ""}`} onClick={() => setText(PRESETS[k])}>{k}</button>)}</div>
      </div>

      <textarea className="field" rows={3} value={text} onChange={(e) => setText(e.target.value)} placeholder="Write or paste a Reddit-style post…" style={{ resize: "none", lineHeight: 1.5, fontFamily: "var(--sans)", fontSize: "0.95rem" }} aria-label="Post text" />

      <p style={{ margin: 0, fontFamily: "var(--serif)", fontSize: "1.02rem", lineHeight: 1.7, minHeight: "3.4rem", color: "var(--ink)" }}>{text.trim() ? parts : <span className="dim">Highlights appear here as you type.</span>}</p>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(5, minmax(0,1fr))", gap: 6 }}>
        {SLOTS.map((s) => {
          const n = r.counts[s.k];
          return (
            <div key={s.k} style={{ border: `1px solid ${n ? col(s.k) : "var(--rule)"}`, background: n ? col(s.k, 0.1) : "transparent", borderRadius: 8, padding: "0.35rem 0.4rem", textAlign: "center", transition: "all 0.3s" }}>
              <div className="mono" style={{ fontSize: "0.64rem", color: n ? col(s.k) : "var(--ink-3)", fontWeight: 600 }}>{s.label}</div>
              <div style={{ fontFamily: "var(--serif)", fontSize: "1.2rem", lineHeight: 1.1, color: n ? "var(--ink)" : "var(--ink-3)" }}>{n || "—"}</div>
            </div>
          );
        })}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "minmax(0,1.2fr) minmax(0,1fr)", gap: "0.9rem", alignItems: "center" }}>
        <div>
          <div className="mono" style={{ display: "flex", justifyContent: "space-between", fontSize: "0.66rem", marginBottom: 4 }}>
            <span className="dim">belief score</span><span>{r.hits.length} markers · {r.filled}/5 slots</span>
          </div>
          <div style={{ position: "relative", height: 12, background: "var(--bg-2)", borderRadius: 6 }}>
            <div style={{ position: "absolute", inset: "0 auto 0 0", width: `${r.p * 100}%`, background: believes ? "var(--accent)" : "var(--ink-3)", borderRadius: 6, transition: "width 0.4s var(--ease)" }} />
            <div style={{ position: "absolute", left: `${TAU * 100}%`, top: -3, bottom: -3, width: 2, background: "var(--ink)" }} title="decision threshold τ = 0.595" />
          </div>
          <div className="mono dim" style={{ fontSize: "0.56rem", marginTop: 3 }}>▲ τ = 0.595, the project's tuned threshold</div>
        </div>
        <div style={{ textAlign: "center", border: "1px solid var(--rule)", borderRadius: 8, padding: "0.5rem", background: "var(--card)" }}>
          <div className="mono dim" style={{ fontSize: "0.58rem" }}>PREDICTION</div>
          <div style={{ fontFamily: "var(--serif)", fontSize: "1.3rem", color: believes ? "var(--accent)" : "var(--ink)" }}>{text.trim() ? (believes ? "believes it" : "doesn't") : "—"}</div>
          <div className="mono dim" style={{ fontSize: "0.6rem" }}>p = {r.p.toFixed(2)}</div>
        </div>
      </div>

    </div>
  );
}
