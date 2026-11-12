/**
 * /gaa — the enacted budgets, 2020–2026, for the portal's area:
 * - each DPWH office's whole budget by year, from its district page, with the
 *   2027 NEP and House bill beside it but apart (they are not law);
 * - every program, activity or project in any department whose name names one
 *   of the portal's places, with its appropriation in each year.
 */
import { useEffect, useMemo, useState } from 'react';
import { useLang } from '../lib/lang';
import { useGaa } from '../lib/use-gaa';
import { YearColumns } from '../components/charts';
import { useLocation, useSearchParams } from 'react-router-dom';
import type { DistrictCard, DistrictOffice, Envelope } from '../api/types';
import { GAA_YEARS } from '../api/types';
import { shortNameOf } from '../config';
import { Await, Disclaimers, External, HowToRead } from '../components/Bits';
import { PageHead } from '../components/Chrome';
import { downloadText } from '../lib/csv';
import { count, php, phpFull, plural } from '../lib/format';
import { departmentShort, gaaCsv, gaaYearTotals, hasYear, type GaaResult, type GaaRow } from '../lib/gaa';
import { usePortal } from '../lib/portal-context';
import { useTitle } from '../lib/use-title';

const PAGE = 100;
const FIRST = GAA_YEARS[0];
const LAST = GAA_YEARS[GAA_YEARS.length - 1];

export default function Enacted() {
  const { config, districts } = usePortal();
  const { t, n } = useLang();
  const name = shortNameOf(config);
  useTitle(`${t('Budgets', 'Badyet')} ${FIRST}–${LAST} · ${config.name}`);
  const places = config.scope.places ?? [];
  const gaa = useGaa();
  const state = gaa.state ?? { status: 'loading' as const };
  const progress = gaa.progress;

  // #office-… links from the main page land on the office once it has rendered.
  const { hash } = useLocation();
  useEffect(() => {
    if (hash) document.getElementById(decodeURIComponent(hash.slice(1)))?.scrollIntoView({ block: 'start' });
  }, [hash, districts.status]);

  const placeList = places.map((p) => p.label).join(', ');
  return (
    <main className="page main">
      <PageHead
        eyebrow={<>GAA<span className="sep">·</span>FY {FIRST}–{LAST}<span className="sep">·</span>{name}</>}
        title={
          state.status === 'ready'
            ? t(`${plural(state.value.rows.length, 'program and project', 'programs and projects')} in the ${FIRST}–${LAST} budgets name ${placeList}`, `${n(state.value.rows.length, '', 'programa at proyekto')} sa badyet ng ${FIRST}–${LAST} ang may “${placeList}”`)
            : t(`${name} in the enacted budgets, ${FIRST}–${LAST}`, `${name} sa mga naipasang badyet, ${FIRST}–${LAST}`)
        }
      >
        <p>{t('The GAA is the budget Congress passes each year: approval to spend, not money spent.', 'Ang GAA ay ang badyet na ipinapasa ng Kongreso bawat taon: pahintulot gumastos, hindi pa nagastos.')}</p>
      </PageHead>

      <OfficeHistories />

      {places.length === 0 ? (
        <p className="fine section-gap">
          {t('This portal follows DPWH offices only, so only each office’s yearly total is shown here.', 'Mga opisina ng DPWH lang ang sinusundan ng portal, kaya ang taunang kabuuan lang ng bawat opisina ang narito.')}
        </p>
      ) : state.status === 'loading' ? (
        <div className="state" role="status">
          <span className="spinner" aria-hidden="true" /> {t(`Searching every department’s programs for ${placeList}`, `Hinahanap ang “${placeList}” sa bawat departamento`)}
          {progress && progress.total > 0 && <> · {count(progress.done)} of {count(progress.total)}</>}…
        </div>
      ) : state.status === 'error' ? (
        <div className="state state-error" role="alert">
          <p><strong>{t('Could not load the enacted budgets.', 'Hindi makuha ang mga naipasang badyet.')}</strong> {state.error.message}</p>
          <button type="button" className="button" onClick={gaa.retry}>{t('Try again', 'Subukan muli')}</button>
        </div>
      ) : (
        <Programs result={state.value} placeList={placeList} />
      )}

      <section className="section">
        <HowToRead>
        <ul className="plain-list fine-list">
          <li>{t('Amounts are the appropriations in each year’s GAA, in pesos. The GAA publishes them in thousands.', 'Ang halaga ay ang appropriation sa GAA ng bawat taon, sa piso. Inilalathala ito ng GAA sa libo.')}</li>
          {places.length > 0 && (
            <>
              <li>{t(`A program is listed when its name includes ${placeList}. A project whose name does not say where it is will not be here.`, `Nakalista ang programa kapag may “${placeList}” sa pangalan. Wala rito ang proyektong hindi nagsasabi kung saan.`)}</li>
              <li>{t('One row is one name in one agency across the years. A renamed project shows as a new row. A dash means no appropriation that year.', 'Ang isang hilera ay isang pangalan sa isang ahensya sa lahat ng taon. Bagong hilera ang pinalitang pangalan. Ang gitling ay walang appropriation sa taong iyon.')}</li>
            </>
          )}
          <li>{t('A DPWH office’s yearly figure is its whole budget. A shared office is shown whole, never split.', 'Ang taunang numero ng opisina ng DPWH ay ang buong badyet nito. Buo ang opisinang pinaghahatian, hindi hinahati.')}</li>
          <li>{t('The 2027 figures are the NEP and the House bill, not law: shown beside the enacted years, never added to them.', 'Ang numero ng 2027 ay NEP at House bill, hindi pa batas: katabi ng mga naipasang taon, hindi idinadagdag.')}</li>
        </ul>
        </HowToRead>
      </section>
    </main>
  );
}

// ---------------------------------------------------------------------------
// DPWH offices, year by year
// ---------------------------------------------------------------------------

function OfficeHistories() {
  const { districts, config } = usePortal();
  const { t } = useLang();
  if (!config.scope.offices?.length && !config.scope.districts?.length) return null;
  return (
    <Await state={districts} inline what={t('DPWH office budgets', 'badyet ng mga opisina ng DPWH')}>
      {(list) => <OfficeHistoryList list={list} />}
    </Await>
  );
}

function OfficeHistoryList({ list }: { list: Envelope<DistrictCard>[] }) {
  const offices = useMemo(() => {
    const byId = new Map<string, DistrictOffice>();
    for (const env of list) for (const o of env.data.offices) if (!byId.has(o.id)) byId.set(o.id, o);
    return [...byId.values()].sort((a, b) => a.name.localeCompare(b.name, 'en', { numeric: true }));
  }, [list]);
  const { t } = useLang();
  const officeDisclaimer = list.flatMap((e) => e.disclaimers).filter((d) => d.id === 'disclaimer-offices').slice(0, 1);
  if (!offices.length) return null;
  return (
    <section className="section" aria-labelledby="office-years-h">
      <h2 id="office-years-h" className="section-h">
        {offices.length === 1 ? t('The DPWH office’s budget, year by year', 'Badyet ng opisina ng DPWH, bawat taon') : t(`${count(offices.length)} DPWH offices’ budgets, year by year`, `Badyet ng ${count(offices.length)} opisina ng DPWH, bawat taon`)}
      </h2>
      <p className="legend">
        <span><i className="sw sw-gaa" /> {t('Enacted (GAA), whole office', 'Naipasa (GAA), buong opisina')}</span>
        <span><i className="sw sw-nep" /> {t('2027 NEP, whole office', 'NEP 2027, buong opisina')}</span>
        <span><i className="sw sw-house" /> {t('2027 House bill, named projects only', 'House bill 2027, mga nakapangalang proyekto lang')}</span>
      </p>
      <div className="hgrid">
        {offices.map((o) => <OfficeHistory key={o.id} office={o} />)}
      </div>
      <Disclaimers items={officeDisclaimer} compact />
    </section>
  );
}

/** Three bars each: 2020–22, 2023–25, and 2026 with the two 2027 versions. */
const CONGRESSES = [{ label: '18th Congress' }, { label: '19th Congress' }, { label: '20th Congress' }];

function OfficeHistory({ office }: { office: DistrictOffice }) {
  const { t } = useLang();
  const years = office.years ?? [];
  const slot = (fy: number, stage: string) => years.find((y) => y.fy === fy && y.stage === stage);
  const bars = [
    ...GAA_YEARS.map((fy) => ({ key: `${fy}`, label: String(fy), kind: 'gaa', v: slot(fy, 'gaa') })),
    { key: '2027-nep', label: 'NEP', kind: 'nep', v: slot(2027, 'nep') },
    { key: '2027-house', label: 'House', kind: 'house', v: slot(2027, 'hgab3') },
  ];
  const max = Math.max(1, ...bars.map((b) => b.v?.php ?? 0));
  return (
    <article className="hcard" id={office.id}>
      <header>
        <h3>DPWH {office.name}</h3>
        <span className={`tag tier tier-${office.tier}`}>{office.tier_text}</span>
      </header>
      <div className="bars" role="img" aria-label={`Budget by year: ${bars.map((b) => `${b.label} ${b.v?.php != null ? phpFull(b.v.php) : 'not found'}`).join('; ')}`}>
        {bars.map((b) => (
          <div key={b.key} className={`bar-col k-${b.kind}`} title={b.v?.php != null ? `${b.v.stage_label} ${b.key.slice(0, 4)}: ${phpFull(b.v.php)} (${b.v.scope})` : 'The office was not found that year'}>
            <span className="bar-v num">{b.v?.php != null ? php(b.v.php).replace('₱', '') : '—'}</span>
            <span className="bar-track"><span className="bar-fill" style={{ height: `${((b.v?.php ?? 0) / max) * 100}%` }} /></span>
            <span className="bar-x">{b.label}</span>
          </div>
        ))}
      </div>
      <div className="congresses" aria-hidden="true">
        {CONGRESSES.map((c) => <span key={c.label}>{c.label}</span>)}
      </div>
      {office.co_served_districts.length > 0 && (
        <p className="fine">{t('Whole office, shared with', 'Buong opisina, kahati ng')} {office.co_served_districts.map((d) => d.label).join('; ')}; {t('not split', 'hindi hinahati')}.</p>
      )}
    </article>
  );
}

// ---------------------------------------------------------------------------
// Programs and projects that name the place
// ---------------------------------------------------------------------------

function Programs({ result, placeList }: { result: GaaResult; placeList: string }) {
  const { config } = usePortal();
  const { t, n } = useLang();
  const all = result.rows;
  const totals = useMemo(() => gaaYearTotals(all), [all]);

  const [params, setParams] = useSearchParams();
  const q = params.get('q') ?? '';
  const dept = params.get('dept') ?? '';
  const yearParam = Number(params.get('year'));
  const year = (GAA_YEARS as readonly number[]).includes(yearParam) ? yearParam : null;
  const [shown, setShown] = useState(PAGE);
  const setParam = (key: string, value: string) => {
    const next = new URLSearchParams(params);
    if (value) next.set(key, value);
    else next.delete(key);
    setParams(next, { replace: true });
    setShown(PAGE);
  };

  const departments = useMemo(() => {
    const n = new Map<string, { label: string; rows: number }>();
    for (const r of all) {
      const d = n.get(r.department_id) ?? { label: departmentShort(r.department), rows: 0 };
      d.rows++;
      n.set(r.department_id, d);
    }
    return [...n.entries()].sort((a, b) => b[1].rows - a[1].rows);
  }, [all]);

  const filtered = useMemo(() => {
    const words = q.toLowerCase().split(/\s+/).filter(Boolean);
    const y = year ? String(year) : null;
    const rows = all.filter((r) => {
      if (dept && r.department_id !== dept) return false;
      if (y && !hasYear(r, y)) return false;
      if (words.length) {
        const hay = `${r.name} ${r.department}`.toLowerCase();
        if (!words.every((w) => hay.includes(w))) return false;
      }
      return true;
    });
    return y ? [...rows].sort((a, b) => (b.years[y]?.amount ?? 0) - (a.years[y]?.amount ?? 0)) : rows;
  }, [all, q, dept, year]);
  const narrowed = filtered.length !== all.length;

  return (
    <>
      <section className="section" aria-labelledby="gaa-years-h">
        <h2 id="gaa-years-h" className="section-h">{t(`By year: the programs that name ${placeList}`, `Bawat taon: mga programang may “${placeList}”`)}</h2>
        <p className="card-lede">{t('Tap a year to list its programs. Years are side by side, not added up.', 'I-tap ang taon para makita ang mga programa. Magkakatabi ang mga taon, hindi pinagsasama.')}</p>
        <YearColumns
          head={t('Year', 'Taon')}
          columns={totals.map((y) => ({
            key: String(y.year),
            label: String(y.year),
            value: y.amount,
            sub: n(y.programs, 'program', 'programa'),
            cls: year === y.year ? 'fill-house' : 'fill-gaa',
            active: year === y.year,
            onClick: () => setParam('year', year === y.year ? '' : String(y.year)),
          }))}
        />
      </section>

      <section className="section" id="programs" aria-labelledby="gaa-list-h">
        <div className="list-head">
          <h2 id="gaa-list-h" className="section-h">
            {narrowed ? t(`${count(filtered.length)} of ${plural(all.length, 'program')}`, `${count(filtered.length)} sa ${n(all.length, '', 'programa')}`) : t(`Every program and project (${count(all.length)})`, `Lahat ng programa at proyekto (${count(all.length)})`)}
          </h2>
          <button type="button" className="button button-quiet" onClick={() => downloadText(`${config.id}-gaa-${FIRST}-${LAST}.csv`, gaaCsv(filtered))}>
            {t('Download CSV', 'I-download ang CSV')}{narrowed ? ` (${count(filtered.length)})` : ''}
          </button>
        </div>
        <div className="toolbar">
          <label className="field field-grow">
            <span className="label">{t('Search', 'Maghanap')}</span>
            <input type="search" value={q} placeholder={t('Road, school, barangay, agency…', 'Daan, paaralan, barangay, ahensya…')} onChange={(e) => setParam('q', e.target.value)} />
          </label>
          <label className="field">
            <span className="label">{t('Department', 'Departamento')}</span>
            <select value={dept} onChange={(e) => setParam('dept', e.target.value)}>
              <option value="">{t('All departments', 'Lahat ng departamento')}</option>
              {departments.map(([id, d]) => <option key={id} value={id}>{d.label} ({count(d.rows)})</option>)}
            </select>
          </label>
          <label className="field">
            <span className="label">{t('Year', 'Taon')}</span>
            <select value={year ?? ''} onChange={(e) => setParam('year', e.target.value)}>
              <option value="">{t('All years', 'Lahat ng taon')}</option>
              {totals.map((y) => <option key={y.year} value={y.year}>{y.year} ({count(y.programs)})</option>)}
            </select>
          </label>
        </div>
        {narrowed && (
          <p className="filter-sums">
            {year ? <>{year}: {php(filtered.reduce((a, r) => a + (r.years[String(year)]?.amount ?? 0), 0))} · {count(filtered.length)}</> : <>{count(filtered.length)}</>}
            <span className="sep">·</span>
            <button type="button" className="link-button" onClick={() => { setParams(new URLSearchParams(), { replace: true }); setShown(PAGE); }}>{t('Clear filters', 'Alisin ang mga filter')}</button>
          </p>
        )}

        {filtered.length > 0 && (
          <div className="table gtable" role="table" aria-label="Programs and projects, by year">
            <div className="tr th" role="row">
              <span role="columnheader">{t('Program or project', 'Programa o proyekto')}</span>
              {GAA_YEARS.map((y) => <span role="columnheader" key={y} className={`r${year === y ? ' ycol' : ''}`}>{y}</span>)}
            </div>
            {filtered.slice(0, shown).map((r) => <ProgramRow key={r.key} r={r} year={year} many={(config.scope.places?.length ?? 0) > 1} />)}
          </div>
        )}
        {filtered.length === 0 && <p className="state">{t('No program matches. Try fewer words or clear the filters.', 'Walang tumugmang programa. Bawasan ang salita o alisin ang mga filter.')}</p>}
        {filtered.length > shown && (
          <div className="more">
            <span className="muted">{t(`Showing ${count(shown)} of ${count(filtered.length)}`, `Ipinapakita ang ${count(shown)} sa ${count(filtered.length)}`)}</span>
            <button type="button" className="button" onClick={() => setShown((x) => x + PAGE)}>{t('Show more', 'Magpakita pa')}</button>
            <button type="button" className="button button-quiet" onClick={() => setShown(filtered.length)}>{t('Show all', 'Ipakita lahat')}</button>
          </div>
        )}
        {result.queries.some((x) => x.truncated) && (
          <p className="fine">{t('Some searches matched more programs than this page loads; see About.', 'May mga paghahanap na mas marami ang tugma kaysa sa naikarga; tingnan ang Tungkol dito.')}</p>
        )}
      </section>
    </>
  );
}

function ProgramRow({ r, year, many }: { r: GaaRow; year: number | null; many: boolean }) {
  const { t } = useLang();
  return (
    <div className="tr" role="row">
      <span role="cell" className="td-project">
        <span className="gname">{r.name}</span>
        <span className="project-meta">
          <span className="label">{departmentShort(r.department)}</span>
          <External href={`https://budget.bettergov.ph/d/${r.department_id}`}>{t('department', 'departamento')}</External>
          {many && r.reasons.map((p) => <span key={p} className="tag tag-place">{t(`names ${p}`, `binabanggit ang ${p}`)}</span>)}
        </span>
      </span>
      {GAA_YEARS.map((y) => {
        const has = hasYear(r, y);
        const amount = r.years[String(y)]?.amount ?? 0;
        return (
          <span role="cell" key={y} data-label={String(y)} className={`r num gcell${has ? '' : ' none'}${year === y ? ' ycol' : ''}`} title={has ? phpFull(amount) : t(`No appropriation under this name in ${y}`, `Walang appropriation sa pangalang ito noong ${y}`)}>
            {has ? php(amount) : '—'}
          </span>
        );
      })}
    </div>
  );
}
