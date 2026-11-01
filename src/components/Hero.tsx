import { useEffect, useRef } from "react";
import { profile, socials } from "../data/content";

type Block = { kind: "slug" | "action" | "cue" | "dlg"; text: string };

// The opening is written as a screenplay, because the research is about reading one.
const SCRIPT: Block[] = [
  { kind: "slug", text: "INT. LTRC, IIIT HYDERABAD - NIGHT" },
  { kind: "action", text: "A lab that never fully powers down. A researcher reads a screenplay the way a model would: scene by scene, deciding which ones matter." },
  { kind: "cue", text: "Ekansh" },
  { kind: "dlg", text: "Turning research into systems." },
  { kind: "action", text: "Then he builds what he read about. A quorum store that survives a partition. A voice assistant that never leaves the machine. A cipher suite meant to be broken." },
  { kind: "action", text: "Everything here is a working model. Break it." },
];

const REACH = 150; // px over which attention falls off
const FLOOR = 0.16;

/**
 * The cursor is the query vector. Every word is a token with a key; its opacity
 * is its softmax attention weight, so the words nearest the pointer light up.
 * Idle, attention is uniform and the page reads normally.
 */
export default function Hero({ id }: { id: string }) {
  const root = useRef<HTMLDivElement>(null);
  const readout = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = root.current;
    if (!el) return;
    const words = Array.from(el.querySelectorAll<HTMLElement>(".w"));
    const cur = words.map(() => 1);
    const p = { x: 0, y: 0, active: false };
    let raf = 0;
    let top = -1;

    const onMove = (e: PointerEvent) => {
      const r = el.getBoundingClientRect();
      p.active = e.clientX > r.left - 40 && e.clientX < r.right + 40 && e.clientY > r.top - 40 && e.clientY < r.bottom + 40;
      p.x = e.clientX;
      p.y = e.clientY;
    };
    window.addEventListener("pointermove", onMove, { passive: true });

    const frame = () => {
      const rects = words.map((w) => w.getBoundingClientRect());
      const target = words.map((_, i) => {
        if (!p.active) return 1;
        const r = rects[i];
        const d = Math.hypot(p.x - (r.left + r.width / 2), p.y - (r.top + r.height / 2));
        return Math.exp(-((d / REACH) ** 2) * 2);
      });
      let sum = 0;
      target.forEach((t) => (sum += t));
      let best = 0;
      words.forEach((w, i) => {
        const next = cur[i] + (target[i] - cur[i]) * 0.2;
        if (Math.abs(next - cur[i]) > 0.004) {
          cur[i] = next;
          w.style.opacity = String(FLOOR + (1 - FLOOR) * next);
        }
        if (target[i] > target[best]) best = i;
      });
      w_hl(words, p.active ? best : -1, top, (t) => (top = t));
      if (readout.current) {
        readout.current.innerHTML = p.active
          ? `query = cursor · attends to <b>"${words[best].textContent}"</b> (${Math.round((target[best] / sum) * 100)}%)`
          : "move your cursor over the page: it is the query, the words attend to it";
      }
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("pointermove", onMove);
    };
  }, []);

  let n = 0;
  return (
    <section id={id} className="page hero">
      <div className="wrap hero-grid">
        <div>
          <div className="script" ref={root}>
            {SCRIPT.map((b, i) => (
              <p key={i} className={b.kind === "dlg" ? "dlg" : b.kind}>
                {b.text.split(" ").map((w) => (
                  <span key={n++} className="w">{w} </span>
                ))}
              </p>
            ))}
          </div>
          <div className="attn" ref={readout} aria-hidden />
        </div>

        <div className="titlepage">
          <div className="mono dim"><span className="status">{profile.availability}</span></div>
          <h1>{profile.first[0] + profile.first.slice(1).toLowerCase()} {profile.last[0] + profile.last.slice(1).toLowerCase()}</h1>
          <p className="role">{profile.blurb}</p>
          <ul className="facts">
            <li><b>EMNLP 2026</b>Scene saliency in movie screenplays, main conference</li>
            <li><b>SEMEVAL-26</b>Conspiracy belief detection, sole author</li>
            <li><b>LTRC</b>Undergraduate researcher, IIIT Hyderabad</li>
          </ul>
          <div className="row">
            <a className="btn solid" href="#systems">Open the reel ↓</a>
            {socials.filter((s) => s.label !== "Email").map((s) => (
              <a key={s.label} className="btn ghost" href={s.href} target="_blank" rel="noreferrer">{s.label} ↗</a>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

/** Keep the strongest word highlighted in the accent colour. */
function w_hl(words: HTMLElement[], best: number, prev: number, set: (n: number) => void) {
  if (best === prev) return;
  if (prev >= 0) words[prev].classList.remove("hl");
  if (best >= 0) words[best].classList.add("hl");
  set(best);
}
