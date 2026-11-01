import { useEffect, useReducer, useRef, useState } from "react";
import { Cluster, N, hash, type VC } from "../../lib/kv";

const R_Q = 2, W_Q = 3; // QuorumKV's default N=4, R=2, W=3
const KEYS = ["cart:7", "user:42", "feed:ekansh", "order:1180", "session:ab91", "cfg:prod", "profile:3", "chat:9"];
const CX = 180, CY = 138, RAD = 104;
const at = (t: number, r = RAD) => [CX + r * Math.sin(t * 2 * Math.PI), CY - r * Math.cos(t * 2 * Math.PI)];

type Flash = { id: number; key: string; op: "PUT" | "GET"; ok: boolean; reps: number[]; hints: { holder: number; target: number }[]; line: string };

/**
 * The real cluster model (src/lib/kv.ts) under steady traffic. Crash nodes and
 * watch the system keep answering: hinted handoff covers writes, quorums cover reads.
 */
export default function Ring() {
  const cl = useRef<Cluster>(null as unknown as Cluster);
  if (!cl.current) cl.current = new Cluster();
  const c = cl.current;
  const [, bump] = useReducer((x: number) => x + 1, 0);
  const ctx = useRef<Record<string, VC>>({});
  const n = useRef(0);
  const stats = useRef({ w: 0, wOk: 0, r: 0, rOk: 0 });
  const [flash, setFlash] = useState<Flash | null>(null);

  useEffect(() => {
    const id = window.setInterval(() => {
      const i = n.current++;
      const key = KEYS[i % KEYS.length];
      const st = stats.current;
      if (i % 3 !== 2) {
        const r = c.put(0, key, `v${i}`, ctx.current[key] ?? {}, W_Q);
        ctx.current[key] = r.vc;
        st.w++; if (r.ok) st.wOk++;
        const live = r.pref.filter((p) => c.nodes[p].alive);
        setFlash({ id: i, key, op: "PUT", ok: r.ok, reps: live, hints: r.stand, line: `PUT ${key} → ${live.map((p) => "n" + p).join(" ")}${r.stand.length ? ` + hint on ${r.stand.map((s) => "n" + s.holder).join(", ")}` : ""} · ${r.acks} acks (W=${W_Q})` });
      } else {
        const r = c.get(0, key, R_Q);
        st.r++; if (r.ok) st.rOk++;
        if (r.ok) ctx.current[key] = r.ctx;
        setFlash({ id: i, key, op: "GET", ok: r.ok, reps: r.used, hints: [], line: `GET ${key} ← ${r.used.map((p) => "n" + p).join(" ") || "nobody"} · ${r.ok ? "served" : `need R=${R_Q}, too few replicas`}` });
      }
      c.handoff();
      bump();
    }, 1100);
    return () => clearInterval(id);
  }, [c]);

  const toggle = (id: number) => { c.nodes[id].alive = !c.nodes[id].alive; c.handoff(); bump(); };
  const down = c.nodes.filter((x) => !x.alive).length;
  const st = stats.current;
  const kp = flash ? at(hash(flash.key)) : null;

  return (
    <div className="stage">
      <div className="stage-h">
        <span className="mono">8 nodes · N={N} · W={W_Q} · R={R_Q} · live traffic</span>
        {down > 0 && <button className="sm" onClick={() => { c.nodes.forEach((x) => (x.alive = true)); c.handoff(); bump(); }}>revive all</button>}
      </div>
      <svg viewBox="0 0 360 276" role="img" aria-label="Consistent hash ring carrying live requests" style={{ maxHeight: 300 }}>
        <circle cx={CX} cy={CY} r={RAD} fill="none" stroke="var(--rule)" strokeWidth="2" />
        {flash && kp && (
          <g key={flash.id} style={{ animation: "fadeOut 1s ease-out forwards" }}>
            {flash.reps.map((p) => { const [x, y] = at(c.nodes[p].pos); return <line key={p} x1={kp[0]} y1={kp[1]} x2={x} y2={y} stroke="var(--accent)" strokeWidth="2" />; })}
            {flash.hints.map((h) => { const [x, y] = at(c.nodes[h.holder].pos); return <line key={h.holder + "-" + h.target} x1={kp[0]} y1={kp[1]} x2={x} y2={y} stroke="var(--accent)" strokeWidth="2" strokeDasharray="4 4" />; })}
            <circle cx={kp[0]} cy={kp[1]} r="6" fill="var(--accent)" />
          </g>
        )}
        {c.nodes.map((nd) => {
          const [x, y] = at(nd.pos);
          const hot = flash?.reps.includes(nd.id) || flash?.hints.some((h) => h.holder === nd.id);
          return (
            <g key={nd.id} role="button" tabIndex={0} aria-label={`Node ${nd.id}: ${nd.alive ? "up, click to crash" : "down, click to revive"}`} style={{ cursor: "pointer", outline: "none" }}
              onClick={() => toggle(nd.id)} onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && (e.preventDefault(), toggle(nd.id))}>
              <circle cx={x} cy={y} r="17" fill={nd.alive ? (hot ? "color-mix(in srgb, var(--accent) 22%, var(--card))" : "var(--card)") : "var(--bg-2)"} stroke={nd.alive ? (hot ? "var(--accent)" : "var(--ink-3)") : "var(--bad)"} strokeWidth="2" strokeDasharray={nd.alive ? "0" : "3 3"} style={{ transition: "all 0.3s" }} />
              <text x={x} y={y + 4} textAnchor="middle" fontSize="11" style={{ fill: nd.alive ? "var(--ink)" : "var(--bad)" }}>{nd.alive ? nd.id : "×"}</text>
              {nd.hints.length > 0 && <text x={x} y={y + 31} textAnchor="middle" fontSize="8" style={{ fill: "var(--accent)" }}>{nd.hints.length} hint{nd.hints.length > 1 ? "s" : ""}</text>}
            </g>
          );
        })}
        <text x={CX} y={CY - 4} textAnchor="middle" fontSize="12" style={{ fill: "var(--ink)" }}>{down === 0 ? "all nodes up" : `${down} node${down > 1 ? "s" : ""} down`}</text>
        <text x={CX} y={CY + 14} textAnchor="middle" fontSize="9" style={{ fill: "var(--ink-3)" }}>click a node to crash it</text>
      </svg>
      <div className="mono" style={{ display: "flex", justifyContent: "space-around", gap: "1rem" }}>
        <span>writes <b className={st.wOk === st.w ? "ok" : "bad"}>{st.wOk}/{st.w}</b> acked</span>
        <span>reads <b className={st.rOk === st.r ? "ok" : "bad"}>{st.rOk}/{st.r}</b> served</span>
      </div>
      <div className="log" style={{ minHeight: "2.4em" }} aria-live="off">{flash ? flash.line : "Waiting for the first request…"}</div>
    </div>
  );
}
