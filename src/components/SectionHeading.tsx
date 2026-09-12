import { useLayoutEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

export default function SectionHeading({
  eyebrow,
  title,
  sub,
}: {
  eyebrow: string;
  title: string;
  sub?: string;
}) {
  const root = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo(
        "[data-head]",
        { y: 34, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 1,
          stagger: 0.1,
          ease: "expo.out",
          scrollTrigger: { trigger: root.current, start: "top 85%" },
        },
      );
      gsap.fromTo(
        "[data-rule]",
        { scaleX: 0 },
        {
          scaleX: 1,
          duration: 0.9,
          ease: "expo.out",
          scrollTrigger: { trigger: root.current, start: "top 85%" },
        },
      );
    }, root);
    return () => ctx.revert();
  }, []);

  return (
    <div ref={root}>
      <div data-head className="flex items-center gap-3">
        <span
          data-rule
          className="block h-px w-8 origin-left bg-ember"
        />
        <span className="font-display text-[11px] font-semibold uppercase tracking-[0.28em] text-ember">
          {eyebrow}
        </span>
      </div>

      <h2
        data-head
        className="mt-4 font-display text-[clamp(2.1rem,5.2vw,3.6rem)] font-bold leading-[1.05] tracking-tight text-white"
      >
        {title}
      </h2>

      {sub && (
        <p
          data-head
          className="mt-4 max-w-xl font-soft text-[14px] leading-[1.8] text-silver"
        >
          {sub}
        </p>
      )}
    </div>
  );
}
