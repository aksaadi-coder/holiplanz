import type { APIRoute } from 'astro';
import { site } from '../data/site';

/**
 * robots.txt, generated rather than static so it can't disagree with the
 * noindex tags — both read `site.indexable`.
 *
 * While the site is unlisted this disallows everything and says nothing about
 * the sitemap, so a shareable deploy doesn't turn up in search results.
 */
export const GET: APIRoute = ({ site: origin }) => {
  const body = site.indexable
    ? ['User-agent: *', 'Allow: /', '', `Sitemap: ${new URL('/sitemap-index.xml', origin)}`, ''].join('\n')
    : ['# Unlisted while the app is pre-launch.', 'User-agent: *', 'Disallow: /', ''].join('\n');

  return new Response(body, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
};
