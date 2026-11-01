import { useEffect, useRef, useState } from "react";
import { profile, scenes, socials } from "../data/content";

/**
 * The name, spelled out in work. Every letter of EKANSH GOYAL is a tile that
 * flips to reveal something from the projects behind this site. A spotlight
 * walks along the name on its own; hover or tap any letter to take over.
 */
type L = { ch: string; word: string; line: string; to: string };
const ROWS: L[][] = [
  [
    { ch: "E", word: "EMNLP", line: "Scene saliency in movie screenplays, a main-conference paper.", to: "research" },
    { ch: "K", word: "Key-value", line: "QuorumKV: a masterless store that keeps answering through a partition.", to: "systems" },
    { ch: "A", word: "Anemia", line: "Haemoglobin from a photo of the inner eyelid, on the phone.", to: "applied" },
    { ch: "N", word: "Narrative", line: "The Director LLM: a Dungeon Master trained by four critics.", to: "systems" },
    { ch: "S", word: "SemEval", line: "Truth Gradient: reading belief in a Reddit post.", to: "research" },
    { ch: "H", word: "Håstad", line: "Breaking RSA with no key at all, inside CryptoStack.", to: "intelligence" },
  ],
  [
    { ch: "G", word: "Gate", line: "LGSM's learned gate between BERT and linguistic features.", to: "research" },
    { ch: "O", word: "Offline", line: "Vox: a voice assistant that runs on a 4 GB laptop GPU.", to: "intelligence" },
    { ch: "Y", word: "Yao", line: "Two-party computation and the millionaires' problem.", to: "intelligence" },
    { ch: "A", word: "AES", line: "Written from the spec, then used to break ECB.", to: "intelligence" },
    { ch: "L", word: "LRU", line: "The naming server's cache in my distributed file system.", to: "applied" },
  ],
];
const FLAT = ROWS.flat();

export default function Hero({ id }: { id: string }) {
  const [active, setActive] = useState(1);
  const hover = useRef(false);

  useEffect(() => {
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const t = window.setInterval(() => { if (!hover.current) setActive((a) => (a + 1) % FLAT.length); }, 2100);
    return () => clearInterval(t);
  }, []);

  const cur = FLAT[active];
  let n = -1;
  return (
    <section id={id} className="page hero">
      <div className="hero-main">
        <div className="wrap hero-grid">
          <div className="hero-left">
            <div className="mono dim" style={{ textTransform: "uppercase", letterSpacing: "0.12em" }}>A portfolio in seven scenes · hover the letters</div>

            <div className="tiles" onPointerLeave={() => { hover.current = false; }}>
              {ROWS.map((row, r) => (
                <div className="tile-row" key={r} style={{ paddingLeft: r ? "clamp(0.4rem, 3vw, 2.4rem)" : 0 }}>
                  {row.map((l) => {
                    const idx = ++n, on = idx === active;
                    return (
                      <button key={idx} className={`tile ${on ? "on" : ""}`} aria-label={`${l.ch}: ${l.word}. ${l.line}`}
                        onPointerEnter={() => { hover.current = true; setActive(idx); }}
                        onFocus={() => { hover.current = true; setActive(idx); }}
                        onClick={() => document.getElementById(l.to)?.scrollIntoView({ behavior: "smooth" })}>
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
              <span className="mono acc">{cur.ch} · {cur.word}</span>
              <span>{cur.line}</span>
              <a className="link" href={`#${cur.to}`}>see it ↓</a>
            </div>

            <p className="tagline">{profile.tagline}</p>
            <div className="row">
              <a className="btn solid" href="#systems">Open the reel ↓</a>
              {socials.filter((x) => x.label !== "Email").map((x) => (
                <a key={x.label} className="btn ghost" href={x.href} target="_blank" rel="noreferrer">{x.label} ↗</a>
              ))}
            </div>
          </div>

          <div className="titlepage">
            <div className="mono dim"><span className="status">{profile.availability}</span></div>
            <p className="role" style={{ fontFamily: "var(--serif)", fontSize: "clamp(1.25rem, 1.9vw, 1.7rem)", lineHeight: 1.25, color: "var(--ink)" }}>{profile.eyebrow}</p>
            <p className="role">{profile.blurb}</p>
            <ul className="facts">
              <li><b>EMNLP 2026</b><span>Scene saliency in movie screenplays, main conference</span></li>
              <li><b>SEMEVAL-26</b><span>Conspiracy belief detection, sole author</span></li>
              <li><b>LTRC</b><span>Undergraduate researcher, IIIT Hyderabad</span></li>
            </ul>
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
