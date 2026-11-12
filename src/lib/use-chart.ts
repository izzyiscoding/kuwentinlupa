import type { DatasetInfo } from '../api/types';
import type { DatasetKey } from '../config';
import { useLang } from './lang';

/** The two versions as chart series: always two bars, never one sum. */
export function useSeries() {
  const { t } = useLang();
  return [
    { key: 'house', label: t('House bill', 'House bill'), cls: 'fill-house' },
    { key: 'nep', label: 'NEP', cls: 'fill-nep' },
  ];
}

/** "dpwh" → the program's short name, as the API publishes it. */
export function useProgramName(datasets: DatasetInfo[]) {
  return (k: DatasetKey) => datasets.find((d) => d.key === k)?.short ?? k.toUpperCase();
}
