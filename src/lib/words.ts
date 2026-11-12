/**
 * Small shared helpers for the pages: status wording, office short names,
 * links, the program icon, and stable empty lists.
 */
import type { BridgeGroup, DatasetInfo, GroupInfo } from '../api/types';
import { BRIDGE_GROUPS } from '../api/types';
import type { Barangay } from '../config';
import type { ScopedProject } from './scope';

/**
 * Our own one-line Filipino gloss for each status, shown beside the API's
 * label (never instead of it). "Candidates to check", never findings.
 */
export const STATUS_FIL: Record<BridgeGroup, string> = {
  house_only: 'Nasa House bill lang: dapat suriin, hindi pa tiyak na idinagdag',
  nep_only: 'Nasa NEP lang: dapat suriin, hindi pa tiyak na tinanggal',
  unchanged: 'Parehong halaga sa dalawa',
  increased: 'Mas mataas sa House bill',
  decreased: 'Mas mababa sa House bill',
  scope_review: 'Ibang bahagi ng parehong daan; hindi binibilang na pagbabago',
};

/** Group wording from the API (label, sub, help), falling back to the row's own label. */
export type GroupWords = Pick<GroupInfo, 'label' | 'sub' | 'help'>;

export function groupInfo(datasets: DatasetInfo[], rows: readonly ScopedProject[]): Record<BridgeGroup, GroupWords> {
  const fromApi = datasets[0]?.bridge.groups;
  const out = {} as Record<BridgeGroup, GroupWords>;
  for (const g of BRIDGE_GROUPS) {
    out[g] = fromApi?.[g] ?? { label: rows.find((r) => r.bridge_group === g)?.group_label ?? g, sub: '', help: '' };
  }
  return out;
}

/** "Bohol 1st District Engineering Office" → "Bohol 1st DEO", for tight spaces. */
export function shortOffice(office: string): string {
  return office.replace(/ District Engineering Office$/, ' DEO');
}

export const projectHref = (p: { dataset: string; id: string }) => `/projects/${p.dataset}/${encodeURIComponent(p.id)}`;

export type IconName = 'flood' | 'building' | 'road' | 'bridge' | 'health' | 'farm' | 'water' | 'other' | 'doc' | 'compare' | 'search' | 'pin' | 'chart' | 'list' | 'mail' | 'flag' | 'sun' | 'moon';

/** An icon for a program line, from words in its name; "other" when none fits. */
export function programIcon(program: string): IconName {
  const p = program.toLowerCase();
  if (/flood|drainage|river/.test(p)) return 'flood';
  if (/bridge/.test(p)) return 'bridge';
  if (/road|asset preservation|highway|expressway/.test(p)) return 'road';
  if (/health|hospital/.test(p)) return 'health';
  if (/irrigation|farm/.test(p)) return 'farm';
  if (/water/.test(p)) return 'water';
  if (/building|convergence|local program|school/.test(p)) return 'building';
  return 'other';
}

/** Stable empty lists, so `config.barangays ?? NO_BARANGAYS` does not change on every render. */
export const NO_BARANGAYS: readonly Barangay[] = [];
export const NO_DATASETS: DatasetInfo[] = [];
