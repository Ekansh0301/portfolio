import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { publications } from "../data/content";
import SectionHeading from "./SectionHeading";

gsap.registerPlugin(ScrollTrigger);

export default function Research() {
  const root = useRef<HTMLElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo(
        ".pub-row",
        { y: 44, opacity: 0 },
        {
          y: 0, opacity: 1, duration: 1, stagger: 0.12, ease: "expo.out",
          scrollTrigger: { trigger: ".pub-list", start: "top 84%" },
        },
      );
    }, root);
    return () => ctx.revert();
  }, []);

  return (
    <section id="research" ref={root} className="relative overflow-hidden py-16 md:py-24">
      <div className="mx-auto w-full max-w-[1400px] px-[clamp(20px,5vw,80px)]">
        <SectionHeading
          eyebrow="Publications"
          title="Papers & Findings"
          sub="Peer-reviewed work in computational linguistics and interpretable NLP."
        />

        <div className="pub-list mt-10 flex flex-col md:mt-12">
          {publications.map((p) => (
            <article
              key={p.title}
              className="pub-row group grid grid-cols-1 gap-4 border-t border-white/8 py-9 transition-colors duration-500 hover:border-ember/40 md:grid-cols-[220px_1fr] md:gap-10"
            >
              <div className="flex flex-col gap-1.5">
                <span className="font-display text-[12.5px] uppercase tracking-[0.1em] text-cloud">
                  {p.venue}
                </span>
                <span className="font-display text-[12.5px] font-semibold uppercase tracking-[0.14em] text-ember">
                  {p.status}
                </span>
              </div>

              <div>
                <h3 className="font-display text-lg font-bold leading-snug tracking-tight text-white transition-colors duration-300 group-hover:text-ember-bright md:text-2xl">
                  {p.title}
                </h3>

                {"href" in p && p.href && (
                  <a
                    href={p.href}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-3 inline-flex items-center gap-1.5 font-display text-[11px] uppercase tracking-[0.16em] text-ember transition-colors duration-300 hover:text-ember-bright"
                  >
                    Code <span aria-hidden>↗</span>
                  </a>
                )}
                <p className="mt-3 max-w-2xl font-soft text-[13px] leading-[1.8] text-silver">
                  {p.detail}
                </p>
              </div>
            </article>
          ))}
          <div className="border-t border-white/8" />
        </div>
      </div>

    </section>
  );
}
