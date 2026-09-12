import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { profile } from "../data/content";

type Props = {
  /** Fires as the curtain starts lifting, so the hero animates in behind it. */
  onReveal: () => void;
  /** Fires once the curtain is clear and the overlay can unmount. */
  onDone: () => void;
};

/**
 * Full-screen counter that ticks 0 to 100 while the page settles, then
 * curtains up to reveal the hero.
 */
export default function Preloader({ onReveal, onDone }: Props) {
  const root = useRef<HTMLDivElement>(null);
  const [count, setCount] = useState(0);

  useEffect(() => {
    document.body.classList.add("is-loading");
    const state = { v: 0 };

    const finish = () => {
      document.body.classList.remove("is-loading");
      onDone();
    };

    const tl = gsap.timeline({ onComplete: finish });

    tl.to(state, {
      v: 100,
      duration: 1.15,
      ease: "power2.out",
      onUpdate: () => setCount(Math.round(state.v)),
    })
      .to(".preloader__bar", { scaleX: 1, duration: 1.15, ease: "power2.out" }, 0)
      .to(".preloader__name", { opacity: 1, y: 0, duration: 0.4, ease: "power2.out" }, 0.2)
      .to(
        [".preloader__count", ".preloader__name", ".preloader__bar"],
        { opacity: 0, y: -14, duration: 0.28, ease: "power2.in", stagger: 0.03 },
        "+=0.05",
      )
      .to(
        root.current,
        {
          yPercent: -100,
          duration: 0.85,
          ease: "expo.inOut",
          // Hand off here rather than on complete: the hero's own intro then
          // plays behind the curtain instead of queueing up after it.
          onStart: onReveal,
        },
        "-=0.12",
      );

    // Failsafe: rAF is throttled in background tabs, which would otherwise
    // strand the timeline mid-count and leave the preloader covering the page.
    // setTimeout still fires there, so hand control back regardless.
    const bail = window.setTimeout(() => {
      if (tl.progress() < 1) {
        onReveal();
        tl.progress(1).kill();
        finish();
      }
    }, 5000);

    return () => {
      window.clearTimeout(bail);
      tl.kill();
      document.body.classList.remove("is-loading");
    };
  }, [onReveal, onDone]);

  return (
    <div
      ref={root}
      className="fixed inset-0 z-[999] flex flex-col items-center justify-center bg-void"
    >
      <div className="preloader__count font-display text-[clamp(3.5rem,10vw,7rem)] font-bold leading-none tabular-nums text-white">
        {count}
      </div>

      <div className="preloader__name mt-5 translate-y-3 font-display text-[10px] font-medium uppercase tracking-[0.55em] text-silver opacity-0">
        {profile.first} {profile.last}
      </div>

      <div className="relative mt-8 h-px w-[180px] overflow-hidden bg-white/10 md:w-[240px]">
        <div className="preloader__bar h-full w-full origin-left scale-x-0 bg-linear-to-r from-ember to-vibrant-orange" />
      </div>
    </div>
  );
}
