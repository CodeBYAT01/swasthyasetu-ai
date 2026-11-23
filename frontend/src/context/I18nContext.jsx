import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { translations } from '../utils/i18n/translations';
import { LANGUAGES } from '../utils/constants';

const I18nContext = createContext(null);
const STORAGE_KEY = 'swasthyasetu.language';

export function I18nProvider({ children }) {
  const [language, setLanguageState] = useState(() => localStorage.getItem(STORAGE_KEY) || 'en');

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, language);
    document.documentElement.lang = language;
  }, [language]);

  const value = useMemo(() => ({
    language,
    languages: LANGUAGES,
    setLanguage: setLanguageState,
    t: (key, fallback) => translations[language]?.[key] || translations.en[key] || fallback || key,
  }), [language]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const context = useContext(I18nContext);
  if (!context) throw new Error('useI18n must be used inside I18nProvider');
  return context;
}
