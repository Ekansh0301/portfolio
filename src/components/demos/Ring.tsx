import { useMemo, useReducer, useRef, useState } from "react";
import { Cluster, N, fmtVC, hash, type VC } from "../../lib/kv";

const R0 = 92;
const at = (t: number, r: number) => [150 + r * Math.sin(t * 2 * Math.PI), 130 - r * Math.cos(t * 2 * Math.PI)];

/** Run the real cluster model from lib/kv.ts. Two clients, one on each side of a partition. */
export default function Ring() {
  const cl = useRef<Cluster>(null as unknown as Cluster);
  if (!cl.current) cl.current = new Cluster();
  const c = cl.current;
  const [, bump] = useReducer((x: number) => x + 1, 0);
  const ctx = useRef<Record<string, VC>>({});

  // Default to a key whose replicas straddle the partition, so the conflict demo works.
  const startKey = useMemo(() => {
    const probe = new Cluster();
    return ["cart", "profile", "session", "feed", "order", "cfg"].find((k) => {
      const s = new Set(probe.pref(k).map(probe.side));
      return s.size === 2;
    }) ?? "cart";
  }, []);
  const [client, setClient] = useState(0);
  const [key, setKey] = useState(startKey);
  const [val, setVal] = useState("milk");
  const [W, setW] = useState(2);
  const [R, setR] = useState(2);

  const pref = c.pref(key);
  const k = (n = 0) => `${client}|${key}${n}`;
  const act = (f: () => void) => { f(); bump(); };

  const put = () => act(() => {
    const r = c.put(client, key, val, ctx.current[k()] ?? {}, W);
    ctx.current[k()] = r.vc;
  });
  const get = () => act(() => {
    const r = c.get(client, key, R);
    if (r.ok) ctx.current[k()] = r.ctx;
  });
  const toggle = (id: number) => act(() => {
    c.nodes[id].alive = !c.nodes[id].alive;
    c.say(`n${id} ${c.nodes[id].alive ? "recovered" : "crashed"}`);
    c.handoff();
  });
  const part = () => act(() => {
    c.partitioned = !c.partitioned;
    c.say(c.partitioned ? "network partitioned: east {0-3} | west {4-7}" : "partition healed");
    c.handoff();
  });

  const kp = at(hash(key), R0);
  const rows = c.nodes.flatMap((n) => {
    const out: { id: number; text: string; kind: "own" | "hint" }[] = [];
    if (pref.includes(n.id)) out.push({ id: n.id, kind: "own", text: (n.store.get(key) ?? []).map((v) => `"${v.value}" ${fmtVC(v.vc)}`).join("  |  ") || "—" });
    n.hints.filter((h) => h.key === key).forEach((h) => out.push({ id: n.id, kind: "hint", text: `hint for n${h.target}: "${h.v.value}"` }));
    return out;
  });

  return (
    <div className="stage">
      <div className="stage-h">
        <span className="mono">N={N} · real vector clocks · click a node to crash it</span>
        <div className="tabs">
          {[0, 1].map((i) => <button key={i} className={`sm ${client === i ? "on" : ""}`} onClick={() => setClient(i)}>client {i ? "B · west" : "A · east"}</button>)}
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "minmax(0,1fr) minmax(0,1fr)", gap: "0.8rem", alignItems: "center" }}>
        <svg viewBox="0 0 300 260" role="img" aria-label="Hash ring of eight nodes">
          <circle cx="150" cy="130" r={R0} fill="none" stroke="var(--rule)" strokeWidth="2" />
          {c.partitioned && <line x1="150" y1="14" x2="150" y2="246" stroke="var(--bad)" strokeDasharray="4 4" strokeWidth="1.5" />}
          <circle cx={kp[0]} cy={kp[1]} r="5" fill="var(--accent)" />
          <text x={kp[0]} y={kp[1] + (kp[1] < 130 ? -9 : 16)} textAnchor="middle" fontSize="9" style={{ fill: "var(--accent)" }}>{key}</text>
          {c.nodes.map((n) => {
            const [x, y] = at(n.pos, R0);
            const p = pref.indexOf(n.id);
            const reachable = c.reach(client, n.id);
            return (
              <g key={n.id} role="button" tabIndex={0} aria-label={`node ${n.id} ${n.alive ? "up" : "down"}`} style={{ cursor: "pointer", outline: "none" }}
                onClick={() => toggle(n.id)} onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && (e.preventDefault(), toggle(n.id))}>
                <circle cx={x} cy={y} r="15" fill={p >= 0 && n.alive ? "var(--accent)" : "var(--card)"} stroke={!n.alive ? "var(--bad)" : reachable ? "var(--ink-2)" : "var(--ink-3)"} strokeWidth="2" strokeDasharray={!n.alive ? "3 3" : "0"} opacity={reachable || !n.alive ? 1 : 0.4} />
                <text x={x} y={y + 3.5} textAnchor="middle" fontSize="10" style={{ fill: p >= 0 && n.alive ? "var(--accent-ink)" : !n.alive ? "var(--bad)" : "var(--ink)" }}>{n.alive ? n.id : "×"}</text>
                <text x={x + (x > 150 ? 22 : -22)} y={y + 3} textAnchor="middle" fontSize="7.5" style={{ fill: "var(--ink-3)" }}>{c.digest(n.id)}</text>
              </g>
            );
          })}
          <text x="150" y="128" textAnchor="middle" fontSize="9">{pref.map((i) => "n" + i).join(" → ")}</text>
          <text x="150" y="141" textAnchor="middle" fontSize="8" style={{ fill: "var(--ink-3)" }}>preference list</text>
        </svg>

        <div style={{ display: "grid", gap: "0.45rem" }}>
          <div className="row">
            <input className="field" style={{ width: "5.2rem" }} value={key} onChange={(e) => setKey(e.target.value || "cart")} aria-label="Key" />
            <span className="dim mono">=</span>
            <input className="field" style={{ width: "5.2rem" }} value={val} onChange={(e) => setVal(e.target.value)} aria-label="Value" />
          </div>
          <div className="sl" style={{ ["--lw" as string]: "1.6rem" }}><span>W</span><input type="range" min={1} max={N} value={W} onChange={(e) => setW(+e.target.value)} aria-label="Write quorum" /><span>{W}</span></div>
          <div className="sl" style={{ ["--lw" as string]: "1.6rem" }}><span>R</span><input type="range" min={1} max={N} value={R} onChange={(e) => setR(+e.target.value)} aria-label="Read quorum" /><span>{R}</span></div>
          <div className="mono dim" style={{ fontSize: "0.62rem" }}>R+W {R + W > N ? ">" : "≤"} N: {R + W > N ? "reads overlap writes" : "stale reads possible"}</div>
          <div className="row">
            <button className="sm on" onClick={put}>put</button>
            <button className="sm" onClick={get}>get</button>
            <button className={`sm ${c.partitioned ? "on" : ""}`} onClick={part}>{c.partitioned ? "heal" : "partition"}</button>
            <button className="sm" onClick={() => act(() => { c.antiEntropy(); })}>anti-entropy</button>
          </div>
        </div>
      </div>

      <div className="out" style={{ minHeight: "2.6em" }}>
        {rows.map((r, i) => (
          <div key={i} style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            <span className={r.kind === "hint" ? "acc" : c.nodes[r.id].alive ? "" : "bad"}>n{r.id}{!c.nodes[r.id].alive && " ×"}</span> <span className="dim">{r.text}</span>
          </div>
        ))}
      </div>
      <div className="log" aria-live="polite">
        {c.log.length === 0 ? <div className="dim">Try: partition → put from A → switch to client B → put another value → heal → get. Two siblings appear.</div> : c.log.slice(-4).map((l, i) => <div key={i}>{l}</div>)}
      </div>
    </div>
  );
}
