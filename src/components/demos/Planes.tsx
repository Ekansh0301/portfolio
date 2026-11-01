import { useEffect, useRef, useState } from "react";

/**
 * The naming server's two hot structures, simulated: a path trie (a miss costs
 * one hop per path component) in front of an LRU cache (a hit costs none),
 * then a direct stream from whichever storage node holds the file.
 */
const FILES = ["/docs/paper.pdf", "/docs/notes.txt", "/docs/cv.pdf", "/src/main.c", "/src/nm.c", "/src/ss.c", "/img/a.png", "/img/b.png", "/log/0.log", "/log/1.log", "/etc/cfg", "/etc/hosts"];
const DIRS = ["docs", "src", "img", "log", "etc"];
const owner = (p: string) => [...p].reduce((h, ch) => (h * 31 + ch.charCodeAt(0)) >>> 0, 7) % 3;

export default function Planes() {
  const [cap, setCap] = useState(4);
  const [cache, setCache] = useState<string[]>([]);
  const [hot, setHot] = useState(true);
  const [auto, setAuto] = useState(false);
  const [down, setDown] = useState<number | null>(null);
  const [stat, setStat] = useState({ hit: 0, miss: 0, hops: 0 });
  const [last, setLast] = useState<{ p: string; hit: boolean; ss: number; via: string; evicted?: string } | null>(null);
  const st = useRef({ cache, cap, down, hot });
  st.current = { cache, cap, down, hot };

  const request = (p: string) => {
    const { cache: C, cap: K, down: D } = st.current;
    const hit = C.includes(p);
    const depth = p.split("/").filter(Boolean).length;
    let next = C.filter((x) => x !== p);
    next = [p, ...next];
    let evicted: string | undefined;
    if (next.length > K) {
      evicted = next[next.length - 1];
      next = next.slice(0, K);
    }
    let ss = owner(p), via = `SS${ss + 1}`;
    if (ss === D) { ss = (ss + 1) % 3; via = `replica SS${ss + 1} (SS${D! + 1} is down)`; }
    setCache(next);
    setStat((s) => ({ hit: s.hit + (hit ? 1 : 0), miss: s.miss + (hit ? 0 : 1), hops: s.hops + (hit ? 0 : depth + 1) }));
    setLast({ p, hit, ss, via, evicted });
  };

  useEffect(() => {
    if (!auto) return;
    const id = window.setInterval(() => {
      const idx = st.current.hot
        ? Math.min(FILES.length - 1, Math.floor(-Math.log(1 - Math.random() * 0.97) * 2.2))   // skewed: a few files get most traffic
        : Math.floor(Math.random() * FILES.length);
      request(FILES[idx]);
    }, 380);
    return () => clearInterval(id);
  }, [auto]);

  const reset = () => { setCache([]); setStat({ hit: 0, miss: 0, hops: 0 }); setLast(null); };
  const total = stat.hit + stat.miss;
  const visited = last && !last.hit ? new Set([last.p, "/" + last.p.split("/")[1]]) : new Set<string>();

  return (
    <div className="stage">
      <div className="stage-h">
        <span className="mono">naming server · trie + LRU · {total} requests</span>
        <div className="row">
          <button className={`sm ${auto ? "on" : ""}`} onClick={() => setAuto((a) => !a)}>{auto ? "stop" : "stream traffic"}</button>
          <button className="sm" onClick={reset}>reset</button>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "minmax(0,1.5fr) minmax(0,1fr)", gap: "0.8rem" }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0,1fr))", gap: "0.35rem 0.6rem", alignContent: "start" }}>
          {DIRS.map((d) => (
            <div key={d}>
              <div className="mono" style={{ color: visited.has("/" + d) ? "var(--accent)" : "var(--ink-3)", fontSize: "0.62rem" }}>/{d}</div>
              {FILES.filter((f) => f.startsWith(`/${d}/`)).map((f) => (
                <button key={f} onClick={() => request(f)} className="mono" style={{ display: "block", background: "none", border: 0, padding: "1px 0 1px 0.7rem", fontSize: "0.62rem", textAlign: "left", color: visited.has(f) ? "var(--accent)" : cache.includes(f) ? "var(--ok)" : "var(--ink-2)", fontWeight: cache.includes(f) ? 600 : 400, cursor: "pointer" }}>
                  {f.split("/")[2]}{cache.includes(f) ? " ●" : ""}
                </button>
              ))}
            </div>
          ))}
        </div>
        <div>
          <div className="mono dim" style={{ fontSize: "0.6rem", marginBottom: 3 }}>LRU cache · MRU first</div>
          <div style={{ display: "grid", gap: 2 }}>
            {Array.from({ length: cap }, (_, i) => (
              <div key={i} className="mono" style={{ padding: "0.2rem 0.45rem", border: "1px solid var(--rule)", borderRadius: 4, fontSize: "0.62rem", background: cache[i] ? "color-mix(in srgb, var(--ok) 10%, transparent)" : "transparent", color: cache[i] ? "var(--ink)" : "var(--ink-3)", minHeight: "1.5em" }}>{cache[i] ?? "·"}</div>
            ))}
          </div>
        </div>
      </div>

      <div className="row">
        <div className="sl" style={{ flex: 1, ["--lw" as string]: "3.6rem", gridTemplateColumns: "3.6rem 1fr 1.6rem", minWidth: 150 }}>
          <span>cache</span><input type="range" min={1} max={8} value={cap} onChange={(e) => { setCap(+e.target.value); setCache((c) => c.slice(0, +e.target.value)); }} aria-label="Cache capacity" /><span>{cap}</span>
        </div>
        <button className={`sm ${hot ? "on" : ""}`} onClick={() => setHot(true)}>hot files</button>
        <button className={`sm ${!hot ? "on" : ""}`} onClick={() => setHot(false)}>uniform</button>
        <button className={`sm ${down !== null ? "on" : ""}`} onClick={() => setDown((d) => (d === null ? 0 : null))}>{down !== null ? "revive SS1" : "crash SS1"}</button>
      </div>

      <div className="log">
        {last ? <>
          <div>{last.p}: <span className={last.hit ? "ok" : "acc"}>{last.hit ? "cache hit, 0 hops" : `miss, trie walk ${last.p.split("/").filter(Boolean).length + 1} hops`}</span>{last.evicted && <span className="dim"> · evicted {last.evicted}</span>}</div>
          <div>naming server steps aside → client streams from <span className="acc">{last.via}</span></div>
        </> : <div className="dim">Click files, or stream traffic and slide the cache size. The hit rate is the whole point of the cache.</div>}
      </div>
      <div className="mono" style={{ display: "flex", justifyContent: "space-between" }}>
        <span>hit rate <span className="acc">{total ? Math.round((stat.hit / total) * 100) : 0}%</span></span>
        <span className="dim">{stat.hops} metadata hops spent · {stat.hit * 3} avoided</span>
      </div>
    </div>
  );
}
