import { useEffect, useRef, useState } from "react";

const SS = [{ x: 80, y: 235 }, { x: 200, y: 235 }, { x: 320, y: 235 }];
const CLIENT = { x: 60, y: 45 };
const NS = { x: 340, y: 45 };

export default function Planes() {
  const [step, setStep] = useState(0); // 0 idle, 1 lookup, 2 reply, 3 stream
  const [down, setDown] = useState<number | null>(null);
  const timers = useRef<number[]>([]);
  useEffect(() => () => timers.current.forEach(clearTimeout), []);

  // The naming server routes around a crashed node by handing out a replica.
  const target = down === 0 ? 1 : 0;

  const read = () => {
    timers.current.forEach(clearTimeout);
    setStep(1);
    timers.current = [window.setTimeout(() => setStep(2), 900), window.setTimeout(() => setStep(3), 1800)];
  };
  const crash = () => { timers.current.forEach(clearTimeout); setStep(0); setDown((d) => (d === 0 ? null : 0)); };

  const line = (a: { x: number; y: number }, b: { x: number; y: number }, on: boolean, dashed = false, colour = "var(--accent)") => (
    <line x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke={on ? colour : "var(--rule)"} strokeWidth={on ? 3 : 1.5} strokeDasharray={dashed ? "5 5" : "0"} style={{ transition: "all 0.4s" }} />
  );
  const box = (p: { x: number; y: number }, label: string, o: { hot?: boolean; dead?: boolean; w?: number } = {}) => (
    <g>
      <rect x={p.x - (o.w ?? 46)} y={p.y - 20} width={(o.w ?? 46) * 2} height={40} rx={8} fill={o.hot ? "color-mix(in srgb, var(--accent) 14%, var(--card))" : "var(--card)"} stroke={o.dead ? "var(--bad)" : o.hot ? "var(--accent)" : "var(--ink-3)"} strokeWidth="1.5" strokeDasharray={o.dead ? "4 3" : "0"} />
      <text x={p.x} y={p.y + 4} textAnchor="middle" fontSize="11" style={{ fill: o.dead ? "var(--bad)" : "var(--ink)" }}>{o.dead ? `${label} ×` : label}</text>
    </g>
  );

  return (
    <>
      <svg viewBox="0 0 400 280" role="img" aria-label="Control plane through the naming server, data plane straight to a storage node">
        {line(CLIENT, NS, step === 1 || step === 2, true)}
        {SS.map((s, i) => <g key={i}>{line(NS, s, false, true)}</g>)}
        {step === 3 && line(CLIENT, SS[target], true)}
        <text x="200" y="38" textAnchor="middle" fontSize="9" style={{ fill: "var(--ink-3)" }}>control plane</text>
        {step === 3 && <text x={(CLIENT.x + SS[target].x) / 2 - 6} y="150" textAnchor="end" fontSize="9" style={{ fill: "var(--accent)" }}>data plane · bytes over TCP</text>}
        {box(CLIENT, "Client", { hot: step > 0 })}
        {box(NS, "Naming Server", { hot: step === 1 || step === 2, w: 54 })}
        {SS.map((s, i) => <g key={i}>{box(s, `SS${i + 1}`, { hot: step === 3 && target === i, dead: down === i })}</g>)}
      </svg>
      <div className="row-c">
        <button className="sm" onClick={read}>▶ read /docs/paper.pdf</button>
        <button className={`sm ${down === 0 ? "on" : ""}`} onClick={crash}>{down === 0 ? "revive SS1" : "crash SS1"}</button>
      </div>
      <div className="readout">
        {step === 0 && "The Naming Server owns the directory tree and nothing else."}
        {step === 1 && <>Client asks the Naming Server where the file lives (<span className="acc">LRU cache</span> hit or tree walk).</>}
        {step === 2 && <>Naming Server answers with {down === 0 ? <span className="ok">a live replica, SS2, because SS1 is down</span> : "SS1"}, then steps out of the way.</>}
        {step === 3 && <>Client streams the bytes <span className="acc">straight from SS{target + 1}</span>. {down === 0 ? <span className="ok">Zero data lost.</span> : "No hop through the metadata server."}</>}
      </div>
    </>
  );
}
