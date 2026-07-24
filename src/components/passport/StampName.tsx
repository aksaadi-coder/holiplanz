import { useLayoutEffect, useRef, useState } from "react";

interface Props {
  text: string;
  className?: string;
  /** Largest font size (px) when the name is short. */
  max?: number;
  /** Smallest font size (px) we'll shrink to. */
  min?: number;
  /** Width (px) the text must fit within — the stamp ellipse's inner width. */
  maxWidth?: number;
}

/**
 * Destination name for the passport stamp, auto-shrunk so long country names
 * (e.g. "PORTUGAL", "UNITED KINGDOM") stay inside the fixed dashed ellipse.
 * Measures the rendered width and steps the font size down until it fits.
 */
export function StampName({ text, className, max = 52, min = 20, maxWidth = 244 }: Props) {
  const ref = useRef<HTMLSpanElement>(null);
  const [size, setSize] = useState(max);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    let next = max;
    el.style.fontSize = `${next}px`;
    while (next > min && el.scrollWidth > maxWidth) {
      next -= 1;
      el.style.fontSize = `${next}px`;
    }
    setSize(next);
  }, [text, max, min, maxWidth]);

  return (
    <span ref={ref} className={className} style={{ fontSize: size }}>
      {text}
    </span>
  );
}
