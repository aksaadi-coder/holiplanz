/**
 * Site-wide details that appear in copy, in one place.
 *
 * ⚠ The addresses are the placeholders the design specifies, not confirmed
 * facts. They have to be checked and the mailboxes have to exist before the
 * site is pointed at a live domain — the legal and contact pages read as
 * statements of fact to anyone who lands on them.
 */
export const site = {
  name: 'Holiplanz',
  tagline: 'Plan less. Experience more.',

  /** TODO: confirm — the mailboxes have to exist before these pages go live. */
  generalEmail: 'hello@holiplanz.com',
  pressEmail: 'press@holiplanz.com',
  privacyEmail: 'privacy@holiplanz.com',

  /** Shown in the banner of each legal page. Bump it when the text changes. */
  legalUpdated: '26 July 2026',

  /**
   * The one switch that decides whether search engines may have this site.
   * While false, every page carries a noindex/nofollow tag, robots.txt
   * disallows everything, and the sitemap isn't advertised — so a deploy can
   * be shared with people without turning up in results.
   *
   * Flip to true at launch. Nothing else needs changing.
   */
  indexable: false,

  /**
   * Flip to true once a qualified lawyer has approved the privacy, terms and
   * cookies wording against the real data practices, suppliers and
   * jurisdictions. Until then the pages carry a draft notice.
   */
  legalReviewed: false,
} as const;
