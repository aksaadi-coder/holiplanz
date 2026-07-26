// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

// The canonical origin. Used for <link rel="canonical">, Open Graph URLs and
// sitemap.xml — all three need an absolute URL, so this is the one place the
// domain is written down. Vercel exposes the deployment URL as VERCEL_URL on
// preview builds; production should set PUBLIC_SITE_URL to the real domain.
const site =
  process.env.PUBLIC_SITE_URL ??
  (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'https://holiplanz.com');

// https://astro.build/config
export default defineConfig({
  site,
  server: {
    // Honour an assigned PORT so the dev server can be started alongside the
    // app's without the two fighting over a fixed number. 4321 is Astro's own
    // default and stays the answer when nothing is assigned.
    port: Number(process.env.PORT) || 4321,
  },
  integrations: [sitemap()],
  // Everything on this site is static content, so prerender the lot. No
  // adapter, no serverless function — Vercel serves the dist/ folder directly.
  output: 'static',
  // One URL per page, no trailing slash. 'file' output pairs with Vercel's
  // cleanUrls so /about is served from about.html and Astro.url.pathname —
  // which the canonical tag and the nav both read — agrees with the link.
  trailingSlash: 'never',
  build: {
    format: 'file',
    // Hashed filenames for CSS/JS; the screenshots go through astro:assets
    // and are hashed too, so both can be cached indefinitely.
    assets: '_assets',
  },
  image: {
    // The seven app screenshots are 804×1748 PNGs and are by far the heaviest
    // thing on the page. sharp re-encodes them to AVIF/WebP at the sizes they
    // are actually displayed at.
    service: { entrypoint: 'astro/assets/services/sharp' },
  },
});
