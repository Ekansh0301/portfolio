import { useEffect, useRef, useState } from "react";

/**
 * The hero's ember light.
 *
 * Earlier this was a particle plume, which read as smoke being emitted and
 * left a path behind the cursor. The reference does something different: a
 * faint field of cloud sits behind the page, and the cursor is a light that
 * illuminates whatever cloud is near it. Because brightness is cloud density
 * times light, the lit area takes the billowy shape of the clouds instead of a
 * circle, and a fast sweep leaves separate glowing fragments that fade, rather
 * than a continuous streak.
 *
 * Two layers:
 *  - Cloud: domain-warped fBm noise, evaluated in a fragment shader and
 *    drifting slowly.
 *  - Light: a coarse grid on the CPU. Each frame it decays, then a soft disc
 *    is stamped at the eased cursor. The grid is uploaded as a small texture
 *    and sampled with linear filtering, so it is smooth despite the low
 *    resolution and costs almost nothing.
 *
 * Everything is advanced in 60fps-equivalent steps, so the trail fades at
 * the same wall-clock speed on a 30Hz laptop and a 120Hz display.
 */

const VERT = `
attribute vec2 aPos;
varying vec2 vUv;
void main() {
  vUv = aPos * 0.5 + 0.5;
  gl_Position = vec4(aPos, 0.0, 1.0);
}`;

const FRAG = `
#ifdef GL_FRAGMENT_PRECISION_HIGH
precision highp float;
#else
precision mediump float;
#endif

uniform vec2 uRes;
uniform float uTime;
uniform sampler2D uLight;
varying vec2 vUv;

float hash(vec2 p) {
  p = fract(p * vec2(123.34, 456.21));
  p += dot(p, p + 45.32);
  return fract(p.x * p.y);
}

float noise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  float a = hash(i);
  float b = hash(i + vec2(1.0, 0.0));
  float c = hash(i + vec2(0.0, 1.0));
  float d = hash(i + vec2(1.0, 1.0));
  return mix(a, b, u.x) + (c - a) * u.y * (1.0 - u.x) + (d - b) * u.x * u.y;
}

float fbm(vec2 p) {
  float v = 0.0;
  float amp = 0.5;
  mat2 rot = mat2(1.6, 1.2, -1.2, 1.6);
  for (int i = 0; i < 5; i++) {
    v += amp * noise(p);
    p = rot * p;
    amp *= 0.5;
  }
  return v;
}

void main() {
  vec2 p = vUv * vec2(uRes.x / uRes.y, 1.0) * 2.7;

  // Domain warping turns plain noise into billowing, clumped cloud.
  vec2 q = vec2(
    fbm(p + vec2(0.0, uTime * 0.018)),
    fbm(p + vec2(5.2, 1.3) - uTime * 0.014)
  );
  float cloud = fbm(p + 1.9 * q + uTime * 0.008);
  // Narrow contrast band for visible lumps and pockets, but never fully
  // empty: a light over a gap in the cloud should still read as a glow.
  cloud = mix(0.22, 1.0, smoothstep(0.34, 0.78, cloud));

  // Canvas rows run top-down; GL texture rows run bottom-up.
  float light = texture2D(uLight, vec2(vUv.x, 1.0 - vUv.y)).r;

  // A trace of ambient light keeps the cloud faintly present everywhere.
  float lum = cloud * (light * 1.5 + 0.045);

  vec3 deep  = vec3(0.10, 0.018, 0.016);
  vec3 ember = vec3(0.62, 0.090, 0.060);
  vec3 hot   = vec3(0.96, 0.270, 0.190);
  vec3 core  = vec3(1.00, 0.640, 0.540);

  vec3 col = mix(vec3(0.0), deep, smoothstep(0.0, 0.10, lum));
  col = mix(col, ember, smoothstep(0.08, 0.42, lum));
  col = mix(col, hot, smoothstep(0.38, 0.82, lum));
  col = mix(col, core, smoothstep(0.86, 1.30, lum));

  gl_FragColor = vec4(col, 1.0);
}`;

function compile(gl: WebGLRenderingContext, type: number, src: string) {
  const s = gl.createShader(type);
  if (!s) return null;
  gl.shaderSource(s, src);
  gl.compileShader(s);
  if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
    gl.deleteShader(s);
    return null;
  }
  return s;
}

export default function SmokeCursor() {
  const rootRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [fallback, setFallback] = useState(false);

  useEffect(() => {
    const root = rootRef.current;
    const canvas = canvasRef.current;
    if (!root || !canvas) return;

    const gl = canvas.getContext("webgl", { alpha: false, antialias: false, premultipliedAlpha: false });
    if (!gl) {
      setFallback(true);
      return;
    }

    const vs = compile(gl, gl.VERTEX_SHADER, VERT);
    const fs = compile(gl, gl.FRAGMENT_SHADER, FRAG);
    const prog = gl.createProgram();
    if (!vs || !fs || !prog) {
      setFallback(true);
      return;
    }
    gl.attachShader(prog, vs);
    gl.attachShader(prog, fs);
    gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
      setFallback(true);
      return;
    }
    gl.useProgram(prog);

    // One oversized triangle covers the viewport with no seam.
    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    const aPos = gl.getAttribLocation(prog, "aPos");
    gl.enableVertexAttribArray(aPos);
    gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);

    const uRes = gl.getUniformLocation(prog, "uRes");
    const uTime = gl.getUniformLocation(prog, "uTime");
    const uLight = gl.getUniformLocation(prog, "uLight");

    const tex = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.pixelStorei(gl.UNPACK_ALIGNMENT, 1);
    gl.uniform1i(uLight, 0);

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    // The cloud is soft by nature, so half resolution loses nothing visible
    // and quarters the per-pixel noise work.
    const RES = 0.5;
    const GRID_W = 192;

    let w = 0, h = 0, gw = 0, gh = 0;
    let light = new Float32Array(0);
    let bytes = new Uint8Array(0);

    const resize = () => {
      w = root.clientWidth;
      h = root.clientHeight;
      if (!w || !h) return;
      canvas.width = Math.max(1, Math.floor(w * RES));
      canvas.height = Math.max(1, Math.floor(h * RES));
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
      gl.viewport(0, 0, canvas.width, canvas.height);
      gw = GRID_W;
      gh = Math.max(8, Math.round(GRID_W * (h / w)));
      light = new Float32Array(gw * gh);
      bytes = new Uint8Array(gw * gh);
    };
    resize();

    const pointer = { x: w * 0.5, y: h * 0.42, has: false };
    const emitter = { x: pointer.x, y: pointer.y };

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

    /** Decay the whole grid, then stamp a soft disc at the eased cursor. */
    const updateLight = (dt: number) => {
      if (!gw) return;
      const decay = Math.pow(0.945, dt);
      for (let i = 0; i < light.length; i++) light[i] *= decay;

      const radiusPx = w < 768 ? 170 : 250;
      const cx = (emitter.x / w) * gw;
      const cy = (emitter.y / h) * gh;
      const r = (radiusPx / w) * gw;
      const x0 = Math.max(0, Math.floor(cx - r)), x1 = Math.min(gw - 1, Math.ceil(cx + r));
      const y0 = Math.max(0, Math.floor(cy - r)), y1 = Math.min(gh - 1, Math.ceil(cy + r));

      for (let y = y0; y <= y1; y++) {
        for (let x = x0; x <= x1; x++) {
          const d2 = ((x - cx) ** 2 + (y - cy) ** 2) / (r * r);
          if (d2 >= 1) continue;
          const f = (1 - d2) * (1 - d2);
          const i = y * gw + x;
          // Max, not add: a still cursor settles on a clean falloff instead of
          // saturating, and a moving one leaves a trail that only fades.
          if (f > light[i]) light[i] = f;
        }
      }

      for (let i = 0; i < light.length; i++) bytes[i] = Math.min(255, light[i] * 255) | 0;
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.LUMINANCE, gw, gh, 0, gl.LUMINANCE, gl.UNSIGNED_BYTE, bytes);
    };

    let t = 0;
    let last = performance.now();
    let raf = 0;
    let visible = true;

    const frame = (now: number) => {
      const dt = Math.min(Math.max((now - last) / 16.667, 0.2), 4);
      last = now;
      t += dt / 60;

      // Before any pointer input, drift the light on a slow lissajous path
      // so the hero is alive on load and on touch screens.
      const tx = pointer.has ? pointer.x : w * (0.5 + 0.2 * Math.sin(t * 0.35));
      const ty = pointer.has ? pointer.y : h * (0.42 + 0.12 * Math.cos(t * 0.46));
      const k = 1 - Math.pow(1 - 0.32, dt);
      emitter.x += (tx - emitter.x) * k;
      emitter.y += (ty - emitter.y) * k;

      updateLight(dt);
      gl.uniform2f(uRes, canvas.width, canvas.height);
      gl.uniform1f(uTime, t);
      gl.drawArrays(gl.TRIANGLES, 0, 3);

      if (visible && !reduce) raf = requestAnimationFrame(frame);
    };

    // The hero is one screen of a long page; stop rendering once it has
    // scrolled away instead of running a shader nobody can see.
    const io = new IntersectionObserver(([entry]) => {
      const was = visible;
      visible = entry.isIntersecting;
      if (visible && !was && !reduce) {
        last = performance.now();
        raf = requestAnimationFrame(frame);
      }
    });
    io.observe(root);

    raf = requestAnimationFrame(frame);

    return () => {
      cancelAnimationFrame(raf);
      io.disconnect();
      ro.disconnect();
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("resize", resize);
      gl.deleteTexture(tex);
      gl.deleteBuffer(buf);
      gl.deleteProgram(prog);
    };
  }, []);

  return (
    <div ref={rootRef} className="ghost-cursor pointer-events-none absolute inset-0 z-[2]">
      {fallback ? (
        // No WebGL: a static ember bloom so the hero still has its warmth.
        <div
          className="absolute inset-0"
          style={{
            background:
              "radial-gradient(38% 45% at 50% 42%, rgba(200,50,36,0.32) 0%, rgba(120,24,18,0.12) 45%, rgba(0,0,0,0) 72%)",
          }}
        />
      ) : (
        <canvas
          ref={canvasRef}
          className="absolute inset-0 h-full w-full"
          style={{ mixBlendMode: "screen" }}
        />
      )}
    </div>
  );
}
