import { useEffect } from "react";
import Lenis from "lenis";

/**
 * How the page moves. Wheel scrolling is eased by Lenis (touch stays native),
 * in-page links and the scene rail glide to their target, content eases in as it
 * enters the view, a thin bar tracks progress, and the opening drifts away as you
 * leave it. Everything is off under prefers-reduced-motion, and the hidden state
 * of the reveals is applied from here, so nothing stays invisible if this fails.
 */
const REVEAL = ".slate, .card, .xp-grid > *, .xp-line, .xpcard.edu, .tools-grid > *, .repos, form.contact, .contact-intro";

type Win = Window & { __lenis?: Lenis };

/** Glide to a scene (or jump, when smooth scrolling is off). */
export function goTo(id: string) {
  const el = document.getElementById(id);
  if (!el) return;
  const l = (window as Win).__lenis;
  if (l) l.scrollTo(el, { offset: 0, duration: 1.3 });
  else el.scrollIntoView({ behavior: "smooth" });
}

export function useFlow() {
  useEffect(() => {
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const lenis = new Lenis({ duration: 1.15, easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)), smoothWheel: true });
    (window as Win).__lenis = lenis;
    let raf = 0;
    const loop = (t: number) => { lenis.raf(t); raf = requestAnimationFrame(loop); };
    raf = requestAnimationFrame(loop);

    // progress bar and the opening's drift
    const bar = document.getElementById("progress");
    const hero = document.getElementById("opening");
    const onScroll = () => {
      const max = document.documentElement.scrollHeight - innerHeight;
      if (bar) bar.style.transform = `scaleX(${max > 0 ? Math.min(1, scrollY / max) : 0})`;
      if (hero) hero.style.setProperty("--p", Math.min(1, scrollY / innerHeight).toFixed(3));
    };
    lenis.on("scroll", onScroll);
    onScroll();

    // in-page links glide
    const onClick = (e: MouseEvent) => {
      const a = (e.target as HTMLElement).closest('a[href^="#"]') as HTMLAnchorElement | null;
      if (!a) return;
      const id = a.getAttribute("href")!.slice(1);
      if (!id || !document.getElementById(id)) return;
      e.preventDefault();
      goTo(id);
      history.replaceState(null, "", `#${id}`);
    };
    document.addEventListener("click", onClick);

    // content eases in as it arrives, in order within its row
    const els = [...document.querySelectorAll<HTMLElement>(REVEAL)].filter((e) => e.getBoundingClientRect().top > innerHeight * 0.9);
    els.forEach((e) => e.classList.add("rv-pre"));
    const io = new IntersectionObserver(
      (entries) => {
        for (const en of entries) {
          if (!en.isIntersecting) continue;
          const e = en.target as HTMLElement;
          const sibs = els.filter((x) => x.parentElement === e.parentElement);
          e.style.setProperty("--d", `${Math.min(sibs.indexOf(e), 4) * 90}ms`);
          e.classList.remove("rv-pre");
          e.classList.add("rv-in");
          io.unobserve(e);
        }
      },
      { threshold: 0.1, rootMargin: "0px 0px -6% 0px" },
    );
    els.forEach((e) => io.observe(e));

    return () => {
      cancelAnimationFrame(raf);
      document.removeEventListener("click", onClick);
      io.disconnect();
      els.forEach((e) => { e.classList.remove("rv-pre", "rv-in"); e.style.removeProperty("--d"); });
      lenis.destroy();
      delete (window as Win).__lenis;
    };
  }, []);
}
