import { useEffect, useRef } from "react";

/** Resolution of the generated cloud texture. It is scaled up to fill the
 *  hero, which is fine because the field is soft by nature. */
const TEX_W = 512;
const TEX_H = 288;

/** Tileable value-noise fBm. Lattice coordinates wrap, so the texture can be
 *  drifted across the hero forever without a visible seam. */
function buildCloudTexture(seed: number): HTMLCanvasElement {
  const cells = 8; // lattice period, in cells across the texture

  const hash = (x: number, y: number) => {
    const n = Math.sin((x & 255) * 127.1 + (y & 255) * 311.7 + seed * 74.7) * 43758.5453;
    return n - Math.floor(n);
  };
  const smooth = (t: number) => t * t * (3 - 2 * t);

  const noise = (x: number, y: number, period: number) => {
    const xi = Math.floor(x), yi = Math.floor(y);
    const xf = x - xi, yf = y - yi;
    const x0 = ((xi % period) + period) % period;
    const y0 = ((yi % period) + period) % period;
    const x1 = (x0 + 1) % period;
    const y1 = (y0 + 1) % period;
    const u = smooth(xf), v = smooth(yf);
    const a = hash(x0, y0), b = hash(x1, y0), c = hash(x0, y1), d = hash(x1, y1);
    return a * (1 - u) * (1 - v) + b * u * (1 - v) + c * (1 - u) * v + d * u * v;
  };

  const fbm = (x: number, y: number) => {
    let sum = 0, amp = 0.5, freq = 1, norm = 0;
    for (let o = 0; o < 5; o++) {
      sum += noise(x * freq, y * freq, cells * freq) * amp;
      norm += amp;
      amp *= 0.5;
      freq *= 2;
    }
    return sum / norm;
  };

  const cv = document.createElement("canvas");
  cv.width = TEX_W;
  cv.height = TEX_H;
  const ctx = cv.getContext("2d")!;
  const img = ctx.createImageData(TEX_W, TEX_H);
  const px = img.data;

  for (let y = 0; y < TEX_H; y++) {
    for (let x = 0; x < TEX_W; x++) {
      const n = fbm((x / TEX_W) * cells, (y / TEX_H) * cells);
      // Push the field towards wisps: most of it empty, with dense billows.
      let d = (n - 0.50) / 0.50;
      d = d > 0 ? Math.pow(d, 1.45) : 0;
      const a = Math.min(d, 1);
      const i = (y * TEX_W + x) * 4;
      // Denser cores run hotter, thin edges fall to deep ember.
      px[i] = 176 + a * 76;
      px[i + 1] = 22 + a * 92;
      px[i + 2] = 16 + a * 46;
      px[i + 3] = a * 255;
    }
  }
  ctx.putImageData(img, 0, 0);
  return cv;
}

/**
 * The hero's ember cloud.
 *
 * This is a lighting effect, not an emitter: a cloud field covers the whole
 * hero at all times, and the pointer is a lamp that reveals the part of it
 * standing nearby. Drawing a glow at the cursor instead produces a smooth blob
 * that slides over the background, which is not what the reference does.
 *
 * Two drifting copies of a tileable noise texture give the field its slow
 * billow; a radial mask multiplies in the falloff; the result is composited
 * with `screen` so it lifts the background rather than painting over it.
 */
export default function SmokeCursor() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const root = rootRef.current;
    if (!canvas || !root) return;
    const ctx = canvas.getContext("2d", { alpha: true });
    if (!ctx) return;

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    // The field is soft and gets blurred, so half resolution costs nothing
    // visually and quarters the area the SVG filter has to process.
    const RES = 0.5;
    let w = 0, h = 0;

    const cloudA = buildCloudTexture(1);
    const cloudB = buildCloudTexture(7);

    // Scratch layer where the clouds get masked down to the lit region.
    const lit = document.createElement("canvas");
    const litCtx = lit.getContext("2d")!;

    const resize = () => {
      w = root.clientWidth;
      h = root.clientHeight;
      if (!w || !h) return;
      canvas.width = Math.max(1, Math.floor(w * RES));
      canvas.height = Math.max(1, Math.floor(h * RES));
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
      ctx.setTransform(RES, 0, 0, RES, 0, 0);
      lit.width = canvas.width;
      lit.height = canvas.height;
      litCtx.setTransform(RES, 0, 0, RES, 0, 0);
    };
    resize();

    const pointer = { x: w * 0.5, y: h * 0.45, has: false };
    const lamp = { x: pointer.x, y: pointer.y };
    let t = 0;

    const onMove = (e: PointerEvent) => {
      const r = root.getBoundingClientRect();
      pointer.x = e.clientX - r.left;
      pointer.y = e.clientY - r.top;
      pointer.has = true;
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("resize", resize);
    const ro = new ResizeObserver(resize);
    ro.observe(root);

    /** Draw the cloud field, tiled, at a given drift offset and scale. */
    const drawField = (
      c: CanvasRenderingContext2D,
      tex: HTMLCanvasElement,
      ox: number,
      oy: number,
      scale: number,
      alpha: number,
    ) => {
      const tw = w * scale;
      const th = h * scale;
      const startX = -(((ox % tw) + tw) % tw);
      const startY = -(((oy % th) + th) % th);
      c.globalAlpha = alpha;
      for (let x = startX; x < w; x += tw) {
        for (let y = startY; y < h; y += th) {
          c.drawImage(tex, x, y, tw, th);
        }
      }
      c.globalAlpha = 1;
    };

    let raf = 0;
    let last = performance.now();

    const render = (now: number) => {
      const dt = Math.min(Math.max((now - last) / 16.667, 0.2), 4);
      last = now;
      t += 0.0016 * dt;

      // Before any pointer input the lamp drifts on its own.
      const tx = pointer.has ? pointer.x : w * (0.5 + 0.2 * Math.sin(t * 3));
      const ty = pointer.has ? pointer.y : h * (0.46 + 0.14 * Math.cos(t * 4));
      const k = 1 - Math.pow(1 - 0.45, dt);
      lamp.x += (tx - lamp.x) * k;
      lamp.y += (ty - lamp.y) * k;

      ctx.clearRect(0, 0, w, h);

      // --- 1. the clouds as they sit unlit: barely there, but present ---
      ctx.globalCompositeOperation = "source-over";
      drawField(ctx, cloudA, t * 260, -t * 90, 1.45, 0.042);
      drawField(ctx, cloudB, -t * 170, t * 60, 1.05, 0.03);

      // --- 2. the same clouds, masked to the lamp's reach ---
      litCtx.setTransform(RES, 0, 0, RES, 0, 0);
      litCtx.globalCompositeOperation = "source-over";
      litCtx.clearRect(0, 0, w, h);
      drawField(litCtx, cloudA, t * 260, -t * 90, 1.45, 1);
      drawField(litCtx, cloudB, -t * 170, t * 60, 1.05, 0.75);

      const R = w < 768 ? 300 : 460;
      litCtx.globalCompositeOperation = "destination-in";
      const falloff = litCtx.createRadialGradient(lamp.x, lamp.y, 0, lamp.x, lamp.y, R);
      falloff.addColorStop(0, "rgba(255,255,255,1)");
      falloff.addColorStop(0.24, "rgba(255,255,255,0.88)");
      falloff.addColorStop(0.46, "rgba(255,255,255,0.5)");
      falloff.addColorStop(0.68, "rgba(255,255,255,0.2)");
      falloff.addColorStop(0.86, "rgba(255,255,255,0.035)");
      falloff.addColorStop(1, "rgba(255,255,255,0)");
      litCtx.fillStyle = falloff;
      litCtx.fillRect(0, 0, w, h);
      litCtx.globalCompositeOperation = "source-over";

      // Two passes: the lit clouds, then a hotter core where they are densest.
      ctx.globalCompositeOperation = "lighter";
      ctx.globalAlpha = 1;
      ctx.drawImage(lit, 0, 0, w, h);
      ctx.globalAlpha = 0.9;
      ctx.drawImage(lit, 0, 0, w, h);
      ctx.globalAlpha = 0.45;
      ctx.drawImage(lit, 0, 0, w, h);
      ctx.globalAlpha = 1;

      // --- 3. a small hot centre, so the lamp itself reads as a source ---
      const core = ctx.createRadialGradient(lamp.x, lamp.y, 0, lamp.x, lamp.y, R * 0.42);
      core.addColorStop(0, "rgba(252, 130, 80, 0.22)");
      core.addColorStop(0.45, "rgba(214, 52, 38, 0.09)");
      core.addColorStop(1, "rgba(150, 28, 20, 0)");
      ctx.fillStyle = core;
      ctx.fillRect(0, 0, w, h);

      ctx.globalCompositeOperation = "source-over";
      raf = requestAnimationFrame(render);
    };

    if (!reduce) raf = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return (
    <div ref={rootRef} className="ghost-cursor pointer-events-none absolute inset-0 z-[2]">
      {/* Turbulence keeps the tiled noise from reading as a repeating pattern. */}
      <svg width="0" height="0" className="absolute" aria-hidden="true">
        <filter id="smoke-displace" x="-30%" y="-30%" width="160%" height="160%">
          <feTurbulence
            type="fractalNoise"
            baseFrequency="0.009 0.013"
            numOctaves={3}
            seed={7}
            result="noise"
          >
            <animate
              attributeName="baseFrequency"
              dur="28s"
              values="0.009 0.013; 0.014 0.008; 0.009 0.013"
              repeatCount="indefinite"
            />
          </feTurbulence>
          <feDisplacementMap
            in="SourceGraphic"
            in2="noise"
            scale={34}
            xChannelSelector="R"
            yChannelSelector="G"
          />
        </filter>
      </svg>

      <canvas
        ref={canvasRef}
        className="absolute inset-0 h-full w-full"
        style={{
          mixBlendMode: "screen",
          filter: "url(#smoke-displace) blur(7px) saturate(1.2)",
        }}
      />
    </div>
  );
}
