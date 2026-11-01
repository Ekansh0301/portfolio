import { useEffect, useState } from "react";

async function sha256(bytes: Uint8Array) {
  const d = await crypto.subtle.digest("SHA-256", bytes as BufferSource);
  return [...new Uint8Array(d)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

const bits = (a: string, b: string) => {
  let n = 0;
  for (let i = 0; i < a.length; i++) n += (parseInt(a[i], 16) ^ parseInt(b[i], 16)).toString(2).replace(/0/g, "").length;
  return n;
};

/** The avalanche effect: one flipped input bit should change about half the output bits. */
export default function Cipher() {
  const [text, setText] = useState("attack at dawn");
  const [bit, setBit] = useState(0);
  const [h, setH] = useState<[string, string] | null>(null);

  useEffect(() => {
    const b = new TextEncoder().encode(text || " ");
    const f = b.slice();
    const i = Math.min(bit, b.length * 8 - 1);
    f[i >> 3] ^= 1 << (i & 7);
    let live = true;
    Promise.all([sha256(b), sha256(f)]).then((r) => live && setH([r[0], r[1]])).catch(() => live && setH(null));
    return () => { live = false; };
  }, [text, bit]);

  const n = h ? bits(h[0], h[1]) : 0;
  const total = Math.max(1, new TextEncoder().encode(text || " ").length * 8);

  return (
    <>
      <input value={text} maxLength={40} onChange={(e) => setText(e.target.value)} aria-label="Message to hash"
        style={{ width: "100%", padding: "0.6rem 0.8rem", border: "1px solid var(--rule)", borderRadius: 8, background: "transparent", color: "var(--ink)", fontFamily: "var(--mono)", fontSize: "0.85rem" }} />
      <div className="slider" style={{ gridTemplateColumns: "6rem 1fr 3rem" }}>
        <span>flip bit</span>
        <input type="range" min={0} max={total - 1} value={Math.min(bit, total - 1)} onChange={(e) => setBit(+e.target.value)} aria-label="Which input bit to flip" />
        <span>#{Math.min(bit, total - 1)}</span>
      </div>
      {h ? (
        <div className="mono" style={{ wordBreak: "break-all", lineHeight: 1.9, fontSize: "0.8rem" }}>
          <div className="dim">sha256(original)</div>
          <div>{h[0]}</div>
          <div className="dim" style={{ marginTop: "0.5rem" }}>sha256(one bit flipped)</div>
          <div>{[...h[1]].map((c, i) => <span key={i} style={c !== h[0][i] ? { color: "var(--accent)", fontWeight: 600 } : undefined}>{c}</span>)}</div>
        </div>
      ) : <div className="readout dim">SHA-256 needs a secure context (https or localhost).</div>}
      <div className="readout">
        <span className="acc">{n}</span> of 256 output bits changed (ideal ≈ 128). Highlighted digits differ.
      </div>
    </>
  );
}
