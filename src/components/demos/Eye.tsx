import { useCallback, useEffect, useRef, useState } from "react";

/**
 * The anaemia app's pipeline, run for real on pixels: (1) image-quality gate
 * (Laplacian-variance blur + mean brightness), (2) conjunctiva segmentation,
 * (3) haemoglobin estimate, (4) WHO severity class. The segmenter here is a
 * colour threshold standing in for UNet++, and the Hb mapping is a toy
 * calibration on the synthetic eye: the point is the pipeline, not the model.
 */
const W = 240, H = 150;
const BLUR_MIN = 55;
const LUM_RANGE: [number, number] = [70, 215];

// Pallor: 0 = deep red conjunctiva, 1 = very pale.
const conj = (p: number) => [190 + 35 * p, 45 + 100 * p, 55 + 95 * p];

function drawEye(ctx: CanvasRenderingContext2D, pallor: number) {
  const g = ctx.createLinearGradient(0, 0, 0, H);
  g.addColorStop(0, "rgb(214,166,134)"); g.addColorStop(1, "rgb(196,146,116)");
  ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = "#f1ece6"; ctx.beginPath(); ctx.ellipse(120, 62, 78, 34, 0, 0, Math.PI * 2); ctx.fill();   // sclera
  ctx.fillStyle = "#4a3326"; ctx.beginPath(); ctx.arc(120, 60, 24, 0, Math.PI * 2); ctx.fill();            // iris
  ctx.fillStyle = "#0b0907"; ctx.beginPath(); ctx.arc(120, 60, 10, 0, Math.PI * 2); ctx.fill();            // pupil
  const [r, gg, b] = conj(pallor);                                                                          // everted lower lid
  ctx.fillStyle = `rgb(${r},${gg},${b})`; ctx.beginPath(); ctx.ellipse(120, 112, 70, 22, 0, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = `rgba(${r - 50},${gg - 30},${b - 30},0.55)`; ctx.lineWidth = 1;                         // vessels
  for (let i = 0; i < 14; i++) { const x = 62 + i * 9; ctx.beginPath(); ctx.moveTo(x, 94 + (i % 3) * 2); ctx.quadraticCurveTo(x + 6, 112, x - 4, 130 - (i % 4) * 2); ctx.stroke(); }
}

function truthMask() {
  const m = new Uint8Array(W * H);
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const dx = (x - 120) / 70, dy = (y - 112) / 22;
    m[y * W + x] = dx * dx + dy * dy <= 1 ? 1 : 0;
  }
  return m;
}
const TRUTH = truthMask();

function analyse(img: ImageData, haveTruth: boolean) {
  const { data } = img;
  const lum = new Float32Array(W * H);
  let sumL = 0;
  for (let i = 0; i < W * H; i++) { lum[i] = 0.299 * data[i * 4] + 0.587 * data[i * 4 + 1] + 0.114 * data[i * 4 + 2]; sumL += lum[i]; }
  const meanL = sumL / (W * H);
  // variance of the Laplacian: the standard cheap sharpness score
  let s = 0, s2 = 0, n = 0;
  for (let y = 1; y < H - 1; y++) for (let x = 1; x < W - 1; x++) {
    const i = y * W + x;
    const v = lum[i - 1] + lum[i + 1] + lum[i - W] + lum[i + W] - 4 * lum[i];
    s += v; s2 += v * v; n++;
  }
  const sharp = s2 / n - (s / n) ** 2;
  const pass = sharp >= BLUR_MIN && meanL >= LUM_RANGE[0] && meanL <= LUM_RANGE[1];

  const mask = new Uint8Array(W * H);
  let cnt = 0, ratioSum = 0, inter = 0, tcount = 0;
  for (let i = 0; i < W * H; i++) {
    const r = data[i * 4], g = data[i * 4 + 1];
    const ratio = g / Math.max(r, 1);
    if (r > 60 && ratio < 0.7) { mask[i] = 1; cnt++; ratioSum += ratio; }
    if (haveTruth) { tcount += TRUTH[i]; if (mask[i] && TRUTH[i]) inter++; }
  }
  const dice = haveTruth && cnt + tcount ? (2 * inter) / (cnt + tcount) : null;
  const ratio = cnt ? ratioSum / cnt : null;
  // Toy calibration: a paler (higher g/r) conjunctiva means lower haemoglobin.
  const hb = ratio === null ? null : Math.max(4, Math.min(15.5, 14.5 - ((ratio - 0.3) / 0.32) * 9));
  return { sharp, meanL, pass, mask, dice, hb };
}

// WHO haemoglobin cut-offs for non-pregnant adult women, g/dL.
const severity = (hb: number) => (hb >= 12 ? ["Normal", "var(--ok)"] : hb >= 11 ? ["Mild", "var(--accent)"] : hb >= 8 ? ["Moderate", "var(--accent)"] : ["Severe", "var(--bad)"]);

export default function Eye() {
  const cv = useRef<HTMLCanvasElement>(null);
  const ov = useRef<HTMLCanvasElement>(null);
  const [pallor, setPallor] = useState(0.2);
  const [blur, setBlur] = useState(0);
  const [light, setLight] = useState(1);
  const [custom, setCustom] = useState<HTMLImageElement | null>(null);
  const [res, setRes] = useState<ReturnType<typeof analyse> | null>(null);
  const [overlay, setOverlay] = useState(true);

  const render = useCallback(() => {
    const c = cv.current, o = ov.current;
    if (!c || !o) return;
    const ctx = c.getContext("2d", { willReadFrequently: true })!;
    const src = document.createElement("canvas"); src.width = W; src.height = H;
    const sctx = src.getContext("2d")!;
    if (custom) {
      const k = Math.max(W / custom.width, H / custom.height);
      sctx.drawImage(custom, (W - custom.width * k) / 2, (H - custom.height * k) / 2, custom.width * k, custom.height * k);
    } else drawEye(sctx, pallor);
    ctx.clearRect(0, 0, W, H);
    ctx.filter = `blur(${blur}px) brightness(${light})`;
    ctx.drawImage(src, 0, 0);
    ctx.filter = "none";
    const r = analyse(ctx.getImageData(0, 0, W, H), !custom);
    const octx = o.getContext("2d")!;
    octx.clearRect(0, 0, W, H);
    if (r.pass && overlay) {
      const id = octx.createImageData(W, H);
      for (let i = 0; i < W * H; i++) if (r.mask[i]) { id.data[i * 4] = 40; id.data[i * 4 + 1] = 120; id.data[i * 4 + 2] = 255; id.data[i * 4 + 3] = 120; }
      octx.putImageData(id, 0, 0);
    }
    setRes(r);
  }, [pallor, blur, light, custom, overlay]);

  useEffect(render, [render]);

  const upload = (f?: File) => {
    if (!f) return;
    const img = new Image();
    img.onload = () => setCustom(img);
    img.src = URL.createObjectURL(f);
  };

  const sev = res && res.pass && res.hb !== null ? severity(res.hb) : null;
  const slider = (label: string, v: number, set: (n: number) => void, min: number, max: number, step: number, show: string) => (
    <div className="sl" style={{ ["--lw" as string]: "3.2rem", gridTemplateColumns: "3.2rem 1fr 2.8rem" }}>
      <span>{label}</span><input type="range" min={min} max={max} step={step} value={v} onChange={(e) => set(+e.target.value)} aria-label={label} /><span>{show}</span>
    </div>
  );

  return (
    <div className="stage">
      <div className="stage-h">
        <span className="mono">quality gate → segment → haemoglobin → severity</span>
        <div className="row">
          <label className="sm" style={{ cursor: "pointer" }}>upload photo<input type="file" accept="image/*" hidden onChange={(e) => upload(e.target.files?.[0])} /></label>
          {custom && <button className="sm" onClick={() => setCustom(null)}>synthetic eye</button>}
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "minmax(0,1.15fr) minmax(0,1fr)", gap: "0.8rem", alignItems: "start" }}>
        <div style={{ position: "relative", lineHeight: 0 }} onClick={() => setOverlay((o) => !o)} title="click to toggle mask">
          <canvas ref={cv} width={W} height={H} style={{ width: "100%", height: "auto", display: "block" }} aria-label="Eye image under analysis" />
          <canvas ref={ov} width={W} height={H} style={{ position: "absolute", inset: 0, width: "100%", height: "100%", pointerEvents: "none" }} />
          {res && !res.pass && <div style={{ position: "absolute", inset: 0, display: "grid", placeItems: "center", background: "color-mix(in srgb, var(--bg) 70%, transparent)", borderRadius: 8, lineHeight: 1.4 }}><span className="mono bad" style={{ textAlign: "center" }}>retake the photo</span></div>}
        </div>
        <div style={{ display: "grid", gap: "0.4rem" }}>
          {!custom && slider("pallor", pallor, setPallor, 0, 0.85, 0.01, pallor.toFixed(2))}
          {slider("blur", blur, setBlur, 0, 6, 0.25, blur + "px")}
          {slider("light", light, setLight, 0.3, 1.6, 0.05, light.toFixed(2))}
          <div className="out" style={{ marginTop: "0.2rem" }}>
            <div><span className="dim">1 gate </span>sharp {res ? res.sharp.toFixed(0) : "–"}/{BLUR_MIN} · lum {res ? res.meanL.toFixed(0) : "–"} <span className={res?.pass ? "ok" : "bad"}>{res?.pass ? "pass ✓" : "reject ✗"}</span></div>
            <div><span className="dim">2 segment </span>{res?.pass ? (res.dice !== null ? <>Dice <span className="acc">{res.dice.toFixed(2)}</span> vs truth</> : "mask drawn") : "skipped"}</div>
            <div><span className="dim">3 Hb </span>{sev && res?.hb !== null ? <>{res!.hb!.toFixed(1)} g/dL</> : "—"}</div>
            <div><span className="dim">4 class </span>{sev ? <b style={{ color: sev[1] }}>{sev[0]}</b> : "—"}</div>
          </div>
        </div>
      </div>
      <div className="out dim" style={{ fontSize: "0.64rem" }}>
        Bad capture? The gate refuses it, so it never reaches the model (garbage in, garbage out). Raise pallor and watch severity climb. Segmenter is a colour threshold standing in for UNet++ (94% Dice); the Hb mapping is a toy calibration.
      </div>
    </div>
  );
}
