import { Link } from 'react-router-dom';
import type { Barangay, DatasetKey } from '../config';
import { barangaysOf, slug } from '../lib/barangay';
import { php, phpDelta } from '../lib/format';
import { useLang } from '../lib/lang';
import type { ScopedProject } from '../lib/scope';
import { NoteFlag, ReasonTags, StatusChip } from './Bits';
import { projectHref, shortOffice } from '../lib/words';

/** The project list: one row per line, a card per line on a phone. */
export function ProjectTable({ rows, programName, barangays = [] }: { rows: ScopedProject[]; programName: (k: DatasetKey) => string; barangays?: readonly Barangay[] }) {
  const { t } = useLang();
  if (!rows.length) return null;
  return (
    <div className="table" role="table" aria-label={t('Projects', 'Mga proyekto')}>
      <div className="tr th" role="row">
        <span role="columnheader">{t('Project', 'Proyekto')}</span>
        <span role="columnheader">{t('Status', 'Kalagayan')}</span>
        <span role="columnheader" className="r">NEP</span>
        <span role="columnheader" className="r">House bill</span>
        <span role="columnheader" className="r">{t('Change', 'Pagbabago')}</span>
      </div>
      {rows.map((p) => (
        <div className={`tr${p.note ? ' tr-noted' : ''}`} role="row" key={p.key}>
          <span role="cell" className="td-project">
            <Link to={projectHref(p)} className="project-title">{p.title}</Link>
            <span className="project-meta">
              <span className="label">{programName(p.dataset)}</span>
              {barangaysOf(p.title, barangays).map((b) => (
                <Link key={b} to={`/barangay/${slug(b)}`} className="tag tag-brgy">{b}</Link>
              ))}
              {p.office && <span>{shortOffice(p.office)}</span>}
              <ReasonTags reasons={p.reasons} />
              {p.note && <NoteFlag note={p.note} compact />}
            </span>
          </span>
          <span role="cell" className="td-status"><StatusChip group={p.bridge_group} label={p.status_label} held={p.held} /></span>
          <span role="cell" className="r num" data-label="NEP">{php(p.nep_php)}</span>
          <span role="cell" className="r num strong" data-label="House bill">{php(p.house_php)}</span>
          <span role="cell" className="r num" data-label={t('Change', 'Pagbabago')}>
            <DeltaPill delta={p.delta_php} />
          </span>
        </div>
      ))}
    </div>
  );
}

/** The change as a pill: blue up, red down, grey "no change"; a dash when one version has no such line. */
export function DeltaPill({ delta }: { delta: number | null }) {
  const { t } = useLang();
  if (delta == null) return <span className="muted">—</span>;
  const kind = delta > 0 ? 'up' : delta < 0 ? 'down' : 'zero';
  return <span className={`pill pill-delta ${kind}`}>{delta === 0 ? t('no change', 'walang pagbabago') : phpDelta(delta)}</span>;
}
