import { useEffect, useLayoutEffect, useRef, useState } from "react";
import gsap from "gsap";
import { profile, socials } from "../data/content";

const links = [
  { label: "Projects", href: "#projects" },
  { label: "Research", href: "#research" },
  { label: "Toolkit", href: "#skills" },
  { label: "Experience", href: "#experience" },
  { label: "Contact", href: "#contact" },
];

/** Fixed logo + a full-height drawer menu that slides in from the left. */
export default function Nav() {
  const [open, setOpen] = useState(false);
  // "Dive In" only until the menu has been opened once; "Menu" after that.
  const [visited, setVisited] = useState(false);
  const panel = useRef<HTMLDivElement>(null);
  const scrim = useRef<HTMLDivElement>(null);

  // Park the drawer off-canvas in JS: Tailwind's translate utility writes the
  // `translate` property, which GSAP's transform tween would not override.
  useLayoutEffect(() => {
    if (panel.current) gsap.set(panel.current, { xPercent: -100 });
  }, []);

  useEffect(() => {
    const items = panel.current?.querySelectorAll("[data-nav-item]");
    if (!panel.current || !scrim.current) return;

    if (open) {
      document.body.style.overflow = "hidden";
      gsap.set(scrim.current, { pointerEvents: "auto" });
      gsap.to(scrim.current, { opacity: 1, duration: 0.4, ease: "power2.out" });
      gsap.to(panel.current, { xPercent: 0, duration: 0.75, ease: "expo.out" });
      if (items) {
        gsap.fromTo(
          items,
          { x: -36, opacity: 0 },
          { x: 0, opacity: 1, duration: 0.6, stagger: 0.06, ease: "expo.out", delay: 0.18 },
        );
      }
    } else {
      document.body.style.overflow = "";
      gsap.to(scrim.current, { opacity: 0, duration: 0.3, ease: "power2.in" });
      gsap.set(scrim.current, { pointerEvents: "none", delay: 0.3 });
      gsap.to(panel.current, { xPercent: -100, duration: 0.6, ease: "expo.inOut" });
    }
  }, [open]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const toggle = () => {
    setOpen((o) => !o);
    setVisited(true);
  };

  return (
    <>
      <a
        href="#hero"
        className="fixed left-6 top-7 z-[200] font-display text-lg font-bold tracking-tight text-white md:left-14 md:top-8 lg:left-20"
      >
        <span className="text-ember-bright">E</span>G<span className="text-ember-bright">.</span>
      </a>

      <button
        onClick={toggle}
        aria-expanded={open}
        aria-label={open ? "Close menu" : "Open menu"}
        className="group fixed right-6 top-7 z-[200] flex items-center gap-3 rounded-full border border-white/12 bg-white/6 px-6 py-3 text-[13px] font-medium text-white backdrop-blur-md transition-colors duration-300 hover:border-ember/60 hover:bg-ember/15 md:right-14 md:top-8 lg:right-20"
      >
        {open ? "Close" : visited ? "Menu" : "Dive In"}
        <span
          className="relative block h-3.5 w-3.5 transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)]"
          style={{ transform: open ? "rotate(135deg)" : "rotate(0deg)" }}
        >
          <span className="absolute left-1/2 top-1/2 h-px w-3.5 -translate-x-1/2 -translate-y-1/2 bg-current" />
          <span className="absolute left-1/2 top-1/2 h-3.5 w-px -translate-x-1/2 -translate-y-1/2 bg-current" />
        </span>
      </button>

      <div
        ref={scrim}
        onClick={() => setOpen(false)}
        className="fixed inset-0 z-[150] bg-void/80 opacity-0 backdrop-blur-sm"
        style={{ pointerEvents: "none" }}
      />

      <div
        ref={panel}
        className="fixed left-0 top-0 z-[160] flex h-full w-full max-w-[440px] flex-col justify-between border-r border-white/8 bg-obsidian px-8 pb-10 pt-28 md:px-14"
      >
        {/* Ember bleed along the drawer's leading edge */}
        <div className="pointer-events-none absolute inset-y-0 left-0 w-px bg-linear-to-b from-transparent via-ember to-transparent" />

        <nav className="flex flex-col gap-1">
          {links.map((l, i) => (
            <a
              key={l.href}
              data-nav-item
              href={l.href}
              onClick={() => setOpen(false)}
              className="group flex items-baseline gap-3 py-1.5"
            >
              <span className="font-display text-[clamp(1.9rem,5vw,2.7rem)] font-bold uppercase leading-tight text-white transition-all duration-400 ease-out group-hover:translate-x-2 group-hover:text-ember-bright">
                {l.label}
              </span>
              <span className="font-display text-[10px] text-ember/70">
                0{i + 1}
              </span>
            </a>
          ))}
        </nav>

        <div data-nav-item className="border-t border-white/8 pt-6">
          <div className="mb-4 font-display text-[10px] uppercase tracking-[0.3em] text-ember">
            Socials
          </div>
          <div className="flex flex-wrap gap-x-6 gap-y-2">
            {socials.map((s) => (
              <a
                key={s.label}
                href={s.href}
                target="_blank"
                rel="noreferrer"
                className="text-sm text-silver transition-colors duration-300 hover:text-white"
              >
                {s.label}
              </a>
            ))}
          </div>
          <p className="mt-6 text-xs text-ash">{profile.email}</p>
        </div>
      </div>
    </>
  );
}
