import { Link } from 'react-router-dom';
import type { Disclaimer, Overview } from '../api/types';
import { shortNameOf, textOf } from '../config';
import { Await, Disclaimers, External } from '../components/Bits';
import { Icon } from '../components/Icons';
import { BrandMark } from '../components/Brand';
import type { IconName } from '../lib/words';
import { count, date, php } from '../lib/format';
import { departmentShort } from '../lib/gaa';
import { useLang } from '../lib/lang';
import { SOURCE_CODE_URL } from '../lib/links';
import { usePortal } from '../lib/portal-context';
import type { ScopeResult } from '../lib/scope';
import { useGaa } from '../lib/use-gaa';
import { useTitle } from '../lib/use-title';

export default function About() {
  const { scope, overview, config } = usePortal();
  const { t } = useLang();
  useTitle(`${t('About', 'Tungkol dito')} · ${config.name}`);
  return (
    <main className="page main">
      <Await state={scope} what={t('the portal’s queries', 'ang mga tanong ng portal')}>
        {(s) => (
          <Await state={overview} what={t('the data notes', 'ang mga tala sa datos')}>
            {(ov) => <AboutView scope={s} overview={ov.data} />}
          </Await>
        )}
      </Await>
    </main>
  );
}

function AboutView({ scope, overview }: { scope: ScopeResult; overview: Overview }) {
  const { config, districts } = usePortal();
  const { t, n, lang } = useLang();
  const place = shortNameOf(config);
  const label = (k: string) => overview.datasets.find((d) => d.key === k)?.short ?? k.toUpperCase();
  const disclaimers = new Map<string, Disclaimer>();
  for (const d of scope.disclaimers) disclaimers.set(d.id, d);
  if (districts.status === 'ready') for (const env of districts.value) for (const d of env.disclaimers) disclaimers.set(d.id, d);
  const meta = scope.meta;
  const terms = Object.entries(overview.terms);

  /** The API's `rules`, in words for readers rather than developers. */
  const promises: { icon: IconName; title: string; text: string }[] = [
    { icon: 'doc', title: t('Amounts, not spending', 'Halaga, hindi gastos'), text: t('These are amounts in the budget documents, not money spent.', 'Mga halaga ito sa dokumento ng badyet, hindi perang nagastos na.') },
    { icon: 'compare', title: t('Compared, never added', 'Pinaghahambing, hindi pinagsasama'), text: t('The NEP and the House bill are two versions of one budget.', 'Dalawang bersyon ng iisang badyet ang NEP at House bill.') },
    { icon: 'search', title: t('Leads, not findings', 'Dapat suriin, hindi paratang'), text: t('“House bill only” and “NEP only” are candidates to check. Some were only renamed or moved.', 'Ang “nasa House bill lang” at “nasa NEP lang” ay dapat suriin. May mga pinalitan lang ng pangalan o inilipat.') },
    { icon: 'list', title: t('A dash is not zero', 'Ang gitling ay hindi sero'), text: t('A dash means that document has no such line.', 'Ibig sabihin ng gitling, walang ganoong linya sa dokumentong iyon.') },
    { icon: 'flag', title: t('Unsure matches are marked', 'May marka ang hindi tiyak'), text: t('“Unconfirmed match” means the two versions were paired on a similar name, not an exact one.', 'Ang “hindi kumpirmadong tugma” ay pinagtugma batay sa magkahawig na pangalan, hindi eksakto.') },
    { icon: 'building', title: t('Shared offices stay whole', 'Buo ang opisinang pinaghahatian'), text: t('A DPWH office serving several districts is shown whole, never split between them.', 'Buo ang opisina ng DPWH na may ilang distrito; hindi hinahati ang pera nito.') },
  ];

  return (
    <>
      {/* 1. Who we are */}
      <section className="about-hero" aria-labelledby="about-h">
        <BrandMark size={64} />
        <div className="about-hero-text">
          <p className="eyebrow">{t('About', 'Tungkol dito')}</p>
          <h1 id="about-h">{t(`About ${config.name}`, `Tungkol sa ${config.name}`)}</h1>
          {config.hero?.about && <p className="about-lede">{textOf(config.hero.about, lang)}</p>}
          <ul className="about-facts">
            <li><Icon name="flag" size={16} />{config.operator.name}</li>
            <li><Icon name="search" size={16} />{t('Not a government website', 'Hindi website ng gobyerno')}</li>
            <li><Icon name="doc" size={16} />{t('Every figure from the public BetterGov.ph Budget API, unchanged', 'Lahat ng numero mula sa pampublikong BetterGov.ph Budget API, walang binago')}</li>
          </ul>
          {config.operator.email && (
            <p className="about-cta">
              <a className="button button-primary" href={`mailto:${config.operator.email}`}><Icon name="mail" size={18} />{t('Write to us', 'Sumulat sa amin')}</a>
              <span className="muted">{config.operator.email}</span>
            </p>
          )}
        </div>
      </section>

      {/* 2. How it works */}
      <section className="section" aria-labelledby="flow-h">
        <h2 id="flow-h" className="section-h">{t('How it works, in four steps', 'Paano ito gumagana, sa apat na hakbang')}</h2>
        <ol className="flow">
          <li>
            <span className="flow-icon"><Icon name="doc" size={26} /></span>
            <strong>{t('The budget documents', 'Ang mga dokumento ng badyet')}</strong>
            <span>{t(`The NEP and the House bill: ${n(overview.documents.length, 'PDF', 'PDF')} published by the government.`, `Ang NEP at House bill: ${n(overview.documents.length, 'PDF', 'PDF')} na inilathala ng gobyerno.`)}</span>
          </li>
          <li>
            <span className="flow-icon"><Icon name="compare" size={26} /></span>
            <strong>BetterGov.ph Budget API</strong>
            <span>{t('Reads every line and matches the two versions, project by project.', 'Binabasa ang bawat linya at pinagtutugma ang dalawang bersyon, isa-isa.')}</span>
          </li>
          <li className="flow-us">
            <span className="flow-icon"><BrandMark size={34} /></span>
            <strong>{config.name}</strong>
            <span>{t(`Keeps the ${n(scope.projects.length, 'line', 'linya')} whose title names ${place}, and shows them as published.`, `Itinatabi ang ${n(scope.projects.length, 'line', 'linya')} na bumabanggit sa ${place}, at ipinapakita gaya ng pagkakalathala.`)}</span>
          </li>
          <li>
            <span className="flow-icon"><Icon name="pin" size={26} /></span>
            <strong>{t('You', 'Ikaw')}</strong>
            <span>{t('Check the projects, ask questions, report what looks wrong.', 'Suriin ang mga proyekto, magtanong, i-report ang mukhang mali.')} <Link to="/#ch-act">{t('How →', 'Paano →')}</Link></span>
          </li>
        </ol>
      </section>

      {/* 3. Our promises */}
      <section className="section" aria-labelledby="promise-h">
        <h2 id="promise-h" className="section-h">{t('How to read the figures: our six rules', 'Paano basahin ang mga numero: ang aming anim na tuntunin')}</h2>
        <ul className="promises">
          {promises.map((p) => (
            <li key={p.title}>
              <span className="promise-icon"><Icon name={p.icon} size={20} /></span>
              <strong>{p.title}</strong>
              <span>{p.text}</span>
            </li>
          ))}
        </ul>
      </section>

      {/* 4. Check our work */}
      <section className="section check-work" aria-labelledby="check-h">
        <h2 id="check-h" className="section-h">{t('Check our work', 'Suriin ang aming gawa')}</h2>
        <p className="section-lede">{t('Every question we ask the API, with a link to run it yourself, and every line we noted or removed.', 'Bawat tanong namin sa API, may link para subukan mo mismo, at bawat linyang may paalala o tinanggal.')}</p>

        <div className="card">
          <h3 className="sub-h">{t('The 2027 budget', 'Ang badyet ng 2027')}</h3>
          <div className="table queries" role="table" aria-label="Queries">
            <div className="tr th" role="row">
              <span role="columnheader">{t('Lines that…', 'Mga linyang…')}</span>
              <span role="columnheader">{t('Program', 'Programa')}</span>
              <span role="columnheader" className="r">{t('Found', 'Nahanap')}</span>
              <span role="columnheader" className="r">{t('Kept', 'Itinira')}</span>
              <span role="columnheader" className="r">{t('Check it', 'Suriin')}</span>
            </div>
            {scope.queries.map((q, i) => (
              <div className="tr" role="row" key={i}>
                <span role="cell">
                  {q.kind === 'office' ? <>{t('are listed under', 'nakalista sa ilalim ng')} <strong>{q.label}</strong></> : <>{t('have a title naming', 'may pamagat na bumabanggit sa')} <strong>{String(q.params.q)}</strong></>}
                  {q.region && <span className="muted small"> · {t(`kept to region ${q.region}, or giving no region`, `sa rehiyong ${q.region} lang, o walang rehiyon`)}</span>}
                  {q.titleOnly && <span className="muted small"> · {t('kept only where the project’s own title names it, not just its office', 'kung ang mismong pamagat ang bumabanggit, hindi lang ang opisina')}</span>}
                </span>
                <span role="cell">{label(q.dataset)}</span>
                <span role="cell" className="r num">{count(q.total)}</span>
                <span role="cell" className="r num">{count(q.kept)}</span>
                <span role="cell" className="r"><External href={q.api}>API</External></span>
              </div>
            ))}
          </div>
          <p className="fine">{t('A line found by more than one question is shown once, with every reason.', 'Ang linyang nahanap ng higit sa isang tanong ay isang beses lang ipinapakita, kasama ang lahat ng dahilan.')}</p>

          <GaaQuestions />
        </div>

        <div className="card-grid two">
          <div className="card">
            <h3 className="card-h"><Icon name="flag" size={18} /> {t(`Lines with a note: ${scope.notes.length}`, `Mga linyang may paalala: ${scope.notes.length}`)}</h3>
            {scope.notes.length === 0 ? (
              <p className="muted">{t('None.', 'Wala.')}</p>
            ) : (
              <ul className="plain-list">
                {scope.notes.map(({ note, project }) => (
                  <li key={note.key}>
                    {project ? <Link to={`/projects/${project.dataset}/${encodeURIComponent(project.id)}`}>{project.title.slice(0, 90)}{project.title.length > 90 ? '…' : ''}</Link> : <code>{note.key}</code>}
                    {project && <span className="muted"> · {php(project.house_php ?? project.nep_php)}</span>}
                    <span className="muted"> — {textOf(note.note, lang)} {t('It stays in every total.', 'Kasama pa rin ito sa lahat ng kabuuan.')}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
          <div className="card">
            <h3 className="card-h"><Icon name="list" size={18} /> {t(`Lines removed by hand: ${scope.excluded.length}`, `Mga linyang tinanggal: ${scope.excluded.length}`)}</h3>
            {scope.excluded.length === 0 ? (
              <p className="muted">{t('None. Every line the questions return is shown.', 'Wala. Ipinapakita ang lahat ng linyang ibinalik ng mga tanong.')}</p>
            ) : (
              <ul className="plain-list">
                {scope.excluded.map(({ exclusion, project }) => (
                  <li key={exclusion.key}>
                    {project ? <External href={project.url}>{project.title}</External> : <code>{exclusion.key}</code>}
                    <span className="muted"> — {exclusion.reason}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </section>

      {/* 5. The source documents */}
      <section className="section" aria-labelledby="d-h">
        <h2 id="d-h" className="section-h">{t('The source documents', 'Ang mga pinagkunang dokumento')}</h2>
        <ul className="doc-cards">
          {overview.documents.map((d) => (
            <li key={d.key}>
              <a href={d.pdf_url} target="_blank" rel="noopener" className="doc-card">
                <span className="doc-card-icon"><Icon name="doc" size={22} /></span>
                <span className="doc-card-title">{d.title}</span>
                <span className="doc-card-cta">{t('Open the PDF ↗', 'Buksan ang PDF ↗')}</span>
              </a>
              {d.source_url && <a className="doc-card-src" href={d.source_url} target="_blank" rel="noopener">{t('where it was published ↗', 'kung saan inilathala ↗')}</a>}
            </li>
          ))}
        </ul>
      </section>

      {/* 6. Words, notices, credits */}
      {terms.length > 0 && (
        <section className="section" aria-labelledby="w-h">
          <div className="glossary">
            <h2 id="w-h" className="section-h">{t(`Words used here (${terms.length})`, `Mga salitang ginamit (${terms.length})`)}</h2>
            <dl className="terms">
              {terms.map(([k, term]) => (
                <div key={k}>
                  <dt>{term.term}</dt>
                  <dd>{term.meaning}</dd>
                </div>
              ))}
            </dl>
          </div>
        </section>
      )}

      <section className="section" aria-labelledby="n-h">
        <h2 id="n-h" className="section-h">{t('Notices from the data source', 'Paalala mula sa pinagkunan ng datos')}</h2>
        <Disclaimers items={[...disclaimers.values()]} />
        <p className="fine">
          {t('Data version', 'Bersyon ng datos')}: <a href={`${meta.source_repo}/tree/${meta.source_commit}`} target="_blank" rel="noopener">{meta.source_commit.slice(0, 7)}</a>,{' '}
          {date(meta.built_at)}. {t('Every project nationwide', 'Lahat ng proyekto sa buong bansa')}: <External href={overview.url}>budget.bettergov.ph</External>.
        </p>
      </section>

      <section className="section build-own" aria-labelledby="b-h">
        <h2 id="b-h" className="section-h">{t('Run a portal like this for your LGU or DPWH office', 'Gumawa ng ganitong portal para sa inyong LGU o opisina ng DPWH')}</h2>
        <p>
          {t('This portal is open source. Fork it, run ', 'Open source ang portal na ito. I-fork ito, patakbuhin ang ')}<code>npm run setup</code>
          {t(' to pick your province, city, municipality or district engineering office, and deploy it to Cloudflare, Vercel or Netlify. It needs no database: the data comes from the same API.', ' para piliin ang inyong lalawigan, lungsod, bayan o district engineering office, at i-deploy sa Cloudflare, Vercel o Netlify. Walang database: galing sa parehong API ang datos.')}{' '}
          <External href={SOURCE_CODE_URL}>{t('Source code', 'Source code')}</External> · <Link to="/projects">{t('Back to the projects', 'Bumalik sa mga proyekto')}</Link>
        </p>
      </section>
    </>
  );
}

/** The 2020–2026 searches, published like the 2027 ones: every department with a match, and how to check it. */
function GaaQuestions() {
  const { t, n } = useLang();
  const { state } = useGaa();
  return (
    <section aria-labelledby="g-h">
      <h3 id="g-h" className="sub-h">{t('The 2020–2026 budgets', 'Ang badyet ng 2020–2026')}</h3>
      {!state ? (
        <p>{t('None: this portal names no place, and the enacted budgets list projects by name, not by office.', 'Wala: walang lugar na binabanggit ang portal, at ayon sa pangalan nakalista ang mga naipasang badyet.')}</p>
      ) : state.status === 'loading' ? (
        <p className="state" role="status"><span className="spinner" aria-hidden="true" /> {t('Loading the searches…', 'Kinukuha ang mga paghahanap…')}</p>
      ) : state.status === 'error' ? (
        <p className="state state-error">{state.error.message}</p>
      ) : (
        <>
          <div className="table queries" role="table" aria-label="Searches of the enacted budgets">
            <div className="tr th" role="row">
              <span role="columnheader">{t('Programs whose name has…', 'Mga programang may…')}</span>
              <span role="columnheader">{t('Department', 'Departamento')}</span>
              <span role="columnheader" className="r">{t('Found', 'Nahanap')}</span>
              <span role="columnheader" className="r">{t('Loaded', 'Naikarga')}</span>
              <span role="columnheader" className="r">{t('Check it', 'Suriin')}</span>
            </div>
            {state.value.queries.map((q) => (
              <div className="tr" role="row" key={q.place + q.department_id}>
                <span role="cell"><strong>{q.q}</strong></span>
                <span role="cell">{departmentShort(q.department)}</span>
                <span role="cell" className="r num">{count(q.matched)}</span>
                <span role="cell" className="r num">{count(q.fetched)}</span>
                <span role="cell" className="r"><External href={q.api}>API</External></span>
              </div>
            ))}
          </div>
          <p className="fine">
            {t(`All ${count(state.value.searched)} departments were searched; those not listed matched nothing.`, `Hinanap ang lahat ng ${count(state.value.searched)} departamento; walang tumugma sa hindi nakalista.`)}{' '}
            {state.value.excluded.length > 0 ? t(`${n(state.value.excluded.length, 'program', 'programa')} removed by hand:`, `${n(state.value.excluded.length, 'program', 'programa')} ang tinanggal:`) : t('None removed by hand.', 'Walang tinanggal.')}
          </p>
          {state.value.excluded.length > 0 && (
            <ul className="plain-list">
              {state.value.excluded.map(({ exclusion, row }) => (
                <li key={exclusion.key}>
                  {row ? row.name : <code>{exclusion.key}</code>}
                  <span className="muted"> — {exclusion.reason}</span>
                </li>
              ))}
            </ul>
          )}
        </>
      )}
    </section>
  );
}
