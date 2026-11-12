/**
 * Lines by the barangay their title names, and by program: the groupings the
 * charts draw. Pure, so `npm run check` prints the same groups.
 *
 * - A line is under a barangay only when its title names it. Nothing is
 *   guessed from a subdivision or street ("Victoria Homes" stays unnamed).
 * - When one name sits inside another ("Ayala Alabang" holds "Alabang"),
 *   the longer one wins for that title.
 * - A line naming two barangays is under both, so barangay sums overlap and
 *   are never added up; each group is summed per version by `summarise()`.
 */
import type { Barangay } from '../config';
import { fold, summarise, type ScopedProject, type Summary } from './scope';

/** "Ayala Alabang" → "ayala-alabang", for URLs. */
export const slug = (s: string) => fold(s).replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

const escape = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/** The barangays a title names, as whole words, in config order. */
export function barangaysOf(title: string, barangays: readonly Barangay[]): string[] {
  // Longest terms first, each blanked out once found, so "Ayala Alabang"
  // is not also read as "Alabang".
  const terms = barangays
    .flatMap((b) => (b.match?.length ? b.match : [b.name]).map((m) => ({ name: b.name, m: fold(m) })))
    .sort((a, b) => b.m.length - a.m.length);
  let rest = fold(title);
  const found = new Set<string>();
  for (const { name, m } of terms) {
    const re = new RegExp(`(^|[^a-z0-9])${escape(m)}(?=[^a-z0-9]|$)`, 'g');
    if (re.test(rest)) {
      found.add(name);
      rest = rest.replace(re, '$1 ');
    }
  }
  return barangays.map((b) => b.name).filter((n) => found.has(n));
}

export interface Group {
  key: string;
  label: string;
  rows: ScopedProject[];
  summary: Summary;
}

/** One group per barangay with lines (config order), then the lines that name none. */
export function byBarangay(rows: readonly ScopedProject[], barangays: readonly Barangay[]): { groups: Group[]; unnamed: Group } {
  const by = new Map<string, ScopedProject[]>(barangays.map((b) => [b.name, []]));
  const unnamed: ScopedProject[] = [];
  for (const r of rows) {
    const names = barangaysOf(r.title, barangays);
    if (!names.length) unnamed.push(r);
    for (const n of names) by.get(n)!.push(r);
  }
  const groups = barangays
    .map((b) => ({ key: slug(b.name), label: b.name, rows: by.get(b.name)!, summary: summarise(by.get(b.name)!) }))
    .filter((g) => g.rows.length);
  return { groups, unnamed: { key: '', label: '', rows: unnamed, summary: summarise(unnamed) } };
}

/** One group per program line (the API's `program`), largest House bill sum first. */
export function byProgram(rows: readonly ScopedProject[]): Group[] {
  const by = new Map<string, ScopedProject[]>();
  for (const r of rows) {
    const k = r.program || r.dataset.toUpperCase();
    by.set(k, [...(by.get(k) ?? []), r]);
  }
  return [...by.entries()]
    .map(([k, rs]) => ({ key: k, label: k, rows: rs, summary: summarise(rs) }))
    .sort((a, b) => b.summary.house.php - a.summary.house.php || b.rows.length - a.rows.length);
}
