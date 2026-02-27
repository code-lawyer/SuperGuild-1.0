'use client';

import { createContext, useContext, useState, useCallback, ReactNode, useEffect } from 'react';
import en from './en';
import zh from './zh';

export type Locale = 'en' | 'zh';
type Translations = typeof en;

const translations: Record<Locale, Translations> = { en, zh };

interface I18nContextType {
    locale: Locale;
    setLocale: (l: Locale) => void;
    t: Translations;
}

const I18nContext = createContext<I18nContextType>({
    locale: 'en',
    setLocale: () => { },
    t: en,
});

export function I18nProvider({ children }: { children: ReactNode }) {
    const [locale, setLocaleState] = useState<Locale>('en');

    useEffect(() => {
        const saved = localStorage.getItem('sg-locale') as Locale | null;
        if (saved && translations[saved]) {
            setLocaleState(saved);
        }
    }, []);

    const setLocale = useCallback((l: Locale) => {
        setLocaleState(l);
        localStorage.setItem('sg-locale', l);
        document.documentElement.lang = l === 'zh' ? 'zh-CN' : 'en';
    }, []);

    return (
        <I18nContext.Provider value={{ locale, setLocale, t: translations[locale] }}>
            {children}
        </I18nContext.Provider>
    );
}

export function useI18n() {
    return useContext(I18nContext);
}

export function useT() {
    return useContext(I18nContext).t;
}
