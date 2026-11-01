import { useMemo, useState } from "react";

const NODES = 8;
const N = 3; // replication factor
const KEYS = ["user:42", "cart:7", "session:ab91", "feed:ekansh", "order:1180", "cfg:prod"];

/** FNV-1a folded to [0,1): a stand-in for the 128-bit ring hash. */
function hash(s: string) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
  return (h >>> 0) / 2 ** 32;
}

const pt = (t: number, r: number) => [200 + r * Math.sin(t * 2 * Math.PI), 150 - r * Math.cos(t * 2 * Math.PI)];

export default function Ring() {
  const pos = useMemo(() => Array.from({ length: NODES }, (_, i) => (i + hash(`node-${i}`) * 0.5) / NODES), []);
  const order = useMemo(() => [...pos.keys()].sort((a, b) => pos[a] - pos[b]), [pos]);
  const [dead, setDead] = useState<Set<number>>(new Set());
  const [W, setW] = useState(2);
  const [key, setKey] = useState<string | null>(null);

  const flip = (i: number) =>
    setDead((d) => {
      const n = new Set(d);
      if (n.has(i)) n.delete(i);
      else n.add(i);
      return n;
    });

  // Walk clockwise from the key: the first N nodes are the preference list;
  // a dead one is covered by the next live node (hinted handoff).
  let primaries: number[] = [];
  let writers: number[] = [];
  let hinted: number[] = [];
  if (key) {
    const k = hash(key);
    const start = order.findIndex((n) => pos[n] >= k);
    const walk = Array.from({ length: NODES }, (_, j) => order[((start < 0 ? 0 : start) + j) % NODES]);
    primaries = walk.slice(0, N);
    const liveWalk = walk.filter((n) => !dead.has(n));
    writers = liveWalk.slice(0, N);
    hinted = writers.filter((n) => !primaries.includes(n));
  }
  const ok = key ? writers.length >= W : null;

  return (
    <>
      <svg viewBox="0 0 400 300" role="img" aria-label="Consistent hash ring with eight nodes">
        <circle cx="200" cy="150" r="105" fill="none" stroke="var(--rule)" strokeWidth="2" />
        {key && (() => {
          const [x, y] = pt(hash(key), 105);
          return <g><circle cx={x} cy={y} r="6" fill="var(--accent)" /><text x={x} y={y < 150 ? y - 12 : y + 20} textAnchor="middle" fontSize="11" style={{ fill: "var(--accent)" }}>{key}</text></g>;
        })()}
        {pos.map((t, i) => {
          const [x, y] = pt(t, 105);
          const isDead = dead.has(i);
          const w = writers.includes(i);
          return (
            <g key={i} role="button" tabIndex={0} aria-label={`Node ${i} ${isDead ? "down" : "up"}`} style={{ cursor: "pointer", outline: "none" }}
              onClick={() => flip(i)} onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && (e.preventDefault(), flip(i))}>
              <circle cx={x} cy={y} r="17" fill={isDead ? "var(--bg-2)" : w ? "var(--accent)" : "var(--card)"} stroke={isDead ? "var(--bad)" : w ? "var(--accent)" : "var(--ink-3)"} strokeWidth="2" strokeDasharray={isDead ? "3 3" : "0"} />
              <text x={x} y={y + 4} textAnchor="middle" fontSize="12" style={{ fill: w ? "var(--accent-ink)" : isDead ? "var(--bad)" : "var(--ink)" }}>{isDead ? "×" : i}</text>
              {hinted.includes(i) && <text x={x} y={y + 32} textAnchor="middle" fontSize="9" style={{ fill: "var(--accent)" }}>hint</text>}
            </g>
          );
        })}
        <text x="200" y="146" textAnchor="middle" fontSize="11">N={N} · W={W}</text>
        <text x="200" y="162" textAnchor="middle" fontSize="10" style={{ fill: "var(--ink-3)" }}>click a node to kill it</text>
      </svg>
      <div className="row-c">
        {KEYS.slice(0, 3).map((k) => <button key={k} className={`sm ${key === k ? "on" : ""}`} onClick={() => setKey(k)}>write {k}</button>)}
        <button className="sm" onClick={() => setKey(KEYS[Math.floor(Math.random() * KEYS.length)] + "#" + Math.floor(Math.random() * 99))}>random key</button>
      </div>
      <div className="slider"><span>W</span><input type="range" min={1} max={3} value={W} onChange={(e) => setW(+e.target.value)} aria-label="Write quorum W" /><span>{W}</span></div>
      <div className="readout">
        {!key ? "Pick a key. It hashes onto the ring and lands on the next 3 nodes clockwise." : ok ? (
          <><span className="ok">Write acknowledged</span>: {writers.length} live replicas, needed {W}.{hinted.length > 0 && <> A downed primary was covered by a stand-in that holds a <span className="acc">hinted handoff</span> and replays it on recovery.</>}</>
        ) : (
          <><span className="bad">Write refused</span>: only {writers.length} live replicas, needed {W}. Lower W to stay available, at the cost of weaker consistency.</>
        )}
      </div>
    </>
  );
}
