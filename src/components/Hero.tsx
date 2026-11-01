import { useEffect, useRef, useState } from "react";
import { profile, scenes, socials } from "../data/content";

/**
 * The name, spelled out in work. Every letter of EKANSH GOYAL is a tile for one
 * of my public repositories: it flips to reveal the project, with a GitHub link,
 * and a "demo" link when that project also has a demo on this site. A spotlight
 * walks along the plate on its own; hover or tap any letter to take over.
 */
const GH = "https://github.com/Ekansh0301/";
type L = { ch: string; word: string; repo?: string; line: string; demo?: string; priv?: boolean };
const ROWS: L[][] = [
  [
    { ch: "E", word: "EMNLP", line: "Scene saliency in movie screenplays: a 2026 main-conference paper.", demo: "research" },
    { ch: "K", word: "Key-value", repo: "QuorumKV", line: "A masterless store that keeps answering through a partition.", demo: "systems" },
    { ch: "A", word: "Attention", repo: "sparse-moe-summarization", line: "A sparse mixture-of-experts transformer, written from scratch for summarization." },
    { ch: "N", word: "Narrative", repo: "Dropout-Squad", line: "A Dungeon Master fine-tuned with PPO by four critics.", demo: "systems" },
    { ch: "S", word: "SemEval", repo: "conspiracy-belief-detection", line: "Reading belief in a Reddit post: SemEval-2026 Task 10.", demo: "research" },
    { ch: "H", word: "Healthcare", repo: "Dr.Pixels", line: "Do medical text encoders help medical visual QA? RadBERT beat BERT by 11.6 points." },
  ],
  [
    { ch: "G", word: "Galactic", repo: "galactic-glitch-hunters", line: "A Godot game that teaches children to fight gender bias with logic." },
    { ch: "O", word: "Offline", repo: "Voxd", line: "A voice assistant that runs on a 4 GB laptop GPU.", demo: "intelligence" },
    { ch: "Y", word: "Yao", repo: "CryptoStack", line: "Twenty cryptographic primitives from scratch, up to two-party computation.", demo: "intelligence" },
    { ch: "A", word: "Anemia", line: "Haemoglobin from a photo of the lower eyelid, on the phone.", demo: "applied", priv: true },
    { ch: "L", word: "LRU", repo: "Fault-Tolerant-Distributed-Storage-System", line: "The naming server's cache in my distributed file system: control plane and data plane, in C." },
  ],
];
const FLAT = ROWS.flat();

export default function Hero({ id }: { id: string }) {
  const [active, setActive] = useState(1);
  const hover = useRef(false);

  useEffect(() => {
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const t = window.setInterval(() => { if (!hover.current) setActive((a) => (a + 1) % FLAT.length); }, 2400);
    return () => clearInterval(t);
  }, []);

  const cur = FLAT[active];
  let n = -1;
  return (
    <section id={id} className="page hero">
      <div className="hero-main">
        <div className="wrap hero-grid">
          <div className="hero-left">
            <div className="mono dim" style={{ textTransform: "uppercase", letterSpacing: "0.12em" }}>Every letter is one of my repositories · hover to read</div>

            <div className="tiles" onPointerLeave={() => { hover.current = false; }}>
              {ROWS.map((row, r) => (
                <div className="tile-row" key={r} style={{ paddingLeft: r ? "clamp(0.4rem, 3vw, 2.4rem)" : 0 }}>
                  {row.map((l) => {
                    const idx = ++n, on = idx === active;
                    return (
                      <button key={idx} style={{ ["--n" as string]: idx }} className={`tile ${on ? "on" : ""}`} aria-label={`${l.ch}: ${l.word}${l.repo ? ", " + l.repo : ""}. ${l.line}`}
                        onPointerEnter={() => { hover.current = true; setActive(idx); }}
                        onFocus={() => { hover.current = true; setActive(idx); }}
                        onClick={() => { hover.current = true; setActive(idx); }}>
                        <span className="tile-in">
                          <span className="face front">{l.ch}</span>
                          <span className="face back"><b>{l.ch}</b><i>{l.word}</i></span>
                        </span>
                      </button>
                    );
                  })}
                </div>
              ))}
            </div>

            <div className="tile-cap" key={active} aria-live="polite">
              <span className="mono acc">{cur.ch} · {cur.word}{cur.repo ? ` · ${cur.repo}` : cur.priv ? " · private repository" : " · paper"}</span>
              <span>{cur.line}</span>
              <span className="row" style={{ gap: "1.1rem", marginTop: "0.2rem" }}>
                {cur.repo && <a className="link" href={GH + cur.repo} target="_blank" rel="noreferrer">GitHub ↗</a>}
                {cur.demo && <a className="link" href={`#${cur.demo}`}>see the demo ↓</a>}
              </span>
            </div>

            <p className="tagline">{profile.tagline}</p>
            <div className="row">
              <a className="btn big solid" href={socials[0].href} target="_blank" rel="noreferrer"><Gh /> GitHub</a>
              <a className="btn big ghost" href={socials[1].href} target="_blank" rel="noreferrer">LinkedIn ↗</a>
              <a className="btn big ghost" href="#systems">Open the reel ↓</a>
            </div>
          </div>

          <div className="titlepage">
            <div className="mono dim"><span className="status">{profile.availability}</span></div>
            <h2 className="hl">Turning research into <em>systems</em>.</h2>
            <p className="role">NLP researcher and systems engineer. I read papers on narrative and belief, then build the distributed stores, voice assistants and cipher suites that put the ideas to work.</p>
            <div className="stats">
              <div><b>2</b><span>papers, 2026<br />EMNLP · SemEval</span></div>
              <div><b>1st</b><span>prize<br />LPL WealthX 2026</span></div>
              <div><b>8.21</b><span>CGPA<br />dual degree</span></div>
            </div>
            <div className="awards">
              <span><i>★</i> Dean's List · 2025-26</span>
              <span><i>★</i> Research List Award · 2025-26</span>
            </div>
            <p className="mono dim" style={{ margin: 0, fontSize: "0.68rem" }}>LTRC · IIIT Hyderabad · B.Tech CS + MS by Research, Computational Linguistics</p>
          </div>
        </div>
      </div>

      <nav className="wrap reel" aria-label="Scenes">
        {scenes.map((x, i) => (
          <a key={x.id} href={`#${x.id}`} className={i === 0 ? "on" : ""}>
            <span className="tick" />
            <span className="mono">{String(i + 1).padStart(2, "0")}</span>
            <span className="name">{x.label}</span>
          </a>
        ))}
      </nav>
    </section>
  );
}

export function Gh() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" aria-hidden>
      <path d="M12 .5A11.5 11.5 0 0 0 .5 12a11.5 11.5 0 0 0 7.86 10.92c.58.1.79-.25.79-.56v-2c-3.2.7-3.88-1.37-3.88-1.37-.53-1.34-1.29-1.7-1.29-1.7-1.05-.72.08-.7.08-.7 1.16.08 1.77 1.19 1.77 1.19 1.03 1.77 2.7 1.26 3.36.96.1-.75.4-1.26.73-1.55-2.56-.29-5.25-1.28-5.25-5.7 0-1.26.45-2.29 1.19-3.1-.12-.29-.52-1.46.11-3.05 0 0 .97-.31 3.18 1.18a11 11 0 0 1 5.8 0c2.2-1.5 3.17-1.18 3.17-1.18.63 1.59.23 2.76.12 3.05.74.81 1.18 1.84 1.18 3.1 0 4.43-2.69 5.4-5.26 5.69.41.36.78 1.06.78 2.14v3.17c0 .31.21.67.8.56A11.5 11.5 0 0 0 23.5 12 11.5 11.5 0 0 0 12 .5Z" />
    </svg>
  );
}
