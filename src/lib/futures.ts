/**
 * A small, honest model of Foresight's central move: run a recommendation and
 * its alternative through the SAME simulated futures, so the comparison is
 * paired. Toy parameters, not the project's engine. Every futures set comes
 * from a seeded generator, so a replay reproduces it exactly.
 */
import { sha256 } from "./sha256";

export const N = 10_000, T = 15, W0 = 500_000, SIGMA = 0.14, SEED = 2026;
export const DEFAULTS = { mu: 0.055, sur: 0.06, fall: 0 };
export type Household = { id: string; name: string; note: string; guarantee: number };
export const HOUSEHOLDS: Household[] = [
  { id: "millers", name: "The Millers", note: "an ordinary variable annuity", guarantee: 0 },
  { id: "trans", name: "The Trans", note: "a much richer guarantee to give up", guarantee: 2.0 },
];
/** A fictional book of clients for the market monitor. */
export const BOOK: Household[] = [
  ...HOUSEHOLDS,
  { id: "okafor", name: "The Okafors", note: "", guarantee: 0.9 },
  { id: "lindqvist", name: "The Lindqvists", note: "", guarantee: 1.2 },
  { id: "patel", name: "The Patels", note: "", guarantee: 1.5 },
  { id: "moreau", name: "The Moreaus", note: "", guarantee: 0.4 },
];

function mulberry32(a: number) {
  return () => { a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}

const cache = new Map<string, Float32Array>();
/** The shared futures, as standard normal shocks: n paths of T years. */
export function normals(n = N, seed = SEED) {
  const key = `${seed}:${n}`;
  let z = cache.get(key);
  if (!z) {
    const rnd = mulberry32(seed);
    z = new Float32Array(n * T);
    for (let i = 0; i < z.length; i++) z[i] = Math.sqrt(-2 * Math.log(rnd() || 1e-9)) * Math.cos(2 * Math.PI * rnd());
    cache.set(key, z);
  }
  return z;
}

type Opt = { fee: number; buffer: boolean; cap: boolean; g: number; sur: number };
const A: Opt = { fee: 0.021, buffer: false, cap: false, g: 0, sur: 0 };
const B: Opt = { fee: 0.009, buffer: true, cap: true, g: 0, sur: 0.06 };
const BUFFER = 0.1, CAP = 0.14;

function wealth(z: Float32Array, n: number, mu: number, fall: number, o: Opt) {
  const out = new Float64Array(n);
  for (let i = 0; i < n; i++) {
    let w = W0 * (1 - fall) * (1 - o.sur);
    for (let t = 0; t < T; t++) {
      let x = mu + SIGMA * z[i * T + t];
      if (o.buffer && x < 0) x = -Math.max(0, -x - BUFFER);
      if (o.cap && x > CAP) x = CAP;
      w *= 1 + x - o.fee;
    }
    out[i] = Math.max(w, o.g * W0);   // the guarantee does not fall with the market
  }
  return out;
}
const mean = (a: Float64Array) => a.reduce((s, v) => s + v, 0) / a.length;

export type Params = { mu: number; sur: number; fall: number };
export function evaluate(g: number, p: Params, n = N, seed = SEED) {
  const z = normals(n, seed);
  const a = wealth(z, n, p.mu, p.fall, { ...A, g });
  const b = wealth(z, n, p.mu, p.fall, { ...B, sur: p.sur });
  const states: Opt[] = [
    { ...A, g },
    { ...A, g, fee: B.fee },
    { ...A, g, fee: B.fee, buffer: true },
    { ...A, g, fee: B.fee, buffer: true, cap: true },
    { ...A, g: 0, fee: B.fee, buffer: true, cap: true },
    { ...B, sur: p.sur },
  ];
  const means = states.map((s) => mean(wealth(z, n, p.mu, p.fall, s)));
  const diffs = new Float64Array(n);
  let wins = 0;
  for (let i = 0; i < n; i++) { diffs[i] = b[i] - a[i]; if (diffs[i] > 0) wins++; }
  const sorted = Float64Array.from(diffs).sort();
  const labels = ["lower fees", "downside buffer", "upside cap", "guarantee given up", "surrender charge"];
  // B before any surrender charge: the exchange's win rate is then a cheap function of the charge.
  const base = wealth(z, n, p.mu, p.fall, { ...B, sur: 0 });
  return {
    win: wins / n, median: sorted[n >> 1], mean: mean(diffs), diffs, a, base, fall: p.fall,
    bridge: labels.map((label, i) => ({ label, value: means[i + 1] - means[i] })),
  };
}
export type Result = ReturnType<typeof evaluate>;

/** The surrender charge at which the exchange stops winning half the futures, or null. */
export function breakEven(r: Result) {
  const winAt = (s: number) => { let c = 0; for (let i = 0; i < r.a.length; i++) if (r.base[i] * (1 - s) > r.a[i]) c++; return c / r.a.length; };
  if (winAt(0) < 0.5) return null;
  if (winAt(0.4) >= 0.5) return 0.4;
  let lo = 0, hi = 0.4;
  for (let k = 0; k < 24; k++) { const m = (lo + hi) / 2; if (winAt(m) >= 0.5) lo = m; else hi = m; }
  return lo;
}

/** Best-Interest File: a hash-chained record. Changing any line breaks every hash after it. */
const hex = (b: Uint8Array) => [...b].map((x) => x.toString(16).padStart(2, "0")).join("");
export const chainHash = (prev: string, line: string) => hex(sha256(new TextEncoder().encode(prev + "|" + line)));
export function buildFile(h: Household, p: Params, res: Result) {
  const lines = [
    `inputs: ${h.id}, seed ${SEED}, ${N} futures x ${T} years, return ${(p.mu * 100).toFixed(1)}%, surrender ${(p.sur * 100).toFixed(1)}%`,
    `head-to-head: exchange wins ${(res.win * 100).toFixed(1)}% of futures, typical ${res.median >= 0 ? "+" : "-"}$${Math.abs(Math.round(res.median))}`,
    `value bridge: ${res.bridge.map((b) => `${b.label} ${Math.round(b.value)}`).join("; ")}`,
  ];
  let prev = "genesis";
  const hashes = lines.map((l) => (prev = chainHash(prev, l)));
  return { lines, hashes };
}
export function verify(lines: string[], hashes: string[]) {
  let prev = "genesis";
  return lines.map((l, i) => { prev = chainHash(prev, l); return prev === hashes[i]; });
}

/** Win rate only (no bridge), for scanning assumptions quickly. */
export function winRate(g: number, p: Params, n = 3000) {
  const z = normals(n);
  const a = wealth(z, n, p.mu, p.fall, { ...A, g });
  const b = wealth(z, n, p.mu, p.fall, { ...B, sur: p.sur });
  let w = 0;
  for (let i = 0; i < n; i++) if (b[i] > a[i]) w++;
  return w / n;
}
/** The market return above which the exchange stops winning half the futures (null: no flip between 2% and 10%). */
export function flipMu(g: number, sur: number) {
  const f = (mu: number) => winRate(g, { mu, sur, fall: 0 });
  const lo0 = f(0.02), hi0 = f(0.1);
  if (lo0 < 0.5 || hi0 >= 0.5) return { at: null as number | null, always: lo0 >= 0.5 };
  let lo = 0.02, hi = 0.1;
  for (let k = 0; k < 11; k++) { const m = (lo + hi) / 2; if (f(m) >= 0.5) lo = m; else hi = m; }
  return { at: lo, always: false };
}
