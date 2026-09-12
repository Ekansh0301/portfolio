import { useEffect, useState } from "react";

/** Hairline ember progress bar pinned to the top of the viewport. */
export default function ScrollProgress() {
  const [p, setP] = useState(0);

  useEffect(() => {
    const onScroll = () => {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      setP(max > 0 ? window.scrollY / max : 0);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div className="fixed inset-x-0 top-0 z-[300] h-px bg-transparent">
      <div
        className="h-full origin-left bg-linear-to-r from-ember to-vibrant-orange"
        style={{ transform: `scaleX(${p})` }}
      />
    </div>
  );
}
