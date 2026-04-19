"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import en from "@/locales/en";
import fr from "@/locales/fr";
import type { Locale, TranslationMessage, TranslationValues } from "@/lib/i18n-types";

const STORAGE_KEY = "rift-clues-locale";

const dictionaries: Record<Locale, Record<string, unknown>> = {
  en,
  fr,
};

type I18nContextValue = {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: string, values?: TranslationValues) => string;
  tm: (message: TranslationMessage | string) => string;
};

const I18nContext = createContext<I18nContextValue | null>(null);

function detectInitialLocale(): Locale {
  const browserLanguage = navigator.language.toLowerCase();
  return browserLanguage.startsWith("fr") ? "fr" : "en";
}

function getValueFromDictionary(
  dictionary: Record<string, unknown>,
  key: string,
): unknown {
  return key.split(".").reduce<unknown>((current, segment) => {
    if (!current || typeof current !== "object") {
      return undefined;
    }

    return (current as Record<string, unknown>)[segment];
  }, dictionary);
}

function interpolate(
  template: string,
  values: TranslationValues | undefined,
  dictionary: Record<string, unknown>,
) {
  if (!values) {
    return template;
  }

  return template.replace(/\{(\w+)\}/g, (_, key: string) => {
    const value = values[key];
    if (value === undefined) {
      return `{${key}}`;
    }

    if (typeof value === "string") {
      const translatedValue = getValueFromDictionary(dictionary, value);
      if (typeof translatedValue === "string") {
        return translatedValue;
      }
    }

    return String(value);
  });
}

export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocale] = useState<Locale>("en");

  useEffect(() => {
    const savedLocale = window.localStorage.getItem(STORAGE_KEY);
    if (savedLocale === "en" || savedLocale === "fr") {
      setLocale(savedLocale);
      return;
    }

    setLocale(detectInitialLocale());
  }, []);

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, locale);
    document.documentElement.lang = locale;
  }, [locale]);

  const value = useMemo<I18nContextValue>(() => {
    const dictionary = dictionaries[locale];

    const t = (key: string, values?: TranslationValues) => {
      const rawValue = getValueFromDictionary(dictionary, key);
      if (typeof rawValue !== "string") {
        return key;
      }

      return interpolate(rawValue, values, dictionary);
    };

    const tm = (message: TranslationMessage | string) => {
      if (typeof message === "string") {
        return message;
      }

      return t(message.key, message.values);
    };

    return {
      locale,
      setLocale,
      t,
      tm,
    };
  }, [locale]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error("useI18n must be used inside I18nProvider");
  }

  return context;
}
