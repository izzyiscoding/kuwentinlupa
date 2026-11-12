/**
 * The portal's charts: plain HTML bars, no chart library. They draw only what
 * they are given: counts, and per-version sums from `summarise()`. The NEP and
 * the House bill are two bars side by side, never stacked or added.
 *
 * Every chart has direct value labels, a hover/focus tooltip with exact pesos,
 * a legend when it has two series, and a table view, so colour is never the
 * only way to read it.
 */
import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { php, phpDelta, phpFull } from '../lib/format';
import { useLang } from '../lib/lang';
import { Icon } from './Icons';
import type { IconName } from '../lib/words';

export interface Series {
  key: string;
  label: string;
  /** Fill class: `fill-house`, `fill-nep`, or a status `g-…`. */
  cls: string;
}

export interface BarRow {
  key: string;
  label: ReactNode;
  /** The label as plain text, for the table and screen readers. */
  text: string;
  sub?: string;
  icon?: IconName;
  href?: string;
  values: Record<string, number | null>;
  /** Overrides the series fill for this row (one-series charts coloured per row). */
  cls?: string;
  /** A marker after the label, e.g. a noted line. */
  badge?: ReactNode;
}

type Fmt = (n: number | null) => string;

export function Legend({ series }: { series: Series[] }) {
  return (
    <p className="legend">
      {series.map((s) => (
        <span key={s.key}><i className={`sw ${s.cls}`} aria-hidden="true" />{s.label}</span>
      ))}
    </p>
  );
}

/** Horizontal bars, one row per item; one or two series (the NEP and the House bill). */
export function BarList({ series, rows, format = php, exact = phpFull, head }: { series: Series[]; rows: BarRow[]; format?: Fmt; exact?: Fmt; head: string }) {
  const { t } = useLang();
  const max = Math.max(1, ...rows.flatMap((r) => series.map((s) => r.values[s.key] ?? 0)));
  return (
    <figure className="chart">
      {series.length > 1 && <Legend series={series} />}
      <ul className={`bl${series.length > 1 ? ' bl-paired' : ''}`}>
        {rows.map((r) => {
          const tip = series.map((s) => `${s.label}: ${exact(r.values[s.key] ?? null)}`).join(' · ');
          const inner = (
            <>
              <span className="bl-label">
                {r.icon && <Icon name={r.icon} size={18} className="bl-icon" />}
                <span className="bl-text">{r.label}{r.badge}</span>
                {r.sub && <span className="bl-sub">{r.sub}</span>}
              </span>
              <span className="bl-bars">
                {series.map((s) => {
                  const v = r.values[s.key] ?? null;
                  return (
                    <span className="bl-bar" key={s.key}>
                      <span className={`bl-fill ${r.cls ?? s.cls}`} style={{ width: `calc((100% - 76px) * ${(v ?? 0) / max})` }} />
                      <span className="bl-v num">{format(v)}</span>
                    </span>
                  );
                })}
              </span>
              <span className="bl-tip" role="tooltip">{r.text}{r.sub ? ` · ${r.sub}` : ''}<br />{tip}</span>
            </>
          );
          return (
            <li key={r.key}>
              {r.href ? (
                <Link to={r.href} className="bl-row" aria-label={`${r.text}${r.sub ? `, ${r.sub}` : ''}: ${tip}`}>{inner}</Link>
              ) : (
                <div className="bl-row" tabIndex={0} aria-label={`${r.text}: ${tip}`}>{inner}</div>
              )}
            </li>
          );
        })}
      </ul>
      <details className="chart-table">
        <summary>{t('Show as a table', 'Ipakita bilang talahanayan')}</summary>
        <table>
          <thead>
            <tr><th>{head}</th>{series.map((s) => <th key={s.key} className="r">{s.label}</th>)}</tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.key}>
                <td>{r.text}{r.sub ? <span className="muted"> · {r.sub}</span> : null}</td>
                {series.map((s) => <td key={s.key} className="r num">{exact(r.values[s.key] ?? null)}</td>)}
              </tr>
            ))}
          </tbody>
        </table>
      </details>
    </figure>
  );
}

export interface DumbbellRow {
  key: string;
  label: ReactNode;
  text: string;
  sub?: string;
  icon?: IconName;
  href?: string;
  badge?: ReactNode;
  nep: number | null;
  house: number | null;
}

/**
 * The NEP and the House bill as two dots on one line per item: violet NEP,
 * emerald House bill, joined by a bar coloured by the direction of change.
 * Reads the change at a glance; the two amounts are never added.
 */
export function Dumbbell({ rows, head }: { rows: DumbbellRow[]; head: string }) {
  const { t } = useLang();
  const max = Math.max(1, ...rows.flatMap((r) => [r.nep ?? 0, r.house ?? 0]));
  const pct = (v: number) => `${(v / max) * 100}%`;
  const ticks = [0, 0.5, 1].map((f) => f * max);
  return (
    <figure className="chart">
      <Legend series={[{ key: 'nep', label: 'NEP', cls: 'dot-nep' }, { key: 'house', label: 'House bill', cls: 'dot-house' }]} />
      <div className="db">
        <div className="db-axis" aria-hidden="true">
          <span />
          <span className="db-ticks">
            {ticks.map((v, i) => <span key={i} style={{ left: pct(v) }}>{i === 0 ? '0' : php(v)}</span>)}
          </span>
          <span />
        </div>
        <ul className="db-rows">
          {rows.map((r) => {
            const a = r.nep ?? r.house ?? 0;
            const b = r.house ?? r.nep ?? 0;
            const lo = Math.min(a, b);
            const hi = Math.max(a, b);
            const dir = r.nep == null ? 'only' : r.house == null ? 'gone' : r.house > r.nep ? 'up' : r.house < r.nep ? 'down' : 'same';
            const delta = r.nep != null && r.house != null ? r.house - r.nep : null;
            const tip = `NEP: ${phpFull(r.nep)} · House bill: ${phpFull(r.house)}`;
            const inner = (
              <>
                <span className="bl-label">
                  {r.icon && <Icon name={r.icon} size={18} className="bl-icon" />}
                  <span className="bl-text">{r.label}{r.badge}</span>
                  {r.sub && <span className="bl-sub">{r.sub}</span>}
                </span>
                <span className="db-plot">
                  {ticks.map((v, i) => <span key={i} className="db-grid" style={{ left: pct(v) }} />)}
                  <span className={`db-bar ${dir}`} style={{ left: pct(lo), width: `calc(${pct(hi - lo)} + 0px)` }} />
                  {r.nep != null && <span className="db-dot dot-nep" style={{ left: pct(r.nep) }} />}
                  {r.house != null && <span className="db-dot dot-house" style={{ left: pct(r.house) }} />}
                </span>
                <span className="db-val">
                  <span className="num">{php(r.house ?? r.nep)}</span>
                  {delta != null && delta !== 0 && <span className={`pill pill-delta ${delta > 0 ? 'up' : 'down'}`}>{phpDelta(delta)}</span>}
                  {dir === 'only' && <span className="pill pill-house_only">{t('House only', 'House lang')}</span>}
                  {dir === 'gone' && <span className="pill pill-nep_only">{t('NEP only', 'NEP lang')}</span>}
                </span>
                <span className="bl-tip" role="tooltip">{r.text}{r.sub ? ` · ${r.sub}` : ''}<br />{tip}</span>
              </>
            );
            return (
              <li key={r.key}>
                {r.href ? (
                  <Link to={r.href} className="db-row" aria-label={`${r.text}: ${tip}`}>{inner}</Link>
                ) : (
                  <div className="db-row" tabIndex={0} aria-label={`${r.text}: ${tip}`}>{inner}</div>
                )}
              </li>
            );
          })}
        </ul>
      </div>
      <details className="chart-table">
        <summary>{t('Show as a table', 'Ipakita bilang talahanayan')}</summary>
        <table>
          <thead><tr><th>{head}</th><th className="r">NEP</th><th className="r">House bill</th></tr></thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.key}><td>{r.text}{r.sub ? <span className="muted"> · {r.sub}</span> : null}</td><td className="r num">{phpFull(r.nep)}</td><td className="r num">{phpFull(r.house)}</td></tr>
            ))}
          </tbody>
        </table>
      </details>
    </figure>
  );
}

/** Counts as one bar split into parts (each part a group), with a legend that links. */
export function StackBar({ parts, total, head }: { parts: { key: string; label: string; sub?: string; n: number; cls: string; href?: string }[]; total: number; head: string }) {
  const { t } = useLang();
  return (
    <figure className="chart">
      <div className="stack" role="img" aria-label={parts.map((p) => `${p.label}: ${p.n}`).join(', ')}>
        {parts.map((p) => (
          <span key={p.key} className={`stack-part ${p.cls}`} style={{ flexGrow: p.n }} title={`${p.label}: ${p.n}`}>
            {p.n / total >= 0.08 && <span className="stack-n num">{p.n}</span>}
          </span>
        ))}
      </div>
      <ul className="stack-legend">
        {parts.map((p) => {
          const inner = (
            <>
              <span className={`waffle-key ${p.cls}`} aria-hidden="true" />
              <span className="stack-legend-n num">{p.n}</span>
              <span>
                <strong>{p.label}</strong>
                {p.sub && <span className="muted"> {p.sub}</span>}
              </span>
              <span className="stack-legend-pct num">{Math.round((p.n / total) * 100)}%</span>
            </>
          );
          return <li key={p.key}>{p.href ? <Link to={p.href}>{inner}</Link> : <span>{inner}</span>}</li>;
        })}
      </ul>
      <details className="chart-table">
        <summary>{t('Show as a table', 'Ipakita bilang talahanayan')}</summary>
        <table>
          <thead><tr><th>{head}</th><th className="r">{t('Projects', 'Proyekto')}</th></tr></thead>
          <tbody>{parts.map((p) => <tr key={p.key}><td>{p.label}</td><td className="r num">{p.n}</td></tr>)}</tbody>
        </table>
      </details>
    </figure>
  );
}

export interface Column {
  key: string;
  label: string;
  value: number | null;
  sub?: string;
  cls: string;
  href?: string;
  onClick?: () => void;
  active?: boolean;
}

/**
 * Columns by year. `aside` is a separate panel on the same scale (the 2027
 * versions beside the enacted years): drawn apart, never part of the series.
 */
export function YearColumns({ columns, aside, head }: { columns: Column[]; aside?: { title: string; columns: Column[] }; head: string }) {
  const { t } = useLang();
  const all = [...columns, ...(aside?.columns ?? [])];
  const max = Math.max(1, ...all.map((c) => c.value ?? 0));
  const col = (c: Column) => {
    const inner = (
      <>
        <span className="yc-v num">{php(c.value)}</span>
        <span className="yc-track"><span className={`yc-fill ${c.cls}`} style={{ height: `${((c.value ?? 0) / max) * 100}%` }} /></span>
        <span className="yc-x">{c.label}</span>
        {c.sub && <span className="yc-sub">{c.sub}</span>}
        <span className="bl-tip" role="tooltip">{c.label}: {phpFull(c.value)}{c.sub ? ` · ${c.sub}` : ''}</span>
      </>
    );
    const label = `${c.label}: ${phpFull(c.value)}${c.sub ? `, ${c.sub}` : ''}`;
    if (c.onClick) return <button key={c.key} type="button" className={`yc${c.active ? ' active' : ''}`} aria-pressed={c.active} aria-label={label} onClick={c.onClick}>{inner}</button>;
    if (c.href) return <Link key={c.key} to={c.href} className="yc" aria-label={label}>{inner}</Link>;
    return <div key={c.key} className="yc" tabIndex={0} aria-label={label}>{inner}</div>;
  };
  return (
    <figure className="chart">
      <div className="ycols">
        <div className="ycols-main" style={{ gridTemplateColumns: `repeat(${columns.length}, minmax(0, 1fr))` }}>{columns.map(col)}</div>
        {aside && (
          <div className="ycols-aside">
            <p className="ycols-aside-h">{aside.title}</p>
            <div className="ycols-aside-cols" style={{ gridTemplateColumns: `repeat(${aside.columns.length}, minmax(0, 1fr))` }}>{aside.columns.map(col)}</div>
          </div>
        )}
      </div>
      <details className="chart-table">
        <summary>{t('Show as a table', 'Ipakita bilang talahanayan')}</summary>
        <table>
          <thead><tr><th>{head}</th><th className="r">{t('Amount', 'Halaga')}</th><th /></tr></thead>
          <tbody>
            {all.map((c) => <tr key={c.key}><td>{c.label}</td><td className="r num">{phpFull(c.value)}</td><td className="muted">{c.sub}</td></tr>)}
          </tbody>
        </table>
      </details>
    </figure>
  );
}

/** One big figure. */
export function StatTile({ label, value, sub, accent, icon }: { label: string; value: string; sub?: ReactNode; accent?: 'house' | 'nep'; icon?: IconName }) {
  return (
    <div className={`tile${accent ? ` tile-${accent}` : ''}`}>
      <p className="tile-label">{icon && <Icon name={icon} size={16} />}{label}</p>
      <p className="tile-value num">{value}</p>
      {sub && <p className="tile-sub">{sub}</p>}
    </div>
  );
}

/** A chart's frame: a heading with its number, at most one sentence, the chart, and an optional link. */
export function ChartCard({ id, title, lede, children, more, wide }: { id: string; title: ReactNode; lede?: ReactNode; children: ReactNode; more?: { to: string; label: string }; wide?: boolean }) {
  return (
    <section className={`card chart-card${wide ? ' wide' : ''}`} aria-labelledby={id}>
      <h2 id={id} className="card-h">{title}</h2>
      {lede && <p className="card-lede">{lede}</p>}
      {children}
      {more && <Link className="card-more" to={more.to}>{more.label} →</Link>}
    </section>
  );
}
