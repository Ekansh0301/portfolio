import { useDeferredValue, useMemo, useState } from "react";
import { BOOK, DEFAULTS, HOUSEHOLDS, N, T, buildFile, evaluate, flipMu, verify } from "../../lib/futures";

/**
 * Foresight's central moves, on a small illustrative model (not the project's
 * engine): a recommendation and its alternative on the SAME futures, a bridge
 * that adds up exactly, a hash-chained file you can replay or tamper with, and
 * a market monitor that re-runs a book after a fall to see whose advice flips.
 */
type View = "h2h" | "why" | "replay" | "monitor";
const VIEWS: [View, string][] = [["h2h", "Head-to-head"], ["why", "Why"], ["replay", "Replay"], ["monitor", "Monitor"]];
const k = (v: number) => `${v < 0 ? "−" : "+"}$${Math.abs(Math.round(v / 1000))}k`;
const label = { fontSize: "0.58rem", textTransform: "uppercase" as const, letterSpacing: "0.08em" };

export default function Futures() {
  const [view, setView] = useState<View>("h2h");
  const [hh, setHh] = useState(0);
  const [mu, setMu] = useState(DEFAULTS.mu);
  const [sur, setSur] = useState(DEFAULTS.sur);
  const [fall, setFall] = useState(0.2);
  const [tampered, setTampered] = useState(false);
  const [msg, setMsg] = useState("");
  const H = HOUSEHOLDS[hh];
  const p = { mu, sur, fall: 0 };

  const res = useMemo(() => evaluate(H.guarantee, p), [H, mu, sur]); // eslint-disable-line react-hooks/exhaustive-deps
  const slowSur = useDeferredValue(sur);
  const flip = useMemo(() => flipMu(H.guarantee, slowSur), [H, slowSur]);
  const file = useMemo(() => buildFile(H, p, res), [H, res]); // eslint-disable-line react-hooks/exhaustive-deps
  const base0 = useMemo(() => BOOK.map((h) => evaluate(h.guarantee, DEFAULTS, 1500).win), []);
  const book = useMemo(() => BOOK.map((h, i) => ({ h, now: evaluate(h.guarantee, { ...DEFAULTS, fall }, 1500).win, was: base0[i] })).sort((a, b) => a.now - b.now), [fall, base0]);

  const hist = useMemo(() => {
    const s = Float64Array.from(res.diffs).sort();
    const lo = s[Math.floor(N * 0.02)], hi = s[Math.floor(N * 0.98)], bins = 44, c = new Array(bins).fill(0);
    for (const d of res.diffs) c[Math.max(0, Math.min(bins - 1, Math.floor(((d - lo) / (hi - lo)) * bins)))]++;
    return { c, zero: ((0 - lo) / (hi - lo)) * bins, max: Math.max(...c) };
  }, [res]);

  const shown = tampered ? file.lines.map((l, i) => (i === 1 ? l.replace(/\d+\.\d%/, `${Math.min(99.9, res.win * 100 + 20).toFixed(1)}%`) : l)) : file.lines;
  const ok = verify(shown, file.hashes);
  const win = res.win >= 0.5;

  // value bridge as a waterfall
  const cum: number[] = [0];
  res.bridge.forEach((b) => cum.push(cum[cum.length - 1] + b.value));
  const top = Math.max(...cum, res.mean, 1), bot = Math.min(...cum, 0, res.mean);
  const y = (v: number) => 8 + ((top - v) / (top - bot || 1)) * 84;

  return (
    <div className="stage">
      <div className="stage-h">
        <span className="mono">same {N.toLocaleString()} futures · two options</span>
        <div className="tabs">{VIEWS.map(([v, l]) => <button key={v} className={`sm ${view === v ? "on" : ""}`} onClick={() => setView(v)}>{l}</button>)}</div>
      </div>

      {view !== "monitor" && (
        <div className="row" style={{ justifyContent: "space-between" }}>
          <div className="tabs">{HOUSEHOLDS.map((x, i) => <button key={x.id} className={`sm ${hh === i ? "on" : ""}`} onClick={() => { setHh(i); setTampered(false); setMsg(""); }}>{x.name}</button>)}</div>
          <span className="mono dim" style={{ fontSize: "0.62rem" }}>keep the annuity or exchange it · {H.note} · {T} yrs</span>
        </div>
      )}

      <div style={{ flex: 1, minHeight: 250, display: "flex", flexDirection: "column", gap: "0.8rem", justifyContent: "center" }}>
        {view === "h2h" && (<>
          <div style={{ display: "grid", gridTemplateColumns: "minmax(0,0.8fr) minmax(0,1.6fr)", gap: "1rem", alignItems: "center" }}>
            <div>
              <div className="mono dim" style={label}>how often the exchange wins</div>
              <div style={{ fontFamily: "var(--serif)", fontSize: "3rem", lineHeight: 1, color: win ? "var(--ok)" : "var(--bad)" }}>{(res.win * 100).toFixed(0)}%</div>
              <div className={`mono ${win ? "ok" : "bad"}`} style={{ fontSize: "0.68rem" }}>{k(res.median)} in the typical future</div>
            </div>
            <div>
              <svg viewBox="0 0 100 34" preserveAspectRatio="none" style={{ width: "100%", height: 74, display: "block" }} aria-label="How much the exchange gains or loses, across futures">
                {hist.c.map((n, i) => <rect key={i} x={(i / hist.c.length) * 100 + 0.15} width={100 / hist.c.length - 0.3} y={32 - (n / hist.max) * 30} height={(n / hist.max) * 30} fill={i + 0.5 >= hist.zero ? "var(--accent)" : "var(--ink-3)"} opacity={i + 0.5 >= hist.zero ? 0.9 : 0.5} />)}
                <line x1={(hist.zero / hist.c.length) * 100} x2={(hist.zero / hist.c.length) * 100} y1="0" y2="34" stroke="var(--ink)" strokeWidth="0.6" vectorEffect="non-scaling-stroke" />
              </svg>
              <div className="mono dim" style={{ display: "flex", justifyContent: "space-between", fontSize: "0.58rem" }}><span>loses</span><span>0</span><span>wins</span></div>
            </div>
          </div>
          <div style={{ display: "grid", gap: 6 }}>
            <div className="sl" style={{ ["--lw" as string]: "7.5rem", gridTemplateColumns: "7.5rem 1fr 3rem" }}><span>market return</span><input type="range" min={0.02} max={0.09} step={0.0025} value={mu} onChange={(e) => setMu(+e.target.value)} aria-label="Expected market return" /><span>{(mu * 100).toFixed(1)}%</span></div>
            <div className="sl" style={{ ["--lw" as string]: "7.5rem", gridTemplateColumns: "7.5rem 1fr 3rem" }}><span>surrender charge</span><input type="range" min={0} max={0.12} step={0.005} value={sur} onChange={(e) => setSur(+e.target.value)} aria-label="Surrender charge" /><span>{(sur * 100).toFixed(1)}%</span></div>
          </div>
          <div className="mono" style={{ fontSize: "0.66rem", color: "var(--ink-2)" }}>
            {flip.at !== null ? <>What would change the answer: above a market return of <b className="acc">{(flip.at * 100).toFixed(1)}%</b> the exchange stops winning.</> : flip.always ? "Holds at every market return from 2% to 10%." : "The exchange loses at every market return from 2% to 10%."}
          </div>
        </>)}

        {view === "why" && (<>
          <div className="mono dim" style={label}>value bridge · cause by cause, adding up to the difference</div>
          <svg viewBox="0 0 120 100" style={{ width: "100%", height: 170, display: "block" }} role="img" aria-label="Waterfall of the exchange's advantage by cause">
            <line x1="0" x2="120" y1={y(0)} y2={y(0)} stroke="var(--ink-3)" strokeWidth="0.4" strokeDasharray="1.5 1.5" />
            {res.bridge.map((b, i) => {
              const a0 = cum[i], a1 = cum[i + 1];
              return <g key={b.label}>
                <rect x={i * 19 + 3} width="14" y={Math.min(y(a0), y(a1))} height={Math.max(0.8, Math.abs(y(a0) - y(a1)))} rx="1" fill={b.value >= 0 ? "var(--ok)" : "var(--bad)"} style={{ transition: "all 0.5s var(--ease)" }} />
                <text x={i * 19 + 10} y={Math.min(y(a0), y(a1)) - 2} textAnchor="middle" fontSize="4.2" style={{ fill: b.value >= 0 ? "var(--ok)" : "var(--bad)" }}>{k(b.value)}</text>
              </g>;
            })}
            <rect x={5 * 19 + 3} width="14" y={Math.min(y(0), y(res.mean))} height={Math.max(0.8, Math.abs(y(0) - y(res.mean)))} rx="1" fill="var(--accent)" style={{ transition: "all 0.5s var(--ease)" }} />
            <text x={5 * 19 + 10} y={Math.min(y(0), y(res.mean)) - 2} textAnchor="middle" fontSize="4.2" fontWeight="700" style={{ fill: "var(--accent)" }}>{k(res.mean)}</text>
          </svg>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(6, 1fr)", gap: 4 }} className="mono">
            {[...res.bridge.map((b) => b.label), "= difference"].map((l, i) => <span key={l} style={{ fontSize: "0.58rem", textAlign: "center", color: i === 5 ? "var(--accent)" : "var(--ink-3)", lineHeight: 1.2 }}>{l}</span>)}
          </div>
        </>)}

        {view === "replay" && (
          <div style={{ border: "1px solid var(--rule)", borderRadius: 10, padding: "0.8rem 0.9rem", background: "var(--card)" }}>
            <div className="row" style={{ justifyContent: "space-between", marginBottom: 8 }}>
              <span className="mono dim" style={label}>best-interest file · every line chained to the last</span>
              <span className="row">
                <button className="sm" onClick={() => { const r = evaluate(H.guarantee, p); setMsg(`replay re-ran the stored seed: ${(r.win * 100).toFixed(1)}% and ${k(r.median)}, identical to the dollar ✓`); }}>replay</button>
                <button className={`sm ${tampered ? "on" : ""}`} onClick={() => { setTampered((t) => !t); setMsg(""); }}>{tampered ? "restore" : "tamper"}</button>
              </span>
            </div>
            {shown.map((l, i) => (
              <div key={i} className="mono" style={{ display: "grid", gridTemplateColumns: "1fr 4.8rem 1rem", gap: 8, fontSize: "0.64rem", lineHeight: 1.7, alignItems: "baseline" }}>
                <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", color: ok[i] ? "var(--ink-2)" : "var(--bad)" }}>{l}</span>
                <span className="dim">{file.hashes[i].slice(0, 8)}</span>
                <span className={ok[i] ? "ok" : "bad"}>{ok[i] ? "✓" : "✗"}</span>
              </div>
            ))}
            <div className="mono" style={{ fontSize: "0.66rem", marginTop: 8, minHeight: "1.4em", color: ok.every(Boolean) ? "var(--ink-2)" : "var(--bad)" }}>
              {!ok.every(Boolean) ? `record altered at line ${ok.indexOf(false) + 1}: every hash after it no longer matches` : msg || "change a number and the chain breaks; replay and it matches to the dollar"}
            </div>
          </div>
        )}

        {view === "monitor" && (<>
          <div className="sl" style={{ ["--lw" as string]: "7.5rem", gridTemplateColumns: "7.5rem 1fr 3rem" }}><span>the market falls</span><input type="range" min={0} max={0.4} step={0.05} value={fall} onChange={(e) => setFall(+e.target.value)} aria-label="Market fall" /><span>{Math.round(fall * 100)}%</span></div>
          <div className="mono dim" style={label}>who to call first · exchange win rate after the fall, fictional book</div>
          <div style={{ display: "grid", gap: 5 }}>
            {book.map(({ h, now, was }) => {
              const flipped = (was >= 0.5) !== (now >= 0.5);
              const tag = flipped ? "advice flips" : was - now > 0.15 ? "at risk" : "holds";
              return (
                <div key={h.id} className="mono" style={{ display: "grid", gridTemplateColumns: "6.6rem 1fr 2.4rem 5.2rem", gap: 8, alignItems: "center" }}>
                  <span style={{ fontSize: "0.66rem", color: "var(--ink)" }}>{h.name.replace("The ", "")}</span>
                  <div style={{ position: "relative", height: 8, background: "var(--bg-2)", borderRadius: 4 }}>
                    <div style={{ position: "absolute", inset: "0 auto 0 0", width: `${now * 100}%`, background: now >= 0.5 ? "var(--ok)" : "var(--bad)", borderRadius: 4, transition: "width 0.4s var(--ease)" }} />
                    <div style={{ position: "absolute", left: "50%", top: -2, bottom: -2, width: 1, background: "var(--ink-3)" }} />
                  </div>
                  <span style={{ fontSize: "0.64rem", textAlign: "right" }}>{(now * 100).toFixed(0)}%</span>
                  <span style={{ fontSize: "0.58rem", color: flipped ? "var(--bad)" : tag === "at risk" ? "var(--accent)" : "var(--ink-3)", textAlign: "right" }}>{tag}</span>
                </div>
              );
            })}
          </div>
        </>)}
      </div>
    </div>
  );
}
