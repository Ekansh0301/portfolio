import { useEffect, useRef, useState } from "react";

const STEPS: { at: number; cls: string; text: string }[] = [
  { at: 0, cls: "m", text: "● hold key … listening" },
  { at: 900, cls: "g", text: "whisper   “open my notes and tell me what's on screen”" },
  { at: 1900, cls: "p", text: "ollama    intent → tool_call(open_app, screen_read)" },
  { at: 2800, cls: "m", text: "tool      open_app(\"notes\")  ✓  screen_read()  ✓" },
  { at: 3700, cls: "g", text: "piper     “Notes is open. It has your reading list.”" },
  { at: 4500, cls: "m", text: "done in 4.5s · 4 GB GPU · 0 bytes left the machine" },
];

export default function Voice() {
  const [shown, setShown] = useState(0);
  const timers = useRef<number[]>([]);

  const play = () => {
    timers.current.forEach(clearTimeout);
    setShown(0);
    timers.current = STEPS.map((s, i) => window.setTimeout(() => setShown(i + 1), s.at + 150));
  };
  useEffect(() => { play(); return () => timers.current.forEach(clearTimeout); }, []);

  return (
    <>
      <div className="term" aria-live="polite">
        {STEPS.slice(0, shown).map((s, i) => <div key={i} className={s.cls}>{s.text}</div>)}
        {shown < STEPS.length && <span className="caret p">▌</span>}
      </div>
      <div className="row-c">
        <button className="sm" onClick={play}>↻ replay</button>
        <span className="mono dim">speech → LLM → tools → speech, all local</span>
      </div>
    </>
  );
}
