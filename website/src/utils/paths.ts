/**
 * Astro builds with `format: 'file'`, so at build time a page's pathname is
 * `/about.html` while the URL it will actually be served at — and the one the
 * sitemap lists — is `/about`. Anything that compares or publishes a path has
 * to normalise first, or the canonical tag will advertise a URL that differs
 * from the link everyone follows.
 */
export function canonicalPath(pathname: string): string {
  const stripped = pathname.replace(/index\.html$/, '').replace(/\.html$/, '');
  return stripped === '' ? '/' : stripped;
}

export function isHome(pathname: string): boolean {
  return canonicalPath(pathname) === '/';
}
