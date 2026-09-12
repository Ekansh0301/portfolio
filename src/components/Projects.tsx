import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { projects } from "../data/content";
import ProjectCover from "./ProjectCover";
import SectionHeading from "./SectionHeading";

gsap.registerPlugin(ScrollTrigger);

export default function Projects() {
  const root = useRef<HTMLElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo(
        ".project-card",
        { y: 60, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 1,
          stagger: 0.09,
          ease: "expo.out",
          scrollTrigger: { trigger: ".project-grid", start: "top 82%" },
        },
      );
    }, root);
    return () => ctx.revert();
  }, []);

  return (
    <section
      id="projects"
      ref={root}
      className="relative overflow-hidden pt-20 pb-16 md:pt-28 md:pb-20"
    >
      <div className="mx-auto w-full max-w-[1400px] px-[clamp(20px,5vw,80px)]">
        <SectionHeading eyebrow="Featured Work" title="Selected Projects" />

        <div className="project-grid mt-10 grid grid-cols-1 gap-6 md:mt-12 md:grid-cols-2">
          {projects.map((p) => (
            <a
              key={p.title}
              href={p.href}
              target="_blank"
              rel="noreferrer"
              className="project-card group relative flex flex-col overflow-hidden rounded-2xl border border-white/10 bg-obsidian transition-colors duration-500 hover:border-ember/45"
            >
              {/* Cover */}
              <div className="relative aspect-16/9 w-full overflow-hidden">
                <div className="absolute inset-0 transition-transform duration-[900ms] ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-[1.06]">
                  <ProjectCover project={p} />
                </div>
                <div className="absolute inset-0 bg-linear-to-t from-obsidian via-obsidian/25 to-transparent" />

                {/* Metric chip */}
                <div className="absolute left-5 top-5 rounded-full border border-white/12 bg-void/70 px-3 py-1.5 font-display text-[10px] uppercase tracking-[0.15em] text-silver backdrop-blur-md">
                  {p.metric}
                </div>

                {/* Launch affordance */}
                <div className="absolute right-5 top-5 flex h-9 w-9 translate-y-2 items-center justify-center rounded-full border border-white/15 bg-void/70 text-sm text-white opacity-0 backdrop-blur-md transition-all duration-500 group-hover:translate-y-0 group-hover:opacity-100">
                  ↗
                </div>
              </div>

              {/* Body */}
              <div className="relative flex flex-1 flex-col gap-3 p-6 md:p-7">
                <h3 className="font-display text-xl font-bold tracking-tight text-white transition-colors duration-300 group-hover:text-ember-bright md:text-2xl">
                  {p.title}
                </h3>
                <p className="font-soft text-[13px] leading-[1.75] text-silver">
                  {p.blurb}
                </p>
                <div className="mt-auto flex flex-wrap gap-2 pt-3">
                  {p.stack.map((s) => (
                    <span
                      key={s}
                      className="rounded-full border border-white/8 bg-white/4 px-3 py-1 font-display text-[10px] uppercase tracking-[0.12em] text-ash"
                    >
                      {s}
                    </span>
                  ))}
                </div>
              </div>

              {/* Ember underline sweep on hover */}
              <span className="absolute inset-x-0 bottom-0 h-px origin-left scale-x-0 bg-linear-to-r from-ember to-vibrant-orange transition-transform duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-x-100" />
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}
