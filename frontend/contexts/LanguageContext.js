import { createContext, useContext, useState, useEffect } from 'react';
import Cookies from 'js-cookie';
import enTranslations from '../locales/en.json';
import hiTranslations from '../locales/hi.json';
import knTranslations from '../locales/kn.json';

const translations = {
    en: enTranslations,
    hi: hiTranslations,
    kn: knTranslations
};

const LanguageContext = createContext();

const COOKIE_NAME = 'sahaay_language';
const COOKIE_EXPIRY = 365; // days

export function LanguageProvider({ children }) {
    const [language, setLanguage] = useState('en');

    // Load saved language preference from cookies
    useEffect(() => {
        const savedLang = Cookies.get(COOKIE_NAME);
        if (savedLang && translations[savedLang]) {
            setLanguage(savedLang);
            document.documentElement.lang = savedLang;
        }
    }, []);

    // Save language preference when it changes
    const changeLanguage = (lang) => {
        if (translations[lang]) {
            setLanguage(lang);
            // Save to cookie with 1 year expiry
            Cookies.set(COOKIE_NAME, lang, { expires: COOKIE_EXPIRY });
            // Update HTML lang attribute
            document.documentElement.lang = lang;
        }
    };

    // Translation function with nested key support
    const t = (key) => {
        const keys = key.split('.');
        let value = translations[language];
        
        for (const k of keys) {
            if (value && typeof value === 'object') {
                value = value[k];
            } else {
                return key; // Return key if translation not found
            }
        }
        
        return value || key;
    };

    return (
        <LanguageContext.Provider value={{ language, changeLanguage, t }}>
            {children}
        </LanguageContext.Provider>
    );
}

export function useLanguage() {
    const context = useContext(LanguageContext);
    if (!context) {
        throw new Error('useLanguage must be used within a LanguageProvider');
    }
    return context;
}
