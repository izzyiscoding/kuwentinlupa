import { useEffect, useMemo, useState, type ReactNode } from 'react';
import type { Language } from '../config';
import { LangContext, makeLang } from '../lib/lang';
import { usePortal } from '../lib/portal-context';

const KEY = 'portal-lang';

// Storage can be missing or blocked (private windows, previews): the default language still works.
function stored(): string | null {
  try {
    return localStorage.getItem(KEY);
  } catch {
    return null;
  }
}

export default function LanguageProvider({ children }: { children: ReactNode }) {
  const { config } = usePortal();
  const languages: Language[] = config.languages?.length ? config.languages : ['en'];
  const [lang, setLangState] = useState<Language>(() => {
    const s = stored();
    return languages.includes(s as Language) ? (s as Language) : languages[0];
  });

  useEffect(() => {
    document.documentElement.lang = lang === 'fil' ? 'fil' : 'en';
  }, [lang]);

  const value = useMemo(
    () =>
      makeLang(lang, languages, (l) => {
        setLangState(l);
        try {
          localStorage.setItem(KEY, l);
        } catch {
          /* the choice lasts for this visit only */
        }
      }),
    // languages comes from the static config
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [lang],
  );
  return <LangContext.Provider value={value}>{children}</LangContext.Provider>;
}
