import type { Project } from "../data/content";

const ACCENTS: Record<Project["accent"], [string, string]> = {
  ember: ["#b8342b", "#801e18"],
  orange: ["#fc6b2f", "#a02a22"],
  steel: ["#5b7fa8", "#2a3f56"],
  violet: ["#8b5cf6", "#4c2d8f"],
};

/**
 * Generated cover art per project. Each one draws the architecture described
 * in that repo's README rather than a stock screenshot: the hash ring for
 * QuorumKV, the critic ensemble for The Director, the split control and data
 * planes for the storage system.
 */
export default function ProjectCover({ project }: { project: Project }) {
  const [a, b] = ACCENTS[project.accent];
  const id = project.title.replace(/\W/g, "");
  const p = { id, a, b };

  return (
    <svg
      viewBox="0 0 640 360"
      className="absolute inset-0 h-full w-full"
      preserveAspectRatio="xMidYMid slice"
      aria-hidden="true"
    >
      <defs>
        <radialGradient id={`g-${id}`} cx="50%" cy="45%" r="65%">
          <stop offset="0%" stopColor={a} stopOpacity="0.42" />
          <stop offset="55%" stopColor={b} stopOpacity="0.16" />
          <stop offset="100%" stopColor="#050505" stopOpacity="0" />
        </radialGradient>
        <linearGradient id={`l-${id}`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor={a} stopOpacity="0.9" />
          <stop offset="100%" stopColor={b} stopOpacity="0.25" />
        </linearGradient>
      </defs>

      <rect width="640" height="360" fill="#0a0a0b" />
      <rect width="640" height="360" fill={`url(#g-${id})`} />

      {/* Fine technical grid */}
      <g stroke={a} strokeOpacity="0.07">
        {Array.from({ length: 16 }, (_, i) => (
          <line key={`v${i}`} x1={i * 40} y1="0" x2={i * 40} y2="360" />
        ))}
        {Array.from({ length: 9 }, (_, i) => (
          <line key={`h${i}`} x1="0" y1={i * 40} x2="640" y2={i * 40} />
        ))}
      </g>

      {project.kind === "ring" && <Ring {...p} />}
      {project.kind === "critics" && <Critics {...p} />}
      {project.kind === "voice" && <Voice {...p} />}
      {project.kind === "cipher" && <Cipher {...p} />}
      {project.kind === "leaf" && <Leaf {...p} />}
      {project.kind === "planes" && <Planes {...p} />}
    </svg>
  );
}

type P = { id: string; a: string; b: string };

/* QuorumKV: consistent hash ring, virtual nodes, one replica set of N=3 lit. */
function Ring({ id, a }: P) {
  const cx = 320, cy = 180, r = 104;
  const nodes = Array.from({ length: 18 }, (_, i) => {
    const t = (i / 18) * Math.PI * 2 - Math.PI / 2;
    return {
      x: cx + Math.cos(t) * r,
      y: cy + Math.sin(t) * r,
      primary: i % 3 === 0,
      replica: i >= 1 && i <= 3,
    };
  });
  return (
    <g>
      <circle cx={cx} cy={cy} r={r} fill="none" stroke={a} strokeOpacity="0.28" />
      <circle cx={cx} cy={cy} r={r - 30} fill="none" stroke={a} strokeOpacity="0.1" strokeDasharray="3 7" />
      {/* the N=3 preference list a key lands on */}
      <path
        d={`M ${cx + Math.cos(-Math.PI / 2 + 0.32) * r} ${cy + Math.sin(-Math.PI / 2 + 0.32) * r}
            A ${r} ${r} 0 0 1 ${cx + Math.cos(-Math.PI / 2 + 1.1) * r} ${cy + Math.sin(-Math.PI / 2 + 1.1) * r}`}
        fill="none" stroke={`url(#l-${id})`} strokeWidth="3.5" strokeLinecap="round"
      />
      {nodes.map((n, i) => (
        <circle
          key={i} cx={n.x} cy={n.y} r={n.replica ? 6 : n.primary ? 4.5 : 2.2}
          fill={n.replica ? a : n.primary ? "#1a1a1c" : "#050505"}
          fillOpacity={n.replica ? 0.95 : 1}
          stroke={a} strokeOpacity={n.replica ? 1 : 0.45} strokeWidth="1.2"
        />
      ))}
      <circle cx={cx} cy={cy} r="3" fill={a} fillOpacity="0.5" />
    </g>
  );
}

/* The Director: four critics scored in parallel, weighted into one reward. */
function Critics({ id, a }: P) {
  const labels = [0, 1, 2, 3];
  const ys = [76, 142, 208, 274];
  const weights = [0.42, 0.86, 0.3, 0.62];
  return (
    <g>
      {labels.map((i) => (
        <g key={i}>
          <rect x="96" y={ys[i] - 17} width="118" height="34" rx="6"
            fill="#0e0e10" stroke={a} strokeOpacity={0.3 + weights[i] * 0.6} strokeWidth="1.2" />
          {/* weight bar inside each critic */}
          <rect x="102" y={ys[i] + 6} width={106 * weights[i]} height="3" rx="1.5"
            fill={a} fillOpacity={0.35 + weights[i] * 0.5} />
          <path
            d={`M 214 ${ys[i]} C 268 ${ys[i]}, 286 180, 330 180`}
            fill="none" stroke={a} strokeOpacity={0.12 + weights[i] * 0.55}
            strokeWidth={0.8 + weights[i] * 2.2}
          />
        </g>
      ))}
      {/* weighted sum */}
      <circle cx="348" cy="180" r="22" fill="#0e0e10" stroke={a} strokeOpacity="0.85" strokeWidth="1.5" />
      <path d="M 340 172 L 356 172 M 340 180 L 352 180 M 340 188 L 356 188"
        stroke={a} strokeOpacity="0.9" strokeWidth="1.6" strokeLinecap="round" />
      <path d="M 370 180 L 452 180" stroke={`url(#l-${id})`} strokeWidth="3" strokeLinecap="round" />
      <rect x="452" y="152" width="96" height="56" rx="8"
        fill={`url(#l-${id})`} fillOpacity="0.28" stroke={a} strokeOpacity="0.8" />
      <path d="M 468 172 L 532 172 M 468 182 L 516 182 M 468 192 L 524 192"
        stroke={a} strokeOpacity="0.75" strokeWidth="2" strokeLinecap="round" />
    </g>
  );
}

/* Vox: push-to-talk waveform running through the on-device pipeline. */
function Voice({ id, a }: P) {
  const bars = Array.from({ length: 42 }, (_, i) => {
    const t = i / 41;
    // envelope: quiet, a burst of speech, quiet again
    const env = Math.exp(-Math.pow((t - 0.5) * 3.1, 2));
    const h = (10 + Math.abs(Math.sin(i * 1.7)) * 74 + Math.sin(i * 0.6) * 16) * env + 4;
    return { x: 92 + i * 11.2, h: Math.max(4, h) };
  });
  return (
    <g>
      {bars.map((s, i) => (
        <rect
          key={i} x={s.x} y={168 - s.h / 2} width="4.4" height={s.h} rx="2.2"
          fill={`url(#l-${id})`}
          fillOpacity={0.35 + (s.h / 90) * 0.6}
        />
      ))}
      {/* pipeline: mic -> stt -> llm -> tts, all on-device */}
      <g stroke={a} strokeOpacity="0.5">
        <line x1="92" y1="262" x2="548" y2="262" strokeDasharray="2 6" />
      </g>
      {[
        { x: 118, r: 9 }, { x: 264, r: 7 }, { x: 396, r: 7 }, { x: 528, r: 9 },
      ].map((n, i) => (
        <circle key={i} cx={n.x} cy="262" r={n.r}
          fill={i === 0 || i === 3 ? a : "#0e0e10"} fillOpacity={i === 0 || i === 3 ? 0.85 : 1}
          stroke={a} strokeOpacity="0.8" strokeWidth="1.3" />
      ))}
    </g>
  );
}

/* CryptoStack: a 4x4 block-cipher state mid-diffusion. */
function Cipher({ id, a }: P) {
  const cells = Array.from({ length: 16 }, (_, i) => ({
    x: 236 + (i % 4) * 46,
    y: 96 + Math.floor(i / 4) * 46,
    on: [0, 3, 5, 6, 9, 10, 12, 15].includes(i),
  }));
  return (
    <g>
      {cells.map((c, i) => (
        <rect key={i} x={c.x} y={c.y} width="36" height="36" rx="4"
          fill={c.on ? `url(#l-${id})` : "#0e0e10"} fillOpacity={c.on ? 0.8 : 1}
          stroke={a} strokeOpacity={c.on ? 0.8 : 0.22} strokeWidth="1" />
      ))}
      <path d="M 200 114 L 224 114 M 200 160 L 224 160 M 200 206 L 224 206 M 200 252 L 224 252"
        stroke={a} strokeOpacity="0.4" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M 416 114 L 440 114 M 416 160 L 440 160 M 416 206 L 440 206 M 416 252 L 440 252"
        stroke={a} strokeOpacity="0.4" strokeWidth="1.5" strokeLinecap="round" />
    </g>
  );
}

/* CropGuard: a leaf under a classification scan. */
function Leaf({ id, a }: P) {
  return (
    <g>
      {/* leaf body */}
      <path
        d="M 320 74 C 400 108, 434 176, 400 244 C 372 298, 320 300, 320 300
           C 320 300, 268 298, 240 244 C 206 176, 240 108, 320 74 Z"
        fill={`url(#l-${id})`} fillOpacity="0.22" stroke={a} strokeOpacity="0.75" strokeWidth="1.6"
      />
      {/* midrib and veins */}
      <path d="M 320 84 L 320 296" stroke={a} strokeOpacity="0.6" strokeWidth="1.6" />
      {[110, 145, 180, 215, 250].map((y, i) => (
        <g key={i} stroke={a} strokeOpacity="0.34" strokeWidth="1.1">
          <path d={`M 320 ${y} C 296 ${y + 4}, 274 ${y + 16}, 256 ${y + 34}`} fill="none" />
          <path d={`M 320 ${y} C 344 ${y + 4}, 366 ${y + 16}, 384 ${y + 34}`} fill="none" />
        </g>
      ))}
      {/* lesion, and the box the classifier draws round it */}
      <ellipse cx="358" cy="196" rx="21" ry="15" fill={a} fillOpacity="0.55" />
      <rect x="328" y="170" width="62" height="52" fill="none"
        stroke={a} strokeOpacity="0.95" strokeWidth="1.6" strokeDasharray="7 4" />
      {/* confidence bars */}
      {[0.86, 0.34, 0.16].map((w, i) => (
        <g key={i}>
          <rect x="452" y={150 + i * 22} width="96" height="7" rx="3.5" fill="#0e0e10"
            stroke={a} strokeOpacity="0.25" />
          <rect x="452" y={150 + i * 22} width={96 * w} height="7" rx="3.5"
            fill={a} fillOpacity={i === 0 ? 0.9 : 0.4} />
        </g>
      ))}
    </g>
  );
}

/* Storage system: metadata plane resolves, then data streams straight through. */
function Planes({ id, a }: P) {
  return (
    <g>
      {/* control plane */}
      <rect x="238" y="52" width="164" height="60" rx="8"
        fill="#0e0e10" stroke={a} strokeOpacity="0.8" strokeWidth="1.4" />
      <path d="M 256 74 L 322 74 M 256 86 L 300 86 M 256 96 L 312 96"
        stroke={a} strokeOpacity="0.6" strokeWidth="1.8" strokeLinecap="round" />
      {/* LRU cache slots on the naming server */}
      {[0, 1, 2].map((i) => (
        <rect key={i} x={344 + i * 16} y="74" width="11" height="24" rx="2"
          fill={i === 0 ? a : "#050505"} fillOpacity={i === 0 ? 0.85 : 1}
          stroke={a} strokeOpacity="0.5" />
      ))}

      {/* client */}
      <rect x="52" y="152" width="94" height="56" rx="8"
        fill="#0e0e10" stroke={a} strokeOpacity="0.7" strokeWidth="1.3" />
      {/* storage nodes */}
      {[0, 1, 2].map((i) => (
        <rect key={i} x="494" y={92 + i * 70} width="94" height="52" rx="8"
          fill={i === 1 ? `url(#l-${id})` : "#0e0e10"} fillOpacity={i === 1 ? 0.3 : 1}
          stroke={a} strokeOpacity={i === 1 ? 0.9 : 0.35} strokeWidth="1.3" />
      ))}

      {/* metadata lookup: client -> NS -> back (dashed, control) */}
      <path d="M 99 152 L 99 82 L 238 82" fill="none"
        stroke={a} strokeOpacity="0.5" strokeWidth="1.3" strokeDasharray="5 5" />
      <path d="M 402 82 L 470 82 L 470 118" fill="none"
        stroke={a} strokeOpacity="0.5" strokeWidth="1.3" strokeDasharray="5 5" />

      {/* data path: client streams straight to the storage node (solid, thick) */}
      <path d="M 146 180 L 494 188" fill="none"
        stroke={`url(#l-${id})`} strokeWidth="3.4" strokeLinecap="round" />
      <circle cx="330" cy="184" r="4" fill={a} />
    </g>
  );
}
