/** Site navigation, in one place so the header and footer can't drift apart. */
import { canonicalPath, isHome } from '../utils/paths';

export interface NavLink {
  href: string;
  text: string;
}

/**
 * The top nav on all seven pages: three anchors into the home page, then the
 * two pages a visitor is most likely to want. Support is deliberately not up
 * here — it lives in the footer, and Contact points at it.
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
    { href: '/about', text: 'About' },
    { href: '/contact', text: 'Contact us' },
  ];
}

/**
 * The legal pages swap the top nav for their siblings: someone reading one of
 * the three is usually looking for another.
 */
export const legalNav: NavLink[] = [
  { href: '/privacy', text: 'Privacy' },
  { href: '/terms', text: 'Terms' },
  { href: '/cookies', text: 'Cookies' },
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

export const legalLinks: NavLink[] = legalNav;

/** True when a nav link points at the page currently being rendered. */
export function isCurrent(href: string, pathname: string): boolean {
  return !href.includes('#') && href === canonicalPath(pathname);
}
