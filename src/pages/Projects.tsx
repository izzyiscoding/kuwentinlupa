/**
 * /projects: every line, with search, filters (in the URL, so a filtered list
 * can be shared), sorting and a CSV download.
 */
import { useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import type { BridgeGroup } from '../api/types';
import { BRIDGE_GROUPS } from '../api/types';
import type { DatasetKey } from '../config';
import { Await, Disclaimers } from '../components/Bits';
import { useProgramName } from '../lib/use-chart';
import { ProjectTable } from '../components/ProjectList';
import { groupInfo, NO_BARANGAYS, NO_DATASETS, shortOffice } from '../lib/words';
import { barangaysOf, slug } from '../lib/barangay';
import { projectsCsv, downloadText } from '../lib/csv';
import { count, php } from '../lib/format';
import { useLang } from '../lib/lang';
import { usePortal } from '../lib/portal-context';
import { summarise, type ScopedProject, type ScopeResult } from '../lib/scope';
import { useTitle } from '../lib/use-title';
import { kindLabel, kindOf, KINDS } from '../lib/kinds';

const PAGE = 100;

type Sort = 'house' | 'nep' | 'change' | 'title';
const CMP: Record<Sort, (a: ScopedProject, b: ScopedProject) => number> = {
  house: (a, b) => (b.house_php ?? -1) - (a.house_php ?? -1),
  nep: (a, b) => (b.nep_php ?? -1) - (a.nep_php ?? -1),
  change: (a, b) => Math.abs(b.delta_php ?? 0) - Math.abs(a.delta_php ?? 0),
  title: (a, b) => a.title.localeCompare(b.title),
};

export default function Projects() {
  const { scope, config } = usePortal();
  const { t } = useLang();
  useTitle(`${t('All projects', 'Lahat ng proyekto')} · ${config.name}`);
  return (
    <main className="page main">
      <Await state={scope} what={t('projects', 'mga proyekto')}>
        {(s) => <List scope={s} />}
      </Await>
    </main>
  );
}

function List({ scope }: { scope: ScopeResult }) {
  const { config, overview } = usePortal();
  const { t, n } = useLang();
  const datasets = overview.status === 'ready' ? overview.value.data.datasets : NO_DATASETS;
  const programName = useProgramName(datasets);
  const all = scope.projects;
  const barangays = config.barangays ?? NO_BARANGAYS;
  const summary = useMemo(() => summarise(all), [all]);
  const groups = useMemo(() => groupInfo(datasets, all), [datasets, all]);

  const [params, setParams] = useSearchParams();
  const q = params.get('q') ?? '';
  const program = (params.get('program') ?? '') as DatasetKey | '';
  const line = params.get('line') ?? '';
  const status = (params.get('status') ?? '') as BridgeGroup | '';
  const office = params.get('office') ?? '';
  const brgy = params.get('brgy') ?? '';
  const why = params.get('why') ?? '';
  const kind = params.get('kind') ?? '';
  const sort = (params.get('sort') as Sort) in CMP ? (params.get('sort') as Sort) : 'house';
  const [shown, setShown] = useState(PAGE);
  // On a phone the filters fold behind one button, so the list starts on the first screen.
  const [filtersOpen, setFiltersOpen] = useState(false);
  const setParam = (key: string, value: string) => {
    const next = new URLSearchParams(params);
    if (value) next.set(key, value);
    else next.delete(key);
    setParams(next, { replace: true });
    setShown(PAGE);
  };

  const offices = useMemo(() => {
    const m = new Map<string, number>();
    for (const p of all) if (p.office) m.set(p.office, (m.get(p.office) ?? 0) + 1);
    return [...m.entries()].sort((a, b) => b[1] - a[1]);
  }, [all]);
  const reasons = useMemo(() => {
    const m = new Map<string, string>();
    for (const p of all) for (const r of p.reasons) m.set(`${r.kind}:${r.label}`, r.kind === 'office' ? `${t('Office', 'Opisina')}: ${shortOffice(r.label)}` : t(`Title names ${r.label}`, `Binabanggit ang ${r.label}`));
    return [...m.entries()];
  }, [all, t]);
  const lines = useMemo(() => {
    const m = new Map<string, number>();
    for (const p of all) if (p.program) m.set(p.program, (m.get(p.program) ?? 0) + 1);
    return [...m.entries()].sort((a, b) => b[1] - a[1]);
  }, [all]);

  const filtered = useMemo(() => {
    const words = q.toLowerCase().split(/\s+/).filter(Boolean);
    return all
      .filter((p) => {
        if (program && p.dataset !== program) return false;
        if (line && p.program !== line) return false;
        if (status && p.bridge_group !== status) return false;
        if (office && p.office !== office) return false;
        if (why && !p.reasons.some((r) => `${r.kind}:${r.label}` === why)) return false;
        if (kind && kindOf(p) !== kind) return false;
        if (brgy) {
          const named = barangaysOf(p.title, barangays);
          if (brgy === 'none' ? named.length > 0 : !named.some((b) => slug(b) === brgy)) return false;
        }
        if (words.length) {
          const hay = [p.title, p.program, p.pap, p.office, p.region].join(' ').toLowerCase();
          if (!words.every((w) => hay.includes(w))) return false;
        }
        return true;
      })
      .sort((a, b) => CMP[sort](a, b) || a.title.localeCompare(b.title));
  }, [all, q, program, line, status, office, why, kind, brgy, sort, barangays]);
  const fs = useMemo(() => summarise(filtered), [filtered]);
  const narrowed = filtered.length !== all.length;
  const active = [brgy, status, line, program, office, why, kind].filter(Boolean).length;

  return (
    <>
      <div className="page-head">
        <p className="eyebrow">FY 2027 · NEP {t('and', 'at')} House bill</p>
        <h1>{narrowed ? t(`${count(filtered.length)} of ${n(all.length, 'project', 'proyekto')}`, `${count(filtered.length)} sa ${n(all.length, 'project', 'proyekto')}`) : t(`All ${n(all.length, 'project', 'proyekto')}`, `Lahat ng ${n(all.length, 'project', 'proyekto')}`)}</h1>
      </div>

      <div className="card toolbar-card">
        <div className="toolbar">
          <label className="field field-grow">
            <span className="label">{t('Search', 'Maghanap')}</span>
            <input type="search" value={q} placeholder={t('Barangay, road, school, creek…', 'Barangay, daan, paaralan, sapa…')} onChange={(e) => setParam('q', e.target.value)} />
          </label>
          <button type="button" className="button filters-toggle" aria-expanded={filtersOpen} onClick={() => setFiltersOpen((o) => !o)}>
            {t('Filters', 'Mga filter')}{active > 0 ? ` (${active})` : ''}
          </button>
          <div className={`toolbar-extra${filtersOpen ? ' open' : ''}`}>
          {barangays.length > 0 && (
            <label className="field">
              <span className="label">Barangay</span>
              <select value={brgy} onChange={(e) => setParam('brgy', e.target.value)}>
                <option value="">{t('Any barangay', 'Kahit anong barangay')}</option>
                {barangays.map((b) => <option key={b.name} value={slug(b.name)}>{b.name}</option>)}
                <option value="none">{t('No barangay in the title', 'Walang barangay sa pamagat')}</option>
              </select>
            </label>
          )}
          <label className="field">
            <span className="label">{t('Kind of work', 'Uri ng proyekto')}</span>
            <select value={kind} onChange={(e) => setParam('kind', e.target.value)}>
              <option value="">{t('Any', 'Kahit ano')}</option>
              {KINDS.map((k) => <option key={k} value={k}>{kindLabel(k, t)}</option>)}
            </select>
          </label>
          <label className="field">
            <span className="label">{t('Status', 'Kalagayan')}</span>
            <select value={status} onChange={(e) => setParam('status', e.target.value)}>
              <option value="">{t('Any status', 'Kahit anong kalagayan')}</option>
              {BRIDGE_GROUPS.filter((g) => summary.groups[g].rows).map((g) => (
                <option key={g} value={g}>{groups[g].label} ({count(summary.groups[g].rows)})</option>
              ))}
            </select>
          </label>
          {lines.length > 1 && (
            <label className="field">
              <span className="label">{t('Program line', 'Linya ng programa')}</span>
              <select value={line} onChange={(e) => setParam('line', e.target.value)}>
                <option value="">{t('Any', 'Kahit ano')}</option>
                {lines.map(([l, c]) => <option key={l} value={l}>{l} ({count(c)})</option>)}
              </select>
            </label>
          )}
          {Object.keys(summary.byDataset).length > 1 && (
            <label className="field">
              <span className="label">{t('Program', 'Programa')}</span>
              <select value={program} onChange={(e) => setParam('program', e.target.value)}>
                <option value="">{t('All programs', 'Lahat ng programa')}</option>
                {(Object.keys(summary.byDataset) as DatasetKey[]).map((k) => <option key={k} value={k}>{programName(k)} ({count(summary.byDataset[k]!.rows)})</option>)}
              </select>
            </label>
          )}
          {offices.length > 1 && (
            <label className="field">
              <span className="label">{t('DPWH office', 'Opisina ng DPWH')}</span>
              <select value={office} onChange={(e) => setParam('office', e.target.value)}>
                <option value="">{t('Any office', 'Kahit anong opisina')}</option>
                {offices.map(([o, c]) => <option key={o} value={o}>{shortOffice(o)} ({count(c)})</option>)}
              </select>
            </label>
          )}
          {reasons.length > 1 && (
            <label className="field">
              <span className="label">{t('Listed because', 'Nakalista dahil')}</span>
              <select value={why} onChange={(e) => setParam('why', e.target.value)}>
                <option value="">{t('Any reason', 'Kahit anong dahilan')}</option>
                {reasons.map(([k, l]) => <option key={k} value={k}>{l}</option>)}
              </select>
            </label>
          )}
          <label className="field">
            <span className="label">{t('Sort by', 'Ayusin ayon sa')}</span>
            <select value={sort} onChange={(e) => setParam('sort', e.target.value === 'house' ? '' : e.target.value)}>
              <option value="house">{t('House bill amount', 'Halaga sa House bill')}</option>
              <option value="nep">{t('NEP amount', 'Halaga sa NEP')}</option>
              <option value="change">{t('Size of change', 'Laki ng pagbabago')}</option>
              <option value="title">{t('Name', 'Pangalan')}</option>
            </select>
          </label>
          </div>
        </div>
        <div className="toolbar-foot">
          <p className="filter-sums">
            NEP {php(fs.nep.php)} · {n(fs.nep.rows, 'project', 'proyekto')}
            <span className="sep">·</span>House bill {php(fs.house.php)} · {n(fs.house.rows, 'project', 'proyekto')}
            {narrowed && (
              <>
                <span className="sep">·</span>
                <button type="button" className="link-button" onClick={() => { setParams(new URLSearchParams(), { replace: true }); setShown(PAGE); }}>
                  {t('Clear filters', 'Alisin ang mga filter')}
                </button>
              </>
            )}
          </p>
          <button type="button" className="button button-quiet" onClick={() => downloadText(`${config.id}-fy2027-projects.csv`, projectsCsv(filtered))}>
            {t('Download CSV', 'I-download ang CSV')}{narrowed ? ` (${count(filtered.length)})` : ''}
          </button>
        </div>
      </div>

      <ProjectTable rows={filtered.slice(0, shown)} programName={programName} barangays={barangays} />

      {filtered.length === 0 && <p className="state">{t('No project matches. Try fewer words or clear the filters.', 'Walang tumugmang proyekto. Bawasan ang salita o alisin ang mga filter.')}</p>}
      {filtered.length > shown && (
        <div className="more">
          <span className="muted">{t(`Showing ${count(shown)} of ${count(filtered.length)}`, `Ipinapakita ang ${count(shown)} sa ${count(filtered.length)}`)}</span>
          <button type="button" className="button" onClick={() => setShown((x) => x + PAGE)}>{t('Show more', 'Magpakita pa')}</button>
          <button type="button" className="button button-quiet" onClick={() => setShown(filtered.length)}>{t('Show all', 'Ipakita lahat')}</button>
        </div>
      )}
      <p className="fine">
        {t('Amounts in pesos, as published. A dash means that document has no such line, not zero.', 'Halaga sa piso, gaya ng pagkakalathala. Ang gitling ay walang ganoong linya sa dokumento, hindi sero.')}
      </p>
      <Disclaimers items={scope.disclaimers} />
    </>
  );
}
