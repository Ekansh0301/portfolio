import { useEffect, useRef } from "react";
import { profile } from "../data/content";

const MIN = 200;
const MAX = 900;
const REACH = 260;

/**
 * The name is set in a variable serif. Each letter's weight is driven by its
 * distance to the pointer, so the name swells toward the cursor and relaxes
 * when it leaves. Reads happen before writes in each frame to avoid layout
 * thrash, and letters whose weight did not move are skipped.
 */
export default function Hero() {
  const root = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    const el = root.current;
    if (!el) return;
    const chars = Array.from(el.querySelectorAll<HTMLElement>(".ch"));
    const w = chars.map(() => MIN);
    const target = chars.map(() => MIN);
    const pointer = { x: -9999, y: -9999, active: false };
    const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
    let raf = 0;
    const t0 = performance.now();

    const onMove = (e: PointerEvent) => {
      pointer.x = e.clientX;
      pointer.y = e.clientY;
      pointer.active = true;
    };
    const onLeave = () => (pointer.active = false);
    window.addEventListener("pointermove", onMove, { passive: true });
    document.addEventListener("pointerleave", onLeave);

    const frame = (now: number) => {
      const rects = chars.map((c) => c.getBoundingClientRect());
      const t = (now - t0) / 1000;
      chars.forEach((_, i) => {
        const r = rects[i];
        let v = MIN;
        if (pointer.active) {
          const d = Math.hypot(pointer.x - (r.left + r.width / 2), pointer.y - (r.top + r.height / 2));
          v = MIN + (MAX - MIN) * Math.max(0, 1 - d / REACH) ** 1.6;
        } else if (!reduce) {
          // Idle: a slow wave rolls through the letters so the name is never static.
          v = MIN + 260 * Math.max(0, Math.sin(t * 0.9 - i * 0.55)) ** 3;
        }
        target[i] = v;
      });
      chars.forEach((c, i) => {
        const next = w[i] + (target[i] - w[i]) * 0.14;
        if (Math.abs(next - w[i]) < 0.4) return;
        w[i] = next;
        c.style.fontVariationSettings = `"opsz" 144, "SOFT" ${Math.round(((next - MIN) / (MAX - MIN)) * 100)}, "wght" ${Math.round(next)}`;
      });
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("pointermove", onMove);
      document.removeEventListener("pointerleave", onLeave);
    };
  }, []);

  return (
    <header id="top" className="hero">
      <div className="wrap" style={{ width: "100%" }}>
        <div className="eyebrow">
          <span className="status">{profile.availability}</span>
        </div>
      </div>

      <div className="wrap" style={{ width: "100%" }}>
        <h1 className="hero-name" ref={root} aria-label={`${profile.first} ${profile.last}`}>
          <span className="row" aria-hidden>
            {[...profile.first].map((c, i) => <span className="ch" key={i}>{c}</span>)}
          </span>
          <span className="row two" aria-hidden>
            {[...profile.last].map((c, i) => <span className="ch" key={i}>{c}</span>)}
          </span>
        </h1>
      </div>

      <div className="wrap" style={{ width: "100%" }}>
        <div className="hero-foot">
          <p>
            <span className="tag">{profile.tagline}</span>
            {profile.blurb}
          </p>
          <div className="cta">
            <a className="btn solid" href="#work">See the work ↓</a>
            <a className="btn ghost" href="#contact">Say hello</a>
          </div>
        </div>
        <div className="eyebrow" style={{ marginTop: "2.2rem" }}>
          Move your cursor over the name <b>/</b> {profile.location}
        </div>
      </div>
    </header>
  );
}
