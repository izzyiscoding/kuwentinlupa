import type { ReactNode } from 'react';
import type { BridgeGroup, Disclaimer } from '../api/types';
import { textOf, type LineNote } from '../config';
import type { Async } from '../lib/portal-context';
import { usePortal } from '../lib/portal-context';
import { useLang } from '../lib/lang';
import type { Reason } from '../lib/scope';
import { Icon } from './Icons';
import { STATUS_FIL } from '../lib/words';


/** The plain status, as the API words it, with the group's colour (and, in Filipino, our gloss). */
export function StatusChip({ group, label, held }: { group: BridgeGroup; label: string; held?: boolean }) {
  const { t, lang } = useLang();
  return (
    <span className="status">
      <span className={`pill pill-${group}`}>
        <span className={`status-dot g-${group}`} aria-hidden="true" />
        {label}
      </span>
      {lang === 'fil' && <span className="status-gloss">{STATUS_FIL[group]}</span>}
      {held && (
        <span className="tag tag-warn" title={t('Unconfirmed match: the pairing is fuzzy or ambiguous.', 'Hindi kumpirmadong pagtutugma: malabo o may ibang posibleng kapares.')}>
          {t('unconfirmed match', 'hindi kumpirmadong tugma')}
        </span>
      )}
    </span>
  );
}

export function ReasonTags({ reasons }: { reasons: Reason[] }) {
  const { t } = useLang();
  return (
    <span className="reasons">
      {reasons.map((r) => (
        <span
          key={r.kind + r.label}
          className={`tag ${r.kind === 'office' ? 'tag-office' : 'tag-place'}`}
          title={r.kind === 'office' ? t(`Listed under ${r.label}`, `Nakalista sa ilalim ng ${r.label}`) : t(`The title names ${r.label}`, `Binabanggit ng pamagat ang ${r.label}`)}
        >
          {r.kind === 'office' ? t('DPWH office', 'opisina ng DPWH') : t(`names ${r.label}`, `binabanggit ang ${r.label}`)}
        </span>
      ))}
    </span>
  );
}

/** A maintainer's note on a line: a flag icon, and the note (in full, or as a tooltip when compact). */
export function NoteFlag({ note, compact }: { note: LineNote; compact?: boolean }) {
  const { t, lang } = useLang();
  const text = textOf(note.note, lang);
  const { config } = usePortal();
  const by = config.name;
  if (compact) {
    return (
      <span className="note-flag" title={text}>
        <Icon name="flag" size={13} />{t('note', 'paalala')}
      </span>
    );
  }
  return (
    <p className="note-box">
      <Icon name="flag" size={16} />
      <span><strong>{t(`Note from ${by}:`, `Paalala ng ${by}:`)}</strong> {text}</span>
    </p>
  );
}

/**
 * The API's disclaimers, verbatim: printed from the response, so the wording
 * cannot drift. The first is shown in full; the rest one click away.
 */
export function Disclaimers({ items }: { items: Disclaimer[]; compact?: boolean }) {
  const { t, lang } = useLang();
  if (!items.length) return null;
  const one = (d: Disclaimer) => (
    <p key={d.id}>
      <strong>{d.title}</strong> {d.body}{' '}
      <a href={d.restrictions_url ?? d.url} target="_blank" rel="noopener">Read more ↗</a>
    </p>
  );
  const [first, ...rest] = items;
  return (
    <aside className="disclaimers" aria-label={t('Notices from the data source', 'Paalala mula sa pinagkunan ng datos')}>
      <p className="disclaimers-h">
        {t('Notices from the data source', 'Paalala mula sa pinagkunan ng datos')}
        {lang === 'fil' && <span className="muted"> (nasa Ingles, gaya ng pagkakalathala)</span>}
      </p>
      {one(first)}
      {rest.length > 0 && (
        <details>
          <summary>{t(`${rest.length} more ${rest.length === 1 ? 'notice' : 'notices'}`, `${rest.length} pang paalala`)}</summary>
          {rest.map(one)}
        </details>
      )}
    </aside>
  );
}

/** Render `ready`, or a loading line, or the error with a retry. */
export function Await<T>({ state, children, what }: { state: Async<T>; children: (value: T) => ReactNode; what: string }) {
  const { retry } = usePortal();
  const { t } = useLang();
  if (state.status === 'ready') return <>{children(state.value)}</>;
  if (state.status === 'loading') {
    return (
      <div className="state" role="status">
        <span className="spinner" aria-hidden="true" /> {t(`Loading ${what} from the Budget API…`, `Kinukuha ang ${what} mula sa Budget API…`)}
      </div>
    );
  }
  return (
    <div className="state state-error" role="alert">
      <p>
        <strong>{t(`Could not load ${what}.`, `Hindi makuha ang ${what}.`)}</strong> {state.error.message}
      </p>
      <button type="button" className="button" onClick={retry}>
        {t('Try again', 'Subukan muli')}
      </button>
    </div>
  );
}

export function External({ href, children }: { href: string; children: ReactNode }) {
  return (
    <a href={href} target="_blank" rel="noopener">
      {children} <span aria-hidden="true">↗</span>
    </a>
  );
}

/** "How to read this": the longer explanation, one click away. */
export function HowToRead({ children }: { children: ReactNode }) {
  const { t } = useLang();
  return (
    <details className="how">
      <summary>{t('How to read this', 'Paano ito basahin')}</summary>
      <div className="how-body">{children}</div>
    </details>
  );
}
