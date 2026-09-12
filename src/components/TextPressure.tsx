import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";

type Props = {
  text: string;
  /** Lowest weight a letter falls to when the cursor is far away. */
  minWeight?: number;
  maxWeight?: number;
  minWidth?: number;
  maxWidth?: number;
  minGrade?: number;
  maxGrade?: number;
  /** Fade distant letters out as well as thinning them. Off by default:
   *  dimming makes the hairline glyphs read grey rather than white. */
  alpha?: boolean;
  className?: string;
};

/** How hard the eased cursor chases the pointer. Higher tracks tighter. */
const FOLLOW = 0.24;

/**
 * The hero title. Each glyph is its own span whose `font-variation-settings`
 * are recomputed from its distance to a smoothed cursor, so letters near the
 * pointer bloom heavy and wide while the rest stay as hairline outlines.
 * Requires a variable font (Roboto Flex).
 *
 * The frame loop is split into a read pass and a write pass. Interleaving them
 * would force a synchronous reflow per glyph, because changing a variation
 * axis re-shapes the text and invalidates the next getBoundingClientRect.
 */
export default function TextPressure({
  text,
  minWeight = 100,
  maxWeight = 1000,
  minWidth = 25,
  maxWidth = 151,
  /** Roboto Flex's grade axis. Negative thins the stroke without changing the
   *  glyph's width, which `wght` alone cannot do once it bottoms out at 100. */
  minGrade = -140,
  maxGrade = 0,
  alpha = false,
  className = "",
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const spansRef = useRef<(HTMLSpanElement | null)[]>([]);

  // Raw pointer, and the eased position that actually drives the letters.
  const mouse = useRef({ x: 0, y: 0 });
  const cursor = useRef({ x: 0, y: 0 });
  // Last values written per glyph, so idle frames touch no styles at all.
  const applied = useRef<{ w: number; d: number; o: number; g: number }[]>([]);

  const [fontSize, setFontSize] = useState(24);
  const [scaleY, setScaleY] = useState(1);

  const chars = text.split("");

  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      mouse.current.x = e.clientX;
      mouse.current.y = e.clientY;
    };
    // Start the light off-canvas so the title reads as outlines on load.
    const r = containerRef.current?.getBoundingClientRect();
    if (r) {
      mouse.current = { x: r.left - 400, y: r.top + r.height / 2 };
      cursor.current = { ...mouse.current };
    }
    window.addEventListener("pointermove", onMove, { passive: true });
    return () => window.removeEventListener("pointermove", onMove);
  }, []);

  /**
   * Size from the container HEIGHT (the glyphs are hairline-thin at rest, so
   * width tells us nothing), capped by width on narrow screens.
   */
  const setSize = useCallback(() => {
    if (!containerRef.current || !titleRef.current) return;
    const { width: cw, height: ch } = containerRef.current.getBoundingClientRect();
    if (!ch || !cw) return;

    // Height drives the size, but cap it so the glyphs always fit the width
    // on narrow screens (0.68em is the advance at a mid `wdth` setting).
    const next = Math.max(Math.min(ch * 1.05, cw / (chars.length * 0.68)), 20);
    setFontSize(next);

    // With line-height 1 the title's layout height is exactly its font size,
    // so the vertical fit is arithmetic, not a measurement. Measuring the
    // rendered box used to race React's commit and read a stale transform,
    // which stretched the word on first load until a resize (a mobile toolbar
    // collapsing on scroll) re-ran it. Capped at 1 so the word is only ever
    // compressed to fit, never stretched: on phones, where width limits the
    // size, the letters keep their natural proportions.
    setScaleY(Math.min(1, containerRef.current.clientHeight / next));
  }, [chars.length]);

  useLayoutEffect(() => {
    setSize();
    window.addEventListener("resize", setSize);
    // Roboto Flex usually lands after first paint; refit so the word does not
    // visibly jump when the real variable font swaps in.
    let cancelled = false;
    document.fonts?.ready.then(() => {
      if (!cancelled) setSize();
    });
    return () => {
      cancelled = true;
      window.removeEventListener("resize", setSize);
    };
  }, [setSize]);

  useEffect(() => {
    let raf = 0;

    const tick = () => {
      raf = requestAnimationFrame(tick);

      const title = titleRef.current;
      const spans = spansRef.current;
      if (!title) return;

      const dx = mouse.current.x - cursor.current.x;
      const dy = mouse.current.y - cursor.current.y;
      // Settled and already painted: nothing to recompute this frame.
      const settled = Math.abs(dx) < 0.4 && Math.abs(dy) < 0.4;
      if (settled && applied.current.length === spans.length) return;

      cursor.current.x += dx * FOLLOW;
      cursor.current.y += dy * FOLLOW;

      // --- read pass: every measurement before any mutation ---
      const rect = title.getBoundingClientRect();
      // Falloff radius scales with the word so it feels the same at any size.
      const maxDist = rect.width / 2.15;
      const cx = cursor.current.x;
      const cy = cursor.current.y;

      const next: { w: number; d: number; o: number; g: number; a: number }[] = [];
      for (let i = 0; i < spans.length; i++) {
        const span = spans[i];
        if (!span) {
          next.push({ w: minWeight, d: minWidth, o: 8, g: minGrade, a: 1 });
          continue;
        }
        const b = span.getBoundingClientRect();
        const dist = Math.hypot(cx - (b.x + b.width / 2), cy - (b.y + b.height / 2));
        const raw = Math.min(dist / maxDist, 1);
        // Smoothstep rather than a linear ramp: letters under the cursor hold
        // their full weight longer and the rest drop to hairline faster, which
        // is what gives the word its bold-to-thin contrast.
        const t = raw * raw * (3 - 2 * raw);
        const attr = (min: number, max: number) => Math.max(min, max + (min - max) * t);

        next.push({
          w: Math.round(attr(minWeight, maxWeight)),
          d: Math.round(attr(minWidth, maxWidth)),
          o: Math.round(attr(8, 144)),
          g: Math.round(attr(minGrade, maxGrade)),
          a: alpha ? Math.round(attr(0.28, 1) * 100) / 100 : 1,
        });
      }

      // --- write pass: only glyphs whose axes actually moved ---
      for (let i = 0; i < spans.length; i++) {
        const span = spans[i];
        const n = next[i];
        if (!span) continue;
        const prev = applied.current[i];
        if (prev && prev.w === n.w && prev.d === n.d && prev.o === n.o && prev.g === n.g) continue;

        span.style.fontVariationSettings = `"wght" ${n.w}, "wdth" ${n.d}, "opsz" ${n.o}, "GRAD" ${n.g}`;
        span.style.opacity = String(n.a);
      }
      applied.current = next;
    };

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [alpha, minWeight, maxWeight, minWidth, maxWidth, minGrade, maxGrade]);

  return (
    <div ref={containerRef} className="relative h-full w-full">
      <h1
        ref={titleRef}
        className={`text-pressure-title tp-flex ${className}`}
        style={{
          fontSize,
          lineHeight: 1,
          transform: `scale(1, ${scaleY})`,
          transformOrigin: "center center",
        }}
      >
        {chars.map((c, i) => (
          <span
            key={i}
            ref={(el) => {
              spansRef.current[i] = el;
            }}
            data-char={c}
          >
            {c}
          </span>
        ))}
      </h1>
    </div>
  );
}
