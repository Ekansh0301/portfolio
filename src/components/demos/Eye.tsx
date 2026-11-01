import { useCallback, useEffect, useRef, useState } from "react";

/**
 * The anaemia app's flow on a real photograph of the lower lid pulled down, the
 * red palpebral conjunctiva below the eye (credit in the page footer). Capture
 * in the guide box, quality gate (Laplacian sharpness and a brightness
 * histogram, computed on the pixels), segmentation of the conjunctiva,
 * haemoglobin, WHO severity, and a history across visits. Simulated, and said
 * so in the README: I have no clinical photo of a pale conjunctiva, so visits
 * 1 and 2 grade the conjunctiva pixels of this photo towards pale. The mask is
 * a colour threshold on the real pixels (a stand-in for UNet++), and the Hb
 * mapping is a toy calibration.
 */
const W = 360, H = 251, BLUR_MIN = 100, LUM: [number, number] = [70, 215], BINS = 32;
const PALE = [246, 232, 228];
const VISITS = [
  { label: "Visit 1", date: "Jan", k: 0.8, bad: { blur: 4, light: 1 } },
  { label: "Visit 2", date: "Feb", k: 0.45, bad: null },
  { label: "Visit 3", date: "Mar", k: 0, bad: null },
];
const RATIO0 = 0.8522; // mean green/red under the mask in the untouched photo

type Assets = { base: ImageData; mask: Uint8Array; soft: Uint8ClampedArray; cover: number };
function load(src: string) { return new Promise<HTMLImageElement>((ok, no) => { const i = new Image(); i.onload = () => ok(i); i.onerror = no; i.src = src; }); }

async function loadAssets(): Promise<Assets> {
  const [img, m] = await Promise.all([load("/images/eye-lid.jpg"), load("/images/eye-lid-mask.png")]);
  const c = document.createElement("canvas"); c.width = W; c.height = H;
  const x = c.getContext("2d", { willReadFrequently: true })!;
  x.drawImage(img, 0, 0, W, H);
  const base = x.getImageData(0, 0, W, H);
  x.clearRect(0, 0, W, H); x.filter = "blur(1.4px)"; x.drawImage(m, 0, 0, W, H); x.filter = "none";
  const soft = new Uint8ClampedArray(W * H);
  const sd = x.getImageData(0, 0, W, H).data;
  for (let i = 0; i < W * H; i++) soft[i] = sd[i * 4];
  x.clearRect(0, 0, W, H); x.drawImage(m, 0, 0, W, H);
  const hd = x.getImageData(0, 0, W, H).data, mask = new Uint8Array(W * H);
  let n = 0;
  for (let i = 0; i < W * H; i++) { mask[i] = hd[i * 4] > 128 ? 1 : 0; n += mask[i]; }
  return { base, mask, soft, cover: n / (W * H) };
}

/** Grade the conjunctiva pixels towards pale; everything else is the untouched photograph. */
function graded(a: Assets, k: number) {
  const out = new ImageData(new Uint8ClampedArray(a.base.data), W, H), d = out.data;
  if (k === 0) return out;
  for (let i = 0; i < W * H; i++) {
    const w = (a.soft[i] / 255) * k;
    if (w <= 0) continue;
    for (let c = 0; c < 3; c++) d[i * 4 + c] = d[i * 4 + c] * (1 - w) + PALE[c] * w;
  }
  return out;
}

function analyse(img: ImageData, mask: Uint8Array) {
  const { data } = img;
  const lum = new Float32Array(W * H), hist = new Array(BINS).fill(0);
  let sum = 0;
  for (let i = 0; i < W * H; i++) {
    lum[i] = 0.299 * data[i * 4] + 0.587 * data[i * 4 + 1] + 0.114 * data[i * 4 + 2];
    sum += lum[i];
    hist[Math.min(BINS - 1, Math.floor((lum[i] / 256) * BINS))]++;
  }
  const meanL = sum / (W * H);
  let s = 0, s2 = 0, n = 0; // variance of the Laplacian: the standard cheap sharpness score
  for (let y = 1; y < H - 1; y++) for (let x = 1; x < W - 1; x++) {
    const i = y * W + x, v = lum[i - 1] + lum[i + 1] + lum[i - W] + lum[i + W] - 4 * lum[i];
    s += v; s2 += v * v; n++;
  }
  const sharp = s2 / n - (s / n) ** 2;
  let cnt = 0, rs = 0;
  for (let i = 0; i < W * H; i++) if (mask[i]) { cnt++; rs += data[i * 4 + 1] / Math.max(data[i * 4], 1); }
  const ratio = cnt ? rs / cnt : null;
  const hb = ratio === null ? null : Math.max(4, Math.min(15.5, 12.9 - 93.5 * (ratio - RATIO0)));
  return { sharp, meanL, hist, pass: sharp >= BLUR_MIN && meanL >= LUM[0] && meanL <= LUM[1], hb, redness: ratio === null ? null : 1 - ratio };
}
type Metrics = ReturnType<typeof analyse>;

// WHO cut-offs for non-pregnant adult women, g/dL.
const ZONES: [number, number, string, string][] = [[4, 8, "Severe", "var(--bad)"], [8, 11, "Moderate", "var(--accent)"], [11, 12, "Mild", "#d6a21c"], [12, 16, "Normal", "var(--ok)"]];
const severity = (hb: number) => ZONES.find((z) => hb < z[1]) ?? ZONES[3];
const pctHb = (hb: number) => ((Math.min(16, Math.max(4, hb)) - 4) / 12) * 100;
const yOf = (hb: number) => 4 + (1 - (hb - 4) / 12) * 34;
const cap = { fontSize: "0.58rem", textTransform: "uppercase" as const, letterSpacing: "0.08em" };

export default function Eye() {
  const cv = useRef<HTMLCanvasElement>(null);
  const roi = useRef<HTMLCanvasElement>(null);
  const assets = useRef<Assets | null>(null);
  const timers = useRef<number[]>([]);
  const [ready, setReady] = useState(false);
  const [visit, setVisit] = useState(0);
  const [step, setStep] = useState(0);           // 1 capture, 2 gate, 3 segment, 4 result
  const [retake, setRetake] = useState(false);
  const [m, setM] = useState<Metrics | null>(null);
  const [history, setHistory] = useState<(number | null)[]>([null, null, null]);

  useEffect(() => { let live = true; loadAssets().then((a) => { if (live) { assets.current = a; setReady(true); } }); return () => { live = false; }; }, []);

  const shoot = useCallback((k: number, blur: number, light: number, withMask: boolean) => {
    const a = assets.current, c = cv.current, rc = roi.current;
    if (!a || !c || !rc) return null;
    const ctx = c.getContext("2d", { willReadFrequently: true })!;
    const src = document.createElement("canvas"); src.width = W; src.height = H;
    src.getContext("2d")!.putImageData(graded(a, k), 0, 0);
    ctx.clearRect(0, 0, W, H);
    ctx.filter = `blur(${blur}px) brightness(${light})`;
    ctx.drawImage(src, 0, 0);
    ctx.filter = "none";
    const img = ctx.getImageData(0, 0, W, H);
    const r = analyse(img, a.mask);
    const rctx = rc.getContext("2d")!;
    rctx.clearRect(0, 0, rc.width, rc.height);
    if (withMask && r.pass) {
      const tint = ctx.createImageData(W, H);
      let x0 = W, x1 = 0, y0 = H, y1 = 0;
      for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
        const i = y * W + x;
        if (!a.mask[i]) continue;
        x0 = Math.min(x0, x); x1 = Math.max(x1, x); y0 = Math.min(y0, y); y1 = Math.max(y1, y);
        tint.data[i * 4] = 60; tint.data[i * 4 + 1] = 170; tint.data[i * 4 + 2] = 190; tint.data[i * 4 + 3] = 95;
      }
      const t = document.createElement("canvas"); t.width = W; t.height = H;
      t.getContext("2d")!.putImageData(tint, 0, 0);
      ctx.drawImage(t, 0, 0);
      if (x1 > x0) { // "Analyzed image": the extracted region, background removed
        const cut = document.createElement("canvas"); cut.width = x1 - x0 + 1; cut.height = y1 - y0 + 1;
        const cc = cut.getContext("2d")!, cd = cc.createImageData(cut.width, cut.height);
        for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) {
          const i = y * W + x, j = ((y - y0) * cut.width + (x - x0)) * 4;
          if (a.mask[i]) { cd.data[j] = img.data[i * 4]; cd.data[j + 1] = img.data[i * 4 + 1]; cd.data[j + 2] = img.data[i * 4 + 2]; cd.data[j + 3] = 255; }
        }
        cc.putImageData(cd, 0, 0);
        const kk = Math.min(rc.width / cut.width, rc.height / cut.height);
        rctx.drawImage(cut, (rc.width - cut.width * kk) / 2, (rc.height - cut.height * kk) / 2, cut.width * kk, cut.height * kk);
      }
    }
    return r;
  }, []);

  const run = useCallback((v: number) => {
    timers.current.forEach(clearTimeout); timers.current = [];
    const V = VISITS[v];
    const at = (ms: number, f: () => void) => timers.current.push(window.setTimeout(f, ms));
    let t = 0;
    setStep(1); setRetake(false); setM(null);
    const first = shoot(V.k, V.bad?.blur ?? 0, V.bad?.light ?? 1, false);
    t += 900; at(t, () => { setStep(2); if (first) setM(first); });
    if (V.bad) {
      t += 1400; at(t, () => setRetake(true));
      t += 1100; at(t, () => { setRetake(false); setStep(1); setM(shoot(V.k, 0, 1, false)); });
      t += 900; at(t, () => setStep(2));
    }
    t += 900; at(t, () => { setStep(3); const r = shoot(V.k, 0, 1, true); if (r) setM(r); });
    t += 1000; at(t, () => {
      setStep(4);
      const r = shoot(V.k, 0, 1, true);
      if (r?.hb != null) setHistory((h) => h.map((x, i) => (i === v ? r.hb : x)));
    });
  }, [shoot]);

  useEffect(() => { if (!ready) return; run(0); return () => timers.current.forEach(clearTimeout); }, [ready, run]);

  const next = () => { const v = (visit + 1) % VISITS.length; if (v === 0) setHistory([null, null, null]); setVisit(v); run(v); };
  const hb = step >= 4 && m?.hb != null ? m.hb : null;
  const sev = hb !== null ? severity(hb) : null;
  const hmax = m ? Math.max(...m.hist) : 1;
  const stepHead = (n: number, label: string, detail: string) => (
    <div style={{ display: "grid", gridTemplateColumns: "1rem 1fr", gap: 8, alignItems: "start", opacity: step >= n ? 1 : 0.3, transition: "opacity 0.4s" }}>
      <span className="mono" style={{ color: step >= n ? "var(--accent)" : "var(--ink-3)" }}>{step > n || (step === n && n === 4) ? "✓" : step === n ? "…" : "·"}</span>
      <span><span className="mono" style={{ color: "var(--ink)", fontSize: "0.78rem" }}>{label}</span><br /><span className="mono dim" style={{ fontSize: "0.62rem" }}>{detail}</span></span>
    </div>
  );
  const pts = history.map((h, i) => ({ h, i, x: 10 + i * 30 })).filter((p): p is { h: number; i: number; x: number } => p.h !== null);

  return (
    <div className="stage">
      <div className="stage-h">
        <span className="mono">patient #0142 · 34 · F · {VISITS[visit].label} of 3</span>
        <button className="sm" onClick={next}>{visit === VISITS.length - 1 ? "start over" : "next visit →"}</button>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "minmax(0,1.15fr) minmax(0,1fr)", gap: "0.9rem", alignItems: "start" }}>
        <div style={{ position: "relative", lineHeight: 0 }}>
          <canvas ref={cv} width={W} height={H} style={{ width: "100%", height: "auto", display: "block", borderRadius: 8, background: "var(--bg-2)" }} aria-label="Photograph of an eye with the lower lid pulled down, showing the red conjunctiva" />
          <div style={{ position: "absolute", left: "3%", top: "8%", width: "94%", height: "86%", border: "1.5px dashed rgba(255,255,255,0.85)", borderRadius: 8, pointerEvents: "none" }} />
          {retake && <div style={{ position: "absolute", inset: 0, display: "grid", placeItems: "center", background: "rgba(10,10,12,0.62)", borderRadius: 8 }}><span className="mono" style={{ textAlign: "center", lineHeight: 1.5, color: "#ff9d8f" }}>too blurry<br />please retake</span></div>}
          {!ready && <div style={{ position: "absolute", inset: 0, display: "grid", placeItems: "center" }}><span className="mono dim">loading photo…</span></div>}
        </div>

        <div style={{ display: "grid", gap: "0.65rem" }}>
          {stepHead(1, "capture", "inside the guide box")}
          <div>
            {stepHead(2, "quality gate", m ? (m.pass ? "sharp and well lit: accepted" : "rejected: retake the photo") : "blur and brightness")}
            <div style={{ marginLeft: 24, marginTop: 6, display: "grid", gap: 7, opacity: step >= 2 ? 1 : 0.25, transition: "opacity 0.4s" }}>
              <div>
                <div className="mono dim" style={{ ...cap, display: "flex", justifyContent: "space-between" }}><span>sharpness</span><span>{m ? Math.round(m.sharp) : "–"} / {BLUR_MIN}</span></div>
                <div style={{ position: "relative", height: 7, background: "var(--bg-2)", borderRadius: 4, marginTop: 3 }}>
                  <div style={{ position: "absolute", inset: "0 auto 0 0", width: `${m ? Math.min(100, (m.sharp / 300) * 100) : 0}%`, background: m && m.sharp >= BLUR_MIN ? "var(--ok)" : "var(--bad)", borderRadius: 4, transition: "width 0.4s" }} />
                  <div style={{ position: "absolute", left: `${(BLUR_MIN / 300) * 100}%`, top: -2, bottom: -2, width: 1.5, background: "var(--ink)" }} />
                </div>
              </div>
              <div>
                <div className="mono dim" style={{ ...cap, display: "flex", justifyContent: "space-between" }}><span>brightness histogram</span><span>mean {m ? Math.round(m.meanL) : "–"}</span></div>
                <svg viewBox={`0 0 ${BINS} 10`} preserveAspectRatio="none" style={{ width: "100%", height: 30, display: "block", marginTop: 3 }} aria-label="Brightness histogram of the capture">
                  <rect x={(LUM[0] / 256) * BINS} width={((LUM[1] - LUM[0]) / 256) * BINS} y="0" height="10" fill="color-mix(in srgb, var(--ok) 14%, transparent)" />
                  {m?.hist.map((h, i) => <rect key={i} x={i + 0.1} width="0.8" y={10 - (h / hmax) * 10} height={(h / hmax) * 10} fill="var(--ink-3)" />)}
                </svg>
              </div>
            </div>
          </div>
          {stepHead(3, "segment", step >= 3 && m?.redness != null && assets.current ? `palpebral conjunctiva · ${(assets.current.cover * 100).toFixed(0)}% of the frame · redness ${(m.redness * 100).toFixed(0)}%` : "palpebral conjunctiva")}
          {stepHead(4, "haemoglobin", "estimate, then WHO class")}
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "minmax(0,0.9fr) minmax(0,1.3fr) minmax(0,1fr)", gap: "0.9rem", alignItems: "center", border: "1px solid var(--rule)", borderRadius: 10, padding: "0.75rem 0.9rem", background: "var(--card)" }}>
        <div>
          <div className="mono dim" style={{ ...cap, marginBottom: 4 }}>analyzed image</div>
          <canvas ref={roi} width={220} height={110} style={{ width: "100%", height: "auto", background: "var(--bg-2)", borderRadius: 6, display: "block" }} aria-label="Extracted conjunctiva region" />
        </div>
        <div>
          <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
            <span style={{ fontFamily: "var(--serif)", fontSize: "2.1rem", lineHeight: 1 }}>{hb !== null ? hb.toFixed(1) : "—"}</span>
            <span className="mono dim" style={{ fontSize: "0.64rem" }}>g/dL</span>
            <span className="mono" style={{ marginLeft: "auto", padding: "0.15rem 0.55rem", borderRadius: 99, fontSize: "0.7rem", fontWeight: 600, color: sev ? sev[3] : "var(--ink-3)", border: `1px solid ${sev ? sev[3] : "var(--rule)"}` }}>{sev ? sev[2] : "waiting"}</span>
          </div>
          <div style={{ position: "relative", marginTop: 12 }}>
            <div style={{ display: "flex", height: 8, borderRadius: 4, overflow: "hidden" }}>
              {ZONES.map((z) => <div key={z[2]} style={{ width: `${((z[1] - z[0]) / 12) * 100}%`, background: z[3], opacity: sev && sev[2] === z[2] ? 1 : 0.35, transition: "opacity 0.4s" }} />)}
            </div>
            {hb !== null && <div style={{ position: "absolute", left: `${pctHb(hb)}%`, top: -4, width: 2, height: 16, background: "var(--ink)", transition: "left 0.5s var(--ease)" }} />}
            <div className="mono dim" style={{ display: "flex", justifyContent: "space-between", fontSize: "0.54rem", marginTop: 3 }}><span>4</span><span>8</span><span>11</span><span>12</span><span>16</span></div>
          </div>
        </div>
        <div>
          <div className="mono dim" style={{ ...cap, marginBottom: 4 }}>patient history</div>
          <svg viewBox="0 0 80 46" style={{ height: 66, display: "block", width: "100%" }} aria-label="Haemoglobin across visits">
            {[8, 11, 12].map((z) => <line key={z} x1="0" x2="80" y1={yOf(z)} y2={yOf(z)} stroke="var(--rule)" strokeDasharray="2 2" strokeWidth="0.6" />)}
            {pts.length > 1 && <polyline points={pts.map((p) => `${p.x},${yOf(p.h)}`).join(" ")} fill="none" stroke="var(--accent)" strokeWidth="1.3" />}
            {pts.map((p) => <g key={p.i}><circle cx={p.x} cy={yOf(p.h)} r="2" fill="var(--accent)" /><text x={p.x} y={yOf(p.h) - 4} textAnchor="middle" fontSize="4.6" style={{ fill: "var(--ink-2)" }}>{p.h.toFixed(1)}</text></g>)}
            {VISITS.map((v, i) => <text key={v.label} x={10 + i * 30} y="45" textAnchor="middle" fontSize="4" style={{ fill: "var(--ink-3)" }}>{v.date}</text>)}
          </svg>
        </div>
      </div>

    </div>
  );
}
