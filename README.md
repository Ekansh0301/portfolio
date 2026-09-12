# Ekansh Goyal, Portfolio

A dark, motion-driven personal site. Vite + React 19 + TypeScript, Tailwind v4, GSAP/ScrollTrigger, Lenis.

## Run

```bash
npm install
npm run dev
```

`npm run build` type-checks and bundles to `dist/`; `npm run preview` serves that build; `npm run lint` runs oxlint.

## Structure

| File | What it does |
| --- | --- |
| `src/data/content.ts` | **All copy lives here**: profile, projects, publications, experience, skill groups. Edit this, not the components. |
| `src/components/Skills.tsx` | Toolkit. Four rows, category label on the left and its tools as chips on the right, so the whole stack stays visible in about the height of one project card. |
| `src/index.css` | Design tokens (`@theme`) plus the TextPressure and scroll-expand primitives. |
| `src/components/TextPressure.tsx` | Hero name. Each glyph is a span whose `font-variation-settings` are recomputed per frame from its distance to a smoothed cursor, so near letters bloom heavy and wide while far ones stay hairline outlines. Needs the Roboto Flex variable font. |
| `src/components/SmokeCursor.tsx` | The ember cloud. Additive radial-gradient particles on a canvas, shredded into wisps by an animated `feTurbulence` displacement filter, composited with `mix-blend-mode: screen`. Scoped to the hero. |
| `src/components/Philosophy.tsx` | Scroll-expand: a small rounded card pinned mid-screen that grows to full-bleed across a 320vh track while the title fades out and the quote fades in. |
| `scripts/grade-philosophy-image.py` | Rebuilds `public/images/philosophy-hands.jpg` from the source fresco. Run it if you want to retune the crop or the colour grade. |
| `src/components/ProjectCover.tsx` | Generated SVG cover art per project, keyed off each project's `kind`. Each one draws the architecture from that repo's README: QuorumKV's hash ring with a live replica set, The Director's four weighted critics, Vox's on-device audio pipeline, the storage system's split control and data planes. Swap in real screenshots by replacing this with an `<img>`. |

## Notes

- **Palette** is a single source of truth in `src/index.css` under `@theme`: `void`/`obsidian`/`graphite` surfaces, `ember`/`vibrant-orange` accents. Change `--color-ember` and the whole site follows.
- **Reveals** set their hidden state in JS, never in CSS, so nothing is permanently invisible if a script fails.
- **Preloader** has a 6s failsafe: `requestAnimationFrame` is throttled in background tabs, which would otherwise strand the counter and leave the overlay covering the page.
- **Contact form.** Set `contactEndpoint` in `src/data/content.ts` to a form endpoint (Formspree, Web3Forms, Getform) and the form POSTs to it with real sending/sent/error states. Left empty, it falls back to opening a `mailto:` draft, which only works for visitors with a desktop mail client configured, so it is not a delivery mechanism you should rely on.
- **Intro timing** is a handoff, not a queue: the preloader fires `onReveal` when the curtain *starts* lifting, so the hero's own timeline plays behind it. Hero copy is fully in at roughly 2.4s.
- **The hero frame loop** does all its `getBoundingClientRect` reads before any style writes. Interleaving them forces a synchronous reflow per glyph, because changing a variation axis re-shapes the text. It also skips glyphs whose axes did not move, so an idle pointer costs nothing.
- **The smoke canvas** renders at half resolution and is scaled up by CSS. It is blurred and displacement-mapped anyway, so there is no visible detail to lose, and it cuts both fill rate and the area the SVG filter processes to a quarter.
- **The smoke simulation is delta-time driven**, not frame-counted. Frame-counted particle lifetimes stretch in wall-clock time whenever the page drops below 60fps, which is what makes the plume visibly trail the cursor on slower machines; they also run twice as fast on a 120Hz display.
- `prefers-reduced-motion` disables the smoke, dust, marquee, and the scroll-expand pin.

## Credits

`public/images/philosophy-hands.jpg` is a detail from Michelangelo's *The Creation of Adam* (Sistine Chapel, c. 1512), cropped tight to the two reaching hands and colour graded to the site's ember palette. Michelangelo died in 1564, so the fresco is public domain; the source photograph is hosted as public domain on Wikimedia Commons as ['Adam's Creation Sistine Chapel ceiling' by Michelangelo JBU33cut.jpg](https://commons.wikimedia.org/wiki/File:%27Adam%27s_Creation_Sistine_Chapel_ceiling%27_by_Michelangelo_JBU33cut.jpg), the highest-resolution copy of the panel alone. Regenerate it with:

```bash
python3 scripts/grade-philosophy-image.py
```
