import { useMemo, useState } from "react";

/**
 * The SemEval finding in miniature: believers spread conspiratorial framing
 * across a whole post instead of packing it into a few tell-tale words. A
 * max-pooled keyword spotter and a mean-pooled narrative density read the same
 * text and can disagree. Lexicon and posts are mine, an illustration of the
 * idea and not the submitted model.
 */
const CUES = ["they", "them", "their", "cover-up", "covered", "hidden", "truth", "lies", "lying", "control", "controlled", "agenda", "puppet", "sheep", "planned", "orchestrated", "coincidence", "mainstream", "elites", "secret", "exposed", "silenced", "paid", "nobody tells"];
const POSTS = {
  "just recounting": "My uncle spent dinner explaining how the elites run everything through a secret agenda and a total cover-up. I nodded along. Then he asked me to pass the rice. We watched the match afterwards and he complained about the referee. Honestly I just wanted to finish my homework.",
  "actually believes": "I checked the dates myself and they never line up. The funding story changed twice, which is not a coincidence. Local reporters stopped asking and nobody tells you why. Look at who benefits and who got quietly paid. It was planned a long time before anyone noticed.",
} as const;
type Post = keyof typeof POSTS;
const re = new RegExp(`\\b(${CUES.map((c) => c.replace("-", "\\-")).join("|")})\\b`, "gi");
const hits = (s: string) => (s.match(re) ?? []).length;

export default function Density() {
  const [post, setPost] = useState<Post>("actually believes");
  const r = useMemo(() => {
    const sents = POSTS[post].split(/(?<=[.!?])\s+/);
    const h = sents.map(hits);
    return { sents, h, max: Math.max(...h), density: h.filter((x) => x > 0).length / h.length };
  }, [post]);
  const spotter = r.max >= 3, dens = r.density >= 0.6;
  const verdict = (flag: boolean) => <b className={flag ? "bad" : "ok"}>{flag ? "believer" : "not a believer"}</b>;

  return (
    <div className="stage">
      <div className="stage-h">
        <span className="mono">same post, two ways to read it</span>
        <div className="tabs">{(Object.keys(POSTS) as Post[]).map((k) => <button key={k} className={`sm ${post === k ? "on" : ""}`} onClick={() => setPost(k)}>{k}</button>)}</div>
      </div>
      <p style={{ margin: 0, fontFamily: "var(--serif)", fontSize: "0.98rem", lineHeight: 1.55 }}>
        {r.sents.map((s, i) => (
          <span key={i} style={{ background: r.h[i] ? `color-mix(in srgb, var(--accent) ${Math.min(26, 10 + r.h[i] * 6)}%, transparent)` : "transparent", borderRadius: 3, transition: "background 0.4s" }}>
            {s.split(re).map((part, k) => (k % 2 ? <mark key={k} style={{ background: "none", color: "var(--accent)", fontWeight: 600 }}>{part}</mark> : part))}{" "}
          </span>
        ))}
      </p>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.7rem", marginTop: "auto" }}>
        <div className="log" style={{ minHeight: 0 }}>
          <div className="dim">keyword spotter · looks at the loudest sentence</div>
          <div>{r.max} cue{r.max === 1 ? "" : "s"} in one sentence → {verdict(spotter)}</div>
        </div>
        <div className="log" style={{ minHeight: 0 }}>
          <div className="dim">narrative density · looks at the spread</div>
          <div>{Math.round(r.density * 100)}% of sentences carry framing → {verdict(dens)}</div>
        </div>
      </div>
    </div>
  );
}
