import { useCallback, useEffect, useRef, useState } from "react";

/**
 * The anaemia app's flow on a real photograph of the lower lid pulled down, the
 * red palpebral conjunctiva below the eye (see the credit under the demo). Capture in the guide box, quality gate (Laplacian
 * sharpness and brightness, computed on the pixels), segmentation of the
 * palpebral conjunctiva, haemoglobin, severity, and a history across visits.
 * What is simulated, and said on the page: I have no clinical photo of a
 * pale conjunctiva, so visits 1 and 2 grade the conjunctiva pixels of this
 * photo towards pale. The mask is a colour threshold on the real pixels (a
 * stand-in for UNet++), and the Hb mapping is a toy calibration.
 */
const W = 360, H = 269, BLUR_MIN = 120, LUM: [number, number] = [70, 215];
const PALE = [236, 201, 196];
const VISITS = [
  { label: "Visit 1", k: 0.8, bad: { blur: 4, light: 1 } },
  { label: "Visit 2", k: 0.45, bad: null },
  { label: "Visit 3", k: 0, bad: null },
];
const RATIO0 = 0.646; // mean green/red under the mask in the untouched photo

type Assets = { base: ImageData; mask: Uint8Array; soft: Uint8ClampedArray };
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
  for (let i = 0; i < W * H; i++) mask[i] = hd[i * 4] > 128 ? 1 : 0;
  return { base, mask, soft };
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
  const lum = new Float32Array(W * H);
  let sum = 0;
  for (let i = 0; i < W * H; i++) { lum[i] = 0.299 * data[i * 4] + 0.587 * data[i * 4 + 1] + 0.114 * data[i * 4 + 2]; sum += lum[i]; }
  const meanL = sum / (W * H);
  let s = 0, s2 = 0, n = 0; // variance of the Laplacian: the standard cheap sharpness score
  for (let y = 1; y < H - 1; y++) for (let x = 1; x < W - 1; x++) {
    const i = y * W + x, v = lum[i - 1] + lum[i + 1] + lum[i - W] + lum[i + W] - 4 * lum[i];
    s += v; s2 += v * v; n++;
  }
  const sharp = s2 / n - (s / n) ** 2;
  let cnt = 0, rs = 0;
  for (let i = 0; i < W * H; i++) if (mask[i]) { cnt++; rs += data[i * 4 + 1] / Math.max(data[i * 4], 1); }
  const hb = cnt ? Math.max(4, Math.min(15.5, 12.9 - 42.7 * (rs / cnt - RATIO0))) : null;
  return { sharp, meanL, pass: sharp >= BLUR_MIN && meanL >= LUM[0] && meanL <= LUM[1], hb };
}
// WHO cut-offs for non-pregnant adult women, g/dL.
const severity = (hb: number): [string, string] => (hb >= 12 ? ["Normal", "var(--ok)"] : hb >= 11 ? ["Mild", "var(--accent)"] : hb >= 8 ? ["Moderate", "var(--accent)"] : ["Severe", "var(--bad)"]);
const yOf = (hb: number) => 4 + (1 - (hb - 4) / 11.5) * 34;

export default function Eye() {
  const cv = useRef<HTMLCanvasElement>(null);
  const roi = useRef<HTMLCanvasElement>(null);
  const assets = useRef<Assets | null>(null);
  const timers = useRef<number[]>([]);
  const [ready, setReady] = useState(false);
  const [visit, setVisit] = useState(0);
  const [step, setStep] = useState(0);           // 1 capture, 2 gate, 3 segment, 4 result
  const [retake, setRetake] = useState(false);
  const [m, setM] = useState<{ sharp: number; meanL: number; pass: boolean; hb: number | null } | null>(null);
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
        tint.data[i * 4] = 40; tint.data[i * 4 + 1] = 130; tint.data[i * 4 + 2] = 255; tint.data[i * 4 + 3] = 120;
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
  const tick = (n: number, label: string, detail: string) => (
    <div style={{ display: "grid", gridTemplateColumns: "1rem 1fr", gap: 8, alignItems: "start", opacity: step >= n ? 1 : 0.3, transition: "opacity 0.4s" }}>
      <span className="mono" style={{ color: step >= n ? "var(--accent)" : "var(--ink-3)" }}>{step > n || (step === n && n === 4) ? "✓" : step === n ? "…" : "·"}</span>
      <span><span className="mono" style={{ color: "var(--ink)", fontSize: "0.78rem" }}>{label}</span><br /><span className="mono dim" style={{ fontSize: "0.64rem" }}>{detail}</span></span>
    </div>
  );
  const pts = history.map((h, i) => ({ h, x: 10 + i * 30 })).filter((p): p is { h: number; x: number } => p.h !== null);

  return (
    <div className="stage">
      <div className="stage-h">
        <span className="mono">one patient · {VISITS[visit].label} of 3</span>
        <button className="sm" onClick={next}>{visit === VISITS.length - 1 ? "start over" : "next visit →"}</button>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "minmax(0,1.25fr) minmax(0,1fr)", gap: "0.9rem", alignItems: "center" }}>
        <div style={{ position: "relative", lineHeight: 0 }}>
          <canvas ref={cv} width={W} height={H} style={{ width: "100%", height: "auto", display: "block", borderRadius: 8, background: "var(--bg-2)" }} aria-label="Photograph of an eye with the lower lid pulled down, showing the red conjunctiva" />
          <div style={{ position: "absolute", left: "5%", top: "14%", width: "90%", height: "78%", border: "1.5px dashed rgba(255,255,255,0.85)", borderRadius: 8, pointerEvents: "none" }} />
          {retake && <div style={{ position: "absolute", inset: 0, display: "grid", placeItems: "center", background: "rgba(10,10,12,0.62)", borderRadius: 8 }}><span className="mono bad" style={{ textAlign: "center", lineHeight: 1.5, color: "#ff9d8f" }}>too blurry<br />please retake</span></div>}
          {!ready && <div style={{ position: "absolute", inset: 0, display: "grid", placeItems: "center" }}><span className="mono dim">loading photo…</span></div>}
        </div>
        <div style={{ display: "grid", gap: "0.5rem" }}>
          {tick(1, "capture", "inside the guide box")}
          {tick(2, "quality gate", m ? `sharp ${m.sharp.toFixed(0)}/${BLUR_MIN} · light ${m.meanL.toFixed(0)}` : "blur + brightness")}
          {tick(3, "segment", "palpebral conjunctiva")}
          {tick(4, "haemoglobin", "estimate + severity")}
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "minmax(0,1fr) minmax(0,0.8fr) minmax(0,1fr)", gap: "0.8rem", alignItems: "center", border: "1px solid var(--rule)", borderRadius: 8, padding: "0.6rem 0.75rem", background: "var(--card)" }}>
        <div>
          <div className="mono dim" style={{ fontSize: "0.58rem", marginBottom: 3 }}>ANALYZED IMAGE</div>
          <canvas ref={roi} width={220} height={110} style={{ width: "100%", height: "auto", background: "var(--bg-2)", borderRadius: 4, display: "block" }} aria-label="Extracted conjunctiva region" />
        </div>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontFamily: "var(--serif)", fontSize: "1.7rem", lineHeight: 1 }}>{hb !== null ? hb.toFixed(1) : "—"}<span className="mono dim" style={{ fontSize: "0.62rem" }}> g/dL</span></div>
          <div className="mono" style={{ marginTop: 4, color: sev ? sev[1] : "var(--ink-3)", fontWeight: 600 }}>{sev ? sev[0] : "waiting"}</div>
        </div>
        <div>
          <div className="mono dim" style={{ fontSize: "0.58rem", marginBottom: 3 }}>PATIENT HISTORY</div>
          <svg viewBox="0 0 80 42" style={{ height: 52, display: "block", width: "100%" }} aria-label="Haemoglobin across visits">
            {[8, 11, 12].map((z) => <line key={z} x1="0" x2="80" y1={yOf(z)} y2={yOf(z)} stroke="var(--rule)" strokeDasharray="2 2" strokeWidth="0.6" />)}
            {pts.length > 1 && <polyline points={pts.map((p) => `${p.x},${yOf(p.h)}`).join(" ")} fill="none" stroke="var(--accent)" strokeWidth="1.3" />}
            {pts.map((p) => <circle key={p.x} cx={p.x} cy={yOf(p.h)} r="2" fill="var(--accent)" />)}
          </svg>
        </div>
      </div>
      <div className="mono dim" style={{ fontSize: "0.58rem" }}>Photo: J. Trobe, MD, Univ. of Michigan Kellogg Eye Center, CC BY 3.0 (Wikimedia Commons), cropped and colour-softened. Earlier visits simulated by grading.</div>
    </div>
  );
}
