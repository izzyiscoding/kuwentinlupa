/**
 * /barangay/:slug: the lines whose title names one barangay, 2027 and
 * 2020–2026. Found by name only: a project in the barangay whose title does
 * not say so is not here, and the page says where to find the rest.
 */
import { useMemo } from 'react';
import { Link, useParams } from 'react-router-dom';
import { shortNameOf } from '../config';
import { Await, Disclaimers } from '../components/Bits';
import { StatusChart } from '../components/BudgetCharts';
import { useProgramName } from '../lib/use-chart';
import { NO_BARANGAYS, NO_DATASETS } from '../lib/words';
import { ChartCard, StatTile, YearColumns } from '../components/charts';
import { ProjectTable } from '../components/ProjectList';
import { barangaysOf, slug } from '../lib/barangay';
import { count, php } from '../lib/format';
import { departmentShort, gaaYearTotals, hasYear } from '../lib/gaa';
import { useLang } from '../lib/lang';
import { usePortal } from '../lib/portal-context';
import { summarise, type ScopeResult } from '../lib/scope';
import { useGaa } from '../lib/use-gaa';
import { useTitle } from '../lib/use-title';
import { GAA_YEARS } from '../api/types';

export default function Barangay() {
  const { slug: key = '' } = useParams();
  const { scope, config } = usePortal();
  const { t } = useLang();
  const b = (config.barangays ?? []).find((x) => slug(x.name) === key);
  useTitle(`${b ? `${b.name}, ${shortNameOf(config)}` : 'Barangay'} · ${config.name}`);
  if (!b) {
    return (
      <main className="page main">
        <p className="state">{t('There is no such barangay in this portal.', 'Walang ganitong barangay sa portal na ito.')} <Link to="/#barangays">{t('See the barangays', 'Tingnan ang mga barangay')}</Link></p>
      </main>
    );
  }
  return (
    <main className="page main">
      <p className="crumbs"><Link to="/#barangays">← {t('All barangays', 'Lahat ng barangay')}</Link></p>
      <Await state={scope} what={t('projects', 'mga proyekto')}>
        {(s) => <View scope={s} name={b.name} />}
      </Await>
    </main>
  );
}

function View({ scope, name }: { scope: ScopeResult; name: string }) {
  const { config, overview } = usePortal();
  const { t, n } = useLang();
  const datasets = overview.status === 'ready' ? overview.value.data.datasets : NO_DATASETS;
  const programName = useProgramName(datasets);
  const barangays = config.barangays ?? NO_BARANGAYS;
  const rows = useMemo(() => scope.projects.filter((p) => barangaysOf(p.title, barangays).includes(name)), [scope.projects, barangays, name]);
  const s = summarise(rows);
  const image = barangays.find((b) => b.name === name)?.image;

  return (
    <>
      {image && (
        <figure className="brgy-banner">
          <img src={image.src} alt="" />
          <figcaption>{image.creditUrl ? <a href={image.creditUrl} target="_blank" rel="noopener">{image.credit}</a> : image.credit}</figcaption>
        </figure>
      )}
      <div className="page-head">
        <p className="eyebrow">Barangay · {shortNameOf(config)}</p>
        <h1>{t(`${name}: ${n(rows.length, 'project', 'proyekto')} in the 2027 budget`, `${name}: ${n(rows.length, 'project', 'proyekto')} sa badyet ng 2027`)}</h1>
      </div>

      <div className="tiles">
        <StatTile label="NEP" icon="doc" value={php(s.nep.php)} sub={n(s.nep.rows, 'project', 'proyekto')} accent="nep" />
        <StatTile label="House bill" icon="doc" value={php(s.house.php)} sub={n(s.house.rows, 'project', 'proyekto')} accent="house" />
        <StatTile label={t('In the House bill only', 'Nasa House bill lang')} icon="search" value={String(s.groups.house_only.rows)} sub={t('candidates to check', 'dapat suriin')} />
      </div>
      <p className="fine">
        {t(`Only projects whose title names ${name}. Others in ${name} may be among the`, `Mga proyektong may “${name}” sa pamagat lang. Maaaring may iba pa sa`)}{' '}
        <Link to="/projects?brgy=none">{t('projects with no barangay in the title', 'mga proyektong walang barangay sa pamagat')}</Link>.
      </p>

      {rows.length > 0 && (
        <div className="card-grid two">
          <ChartCard id="b-status" title={t('What the House bill did', 'Ano ang ginawa ng House bill')}>
            <StatusChart rows={rows} datasets={datasets} />
          </ChartCard>
          <GaaCard name={name} />
        </div>
      )}

      <section className="section" aria-labelledby="b-list">
        <h2 id="b-list" className="section-h">{t(`The ${n(rows.length, 'project', 'proyekto')}`, `Ang ${n(rows.length, 'project', 'proyekto')}`)}</h2>
        <ProjectTable rows={rows} programName={programName} barangays={barangays} />
        {rows.length === 0 && <p className="state">{t(`No 2027 project title names ${name}.`, `Walang pamagat ng proyekto sa 2027 na bumabanggit sa ${name}.`)}</p>}
      </section>

      <Disclaimers items={scope.disclaimers} />
    </>
  );
}

/** The 2020–2026 programs whose name names the barangay. */
function GaaCard({ name }: { name: string }) {
  const { config } = usePortal();
  const { t, n } = useLang();
  const { state } = useGaa();
  if (!state) return null;
  const rows = state.status === 'ready' ? state.value.rows.filter((r) => barangaysOf(r.name, config.barangays ?? NO_BARANGAYS).includes(name)) : [];
  const totals = gaaYearTotals(rows);
  return (
    <ChartCard id="b-gaa" title={t(`Enacted 2020–2026: ${n(rows.length, 'program', 'programa')}`, `Naipasa 2020–2026: ${n(rows.length, 'program', 'programa')}`)} lede={t('Programs whose name has the barangay. Approved to spend, not spent.', 'Mga programang may pangalan ng barangay. Pahintulot gumastos, hindi pa nagastos.')}>
      {state.status === 'loading' ? (
        <p className="state" role="status"><span className="spinner" aria-hidden="true" /> {t('Searching…', 'Hinahanap…')}</p>
      ) : state.status === 'error' ? (
        <p className="state state-error">{state.error.message}</p>
      ) : rows.length === 0 ? (
        <p className="muted">{t('None found by name.', 'Walang nahanap ayon sa pangalan.')}</p>
      ) : (
        <>
          <YearColumns head={t('Year', 'Taon')} columns={totals.map((y) => ({ key: String(y.year), label: String(y.year), value: y.amount, sub: n(y.programs, 'program', 'programa'), cls: 'fill-gaa' }))} />
          <ul className="mini-list">
            {rows.slice(0, 6).map((r) => (
              <li key={r.key}>
                <span>{r.name}</span>
                <span className="muted small">{departmentShort(r.department)} · {GAA_YEARS.filter((y) => hasYear(r, y)).join(', ') || '—'}</span>
              </li>
            ))}
          </ul>
          {rows.length > 6 && <p className="small"><Link to={`/gaa?q=${encodeURIComponent(name)}`}>{t(`All ${count(rows.length)} →`, `Lahat ng ${count(rows.length)} →`)}</Link></p>}
        </>
      )}
    </ChartCard>
  );
}
