import { useEffect, useRef, useState } from "react";
import { ctr, ecb } from "../../lib/aes";

/**
 * CryptoStack's "learn by breaking" in one picture: the same image, the same
 * key, the same AES-128 (implemented from the spec, checked against the NIST
 * vectors), encrypted two ways. ECB leaks the shape; CTR does not.
 */
const S = 64;
const PHASES: [string, string][] = [
  ["0 · number theory", "Miller-Rabin"],
  ["1 · symmetric", "OWF/PRG · PRF · CPA · modes · MAC · CCA"],
  ["2 · hashing", "Merkle-Damgård · DLP-CRHF · birthday · HMAC"],
  ["3 · public key", "Diffie-Hellman · RSA · CRT · signatures · ElGamal · CCA-PKC"],
  ["4 · MPC", "oblivious transfer · secure gates · 2-party circuits"],
];

function plaintext() {
  const c = document.createElement("canvas"); c.width = S; c.height = S;
  const x = c.getContext("2d")!;
  x.fillStyle = "#101010"; x.fillRect(0, 0, S, S);
  x.fillStyle = "#f2f2f2"; x.strokeStyle = "#f2f2f2";
  x.lineWidth = 6; x.beginPath(); x.arc(32, 27, 12, Math.PI, 0); x.moveTo(20, 27); x.lineTo(20, 32); x.moveTo(44, 27); x.lineTo(44, 32); x.stroke();
  x.fillRect(14, 31, 36, 26);
  x.fillStyle = "#101010"; x.beginPath(); x.arc(32, 41, 4, 0, Math.PI * 2); x.fill(); x.fillRect(30, 43, 4, 9);
  const d = x.getImageData(0, 0, S, S).data;
  const g = new Uint8Array(S * S);
  for (let i = 0; i < S * S; i++) g[i] = d[i * 4] > 128 ? 242 : 16;
  return g;
}
function paint(cv: HTMLCanvasElement | null, bytes: Uint8Array) {
  if (!cv) return;
  const x = cv.getContext("2d")!;
  const img = x.createImageData(S, S);
  for (let i = 0; i < S * S; i++) { img.data[i * 4] = img.data[i * 4 + 1] = img.data[i * 4 + 2] = bytes[i]; img.data[i * 4 + 3] = 255; }
  x.putImageData(img, 0, 0);
}
const rand = (n: number) => crypto.getRandomValues(new Uint8Array(n));

export default function Cipher() {
  const a = useRef<HTMLCanvasElement>(null), b = useRef<HTMLCanvasElement>(null), c = useRef<HTMLCanvasElement>(null);
  const [key, setKey] = useState(() => rand(16));

  useEffect(() => {
    const p = plaintext();
    paint(a.current, p);
    paint(b.current, ecb(p, key));
    paint(c.current, ctr(p, key, rand(8)));
  }, [key]);

  const hex = [...key].map((v) => v.toString(16).padStart(2, "0")).join("");
  const panel = (ref: React.RefObject<HTMLCanvasElement | null>, title: string, sub: string, hot?: boolean) => (
    <div>
      <canvas ref={ref} width={S} height={S} style={{ width: "100%", height: "auto", imageRendering: "pixelated", borderRadius: 6, border: `1px solid ${hot ? "var(--accent)" : "var(--rule)"}`, display: "block" }} />
      <div className="mono" style={{ marginTop: 4, color: hot ? "var(--accent)" : "var(--ink)" }}>{title}</div>
      <div className="mono dim" style={{ fontSize: "0.6rem" }}>{sub}</div>
    </div>
  );

  return (
    <div className="stage">
      <div className="stage-h">
        <span className="mono">AES-128 written from the spec · key {hex.slice(0, 8)}…</span>
        <button className="sm" onClick={() => setKey(rand(16))}>new key</button>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0,1fr))", gap: "0.7rem" }}>
        {panel(a, "plaintext", "a 64×64 image")}
        {panel(b, "AES-ECB", "same block → same bytes: the lock survives", true)}
        {panel(c, "AES-CTR", "keystream XOR: pure noise")}
      </div>
      <div style={{ display: "grid", gap: 3, marginTop: "0.2rem" }}>
        {PHASES.map(([k, v]) => (
          <div key={k} className="mono" style={{ fontSize: "0.62rem", display: "grid", gridTemplateColumns: "7.6rem 1fr", gap: "0.5rem" }}>
            <span className="acc">{k}</span><span className="dim">{v}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
