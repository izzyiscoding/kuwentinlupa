/**
 * The Overview's two sections for residents: what the projects are for, in
 * everyday terms, and what a resident can do with this budget. The amounts
 * are the portal's lines grouped by kind (`src/lib/kinds.ts`), per version.
 * The reporting channels are the government's own; this portal collects no
 * reports (see docs/reporting.md).
 */
import { Link } from 'react-router-dom';
import { php } from '../lib/format';
import { byKind, KIND_ICON, kindLabel, type Kind } from '../lib/kinds';
import { useLang } from '../lib/lang';
import { usePortal } from '../lib/portal-context';
import type { ScopedProject } from '../lib/scope';
import { Icon } from './Icons';
import Carousel from './Carousel';

/** `bare`: no heading of its own, for use inside an Overview chapter. */
export function WhatItMeans({ rows, place, bare }: { rows: readonly ScopedProject[]; place: string; bare?: boolean }) {
  const { t, n } = useLang();
  const groups = byKind(rows);
  const words: Record<Kind, { title: string; means: string }> = {
    flood: {
      title: kindLabel('flood', t),
      means: t('Walls and channels along rivers and creeks, built to keep floodwater away from streets and homes.', 'Mga pader at daluyan sa ilog at sapa, para hindi bahain ang mga kalye at bahay.'),
    },
    building: {
      title: kindLabel('building', t),
      means: t('Covered courts and multi-purpose halls: for sports, barangay events, and shelter when storms come.', 'Mga covered court at multi-purpose hall: para sa palaro, aktibidad ng barangay, at silungan kapag may bagyo.'),
    },
    road: {
      title: kindLabel('road', t),
      means: t('Repairs and new roads for safer, smoother trips to school, market and work.', 'Pagkumpuni at bagong daan para sa mas ligtas at maayos na biyahe papuntang paaralan, palengke at trabaho.'),
    },
    health: {
      title: kindLabel('health', t),
      means: t('Hospitals and health centres: care closer to home.', 'Mga ospital at health center: lunas na mas malapit sa bahay.'),
    },
    other: { title: kindLabel('other', t), means: '' },
  };
  const main = groups.filter((g) => g.kind !== 'other');
  const other = groups.find((g) => g.kind === 'other');
  return (
    <section className={bare ? undefined : 'section'} aria-labelledby={bare ? undefined : 'means-h'}>
      {!bare && <h2 id="means-h" className="section-h">{t(`What this budget means for ${place}`, `Ano ang ibig sabihin ng badyet na ito para sa ${place}`)}</h2>}
      {!bare && <p className="section-lede">{t('What the money is meant to build, by kind of work. Whether it gets built is what we all watch.', 'Kung ano ang itatayo ng pera, ayon sa uri ng gawain. Kung maitatayo nga, iyan ang babantayan natin.')}</p>}
      <ul className="means">
        {main.map((g) => (
          <li key={g.kind}>
            <Link to={`/projects?kind=${g.kind}`} className="means-card">
              <span className="means-icon"><Icon name={KIND_ICON[g.kind]} size={30} /></span>
              <span className="means-n num">{n(g.rows.length, 'project', 'proyekto')}</span>
              <strong className="means-title">{words[g.kind].title}</strong>
              <span className="means-text">{words[g.kind].means}</span>
              <span className="means-php num">
                {php(g.summary.house.php)} <span className="muted">House bill</span>
                <span className="sep">·</span>
                {g.summary.nep.rows ? php(g.summary.nep.php) : '—'} <span className="muted">NEP</span>
              </span>
            </Link>
          </li>
        ))}
      </ul>
      {other && (
        <p className="fine">
          {t(`Plus ${n(other.rows.length, 'other line', 'iba pang linya', 'other lines')}, including the nationwide expressway line noted above.`, `Dagdag pa ang ${n(other.rows.length, '', 'iba pang linya')}, kasama ang linya para sa mga expressway sa buong bansa na nabanggit sa itaas.`)}{' '}
          <Link to="/projects?kind=other">{t('See them', 'Tingnan')}</Link>
        </p>
      )}
    </section>
  );
}

const REPORT = [
  { name: '8888 Citizens’ Complaint Hotline', url: 'https://8888.gov.ph', en: 'Call 8888, for complaints about any government office.', fil: 'Tumawag sa 8888, para sa reklamo sa anumang tanggapan ng gobyerno.' },
  { name: 'Sumbong sa Pangulo', url: 'https://sumbongsapangulo.ph', en: 'For flood-control projects that seem missing, unfinished or substandard.', fil: 'Para sa proyektong kontra-baha na mukhang wala, hindi tapos o mababa ang kalidad.' },
  { name: 'Office of the Ombudsman', url: 'https://www.ombudsman.gov.ph', en: 'For complaints against public officials and employees.', fil: 'Para sa reklamo laban sa mga opisyal at kawani ng gobyerno.' },
  { name: 'Commission on Audit (COA)', url: 'https://www.coa.gov.ph', en: 'Audits how government money is spent; its reports are public.', fil: 'Sinusuri kung paano ginagastos ang pera ng gobyerno; pampubliko ang mga ulat nito.' },
];

export function WhatYouCanDo({ bare }: { bare?: boolean } = {}) {
  const { config, districts } = usePortal();
  const { t, lang } = useLang();
  const district = districts.status === 'ready' ? districts.value[0]?.data : undefined;
  return (
    <section className={bare ? undefined : 'section'} aria-labelledby={bare ? undefined : 'do-h'}>
      <div className="rights">
        <Icon name="flag" size={28} />
        <div>
          <p className="rights-h">{t('This is taxpayers’ money. You have the right to scrutinise it.', 'Pera ito ng taumbayan. Karapatan mong suriin ito.')}</p>
          <p className="rights-text">
            {t('The 1987 Constitution (Article III, Section 7) recognises the right of the people to information on matters of public concern.', 'Kinikilala ng Saligang Batas ng 1987 (Artikulo III, Seksyon 7) ang karapatan ng mamamayan sa impormasyon tungkol sa mga bagay na may kinalaman sa publiko.')}
          </p>
        </div>
      </div>

      {!bare && <h2 id="do-h" className="section-h">{t('What you can do', 'Ano ang magagawa mo')}</h2>}
      <Carousel label={t('What you can do', 'Ano ang magagawa mo')}>
        <div className="action">
          <span className="action-art" aria-hidden="true"><span className="action-n">1</span><Icon name="pin" size={30} /></span>
          <strong>{t('Watch the projects near you', 'Bantayan ang mga proyekto malapit sa iyo')}</strong>
          <span>{t('Find your barangay, then go and see:', 'Hanapin ang iyong barangay, saka puntahan:')}</span>
          <ul className="checklist">
            <li>{t('Is the project there?', 'Nandoon ba ang proyekto?')}</li>
            <li>{t('Is work going on, or finished?', 'May ginagawa ba, o tapos na?')}</li>
            <li>{t('Take photos with the date', 'Kumuha ng litratong may petsa')}</li>
            <li>{t('Note the project’s name and barangay', 'Itala ang pangalan ng proyekto at barangay')}</li>
          </ul>
          <Link to="/#barangays" className="action-link">{t('Find your barangay →', 'Hanapin ang iyong barangay →')}</Link>
        </div>
        <div className="action">
          <span className="action-art" aria-hidden="true"><span className="action-n">2</span><Icon name="flag" size={30} /></span>
          <strong>{t('Report what looks wrong', 'I-report ang mukhang mali')}</strong>
          <span>{t('Missing, unfinished or poorly built? Send facts and photos with the project’s name to the proper office.', 'Wala, hindi tapos, o pangit ang pagkakagawa? Ipadala ang mga detalye at litrato, kasama ang pangalan ng proyekto, sa tamang tanggapan.')}</span>
          <ul className="channels">
            {REPORT.map((r) => (
              <li key={r.url}>
                <a href={r.url} target="_blank" rel="noopener">{r.name} ↗</a>
                <span>{lang === 'fil' ? r.fil : r.en}</span>
              </li>
            ))}
          </ul>
        </div>
        <div className="action">
          <span className="action-art" aria-hidden="true"><span className="action-n">3</span><Icon name="doc" size={30} /></span>
          <strong>{t('Ask for the documents', 'Humingi ng mga dokumento')}</strong>
          <span>{t('Request contracts and progress reports through the eFOI portal, or ask your district’s representative.', 'Humingi ng kontrata at ulat ng progreso sa eFOI portal, o magtanong sa kinatawan ng inyong distrito.')}</span>
          <span className="action-links">
            <a href="https://www.foi.gov.ph" target="_blank" rel="noopener">eFOI ↗</a>
            {district && <a href={district.url} target="_blank" rel="noopener">{t('Your district ↗', 'Ang iyong distrito ↗')}</a>}
          </span>
        </div>
        <div className="action">
          <span className="action-art" aria-hidden="true"><span className="action-n">4</span><Icon name="search" size={30} /></span>
          <strong>{t('Stay informed, and share', 'Maging mulat, at ibahagi')}</strong>
          <span>{t('Read budget news from more than one source. Share this page with your neighbours.', 'Magbasa ng balita tungkol sa badyet mula sa higit sa isang pinagkunan. Ibahagi ang pahinang ito sa mga kapitbahay.')}</span>
          <span className="action-links">
            <a href="https://budget.bettergov.ph" target="_blank" rel="noopener">budget.bettergov.ph ↗</a>
            {config.operator.email && <a href={`mailto:${config.operator.email}`}>{t('Tell us', 'Sabihan kami')}</a>}
          </span>
        </div>
      </Carousel>
      <p className="fine">
        {t('Stick to what you saw. A report asks the authorities to check; it is not proof of wrongdoing, and neither is anything on this site.', 'Manatili sa nakita mo. Ang report ay paghiling na suriin ng awtoridad; hindi ito patunay ng mali, gayundin ang anumang nasa site na ito.')}
      </p>
    </section>
  );
}
