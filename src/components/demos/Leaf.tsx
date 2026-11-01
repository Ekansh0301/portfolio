import { useEffect, useRef, useState } from "react";

const LEAVES = [
  { name: "Healthy tomato", spots: [] as [number, number, number][], preds: [["Tomato · healthy", 0.97], ["Tomato · leaf mold", 0.02], ["Tomato · early blight", 0.01]] },
  { name: "Early blight", spots: [[150, 120, 16], [205, 170, 12], [170, 205, 10]] as [number, number, number][], preds: [["Tomato · early blight", 0.91], ["Tomato · septoria", 0.06], ["Tomato · healthy", 0.01]] },
  { name: "Leaf mold", spots: [[130, 150, 20], [190, 130, 18], [215, 195, 14], [150, 200, 12]] as [number, number, number][], preds: [["Tomato · leaf mold", 0.88], ["Tomato · early blight", 0.07], ["Tomato · healthy", 0.02]] },
];
const ADVICE = ["Nothing to do. Keep watering at the base.", "Remove affected leaves, avoid overhead watering, rotate crops next season.", "Improve airflow, reduce humidity, and apply a copper-based fungicide if it spreads."];

export default function Leaf() {
  const [i, setI] = useState(1);
  const [phase, setPhase] = useState<"idle" | "scan" | "done">("idle");
  const t = useRef<number>(0);
  const pick = (n: number) => { clearTimeout(t.current); setI(n); setPhase("idle"); };
  const scan = () => { clearTimeout(t.current); setPhase("scan"); t.current = window.setTimeout(() => setPhase("done"), 1400); };
  useEffect(() => () => clearTimeout(t.current), []);
  const L = LEAVES[i];

  return (
    <>
      <div className="row-c">
        {LEAVES.map((l, n) => <button key={l.name} className={`sm ${i === n ? "on" : ""}`} onClick={() => pick(n)}>{l.name}</button>)}
        <button className="sm" onClick={scan} disabled={phase === "scan"}>{phase === "scan" ? "scanning…" : "▶ scan"}</button>
      </div>
      <svg viewBox="0 0 400 260" style={{ maxHeight: 210 }} role="img" aria-label={`Illustration of a ${L.name} leaf`}>
        <path d="M200 20 C320 70 330 190 200 245 C70 190 80 70 200 20Z" fill="color-mix(in srgb, var(--ok) 55%, var(--card))" stroke="var(--ok)" strokeWidth="2" />
        <path d="M200 30 V240 M200 90 L150 120 M200 130 L255 160 M200 170 L150 195" stroke="var(--ok)" strokeWidth="1.5" fill="none" opacity="0.7" />
        {L.spots.map(([x, y, r], k) => <circle key={k} cx={x + 20} cy={y - 20} r={r} fill="#6b4423" opacity="0.8" />)}
        <rect x="70" width="260" height="3" fill="var(--accent)" style={{ transition: phase === "scan" ? "y 1.3s linear" : "none" }} y={phase === "scan" ? 240 : 20} opacity={phase === "scan" ? 1 : 0} />
      </svg>
      {phase === "done" ? (
        <div>
          {L.preds.map(([n, p]) => (
            <div key={n as string} className="slider" style={{ gridTemplateColumns: "10rem 1fr 2.6rem", marginBottom: "0.3rem" }}>
              <span>{n}</span><div className="bar"><i style={{ width: `${(p as number) * 100}%` }} /></div><span>{Math.round((p as number) * 100)}%</span>
            </div>
          ))}
          <div className="readout" style={{ marginTop: "0.6rem" }}><span className="acc">Plan:</span> {ADVICE[i]}</div>
        </div>
      ) : <div className="readout dim">{phase === "scan" ? "Running MobileNetV3-Small…" : "Pick a leaf and scan it."}</div>}
      <div className="readout dim" style={{ minHeight: 0 }}>Illustrative output, not the live model.</div>
    </>
  );
}
