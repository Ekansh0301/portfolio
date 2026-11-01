import { useState } from "react";
import { factor, fromBig, keygen, modpow, toBig } from "../../lib/rsa";

type Key = ReturnType<typeof keygen>;
const short = (v: bigint) => { const s = v.toString(); return s.length > 22 ? s.slice(0, 10) + "…" + s.slice(-8) : s; };

/** Breaking textbook RSA two ways: factor n, or exploit malleability. Both run for real on BigInt. */
export default function Cipher() {
  const [bits, setBits] = useState(48);
  const [key, setKey] = useState<Key>(() => keygen(48));
  const [msg, setMsg] = useState("hi!");
  const [tab, setTab] = useState<"factor" | "malleate">("factor");
  const [attack, setAttack] = useState<null | { ms: number; iters: number; p: bigint | null; plain: string; busy?: boolean }>(null);

  const maxBytes = Math.max(1, Math.floor((bits - 1) / 8));
  const m = toBig(msg.slice(0, maxBytes));
  const c = modpow(m, key.e, key.n);

  const regen = (b = bits) => { setKey(keygen(b)); setAttack(null); };
  const setB = (b: number) => { setBits(b); regen(b); };

  const doFactor = () => {
    setAttack({ ms: 0, iters: 0, p: null, plain: "", busy: true });
    setTimeout(() => {
      const t0 = performance.now();
      const r = factor(key.n);
      const ms = performance.now() - t0;
      if (!r.p) return setAttack({ ms, iters: r.iters, p: null, plain: "" });
      const q = key.n / r.p;
      // The attacker rebuilds the private exponent from the factors alone.
      let [a, b, x0, x1] = [key.e, (r.p - 1n) * (q - 1n), 1n, 0n];
      const phi = b;
      while (b) { const k = a / b; [a, b] = [b, a - k * b]; [x0, x1] = [x1, x0 - k * x1]; }
      const d = ((x0 % phi) + phi) % phi;
      setAttack({ ms, iters: r.iters, p: r.p, plain: fromBig(modpow(c, d, key.n)) });
    }, 30);
  };

  // Malleability: c * 2^e decrypts to 2m. The attacker never learns the key.
  const c2 = (c * modpow(2n, key.e, key.n)) % key.n;
  const m2 = modpow(c2, key.d, key.n);

  return (
    <div className="stage">
      <div className="stage-h">
        <span className="mono">textbook RSA · BigInt · no padding</span>
        <div className="tabs">
          <button className={`sm ${tab === "factor" ? "on" : ""}`} onClick={() => setTab("factor")}>factor n</button>
          <button className={`sm ${tab === "malleate" ? "on" : ""}`} onClick={() => setTab("malleate")}>malleate c</button>
        </div>
      </div>

      <div className="sl" style={{ ["--lw" as string]: "4rem", gridTemplateColumns: "4rem 1fr 3.4rem" }}>
        <span>n bits</span>
        <input type="range" min={32} max={88} step={8} value={bits} onChange={(e) => setB(+e.target.value)} aria-label="Modulus size in bits" />
        <span>{bits}</span>
      </div>
      <div className="row">
        <input className="field" style={{ flex: 1 }} value={msg} maxLength={maxBytes} onChange={(e) => { setMsg(e.target.value); setAttack(null); }} aria-label="Message" />
        <button className="sm" onClick={() => regen()}>new key</button>
      </div>
      <div className="out">
        <div><span className="dim">n </span>{short(key.n)}  <span className="dim">e </span>{String(key.e)}</div>
        <div><span className="dim">c = m^e mod n </span><span className="acc">{short(c)}</span></div>
      </div>

      {tab === "factor" ? (
        <>
          <div className="row"><button className="sm on" onClick={doFactor} disabled={attack?.busy}>{attack?.busy ? "factoring…" : "break it"}</button>
            <span className="mono dim">Pollard-Brent, ≈ 2^{(bits / 4).toFixed(0)} steps</span></div>
          <div className="log">
            {!attack && <div className="dim">Smaller n falls instantly. Slide it up and time the break.</div>}
            {attack && !attack.busy && (attack.p ? <>
              <div>found p = {short(attack.p)} in <span className="acc">{attack.ms.toFixed(0)} ms</span> ({attack.iters.toLocaleString()} steps)</div>
              <div>rebuilt d from p, q → decrypted: <span className="ok">“{attack.plain}”</span></div>
            </> : <div className="bad">gave up after {attack.iters.toLocaleString()} steps</div>)}
          </div>
          <div className="out dim" style={{ fontSize: "0.64rem" }}>Each +8 bits of n multiplies the work by 4. A 2048-bit n needs about 2^512 steps by this method, which is why real keys are that large.</div>
        </>
      ) : (
        <>
          <div className="out">
            <div><span className="dim">attacker sends c′ = c·2^e mod n = </span>{short(c2)}</div>
            <div><span className="dim">oracle decrypts c′ → </span><span className="acc">{short(m2)}</span></div>
            <div><span className="dim">2·m = </span>{short(m * 2n)} <span className={m2 === (m * 2n) % key.n ? "ok" : "bad"}>{m2 === (m * 2n) % key.n ? "✓ match" : "✗"}</span></div>
          </div>
          <div className="log">Without padding, ciphertexts can be edited. The attacker doubled your plaintext without knowing d. This is why CryptoStack ships OAEP next to the raw primitive.</div>
        </>
      )}
    </div>
  );
}
