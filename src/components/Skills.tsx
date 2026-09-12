import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { skillGroups } from "../data/content";

gsap.registerPlugin(ScrollTrigger);

/**
 * Toolkit as a grid of bordered blocks, two up on desktop.
 *
 * Full-width rows meant the longer groups wrapped over two or three lines and
 * the whole section read as one undifferentiated field of pills. Boxing each
 * group gives every set a visible boundary, stops the largest group setting
 * the height of the rest, and roughly halves the space the section takes.
 */
export default function Skills() {
  const root = useRef<HTMLElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo(
        ".skill-block",
        { y: 20, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 0.6,
          stagger: 0.06,
          ease: "expo.out",
          scrollTrigger: { trigger: root.current, start: "top 84%" },
        },
      );
    }, root);
    return () => ctx.revert();
  }, []);

  return (
    <section id="skills" ref={root} className="relative overflow-hidden py-14 md:py-20">
      <div className="mx-auto w-full max-w-[1400px] px-[clamp(20px,5vw,80px)]">
        <div className="flex flex-wrap items-baseline justify-between gap-x-8 gap-y-2">
          <div className="flex items-center gap-3">
            <span className="block h-px w-8 bg-ember" />
            <span className="font-display text-[11px] font-semibold uppercase tracking-[0.28em] text-ember">
              Toolkit
            </span>
          </div>
          <h2 className="font-display text-[clamp(1.4rem,2.6vw,1.9rem)] font-bold tracking-tight text-white">
            What I Build With
          </h2>
        </div>

        <div className="mt-8 grid grid-cols-1 gap-3 md:mt-10 md:grid-cols-2 md:gap-4">
          {skillGroups.map((g) => (
            <div
              key={g.label}
              className="skill-block group relative overflow-hidden rounded-xl border border-white/[0.08] bg-white/[0.015] px-5 py-4 transition-colors duration-400 hover:border-ember/45 hover:bg-ember/[0.04] md:px-6 md:py-5"
            >
              {/* ember edge that wipes down the left on hover */}
              <span className="absolute inset-y-0 left-0 w-[2px] origin-top scale-y-0 bg-linear-to-b from-ember to-vibrant-orange transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-y-100" />

              <div className="mb-3.5 flex items-baseline justify-between gap-4">
                <h3 className="font-display text-[12px] font-semibold uppercase tracking-[0.16em] text-cloud transition-colors duration-300 group-hover:text-ember-bright">
                  {g.label}
                </h3>
                <span className="font-display text-[10px] tabular-nums text-ash/50">
                  {String(g.items.length).padStart(2, "0")}
                </span>
              </div>

              <ul className="flex flex-wrap gap-x-1.5 gap-y-2">
                {g.items.map((item) => (
                  <li
                    key={item}
                    className="cursor-default rounded-md border border-ember/25 bg-ember/[0.05] px-2.5 py-1 font-display text-[10.5px] uppercase tracking-[0.08em] text-silver transition-colors duration-300 group-hover:border-ember/40 hover:bg-ember/20 hover:text-white"
                  >
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
