/**
 * LGSM's forward pass on beats from one film. Structure and constants are the
 * paper's: a frozen-BERT semantic stream and a linguistic-feature stream are
 * fused by a scalar gate  h = α·h_ling + (1−α)·h_sem, α = σ(W[h_sem; h_ling] + b).
 * The paper reports α nearly constant within a film (μ = 0.477 for "Her").
 * Feature directions follow its SHAP analysis: salient scenes have more central
 * characters and more third-person pronouns, and lower readability.
 * The per-scene feature values and semantic scores below are illustrative.
 */
export const FILM = { title: "Inception", year: 2010, director: "Christopher Nolan" };
/** Within a film the paper finds the gate nearly constant (0.477 for "Her"); one value is used here. */
export const ALPHA = 0.48;
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
  { title: "The beach", blurb: "Cobb washes ashore and is led to an old man in a palace.", star: false, sem: 0.3, z: z(-0.6, -0.5, -0.2, 0.2) },
  { title: "The failed extraction", blurb: "Cobb and Arthur try to steal a secret from Saito's dream.", star: false, sem: 0.32, z: z(0.1, 0.3, 0.5, 0) },
  { title: "Saito's offer", blurb: "Plant an idea in a rival's mind, and Cobb gets his life back.", star: true, sem: 0.74, z: z(0.7, 0.9, 1.2, -0.3) },
  { title: "Assembling the crew", blurb: "Cobb recruits an architect, a forger and a chemist.", star: false, sem: 0.28, z: z(0.8, 0.5, 0.9, 0.1), note: "Crowded and talky, so the features alone lean salient. The semantic stream pulls it back." },
  { title: "Folding Paris", blurb: "Ariadne learns she can bend the dream city.", star: false, sem: 0.35, z: z(-0.1, -0.2, 0.2, -0.1) },
  { title: "Mal in the dream", blurb: "Ariadne discovers who Cobb keeps hiding from the crew.", star: true, sem: 0.6, z: z(0.6, 0.8, 1.1, -0.5) },
  { title: "The plan, at altitude", blurb: "On the plane, the team lays out a dream within a dream within a dream.", star: false, sem: 0.3, z: z(0.6, 0.4, 1.0, 0.2) },
  { title: "Rain and the van", blurb: "The first dream level: a chase, and Saito takes a bullet.", star: true, sem: 0.66, z: z(1.0, 1.1, 0.4, -0.4) },
  { title: "The hotel hallway", blurb: "A fight in a corridor where gravity gives out.", star: false, sem: 0.25, z: z(1.0, 0.7, 0.3, 0.1), note: "Busy and cinematic, but the plot does not hinge on it. The semantic stream keeps it down." },
  { title: "The snow fortress", blurb: "The team storms the mountain hospital to reach the vault.", star: true, sem: 0.64, z: z(0.9, 0.8, 0.6, -0.5) },
  { title: "Letting Mal go", blurb: "Cobb finally tells his wife's memory what he cannot forgive himself for.", star: true, sem: 0.36, z: z(-0.2, -0.4, 0.8, 0.5), note: "Missed. Quiet, abstract dialogue pushes both streams down, the failure mode the paper calls abstract suppression." },
  { title: "The spinning top", blurb: "Cobb walks to his children, and the top keeps spinning.", star: true, sem: 0.6, z: z(0.3, 0.6, 0.1, -0.2) },
];

const sig = (x: number) => 1 / (1 + Math.exp(-x));
export function score(b: Beat) {
  const contrib = FEATURES.map((f) => ({ ...f, z: b.z[f.k], c: f.w * b.z[f.k] }));
  const logit = contrib.reduce((a, x) => a + x.c, 0) + BIAS;
  const ling = sig(logit);
  const fused = ALPHA * ling + (1 - ALPHA) * b.sem;
  return { contrib, logit, ling, fused, pred: fused >= 0.5 };
}
