import { useEffect, useState } from "react";
import { goTo } from "../lib/flow";

/** Scene index. The active scene's bar grows, like a saliency track over the reel. */
export default function Rail({ scenes }: { scenes: readonly { id: string; label: string }[] }) {
  const [active, setActive] = useState(scenes[0].id);

  useEffect(() => {
    const io = new IntersectionObserver(
      (es) => es.forEach((e) => e.isIntersecting && setActive(e.target.id)),
      { rootMargin: "-45% 0px -45% 0px" },
    );
    scenes.forEach((s) => {
      const el = document.getElementById(s.id);
      if (el) io.observe(el);
    });
    return () => io.disconnect();
  }, [scenes]);

  return (
    <aside className="rail" aria-label="Scenes">
      {scenes.map((s, i) => (
        <button key={s.id} className={active === s.id ? "on" : ""} onClick={() => goTo(s.id)}>
          <span className="lab">{String(i + 1).padStart(2, "0")} {s.label}</span>
          <span className="bar" />
        </button>
      ))}
    </aside>
  );
}
