import { useEffect, useMemo, useRef, useState } from "react";
import { ctr, ecb } from "../../lib/aes";
import { hmac } from "../../lib/sha256";
import { bigToText, crt, genPrime, gcd, iroot, keygen, modpow, randBig, textToBig, toBig, toBytes } from "../../lib/rsa";

/**
 * CryptoStack as a map and a lab. The twenty primitives sit in their five
 * phases with the reductions that connect them; the ones the project ships an
 * attack for light up, and each attack here runs for real (BigInt RSA, AES-128
 * from the spec, SHA-256/HMAC, Miller-Rabin). Names and attacks come from the
 * repo's README.
 */
type Prim = { id: string; name: string; phase: number; row: number; info: string; attack?: boolean };
const PHASES = ["0 · number theory", "1 · symmetric", "2 · hashing", "3 · public key", "4 · MPC"];
const PRIMS: Prim[] = [
  { id: "mr", name: "Miller-Rabin", phase: 0, row: 0, attack: true, info: "Primality testing with 40 rounds. Catches the Carmichael numbers that fool the Fermat test." },
  { id: "owf", name: "OWF / PRG", phase: 1, row: 0, info: "One-way functions and pseudorandom generators. The HILL construction proves OWF ↔ PRG." },
  { id: "prf", name: "PRF", phase: 1, row: 1, info: "A GGM tree over a PRG, and AES-128 as a PRF. Reduction: PRG ↔ PRF." },
  { id: "cpa", name: "CPA", phase: 1, row: 2, info: "IND-CPA secure encryption. Reusing a nonce breaks indistinguishability." },
  { id: "modes", name: "Modes", phase: 1, row: 3, attack: true, info: "ECB, CBC, OFB and CTR over AES-128, which the project implements from scratch." },
  { id: "mac", name: "MAC", phase: 1, row: 4, info: "PRF-MAC, CBC-MAC and HMAC. Flip one bit of a message and verification fails." },
  { id: "cca", name: "CCA", phase: 1, row: 5, attack: true, info: "Encrypt-then-MAC: the construction that makes encryption tamper-evident." },
  { id: "md", name: "Merkle-Damgård", phase: 2, row: 0, info: "The hash framework with MD-strengthening, with the chain visualised." },
  { id: "crhf", name: "DLP-CRHF", phase: 2, row: 1, info: "A collision-resistant hash built on the discrete-log problem." },
  { id: "bday", name: "Birthday", phase: 2, row: 2, info: "The collision attack and its birthday curve." },
  { id: "hmac", name: "HMAC", phase: 2, row: 3, info: "Full HMAC and Encrypt-then-HMAC. Reduction: CRHF ↔ HMAC ↔ MAC." },
  { id: "dh", name: "Diffie-Hellman", phase: 3, row: 0, attack: true, info: "Key exchange, with a man-in-the-middle simulation." },
  { id: "rsa", name: "RSA", phase: 3, row: 1, attack: true, info: "RSA with PKCS#1 v1.5 padding. Textbook RSA is deterministic." },
  { id: "crt", name: "CRT", phase: 3, row: 2, attack: true, info: "A Chinese Remainder Theorem solver and Håstad's broadcast attack." },
  { id: "sig", name: "Signatures", phase: 3, row: 3, attack: true, info: "RSA signatures. Without hashing they are multiplicatively forgeable." },
  { id: "eg", name: "ElGamal", phase: 3, row: 4, info: "Public-key encryption. Malleable: scaling the ciphertext scales the plaintext." },
  { id: "ccapkc", name: "CCA-PKC", phase: 3, row: 5, info: "ElGamal and RSA combined so that tampering is detected." },
  { id: "ot", name: "Oblivious Transfer", phase: 4, row: 0, info: "1-out-of-2 OT: the receiver learns one value, the sender never learns which." },
  { id: "gates", name: "Secure gates", phase: 4, row: 1, info: "AND via OT, XOR by additive sharing, NOT resolved locally." },
  { id: "mpc", name: "MPC circuits", phase: 4, row: 2, info: "Two-party comparison, equality and addition: the millionaires' problem." },
];
const EDGES: [string, string][] = [["owf", "prf"], ["prf", "cpa"], ["prf", "mac"], ["cpa", "cca"], ["mac", "cca"], ["md", "crhf"], ["crhf", "hmac"], ["bday", "crhf"], ["hmac", "mac"], ["mr", "rsa"], ["dh", "eg"], ["eg", "ccapkc"], ["rsa", "crt"], ["rsa", "sig"], ["rsa", "ccapkc"], ["ot", "gates"], ["gates", "mpc"]];
const ATTACKS = PRIMS.filter((p) => p.attack).map((p) => p.id);

const PW = 128, PH = 29, CW = 142, TOP = 30, GAP = 38;
const pos = (p: Prim) => ({ x: 4 + p.phase * CW, y: TOP + p.row * GAP });
const byId = Object.fromEntries(PRIMS.map((p) => [p.id, p]));

const short = (v: bigint, a = 8, z = 6) => { const s = v.toString(); return s.length > a + z + 1 ? `${s.slice(0, a)}…${s.slice(-z)}` : s; };
const rand = (n: number) => crypto.getRandomValues(new Uint8Array(n));
const enc = (s: string) => new TextEncoder().encode(s);
const dec = (b: Uint8Array) => new TextDecoder("utf-8", { fatal: false }).decode(b);
const cat = (...xs: Uint8Array[]) => Uint8Array.from(xs.flatMap((x) => [...x]));
const Row = ({ k, children }: { k: string; children: React.ReactNode }) => (
  <div style={{ display: "grid", gridTemplateColumns: "6.2rem 1fr", gap: 8, alignItems: "baseline" }} className="mono"><span className="dim" style={{ fontSize: "0.73rem" }}>{k}</span><span style={{ fontSize: "0.83rem", wordBreak: "break-all" }}>{children}</span></div>
);

/* ---------- Miller-Rabin vs Fermat on Carmichael numbers ---------- */
function MillerRabin() {
  const NS = [561, 1105, 1729, 7919];
  const [n, setN] = useState(561);
  const N = BigInt(n);
  const rows = [2, 3, 5, 7].filter((a) => a < n).map((a) => {
    const A = BigInt(a);
    const g = gcd(A, N);
    const fermat = g !== 1n ? "shares a factor" : modpow(A, N - 1n, N) === 1n ? "prime?" : "composite";
    let d = N - 1n, s = 0; while (!(d & 1n)) { d >>= 1n; s++; }
    let x = modpow(A, d, N), pass = x === 1n || x === N - 1n;
    for (let i = 1; i < s && !pass; i++) { x = (x * x) % N; if (x === N - 1n) pass = true; }
    return { a, fermat, mr: pass ? "prime?" : "composite" };
  });
  const fact = n === 561 ? "3 · 11 · 17" : n === 1105 ? "5 · 13 · 17" : n === 1729 ? "7 · 13 · 19" : "prime";
  return (
    <>
      <div className="row">{NS.map((v) => <button key={v} className={`sm ${n === v ? "on" : ""}`} onClick={() => setN(v)}>{v}</button>)}<span className="mono dim" style={{ marginLeft: 6 }}>= {fact}</span></div>
      <div style={{ display: "grid", gridTemplateColumns: "3rem 1fr 1fr", gap: "3px 10px" }} className="mono">
        <span className="dim" style={{ fontSize: "0.71rem" }}>base</span><span className="dim" style={{ fontSize: "0.71rem" }}>Fermat test</span><span className="dim" style={{ fontSize: "0.71rem" }}>Miller-Rabin</span>
        {rows.map((r) => (
          <div key={r.a} style={{ display: "contents", fontSize: "0.83rem" }}>
            <span>a={r.a}</span>
            <span className={r.fermat === "composite" ? "ok" : r.fermat === "prime?" && n !== 7919 ? "bad" : ""}>{r.fermat}</span>
            <span className={r.mr === "composite" ? "ok" : n === 7919 ? "" : "bad"}>{r.mr}</span>
          </div>
        ))}
      </div>
      <div className="log" style={{ minHeight: 0 }}>{n === 7919 ? "A real prime passes every round of both tests." : <>Fermat is fooled by <span className="acc">{n}</span> for every coprime base. Miller-Rabin's extra square-root check exposes it at once. This is why the project runs 40 rounds of Miller-Rabin.</>}</div>
    </>
  );
}

/* ---------- ECB leaks structure ---------- */
function Modes() {
  const a = useRef<HTMLCanvasElement>(null), b = useRef<HTMLCanvasElement>(null), c = useRef<HTMLCanvasElement>(null);
  const [seed, setSeed] = useState(0);
  useEffect(() => {
    const S = 64;
    const cv = document.createElement("canvas"); cv.width = S; cv.height = S;
    const x = cv.getContext("2d")!;
    x.fillStyle = "#101010"; x.fillRect(0, 0, S, S); x.fillStyle = "#f2f2f2"; x.strokeStyle = "#f2f2f2";
    x.lineWidth = 6; x.beginPath(); x.arc(32, 27, 12, Math.PI, 0); x.moveTo(20, 27); x.lineTo(20, 32); x.moveTo(44, 27); x.lineTo(44, 32); x.stroke();
    x.fillRect(14, 31, 36, 26); x.fillStyle = "#101010"; x.beginPath(); x.arc(32, 41, 4, 0, 7); x.fill(); x.fillRect(30, 43, 4, 9);
    const d = x.getImageData(0, 0, S, S).data, p = new Uint8Array(S * S);
    for (let i = 0; i < S * S; i++) p[i] = d[i * 4] > 128 ? 242 : 16;
    const key = rand(16);
    const paint = (el: HTMLCanvasElement | null, bytes: Uint8Array) => {
      if (!el) return;
      const cx = el.getContext("2d")!, im = cx.createImageData(S, S);
      for (let i = 0; i < S * S; i++) { im.data[i * 4] = im.data[i * 4 + 1] = im.data[i * 4 + 2] = bytes[i]; im.data[i * 4 + 3] = 255; }
      cx.putImageData(im, 0, 0);
    };
    paint(a.current, p); paint(b.current, ecb(p, key)); paint(c.current, ctr(p, key, rand(8)));
  }, [seed]);
  const cell = (ref: React.RefObject<HTMLCanvasElement | null>, t: string, s: string, hot?: boolean) => (
    <div><canvas ref={ref} width={64} height={64} style={{ width: "100%", imageRendering: "pixelated", borderRadius: 6, border: `1px solid ${hot ? "var(--accent)" : "var(--rule)"}`, display: "block" }} /><div className="mono" style={{ marginTop: 3, color: hot ? "var(--accent)" : "var(--ink)" }}>{t}</div><div className="mono dim" style={{ fontSize: "0.71rem" }}>{s}</div></div>
  );
  return (
    <>
      <div className="modes-grid" style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0,1fr))", gap: "0.6rem", maxWidth: 255 }}>
        {cell(a, "plaintext", "64×64 image")}{cell(b, "AES-ECB", "same block, same bytes", true)}{cell(c, "AES-CTR", "keystream XOR")}
      </div>
      <div className="row"><button className="sm" onClick={() => setSeed((s) => s + 1)}>new key</button><span className="mono dim">identical blocks encrypt identically, so ECB keeps the picture's outline</span></div>
    </>
  );
}

/* ---------- CPA-only vs Encrypt-then-MAC ---------- */
function Cca() {
  const [run, setRun] = useState(0);
  const d = useMemo(() => {
    void run;
    const key = rand(16), mk = rand(32), nonce = rand(8);
    const msg = enc("PAY ALICE $100");
    const ct = ctr(msg, key, nonce);
    const tag = hmac(mk, cat(nonce, ct)).slice(0, 8);
    const p = msg.indexOf(0x31);                        // the '1' in $100
    const ct2 = ct.slice(); ct2[p] ^= 0x31 ^ 0x39;      // CTR is malleable: XOR the difference in
    const cpa = dec(ctr(ct2, key, nonce));
    const tag2 = hmac(mk, cat(nonce, ct2)).slice(0, 8);
    return { ct, ct2, p, cpa, accepted: tag2.every((v, i) => v === tag[i]) };
  }, [run]);
  const bytes = (b: Uint8Array, mark = -1) => <span className="mono" style={{ fontSize: "0.83rem" }}>{[...b].map((v, i) => <span key={i} style={i === mark ? { color: "var(--accent)", fontWeight: 700, background: "color-mix(in srgb, var(--accent) 16%, transparent)" } : undefined}>{v.toString(16).padStart(2, "0")} </span>)}</span>;
  return (
    <>
      <Row k="Alice sends">“PAY ALICE $100” encrypted with AES-CTR</Row>
      <Row k="ciphertext">{bytes(d.ct)}</Row>
      <Row k="Mallory flips">{bytes(d.ct2, d.p)} <span className="dim">one byte, no key</span></Row>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.7rem" }}>
        <div className="log" style={{ minHeight: 0 }}><div className="dim">CPA-secure encryption only</div><div className="bad">accepts “{d.cpa}”</div><div className="dim">secret, but not tamper-proof</div></div>
        <div className="log" style={{ minHeight: 0, borderColor: "var(--accent)" }}><div className="dim">Encrypt-then-MAC (HMAC-SHA256)</div><div className="ok">{d.accepted ? "accepted" : "rejected: tag mismatch"}</div><div className="dim">the edit is detected</div></div>
      </div>
      <button className="sm" style={{ justifySelf: "start" }} onClick={() => setRun((r) => r + 1)}>run again with new keys</button>
    </>
  );
}

/* ---------- textbook RSA is deterministic ---------- */
function pkcs1(m: Uint8Array, k: number) {
  const ps = rand(k * 2).filter((v) => v !== 0).slice(0, k - 3 - m.length);
  return cat(Uint8Array.from([0, 2]), ps, Uint8Array.from([0]), m);
}
function Rsa() {
  const [run, setRun] = useState(0);
  const d = useMemo(() => {
    void run;
    const key = keygen(256), m = enc("yes");
    const tb = () => modpow(toBig(m), key.e, key.n);
    const pk = () => modpow(toBig(pkcs1(m, 32)), key.e, key.n);
    const [t1, t2, p1, p2] = [tb(), tb(), pk(), pk()];
    const padded = toBytes(modpow(p1, key.d, key.n), 32);
    const back = dec(padded.slice(padded.indexOf(0, 2) + 1));
    return { t1, t2, p1, p2, back };
  }, [run]);
  const h = (v: bigint) => v.toString(16).slice(0, 26) + "…";
  const same = d.t1 === d.t2;
  return (
    <>
      <Row k="message">“yes”, encrypted twice under the same 256-bit key</Row>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.7rem" }}>
        <div className="log" style={{ minHeight: 0 }}>
          <div className="dim">textbook RSA</div>
          <div className="mono" style={{ fontSize: "0.78rem" }}>{h(d.t1)}</div><div className="mono" style={{ fontSize: "0.78rem" }}>{h(d.t2)}</div>
          <div className={same ? "bad" : "ok"}>{same ? "identical: Eve learns the two messages are equal" : "different"}</div>
        </div>
        <div className="log" style={{ minHeight: 0, borderColor: "var(--accent)" }}>
          <div className="dim">PKCS#1 v1.5 padding</div>
          <div className="mono" style={{ fontSize: "0.78rem" }}>{h(d.p1)}</div><div className="mono" style={{ fontSize: "0.78rem" }}>{h(d.p2)}</div>
          <div className={d.p1 !== d.p2 ? "ok" : "bad"}>{d.p1 !== d.p2 ? `different, yet both decrypt to “${d.back}”` : "identical"}</div>
        </div>
      </div>
      <button className="sm" style={{ justifySelf: "start" }} onClick={() => setRun((r) => r + 1)}>encrypt again</button>
    </>
  );
}

/* ---------- Håstad's broadcast attack ---------- */
function Crt() {
  const MSGS = ["ATTACK AT DAWN", "MEET AT NINE", "THE VAULT CODE"];
  const [msg, setMsg] = useState(MSGS[0]);
  const [run, setRun] = useState(0);
  const d = useMemo(() => {
    void run;
    const m = textToBig(msg);
    const modulus = () => { for (;;) { const p = genPrime(128, (x) => x % 3n === 2n), q = genPrime(128, (x) => x % 3n === 2n); if (p !== q) return p * q; } };
    const ns = [modulus(), modulus(), modulus()];
    const cs = ns.map((n) => modpow(m, 3n, n));
    const x = crt(cs, ns);
    const r = iroot(x, 3n);
    return { ns, cs, x, text: bigToText(r), ok: r === m };
  }, [msg, run]);
  return (
    <>
      <div className="row">{MSGS.map((m) => <button key={m} className={`sm ${msg === m ? "on" : ""}`} onClick={() => setMsg(m)}>{m.toLowerCase()}</button>)}</div>
      <Row k="broadcast">the same message, e = 3, to three recipients</Row>
      {d.ns.map((n, i) => <Row key={i} k={`recipient ${i + 1}`}><span className="dim">n=</span>{short(n, 6, 4)} <span className="dim">c=</span>{short(d.cs[i], 6, 4)}</Row>)}
      <Row k="CRT combines">x ≡ cᵢ (mod nᵢ) → x = m³ = <span className="acc">{short(d.x, 8, 6)}</span></Row>
      <Row k="cube root">∛x → <b className={d.ok ? "ok" : "bad"}>“{d.text}”</b></Row>
      <div className="row"><span className="mono dim">recovered with no private key at all</span><button className="sm" onClick={() => setRun((r) => r + 1)}>new keys</button></div>
    </>
  );
}

/* ---------- multiplicative signature forgery ---------- */
function Sig() {
  const [run, setRun] = useState(0);
  const d = useMemo(() => {
    void run;
    const k = keygen(128);
    const sign = (m: bigint) => modpow(m, k.d, k.n);
    const s1 = sign(6n), s2 = sign(7n);
    const forged = (s1 * s2) % k.n;
    return { k, s1, s2, forged, valid: modpow(forged, k.e, k.n) === 42n };
  }, [run]);
  return (
    <>
      <Row k="signer signs">m = 6 → σ₁ = {short(d.s1, 8, 6)}</Row>
      <Row k="signer signs">m = 7 → σ₂ = {short(d.s2, 8, 6)}</Row>
      <Row k="Mallory multiplies">σ₁ · σ₂ mod n = <span className="acc">{short(d.forged, 8, 6)}</span></Row>
      <Row k="verifier checks">σᵉ mod n = <b className={d.valid ? "bad" : "ok"}>{short(modpow(d.forged, d.k.e, d.k.n))}</b></Row>
      <div className="log" style={{ minHeight: 0 }}>The signer never saw 42, yet the forged signature is valid for it, because σ(a)·σ(b) = σ(a·b). Hashing before signing breaks this.</div>
      <button className="sm" style={{ justifySelf: "start" }} onClick={() => setRun((r) => r + 1)}>new key</button>
    </>
  );
}

/* ---------- Diffie-Hellman man in the middle ---------- */
function Dh() {
  const [run, setRun] = useState(0);
  const d = useMemo(() => {
    void run;
    const p = (1n << 127n) - 1n, g = 3n;
    const a = randBig(64), b = randBig(64), m = randBig(64);
    const A = modpow(g, a, p), B = modpow(g, b, p), M = modpow(g, m, p);
    return { A, B, M, kAlice: modpow(M, a, p), kMalloryA: modpow(A, m, p), kBob: modpow(M, b, p), kMalloryB: modpow(B, m, p) };
  }, [run]);
  const k = (v: bigint) => short(v, 6, 4);
  return (
    <>
      <svg viewBox="0 0 420 96" role="img" aria-label="Alice and Bob each share a key with Mallory, not with each other" style={{ maxHeight: 110 }}>
        {[["Alice", 40], ["Mallory", 210], ["Bob", 380]].map(([n, x]) => <g key={n as string}><rect x={(x as number) - 36} y="30" width="72" height="30" rx="8" fill="var(--card)" stroke={n === "Mallory" ? "var(--bad)" : "var(--ink-2)"} strokeWidth="1.5" /><text x={x as number} y="49" textAnchor="middle" fontSize="11" style={{ fill: n === "Mallory" ? "var(--bad)" : "var(--ink)" }}>{n}</text></g>)}
        <line x1="76" y1="45" x2="174" y2="45" stroke="var(--accent)" strokeWidth="2.5" /><line x1="246" y1="45" x2="344" y2="45" stroke="var(--accent)" strokeWidth="2.5" />
        <text x="125" y="36" textAnchor="middle" fontSize="9" style={{ fill: "var(--accent)" }}>K₁ = {k(d.kAlice)}</text>
        <text x="295" y="36" textAnchor="middle" fontSize="9" style={{ fill: "var(--accent)" }}>K₂ = {k(d.kBob)}</text>
        <text x="125" y="66" textAnchor="middle" fontSize="8.5" style={{ fill: "var(--ink-3)" }}>Mallory derives {k(d.kMalloryA)}</text>
        <text x="295" y="66" textAnchor="middle" fontSize="8.5" style={{ fill: "var(--ink-3)" }}>Mallory derives {k(d.kMalloryB)}</text>
        <text x="210" y="88" textAnchor="middle" fontSize="9" style={{ fill: "var(--ink-3)" }}>K₁ ≠ K₂, yet each pair thinks it is private</text>
      </svg>
      <div className="log" style={{ minHeight: 0 }}>Mallory swaps both public values for her own g^m. Each side computes a key with <b>her</b>, so she decrypts, reads and re-encrypts every message. Plain DH has no authentication.</div>
      <button className="sm" style={{ justifySelf: "start" }} onClick={() => setRun((r) => r + 1)}>new run</button>
    </>
  );
}

const PANELS: Record<string, () => React.JSX.Element> = { mr: MillerRabin, modes: Modes, cca: Cca, rsa: Rsa, crt: Crt, sig: Sig, dh: Dh };
const ATTACK_TITLE: Record<string, string> = {
  mr: "Fermat fooled by Carmichael numbers", modes: "ECB leaks structure", cca: "Bit-flipping a CTR ciphertext", rsa: "Textbook RSA is deterministic", crt: "Håstad's broadcast attack", sig: "Forging a signature nobody made", dh: "Man in the middle",
};

export default function Cipher() {
  const [sel, setSel] = useState("crt");
  const manual = useRef(false);
  useEffect(() => {
    const id = window.setInterval(() => { if (!manual.current) setSel((s) => ATTACKS[(ATTACKS.indexOf(s) + 1) % ATTACKS.length]); }, 14000);
    return () => clearInterval(id);
  }, []);
  const P = byId[sel];
  const Panel = PANELS[sel];
  const linked = new Set(EDGES.filter(([a, b]) => a === sel || b === sel).flat());

  return (
    <div className="stage">
      <div className="stage-h">
        <span className="mono">20 primitives · 5 phases · from scratch, standard library only</span>
        <span className="mono dim">⚡ = has a working attack · click any</span>
      </div>

      <svg viewBox="0 0 716 250" role="group" aria-label="Map of the twenty primitives and their reductions" className="cmap" style={{ maxHeight: 300 }}>
        {PHASES.map((t, i) => <text key={t} x={4 + i * CW + 2} y="16" fontSize="10.5" style={{ fill: "var(--ink-3)", letterSpacing: "0.04em" }}>{t.toUpperCase()}</text>)}
        {EDGES.map(([a, b]) => {
          const A = pos(byId[a]), B = pos(byId[b]);
          const hot = a === sel || b === sel;
          const x1 = A.x + (A.x === B.x ? PW / 2 : PW), y1 = A.y + PH / 2 + (A.x === B.x ? (A.y < B.y ? PH / 2 : -PH / 2) : 0);
          const x2 = B.x + (A.x === B.x ? PW / 2 : B.x > A.x ? 0 : PW), y2 = B.y + PH / 2 + (A.x === B.x ? (A.y < B.y ? -PH / 2 : PH / 2) : 0);
          return <line key={a + b} x1={x1} y1={y1} x2={x2} y2={y2} stroke={hot ? "var(--accent)" : "var(--ink-3)"} strokeWidth={hot ? 1.6 : 0.8} opacity={hot ? 1 : 0.4} />;
        })}
        {PRIMS.map((p) => {
          const { x, y } = pos(p);
          const on = p.id === sel, near = linked.has(p.id);
          return (
            <g key={p.id} role="button" tabIndex={0} aria-label={p.name} style={{ cursor: "pointer", outline: "none" }} onClick={() => { manual.current = true; setSel(p.id); }} onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && (e.preventDefault(), (manual.current = true, setSel(p.id)))}>
              <rect x={x} y={y} width={PW} height={PH} rx="8" fill={on ? "var(--accent)" : "var(--card)"} stroke={on ? "var(--accent)" : near ? "var(--accent)" : "var(--rule)"} strokeWidth={near || on ? 1.5 : 1} style={{ transition: "fill 0.25s" }} />
              <text x={x + 10} y={y + 19} fontSize="12.5" style={{ fill: on ? "var(--accent-ink)" : "var(--ink)" }}>{p.name}</text>
              {p.attack && <text x={x + PW - 16} y={y + 19.5} fontSize="12.5" style={{ fill: on ? "var(--accent-ink)" : "var(--accent)" }}>⚡</text>}
            </g>
          );
        })}
      </svg>

      <div key={sel} className="cpanel" style={{ borderTop: "1px solid var(--rule)", paddingTop: "0.6rem", display: "grid", gap: "0.5rem" }}>
        <div>
          <div className="mono acc" style={{ fontSize: "0.76rem", textTransform: "uppercase", letterSpacing: "0.08em" }}>{PHASES[P.phase]} · {P.name}{ATTACK_TITLE[sel] ? ` · ${ATTACK_TITLE[sel]}` : ""}</div>
          <div style={{ fontSize: "1.00rem", color: "var(--ink-2)", marginTop: 2 }}>{P.info}</div>
        </div>
        {Panel ? <Panel /> : (
          <div className="log" style={{ minHeight: 0 }}>
            {EDGES.filter(([a, b]) => a === sel || b === sel).map(([a, b]) => <div key={a + b}>{byId[a].name} → {byId[b].name}</div>)}
            <div className="dim" style={{ marginTop: 4 }}>The lit lines are the reductions this primitive takes part in. Pick a ⚡ primitive to break it.</div>
          </div>
        )}
      </div>
    </div>
  );
}
