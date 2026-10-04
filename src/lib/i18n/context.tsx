"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import enTranslations from "@/locales/en.json";
import taTranslations from "@/locales/ta.json";

export type Locale = "en" | "ta";

interface LanguageContextType {
  locale: Locale;
  setLocale: (lang: Locale) => void;
  t: (path: string, fallback?: string) => string;
}

const translations: Record<Locale, Record<string, unknown>> = {
  en: enTranslations,
  ta: taTranslations,
};

const LanguageContext = createContext<LanguageContextType>({
  locale: "en",
  setLocale: () => {},
  t: (path: string, fallback?: string) => fallback || path,
});

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>("en");

  useEffect(() => {
    const saved = localStorage.getItem("veetukanakku_locale") as Locale | null;
    if (saved === "en" || saved === "ta") {
      setLocaleState(saved);
    }
  }, []);

  const setLocale = (lang: Locale) => {
    setLocaleState(lang);
    localStorage.setItem("veetukanakku_locale", lang);
    document.cookie = `veetukanakku_locale=${lang}; path=/; max-age=31536000`;
  };

  const t = (path: string, fallback?: string): string => {
    const keys = path.split(".");
    let current: unknown = translations[locale];

    for (const key of keys) {
      if (current && typeof current === "object" && key in (current as Record<string, unknown>)) {
        current = (current as Record<string, unknown>)[key];
      } else {
        // Fallback to English if missing in Tamil
        let enCurrent: unknown = translations.en;
        for (const enKey of keys) {
          if (enCurrent && typeof enCurrent === "object" && enKey in (enCurrent as Record<string, unknown>)) {
            enCurrent = (enCurrent as Record<string, unknown>)[enKey];
          } else {
            return fallback || path;
          }
        }
        return typeof enCurrent === "string" ? enCurrent : fallback || path;
      }
    }

    return typeof current === "string" ? current : fallback || path;
  };

  return (
    <LanguageContext.Provider value={{ locale, setLocale, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  return useContext(LanguageContext);
}
