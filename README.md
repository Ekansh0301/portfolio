# Ekansh Goyal, Portfolio

A reel of scenes, because the research is about reading screenplays. Seven screens, two projects per screen, and every project carries a model of its core idea that really computes. Vite + React 19 + TypeScript. No animation libraries.

## Run

```bash
npm install
npm run dev
```

`npm run build` type-checks and bundles to `dist/`; `npm run lint` runs oxlint.

## Where things are

| Path | What it is |
| --- | --- |
| `src/data/content.ts` | All copy: profile, projects, publications, experience, skills, contact-form keys. |
| `src/index.css` | Tokens (light and dark) and every style. Change `--accent` and the site follows. |
| `src/components/Hero.tsx` | The opening, written as a screenplay. The cursor is the query vector: each word's opacity is its attention weight. |
| `src/components/Rail.tsx` | The scene index on the right edge. |
| `src/lib/kv.ts` | The Dynamo-style cluster model behind the QuorumKV demo. |
| `src/lib/aes.ts` | AES-128 from the spec (ECB and CTR), checked against the NIST/FIPS-197 vectors. |
| `src/components/demos/*` | One demo per project and paper. |

## The demos

Each shows one idea from the project and plays by itself. At most one or two controls.

- **QuorumKV (`Ring`)**: the real cluster model (N=4, W=3, R=2 like the repo's defaults) under live traffic. Click nodes to crash them; hinted handoff and quorums keep it answering until too many are gone, and the counters stay honest.
- **The Director LLM (`Critics`)**: the README's intent weightings (explore, action, dialogue) and its supervised-vs-PPO critic scores, with the Fireball example.
- **Vox (`Voice`)**: hold the button or Right Ctrl. Stage timings are the README's measurements; the risky command asks first.
- **CryptoStack (`Cipher`)**: the same image through AES-ECB and AES-CTR. In ECB the shape survives. Lists the twenty primitives by phase.
- **Anemia Detection (`Eye`)**: one patient over three visits through the app's flow: guide box, quality gate (Laplacian sharpness and brightness, computed on pixels), conjunctiva segmentation, haemoglobin, severity, history. Segmenter is a colour threshold standing in for UNet++; Hb mapping is a toy calibration. The repository is private.
- **Distributed Storage (`Planes`)**: the Naming Server answers where a file is and steps out; bytes flow client to storage server directly. Click a storage server to drop it and bring it back.
- **EMNLP paper (`Gate`)**: a dual-stream gate on twelve synthetic scenes. **SemEval paper (`Density`)**: max-pool keyword spotting against mean-pool narrative density. Both illustrate the mechanism; the paper's results are in the text above them.

## Notes

- Theme is stored in `localStorage`, defaults to the OS setting, and is applied before paint by an inline script in `index.html`.
- Pages scroll-snap on desktop (`proximity`, so it never fights the user) and stack naturally on small screens.
- `prefers-reduced-motion` stops the transitions and the blinking caret.
- The contact form posts to Web3Forms (or an `endpoint`) when configured, otherwise opens a `mailto:` draft.
