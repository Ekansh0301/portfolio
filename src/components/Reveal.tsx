import { useEffect, useRef, useState } from "react";

/**
 * Fades its children up when scrolled into view. The hidden state is applied
 * from JS after mount, so nothing stays invisible if a script fails.
 */
export default function Reveal({
  children,
  className = "",
  as: Tag = "div",
}: {
  children: React.ReactNode;
  className?: string;
  as?: "div" | "section" | "article";
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [state, setState] = useState<"init" | "pre" | "in">("init");

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    if (r.top < window.innerHeight * 0.9) {
      setState("in");
      return;
    }
    setState("pre");
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          setState("in");
          io.disconnect();
        }
      },
      { threshold: 0.12 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <Tag ref={ref} className={`rv ${state === "pre" ? "pre" : ""} ${className}`}>
      {children}
    </Tag>
  );
}
