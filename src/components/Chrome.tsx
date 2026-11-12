import { useEffect, useRef, useState, type ReactNode } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { KIND_LABELS, taglineOf, type PortalKind } from '../config';
import { usePortal } from '../lib/portal-context';
import { useLang } from '../lib/lang';
import { date } from '../lib/format';
import { NATIONAL_URL, SOURCE_CODE_URL } from '../lib/links';
import { BrandMark } from './Brand';
import { Icon } from './Icons';
import ThemeToggle from './ThemeToggle';

const BETTERGOV_LOGO = '/brand/bettergov-horizontal-primary.png';
const BETTERGOV_LOGO_WHITE = '/brand/bettergov-horizontal-white.png';

const KIND_FIL: Record<PortalKind, string> = {
  deo: 'Opisina ng distrito ng DPWH',
  province: 'Lalawigan',
  city: 'Lungsod',
  municipality: 'Bayan',
};

export function Masthead() {
  const { config, client } = usePortal();
  const { t, lang, languages, setLang } = useLang();
  const { pathname } = useLocation();
  const nav = [
    { to: '/', icon: 'pin' as const, label: t('Overview', 'Buod') },
    { to: '/analysis', icon: 'chart' as const, label: t('The numbers', 'Sa mga numero') },
    { to: '/projects', icon: 'list' as const, label: t('All projects', 'Lahat ng proyekto') },
    { to: '/gaa', icon: 'compare' as const, label: t('Budgets 2020–2026', 'Badyet 2020–2026') },
    { to: '/about', icon: 'doc' as const, label: t('About', 'Tungkol dito') },
  ];
  // On a phone the nav scrolls sideways; bring the current page's pill into view.
  // Once the masthead scrolls away, the pinned nav carries a small logo.
  const head = useRef<HTMLElement>(null);
  const [stuck, setStuck] = useState(false);
  useEffect(() => {
    const el = head.current;
    if (!el || !('IntersectionObserver' in window)) return;
    const io = new IntersectionObserver(([e]) => setStuck(!e.isIntersecting), { threshold: 0 });
    io.observe(el);
    return () => io.disconnect();
  }, []);
  useEffect(() => {
    document.querySelector('.subnav a.active')?.scrollIntoView({ block: 'nearest', inline: 'center' });
  }, [pathname]);
  const isActive = (to: string) => (to === '/' ? pathname === '/' || pathname.startsWith('/barangay/') : pathname.startsWith(to) && !(to === '/projects' && /^\/projects\/[^/]+\//.test(pathname)));
  return (
    <>
      {config.buildYourOwnStrip !== false && (
        // Above the masthead, so it scrolls away; a plain link to the source.
        <a className="build-strip" href={SOURCE_CODE_URL} target="_blank" rel="noopener">
          <span className="build-strip-title">{t('Create your own transparency portal', 'Gumawa ng sariling transparency portal')}</span>
          <span className="build-strip-url">
            {SOURCE_CODE_URL.replace(/^https:\/\//, '')} <span aria-hidden="true">→</span>
          </span>
        </a>
      )}
      <header className="masthead" ref={head}>
        <div className="page masthead-main">
          <Link to="/" className="masthead-title">
            {config.logo ? <img src={config.logo} alt="" className="masthead-logo" /> : <BrandMark size={56} />}
            <span>
              <span className="masthead-name">{config.name}</span>
              <span className="masthead-tagline">
                {taglineOf(config, lang) ?? <>{lang === 'fil' ? KIND_FIL[config.kind] : KIND_LABELS[config.kind]} · {t('Budgets 2020–2027', 'Badyet 2020–2027')}</>}
              </span>
            </span>
          </Link>
          <div className="masthead-side">
            {languages.length > 1 && (
              <div className="lang" role="group" aria-label={t('Language', 'Wika')}>
                {languages.map((l) => (
                  <button key={l} type="button" className={l === lang ? 'on' : undefined} aria-pressed={l === lang} onClick={() => setLang(l)} lang={l}>
                    {l === 'en' ? 'EN' : 'FIL'}
                  </button>
                ))}
              </div>
            )}
            <ThemeToggle />
            <a className="masthead-with data-from" href="https://bettergov.ph" target="_blank" rel="noopener">
              <span className="label">{t('Data from', 'Datos mula sa')}</span>
              {/* BetterGov's own white logo on dark paper; the colour one on light. */}
              <img className="logo-on-light" src={BETTERGOV_LOGO} alt="BetterGov.ph" width="128" height="28" />
              <img className="logo-on-dark" src={BETTERGOV_LOGO_WHITE} alt="BetterGov.ph" width="128" height="28" />
            </a>
          </div>
        </div>
      </header>
      {/* Outside the header, so it can stay pinned while the page scrolls. */}
      <nav className={`subnav${stuck ? ' stuck' : ''}`} aria-label={t('Sections', 'Mga bahagi')}>
        <div className="page">
          <div className="subnav-inner">
            <Link to="/" className="subnav-brand" aria-hidden={!stuck} tabIndex={stuck ? 0 : -1} onClick={() => window.scrollTo({ top: 0 })}>
              <BrandMark size={30} />
              <span>{config.name}</span>
            </Link>
            {nav.map((n) => {
              const active = isActive(n.to);
              return (
                <Link key={n.to} to={n.to} className={active ? 'active' : undefined} aria-current={active ? 'page' : undefined}>
                  <Icon name={n.icon} size={16} />
                  {n.label}
                </Link>
              );
            })}
            <a className="subnav-ext" href={`${client.base}/docs`} target="_blank" rel="noopener">API ↗</a>
          </div>
        </div>
      </nav>
    </>
  );
}

export function Footer() {
  const { config, scope, client } = usePortal();
  const { t } = useLang();
  const meta = scope.status === 'ready' ? scope.value.meta : null;
  return (
    <footer className="footer">
      <div className="page footer-inner">
        <div className="footer-top">
          <div className="footer-brand">
            <BrandMark size={32} />
            <p>
              <strong>{config.name}</strong>, {t('run by', 'pinatatakbo ng')}{' '}
              {config.operator.url ? (
                <a href={config.operator.url} target="_blank" rel="noopener">{config.operator.name}</a>
              ) : (
                config.operator.name
              )}
              {config.operator.email && (
                <> · <a href={`mailto:${config.operator.email}`}>{config.operator.email}</a></>
              )}
            </p>
          </div>
          <a className="data-from footer-data" href="https://bettergov.ph" target="_blank" rel="noopener">
            <span className="label">{t('Data from', 'Datos mula sa')}</span>
            <img className="logo-on-light" src={BETTERGOV_LOGO} alt="BetterGov.ph" width="128" height="28" />
            <img className="logo-on-dark" src={BETTERGOV_LOGO_WHITE} alt="BetterGov.ph" width="128" height="28" />
            <span className="data-from-go" aria-hidden="true">↗</span>
          </a>
        </div>
        <ul className="footer-links">
          <li>
            <span className="label">{t('Every project, nationwide', 'Lahat ng proyekto sa buong bansa')}</span>
            <a href={NATIONAL_URL} target="_blank" rel="noopener">budget.bettergov.ph ↗</a>
          </li>
          <li>
            <span className="label">{t('Data', 'Datos')}</span>
            <a href={`${client.base}/docs`} target="_blank" rel="noopener">Budget API and MCP ↗</a>
          </li>
          <li>
            <span className="label">Open source</span>
            <a href={SOURCE_CODE_URL} target="_blank" rel="noopener">{t("Built on BetterGov.ph's Transparency Portal; fork it for your LGU or DPWH office ↗", 'Gawa sa Transparency Portal ng BetterGov.ph; gamitin ito para sa inyong LGU o opisina ng DPWH ↗')}</a>
          </li>
        </ul>
        <p className="footer-source">
          {t('Source', 'Pinagkunan')}: NEP FY 2027 {t('and', 'at')} House Bill 10858 · {t('via the BetterGov.ph Budget API', 'sa pamamagitan ng BetterGov.ph Budget API')}
          {meta && <> · {t('data built', 'petsa ng datos')} {date(meta.built_at)}</>}
        </p>
        {meta && <p className="footer-notice">{meta.notice}</p>}
      </div>
    </footer>
  );
}

export function PageHead({ eyebrow, title, children }: { eyebrow: ReactNode; title: ReactNode; children?: ReactNode }) {
  return (
    <div className="page-head">
      <p className="eyebrow">{eyebrow}</p>
      <h1>{title}</h1>
      {children && <div className="lede">{children}</div>}
    </div>
  );
}
