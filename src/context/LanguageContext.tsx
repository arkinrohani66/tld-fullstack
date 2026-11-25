import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import { Language } from '../types';
import { APP_DICTIONARY, INLINE_DICTIONARY, TranslationDictionary } from '../i18n/dictionary';
import { translateString } from '../i18n/translations';

export type Translations = TranslationDictionary;
export { APP_DICTIONARY, INLINE_DICTIONARY };

export interface LanguageContextType {
  language: Language;
  direction: 'rtl' | 'ltr';
  dir: 'rtl' | 'ltr';
  t: Translations;
  dictionary: Record<Language, TranslationDictionary>;
  setLanguage: (lang: Language) => void;
  trText: (fa: string, en?: string, tr?: string) => string;
  getLabel: (key: keyof TranslationDictionary) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>(() => {
    try {
      const saved = localStorage.getItem('tld_language') as Language;
      if (saved === 'en' || saved === 'fa' || saved === 'tr') {
        return saved;
      }
    } catch {
      // fallback if localStorage is disabled
    }
    return 'fa';
  });

  const direction: 'rtl' | 'ltr' = language === 'fa' ? 'rtl' : 'ltr';

  useEffect(() => {
    try {
      document.documentElement.dir = direction;
      document.documentElement.lang = language;
      document.body.dir = direction;
      localStorage.setItem('tld_language', language);
    } catch (e) {
      console.warn('Could not persist language preference:', e);
    }

    if (typeof document !== 'undefined') {
      try {
        if (language === 'fa') {
          document.title = 'TLD - سامانه هوشمند مدیریت یکپارچه لجستیک حمل و نقل سنگین';
        } else if (language === 'en') {
          document.title = 'TLD - Intelligent Heavy Freight Logistics Platform';
        } else if (language === 'tr') {
          document.title = 'TLD - Akıllı Ağır Yük Lojistik Platformu';
        }
      } catch {}
    }
  }, [language, direction]);

  const setLanguage = useCallback((lang: Language) => {
    setLanguageState(lang);
  }, []);

  const t: Translations = useMemo(() => {
    return APP_DICTIONARY[language] || APP_DICTIONARY.fa;
  }, [language]);

  const getLabel = useCallback(
    (key: keyof TranslationDictionary): string => {
      const currentDict = APP_DICTIONARY[language] || APP_DICTIONARY.fa;
      return currentDict[key] ?? APP_DICTIONARY.fa[key] ?? '';
    },
    [language]
  );

  const trText = useCallback(
    (fa: string, en?: string, tr?: string): string => {
      if (language === 'fa') return fa;

      if (language === 'tr') {
        // زنجیره درست: ترکی صریح → دیکشنری خطی → موتور ترجمه ترکی →
        // انگلیسی (به‌عنوان جایگزین قابل‌قبول) → فارسی.
        // قبلاً در نبود ترجمه ترکی، مستقیم انگلیسی برگردانده می‌شد و همین باعث
        // می‌شد اکثر صفحات در حالت ترکی انگلیسی بمانند.
        if (tr) return tr;
        const inlineTr = INLINE_DICTIONARY[fa]?.tr;
        if (inlineTr) return inlineTr;
        const machineTr = translateString(fa, 'tr');
        if (machineTr && machineTr !== fa) return machineTr;
        if (en) return en;
        const machineEn = translateString(fa, 'en');
        return machineEn || fa;
      }

      // Default English (en)
      if (en) return en;
      const inlineEn = INLINE_DICTIONARY[fa]?.en;
      if (inlineEn) return inlineEn;
      return translateString(fa, 'en') || fa;
    },
    [language]
  );

  const contextValue = useMemo<LanguageContextType>(
    () => ({
      language,
      direction,
      dir: direction,
      t,
      dictionary: APP_DICTIONARY,
      setLanguage,
      trText,
      getLabel,
    }),
    [language, direction, t, setLanguage, trText, getLabel]
  );

  return (
    <LanguageContext.Provider value={contextValue}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = (): LanguageContextType => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
