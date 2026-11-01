/**
 * A small, honest model of Foresight's central move: run a recommendation and
 * its alternative through the SAME simulated futures, so the comparison is
 * paired. Toy parameters, not the project's engine. Every futures set comes
 * from a seeded generator, so a replay reproduces it exactly.
 */
import { sha256 } from "./sha256";

export const N = 10_000, T = 15, W0 = 500_000, MU = 0.055, SIGMA = 0.14, SEED = 2026;
export type Household = { id: string; name: string; note: string; guarantee: number };
export const HOUSEHOLDS: Household[] = [
  { id: "millers", name: "The Millers", note: "an ordinary variable annuity, no rich guarantee", guarantee: 0 },
  { id: "trans", name: "The Trans", note: "the same exchange, but a much richer guarantee to give up", guarantee: 2.0 },
];

function mulberry32(a: number) {
  return () => { a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}

/** The shared futures: N paths of T annual market returns. */
export function futures(seed = SEED) {
  const rnd = mulberry32(seed), r = new Float32Array(N * T);
  for (let i = 0; i < r.length; i++) {
    const u = rnd() || 1e-9, v = rnd();
    r[i] = MU + SIGMA * Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
  }
  return r;
}

type Opt = { fee: number; buffer: boolean; cap: boolean; g: number; sur: number };
const A: Opt = { fee: 0.021, buffer: false, cap: false, g: 0, sur: 0 };
const B: Opt = { fee: 0.009, buffer: true, cap: true, g: 0, sur: 0.06 };
const BUFFER = 0.1, CAP = 0.14;

function wealth(r: Float32Array, o: Opt) {
  const out = new Float64Array(N);
  for (let i = 0; i < N; i++) {
    let w = W0 * (1 - o.sur);
    for (let t = 0; t < T; t++) {
      let x = r[i * T + t];
      if (o.buffer && x < 0) x = -Math.max(0, -x - BUFFER);
      if (o.cap && x > CAP) x = CAP;
      w *= 1 + x - o.fee;
    }
    out[i] = Math.max(w, o.g * W0);
  }
  return out;
}
const mean = (a: Float64Array) => a.reduce((s, v) => s + v, 0) / a.length;

export function headToHead(h: Household, seed = SEED) {
  const r = futures(seed);
  const a = wealth(r, { ...A, g: h.guarantee });
  const states = [
    { ...A, g: h.guarantee },
    { ...A, g: h.guarantee, fee: B.fee },
    { ...A, g: h.guarantee, fee: B.fee, buffer: true },
    { ...A, g: h.guarantee, fee: B.fee, buffer: true, cap: true },
    { ...A, g: 0, fee: B.fee, buffer: true, cap: true },
    { ...B },
  ];
  const means = states.map((s) => mean(wealth(r, s)));
  const b = wealth(r, B);
  const diffs = new Float64Array(N);
  let wins = 0;
  for (let i = 0; i < N; i++) { diffs[i] = b[i] - a[i]; if (diffs[i] > 0) wins++; }
  const sorted = Float64Array.from(diffs).sort();
  const labels = ["lower fees", "downside buffer", "upside cap", "guarantee given up", "surrender charge"];
  return {
    win: wins / N,
    median: sorted[N >> 1],
    mean: mean(diffs),
    diffs,
    bridge: labels.map((label, i) => ({ label, value: means[i + 1] - means[i] })),
  };
}

/** Best-Interest File: a hash-chained record. Changing any line breaks every hash after it. */
const hex = (b: Uint8Array) => [...b].map((x) => x.toString(16).padStart(2, "0")).join("");
export const chainHash = (prev: string, line: string) => hex(sha256(new TextEncoder().encode(prev + "|" + line)));
export function buildFile(h: Household, res: ReturnType<typeof headToHead>) {
  const lines = [
    `inputs: ${h.id}, seed ${SEED}, ${N} futures x ${T} years, start $${W0}`,
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
