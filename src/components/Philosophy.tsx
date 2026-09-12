import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { philosophy } from "../data/content";

gsap.registerPlugin(ScrollTrigger);

/**
 * Scroll-driven reveal: a small rounded card pinned mid-screen expands to
 * full-bleed as you scroll through a tall track. The title fades out as the
 * frame opens and the quote fades in behind it.
 */
export default function Philosophy() {
  const root = useRef<HTMLElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: ".scroll-expand__track",
          start: "top top",
          end: "bottom bottom",
          scrub: 1,
        },
      });

      tl.to(".scroll-expand__frame", {
        width: "100vw",
        height: "100vh",
        borderRadius: 0,
        ease: "none",
      }, 0)
        .to(".scroll-expand__media", { scale: 1, ease: "none" }, 0)
        .to(".scroll-expand__title", {
          opacity: 0,
          letterSpacing: "0.3em",
          ease: "none",
        }, 0)
        .to(".scroll-expand__hint", { opacity: 0, ease: "none" }, 0)
        .fromTo(
          ".scroll-expand__overlay",
          { opacity: 0, y: 40 },
          { opacity: 1, y: 0, ease: "none" },
          0.55,
        );
    }, root);
    return () => ctx.revert();
  }, []);

  return (
    <section id="philosophy" ref={root} className="relative">
      <div className="scroll-expand">
        <div className="scroll-expand__track">
          <div className="scroll-expand__stage">
            <div className="scroll-expand__frame">
              <img
                className="scroll-expand__media"
                src="/images/philosophy-hands.jpg"
                alt="Detail of Michelangelo's Creation of Adam, the two hands reaching toward each other"
                draggable={false}
                loading="lazy"
                decoding="async"
              />
              <div className="scroll-expand__scrim" />

              <div className="scroll-expand__overlay">
                <div className="mx-auto flex max-w-4xl flex-col items-center justify-center gap-10 px-6">
                  <span className="font-display text-xs font-semibold uppercase tracking-[0.35em] text-ember-bright [text-shadow:0_2px_14px_rgba(0,0,0,0.8)]">
                    The Philosophy
                  </span>
                  <p
                    className="text-center text-lg font-medium leading-[1.45] tracking-tight text-white [text-shadow:0_2px_18px_rgba(0,0,0,0.75)] sm:text-xl md:text-2xl lg:text-3xl"
                    style={{ fontFamily: "'Josefin Sans', sans-serif" }}
                  >
                    {philosophy}
                  </p>
                </div>
              </div>
            </div>

            <div className="scroll-expand__title">The Philosophy</div>
            <div className="scroll-expand__hint">Scroll</div>
          </div>
        </div>
      </div>
    </section>
  );
}
