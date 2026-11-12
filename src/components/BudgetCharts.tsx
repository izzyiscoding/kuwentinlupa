/**
 * The portal's charts of its own lines, shared by the Overview (compact) and
 * the numbers page (full). Each draws counts, or per-version sums from
 * `summarise()`; the NEP and the House bill are always two bars, never one.
 */
import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import type { DatasetInfo } from '../api/types';
import { BRIDGE_GROUPS } from '../api/types';
import { byBarangay, byProgram } from '../lib/barangay';
import { count, php } from '../lib/format';
import { gaaYearTotals } from '../lib/gaa';
import { useLang } from '../lib/lang';
import { usePortal } from '../lib/portal-context';
import { summarise, type ScopedProject, type Summary } from '../lib/scope';
import { useGaa } from '../lib/use-gaa';
import { NoteFlag } from './Bits';
import { Dumbbell, StackBar, YearColumns, type DumbbellRow } from './charts';
import { groupInfo, programIcon, projectHref, STATUS_FIL, NO_BARANGAYS } from '../lib/words';

/** A group holding a headline-noted line carries its flag, so a bar it inflates is not misread. */
function flagOf(rows: readonly ScopedProject[]) {
  const noted = rows.find((r) => r.note?.headline);
  return noted ? <> <NoteFlag note={noted.note!} compact /></> : undefined;
}

/** A group's two versions for a dumbbell row; a group with no line in a version has no dot for it. */
const versions = (sm: Summary) => ({ nep: sm.nep.rows ? sm.nep.php : null, house: sm.house.rows ? sm.house.php : null });

/**
 * By barangay named in the title: NEP and House bill as two dots per
 * barangay. The lines that name no barangay are summed under the chart, not
 * drawn: they hold the noted nationwide line and would flatten every row.
 */
export function BarangayChart({ rows, limit }: { rows: readonly ScopedProject[]; limit?: number }) {
  const { config } = usePortal();
  const { t, n } = useLang();
  const { groups, unnamed } = useMemo(() => byBarangay(rows, config.barangays ?? NO_BARANGAYS), [rows, config.barangays]);
  const sorted = [...groups].sort((a, b) => b.summary.house.php - a.summary.house.php);
  const list: DumbbellRow[] = (limit ? sorted.slice(0, limit) : sorted).map((g) => ({
    key: g.key,
    label: g.label,
    text: g.label,
    sub: n(g.rows.length, 'project', 'proyekto'),
    href: `/barangay/${g.key}`,
    ...versions(g.summary),
    badge: flagOf(g.rows),
  }));
  return (
    <>
      <Dumbbell rows={list} head={t('Barangay', 'Barangay')} />
      {!limit && unnamed.rows.length > 0 && (
        <p className="chart-aside">
          <Link to="/projects?brgy=none">{t('No barangay in the title', 'Walang barangay sa pamagat')}</Link>: {n(unnamed.rows.length, 'project', 'proyekto')} · NEP {php(unnamed.summary.nep.php)} · House bill {php(unnamed.summary.house.php)}
          {flagOf(unnamed.rows)}
        </p>
      )}
    </>
  );
}

/** What the House bill did: the lines as one bar split by status, with a legend that opens each group. */
export function StatusChart({ rows, datasets }: { rows: readonly ScopedProject[]; datasets: DatasetInfo[] }) {
  const { t, lang } = useLang();
  const s = useMemo(() => summarise(rows), [rows]);
  const words = groupInfo(datasets, rows);
  const parts = BRIDGE_GROUPS.filter((g) => s.groups[g].rows > 0).map((g) => ({
    key: g,
    label: words[g].label,
    sub: lang === 'fil' ? STATUS_FIL[g] : words[g].sub || undefined,
    n: s.groups[g].rows,
    cls: `g-${g}`,
    href: `/projects?status=${g}`,
  }));
  return <StackBar parts={parts} total={s.rows || 1} head={t('Status', 'Kalagayan')} />;
}

/** By program line (the API's `program`), with an icon for the kind of work. */
export function ProgramChart({ rows, limit }: { rows: readonly ScopedProject[]; limit?: number }) {
  const { t, n } = useLang();
  const groups = useMemo(() => byProgram(rows), [rows]);
  const list: DumbbellRow[] = (limit ? groups.slice(0, limit) : groups).map((g) => ({
    key: g.key,
    label: g.label,
    text: g.label,
    icon: programIcon(g.label),
    sub: n(g.rows.length, 'project', 'proyekto'),
    href: `/projects?line=${encodeURIComponent(g.key)}`,
    ...versions(g.summary),
    badge: flagOf(g.rows),
  }));
  return <Dumbbell rows={list} head={t('Type of work (program)', 'Uri ng gawain (programa)')} />;
}

/**
 * The biggest lines. A headline-noted line is drawn as a callout above the
 * bars, not as a bar: it would flatten every other bar to nothing.
 */
export function TopChart({ rows, top = 10 }: { rows: readonly ScopedProject[]; top?: number }) {
  const { t } = useLang();
  const called = rows.filter((r) => r.note?.headline);
  const rest = rows
    .filter((r) => !r.note?.headline)
    .sort((a, b) => (b.house_php ?? b.nep_php ?? 0) - (a.house_php ?? a.nep_php ?? 0))
    .slice(0, top);
  return (
    <>
      {called.map((r) => (
        <div key={r.key} className="callout">
          <p className="callout-v num">{php(r.house_php)} <span className="muted">House bill</span> · {php(r.nep_php)} <span className="muted">NEP</span></p>
          <p className="callout-t"><Link to={projectHref(r)}>{r.title.length > 140 ? r.title.slice(0, 140) + '…' : r.title}</Link></p>
          <NoteFlag note={r.note!} />
          <p className="fine">{t('Shown here instead of in the chart, where it would dwarf every other bar.', 'Ipinakita rito sa halip na sa tsart, dahil liliit ang lahat ng ibang bar.')}</p>
        </div>
      ))}
      <Dumbbell
        rows={rest.map((r) => ({
          key: r.key,
          label: r.title.length > 90 ? r.title.slice(0, 90) + '…' : r.title,
          text: r.title,
          href: projectHref(r),
          nep: r.nep_php,
          house: r.house_php,
        }))}
        head={t('Project', 'Proyekto')}
      />
    </>
  );
}

/** The enacted years for the programs that name the places, with the 2027 versions in a separate panel. */
export function EnactedChart({ rows }: { rows: readonly ScopedProject[] }) {
  const { t, n } = useLang();
  const { state, progress } = useGaa();
  const s = useMemo(() => summarise(rows), [rows]);
  if (!state) return null;
  if (state.status !== 'ready') {
    return (
      <p className="state" role="status">
        <span className="spinner" aria-hidden="true" />
        {state.status === 'error' ? state.error.message : t('Searching every department’s budget…', 'Hinahanap sa badyet ng bawat departamento…')}
        {progress && progress.total > 0 && state.status === 'loading' && <> {count(progress.done)}/{count(progress.total)}</>}
      </p>
    );
  }
  const totals = gaaYearTotals(state.value.rows);
  return (
    <YearColumns
      head={t('Year', 'Taon')}
      columns={totals.map((y) => ({ key: String(y.year), label: String(y.year), value: y.amount, sub: n(y.programs, 'program', 'programa'), cls: 'fill-gaa', href: `/gaa?year=${y.year}` }))}
      aside={{
        title: t('2027: not law yet', '2027: hindi pa batas'),
        columns: [
          { key: 'nep', label: 'NEP', value: s.nep.php, cls: 'fill-nep', href: '/projects' },
          { key: 'house', label: 'House', value: s.house.php, cls: 'fill-house', href: '/projects' },
        ],
      }}
    />
  );
}
