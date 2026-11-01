import { useMemo, useState } from "react";

/**
 * The SemEval finding in miniature: believers spread conspiratorial framing
 * across a whole post rather than packing it into a few tell-tale words. A
 * max-pooled "keyword spotter" and a mean-pooled "narrative density" read the
 * same text and can disagree. The lexicon and samples are mine: an
 * illustration of the idea, not the submitted model.
 */
const CUES = ["they", "them", "their", "cover-up", "covered", "hidden", "truth", "lies", "lying", "control", "controlled", "agenda", "puppet", "sheep", "sheeple", "planned", "orchestrated", "coincidence", "mainstream", "elites", "secret", "exposed", "wake up", "behind the scenes", "paid", "silenced", "nobody tells"];

const SAMPLES: Record<string, string> = {
  "recounting": "My uncle spent dinner explaining how the elites run everything through a secret agenda and a total cover-up. I nodded along. Then he asked me to pass the rice. We watched the match afterwards and he complained about the referee. Honestly I just wanted to finish my homework.",
  "believing": "I checked the dates myself and they never line up. The funding story changed twice, which is not a coincidence. Local reporters stopped asking and nobody tells you why. Look at who benefits and who got quietly paid. It was planned a long time before anyone noticed.",
};

const hits = (s: string) => { const t = s.toLowerCase(); return CUES.reduce((n, c) => n + (t.match(new RegExp(`\\b${c.replace("-", "\\-")}\\b`, "g"))?.length ?? 0), 0); };

export default function Density() {
  const [text, setText] = useState(SAMPLES.believing);
  const r = useMemo(() => {
    const sents = text.split(/(?<=[.!?])\s+/).filter((s) => s.trim());
    const h = sents.map(hits);
    const max = Math.max(0, ...h);
    return { sents, h, max, density: h.length ? h.filter((x) => x > 0).length / h.length : 0, mean: h.length ? h.reduce((a, b) => a + b, 0) / h.length : 0 };
  }, [text]);

  const spotter = r.max >= 3;
  const dens = r.density >= 0.6;
  const verdict = (flag: boolean) => <b className={flag ? "bad" : "ok"}>{flag ? "believer" : "not a believer"}</b>;

  return (
    <div className="stage">
      <div className="stage-h">
        <span className="mono">same text, two ways to read it</span>
        <div className="tabs">{Object.keys(SAMPLES).map((k) => <button key={k} className={`sm ${text === SAMPLES[k] ? "on" : ""}`} onClick={() => setText(SAMPLES[k])}>{k}</button>)}</div>
      </div>
      <textarea className="field" rows={4} value={text} onChange={(e) => setText(e.target.value)} style={{ resize: "none", lineHeight: 1.5 }} aria-label="Post text" />
      <div>
        <div className="mono dim" style={{ fontSize: "0.6rem", marginBottom: 3 }}>framing cues per sentence</div>
        <div style={{ display: "flex", gap: 3, alignItems: "flex-end", height: 44 }}>
          {r.h.map((n, i) => <div key={i} title={r.sents[i]} style={{ flex: 1, height: `${Math.max(8, n * 24)}%`, background: n ? "var(--accent)" : "var(--bg-2)", borderRadius: 3, transition: "height 0.4s" }} />)}
        </div>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.8rem" }}>
        <div className="log" style={{ minHeight: 0 }}>
          <div className="dim">keyword spotter · max-pool</div>
          <div>densest sentence: {r.max} cues</div>
          <div>→ {verdict(spotter)}</div>
        </div>
        <div className="log" style={{ minHeight: 0 }}>
          <div className="dim">narrative density · spread</div>
          <div>{Math.round(r.density * 100)}% of sentences carry framing</div>
          <div>→ {verdict(dens)}</div>
        </div>
      </div>
      <div className="out dim" style={{ fontSize: "0.64rem" }}>Try “recounting” vs “believing”: the spotter is fooled by a single loaded sentence and misses quiet, pervasive framing. Edit the text and see.</div>
    </div>
  );
}
