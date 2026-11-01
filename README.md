# Ekansh Goyal, Portfolio

A reel of scenes, because the research is about reading screenplays. Eight scenes: an opening, three project screens (two projects each), the papers, where I have worked, what I build with, and contact. Every project and paper carries a model of its core idea that really computes. Vite + React 19 + TypeScript. The only motion dependency is Lenis, for eased wheel scrolling.

## Run

```bash
npm install
npm run dev
```

`npm run build` type-checks and bundles to `dist/`; `npm run lint` runs oxlint.

## Where things are

| Path | What it is |
| --- | --- |
| `src/data/content.ts` | **All copy**: profile, projects, publications, experience and education, skills, scenes, contact-form keys. Edit this, not the components. |
| `src/index.css` | Tokens (light and dark) and every style. Change `--accent` and the site follows. |
| `src/App.tsx` | The eight scenes in order. |
| `src/components/Hero.tsx` | The name page: the plate of letter tiles, the intro card (headline, pitch, three facts, Dean's List and Research List Award badges) and the scene strip. |
| `src/lib/flow.ts` | How the page moves: Lenis-eased wheel scrolling, gliding in-page links and rail, content easing in as it arrives, the top progress bar, and the opening's drift. Everything is off under `prefers-reduced-motion`, and the hidden state of reveals is applied from here so nothing stays invisible if it fails. |
| `src/components/Nav.tsx`, `Rail.tsx` | Top bar (Research, Contact, GitHub, theme toggle) and the scene index on the right edge. |
| `src/components/Pages.tsx` | Shared layout: the scene header (`Slate`), the project `Card`, and `WorkPage` (two projects per screen). |
| `src/components/Research.tsx` | The two papers, each with a demo (`Lgsm`, `Density`). |
| `src/components/Experience.tsx`, `Tools.tsx` | Where I have worked (three-role timeline plus an education strip) and what I build with (six grouped cards and a full-width coursework strip). Both are compact screens. |
| `src/components/Contact.tsx` | The form (Web3Forms or `mailto:` fallback), the latest GitHub pushes (live), and the footer with the photo credit. |
| `src/components/demos/*` | One demo per project and paper (see below). |
| `src/lib/kv.ts` | The Dynamo-style cluster model behind the QuorumKV demo. |
| `src/lib/aes.ts`, `rsa.ts`, `sha256.ts` | AES-128 from the spec, big-integer RSA with Miller-Rabin and CRT, SHA-256 and HMAC, checked against NIST, FIPS-197 and RFC 4231 vectors. Used by the CryptoStack attacks. |
| `src/lib/lgsm.ts` | LGSM's forward pass (two streams, scalar gate, fusion) over the film's beats. |
| `src/lib/futures.ts` | The paired Monte Carlo, value bridge, break-even search, market monitor and hash-chained file behind the Foresight demo. |
| `public/images/eye-lid.jpg`, `eye-lid-mask.png` | The anemia demo's photo and its segmentation mask (same size). |

## The name plate

Every letter of EKANSH GOYAL is a flip tile. It shows the project, a GitHub link when the repo is public, and a "see the demo" link when the project has a demo here. A spotlight walks along the plate; hover or tap takes over. The mapping lives in `ROWS` in `Hero.tsx`:

| E | K | A | N | S | H |
| --- | --- | --- | --- | --- | --- |
| EMNLP paper (no repo) | QuorumKV | sparse-moe-summarization | Dropout-Squad | conspiracy-belief-detection | Dr.Pixels |

| G | O | Y | A | L |
| --- | --- | --- | --- | --- |
| galactic-glitch-hunters | Voxd | CryptoStack | Anemia (private repo) | Fault-Tolerant-Distributed-Storage-System |

## The demos

Each shows one idea from the project and plays by itself. At most one or two controls.

- **QuorumKV (`Ring`)**: the real cluster model (N=4, W=3, R=2 like the repo's defaults) under live traffic. Click nodes to crash them; hinted handoff and quorums keep it answering until too many are gone, and the counters stay honest.
- **The Director LLM (`Critics`)**: where the supervised baseline sounds right and is quietly wrong. Four scenarios (an ignored action, a contradiction, a hallucination, amnesia) from the World Consistency critic's taxonomy and the PPO README's real generation pair, with the intent weights as short vertical bars, the offending phrase underlined, a fuller PPO answer, and one score per answer.
- **Vox (`Voice`)**: a desktop that TARS drives with the repo's real tools and tiers. Eight scenarios (read the screen, search, trash with an approval dialog, timer, find files, volume, a read-only command, and `sudo` refused). Stage timings are the README's measurements.
- **CryptoStack (`Cipher`)**: a map of the twenty primitives in their five phases with the reductions between them, and a live attack for seven of them, all running for real: Miller-Rabin vs Carmichael numbers, ECB leaking structure (AES-128 from the spec), bit-flipping CTR vs Encrypt-then-MAC, textbook RSA determinism, Håstad's broadcast attack via CRT, signature forgery, and a Diffie-Hellman man in the middle.
- **Anemia Detection (`Eye`)**: the app's flow on a real photograph of the lower lid pulled down, the red palpebral conjunctiva below the eye. A patient header and three visits; a quality gate with a sharpness meter against its threshold and a real brightness histogram; the mask's coverage of the frame and the conjunctiva's redness; the haemoglobin estimate on a WHO severity scale; a labelled history. The photo is reframed and colour-softened; earlier visits are simulated by grading the conjunctiva; the mask is a colour threshold standing in for UNet++; the Hb mapping is a toy calibration. The repository is private.
- **Foresight (`Futures`)**: first prize at LPL WealthX 2026. Four views on a small illustrative model (the mechanisms are the project's, the numbers are not its engine's). *Head-to-head*: a recommendation and its alternative on the same 10,000 futures, with sliders for market return and surrender charge and the point where the answer flips. *Why*: a full-width waterfall that adds up exactly to the difference. *Replay*: a hash-chained Best-Interest File you can replay (identical to the dollar) or tamper with (the chain breaks at the edited line). *Monitor*: drag a market fall and a fictional book re-ranks by whose advice flips. The repository is private, so the card links to the public demo video.
- **EMNLP paper (`Lgsm`)**: LGSM reading *Inception* (2010) beat by beat through the paper's two streams and scalar gate, with nine of the paper's feature groups (central characters, third-person pronouns, BERT surprisal, readability, dialogue density, RST depth, TextRank centrality, emotional volatility, plot shift). A dot marks the four whose direction the paper reports; the other values are illustrative. It includes a scene it misses (abstract suppression). Gate behaviour and group differences are from the paper; the beats are my summary of the film. **SemEval paper (`Density`)**: type any post; a transparent lexicon-and-slots scorer highlights the five narrative slots and predicts belief at the project's τ = 0.595. It illustrates the signal and is not the DeBERTa model.

## What is real and what is illustrative

| Demo | Real | Illustrative or simulated |
| --- | --- | --- |
| QuorumKV | The cluster model (consistent hashing, N/R/W quorums, vector clocks, hinted handoff) and its counters. | The traffic. |
| The Director | Intent weights, the Fireball generation pair and its critic scores (PPO README), the World Consistency taxonomy and the baseline scores 0.0 / 0.3 / 0.5. | The wording of the three world-state answers and their PPO scores (high, not perfect). |
| Vox | Tool names and tiers (TOOLS.md), stage timings (README). | The desktop and the replies. |
| CryptoStack | Every attack runs: AES, RSA, SHA-256, HMAC, Miller-Rabin, CRT. | Nothing; the primitive map is the README's. |
| Anemia | The photo, the quality gate and histogram, the mask, the redness and the Hb read-out are computed from the pixels. | Visits 1 and 2 (the conjunctiva is graded paler), the colour-threshold mask standing in for UNet++, and the Hb calibration. |
| Foresight | The mechanisms: paired futures, an exact bridge, a hash chain, a market monitor. | The model and every number. It is not the project's engine. |
| LGSM | The architecture, the gate behaviour, and the directions of four features (paper). | Per-scene feature values, the other five feature groups' values, and the film beats (my summary of *Inception*). |
| Truth Gradient | The five-slot schema and dataset statistics. | The lexicon scorer; it is not the DeBERTa model. |

## Notes

- Theme is stored in `localStorage`, defaults to the OS setting, and is applied before paint by an inline script in `index.html`.
- Scrolling is eased with Lenis (wheel only; touch stays native) and there is no scroll-snap, so the scenes flow into one another. Reveals use `.rv-pre` / `.rv-in` on the targets listed in `flow.ts`. Elements that scroll on their own (the Truth Gradient textarea) carry `data-lenis-prevent`.
- `prefers-reduced-motion` turns off smooth scrolling, the reveals, the tile entrance, the hero drift, the progress bar, the transitions and the blinking caret.
- The contact form posts to Web3Forms (or an `endpoint`) when configured (`contactForm` in `content.ts`), otherwise opens a `mailto:` draft.
- The "latest pushes" on the contact screen are fetched from the GitHub API at load; unauthenticated calls are rate-limited, and the strip simply hides if the request fails.
- Screens fit one viewport at 1440x900; Applied (Anemia and Foresight) and Research run slightly taller because the demos use the room.
- If the dev server ever shows a blank page after a large file edit, restart it: Vite can cache an empty read of a file written in one go.

## Credits

The anemia demo uses "Chlamydial-conjunctivitis.jpg" by Jonathan Trobe, M.D., University of Michigan Kellogg Eye Center, licensed CC BY 3.0 (Wikimedia Commons), reframed, smoothed and colour-softened (calmer colours, lifted shadows, muted glare), with a derived segmentation mask. The original shows an inflamed conjunctiva; it is used here for the lower-lid view only. The credit is also shown in the site footer, as the licence requires. To use your own clinical capture, replace `public/images/eye-lid.jpg` and `public/images/eye-lid-mask.png` (same size), then set `W`, `H` and `RATIO0` and recalibrate the Hb mapping in `Eye.tsx`.
