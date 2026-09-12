import { useCallback, useEffect, useState } from "react";
import Lenis from "lenis";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

import Preloader from "./components/Preloader";
import Nav from "./components/Nav";
import Hero from "./components/Hero";
import Philosophy from "./components/Philosophy";
import Projects from "./components/Projects";
import Skills from "./components/Skills";
import Research from "./components/Research";
import Experience from "./components/Experience";
import Contact from "./components/Contact";
import Footer from "./components/Footer";
import ScrollProgress from "./components/ScrollProgress";

gsap.registerPlugin(ScrollTrigger);

export default function App() {
  // `loading` keeps the overlay mounted; `revealed` lets the hero start its
  // intro while the curtain is still lifting, so the two do not queue up.
  const [loading, setLoading] = useState(true);
  const [revealed, setRevealed] = useState(false);

  const handleReveal = useCallback(() => setRevealed(true), []);
  const handleDone = useCallback(() => setLoading(false), []);

  // Smooth scrolling, driven off GSAP's ticker so ScrollTrigger stays in sync.
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const lenis = new Lenis({ duration: 1.15, smoothWheel: true });
    lenis.on("scroll", ScrollTrigger.update);

    const raf = (time: number) => lenis.raf(time * 1000);
    gsap.ticker.add(raf);
    gsap.ticker.lagSmoothing(0);

    return () => {
      gsap.ticker.remove(raf);
      lenis.destroy();
    };
  }, []);

  // Sections mount behind the preloader, so measure once it lifts.
  useEffect(() => {
    if (!loading) ScrollTrigger.refresh();
  }, [loading]);

  return (
    <>
      {loading && <Preloader onReveal={handleReveal} onDone={handleDone} />}

      <ScrollProgress />
      <Nav />

      <main className="relative z-[10]">
        <Hero ready={revealed} />
        <Philosophy />
        <Projects />
        <Research />
        <Skills />
        <Experience />
        <Contact />
        <Footer />
      </main>
    </>
  );
}
