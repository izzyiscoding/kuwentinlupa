/**
 * Small line icons, always beside a text label (never the only way to read
 * something). 24px grid, drawn with currentColor.
 */
import type { IconName as Name } from '../lib/words';

const PATHS: Record<Name, string> = {
  flood: 'M3 15c2 0 2-1.5 4.5-1.5S10 15 12 15s2-1.5 4.5-1.5S19 15 21 15M3 19c2 0 2-1.5 4.5-1.5S10 19 12 19s2-1.5 4.5-1.5S19 19 21 19M12 3v8m-3-3 3 3 3-3',
  building: 'M4 21V8l8-5 8 5v13M9 21v-6h6v6M3 21h18',
  road: 'M8 3 5 21M16 3l3 18M12 4v3m0 4v3m0 4v3',
  bridge: 'M2 17h20M4 17v-3a8 8 0 0 1 16 0v3M8 17v-4m8 4v-4m-4 4v-5',
  health: 'M9 3h6v6h6v6h-6v6H9v-6H3V9h6z',
  farm: 'M12 21V9m0 0c0-3 2-6 6-6 0 4-3 6-6 6Zm0 0C12 6 10 3 6 3c0 4 3 6 6 6Z',
  water: 'M12 3s6 7 6 11a6 6 0 0 1-12 0c0-4 6-11 6-11Z',
  other: 'M4 4h7v7H4zM13 4h7v7h-7zM4 13h7v7H4zM13 13h7v7h-7z',
  doc: 'M6 3h9l4 4v14H6zM14 3v5h5M9 13h7M9 17h7',
  compare: 'M7 20V10m5 10V4m5 16v-7',
  search: 'M11 18a7 7 0 1 1 0-14 7 7 0 0 1 0 14Zm5-2 5 5',
  pin: 'M12 21s-7-6.5-7-12a7 7 0 0 1 14 0c0 5.5-7 12-7 12Zm0-9a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z',
  chart: 'M4 20h16M7 16V9m5 7V5m5 11v-4',
  list: 'M9 6h11M9 12h11M9 18h11M4 6h.01M4 12h.01M4 18h.01',
  mail: 'M3 6h18v12H3zm0 0 9 7 9-7',
  flag: 'M5 21V4m0 0h11l-2 4 2 4H5',
  sun: 'M12 16a4 4 0 1 0 0-8 4 4 0 0 0 0 8ZM12 2v2m0 16v2M4.9 4.9l1.4 1.4m11.4 11.4 1.4 1.4M2 12h2m16 0h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4',
  moon: 'M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5Z',
};

export function Icon({ name, size = 20, className }: { name: Name; size?: number; className?: string }) {
  return (
    <svg className={className} width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d={PATHS[name]} />
    </svg>
  );
}
