import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { experience } from "../data/content";
import SectionHeading from "./SectionHeading";

gsap.registerPlugin(ScrollTrigger);

export default function Experience() {
  const root = useRef<HTMLElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo(
        ".exp-row",
        { y: 50, opacity: 0 },
        {
          y: 0, opacity: 1, duration: 1, stagger: 0.12, ease: "expo.out",
          scrollTrigger: { trigger: ".exp-list", start: "top 84%" },
        },
      );
      // Timeline spine draws itself as the section scrolls past.
      gsap.fromTo(
        ".exp-spine",
        { scaleY: 0 },
        {
          scaleY: 1, ease: "none",
          scrollTrigger: {
            trigger: ".exp-list", start: "top 70%", end: "bottom 80%", scrub: 0.6,
          },
        },
      );
    }, root);
    return () => ctx.revert();
  }, []);

  return (
    <section id="experience" ref={root} className="relative overflow-hidden py-16 md:py-24">
      <div className="mx-auto w-full max-w-[1400px] px-[clamp(20px,5vw,80px)]">
        <SectionHeading
          eyebrow="Experience"
          title="Where I've Been"
          sub="Research and engineering roles, most recent first."
        />

        <div className="exp-list relative mt-10 md:mt-12">
          {/* Spine */}
          <div className="absolute left-0 top-0 hidden h-full w-px bg-white/8 md:left-[248px] md:block">
            <div className="exp-spine h-full w-full origin-top bg-linear-to-b from-ember via-ember-bright to-transparent" />
          </div>

          {experience.map((e) => (
            <article
              key={e.role + e.period}
              className="exp-row group relative grid grid-cols-1 gap-5 border-t border-white/8 py-10 md:grid-cols-[220px_1fr] md:gap-20"
            >
              <div className="flex flex-col gap-1.5">
                <span className="font-display text-[11px] tracking-[0.1em] text-silver">
                  {e.period}
                </span>
                <span className="font-display text-[11px] uppercase tracking-[0.16em] text-ember">
                  {e.org}
                </span>
              </div>

              {/* Node on the spine */}
              <span className="absolute left-[244px] top-[46px] hidden h-2.5 w-2.5 rounded-full border border-ember bg-void transition-all duration-500 group-hover:scale-125 group-hover:bg-ember md:block" />

              <div>
                <h3 className="font-display text-xl font-bold tracking-tight text-white md:text-2xl">
                  {e.role}
                </h3>
                <p className="mt-3 max-w-2xl font-soft text-[13.5px] leading-[1.8] text-silver">
                  {e.summary}
                </p>
                <ul className="mt-5 flex flex-col gap-2.5">
                  {e.points.map((pt) => (
                    <li key={pt} className="flex gap-3 font-soft text-[13px] text-silver">
                      <span className="mt-[7px] block h-1 w-1 shrink-0 rounded-full bg-ember" />
                      {pt}
                    </li>
                  ))}
                </ul>
              </div>
            </article>
          ))}
          <div className="border-t border-white/8" />
        </div>
      </div>
    </section>
  );
}
