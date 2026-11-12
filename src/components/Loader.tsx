/**
 * The loading screen: the mark with its bars counting, a message that
 * changes every couple of seconds, and a faint outline of the page to come.
 * `inline` is the small version, for a section loading inside a page.
 * Motion is dropped for readers who ask for less (see .loader in app.css).
 */
import { useEffect, useState } from 'react';
import { shortNameOf } from '../config';
import { useLang } from '../lib/lang';
import { usePortal } from '../lib/portal-context';

export default function Loader({ what, inline }: { what: string; inline?: boolean }) {
  const { config } = usePortal();
  const { t } = useLang();
  const place = shortNameOf(config);
  const messages = [
    t('Counting every peso…', 'Kinukuwenta ang bawat piso…'),
    t('Opening the budget documents…', 'Binubuksan ang mga dokumento ng badyet…'),
    t('Matching the NEP and the House bill…', 'Pinagtutugma ang NEP at House bill…'),
    t(`Finding ${place}’s projects…`, `Hinahanap ang mga proyekto ng ${place}…`),
  ];
  const [i, setI] = useState(0);
  useEffect(() => {
    if (inline || window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return;
    const id = window.setInterval(() => setI((n) => (n + 1) % messages.length), 1900);
    return () => window.clearInterval(id);
  }, [inline, messages.length]);

  if (inline) {
    return (
      <div className="loader-inline" role="status">
        <LoaderMark size={28} />
        <span>{t(`Loading ${what}…`, `Kinukuha ang ${what}…`)}</span>
      </div>
    );
  }

  return (
    <div className="loader" role="status" aria-live="polite">
      <div className="loader-center">
        <LoaderMark size={72} />
        <p className="loader-msg" key={i}>{messages[i]}</p>
        <p className="loader-sub">{t(`Loading ${what} from the BetterGov.ph Budget API`, `Kinukuha ang ${what} mula sa BetterGov.ph Budget API`)}</p>
      </div>
      <div className="loader-ghost" aria-hidden="true">
        <span className="ghost ghost-hero" />
        <span className="ghost ghost-line" />
        <span className="ghost ghost-line short" />
        <div className="ghost-row">
          <span className="ghost ghost-card" />
          <span className="ghost ghost-card" />
          <span className="ghost ghost-card" />
        </div>
      </div>
    </div>
  );
}

/** The brand mark with its three bars rising and falling, like a count going up. */
function LoaderMark({ size }: { size: number }) {
  return (
    <svg className="loader-mark" width={size} height={size} viewBox="0 0 40 40" aria-hidden="true">
      <rect width="40" height="40" rx="11" fill="var(--accent-fill)" />
      <rect className="lb lb1" x="8.3" y="13" width="3.4" height="15" rx="1.7" fill="#fff" />
      <rect className="lb lb2" x="15.3" y="9" width="3.4" height="19" rx="1.7" fill="#fff" />
      <rect className="lb lb3" x="22.3" y="16" width="3.4" height="12" rx="1.7" fill="#fff" />
      <path className="lw" d="M8 32c2.5 0 2.5-1.6 5-1.6s2.5 1.6 5 1.6 2.5-1.6 5-1.6 2.5 1.6 5 1.6 2.5-1.6 4-1.6" stroke="#a7f3d0" strokeWidth="1.8" fill="none" strokeLinecap="round" />
    </svg>
  );
}
