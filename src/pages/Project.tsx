import { useEffect, useState } from 'react';
import { Link, useLocation, useParams } from 'react-router-dom';
import type { Envelope, ProjectDetail, Version } from '../api/types';
import { DATASET_KEYS, type DatasetKey } from '../config';
import { Await, Disclaimers, External, NoteFlag, ReasonTags, StatusChip } from '../components/Bits';
import { useLang } from '../lib/lang';
import { barangaysOf, slug } from '../lib/barangay';
import { phpFull } from '../lib/format';
import { DeltaPill } from '../components/ProjectList';
import { usePortal, type Async } from '../lib/portal-context';
import { projectKey } from '../lib/scope';
import { reportHref } from '../lib/report';
import { useTitle } from '../lib/use-title';

const VERSIONS: Version[] = ['nep', 'hgab2', 'hgab3', 'api'];
const FALLBACK_VERSION_LABELS: Record<Version, string> = {
  nep: 'NEP',
  hgab2: 'House bill, second reading',
  hgab3: 'House bill, third reading',
  api: 'DPWH transparency website listing',
};

export default function Project() {
  const { dataset = '', id = '' } = useParams();
  const { client } = usePortal();
  const valid = (DATASET_KEYS as readonly string[]).includes(dataset);
  const { t } = useLang();
  const [state, setState] = useState<{ key: string; value: Async<Envelope<ProjectDetail>> } | null>(null);
  const key = `${dataset}/${id}`;

  useEffect(() => {
    if (!valid) return;
    let live = true;
    client.project(dataset as DatasetKey, id).then(
      (value) => live && setState({ key, value: { status: 'ready', value } }),
      (error) => live && setState({ key, value: { status: 'error', error: error instanceof Error ? error : new Error(String(error)) } }),
    );
    return () => {
      live = false;
    };
  }, [client, dataset, id, key, valid]);

  if (!valid) {
    return (
      <main className="page main">
        <p className="state">{t(`There is no program called “${dataset}”.`, `Walang programang “${dataset}”.`)} <Link to="/projects">{t('Back to every project', 'Bumalik sa lahat ng proyekto')}</Link></p>
      </main>
    );
  }
  const current: Async<Envelope<ProjectDetail>> = state?.key === key ? state.value : { status: 'loading' };
  return (
    <main className="page main">
      <p className="crumbs"><Link to="/projects">← {t('All projects', 'Lahat ng proyekto')}</Link></p>
      <Await state={current} what={t('the project', 'ang proyekto')}>
        {(env) => <ProjectView env={env} />}
      </Await>
    </main>
  );
}

function ProjectView({ env }: { env: Envelope<ProjectDetail> }) {
  const { config, overview, scope, client } = usePortal();
  const location = useLocation();
  const p = env.data;
  const { t } = useLang();
  // Some titles list many projects; a tab shows only the start anyway.
  useTitle(`${p.title.length > 60 ? `${p.title.slice(0, 57).trimEnd()}…` : p.title} · ${config.name}`);

  const ov = overview.status === 'ready' ? overview.value.data : null;
  const program = ov?.datasets.find((d) => d.key === p.dataset);
  const versionLabel = (v: Version) => ov?.record_versions.find((r) => r.key === v)?.label ?? FALLBACK_VERSION_LABELS[v];
  const inScope = scope.status === 'ready' ? scope.value.projects.find((x) => x.key === projectKey(p.dataset, p.id)) : undefined;
  const versions = VERSIONS.filter((v) => v !== 'api' || p.dataset === 'dpwh');
  const report = reportHref(config, p, window.location.origin + location.pathname);
  const brgys = barangaysOf(p.title, config.barangays ?? []);

  const details: [string, string | null][] = [
    [t('Program', 'Programa'), program?.label ?? p.dataset.toUpperCase()],
    [t('Program line', 'Linya ng programa'), p.program],
    [t('Sub-line', 'Kategorya'), p.pap],
    [t('DPWH office', 'Opisina ng DPWH'), p.office],
    [t('Region', 'Rehiyon'), p.region],
    [t('How the two versions were matched', 'Paano pinagtugma ang dalawang bersyon'), p.labels.match?.label ?? null],
    [t('Between the House readings', 'Sa pagitan ng mga pagbasa sa Kamara'), p.labels.reading?.label ?? null],
    [t('DPWH transparency website', 'Transparency website ng DPWH'), p.labels.dpwh_site?.label ?? null],
    [t('Length', 'Haba'), p.length_m != null ? `${Math.round(p.length_m).toLocaleString('en-US')} m` : null],
  ];

  return (
    <article className="project">
      <p className="eyebrow">
        {program?.short ?? p.dataset.toUpperCase()}<span className="sep">·</span>FY 2027
        {p.office && <><span className="sep">·</span>{p.office}</>}
      </p>
      <h1 className={`project-h${p.title.length > 200 ? ' long' : ''}`}>{p.title}</h1>
      <div className="project-status">
        <StatusChip group={p.bridge_group} label={p.status_label} held={p.held} />
        {p.labels.status.help && <p className="muted">{p.labels.status.help}</p>}
      </div>
      {inScope?.note && <NoteFlag note={inScope.note} />}
      {brgys.length > 0 && (
        <p className="project-brgys">
          {brgys.map((b) => <Link key={b} to={`/barangay/${slug(b)}`} className="tag tag-brgy">{b}</Link>)}
        </p>
      )}

      <div className="project-grid">
        <section aria-labelledby="amounts-h">
          <h2 id="amounts-h" className="section-h">{t('Amount in each version, with the page it is on', 'Halaga sa bawat bersyon, at ang pahina nito')}</h2>
          <table className="amounts">
            <tbody>
              {versions.map((v) => {
                const amount = p[`${v}_php` as const];
                const pdf = p.pdf_url[v];
                const page = v === 'api' ? null : p[`${v}_page` as const];
                return (
                  <tr key={v}>
                    <th scope="row">{versionLabel(v)}</th>
                    <td className="num r" title={phpFull(amount)}>{amount == null ? <span className="muted">{t('not listed', 'wala')}</span> : phpFull(amount)}</td>
                    <td className="r">
                      {pdf ? <External href={pdf}>{page ? t(`Page ${page}`, `Pahina ${page}`) : t('Open the document', 'Buksan ang dokumento')}</External> : <span className="muted">—</span>}
                    </td>
                  </tr>
                );
              })}
              <tr className="amounts-total">
                <th scope="row">{t('Change, House bill against the NEP', 'Pagbabago, House bill laban sa NEP')}</th>
                <td className="num r"><DeltaPill delta={p.delta_php} /></td>
                <td />
              </tr>
            </tbody>
          </table>
          <p className="fine">
            {t('Two versions of one budget: compared, never added. Open the page to check the figure yourself.', 'Dalawang bersyon ng iisang badyet: pinaghahambing, hindi pinagsasama. Buksan ang pahina para suriin mismo.')}
          </p>

          {p.labels.flags.length > 0 && (
            <>
              <h3 className="sub-h">{t('Notes on this line', 'Mga tala sa linyang ito')}</h3>
              <ul className="flags">
                {p.labels.flags.map((f) => <li key={f.code}>{f.label}{f.help ? <span className="muted"> {f.help}</span> : null}</li>)}
              </ul>
            </>
          )}
        </section>

        <aside className="project-side">
          <dl className="details">
            {details.filter(([, v]) => v).map(([k, v]) => (
              <div key={k}>
                <dt className="label">{k}</dt>
                <dd>{v}</dd>
              </div>
            ))}
            {p.lat != null && p.lon != null && (
              <div>
                <dt className="label">{t('Coordinates in the document', 'Koordinado sa dokumento')}</dt>
                <dd>
                  <External href={`https://www.openstreetmap.org/?mlat=${p.lat}&mlon=${p.lon}#map=15/${p.lat}/${p.lon}`}>
                    {p.lat.toFixed(5)}, {p.lon.toFixed(5)} {t('on the map', 'sa mapa')}
                  </External>
                </dd>
              </div>
            )}
            <div>
              <dt className="label">{t('Why it is in this portal', 'Bakit ito nasa portal')}</dt>
              <dd>
                {inScope ? (
                  <ReasonTags reasons={inScope.reasons} />
                ) : (
                  <span className="muted">{t('Not among this portal’s projects; shown because you followed a link to it.', 'Wala sa mga proyekto ng portal; ipinapakita dahil sinundan mo ang link.')}</span>
                )}
              </dd>
            </div>
          </dl>

          <div className="report">
            <p className="label">{t('Seen this project on the ground?', 'Nakita mo na ba ang proyektong ito?')}</p>
            {report ? (
              <a className="button button-primary" href={report}>{t('Report on this project ↗', 'Mag-ulat tungkol dito ↗')}</a>
            ) : (
              <p className="small">
                {t('Citizen reports will go to one place for every portal, budget.bettergov.ph. Reporting is not open yet.', 'Ang mga ulat ng mamamayan ay mapupunta sa iisang lugar, budget.bettergov.ph. Hindi pa ito bukas.')}
              </p>
            )}
          </div>

          <p className="small links">
            <External href={p.url}>{t('This project on budget.bettergov.ph', 'Ang proyektong ito sa budget.bettergov.ph')}</External>
            <br />
            <External href={client.href(p.api_url)}>{t('The API record (JSON)', 'Ang record sa API (JSON)')}</External>
          </p>
        </aside>
      </div>

      <Disclaimers items={env.disclaimers} />
    </article>
  );
}
