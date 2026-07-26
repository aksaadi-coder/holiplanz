# Holiplanz — marketing site

The public site for Holiplanz — six pages, all designed. Built from
`design_handoff_holiplanz_website` (Phase 5).

It is a static brochure: no accounts, no data fetching, no network calls. Every call to action
resolves to "Coming soon · iPhone & Android · 2026", because there is no product on the web to
send anyone to.

**JavaScript ships on the home page only**, and only for the live demo — about 3KB, inlined, no
separate request. Every other page ships none. Two things stay script-free on purpose and should
remain so: the Support FAQ is native `<details>`, and the §04 reel is CSS scroll-snap rather than
a carousel.

This lives inside the app repo but is a completely separate project — its own `package.json`,
its own build, its own Vercel project. It is deliberately **not** in the root `workspaces` array,
so `npm install` and `npm run build` for the app are untouched by anything in here.

## Running it

```bash
cd website && npm install && npm run dev
```

| Command | What it does |
| --- | --- |
| `npm run dev` | Dev server on http://localhost:4321 |
| `npm run build` | Static build into `dist/` |
| `npm run preview` | Serve the built output |
| `npm run check` | Type-check the `.astro` files |

## Structure

```
src/
  styles/tokens/    design-system tokens, copied verbatim from the handoff
  styles/global.css tokens + the web-only additions (focus rings, link hover, reduced motion)
  layouts/          Base (head, meta, footer wrapper) · LegalPage (privacy + terms)
  components/       Band · StepBand · ScreenshotFrame · PageBanner · RailLayout · Ring
  data/             nav.ts (link lists) · site.ts (address, legal-review + indexable flags)
  pages/            index + about, support, contact, privacy, terms
```

The five subpages share one shell, as the handoff asks: `PageBanner` is the coral band carrying
the nav *and* the page title, and `Base` supplies the dark footer. `Band`, `StepBand` and
`ScreenshotFrame` are the home page's section patterns, reused on About; `RailLayout` is the
sticky-rail pattern shared by Support and the two legal pages; `Ring` is the dashed-coral stamp
mark doing duty as a numeral or a flag. How it Works, Trip Passport and Pricing are still to be
designed as standalone pages and are made of the same material.

The top nav is the same six links on every page — The flow · Trip Passport · Pricing · Support ·
About · Contact us — except the two legal pages, which swap in Privacy · Terms, since someone
reading one is usually looking for the other. **Support belongs in the top nav**: pre-launch it
is the only utility page that sells, answering what it costs and when you can use it. Don't
demote it to the footer.

**Cookies is a section of Privacy** (`/privacy#cookies`), not a page. `/cookies` was live at one
point, so `vercel.json` permanently redirects it. Privacy stays standalone whatever else moves —
Apple and Google both require a dedicated privacy-policy URL for app submission.

### The rules worth not breaking

- **Coral is earned.** It belongs to the wordmark, the hero field, the stamps, the demo's send
  button and `✈ READY`. Buttons are Ink (`--command`), not coral — and the Trip Pass tier is a
  muted label with no coral and no "new" tag; its inset ring already carries the emphasis.
- **The live demo must not over-promise.** It is keyword matching over three stops, not AI, and
  reordering is ↑/↓ buttons, not drag. An earlier revision described grabbing a card by a handle
  when neither existed. Don't describe an affordance the build doesn't render.
- **No shadows.** `--shadow-card: none`. Emphasis is an inset ring (`inset 0 0 0 1px`), never
  elevation, never a border.
- **Dark bands carry no dark colours.** A band goes dark by setting `data-theme="dark"` and
  letting the semantic tokens flip. Anything that hardcodes a dark value breaks that.
- **Screenshots are never cropped where a screen is the subject.** Full width, auto height,
  inside a rounded hairline frame. The one exception is where several sit side by side — the §04
  reel and §05 — which use `ScreenshotFrame`'s `ratio` prop, because the exports aren't all the
  same pixel ratio and otherwise the cards end at different heights.
- **The §04 reel keeps its tab stop and its visible scrollbar.** There are no arrow buttons, so
  without both the overflowing card is unreachable for keyboard and mouse-only users.
- **The contents rail collapses, not compresses.** `RailLayout` is a wrapping flex row, never a
  grid with a fixed first track — that variant left a 119px body column at 375px.

## Deploying

A second Vercel project, pointing at the same GitHub repo with **Root Directory = `website`**.
Vercel then reads `website/vercel.json` and ignores the app's, so the two deployments never
interfere. Astro is auto-detected.

Set `PUBLIC_SITE_URL` to the production origin (e.g. `https://holiplanz.com`) in that project's
environment variables — it feeds the canonical tags, the Open Graph URLs and the sitemap.
Without it the build falls back to `https://holiplanz.com`.

## Before this goes live

- [ ] **Legal review.** Privacy and Terms carry a visible "Draft — needs legal review" notice,
      because the handoff is explicit that the wording was written for voice and structure and has
      not been checked against real data practices, suppliers and jurisdictions. Once a lawyer has
      approved the text, set `site.legalReviewed = true` in `src/data/site.ts` and both notices
      disappear. Don't remove them any other way.
- [ ] **`src/data/site.ts`** — `hello@holiplanz.com` is the placeholder the design specifies, not
      a confirmed address. It is now the site's only address and the single action the site
      offers, so the mailbox needs to exist before launch.
- [ ] **The site is unlisted.** `site.indexable` is `false`, so every page carries
      `noindex, nofollow`, `robots.txt` disallows everything and the sitemap isn't advertised —
      a deploy can be shared without turning up in search results. Flip it to `true` at launch;
      `robots.txt` is generated from the same flag, so nothing else needs changing.
- [ ] **`public/assets/brand/stamp-pin.png`** is a 256px PNG, rendered at 18px and 20px and
      inverted in both places; the handoff asks for a commissioned SVG before shipping.
- [ ] **App screenshots** in `src/assets/screenshots/` are exports from a build in progress and
      are expected to be replaced. They only enter the page through `ScreenshotFrame`, so
      swapping them is a file swap.

## Regenerating the Open Graph image

`public/og.png` is rendered from `scripts/og.html` with headless Chrome:

```bash
"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" --headless=new --disable-gpu --hide-scrollbars --force-device-scale-factor=1 --window-size=1200,630 --virtual-time-budget=6000 --screenshot=public/og.png scripts/og.html
```

## Where this differs from the handoff

Deliberate deviations, all noted in the code where they happen:

1. **The live demo's copy says "move a card up or down yourself"** where the prototype says "take
   hold of a card and move it". The build renders ↑/↓ buttons, not drag, and the handoff's own
   rule is not to describe an affordance that isn't there.
2. **`minmax(min(360px, 100%), 1fr)`** on the two-column grids. The bare 360px minimum makes the
   column wider than its container below ~400px and the content runs off the right edge of a
   phone. Identical everywhere the minimum actually fits.
3. **Fonts load via `<link>` rather than the token bundle's CSS `@import`**, which is
   render-blocking and can't be preconnected. Same families, same weights.
4. **The draft notice on the legal pages is drawn quieter** than the design's filled box — a slim
   dashed-edged line rather than a block. It stays visible, and the dashed coral edge (the stamp
   motif at document scale) is kept. Requested during the build.
5. **The stamp-pin uses `brightness(0) invert(1)` in both places it appears.** The design uses
   that in the banner and a plain `invert(1)` in the footer; the artwork isn't pure black, so the
   plain invert yields a grey mark rather than a white one. Unified on the correct one.
6. **Five near-identical body greys collapsed to three tokens.** The designs specify 0.55, 0.60,
   0.62, 0.66 and 0.70 black. These are `--text-faint` (0.55), `--text-muted-strong` (0.62) and
   `--text-body` (0.70) — nothing shifts by more than 0.06 alpha, and each token has a role.

Plus the two things the handoff asks to be added because the prototype had no answer for them:
a visible focus style (a dashed coral ring, echoing the stamp) and `prefers-reduced-motion`
handling for the stamp ring and smooth scrolling.
