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
| `src/lib/lgsm.ts` | LGSM's forward pass (two streams, gate, fusion) over the film's beats. |
| `src/lib/rsa.ts`, `src/lib/sha256.ts` | Big-integer RSA, Miller-Rabin, CRT, SHA-256 and HMAC for the CryptoStack attacks. |
| `src/lib/aes.ts` | AES-128 from the spec (ECB and CTR), checked against the NIST/FIPS-197 vectors. |
| `src/components/demos/*` | One demo per project and paper. |

## The demos

Each shows one idea from the project and plays by itself. At most one or two controls.

- **QuorumKV (`Ring`)**: the real cluster model (N=4, W=3, R=2 like the repo's defaults) under live traffic. Click nodes to crash them; hinted handoff and quorums keep it answering until too many are gone, and the counters stay honest.
- **The Director LLM (`Critics`)**: the README's real generations. The same player action answered by the supervised Phi-2 baseline and by the PPO policy, with each critic's score and the intent-weighted reward computed live from the intent's weights.
- **Vox (`Voice`)**: hold the button or Right Ctrl. Stage timings are the README's measurements; the risky command asks first.
- **CryptoStack (`Cipher`)**: a map of the twenty primitives in their five phases with the reductions between them, and a live attack for seven of them, all running for real: Miller-Rabin vs Carmichael numbers, ECB leaking structure (AES-128 from the spec), bit-flipping CTR vs Encrypt-then-MAC, textbook RSA determinism, Håstad's broadcast attack via CRT, signature forgery, and a Diffie-Hellman man in the middle.
- **Anemia Detection (`Eye`)**: one patient over three visits through the app's flow: guide box, quality gate (Laplacian sharpness and brightness, computed on pixels), conjunctiva segmentation, haemoglobin, severity, history. Segmenter is a colour threshold standing in for UNet++; Hb mapping is a toy calibration. The repository is private.
- **Distributed Storage (`Planes`)**: the Naming Server answers where a file is and steps out; bytes flow client to storage server directly. Click a storage server to drop it and bring it back.
- **EMNLP paper (`Lgsm`)**: LGSM reading *Her* (2013) beat by beat. Each scene goes through the frozen-BERT stream, the linguistic-feature stream and the paper's scalar gate (α = 0.477, flat across that film), with the fusion arithmetic and the verdict shown, including a scene it misses (the paper's abstract-suppression failure). Gate value, feature directions and group differences are from the paper; per-scene values are illustrative and the beats are my summary of the film. **SemEval paper (`Density`)**: max-pool keyword spotting against mean-pool narrative density on the same post.

## Notes

- Theme is stored in `localStorage`, defaults to the OS setting, and is applied before paint by an inline script in `index.html`.
- Pages scroll-snap on desktop (`proximity`, so it never fights the user) and stack naturally on small screens.
- `prefers-reduced-motion` stops the transitions and the blinking caret.
- The contact form posts to Web3Forms (or an `endpoint`) when configured, otherwise opens a `mailto:` draft.
