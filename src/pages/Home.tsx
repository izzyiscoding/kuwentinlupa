/**
 * The Overview, told as a story for a resident who cares: six short chapters,
 * each a plain question with a one- or two-sentence answer and a picture.
 * The charts and the DPWH office are on /analysis.
 *
 * Every figure is the API's, counted or summed per version by `summarise()`.
 * The NEP and the House bill are compared (their difference is shown), never
 * added; "House bill only" lines are leads to check, never findings.
 */
import { useEffect, useMemo, type ReactNode } from 'react';
import { Link, useLocation } from 'react-router-dom';
import type { BridgeGroup, Disclaimer } from '../api/types';
import { BRIDGE_GROUPS } from '../api/types';
import { shortNameOf, textOf, type LineNote } from '../config';
import { Await, Disclaimers, StatusChip } from '../components/Bits';
import { Icon } from '../components/Icons';
import { WhatItMeans, WhatYouCanDo } from '../components/ForYou';
import { barangaysOf, byBarangay, slug } from '../lib/barangay';
import { php, phpDelta } from '../lib/format';
import { byKind, KIND_ICON, kindLabel, kindOf } from '../lib/kinds';
import { useLang } from '../lib/lang';
import { usePortal } from '../lib/portal-context';
import { fold, summarise, type ScopeResult, type ScopedProject, type Summary } from '../lib/scope';
import { useTitle } from '../lib/use-title';
import { groupInfo, NO_BARANGAYS, NO_DATASETS, projectHref, STATUS_FIL } from '../lib/words';

export default function Home() {
  const { scope, config } = usePortal();
  const { t } = useLang();
  // Brand first on the home page, so it reads in a row of tabs and in bookmarks.
  useTitle(`${config.name} · ${t(`${shortNameOf(config)}’s 2027 budget, explained`, `Ang badyet ng ${shortNameOf(config)} sa 2027, ipinaliwanag`)}`);
  return (
    <main className="main">
      <Await state={scope} what={t('projects', 'mga proyekto')}>
        {(s) => <Overview scope={s} />}
      </Await>
    </main>
  );
}

function Overview({ scope }: { scope: ScopeResult }) {
  const { config, districts } = usePortal();
  const { t, n } = useLang();
  const { hash } = useLocation();
  const place = shortNameOf(config);
  const rows = scope.projects;
  const s = useMemo(() => summarise(rows), [rows]);
  const notes = scope.notes.filter((x) => x.note.headline && x.project);
  // The place's own projects: every line but the headline-noted ones (a
  // nationwide line that only names the place). Summed per version, as always.
  const ownRows = useMemo(() => rows.filter((r) => !r.note?.headline), [rows]);
  const own = useMemo(() => summarise(ownRows), [ownRows]);
  const noted = notes[0]?.project ?? null;
  const diff = own.house.php - own.nep.php;
  // The three kinds of work with the most House bill money, the noted nationwide line aside.
  const topKinds = byKind(ownRows)
    .filter((g) => g.kind !== 'other')
    .sort((a, b) => b.summary.house.php - a.summary.house.php)
    .slice(0, 3)
    .map((g) => g.kind);

  useEffect(() => {
    if (hash) document.getElementById(decodeURIComponent(hash.slice(1)))?.scrollIntoView({ block: 'start' });
  }, [hash]);

  const disclaimers = useMemo(() => {
    const byId = new Map<string, Disclaimer>(scope.disclaimers.map((d) => [d.id, d]));
    if (districts.status === 'ready') for (const env of districts.value) for (const d of env.disclaimers) if (!byId.has(d.id)) byId.set(d.id, d);
    return [...byId.values()];
  }, [scope.disclaimers, districts]);

  return (
    <>
      <Hero own={own} all={s} noted={noted} />
      <div className="page story">
        <Chapter n={1} id="ch-plan" icon="doc"
          title={t('Every year, our taxes become a plan', 'Bawat taon, nagiging plano ang ating buwis')}
          lede={t('The government lists where it will spend our money next year. That list is the budget, and it passes through a few hands before it becomes law.', 'Inililista ng gobyerno kung saan nito gagastusin ang ating pera sa susunod na taon. Iyan ang badyet, at dumadaan ito sa ilang kamay bago maging batas.')}>
          <Journey />
        </Chapter>

        <Chapter n={2} id="ch-how-much" icon="compare"
          title={t(`How much is set aside for ${place}?`, `Magkano ang nakalaan para sa ${place}?`)}
          lede={noted
            ? t(
                `The lines naming ${place} add up to ${php(s.nep.php)} in the President’s proposal (the NEP) and ${php(s.house.php)} in the House’s version. But ${php(noted.house_php ?? noted.nep_php)} of each is one nationwide line. ${place}’s own projects get ${php(own.nep.php)} in the NEP and ${php(own.house.php)} in the House bill: ${diff >= 0 ? `${php(diff)} more` : `${php(-diff)} less`}.`,
                `Ang mga linyang bumabanggit sa ${place} ay umaabot sa ${php(s.nep.php)} sa panukala ng Pangulo (ang NEP) at ${php(s.house.php)} sa bersyon ng Kamara. Pero ang ${php(noted.house_php ?? noted.nep_php)} ng bawat isa ay iisang linya para sa buong bansa. Ang sariling proyekto ng ${place} ay may ${php(own.nep.php)} sa NEP at ${php(own.house.php)} sa House bill: ${diff >= 0 ? `${php(diff)} na mas malaki` : `${php(-diff)} na mas maliit`}.`,
              )
            : t(
                `The President’s proposal, the NEP, set aside ${php(s.nep.php)}. The House of Representatives’ version sets aside ${php(s.house.php)}: ${diff >= 0 ? `${php(diff)} more` : `${php(-diff)} less`}.`,
                `Ang panukala ng Pangulo, ang NEP, ay naglaan ng ${php(s.nep.php)}. Ang bersyon ng Kamara ay naglalaan ng ${php(s.house.php)}: ${diff >= 0 ? `${php(diff)} na mas malaki` : `${php(-diff)} na mas maliit`}.`,
              )}>
          <Bubbles own={own} all={s} noted={noted} />
          <p className="fine">{t('Two versions of one budget, so they are compared, never added. These are amounts set aside, not money spent.', 'Dalawang bersyon ng iisang badyet, kaya pinaghahambing, hindi pinagsasama. Mga nakalaang halaga ito, hindi perang nagastos.')}</p>
          {notes.map(({ note, project }) => <Spotlight key={note.key} note={note} p={project!} />)}
        </Chapter>

        <Chapter n={3} id="ch-changes" icon="search"
          title={t('What did the House change?', 'Ano ang binago ng Kamara?')}
          lede={s.groups.house_only.rows
            ? t(
                `${n(s.groups.house_only.rows, 'project', 'proyekto')} worth ${php(s.groups.house_only.house_php)} appear only in the House bill. They may be good projects, or not: that is exactly what we check.`,
                `May ${n(s.groups.house_only.rows, 'project', 'proyekto')} na nagkakahalaga ng ${php(s.groups.house_only.house_php)} na nasa House bill lang. Maaaring mabuti ang mga ito, o hindi: iyan mismo ang susuriin natin.`,
              )
            : t('Every project is in both versions.', 'Nasa dalawang bersyon ang lahat ng proyekto.')}>
          <Changes s={s} />
          <AtAGlance rows={rows} />
        </Chapter>

        <Chapter n={4} id="ch-where" icon="building"
          title={t('Where will the money go?', 'Saan mapupunta ang pera?')}
          lede={t(`${noted ? `Of ${place}’s own ${php(own.house.php)} in the House bill, most goes to` : 'Mostly into'} ${topKinds.map((k) => kindLabel(k, t).toLowerCase()).join(', ')}. Here is what each is for, and the biggest projects.`, `${noted ? `Sa sariling ${php(own.house.php)} ng ${place} sa House bill, karamihan ay para sa` : 'Karamihan sa'} ${topKinds.map((k) => kindLabel(k, t).toLowerCase()).join(', ')}. Narito kung para saan ang bawat isa, at ang pinakamalalaking proyekto.`)}>
          <MoneySplit rows={ownRows} />
          <WhatItMeans rows={rows} place={place} bare />
          <Biggest rows={rows} />
        </Chapter>

        <Chapter n={5} id="barangays" icon="pin"
          title={t('What about your barangay?', 'Paano ang barangay mo?')}
          lede={t('Find your barangay to see the projects whose title names it.', 'Hanapin ang iyong barangay para makita ang mga proyektong bumabanggit dito.')}>
          <Barangays rows={rows} />
        </Chapter>

        <Chapter n={6} id="ch-act" icon="flag"
          title={t('It’s our money. Let’s watch it.', 'Pera natin ito. Bantayan natin.')}
          lede={t('A budget is only a promise until the work is done. Here is how you can help make sure it is.', 'Pangako lang ang badyet hangga’t hindi natatapos ang gawain. Ganito ka makakatulong na matiyak ito.')}>
          <WhatYouCanDo bare />
        </Chapter>

        <Disclaimers items={disclaimers} />
      </div>
    </>
  );
}

/** One chapter of the story: its number, a question, a short answer, then a picture. */
function Chapter({ n, id, icon, title, lede, children }: { n: number; id: string; icon: Parameters<typeof Icon>[0]['name']; title: string; lede: ReactNode; children: ReactNode }) {
  const { t } = useLang();
  return (
    <section className="chapter" id={id} aria-labelledby={`${id}-h`}>
      <div className="chapter-head">
        <span className="chapter-n" aria-hidden="true"><Icon name={icon} size={22} /></span>
        <div>
          <p className="chapter-kicker">{t(`Chapter ${n}`, `Kabanata ${n}`)}</p>
          <h2 id={`${id}-h`} className="chapter-h">{title}</h2>
          <p className="chapter-lede">{lede}</p>
        </div>
      </div>
      <div className="chapter-body">{children}</div>
    </section>
  );
}

// ---------------------------------------------------------------------------
// Hero: the photo band, with the figures floating on it as bubbles
// ---------------------------------------------------------------------------

function Hero({ own, all, noted }: { own: Summary; all: Summary; noted: ScopedProject | null }) {
  const { config } = usePortal();
  const { t, lang } = useLang();
  const hero = config.hero;
  const img = hero?.image;
  const diff = own.house.php - own.nep.php;
  const place = shortNameOf(config);
  const lineAmount = noted ? php(noted.house_php ?? noted.nep_php) : '';
  return (
    <div className="page">
      <section className="photo-band">
        {img && (
          <picture>
            {img.webpSrcSet && <source type="image/webp" srcSet={img.webpSrcSet} sizes="100vw" />}
            <img src={img.src} srcSet={img.srcSet} sizes="100vw" alt={textOf(img.alt, lang) ?? ''} />
          </picture>
        )}
        <div className="photo-band-shade" aria-hidden="true" />
        <div className="photo-band-inner">
          <p className="photo-band-kicker">{t(`FY 2027 budget · ${place}`, `Badyet ng 2027 · ${place}`)}</p>
          <h1 className="photo-band-slogan">{textOf(hero?.slogan, lang) ?? config.name}</h1>
          {hero?.about && <p className="photo-band-about">{textOf(hero.about, lang)}</p>}
        </div>
        <div className="bubbles" aria-label={t('The budget in three numbers', 'Ang badyet sa tatlong numero')}>
          <span className="bubble bubble-main">
            <span className="bubble-v num">{php(own.house.php)}</span>
            <span className="bubble-l">{noted
              ? t(`for ${place}’s own ${own.house.rows} projects, in the House bill`, `para sa sariling ${own.house.rows} proyekto ng ${place}, sa House bill`)
              : t(`for ${all.rows} projects in ${place}, in the House bill`, `para sa ${all.rows} proyekto sa ${place}, sa House bill`)}</span>
          </span>
          {diff !== 0 && (
            <span className="bubble bubble-up">
              <span className="bubble-v num">{phpDelta(diff)}</span>
              <span className="bubble-l">{diff > 0 ? t(`more than the President’s NEP (${php(own.nep.php)})`, `higit sa NEP ng Pangulo (${php(own.nep.php)})`) : t(`less than the President’s NEP (${php(own.nep.php)})`, `kulang sa NEP ng Pangulo (${php(own.nep.php)})`)}</span>
            </span>
          )}
          {noted && (
            <a href="#ch-how-much" className="bubble bubble-why">
              <span className="bubble-l">{lineParts(noted.title) > 1
                ? t(`Plus ${lineAmount} in one line for ${lineParts(noted.title)} projects across the country, which makes ${php(all.house.php)}.`, `Dagdag pa ang ${lineAmount} sa iisang linya para sa ${lineParts(noted.title)} proyekto sa buong bansa, kaya ${php(all.house.php)}.`)
                : t(`Plus ${lineAmount} in one line with a note, which makes ${php(all.house.php)}.`, `Dagdag pa ang ${lineAmount} sa isang linyang may paalala, kaya ${php(all.house.php)}.`)}</span>
              <span className="bubble-why-cta">{t('Why is it here? →', 'Bakit ito narito? →')}</span>
            </a>
          )}
        </div>
        {img && <p className="photo-band-credit">{img.creditUrl ? <a href={img.creditUrl} target="_blank" rel="noopener">{img.credit}</a> : img.credit}</p>}
      </section>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Chapter 1: where the budget is in its journey
// ---------------------------------------------------------------------------

function Journey() {
  const { t } = useLang();
  const steps = [
    { done: true, title: 'NEP', sub: t('The President proposes', 'Panukala ng Pangulo') },
    { done: true, latest: true, title: 'House bill', sub: t('The House approves its version (HB 10858)', 'Inaprubahan ng Kamara ang bersyon nito (HB 10858)') },
    { done: false, title: t('Senate', 'Senado'), sub: t('The Senate writes its own version', 'Gumagawa ang Senado ng sariling bersyon') },
    { done: false, title: 'Bicameral', sub: t('Both houses agree on one text', 'Nagkakasundo ang dalawang kapulungan') },
    { done: false, title: t('Law (GAA)', 'Batas (GAA)'), sub: t('The President signs it', 'Pinipirmahan ng Pangulo') },
  ];
  return (
    <>
      <ol className="journey">
        {steps.map((st, i) => (
          <li key={i} className={`${st.done ? 'done' : 'next'}${st.latest ? ' latest' : ''}`}>
            <span className="journey-dot" aria-hidden="true">{st.done ? '✓' : i + 1}</span>
            <strong>{st.title}</strong>
            <span>{st.sub}</span>
            {st.latest && <span className="journey-tag">{t('We are here in this data', 'Narito tayo sa datos')}</span>}
          </li>
        ))}
      </ol>
      <p className="fine">{t('This site’s data goes up to the House bill; the later steps are not in it yet.', 'Hanggang House bill ang datos ng site na ito; wala pa rito ang mga susunod na hakbang.')}</p>
    </>
  );
}

// ---------------------------------------------------------------------------
// Chapter 2: the two versions as two bubbles (area by amount; side by side, never added)
// ---------------------------------------------------------------------------

function Bubbles({ own, all, noted }: { own: Summary; all: Summary; noted: ScopedProject | null }) {
  const { config } = usePortal();
  const { t, n } = useLang();
  const place = shortNameOf(config);
  const max = Math.max(all.nep.php, all.house.php, 1);
  const size = (v: number) => `${Math.round(Math.sqrt(v / max) * 100)}%`;
  const diff = own.house.php - own.nep.php;
  const item = (key: 'nep' | 'house', label: string) => (
    <figure className="vs-item">
      <div className="vs-stage">
        {noted && <span className="vs-ring" style={{ width: size(all[key].php) }} />}
        <span className={`vs-circle vs-${key}`} style={{ width: size(own[key].php) }} />
      </div>
      <figcaption>
        <span className="vs-v num">{php(own[key].php)}</span>
        <span className="vs-l">{label}</span>
        <span className="vs-sub">{n(own[key].rows, 'project', 'proyekto')}{noted && <> · {t(`${php(all[key].php)} with the nationwide line`, `${php(all[key].php)} kasama ang linya sa buong bansa`)}</>}</span>
      </figcaption>
    </figure>
  );
  return (
    <div className="vs">
      {item('nep', `NEP · ${t('the President’s proposal', 'panukala ng Pangulo')}`)}
      <div className="vs-arrow" aria-hidden="true">
        <span className={`pill pill-delta ${diff > 0 ? 'up' : diff < 0 ? 'down' : 'zero'}`}>{phpDelta(diff)}</span>
        <span className="vs-arrow-line">→</span>
      </div>
      {item('house', `House bill · ${t('the House’s version', 'bersyon ng Kamara')}`)}
      {noted && (
        <p className="vs-key">
          <span><i className="vs-key-solid" aria-hidden="true" />{t(`${place}’s own projects`, `Sariling proyekto ng ${place}`)}</span>
          <span><i className="vs-key-ring" aria-hidden="true" />{t('with the nationwide line', 'kasama ang linya sa buong bansa')}</span>
        </p>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Chapter 3: the changes in three big numbers, then every project as a square
// ---------------------------------------------------------------------------

function Changes({ s }: { s: Summary }) {
  const { t, n } = useLang();
  const items = [
    { cls: 'house_only', v: php(s.groups.house_only.house_php), l: t(`in ${n(s.groups.house_only.rows, 'project', 'proyekto')} found only in the House bill`, `sa ${n(s.groups.house_only.rows, 'project', 'proyekto')} na nasa House bill lang`), to: '/projects?status=house_only', show: s.groups.house_only.rows > 0 },
    { cls: 'increased', v: phpDelta(s.groups.increased.house_php - s.groups.increased.nep_php), l: t(`on ${n(s.groups.increased.rows, 'project', 'proyekto')} the House raised`, `sa ${n(s.groups.increased.rows, 'project', 'proyekto')} na itinaas ng Kamara`), to: '/projects?status=increased', show: s.groups.increased.rows > 0 },
    { cls: 'decreased', v: phpDelta(s.groups.decreased.house_php - s.groups.decreased.nep_php), l: t(`on ${n(s.groups.decreased.rows, 'project', 'proyekto')} the House cut`, `sa ${n(s.groups.decreased.rows, 'project', 'proyekto')} na binawasan ng Kamara`), to: '/projects?status=decreased', show: s.groups.decreased.rows > 0 },
    { cls: 'nep_only', v: php(s.groups.nep_only.nep_php), l: t(`in ${n(s.groups.nep_only.rows, 'project', 'proyekto')} found only in the NEP`, `sa ${n(s.groups.nep_only.rows, 'project', 'proyekto')} na nasa NEP lang`), to: '/projects?status=nep_only', show: s.groups.nep_only.rows > 0 },
  ].filter((x) => x.show);
  return (
    <ul className="changes">
      {items.map((x) => (
        <li key={x.cls}>
          <Link to={x.to} className={`change change-${x.cls}`}>
            <span className="change-v num">{x.v}</span>
            <span className="change-l">{x.l}</span>
          </Link>
        </li>
      ))}
    </ul>
  );
}

function AtAGlance({ rows }: { rows: readonly ScopedProject[] }) {
  const { overview } = usePortal();
  const { t, lang } = useLang();
  const datasets = overview.status === 'ready' ? overview.value.data.datasets : NO_DATASETS;
  const words = groupInfo(datasets, rows);
  const order = (g: BridgeGroup) => BRIDGE_GROUPS.indexOf(g);
  const sorted = [...rows].sort((a, b) => order(a.bridge_group) - order(b.bridge_group) || (b.house_php ?? b.nep_php ?? 0) - (a.house_php ?? a.nep_php ?? 0));
  const counts = BRIDGE_GROUPS.map((g) => ({ g, c: rows.filter((r) => r.bridge_group === g).length })).filter((x) => x.c);
  return (
    <div className="glance">
      <p className="glance-h">{t(`All ${rows.length} projects, one square each. Tap one to open it.`, `Lahat ng ${rows.length} proyekto, tig-isang parisukat. I-tap para buksan.`)}</p>
      <div className="waffle" role="list">
        {sorted.map((p) => (
          <Link key={p.key} role="listitem" to={projectHref(p)} className={`waffle-cell g-${p.bridge_group}${p.note ? ' noted' : ''}`} title={`${p.title.slice(0, 120)} · ${php(p.house_php ?? p.nep_php)} · ${p.status_label}`} aria-label={`${p.title.slice(0, 120)}: ${p.status_label}, ${php(p.house_php ?? p.nep_php)}`} />
        ))}
      </div>
      <ul className="waffle-legend">
        {counts.map(({ g, c }) => (
          <li key={g}>
            <Link to={`/projects?status=${g}`}>
              <span className={`waffle-key g-${g}`} aria-hidden="true" />
              <strong className="num">{c}</strong> {words[g].label}
              {lang === 'fil' && <span className="muted">{STATUS_FIL[g]}</span>}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Chapter 4: the biggest projects, with the photo of the barangay each names
// ---------------------------------------------------------------------------

function Biggest({ rows }: { rows: readonly ScopedProject[] }) {
  const { config } = usePortal();
  const { t } = useLang();
  const barangays = config.barangays ?? NO_BARANGAYS;
  const skipped = rows.some((r) => r.note?.headline);
  const top = rows
    .filter((r) => !r.note?.headline)
    .sort((a, b) => (b.house_php ?? b.nep_php ?? 0) - (a.house_php ?? a.nep_php ?? 0))
    .slice(0, 6);
  return (
    <div className="biggest">
      <h3 className="sub-h">{t('The 6 biggest projects', 'Ang 6 na pinakamalaking proyekto')}{skipped && <span className="muted"> · {t('not counting the line noted in chapter 2', 'hindi kasama ang linyang may paalala sa kabanata 2')}</span>}</h3>
      <ul className="big-grid">
        {top.map((p, i) => {
          const named = barangaysOf(p.title, barangays);
          const photo = named.map((b) => barangays.find((x) => x.name === b)?.image).find(Boolean);
          const kind = kindOf(p);
          return (
            <li key={p.key}>
              <Link to={projectHref(p)} className="big-card">
                <span className={`big-photo${photo ? '' : ' none'}`}>
                  {photo ? <img src={photo.src} alt="" loading="lazy" /> : <Icon name={KIND_ICON[kind]} size={44} />}
                  <span className="big-rank">#{i + 1}</span>
                  <span className="big-amount num">{php(p.house_php ?? p.nep_php)}</span>
                </span>
                <span className="big-body">
                  <span className="big-kind"><Icon name={KIND_ICON[kind]} size={15} />{kindLabel(kind, t)}{named.length > 0 && <> · {named.join(', ')}</>}</span>
                  <span className="big-title">{p.title.length > 110 ? p.title.slice(0, 110) + '…' : p.title}</span>
                  <StatusChip group={p.bridge_group} label={p.status_label} held={p.held} />
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
      <p className="hero-cta"><Link to="/projects" className="button"><Icon name="list" size={18} />{t(`All ${rows.length} projects`, `Lahat ng ${rows.length} proyekto`)}</Link></p>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Chapter 5: the barangays
// ---------------------------------------------------------------------------

function Barangays({ rows }: { rows: readonly ScopedProject[] }) {
  const { config } = usePortal();
  const { t, n } = useLang();
  const barangays = config.barangays ?? NO_BARANGAYS;
  const brgy = useMemo(() => byBarangay(rows, barangays), [rows, barangays]);
  if (!barangays.length) return null;
  return (
    <>
      <ul className="brgy-grid">
        {barangays.map((b) => {
          const g = brgy.groups.find((x) => x.label === b.name);
          return (
            <li key={b.name}>
              <Link to={`/barangay/${slug(b.name)}`} className={`brgy-card${g ? '' : ' empty'}`}>
                <span className={`brgy-photo${b.image ? '' : ' none'}`}>
                  {b.image ? <img src={b.image.src} alt="" loading="lazy" title={b.image.credit} /> : <span className="brgy-nophoto"><Icon name="pin" size={22} />{t('No photo yet', 'Wala pang litrato')}</span>}
                  <span className="brgy-name">{b.name}</span>
                </span>
                <span className="brgy-body">
                  <span className="brgy-n num">{g ? n(g.rows.length, 'project', 'proyekto') : t('none named', 'walang nakapangalan')}</span>
                  {g && <span className="brgy-php num">{php(g.summary.house.php)} <span className="muted">House bill</span></span>}
                </span>
              </Link>
            </li>
          );
        })}
        <li>
          <Link to="/projects?brgy=none" className="brgy-card other">
            <span className="brgy-photo none">
              <span className="brgy-nophoto"><Icon name="list" size={22} /></span>
              <span className="brgy-name">{t('No barangay in the title', 'Walang barangay sa pamagat')}</span>
            </span>
            <span className="brgy-body">
              <span className="brgy-n num">{n(brgy.unnamed.rows.length, 'project', 'proyekto')}</span>
            </span>
          </Link>
        </li>
      </ul>
      <BarangayCredits />
    </>
  );
}

/** Credits for the barangay photos (CC BY-SA asks for them), and a call for any missing ones. */
function BarangayCredits() {
  const { config } = usePortal();
  const { t } = useLang();
  const list = (config.barangays ?? []).filter((b) => b.image);
  const missing = (config.barangays ?? []).filter((b) => !b.image).map((b) => b.name);
  if (!list.length) return null;
  return (
    <p className="fine photo-credits">
      {t('Photos', 'Mga litrato')}:{' '}
      {list.map((b, i) => (
        <span key={b.name}>
          {i > 0 && '; '}
          {b.name}: {b.image!.creditUrl ? <a href={b.image!.creditUrl} target="_blank" rel="noopener">{b.image!.credit}</a> : b.image!.credit}
        </span>
      ))}
      .
      {missing.length > 0 && config.operator.email && (
        <> {t(`Have a photo of ${missing.join(' or ')} you took yourself?`, `May sarili kang litrato ng ${missing.join(' o ')}?`)} <a href={`mailto:${config.operator.email}`}>{t('Send it to us', 'Ipadala sa amin')}</a>.</>
      )}
    </p>
  );
}

// ---------------------------------------------------------------------------
// Chapter 2: the noted line, explained (why it is here, what it is, how much is ours)
// ---------------------------------------------------------------------------

/** `note` is the maintainer's note on the line; the spotlight explains it, so the note itself is shown on the line's own page. */
function Spotlight({ p }: { note: LineNote; p: ScopedProject }) {
  const { config } = usePortal();
  const { t } = useLang();
  const place = shortNameOf(config);
  const terms = (config.scope.places ?? []).map((x) => fold(x.q ?? x.label));
  // The line's title lists its projects, separated by semicolons, as published.
  const parts = splitLine(p.title);
  const ours = parts.filter((x) => terms.some((q) => fold(x).includes(q)));
  const amount = php(p.house_php ?? p.nep_php);
  return (
    <aside className="spot" aria-labelledby="spot-h">
      <div className="spot-head">
        <span className="spot-amount num">{amount}</span>
        <div>
          <p className="spot-kicker">{t('One line, explained', 'Isang linya, ipinaliwanag')}</p>
          <h3 id="spot-h" className="spot-h">{t(`Why is a ${amount} line here, for ${parts.length > 1 ? `${parts.length} projects across the country` : 'more than one place'}?`, `Bakit may ${amount} na linya rito, para sa ${parts.length > 1 ? `${parts.length} proyekto sa buong bansa` : 'higit sa isang lugar'}?`)}</h3>
        </div>
      </div>
      <ol className="spot-qa">
        <li>
          <strong>{t('Why it is here', 'Bakit ito narito')}</strong>
          <span>{ours.length ? t(`Its title names “${ours.join('”, “')}”, and this site lists every line whose title names ${place}.`, `Binabanggit ng pamagat nito ang “${ours.join('”, “')}”, at inililista ng site na ito ang bawat linyang bumabanggit sa ${place}.`) : t(`Its title names ${place}.`, `Binabanggit ng pamagat nito ang ${place}.`)}</span>
        </li>
        <li>
          <strong>{t('What it is', 'Ano ito')}</strong>
          <span>{t(`One ${p.office ? `DPWH ${p.office} ` : ''}line${p.pap ? `: ${p.pap}` : ''}.`, `Iisang linya${p.office ? ` ng DPWH ${p.office}` : ''}${p.pap ? `: ${p.pap}` : ''}.`)}</span>
        </li>
        <li>
          <strong>{t(`How much is for ${place}?`, `Magkano ang para sa ${place}?`)}</strong>
          <span>{t(`The documents do not say. The ${amount} is for all of them together, so most of it is not for ${place}.`, `Hindi sinasabi ng mga dokumento. Ang ${amount} ay para sa lahat ng ito, kaya karamihan ay hindi para sa ${place}.`)}</span>
        </li>
      </ol>
      {parts.length > 1 && (
        <ul className="spot-parts" aria-label={t('The projects in this one line', 'Ang mga proyekto sa iisang linyang ito')}>
          {parts.map((x) => <li key={x} className={ours.includes(x) ? 'ours' : undefined}>{x}</li>)}
        </ul>
      )}
      <p className="spot-more"><Link to={projectHref(p)}>{t('See the line and its page in the documents →', 'Tingnan ang linya at ang pahina nito sa mga dokumento →')}</Link></p>
    </aside>
  );
}

/** A line's title split into the projects it lists (semicolon-separated, as published). */
function splitLine(title: string): string[] {
  return title.split(';').map((x) => x.trim()).filter((x) => x && !/^and such other/i.test(x));
}
const lineParts = (title: string) => splitLine(title).length;

// ---------------------------------------------------------------------------
// Chapter 4: how the place's own House bill money splits by kind of work
// ---------------------------------------------------------------------------

function MoneySplit({ rows }: { rows: readonly ScopedProject[] }) {
  const { config } = usePortal();
  const { t, n } = useLang();
  const place = shortNameOf(config);
  const s = summarise(rows);
  const groups = byKind(rows).filter((g) => g.summary.house.php > 0).sort((a, b) => b.summary.house.php - a.summary.house.php);
  const health = groups.find((g) => g.kind === 'health');
  if (!s.house.php) return null;
  return (
    <figure className="split">
      <figcaption className="split-h">{t(`How ${place}’s own ${php(s.house.php)} in the House bill splits`, `Paano nahahati ang sariling ${php(s.house.php)} ng ${place} sa House bill`)}</figcaption>
      <div className="split-bar" role="img" aria-label={groups.map((g) => `${kindLabel(g.kind, t)}: ${php(g.summary.house.php)}`).join(', ')}>
        {groups.map((g) => (
          <span key={g.kind} className={`split-part k-${g.kind}`} style={{ flexGrow: g.summary.house.php }} title={`${kindLabel(g.kind, t)}: ${php(g.summary.house.php)}`}>
            {g.summary.house.php / s.house.php >= 0.12 && <Icon name={KIND_ICON[g.kind]} size={18} />}
          </span>
        ))}
      </div>
      <ul className="split-legend">
        {groups.map((g) => (
          <li key={g.kind}>
            <span className={`split-key k-${g.kind}`} aria-hidden="true" />
            <strong>{kindLabel(g.kind, t)}</strong>
            <span className="num">{php(g.summary.house.php)}</span>
            <span className="muted">{n(g.rows.length, 'project', 'proyekto')}</span>
          </li>
        ))}
      </ul>
      {health && (
        <p className="fine">{t('About health: these documents list only the health facilities program project by project. Most health spending (hospitals’ operations, medicines, PhilHealth) is not broken down by city here.', 'Tungkol sa kalusugan: ang programa lang ng mga pasilidad pangkalusugan ang nakalista nang isa-isa sa mga dokumentong ito. Ang karamihan ng gastos sa kalusugan (operasyon ng ospital, gamot, PhilHealth) ay hindi hinahati ayon sa lungsod dito.')}</p>
      )}
    </figure>
  );
}
