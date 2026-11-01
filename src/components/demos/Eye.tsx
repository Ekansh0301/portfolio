import { useCallback, useEffect, useRef, useState } from "react";

/**
 * One patient, three visits, through the app's real flow: capture in the guide
 * box, quality gate, segmentation of the palpebral conjunctiva, haemoglobin,
 * severity, saved to the patient's history. Gate and segmentation maths run on
 * the pixels. The segmenter is a colour threshold standing in for UNet++ and
 * the Hb mapping is a toy calibration on the synthetic eye (the 1.5 MB model is
 * what ships). The first visit starts with a blurry shot to show the gate.
 */
const W = 240, H = 150, BLUR_MIN = 55, LUM: [number, number] = [70, 215];
const VISITS = [
  { label: "Visit 1", pallor: 0.72, bad: { blur: 4, light: 1 } },
  { label: "Visit 2", pallor: 0.5, bad: null },
  { label: "Visit 3", pallor: 0.2, bad: null },
];
const conj = (p: number) => [190 + 35 * p, 45 + 100 * p, 55 + 95 * p];

function drawEye(ctx: CanvasRenderingContext2D, pallor: number) {
  const g = ctx.createLinearGradient(0, 0, 0, H);
  g.addColorStop(0, "rgb(214,166,134)"); g.addColorStop(1, "rgb(196,146,116)");
  ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = "#f1ece6"; ctx.beginPath(); ctx.ellipse(120, 58, 78, 32, 0, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = "#4a3326"; ctx.beginPath(); ctx.arc(120, 56, 23, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = "#0b0907"; ctx.beginPath(); ctx.arc(120, 56, 9, 0, Math.PI * 2); ctx.fill();
  const t = document.createElement("canvas"); t.width = W; t.height = H;
  const c = t.getContext("2d")!;
  const [r, gg, b] = conj(pallor);
  c.fillStyle = `rgb(${r},${gg},${b})`; c.beginPath(); c.ellipse(120, 106, 74, 24, 0, 0, Math.PI * 2); c.fill();   // palpebral conjunctiva
  c.strokeStyle = `rgba(${r - 50},${gg - 30},${b - 30},0.5)`; c.lineWidth = 1;
  for (let i = 0; i < 16; i++) { const x = 58 + i * 8.5; c.beginPath(); c.moveTo(x, 112 + (i % 3)); c.quadraticCurveTo(x + 3, 120, x - 2, 130); c.stroke(); }
  c.globalCompositeOperation = "destination-out";
  c.beginPath(); c.ellipse(120, 92, 78, 22, 0, 0, Math.PI * 2); c.fill();
  ctx.drawImage(t, 0, 0);
}

function analyse(img: ImageData) {
  const { data } = img;
  const lum = new Float32Array(W * H);
  let sumL = 0;
  for (let i = 0; i < W * H; i++) { lum[i] = 0.299 * data[i * 4] + 0.587 * data[i * 4 + 1] + 0.114 * data[i * 4 + 2]; sumL += lum[i]; }
  const meanL = sumL / (W * H);
  let s = 0, s2 = 0, n = 0; // variance of the Laplacian: the standard cheap sharpness score
  for (let y = 1; y < H - 1; y++) for (let x = 1; x < W - 1; x++) {
    const i = y * W + x, v = lum[i - 1] + lum[i + 1] + lum[i - W] + lum[i + W] - 4 * lum[i];
    s += v; s2 += v * v; n++;
  }
  const sharp = s2 / n - (s / n) ** 2;
  const mask = new Uint8Array(W * H);
  let cnt = 0, rs = 0;
  for (let i = 0; i < W * H; i++) {
    const r = data[i * 4], ratio = data[i * 4 + 1] / Math.max(r, 1);
    if (r > 120 && ratio < 0.7) { mask[i] = 1; cnt++; rs += ratio; }
  }
  const hb = cnt ? Math.max(4, Math.min(15.5, 14.5 - ((rs / cnt - 0.3) / 0.32) * 9)) : null;
  return { sharp, meanL, pass: sharp >= BLUR_MIN && meanL >= LUM[0] && meanL <= LUM[1], mask, hb };
}
// WHO cut-offs for non-pregnant adult women, g/dL.
const severity = (hb: number): [string, string] => (hb >= 12 ? ["Normal", "var(--ok)"] : hb >= 11 ? ["Mild", "var(--accent)"] : hb >= 8 ? ["Moderate", "var(--accent)"] : ["Severe", "var(--bad)"]);
const yOf = (hb: number) => 4 + (1 - (hb - 4) / 11.5) * 34;

export default function Eye() {
  const cv = useRef<HTMLCanvasElement>(null);
  const roi = useRef<HTMLCanvasElement>(null);
  const timers = useRef<number[]>([]);
  const [visit, setVisit] = useState(0);
  const [step, setStep] = useState(0);           // 1 capture, 2 gate, 3 segment, 4 result
  const [retake, setRetake] = useState(false);
  const [m, setM] = useState<{ sharp: number; meanL: number; pass: boolean; hb: number | null } | null>(null);
  const [history, setHistory] = useState<(number | null)[]>([null, null, null]);

  const shoot = useCallback((pallor: number, blur: number, light: number, withMask: boolean) => {
    const c = cv.current, rc = roi.current;
    if (!c || !rc) return null;
    const ctx = c.getContext("2d", { willReadFrequently: true })!;
    const src = document.createElement("canvas"); src.width = W; src.height = H;
    drawEye(src.getContext("2d")!, pallor);
    ctx.clearRect(0, 0, W, H);
    ctx.filter = `blur(${blur}px) brightness(${light})`;
    ctx.drawImage(src, 0, 0);
    ctx.filter = "none";
    const img = ctx.getImageData(0, 0, W, H);
    const r = analyse(img);
    const rctx = rc.getContext("2d")!;
    rctx.clearRect(0, 0, rc.width, rc.height);
    if (withMask && r.pass) {
      const out = ctx.createImageData(W, H);
      let x0 = W, x1 = 0, y0 = H, y1 = 0;
      for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
        const i = y * W + x;
        if (!r.mask[i]) continue;
        x0 = Math.min(x0, x); x1 = Math.max(x1, x); y0 = Math.min(y0, y); y1 = Math.max(y1, y);
        out.data[i * 4] = 40; out.data[i * 4 + 1] = 130; out.data[i * 4 + 2] = 255; out.data[i * 4 + 3] = 150;
      }
      const tint = document.createElement("canvas"); tint.width = W; tint.height = H;
      tint.getContext("2d")!.putImageData(out, 0, 0);
      ctx.drawImage(tint, 0, 0);
      if (x1 > x0) { // "Analyzed image": the extracted region, background removed
        const cut = document.createElement("canvas"); cut.width = x1 - x0 + 1; cut.height = y1 - y0 + 1;
        const cc = cut.getContext("2d")!, cd = cc.createImageData(cut.width, cut.height);
        for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) {
          const i = y * W + x, j = ((y - y0) * cut.width + (x - x0)) * 4;
          if (r.mask[i]) { cd.data[j] = img.data[i * 4]; cd.data[j + 1] = img.data[i * 4 + 1]; cd.data[j + 2] = img.data[i * 4 + 2]; cd.data[j + 3] = 255; }
        }
        cc.putImageData(cd, 0, 0);
        const k = Math.min(rc.width / cut.width, rc.height / cut.height);
        rctx.drawImage(cut, (rc.width - cut.width * k) / 2, (rc.height - cut.height * k) / 2, cut.width * k, cut.height * k);
      }
    }
    return r;
  }, []);

  const run = useCallback((v: number) => {
    timers.current.forEach(clearTimeout);
    timers.current = [];
    const V = VISITS[v];
    const at = (ms: number, f: () => void) => timers.current.push(window.setTimeout(f, ms));
    let t = 0;
    setStep(1); setRetake(false); setM(null);
    const first = shoot(V.pallor, V.bad?.blur ?? 0, V.bad?.light ?? 1, false);
    t += 900; at(t, () => { setStep(2); if (first) setM(first); });
    if (V.bad) {
      t += 1400; at(t, () => { setRetake(true); });
      t += 1100; at(t, () => { setRetake(false); setStep(1); const r = shoot(V.pallor, 0, 1, false); setM(r); });
      t += 900; at(t, () => setStep(2));
    }
    t += 900; at(t, () => { setStep(3); const r = shoot(V.pallor, 0, 1, true); if (r) setM(r); });
    t += 1000; at(t, () => {
      setStep(4);
      const r = shoot(V.pallor, 0, 1, true);
      if (r?.hb != null) setHistory((h) => h.map((x, i) => (i === v ? r.hb : x)));
    });
  }, [shoot]);

  useEffect(() => { run(0); return () => timers.current.forEach(clearTimeout); }, [run]);

  const next = () => { const v = (visit + 1) % VISITS.length; if (v === 0) setHistory([null, null, null]); setVisit(v); run(v); };
  const hb = step >= 4 && m?.hb != null ? m.hb : null;
  const sev = hb !== null ? severity(hb) : null;
  const tick = (n: number, label: string, detail: string) => (
    <div style={{ display: "grid", gridTemplateColumns: "1rem 1fr", gap: 8, alignItems: "start", opacity: step >= n ? 1 : 0.3, transition: "opacity 0.4s" }}>
      <span className="mono" style={{ color: step >= n ? "var(--accent)" : "var(--ink-3)" }}>{step > n || (step === n && n === 4) ? "✓" : step === n ? "…" : "·"}</span>
      <span><span className="mono" style={{ color: "var(--ink)", fontSize: "0.72rem" }}>{label}</span><br /><span className="mono dim" style={{ fontSize: "0.6rem" }}>{detail}</span></span>
    </div>
  );
  const pts = history.map((h, i) => ({ h, x: 10 + i * 30 })).filter((p): p is { h: number; x: number } => p.h !== null);

  return (
    <div className="stage">
      <div className="stage-h">
        <span className="mono">one patient · {VISITS[visit].label} of 3</span>
        <button className="sm" onClick={next}>{visit === VISITS.length - 1 ? "start over" : "next visit →"}</button>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "minmax(0,1.15fr) minmax(0,1fr)", gap: "0.9rem", alignItems: "center" }}>
        <div style={{ position: "relative", lineHeight: 0 }}>
          <canvas ref={cv} width={W} height={H} style={{ width: "100%", height: "auto", display: "block", borderRadius: 8 }} aria-label="Captured eye image" />
          <div style={{ position: "absolute", left: "12%", top: "40%", width: "76%", height: "52%", border: "1.5px dashed color-mix(in srgb, var(--accent) 80%, white)", borderRadius: 6, pointerEvents: "none" }} />
          {retake && <div style={{ position: "absolute", inset: 0, display: "grid", placeItems: "center", background: "color-mix(in srgb, var(--bg) 78%, transparent)", borderRadius: 8 }}><span className="mono bad" style={{ textAlign: "center", lineHeight: 1.5 }}>too blurry<br />please retake</span></div>}
        </div>
        <div style={{ display: "grid", gap: "0.55rem" }}>
          {tick(1, "capture", "inside the guide box")}
          {tick(2, "quality gate", m ? `sharp ${m.sharp.toFixed(0)}/${BLUR_MIN} · light ${m.meanL.toFixed(0)}` : "blur + brightness")}
          {tick(3, "segment", "palpebral conjunctiva")}
          {tick(4, "haemoglobin", "estimate + severity")}
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "minmax(0,1fr) minmax(0,0.8fr) minmax(0,1fr)", gap: "0.8rem", alignItems: "center", border: "1px solid var(--rule)", borderRadius: 8, padding: "0.6rem 0.75rem", background: "var(--card)" }}>
        <div>
          <div className="mono dim" style={{ fontSize: "0.56rem", marginBottom: 3 }}>ANALYZED IMAGE</div>
          <canvas ref={roi} width={120} height={40} style={{ width: "100%", height: "auto", background: "var(--bg-2)", borderRadius: 4, display: "block" }} aria-label="Extracted conjunctiva region" />
        </div>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontFamily: "var(--serif)", fontSize: "1.9rem", lineHeight: 1 }}>{hb !== null ? hb.toFixed(1) : "—"}<span className="mono dim" style={{ fontSize: "0.6rem" }}> g/dL</span></div>
          <div className="mono" style={{ marginTop: 4, color: sev ? sev[1] : "var(--ink-3)", fontWeight: 600 }}>{sev ? sev[0] : "waiting"}</div>
        </div>
        <div>
          <div className="mono dim" style={{ fontSize: "0.56rem", marginBottom: 3 }}>PATIENT HISTORY</div>
          <svg viewBox="0 0 80 42" style={{ height: 44, display: "block", width: "100%" }} aria-label="Haemoglobin across visits">
            {[8, 11, 12].map((z) => <line key={z} x1="0" x2="80" y1={yOf(z)} y2={yOf(z)} stroke="var(--rule)" strokeDasharray="2 2" strokeWidth="0.6" />)}
            {pts.length > 1 && <polyline points={pts.map((p) => `${p.x},${yOf(p.h)}`).join(" ")} fill="none" stroke="var(--accent)" strokeWidth="1.3" />}
            {pts.map((p) => <circle key={p.x} cx={p.x} cy={yOf(p.h)} r="2" fill="var(--accent)" />)}
          </svg>
        </div>
      </div>
    </div>
  );
}
