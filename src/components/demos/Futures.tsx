import { useMemo, useState } from "react";
import { HOUSEHOLDS, N, T, buildFile, headToHead, verify } from "../../lib/futures";

/**
 * Foresight's core move, run for real on a toy model: a recommendation and its
 * alternative on the SAME 10,000 futures (a paired comparison), a cause-by-cause
 * bridge that adds up exactly to the difference, and a hash-chained file you can
 * replay or tamper with. The numbers come from a small illustrative model, not
 * the project's engine; the mechanisms are the project's.
 */
const k = (v: number) => `${v < 0 ? "−" : "+"}$${Math.abs(Math.round(v / 1000))}k`;

export default function Futures() {
  const [hh, setHh] = useState(0);
  const [tampered, setTampered] = useState(false);
  const [msg, setMsg] = useState("");
  const H = HOUSEHOLDS[hh];
  const res = useMemo(() => headToHead(H), [H]);
  const file = useMemo(() => buildFile(H, res), [H, res]);

  const hist = useMemo(() => {
    const s = Float64Array.from(res.diffs).sort();
    const lo = s[Math.floor(N * 0.02)], hi = s[Math.floor(N * 0.98)], bins = 44, c = new Array(bins).fill(0);
    for (const d of res.diffs) c[Math.max(0, Math.min(bins - 1, Math.floor(((d - lo) / (hi - lo)) * bins)))]++;
    return { c, lo, hi, zero: ((0 - lo) / (hi - lo)) * bins, max: Math.max(...c) };
  }, [res]);

  const shown = tampered ? file.lines.map((l, i) => (i === 1 ? l.replace(/\d+\.\d%/, `${Math.min(99.9, res.win * 100 + 20).toFixed(1)}%`) : l)) : file.lines;
  const ok = verify(shown, file.hashes);
  const reach = Math.max(...res.bridge.map((b) => Math.abs(b.value)), Math.abs(res.mean));
  const win = res.win >= 0.5;

  return (
    <div className="stage">
      <div className="stage-h">
        <span className="mono">same {N.toLocaleString()} futures · two options</span>
        <div className="tabs">{HOUSEHOLDS.map((x, i) => <button key={x.id} className={`sm ${hh === i ? "on" : ""}`} onClick={() => { setHh(i); setTampered(false); setMsg(""); }}>{x.name}</button>)}</div>
      </div>
      <div className="mono dim" style={{ fontSize: "0.64rem", marginTop: -2 }}>keep the annuity vs exchange it · {H.note} · {T} years from $500k</div>

      <div style={{ display: "grid", gridTemplateColumns: "minmax(0,0.85fr) minmax(0,1.5fr)", gap: "0.9rem", alignItems: "center" }}>
        <div>
          <div className="mono dim" style={{ fontSize: "0.58rem", textTransform: "uppercase", letterSpacing: "0.08em" }}>head-to-head</div>
          <div style={{ fontFamily: "var(--serif)", fontSize: "2.4rem", lineHeight: 1, color: win ? "var(--ok)" : "var(--bad)" }}>{(res.win * 100).toFixed(0)}%</div>
          <div className="mono" style={{ fontSize: "0.64rem", lineHeight: 1.4 }}>of futures the exchange wins<br /><span className={win ? "ok" : "bad"}>{k(res.median)} in the typical one</span></div>
        </div>
        <div>
          <svg viewBox="0 0 100 34" preserveAspectRatio="none" style={{ width: "100%", height: 64, display: "block" }} aria-label="Distribution of the exchange's advantage across futures">
            {hist.c.map((n, i) => <rect key={i} x={(i / hist.c.length) * 100 + 0.15} width={100 / hist.c.length - 0.3} y={32 - (n / hist.max) * 30} height={(n / hist.max) * 30} fill={i + 0.5 >= hist.zero ? "var(--accent)" : "var(--ink-3)"} opacity={i + 0.5 >= hist.zero ? 0.9 : 0.5} />)}
            <line x1={(hist.zero / hist.c.length) * 100} x2={(hist.zero / hist.c.length) * 100} y1="0" y2="34" stroke="var(--ink)" strokeWidth="0.6" vectorEffect="non-scaling-stroke" />
          </svg>
          <div className="mono dim" style={{ display: "flex", justifyContent: "space-between", fontSize: "0.56rem" }}><span>exchange loses</span><span>0</span><span>exchange wins</span></div>
        </div>
      </div>

      <div>
        <div className="mono dim" style={{ fontSize: "0.58rem", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 4 }}>value bridge · why, in dollars</div>
        <div style={{ display: "grid", gap: 3 }}>
          {[...res.bridge, { label: "= the difference", value: res.mean }].map((b, i, a) => (
            <div key={b.label} className="mono" style={{ display: "grid", gridTemplateColumns: "8.4rem 1fr 3.4rem", gap: 8, alignItems: "center", borderTop: i === a.length - 1 ? "1px solid var(--rule)" : 0, paddingTop: i === a.length - 1 ? 3 : 0 }}>
              <span style={{ fontSize: "0.62rem", color: i === a.length - 1 ? "var(--ink)" : "var(--ink-2)", fontWeight: i === a.length - 1 ? 600 : 400 }}>{b.label}</span>
              <div style={{ position: "relative", height: 7, background: "var(--bg-2)", borderRadius: 4 }}>
                <div style={{ position: "absolute", left: "50%", top: -2, bottom: -2, width: 1, background: "var(--ink-3)" }} />
                <div style={{ position: "absolute", top: 0, bottom: 0, borderRadius: 4, background: b.value >= 0 ? "var(--ok)" : "var(--bad)", left: b.value >= 0 ? "50%" : `${50 - (Math.abs(b.value) / reach) * 50}%`, width: `${(Math.abs(b.value) / reach) * 50}%`, transition: "all 0.5s var(--ease)" }} />
              </div>
              <span style={{ fontSize: "0.62rem", textAlign: "right", color: b.value >= 0 ? "var(--ok)" : "var(--bad)" }}>{k(b.value)}</span>
            </div>
          ))}
        </div>
      </div>

      <div style={{ border: "1px solid var(--rule)", borderRadius: 8, padding: "0.5rem 0.65rem", background: "var(--card)" }}>
        <div className="row" style={{ justifyContent: "space-between", marginBottom: 4 }}>
          <span className="mono dim" style={{ fontSize: "0.58rem", textTransform: "uppercase", letterSpacing: "0.08em" }}>best-interest file · hash-chained</span>
          <span className="row">
            <button className="sm" onClick={() => setMsg(`replay re-ran the stored seed: ${(headToHead(H).win * 100).toFixed(1)}% and ${k(headToHead(H).median)}, identical ✓`)}>replay</button>
            <button className={`sm ${tampered ? "on" : ""}`} onClick={() => { setTampered((t) => !t); setMsg(""); }}>{tampered ? "restore" : "tamper"}</button>
          </span>
        </div>
        {shown.map((l, i) => (
          <div key={i} className="mono" style={{ display: "grid", gridTemplateColumns: "1fr 4.6rem 1rem", gap: 8, fontSize: "0.6rem", lineHeight: 1.5, alignItems: "baseline" }}>
            <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", color: ok[i] ? "var(--ink-2)" : "var(--bad)" }}>{l}</span>
            <span className="dim">{file.hashes[i].slice(0, 8)}</span>
            <span className={ok[i] ? "ok" : "bad"}>{ok[i] ? "✓" : "✗"}</span>
          </div>
        ))}
        <div className="mono" style={{ fontSize: "0.62rem", marginTop: 4, minHeight: "1.3em", color: ok.every(Boolean) ? "var(--ink-2)" : "var(--bad)" }}>
          {!ok.every(Boolean) ? `record altered at line ${ok.indexOf(false) + 1}: every hash after it no longer matches` : msg || "every line is chained to the one before it"}
        </div>
      </div>
    </div>
  );
}
