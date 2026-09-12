import { useEffect, useLayoutEffect, useRef } from "react";
import gsap from "gsap";
import TextPressure from "./TextPressure";
import SmokeCursor from "./SmokeCursor";
import { profile } from "../data/content";

/**
 * Ambient dust motes. Positions come from a seeded hash rather than
 * Math.random so the field is identical on every render and on the server.
 */
function rand(i: number, salt: number) {
  const x = Math.sin(i * 127.1 + salt * 311.7) * 43758.5453;
  return x - Math.floor(x);
}

function makeDust(n: number) {
  return Array.from({ length: n }, (_, i) => ({
    left: `${rand(i, 1) * 100}%`,
    top: `${55 + rand(i, 2) * 50}%`,
    size: 1 + rand(i, 3) * 2.2,
    duration: `${11 + rand(i, 4) * 12}s`,
    delay: `${-rand(i, 5) * 20}s`,
    drift: `${(rand(i, 6) - 0.5) * 120}px`,
    opacity: 0.25 + rand(i, 7) * 0.45,
  }));
}

export default function Hero({ ready }: { ready: boolean }) {
  const root = useRef<HTMLElement>(null);
  const dust = makeDust(18);

  // Pre-reveal state, applied before paint. Kept in JS so the hero still
  // reads correctly if the intro timeline never gets to run.
  useLayoutEffect(() => {
    const ctx = gsap.context(() => {
      gsap.set(".hero-fade", { opacity: 0, y: 12 });
      gsap.set(".hero-glow", { opacity: 0 });
      gsap.set(".hero-line", { opacity: 0 });
    }, root);
    return () => ctx.revert();
  }, []);

  useEffect(() => {
    if (!ready) return;
    const ctx = gsap.context(() => {
      const tl = gsap.timeline();
      tl.to(".hero-fade", {
        opacity: 1,
        y: 0,
        duration: 0.7,
        stagger: 0.055,
        ease: "expo.out",
      })
        .to(".hero-glow", { opacity: 1, duration: 0.9, ease: "power2.out" }, 0)
        .fromTo(
          ".hero-line",
          { opacity: 0, letterSpacing: "0.5em" },
          { opacity: 1, letterSpacing: "0.25em", duration: 0.75, ease: "expo.out" },
          0.12,
        );

      // Scroll cue: a spark running down the hairline.
      gsap.to(".scroll-spark", {
        y: 24,
        opacity: 0,
        duration: 1.6,
        repeat: -1,
        ease: "power1.inOut",
      });
    }, root);
    return () => ctx.revert();
  }, [ready]);

  return (
    <section
      id="hero"
      ref={root}
      className="relative h-screen overflow-hidden"
    >
      {/* Ember cloud, scoped to the hero so it never washes over content below */}
      <SmokeCursor />

      {/* Film grain */}
      <div
        className="pointer-events-none absolute inset-0 z-[5] opacity-[0.28] mix-blend-overlay"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 512 512' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3CfeColorMatrix type='saturate' values='0'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.42'/%3E%3C/svg%3E\")",
        }}
      />

      {/* Vignette */}
      <div
        className="pointer-events-none absolute inset-0 z-[4]"
        style={{
          background:
            "radial-gradient(80% 70% at 50% 45%, rgba(0,0,0,0) 30%, #111 100%)",
        }}
      />

      {/* Standing ember bloom behind the title */}
      <div
        className="hero-glow pointer-events-none absolute left-1/2 top-[45%] z-[6] h-[600px] w-[600px] -translate-x-1/2 -translate-y-1/2 blur-[40px] md:h-[800px] md:w-[800px]"
        style={{
          background:
            "radial-gradient(circle, rgba(252,107,47,0.15) 0%, rgba(252,107,47,0.04) 35%, rgba(0,0,0,0) 70%)",
        }}
      />

      {/* Dust */}
      <div className="pointer-events-none absolute inset-0 z-[8]">
        {dust.map((d, i) => (
          <div
            key={i}
            className="dust absolute rounded-full"
            style={
              {
                left: d.left,
                top: d.top,
                width: d.size,
                height: d.size,
                "--dust-duration": d.duration,
                "--dust-delay": d.delay,
                "--dust-x": d.drift,
                "--dust-opacity": d.opacity,
              } as React.CSSProperties
            }
          />
        ))}
      </div>

      {/* Eyebrow */}
      <div className="hero-fade absolute left-6 top-20 z-[40] flex translate-y-3 items-center gap-2.5 md:left-14 md:top-24 lg:left-20">
        <span className="h-[7px] w-[7px] animate-pulse rounded-full bg-ember" />
        <span className="font-display text-[11px] font-medium uppercase tracking-[0.2em] text-silver">
          {profile.eyebrow}
        </span>
      </div>

      {/* The name */}
      <div className="pointer-events-none absolute left-1/2 top-[36%] z-[15] flex w-full -translate-x-1/2 -translate-y-1/2 select-none flex-col items-center md:top-[38%]">
        <div
          className="relative flex h-[124px] w-full max-w-[760px] scale-y-[1.15] transform-gpu items-center justify-center px-4 md:h-[168px] md:max-w-[940px]"
          style={{ filter: "drop-shadow(0 0 35px rgba(252,107,47,0.3))" }}
        >
          <TextPressure text={profile.first} alpha={false} />
        </div>

        <div className="z-[20] mt-3 px-4 text-center md:mt-4">
          <p
            className="hero-line font-soft text-[clamp(0.72rem,1.08vw,0.88rem)] font-extrabold uppercase tracking-[0.25em] text-ember"
            style={{ filter: "drop-shadow(0 0 20px rgba(252,107,47,0.7))" }}
          >
            {profile.tagline}
          </p>
        </div>
      </div>

      {/* Blurb */}
      <div className="hero-fade absolute left-6 top-[58%] z-[40] max-w-[300px] translate-y-3 sm:top-[72%] sm:max-w-[380px] md:left-14 lg:left-20 lg:max-w-[420px]">
        <p className="font-soft text-[13px] leading-[1.8] tracking-wide text-silver md:text-[14px]">
          {profile.blurb}
        </p>
      </div>

      {/* CTAs */}
      <div className="hero-fade absolute bottom-[9%] right-6 z-[40] flex translate-y-3 flex-col items-end gap-3 sm:bottom-[12%] sm:gap-3.5 md:right-14 lg:right-20">
        <a
          href="#projects"
          className="group relative inline-flex items-center justify-center gap-3 overflow-hidden rounded-full bg-linear-to-r from-ember-dim to-ember-bright px-7 py-4 text-[13px] sm:px-9 sm:py-[18px] sm:text-[14px] font-medium tracking-wide text-white shadow-[0_0_30px_-6px_rgba(252,107,47,0.5)] transition-all duration-500 hover:shadow-[0_0_46px_-4px_rgba(252,107,47,0.75)]"
        >
          <span className="flex h-8 w-8 items-center justify-center rounded-full border border-white/30 transition-transform duration-500 group-hover:rotate-45">
            ↗
          </span>
          Explore Work
        </a>

        <a
          href="#contact"
          className="inline-flex items-center gap-2.5 rounded-full border border-white/12 bg-white/5 px-8 py-3.5 text-[13px] font-medium tracking-wide text-white backdrop-blur-md transition-colors duration-300 hover:border-white/30 hover:bg-white/10"
        >
          Let&apos;s Talk <span aria-hidden>→</span>
        </a>
      </div>

      {/* Scroll cue */}
      <div className="hero-fade absolute bottom-6 left-1/2 z-[45] flex -translate-x-1/2 translate-y-3 flex-col items-center gap-2">
        <span className="font-display text-[9px] uppercase tracking-[0.35em] text-silver/60">
          Scroll
        </span>
        <div className="relative h-6 w-px overflow-hidden bg-linear-to-b from-white/20 to-transparent">
          <div className="scroll-spark absolute h-3 w-full -translate-y-3 bg-ember/60" />
        </div>
      </div>

      {/* Bottom blend into the next section */}
      <div className="pointer-events-none absolute bottom-0 left-0 right-0 z-[50] h-28 bg-linear-to-t from-void to-transparent" />
    </section>
  );
}
