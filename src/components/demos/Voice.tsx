import { useMemo, useState } from "react";

/**
 * Two things Vox lives or dies by: routing speech to a safe tool call, and
 * fitting the whole stack in 4 GB of VRAM. Both are computed below. The router
 * and sandbox rules are real code; model sizes and speeds are approximate
 * planning numbers, not benchmarks.
 */
const ALLOW: Record<string, string> = {
  ls: "notes.txt  todo.md  vox_sandbox/", pwd: "/home/you/vox_sandbox", date: new Date().toDateString(),
  whoami: "you", uptime: "up 3:12, load 0.42", df: "/dev/nvme0n1  412G used 188G", free: "mem 16Gi used 6.1Gi",
};
const DENY = /(\brm\b|\bsudo\b|\bdd\b|mkfs|chmod|curl|wget|\|\s*sh|[;&|><`$])/;

type Call = { tool: string; args: Record<string, string>; result: string; blocked?: boolean };

function route(text: string): Call {
  const t = text.trim();
  let m: RegExpMatchArray | null;
  if ((m = t.match(/^open\s+(.+)/i))) return { tool: "open_app", args: { name: m[1] }, result: `launched “${m[1]}”` };
  if ((m = t.match(/^(?:run|execute)\s+(.+)/i))) {
    const cmd = m[1];
    const bin = cmd.split(/\s+/)[0];
    if (DENY.test(cmd) || !(bin in ALLOW)) return { tool: "run_shell", args: { cmd }, result: `blocked by sandbox: “${bin}” is not on the allowlist`, blocked: true };
    return { tool: "run_shell", args: { cmd }, result: ALLOW[bin] };
  }
  if ((m = t.match(/^(?:write|create|save)\s+(?:a\s+)?(?:file\s+)?(?:called\s+|named\s+)?(\S+)/i))) {
    const p = m[1];
    if (p.includes("/") || p.includes("..")) return { tool: "write_file", args: { path: p }, result: "blocked: writes are confined to vox_sandbox/", blocked: true };
    return { tool: "write_file", args: { path: `vox_sandbox/${p}` }, result: `wrote vox_sandbox/${p}` };
  }
  if (/screen/i.test(t)) return { tool: "read_screen", args: {}, result: "OCR captured 14 lines of text" };
  return { tool: "chat", args: {}, result: "answered from the local model, no tool needed" };
}

const WHISPER = [{ n: "tiny", gb: 1.0, s: 0.3 }, { n: "base", gb: 1.0, s: 0.5 }, { n: "small", gb: 2.0, s: 1.1 }];
const LLM = [{ n: "1.5B", gb: 1.2, tps: 55, kv: 0.05 }, { n: "3B", gb: 2.1, tps: 32, kv: 0.09 }, { n: "7B", gb: 4.6, tps: 14, kv: 0.24 }];
const EXAMPLES = ["open firefox", "run uptime", "run rm -rf ~", "write a file called todo.md", "write ../../etc/passwd", "what is on my screen", "tell me a joke"];

export default function Voice() {
  const [cmd, setCmd] = useState("run uptime");
  const [last, setLast] = useState<Call | null>(() => route("run uptime"));
  const [w, setW] = useState(0);
  const [l, setL] = useState(1);
  const [ctx, setCtx] = useState(4);

  const vram = useMemo(() => {
    const total = WHISPER[w].gb + LLM[l].gb + LLM[l].kv * ctx;
    return { total, fits: total <= 4 };
  }, [w, l, ctx]);
  const llmSpeed = LLM[l].tps / (vram.fits ? 1 : 5);
  const tokens = last?.tool === "chat" ? 40 : 28;
  const stages = [["whisper", WHISPER[w].s], ["llm", tokens / llmSpeed], ["tool", last?.blocked ? 0.01 : 0.15], ["piper", 0.45]] as const;
  const totalT = stages.reduce((s, x) => s + x[1], 0);

  const run = (c = cmd) => { setCmd(c); setLast(route(c)); };

  return (
    <div className="stage">
      <div className="stage-h"><span className="mono">type what you'd say · the router decides what runs</span></div>
      <div className="row">
        <input className="field" style={{ flex: 1 }} value={cmd} onChange={(e) => setCmd(e.target.value)} onKeyDown={(e) => e.key === "Enter" && run()} aria-label="Spoken command" />
        <button className="sm on" onClick={() => run()}>send</button>
      </div>
      <div className="row">{EXAMPLES.map((e) => <button key={e} className="sm" onClick={() => run(e)}>{e}</button>)}</div>
      {last && (
        <div className="term" style={{ background: "var(--card)", color: "var(--ink-2)", border: "1px solid var(--rule)", minHeight: 0, padding: "0.55rem 0.7rem", fontSize: "0.68rem" }}>
          <div><span className="dim">intent </span><span className="acc">{last.tool}</span>({Object.entries(last.args).map(([k, v]) => `${k}="${v}"`).join(", ")})</div>
          <div><span className="dim">result </span><span className={last.blocked ? "bad" : "ok"}>{last.result}</span></div>
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "0.4rem" }}>
        {[["whisper", WHISPER.map((x) => x.n), w, setW], ["LLM (Q4)", LLM.map((x) => x.n), l, setL]].map(([label, opts, v, set]) => (
          <div key={label as string}>
            <div className="mono dim" style={{ fontSize: "0.6rem", marginBottom: 2 }}>{label as string}</div>
            <div className="row" style={{ gap: "0.2rem" }}>{(opts as string[]).map((o, i) => <button key={o} className={`sm ${v === i ? "on" : ""}`} style={{ padding: "0.25rem 0.45rem" }} onClick={() => (set as (n: number) => void)(i)}>{o}</button>)}</div>
          </div>
        ))}
        <div>
          <div className="mono dim" style={{ fontSize: "0.6rem", marginBottom: 2 }}>context {ctx}k</div>
          <input type="range" min={1} max={16} value={ctx} onChange={(e) => setCtx(+e.target.value)} aria-label="Context length in thousands of tokens" />
        </div>
      </div>

      <div>
        <div style={{ position: "relative", height: 14, background: "var(--bg-2)", borderRadius: 4, overflow: "hidden" }}>
          <div style={{ position: "absolute", inset: "0 auto 0 0", width: `${Math.min(100, (WHISPER[w].gb / 6) * 100)}%`, background: "var(--ink-3)" }} />
          <div style={{ position: "absolute", inset: "0 auto 0 0", marginLeft: `${(WHISPER[w].gb / 6) * 100}%`, width: `${((LLM[l].gb + LLM[l].kv * ctx) / 6) * 100}%`, maxWidth: `${100 - (WHISPER[w].gb / 6) * 100}%`, background: vram.fits ? "var(--accent)" : "var(--bad)" }} />
          <div style={{ position: "absolute", top: 0, bottom: 0, left: `${(4 / 6) * 100}%`, width: 2, background: "var(--ink)" }} />
        </div>
        <div className="mono" style={{ display: "flex", justifyContent: "space-between", marginTop: 3 }}>
          <span className={vram.fits ? "ok" : "bad"}>{vram.total.toFixed(1)} GB of 4 GB · {vram.fits ? "fits" : "spills to CPU, ~5× slower"}</span>
          <span className="dim">≈ {totalT.toFixed(1)}s end to end</span>
        </div>
      </div>
    </div>
  );
}
