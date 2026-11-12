import { useId } from 'react';

/**
 * The portal's mark: an emerald tile with three rising bars (an M, and a
 * chart) over a lake line. Not a seal or any government emblem: this portal
 * is independent.
 */
export function BrandMark({ size = 40 }: { size?: number }) {
  const id = useId();
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" aria-hidden="true" className="brand-mark">
      <defs>
        <linearGradient id={`${id}-bg`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="var(--accent-fill-2)" />
          <stop offset="1" stopColor="var(--accent-fill)" />
        </linearGradient>
        <linearGradient id={`${id}-gloss`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#fff" stopOpacity="0.32" />
          <stop offset="1" stopColor="#fff" stopOpacity="0" />
        </linearGradient>
      </defs>
      <rect width="40" height="40" rx="11" fill={`url(#${id}-bg)`} />
      <path d="M2 11a9 9 0 0 1 9-9h18a9 9 0 0 1 9 9v5c-6 3-30 3-36 0z" fill={`url(#${id}-gloss)`} />
      <path d="M10 27V17m7 10V11m7 16v-8" stroke="#fff" strokeWidth="3.4" strokeLinecap="round" />
      <path d="M8 32c2.5 0 2.5-1.6 5-1.6s2.5 1.6 5 1.6 2.5-1.6 5-1.6 2.5 1.6 5 1.6 2.5-1.6 4-1.6" stroke="#a7f3d0" strokeWidth="1.8" fill="none" strokeLinecap="round" />
    </svg>
  );
}
