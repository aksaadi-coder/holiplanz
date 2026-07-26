/** Site navigation, in one place so the header and footer can't drift apart. */
import { canonicalPath, isHome } from '../utils/paths';

export interface NavLink {
  href: string;
  text: string;
}

/**
 * The top nav on every page: three anchors into the home page, then the three
 * pages a visitor is most likely to want.
 *
 * Support sits up here deliberately. It is the only utility page that sells —
 * pre-launch it answers "what does it cost", "when can I use it", "does it
 * book anything for me". Don't demote it back to the footer.
 *
 * The anchors stay bare fragments on the home page so the smooth scroll works,
 * and get rooted elsewhere, where following one costs a navigation.
 */
export function mainNav(pathname: string): NavLink[] {
  const root = isHome(pathname) ? '' : '/';
  return [
    { href: `${root}#flow`, text: 'The flow' },
    { href: `${root}#passport`, text: 'Trip Passport' },
    { href: `${root}#pricing`, text: 'Pricing' },
    { href: '/support', text: 'Support' },
    { href: '/about', text: 'About' },
    { href: '/contact', text: 'Contact us' },
  ];
}

/**
 * The legal pages swap the top nav for their sibling: someone reading one is
 * usually looking for the other. Cookies is a section of Privacy rather than a
 * page of its own — the subjects are close and this site sets almost nothing.
 */
export const legalNav: NavLink[] = [
  { href: '/privacy', text: 'Privacy' },
  { href: '/terms', text: 'Terms' },
];

export function productLinks(pathname: string): NavLink[] {
  const root = isHome(pathname) ? '' : '/';
  return [
    { href: `${root}#flow`, text: 'The flow' },
    { href: `${root}#passport`, text: 'Trip Passport' },
    { href: `${root}#pricing`, text: 'Pricing' },
  ];
}

export const companyLinks: NavLink[] = [
  { href: '/about', text: 'About' },
  { href: '/support', text: 'Support' },
  { href: '/contact', text: 'Contact us' },
];

/** The footer's Legal column — Cookies now lives inside Privacy. */

export const legalLinks: NavLink[] = legalNav;

/** True when a nav link points at the page currently being rendered. */
export function isCurrent(href: string, pathname: string): boolean {
  return !href.includes('#') && href === canonicalPath(pathname);
}
