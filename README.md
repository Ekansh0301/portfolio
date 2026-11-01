# Ekansh Goyal, Portfolio

A minimal, light/dark personal site where every project carries a small working model of its core idea. Vite + React 19 + TypeScript + Tailwind v4 (used only for the reset). No animation libraries.

## Run

```bash
npm install
npm run dev
```

`npm run build` type-checks and bundles to `dist/`; `npm run lint` runs oxlint.

## Structure

| File | What it does |
| --- | --- |
| `src/data/content.ts` | All copy: profile, projects, publications, experience, skills, contact-form keys. Edit this, not the components. |
| `src/index.css` | Design tokens (light and dark) and every component style. Change `--accent` and the site follows. |
| `src/components/Hero.tsx` | The name is a variable serif (Fraunces). Each letter's weight follows its distance to the pointer; idle, a slow wave rolls through. |
| `src/components/Reveal.tsx` | Scroll-in fade. The hidden state is applied from JS, so nothing stays invisible if a script fails. |
| `src/components/demos/*` | One interactive demo per project, picked by `demo` in `content.ts`. |
| `src/components/Repos.tsx` | Most recently pushed public repos from the GitHub API. Hides itself if the request fails. |

## The demos

- **QuorumKV (`Ring`)**: click nodes to kill them, write a key, change W. Shows hinted handoff and when a write is refused.
- **The Director LLM (`Critics`)**: pick an intent and the four critic weights re-balance which continuation wins. Scores are illustrative.
- **Vox (`Voice`)**: a replay of one voice command through speech, LLM, tools and TTS.
- **CryptoStack (`Cipher`)**: real SHA-256 (Web Crypto). Flip one input bit and count how many output bits change.
- **CropGuard (`Leaf`)**: scan an illustrated leaf. Predictions are illustrative, not the live model.
- **Distributed Storage (`Planes`)**: control plane vs data plane, and rerouting around a crashed node.

## Notes

- Theme is stored in `localStorage` and defaults to the OS setting; an inline script in `index.html` applies it before paint.
- `prefers-reduced-motion` stops the idle name wave, reveals and animations.
- The contact form posts to Web3Forms (or an `endpoint`) when configured, otherwise opens a `mailto:` draft.
