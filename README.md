# Ekansh Goyal, Portfolio

A reel of scenes, because the research is about reading screenplays. Eight screens, two projects per screen, and every project carries a model of its core idea that really computes. Vite + React 19 + TypeScript. No animation libraries.

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
| `src/components/Experience.tsx`, `Tools.tsx` | Where I have worked (a three-role timeline plus education) and what I build with (six grouped cards and a full-width coursework strip, from the resume and projects), each a compact screen. All copy is in `src/data/content.ts`. |
| `src/components/Hero.tsx` | The name page, with the intro card (headline, pitch, three facts, and the Dean's List and Research List Award badges). Every letter of EKANSH GOYAL is a tile for one of my public repositories It flips to show the project with a GitHub link, and a demo link where one exists; a spotlight walks along the name, and hover or tap takes over. |
| `src/components/Rail.tsx` | The scene index on the right edge. |
| `src/lib/kv.ts` | The Dynamo-style cluster model behind the QuorumKV demo. |
| `src/lib/futures.ts` | The paired Monte Carlo, value bridge and hash-chained file behind the Foresight demo. |
| `src/lib/lgsm.ts` | LGSM's forward pass (two streams, gate, fusion) over the film's beats. |
| `src/lib/rsa.ts`, `src/lib/sha256.ts` | Big-integer RSA, Miller-Rabin, CRT, SHA-256 and HMAC for the CryptoStack attacks. |
| `src/lib/aes.ts` | AES-128 from the spec (ECB and CTR), checked against the NIST/FIPS-197 vectors. |
| `src/components/demos/*` | One demo per project and paper. |

## The demos

Each shows one idea from the project and plays by itself. At most one or two controls.

- **QuorumKV (`Ring`)**: the real cluster model (N=4, W=3, R=2 like the repo's defaults) under live traffic. Click nodes to crash them; hinted handoff and quorums keep it answering until too many are gone, and the counters stay honest.
- **The Director LLM (`Critics`)**: where the supervised baseline sounds right and is quietly wrong. Four scenarios (an ignored action, a contradiction, a hallucination, amnesia) from the World Consistency critic's taxonomy and the PPO README's real generation pair, with the intent weights as short vertical bars, the offending phrase underlined, a fuller PPO answer, and one score per answer.
- **Vox (`Voice`)**: a desktop that TARS drives with the repo's real tools and tiers. Eight scenarios (read the screen, search, trash with an approval dialog, timer, find files, volume, a read-only command, and `sudo` refused). Stage timings are the README's measurements.
- **CryptoStack (`Cipher`)**: a map of the twenty primitives in their five phases with the reductions between them, and a live attack for seven of them, all running for real: Miller-Rabin vs Carmichael numbers, ECB leaking structure (AES-128 from the spec), bit-flipping CTR vs Encrypt-then-MAC, textbook RSA determinism, Håstad's broadcast attack via CRT, signature forgery, and a Diffie-Hellman man in the middle.
- **Anemia Detection (`Eye`)**: the app's flow on a real photograph of the lower lid pulled down, the red palpebral conjunctiva below the eye. A patient header and three visits; a quality gate with a sharpness meter against its threshold and a real brightness histogram; the mask's coverage of the frame and the conjunctiva's redness; the haemoglobin estimate on a WHO severity scale; a labelled history. The photo is reframed and colour-softened; earlier visits are simulated by grading the conjunctiva; the mask is a colour threshold standing in for UNet++; the Hb mapping is a toy calibration. The repository is private.
- **Foresight (`Futures`)**: first prize at LPL WealthX 2026. Four views on a small illustrative model (the mechanisms are the project's, the numbers are not its engine's). *Head-to-head*: a recommendation and its alternative on the same 10,000 futures, with sliders for market return and surrender charge and the point where the answer flips. *Why*: a full-width waterfall that adds up exactly to the difference. *Replay*: a hash-chained Best-Interest File you can replay (identical to the dollar) or tamper with (the chain breaks at the edited line). *Monitor*: drag a market fall and a fictional book re-ranks by whose advice flips. The repository is private, so the card links to the public demo video.
- **EMNLP paper (`Lgsm`)**: LGSM reading *Inception* (2010) beat by beat through the paper's two streams and scalar gate, with nine of the paper's feature groups (central characters, third-person pronouns, BERT surprisal, readability, dialogue density, RST depth, TextRank centrality, emotional volatility, plot shift). A dot marks the four whose direction the paper reports; the other values are illustrative. It includes a scene it misses (abstract suppression). Gate behaviour and group differences are from the paper; the beats are my summary of the film. **SemEval paper (`Density`)**: type any post; a transparent lexicon-and-slots scorer highlights the five narrative slots and predicts belief at the project's τ = 0.595. It illustrates the signal and is not the DeBERTa model.

## Notes

- Theme is stored in `localStorage`, defaults to the OS setting, and is applied before paint by an inline script in `index.html`.
- Pages scroll-snap on desktop (`proximity`, so it never fights the user) and stack naturally on small screens.
- `prefers-reduced-motion` stops the transitions and the blinking caret.
- The contact form posts to Web3Forms (or an `endpoint`) when configured, otherwise opens a `mailto:` draft.

## Credits

The anemia demo uses "Chlamydial-conjunctivitis.jpg" by Jonathan Trobe, M.D., University of Michigan Kellogg Eye Center, licensed CC BY 3.0 (Wikimedia Commons), reframed, smoothed and colour-softened (calmer colours, lifted shadows, muted glare), with a derived segmentation mask. The original shows an inflamed conjunctiva; it is used here for the lower-lid view only. To use your own clinical capture, replace `public/images/eye-lid.jpg` and `public/images/eye-lid-mask.png` (same size) and recalibrate `RATIO0` in `Eye.tsx`.
