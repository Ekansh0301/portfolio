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
| `src/lib/kv.ts` | The Dynamo-style cluster used by the QuorumKV demo. |
| `src/lib/rsa.ts` | BigInt RSA, Miller-Rabin, and Pollard-Brent factoring for the CryptoStack demo. |
| `src/components/demos/*` | One demo per project and paper. |

## What each demo really does

- **QuorumKV (`Ring`)**: a working cluster. Consistent hashing, N/R/W quorums, vector clocks with sibling versions, sloppy quorums with hinted handoff, read repair and anti-entropy. Partition it, write from both sides, heal, and read back two siblings.
- **The Director LLM (`Critics`)**: REINFORCE with a baseline, trained live. An intent-conditioned policy specialises per intent; a policy that sees one weighting collapses. A toy bandit modelling the idea, not the PPO/QLoRA pipeline.
- **Vox (`Voice`)**: the tool router and shell/file sandbox are real code; a VRAM budget against 4 GB. Model sizes and speeds are approximate planning numbers.
- **CryptoStack (`Cipher`)**: textbook RSA on BigInt. Factor the modulus and decrypt, or malleate the ciphertext.
- **Anemia Detection (`Eye`)**: the app's pipeline on real pixels. Laplacian-variance blur gate, brightness gate, segmentation scored by Dice, haemoglobin estimate, WHO severity class. The segmenter is a colour threshold standing in for UNet++, and the Hb mapping is a toy calibration. Upload a photo to try your own.
- **Distributed Storage (`Planes`)**: path trie plus LRU cache in front of direct streaming from storage nodes; crash a node and a replica serves.
- **EMNLP paper (`Gate`)**: a dual-stream gate on twelve synthetic scenes. **SemEval paper (`Density`)**: max-pool keyword spotting against mean-pool narrative density. Both illustrate the mechanism; the real results are in the paper text.

## Notes

- Theme is stored in `localStorage`, defaults to the OS setting, and is applied before paint by an inline script in `index.html`.
- Pages scroll-snap on desktop (`proximity`, so it never fights the user) and stack naturally on small screens.
- `prefers-reduced-motion` stops the transitions and the blinking caret.
- The contact form posts to Web3Forms (or an `endpoint`) when configured, otherwise opens a `mailto:` draft.
