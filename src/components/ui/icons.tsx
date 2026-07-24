// Inline SVG icons for the Holiplanz UI. All use `currentColor` so they inherit
// text color and flip with theme. 1.5px rounded-outline house style.
import type { SVGProps } from "react";

type IconProps = SVGProps<SVGSVGElement> & { size?: number };

function base({ size = 20, ...props }: IconProps) {
  return {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.6,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    ...props,
  };
}

/** Solid coral variant (map-pin motif on the loading ring) — outline by default. */
export function PinIcon({ filled, ...props }: IconProps & { filled?: boolean }) {
  const svgProps = filled ? { ...base(props), fill: "currentColor", stroke: "none" } : base(props);
  return (
    <svg {...svgProps}>
      <path d="M12 21s-6.5-6-6.5-10.5A6.5 6.5 0 0 1 12 4a6.5 6.5 0 0 1 6.5 6.5C18.5 15 12 21 12 21Z" />
      <circle cx="12" cy="10.5" r="2.25" fill={filled ? "var(--paper)" : undefined} />
    </svg>
  );
}

export function ArrowRightIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M5 12h14" />
      <path d="m13 6 6 6-6 6" />
    </svg>
  );
}

export function PlusIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M12 5v14M5 12h14" />
    </svg>
  );
}

export function ChevronRightIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="m9 6 6 6-6 6" />
    </svg>
  );
}

export function ChevronDownIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="m6 9 6 6 6-6" />
    </svg>
  );
}

export function EmailIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="m3 7 9 6 9-6" />
    </svg>
  );
}

export function AppleIcon({ size = 20, ...props }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" {...props}>
      <path d="M17.05 12.53c-.02-2.3 1.88-3.4 1.96-3.46-1.07-1.56-2.73-1.78-3.32-1.8-1.41-.14-2.76.83-3.48.83-.72 0-1.82-.81-3-.79-1.54.02-2.96.9-3.75 2.28-1.6 2.78-.41 6.89 1.15 9.15.76 1.1 1.67 2.35 2.86 2.3 1.15-.05 1.58-.74 2.97-.74 1.38 0 1.77.74 2.98.72 1.23-.02 2.01-1.12 2.76-2.24.87-1.28 1.23-2.52 1.25-2.58-.03-.01-2.4-.92-2.42-3.64ZM14.77 5.6c.64-.77 1.07-1.85.95-2.92-.92.04-2.03.61-2.69 1.38-.59.68-1.11 1.78-.97 2.83 1.03.08 2.07-.52 2.71-1.29Z" />
    </svg>
  );
}

export function GoogleIcon({ size = 20, ...props }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" {...props}>
      <path fill="#4285F4" d="M23.06 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h6.2a5.3 5.3 0 0 1-2.3 3.48v2.9h3.72c2.18-2 3.44-4.96 3.44-8.39Z" />
      <path fill="#34A853" d="M12 23.5c3.1 0 5.7-1.03 7.6-2.78l-3.72-2.9c-1.03.7-2.35 1.1-3.88 1.1-2.98 0-5.5-2.01-6.4-4.72H1.76v2.99A11.5 11.5 0 0 0 12 23.5Z" />
      <path fill="#FBBC05" d="M5.6 14.2a6.9 6.9 0 0 1 0-4.4V6.8H1.76a11.5 11.5 0 0 0 0 10.4l3.84-3Z" />
      <path fill="#EA4335" d="M12 4.75c1.68 0 3.19.58 4.38 1.72l3.28-3.28A11.5 11.5 0 0 0 12 .5 11.5 11.5 0 0 0 1.76 6.8l3.84 3c.9-2.7 3.42-4.72 6.4-4.72Z" />
    </svg>
  );
}

export function CloseIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M6 6 18 18M18 6 6 18" />
    </svg>
  );
}

export function InfoIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 11v5M12 8h.01" />
    </svg>
  );
}

/** Save-trip toggle — pass fill="currentColor" for the saved state. */
export function BookmarkIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M18 21 12 16.5 6 21V5a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v16Z" />
    </svg>
  );
}

/** Trash can — revealed behind a row/card mid swipe-to-delete. */
export function TrashIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M4 7h16M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2M6 7l1 13a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1l1-13M10 11v6M14 11v6" />
    </svg>
  );
}

// Itinerary glyphs
/** Train — used on the "How to get there" row of the Card detail. */
export function TransitIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <rect x="5" y="3" width="14" height="15" rx="2" />
      <path d="M5 11h14M9 18l-1.5 3M15 18l1.5 3" />
      <circle cx="9" cy="14.5" r="0.5" />
      <circle cx="15" cy="14.5" r="0.5" />
    </svg>
  );
}

/** Three vertical bars — the stop-card drag handle. */
export function GripIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M9 5.5v13M13 5.5v13M17 5.5v13" />
    </svg>
  );
}

/** Concentric circles — the collapsed Map card mark. */
export function MapTargetIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <circle cx="12" cy="12" r="8.5" />
      <circle cx="12" cy="12" r="3.5" />
    </svg>
  );
}

export function ArrowUpIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M12 19V5" />
      <path d="m6 11 6-6 6 6" />
    </svg>
  );
}

export function PlusCircleIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 8.5v7M8.5 12h7" />
    </svg>
  );
}

// Home "What holiplanz does" feature glyphs
export function PlanFeatureIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M3 16c2.6 0 2.9-5 5.5-5s2.9 5 5.5 5 2.9-6 5.5-6" />
    </svg>
  );
}

export function StayFeatureIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M4 9h11a4 4 0 0 1 4 4v3" />
      <path d="M4 6v10" />
      <path d="M4 13h15" />
      <path d="M8 13v-2a1 1 0 0 1 1-1h3" />
    </svg>
  );
}

export function PersonaliseFeatureIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M7 4v16M12 4v16M17 4v16" />
      <path d="M5 8h4M14 13h4M10 16h4" />
    </svg>
  );
}

export function ExploreFeatureIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 7.5 13.6 12 12 16.5 10.4 12z" />
    </svg>
  );
}

// Tab-bar glyphs
export function HomeTabIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M4 11 12 4l8 7" />
      <path d="M6 10v9a1 1 0 0 0 1 1h10a1 1 0 0 0 1-1v-9" />
    </svg>
  );
}

export function TripsTabIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <rect x="4" y="7" width="16" height="13" rx="2" />
      <path d="M9 7V5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2" />
    </svg>
  );
}

export function PassportTabIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <rect x="5" y="3" width="14" height="18" rx="2" />
      <circle cx="12" cy="10" r="3" />
      <path d="M9 17h6" />
    </svg>
  );
}

export function AccountTabIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <circle cx="12" cy="8" r="4" />
      <path d="M4 20a8 8 0 0 1 16 0" />
    </svg>
  );
}
