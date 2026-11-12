import { useEffect, useState } from 'react';
import { useLang } from '../lib/lang';
import { Icon } from './Icons';

type Theme = 'light' | 'dark';
const KEY = 'portal-theme';

/** Follows the device until the reader picks; the pick is remembered (index.html applies it before first paint). */
function initial(): Theme {
  const set = document.documentElement.dataset.theme;
  if (set === 'light' || set === 'dark') return set;
  return window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

export default function ThemeToggle() {
  const { t } = useLang();
  const [theme, setTheme] = useState<Theme>(initial);
  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', theme === 'dark' ? '#0e1613' : '#047857');
  }, [theme]);
  const next: Theme = theme === 'dark' ? 'light' : 'dark';
  return (
    <button
      type="button"
      className="icon-button"
      aria-label={next === 'dark' ? t('Switch to dark mode', 'Gawing madilim') : t('Switch to light mode', 'Gawing maliwanag')}
      title={next === 'dark' ? t('Dark mode', 'Madilim') : t('Light mode', 'Maliwanag')}
      onClick={() => {
        setTheme(next);
        try {
          localStorage.setItem(KEY, next);
        } catch {
          /* the choice lasts for this visit only */
        }
      }}
    >
      <Icon name={theme === 'dark' ? 'sun' : 'moon'} size={18} />
    </button>
  );
}
