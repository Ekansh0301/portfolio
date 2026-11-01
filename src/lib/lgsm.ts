/**
 * LGSM's forward pass on beats from one film. Structure and constants are the
 * paper's: a frozen-BERT semantic stream and a linguistic-feature stream are
 * fused by a scalar gate  h = α·h_ling + (1−α)·h_sem, α = σ(W[h_sem; h_ling] + b).
 * For the film "Her" the paper reports α flat across the film at μ = 0.477.
 * Feature directions follow its SHAP analysis: salient scenes have more central
 * characters and more third-person pronouns, and lower readability.
 * The per-scene feature values and semantic scores below are illustrative.
 */
export const FILM = { title: "Her", year: 2013, director: "Spike Jonze" };
export const ALPHA = 0.477;
export const BIAS = -0.6;

export type FeatureKey = "chars" | "pron" | "dlg" | "read";
export const FEATURES: { k: FeatureKey; label: string; w: number; note: string }[] = [
  { k: "chars", label: "central characters", w: 0.9, note: "salient 5.66 vs 2.48" },
  { k: "pron", label: "3rd-person pronouns", w: 0.7, note: "salient 12.83 vs 4.96" },
  { k: "dlg", label: "dialogue density", w: 0.4, note: "speech vs action" },
  { k: "read", label: "readability", w: -0.5, note: "salient scenes read harder" },
];

export type Beat = { title: string; blurb: string; star: boolean; sem: number; z: Record<FeatureKey, number>; note?: string };
const z = (chars: number, pron: number, dlg: number, read: number) => ({ chars, pron, dlg, read });

export const BEATS: Beat[] = [
  { title: "Letters for strangers", blurb: "Theodore dictates tender letters for other people at work.", star: false, sem: 0.3, z: z(-0.5, -0.6, 0.2, 0.3) },
  { title: "Samantha wakes up", blurb: "He installs a new operating system, and it starts talking to him.", star: true, sem: 0.72, z: z(0.9, 0.7, 1.1, -0.4) },
  { title: "Tidying his inbox", blurb: "A late-night chat while she sorts through his email.", star: false, sem: 0.35, z: z(-0.2, 0.1, 0.8, 0) },
  { title: "The blind date", blurb: "An evening that starts well and curdles.", star: false, sem: 0.45, z: z(0, 0.3, 0.9, 0.1) },
  { title: "A day at the beach", blurb: "Samantha says she feels present in the moment.", star: false, sem: 0.4, z: z(-0.3, -0.2, 0.3, -0.1) },
  { title: "Signing the divorce papers", blurb: "Lunch with his ex-wife Catherine, and the papers on the table.", star: true, sem: 0.55, z: z(1.0, 1.2, 1.0, -0.6) },
  { title: "Double date", blurb: "Dinner with a coworker and his girlfriend, plus Samantha on the phone.", star: false, sem: 0.25, z: z(1.0, 0.6, 0.7, 0.1), note: "Features alone would flag this crowded dinner. The semantic stream pulls it back." },
  { title: "She writes him a song", blurb: "Samantha composes a piece of music about the two of them.", star: false, sem: 0.5, z: z(-0.6, -0.4, -0.1, 0.2) },
  { title: "Amy's new friend", blurb: "Amy confides that she has befriended her ex's operating system.", star: false, sem: 0.3, z: z(0.2, 0.5, 0.8, 0) },
  { title: "Thousands of others", blurb: "Samantha admits she is talking with thousands of people at once.", star: true, sem: 0.78, z: z(0.3, 0.2, 1.2, -0.2) },
  { title: "The systems leave", blurb: "Samantha explains that she and the others are going somewhere he cannot follow.", star: true, sem: 0.35, z: z(-0.3, -0.4, 0.9, 0.6), note: "Missed. Quiet, abstract dialogue pushes both streams down, the failure mode the paper calls abstract suppression." },
  { title: "A letter, and a rooftop", blurb: "He writes to Catherine, then sits with Amy and watches the city.", star: true, sem: 0.62, z: z(0.5, 0.9, 0.5, -0.3) },
];

const sig = (x: number) => 1 / (1 + Math.exp(-x));
export function score(b: Beat) {
  const contrib = FEATURES.map((f) => ({ ...f, z: b.z[f.k], c: f.w * b.z[f.k] }));
  const logit = contrib.reduce((a, x) => a + x.c, 0) + BIAS;
  const ling = sig(logit);
  const fused = ALPHA * ling + (1 - ALPHA) * b.sem;
  return { contrib, logit, ling, fused, pred: fused >= 0.5 };
}
