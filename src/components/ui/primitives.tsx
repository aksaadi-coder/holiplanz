// Shared UI primitives for the Holiplanz design system.
import type { ButtonHTMLAttributes, ReactNode } from "react";
import { useEffect } from "react";
import { CloseIcon } from "./icons";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost" | "coral";
};

/** Pill button. Primary = Ink fill; coral is reserved for highlight moments. */
export function PillButton({ variant = "primary", className = "", ...props }: ButtonProps) {
  return <button className={`hp-btn hp-btn-${variant} ${className}`.trim()} {...props} />;
}

/** Full-width bottom call-to-action, one primary action per screen. */
export function BottomCta({ variant = "primary", className = "", ...props }: ButtonProps) {
  return (
    <div className="hp-bottom-cta">
      <PillButton variant={variant} className={className} {...props} />
    </div>
  );
}

interface ChipProps {
  label: string;
  selected?: boolean;
  onClick?: () => void;
}

/** Selection chip. Selected = solid black pill / white text (identity change). */
export function Chip({ label, selected, onClick }: ChipProps) {
  return (
    <button
      type="button"
      className={`hp-chip ${selected ? "is-selected" : ""}`.trim()}
      aria-pressed={selected}
      onClick={onClick}
    >
      {label}
    </button>
  );
}

interface StampRingProps {
  size?: number;
  spinning?: boolean;
  children?: ReactNode;
}

/** Dashed passport-stamp ring — the brand's repeating graphic device. */
export function StampRing({ size = 120, spinning = false, children }: StampRingProps) {
  return (
    <div className="hp-stamp-ring" style={{ width: size, height: size }}>
      <div className={`hp-stamp-ring-dash ${spinning ? "is-spinning" : ""}`.trim()} />
      {children != null && <div className="hp-stamp-ring-body">{children}</div>}
    </div>
  );
}

interface SheetProps {
  open: boolean;
  onClose: () => void;
  title?: ReactNode;
  children: ReactNode;
}

/** Bottom sheet used for detail overlays (stop detail, trip info, hotel, share). */
export function Sheet({ open, onClose, title, children }: SheetProps) {
  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div className="hp-sheet-backdrop" onClick={onClose}>
      <div className="hp-sheet" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
        <div className="hp-sheet-grip" />
        {title != null && (
          <div className="hp-sheet-head">
            <div className="hp-sheet-title">{title}</div>
            <button type="button" className="hp-icon-btn" aria-label="Close" onClick={onClose}>
              <CloseIcon size={20} />
            </button>
          </div>
        )}
        <div className="hp-sheet-body">{children}</div>
      </div>
    </div>
  );
}

/** 13px uppercase section label. */
export function Label({ children }: { children: ReactNode }) {
  return <p className="hp-label">{children}</p>;
}

/**
 * A value a page translator must leave alone — a time, a date, a count, a
 * price, a place name. Anything that can change while the app is open.
 *
 * Chrome on Android offers to translate this app, and a translator replaces
 * every text node it touches with one of its own. React still holds the
 * originals, so from that point on each update writes to a node no longer in
 * the document and the value on screen freezes at whatever it said when the
 * page was translated. That's how the home screen came to show "Dates · 1 day"
 * over fields reading 17/09/2026 and 10 days. `translate="no"` keeps the
 * translator out, so React keeps ownership and the value stays true.
 *
 * Two rules for using it:
 *
 * - Wrap the **varying part only**, and leave the words around it as ordinary
 *   text — those get translated once and never need updating, so they're safe.
 *   Reach for a whole-string Value only when the wording itself varies with the
 *   value ("1 day" / "10 days"), where a half-translated result would be worse.
 * - For **prose** that changes — a chat reply, an undo message — don't use this
 *   at all. Give the element a `key` derived from the text instead: React then
 *   mounts a fresh element the translator is free to translate, so the reader
 *   gets it in their own language AND up to date.
 *
 * Where the value already sits alone in an element, put `translate="no"` on
 * that element rather than nesting another span inside it.
 */
export function Value({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <span translate="no" className={className}>
      {children}
    </span>
  );
}

interface FloatingCardProps {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
}

/**
 * Inset floating card overlay — the design's pattern for Trip info and Card
 * detail (sits 20px from the sides, 64px top/bottom, over a dimmed backdrop).
 * Distinct from the bottom `Sheet`.
 */
export function FloatingCard({ open, onClose, children }: FloatingCardProps) {
  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div className="hp-float-backdrop" onClick={onClose}>
      <div className="hp-float-card" role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
        {children}
      </div>
    </div>
  );
}

interface ToggleProps {
  checked: boolean;
  onChange: (next: boolean) => void;
  label: string;
}

/** 52×30 switch used on the Preferences rows. */
export function Toggle({ checked, onChange, label }: ToggleProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      className={`hp-toggle ${checked ? "is-on" : ""}`.trim()}
      onClick={() => onChange(!checked)}
    >
      <span className="hp-toggle-knob" />
    </button>
  );
}

/** Circular ✕ used in the design's card headers and full-screen headers. */
export function CloseCircle({ onClose, label = "Close" }: { onClose: () => void; label?: string }) {
  return (
    <button type="button" className="hp-close-circle" onClick={onClose} aria-label={label}>
      <CloseIcon size={17} />
    </button>
  );
}
