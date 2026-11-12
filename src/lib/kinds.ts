/**
 * Everyday kinds of work, for "what this budget means for you": the API's
 * own sub-line (`pap`), program and title, sorted into a few groups a
 * resident recognises. A grouping of published lines, nothing computed:
 * each group is counted and summed per version by `summarise()`.
 */
import type { IconName } from './words';
import { summarise, type ScopedProject, type Summary } from './scope';

export type Kind = 'flood' | 'building' | 'road' | 'health' | 'other';
export const KINDS: readonly Kind[] = ['flood', 'building', 'road', 'health', 'other'];
export const KIND_ICON: Record<Kind, IconName> = { flood: 'flood', building: 'building', road: 'road', health: 'health', other: 'other' };

/** The kind's name, in the reader's language (`t` from useLang). */
export function kindLabel(kind: Kind, t: (en: string, fil: string) => string): string {
  return {
    flood: t('Flood control', 'Kontra-baha'),
    building: t('Community buildings', 'Mga gusaling pangkomunidad'),
    road: t('Roads and bridges', 'Mga daan at tulay'),
    health: t('Health facilities', 'Pasilidad pangkalusugan'),
    other: t('Other works', 'Iba pang gawain'),
  }[kind];
}

export function kindOf(p: Pick<ScopedProject, 'pap' | 'program' | 'title' | 'dataset'>): Kind {
  const s = `${p.pap ?? ''} ${p.program ?? ''}`.toLowerCase();
  const title = p.title.toLowerCase();
  if (p.dataset === 'hfep' || /hospital|health/.test(s)) return 'health';
  if (/flood|drainage|river/.test(s)) return 'flood';
  if (/multi-purpose|social services|buildings and other structures/.test(s) || /covered court|multi-purpose/.test(title)) return 'building';
  if (/road|bridge|preventive maintenance/.test(s)) return 'road';
  return 'other';
}

export function byKind(rows: readonly ScopedProject[]): { kind: Kind; rows: ScopedProject[]; summary: Summary }[] {
  return KINDS.map((kind) => {
    const rs = rows.filter((r) => kindOf(r) === kind);
    return { kind, rows: rs, summary: summarise(rs) };
  }).filter((g) => g.rows.length);
}
