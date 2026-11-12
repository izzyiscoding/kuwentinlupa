/**
 * English and Filipino. Every string the portal writes itself is given in
 * both, side by side where it is used: `t('Every project', 'Lahat ng proyekto')`.
 * TypeScript requires both, so neither language can fall behind.
 *
 * What the API writes (disclaimers, notices, status labels, program, office
 * and project names) is printed as published, in English, in both languages.
 */
import { createContext, useContext } from 'react';
import type { Language } from '../config';
import { count } from './format';

export interface Lang {
  lang: Language;
  /** Languages offered; the toggle shows only when there are two. */
  languages: readonly Language[];
  setLang(l: Language): void;
  t(en: string, fil: string): string;
  /** "36 projects" / "36 proyekto": Filipino nouns do not change for the plural. */
  n(n: number, en: string, fil: string, enMany?: string): string;
}

export function makeLang(lang: Language, languages: readonly Language[], setLang: (l: Language) => void): Lang {
  const fil = lang === 'fil';
  return {
    lang,
    languages,
    setLang,
    t: (en, f) => (fil ? f : en),
    n: (n, en, f, enMany = en + 's') => `${count(n)} ${fil ? f : n === 1 ? en : enMany}`,
  };
}

export const LangContext = createContext<Lang>(makeLang('en', ['en'], () => {}));

export const useLang = () => useContext(LangContext);
