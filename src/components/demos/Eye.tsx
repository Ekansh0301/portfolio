import { useCallback, useEffect, useRef, useState } from "react";

/**
 * The anaemia app's flow, run for real on pixels: capture inside a guide box,
 * (1) image-quality gate (Laplacian-variance blur + brightness histogram),
 * (2) segment the palpebral conjunctiva, (3) estimate haemoglobin, (4) WHO
 * severity, then save the reading to the patient's history. The segmenter is a
 * colour threshold standing in for UNet++ and the Hb mapping is a toy
 * calibration on the synthetic eye: the point is the pipeline, not the model.
 */
const W = 240, H = 150;
const BLUR_MIN = 55;
const LUM: [number, number] = [70, 215];
const BINS = 32;

// Pallor: 0 = deep red conjunctiva, 1 = very pale.
const conj = (p: number) => [190 + 35 * p, 45 + 100 * p, 55 + 95 * p];

// The palpebral conjunctiva is the thin crescent on the inside of the pulled-down lower lid.
const inA = (x: number, y: number) => ((x - 120) / 74) ** 2 + ((y - 106) / 24) ** 2 <= 1;
const inB = (x: number, y: number) => ((x - 120) / 78) ** 2 + ((y - 92) / 22) ** 2 <= 1;

const TRUTH = (() => {
  const m = new Uint8Array(W * H);
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) m[y * W + x] = inA(x, y) && !inB(x, y) ? 1 : 0;
  return m;
})();

function drawEye(ctx: CanvasRenderingContext2D, pallor: number) {
  const g = ctx.createLinearGradient(0, 0, 0, H);
  g.addColorStop(0, "rgb(214,166,134)"); g.addColorStop(1, "rgb(196,146,116)");
  ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = "#f1ece6"; ctx.beginPath(); ctx.ellipse(120, 58, 78, 32, 0, 0, Math.PI * 2); ctx.fill();   // sclera
  ctx.fillStyle = "#4a3326"; ctx.beginPath(); ctx.arc(120, 56, 23, 0, Math.PI * 2); ctx.fill();             // iris
  ctx.fillStyle = "#0b0907"; ctx.beginPath(); ctx.arc(120, 56, 9, 0, Math.PI * 2); ctx.fill();              // pupil
  const t = document.createElement("canvas"); t.width = W; t.height = H;
  const c = t.getContext("2d")!;
  const [r, gg, b] = conj(pallor);
  c.fillStyle = `rgb(${r},${gg},${b})`; c.beginPath(); c.ellipse(120, 106, 74, 24, 0, 0, Math.PI * 2); c.fill();
  c.strokeStyle = `rgba(${r - 50},${gg - 30},${b - 30},0.5)`; c.lineWidth = 1;                              // vessels
  for (let i = 0; i < 16; i++) { const x = 58 + i * 8.5; c.beginPath(); c.moveTo(x, 112 + (i % 3)); c.quadraticCurveTo(x + 3, 120, x - 2, 130); c.stroke(); }
  c.globalCompositeOperation = "destination-out";
  c.beginPath(); c.ellipse(120, 92, 78, 22, 0, 0, Math.PI * 2); c.fill();
  ctx.drawImage(t, 0, 0);
}

function analyse(img: ImageData, haveTruth: boolean) {
  const { data } = img;
  const lum = new Float32Array(W * H);
  const hist = new Array(BINS).fill(0);
  let sumL = 0;
  for (let i = 0; i < W * H; i++) {
    lum[i] = 0.299 * data[i * 4] + 0.587 * data[i * 4 + 1] + 0.114 * data[i * 4 + 2];
    sumL += lum[i];
    hist[Math.min(BINS - 1, Math.floor((lum[i] / 256) * BINS))]++;
  }
  const meanL = sumL / (W * H);
  let s = 0, s2 = 0, n = 0; // variance of the Laplacian: the standard cheap sharpness score
  for (let y = 1; y < H - 1; y++) for (let x = 1; x < W - 1; x++) {
    const i = y * W + x;
    const v = lum[i - 1] + lum[i + 1] + lum[i - W] + lum[i + W] - 4 * lum[i];
    s += v; s2 += v * v; n++;
  }
  const sharp = s2 / n - (s / n) ** 2;
  const pass = sharp >= BLUR_MIN && meanL >= LUM[0] && meanL <= LUM[1];

  const mask = new Uint8Array(W * H);
  let cnt = 0, ratioSum = 0, inter = 0, tcount = 0;
  for (let i = 0; i < W * H; i++) {
    const r = data[i * 4], g = data[i * 4 + 1];
    const ratio = g / Math.max(r, 1);
    if (r > 120 && ratio < 0.7) { mask[i] = 1; cnt++; ratioSum += ratio; }
    if (haveTruth) { tcount += TRUTH[i]; if (mask[i] && TRUTH[i]) inter++; }
  }
  const dice = haveTruth && cnt + tcount ? (2 * inter) / (cnt + tcount) : null;
  const ratio = cnt ? ratioSum / cnt : null;
  // Toy calibration: a paler (higher g/r) conjunctiva means lower haemoglobin.
  const hb = ratio === null ? null : Math.max(4, Math.min(15.5, 14.5 - ((ratio - 0.3) / 0.32) * 9));
  return { sharp, meanL, pass, mask, dice, hb, hist };
}

// WHO haemoglobin cut-offs for non-pregnant adult women, g/dL.
const severity = (hb: number): [string, string] => (hb >= 12 ? ["Normal", "var(--ok)"] : hb >= 11 ? ["Mild", "var(--accent)"] : hb >= 8 ? ["Moderate", "var(--accent)"] : ["Severe", "var(--bad)"]);
const yOf = (hb: number) => 4 + (1 - (hb - 4) / 11.5) * 32;

export default function Eye() {
  const cv = useRef<HTMLCanvasElement>(null);
  const ov = useRef<HTMLCanvasElement>(null);
  const roi = useRef<HTMLCanvasElement>(null);
  const [pallor, setPallor] = useState(0.2);
  const [blur, setBlur] = useState(0);
  const [light, setLight] = useState(1);
  const [custom, setCustom] = useState<HTMLImageElement | null>(null);
  const [res, setRes] = useState<ReturnType<typeof analyse> | null>(null);
  const [overlay, setOverlay] = useState(true);
  const [history, setHistory] = useState<number[]>([]);

  const render = useCallback(() => {
    const c = cv.current, o = ov.current, rc = roi.current;
    if (!c || !o || !rc) return;
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
    const img = ctx.getImageData(0, 0, W, H);
    const r = analyse(img, !custom);

    const octx = o.getContext("2d")!;
    octx.clearRect(0, 0, W, H);
    const rctx = rc.getContext("2d")!;
    rctx.clearRect(0, 0, rc.width, rc.height);
    if (r.pass) {
      if (overlay) {
        const id = octx.createImageData(W, H);
        for (let i = 0; i < W * H; i++) if (r.mask[i]) { id.data[i * 4] = 40; id.data[i * 4 + 1] = 120; id.data[i * 4 + 2] = 255; id.data[i * 4 + 3] = 120; }
        octx.putImageData(id, 0, 0);
      }
      // "Analyzed Image": the extracted region of interest, background removed.
      let x0 = W, x1 = 0, y0 = H, y1 = 0;
      for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (r.mask[y * W + x]) { x0 = Math.min(x0, x); x1 = Math.max(x1, x); y0 = Math.min(y0, y); y1 = Math.max(y1, y); }
      if (x1 > x0 && y1 > y0) {
        const cut = rctx.createImageData(x1 - x0 + 1, y1 - y0 + 1);
        for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) {
          const i = y * W + x, j = ((y - y0) * cut.width + (x - x0)) * 4;
          if (r.mask[i]) { cut.data[j] = img.data[i * 4]; cut.data[j + 1] = img.data[i * 4 + 1]; cut.data[j + 2] = img.data[i * 4 + 2]; cut.data[j + 3] = 255; }
        }
        const tmp = document.createElement("canvas"); tmp.width = cut.width; tmp.height = cut.height;
        tmp.getContext("2d")!.putImageData(cut, 0, 0);
        const k = Math.min(rc.width / cut.width, rc.height / cut.height);
        rctx.drawImage(tmp, (rc.width - cut.width * k) / 2, (rc.height - cut.height * k) / 2, cut.width * k, cut.height * k);
      }
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

  const ok = Boolean(res?.pass && res.hb !== null);
  const sev = ok ? severity(res!.hb!) : null;
  const hmax = res ? Math.max(...res.hist) : 1;
  const slider = (label: string, v: number, set: (n: number) => void, min: number, max: number, step: number, show: string) => (
    <div className="sl" style={{ ["--lw" as string]: "3rem", gridTemplateColumns: "3rem 1fr 2.8rem" }}>
      <span>{label}</span><input type="range" min={min} max={max} step={step} value={v} onChange={(e) => set(+e.target.value)} aria-label={label} /><span>{show}</span>
    </div>
  );

  return (
    <div className="stage">
      <div className="stage-h">
        <span className="mono">capture → quality gate → segment → Hb → class → history</span>
        <div className="row">
          <label className="sm" style={{ cursor: "pointer" }}>upload photo<input type="file" accept="image/*" hidden onChange={(e) => upload(e.target.files?.[0])} /></label>
          {custom && <button className="sm" onClick={() => setCustom(null)}>synthetic eye</button>}
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "minmax(0,1.1fr) minmax(0,1fr)", gap: "0.8rem", alignItems: "start" }}>
        <div>
          <div style={{ position: "relative", lineHeight: 0 }} onClick={() => setOverlay((o) => !o)} title="click to toggle the mask">
            <canvas ref={cv} width={W} height={H} style={{ width: "100%", height: "auto", display: "block" }} aria-label="Captured eye image" />
            <canvas ref={ov} width={W} height={H} style={{ position: "absolute", inset: 0, width: "100%", height: "100%", pointerEvents: "none" }} />
            <div style={{ position: "absolute", left: "12%", top: "40%", width: "76%", height: "52%", border: "1.5px dashed color-mix(in srgb, var(--accent) 80%, white)", borderRadius: 6, pointerEvents: "none" }} />
            {res && !res.pass && <div style={{ position: "absolute", inset: 0, display: "grid", placeItems: "center", background: "color-mix(in srgb, var(--bg) 72%, transparent)", borderRadius: 8 }}><span className="mono bad">retake the photo</span></div>}
          </div>
          <svg viewBox={`0 0 ${BINS} 10`} preserveAspectRatio="none" style={{ height: 26, marginTop: 4, display: "block" }} aria-label="Brightness histogram">
            <rect x={(LUM[0] / 256) * BINS} width={((LUM[1] - LUM[0]) / 256) * BINS} y="0" height="10" fill="color-mix(in srgb, var(--ok) 14%, transparent)" />
            {res?.hist.map((h, i) => <rect key={i} x={i + 0.1} width="0.8" y={10 - (h / hmax) * 10} height={(h / hmax) * 10} fill="var(--ink-3)" />)}
          </svg>
          <div className="mono dim" style={{ fontSize: "0.58rem" }}>brightness · green = OK</div>
        </div>

        <div style={{ display: "grid", gap: "0.4rem" }}>
          {!custom && slider("pallor", pallor, setPallor, 0, 0.85, 0.01, pallor.toFixed(2))}
          {slider("blur", blur, setBlur, 0, 6, 0.25, blur + "px")}
          {slider("light", light, setLight, 0.3, 1.6, 0.05, light.toFixed(2))}
          <div className="out" style={{ marginTop: "0.2rem" }}>
            <div><span className="dim">1 gate </span>sharp {res ? res.sharp.toFixed(0) : "–"}/{BLUR_MIN} · lum {res ? res.meanL.toFixed(0) : "–"} <span className={res?.pass ? "ok" : "bad"}>{res?.pass ? "✓" : "✗ reject"}</span></div>
            <div><span className="dim">2 segment </span>{res?.pass ? (res.dice !== null ? <>Dice <span className="acc">{res.dice.toFixed(2)}</span></> : "mask drawn") : "skipped"}</div>
          </div>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "minmax(0,0.9fr) minmax(0,0.8fr) minmax(0,1.1fr)", gap: "0.7rem", alignItems: "center", border: "1px solid var(--rule)", borderRadius: 8, padding: "0.5rem 0.65rem", background: "var(--card)" }}>
        <div>
          <div className="mono dim" style={{ fontSize: "0.56rem", marginBottom: 2 }}>analyzed image</div>
          <canvas ref={roi} width={120} height={40} style={{ width: "100%", height: "auto", background: "var(--bg-2)", borderRadius: 4, display: "block" }} aria-label="Extracted conjunctiva region" />
        </div>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontFamily: "var(--serif)", fontSize: "1.55rem", lineHeight: 1 }}>{ok ? res!.hb!.toFixed(1) : "—"}<span className="mono dim" style={{ fontSize: "0.6rem" }}> g/dL</span></div>
          <div className="mono" style={{ marginTop: 3, color: sev ? sev[1] : "var(--ink-3)", fontWeight: 600 }}>{sev ? sev[0] : "no result"}</div>
        </div>
        <div>
          <div className="row" style={{ justifyContent: "space-between", marginBottom: 2 }}>
            <span className="mono dim" style={{ fontSize: "0.56rem" }}>patient history</span>
            <button className="sm" style={{ padding: "0.12rem 0.45rem", fontSize: "0.6rem" }} disabled={!ok} onClick={() => setHistory((h) => [...h.slice(-7), res!.hb!])}>save</button>
          </div>
          <svg viewBox="0 0 80 40" style={{ height: 38, display: "block" }} aria-label="Haemoglobin readings over time">
            {[8, 11, 12].map((z) => <line key={z} x1="0" x2="80" y1={yOf(z)} y2={yOf(z)} stroke="var(--rule)" strokeDasharray="2 2" strokeWidth="0.6" />)}
            {history.length > 1 && <polyline points={history.map((h, i) => `${4 + (i / (history.length - 1)) * 72},${yOf(h)}`).join(" ")} fill="none" stroke="var(--accent)" strokeWidth="1.2" />}
            {history.map((h, i) => <circle key={i} cx={history.length > 1 ? 4 + (i / (history.length - 1)) * 72 : 40} cy={yOf(h)} r="1.8" fill="var(--accent)" />)}
          </svg>
        </div>
      </div>
      <div className="out dim" style={{ fontSize: "0.62rem" }}>
        A blurred or dark photo is refused before it reaches the model. Raise pallor, save a few readings, and the trend appears. Segmenter: colour threshold standing in for UNet++ (94% Dice). Hb mapping: toy calibration.
      </div>
    </div>
  );
}
