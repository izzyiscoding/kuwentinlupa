/**
 * /analysis: the numbers, as charts. Every chart is the portal's own lines,
 * counted or summed per version; nothing here is computed that the API does
 * not publish, and the NEP and the House bill are never added.
 */
import { useEffect, useMemo } from 'react';
import { Link, useLocation } from 'react-router-dom';
import type { Disclaimer } from '../api/types';
import { BRIDGE_GROUPS } from '../api/types';
import { shortNameOf } from '../config';
import { Await, Disclaimers, HowToRead } from '../components/Bits';
import { BarangayChart, EnactedChart, ProgramChart, StatusChart, TopChart } from '../components/BudgetCharts';
import { ChartCard } from '../components/charts';
import { Icon } from '../components/Icons';
import OfficesSection from '../components/OfficesSection';
import { NO_BARANGAYS, NO_DATASETS, projectHref } from '../lib/words';
import { barangaysOf } from '../lib/barangay';
import { php, phpDelta } from '../lib/format';
import { useLang } from '../lib/lang';
import { usePortal } from '../lib/portal-context';
import { summarise, type ScopeResult, type ScopedProject } from '../lib/scope';
import { useTitle } from '../lib/use-title';

export default function Analysis() {
  const { scope, config } = usePortal();
  const { t } = useLang();
  useTitle(`${t('The numbers', 'Sa mga numero')} · ${config.name}`);
  return (
    <main className="page main">
      <Await state={scope} what={t('projects', 'mga proyekto')}>
        {(s) => <Numbers scope={s} />}
      </Await>
    </main>
  );
}

function Numbers({ scope }: { scope: ScopeResult }) {
  const { config, overview, districts } = usePortal();
  const { t } = useLang();
  const { hash } = useLocation();
  const datasets = overview.status === 'ready' ? overview.value.data.datasets : NO_DATASETS;
  const rows = scope.projects;
  const name = shortNameOf(config);
  const placeList = (config.scope.places ?? []).map((p) => p.q ?? p.label).join(', ');
  const candidates = rows.filter((r) => r.bridge_group === 'house_only').sort((a, b) => (b.house_php ?? 0) - (a.house_php ?? 0));

  useEffect(() => {
    if (hash) document.getElementById(decodeURIComponent(hash.slice(1)))?.scrollIntoView({ block: 'start' });
  }, [hash, districts.status]);

  const disclaimers = useMemo(() => {
    const byId = new Map<string, Disclaimer>(scope.disclaimers.map((d) => [d.id, d]));
    if (districts.status === 'ready') for (const env of districts.value) for (const d of env.disclaimers) if (!byId.has(d.id)) byId.set(d.id, d);
    return [...byId.values()];
  }, [scope.disclaimers, districts]);

  return (
    <>
      <div className="page-head">
        <p className="eyebrow">{t('The numbers', 'Sa mga numero')} · FY 2027</p>
        <h1>{t(`${name}’s 2027 budget in charts`, `Ang badyet ng ${name} sa 2027, sa mga tsart`)}</h1>
      </div>

      <Dashboard rows={rows} />
      <HowToRead>
        <p>{t('The NEP is the budget the President proposes; the House bill is the House of Representatives’ version. They are two versions of one budget, so their totals are compared, never added.', 'Ang NEP ay ang badyet na iminumungkahi ng Pangulo; ang House bill ay ang bersyon ng Kamara. Dalawang bersyon ito ng iisang badyet, kaya pinaghahambing ang kabuuan, hindi pinagsasama.')}</p>
        <p>{t('“Matched lines changed by” covers only lines found in both versions whose amount went up or down.', 'Ang “nabagong halaga” ay para lang sa mga linyang nasa dalawang bersyon at tumaas o bumaba ang halaga.')}</p>
      </HowToRead>

      <div className="card-grid two">
        <ChartCard id="status" wide title={t('What the House bill did to each project', 'Ano ang ginawa ng House bill sa bawat proyekto')} lede={t('Tap a bar to see those projects.', 'I-tap ang bar para makita ang mga proyekto.')}>
          <StatusChart rows={rows} datasets={datasets} />
        </ChartCard>

        <ChartCard id="program" wide title={t('By type of work', 'Ayon sa uri ng gawain')} lede={t('The program each line is under, as published.', 'Ang programang kinabibilangan ng bawat linya, gaya ng pagkakalathala.')}>
          <ProgramChart rows={rows} />
        </ChartCard>

        {(config.barangays?.length ?? 0) > 0 && (
          <ChartCard id="barangay" wide title={t('By barangay', 'Ayon sa barangay')} lede={t('A project naming two barangays counts in both, so these are not added up.', 'Ang proyektong may dalawang barangay ay nasa dalawa, kaya hindi ito pinagsasama.')}>
            <BarangayChart rows={rows} />
          </ChartCard>
        )}

        <ChartCard id="top" wide title={t('The 10 biggest projects', 'Ang 10 pinakamalaking proyekto')}>
          <TopChart rows={rows} />
        </ChartCard>

        <ChartCard id="candidates" wide title={t(`${candidates.length} projects in the House bill only`, `${candidates.length} proyektong nasa House bill lang`)} lede={t('Candidates to check, not confirmed additions: some were renamed or moved.', 'Dapat suriin, hindi pa kumpirmadong dagdag: may mga pinalitan lang ng pangalan o inilipat.')}>
          <ul className="cand-grid">
            {candidates.map((r) => (
              <li key={r.key}>
                <Link to={projectHref(r)} className="cand">
                  <span className="cand-v num">{php(r.house_php)}</span>
                  <span className="cand-t">{r.title}</span>
                  <span className="cand-b">{barangaysOf(r.title, config.barangays ?? NO_BARANGAYS).join(' · ') || t('No barangay in the title', 'Walang barangay sa pamagat')}</span>
                </Link>
              </li>
            ))}
          </ul>
        </ChartCard>

        {(config.scope.places?.length ?? 0) > 0 && (
          <ChartCard id="years" wide title={t('Enacted budgets by year, 2020–2026', 'Mga naipasang badyet bawat taon, 2020–2026')} lede={t(`Programs whose name has “${placeList}”. Enacted means approved to spend, not spent.`, `Mga programang may “${placeList}” sa pangalan. Ang naipasa ay pahintulot gumastos, hindi pa nagastos.`)} more={{ to: '/gaa', label: t('Every program, year by year', 'Bawat programa, bawat taon') }}>
            <EnactedChart rows={rows} />
          </ChartCard>
        )}
      </div>

      <OfficesSection />

      <section className="section" aria-labelledby="how-h">
        <h2 id="how-h" className="section-h">{t('How to read a budget, in 3 steps', 'Paano basahin ang badyet, sa 3 hakbang')}</h2>
        <ol className="steps">
          <li>
            <Icon name="doc" size={26} />
            <strong>{t('The NEP comes first', 'Una ang NEP')}</strong>
            <span>{t('The President proposes the budget.', 'Ang Pangulo ang nagmumungkahi ng badyet.')}</span>
          </li>
          <li>
            <Icon name="compare" size={26} />
            <strong>{t('The House changes it', 'Binabago ito ng Kamara')}</strong>
            <span>{t('The House bill adds, cuts or keeps each line.', 'Nagdadagdag, nagbabawas o nagpapanatili ang House bill.')}</span>
          </li>
          <li>
            <Icon name="search" size={26} />
            <strong>{t('You check it', 'Ikaw ang sumusuri')}</strong>
            <span>{t('Every figure links to its page in the document.', 'Bawat numero ay may link sa pahina nito sa dokumento.')}</span>
          </li>
        </ol>
      </section>

      <Disclaimers items={disclaimers} />
    </>
  );
}

/**
 * The headline figures as one panel, each with a small picture: every
 * project as a dot (coloured by status), the two versions as bars on one
 * scale, and the raised and cut lines. Counts and per-version sums only.
 */
function Dashboard({ rows }: { rows: readonly ScopedProject[] }) {
  const { t, n } = useLang();
  const s = summarise(rows);
  // The place's own lines: all but the headline-noted ones (a nationwide line that only names it).
  const noted = rows.some((r) => r.note?.headline);
  const own = summarise(rows.filter((r) => !r.note?.headline));
  const max = Math.max(s.nep.php, s.house.php, 1);
  const order = (g: string) => BRIDGE_GROUPS.indexOf(g as (typeof BRIDGE_GROUPS)[number]);
  const dots = [...rows].sort((a, b) => order(a.bridge_group) - order(b.bridge_group));
  const up = s.groups.increased.house_php - s.groups.increased.nep_php;
  const down = s.groups.decreased.house_php - s.groups.decreased.nep_php;
  return (
    <section className="dash" aria-label={t('The figures', 'Ang mga numero')}>
      <div className="dash-cell">
        <p className="dash-l"><Icon name="list" size={15} />{t('Projects', 'Proyekto')}</p>
        <p className="dash-v num">{s.rows}</p>
        <div className="dash-dots" aria-hidden="true">{dots.map((r) => <span key={r.key} className={`g-${r.bridge_group}`} />)}</div>
        <p className="dash-sub">{t('one dot each, by what the House bill did', 'tig-isang tuldok, ayon sa ginawa ng House bill')}</p>
      </div>
      <div className="dash-cell dash-versions">
        <p className="dash-l"><Icon name="doc" size={15} />{t('The two versions', 'Ang dalawang bersyon')}</p>
        <div className="dash-ver">
          <span className="dash-ver-l">NEP</span>
          <span className="dash-ver-track">
            <span className="fill-nep" style={{ width: `${(own.nep.php / max) * 100}%` }} />
            {noted && <span className="dash-ghost" style={{ width: `${((s.nep.php - own.nep.php) / max) * 100}%` }} title={php(s.nep.php - own.nep.php)} />}
          </span>
          <span className="dash-ver-v num nep">{php(own.nep.php)}</span>
        </div>
        <div className="dash-ver">
          <span className="dash-ver-l">House</span>
          <span className="dash-ver-track">
            <span className="fill-house" style={{ width: `${(own.house.php / max) * 100}%` }} />
            {noted && <span className="dash-ghost" style={{ width: `${((s.house.php - own.house.php) / max) * 100}%` }} title={php(s.house.php - own.house.php)} />}
          </span>
          <span className="dash-ver-v num house">{php(own.house.php)}</span>
        </div>
        <p className="dash-sub">{noted
          ? t(`Own projects, solid; the faint end is the nationwide line (${php(s.nep.php)} and ${php(s.house.php)} with it) · compared, never added`, `Sariling proyekto, buo; ang malabong dulo ay ang linya sa buong bansa (${php(s.nep.php)} at ${php(s.house.php)} kasama ito) · pinaghahambing, hindi pinagsasama`)
          : t(`${n(s.nep.rows, 'project', 'proyekto')} in the NEP · ${n(s.house.rows, 'project', 'proyekto')} in the House bill · compared, never added`, `${n(s.nep.rows, 'project', 'proyekto')} sa NEP · ${n(s.house.rows, 'project', 'proyekto')} sa House bill · pinaghahambing, hindi pinagsasama`)}</p>
      </div>
      <div className="dash-cell">
        <p className="dash-l"><Icon name="search" size={15} />{t('Only in the House bill', 'Nasa House bill lang')}</p>
        <p className="dash-v num">{php(s.groups.house_only.house_php)}</p>
        <p className="dash-sub">{t(`${n(s.groups.house_only.rows, 'project', 'proyekto')}: leads to check`, `${n(s.groups.house_only.rows, 'project', 'proyekto')}: dapat suriin`)}</p>
      </div>
      <div className="dash-cell">
        <p className="dash-l"><Icon name="compare" size={15} />{t('Matched lines changed', 'Nabagong magkatugmang linya')}</p>
        <div className="dash-moves">
          <span className="dash-move up"><span aria-hidden="true">▲</span> {phpDelta(up)}<small>{n(s.groups.increased.rows, 'raised', 'tumaas', 'raised')}</small></span>
          <span className="dash-move down"><span aria-hidden="true">▼</span> {phpDelta(down)}<small>{n(s.groups.decreased.rows, 'cut', 'bumaba', 'cut')}</small></span>
        </div>
        <p className="dash-sub">{t('lines in both versions whose amount moved', 'mga linyang nasa dalawang bersyon na nagbago ang halaga')}</p>
      </div>
    </section>
  );
}
