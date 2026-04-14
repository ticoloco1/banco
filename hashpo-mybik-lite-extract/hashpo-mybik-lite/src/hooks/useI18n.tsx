"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";

export type LanguageCode = "en" | "es" | "pt" | "de" | "it" | "fr" | "ar" | "zh" | "sv" | "hi" | "ja" | "ru";

type Dictionary = Record<string, string>;

const dictionaries: Record<LanguageCode, Dictionary> = {
  en: {
    "nav.services": "Services",
    "nav.howItWorks": "How It Works",
    "nav.marketplace": "Marketplace",
    "nav.exchange": "Exchange",
    "nav.home": "Home",
    "nav.directory": "Directory",
    "nav.professions": "Professions",
    "nav.domains": "Domains",
    "nav.slugs": "Slugs",
    "nav.jobs": "Jobs",
    "nav.cv": "CV",
    "nav.classifieds": "Classifieds",
    "nav.cars": "Cars",
    "nav.properties": "Properties",
    "nav.miniSite": "Mini Site",
    "label.language": "Language",
  },
  es: {
    "nav.services": "Servicios", "nav.howItWorks": "Cómo funciona", "nav.marketplace": "Mercado", "nav.exchange": "Bolsa", "nav.home": "Inicio",
    "nav.directory": "Directorio", "nav.professions": "Profesiones", "nav.domains": "Dominios", "nav.slugs": "Slugs",
    "nav.jobs": "Trabajos", "nav.cv": "CV", "nav.classifieds": "Clasificados", "nav.cars": "Coches", "nav.properties": "Propiedades",
    "nav.miniSite": "Mini sitio", "label.language": "Idioma",
  },
  pt: {
    "nav.services": "Serviços", "nav.howItWorks": "Como funciona", "nav.marketplace": "Marketplace", "nav.exchange": "Corretora", "nav.home": "Início",
    "nav.directory": "Diretório", "nav.professions": "Profissões", "nav.domains": "Domínios", "nav.slugs": "Slugs",
    "nav.jobs": "Vagas", "nav.cv": "CV", "nav.classifieds": "Classificados", "nav.cars": "Carros", "nav.properties": "Imóveis",
    "nav.miniSite": "Mini Site", "label.language": "Idioma",
  },
  de: {
    "nav.services": "Dienste", "nav.howItWorks": "So funktioniert's", "nav.marketplace": "Marktplatz", "nav.exchange": "Börse", "nav.home": "Start",
    "nav.directory": "Verzeichnis", "nav.professions": "Berufe", "nav.domains": "Domains", "nav.slugs": "Slugs",
    "nav.jobs": "Jobs", "nav.cv": "Lebenslauf", "nav.classifieds": "Anzeigen", "nav.cars": "Autos", "nav.properties": "Immobilien",
    "nav.miniSite": "Mini-Seite", "label.language": "Sprache",
  },
  it: {
    "nav.services": "Servizi", "nav.howItWorks": "Come funziona", "nav.marketplace": "Marketplace", "nav.exchange": "Borsa", "nav.home": "Home",
    "nav.directory": "Directory", "nav.professions": "Professioni", "nav.domains": "Domini", "nav.slugs": "Slug",
    "nav.jobs": "Lavori", "nav.cv": "CV", "nav.classifieds": "Annunci", "nav.cars": "Auto", "nav.properties": "Immobili",
    "nav.miniSite": "Mini sito", "label.language": "Lingua",
  },
  fr: {
    "nav.services": "Services", "nav.howItWorks": "Comment ça marche", "nav.marketplace": "Marketplace", "nav.exchange": "Bourse", "nav.home": "Accueil",
    "nav.directory": "Annuaire", "nav.professions": "Professions", "nav.domains": "Domaines", "nav.slugs": "Slugs",
    "nav.jobs": "Emplois", "nav.cv": "CV", "nav.classifieds": "Annonces", "nav.cars": "Voitures", "nav.properties": "Biens",
    "nav.miniSite": "Mini site", "label.language": "Langue",
  },
  ar: {
    "nav.services": "الخدمات", "nav.howItWorks": "كيف يعمل", "nav.marketplace": "السوق", "nav.exchange": "البورصة", "nav.home": "الرئيسية",
    "nav.directory": "الدليل", "nav.professions": "المهن", "nav.domains": "النطاقات", "nav.slugs": "السلاجات",
    "nav.jobs": "الوظائف", "nav.cv": "السيرة الذاتية", "nav.classifieds": "الإعلانات", "nav.cars": "السيارات", "nav.properties": "العقارات",
    "nav.miniSite": "موقع مصغر", "label.language": "اللغة",
  },
  zh: {
    "nav.services": "服务", "nav.howItWorks": "工作原理", "nav.marketplace": "市场", "nav.exchange": "交易所", "nav.home": "首页",
    "nav.directory": "目录", "nav.professions": "职业", "nav.domains": "域名", "nav.slugs": "短链",
    "nav.jobs": "职位", "nav.cv": "简历", "nav.classifieds": "分类信息", "nav.cars": "汽车", "nav.properties": "房产",
    "nav.miniSite": "迷你站点", "label.language": "语言",
  },
  sv: {
    "nav.services": "Tjänster", "nav.howItWorks": "Så fungerar det", "nav.marketplace": "Marknad", "nav.exchange": "Börs", "nav.home": "Hem",
    "nav.directory": "Katalog", "nav.professions": "Yrken", "nav.domains": "Domäner", "nav.slugs": "Slugs",
    "nav.jobs": "Jobb", "nav.cv": "CV", "nav.classifieds": "Annonser", "nav.cars": "Bilar", "nav.properties": "Fastigheter",
    "nav.miniSite": "Minisajt", "label.language": "Språk",
  },
  hi: {
    "nav.services": "सेवाएँ", "nav.howItWorks": "यह कैसे काम करता है", "nav.marketplace": "मार्केटप्लेस", "nav.exchange": "एक्सचेंज", "nav.home": "होम",
    "nav.directory": "डायरेक्टरी", "nav.professions": "पेशे", "nav.domains": "डोमेन्स", "nav.slugs": "स्लग्स",
    "nav.jobs": "नौकरियाँ", "nav.cv": "सीवी", "nav.classifieds": "वर्गीकृत", "nav.cars": "कारें", "nav.properties": "प्रॉपर्टीज",
    "nav.miniSite": "मिनी साइट", "label.language": "भाषा",
  },
  ja: {
    "nav.services": "サービス", "nav.howItWorks": "仕組み", "nav.marketplace": "マーケット", "nav.exchange": "取引所", "nav.home": "ホーム",
    "nav.directory": "ディレクトリ", "nav.professions": "職業", "nav.domains": "ドメイン", "nav.slugs": "スラッグ",
    "nav.jobs": "求人", "nav.cv": "履歴書", "nav.classifieds": "広告", "nav.cars": "車", "nav.properties": "不動産",
    "nav.miniSite": "ミニサイト", "label.language": "言語",
  },
  ru: {
    "nav.services": "Сервисы", "nav.howItWorks": "Как это работает", "nav.marketplace": "Маркетплейс", "nav.exchange": "Биржа", "nav.home": "Главная",
    "nav.directory": "Каталог", "nav.professions": "Профессии", "nav.domains": "Домены", "nav.slugs": "Слаги",
    "nav.jobs": "Вакансии", "nav.cv": "Резюме", "nav.classifieds": "Объявления", "nav.cars": "Авто", "nav.properties": "Недвижимость",
    "nav.miniSite": "Мини-сайт", "label.language": "Язык",
  },
};

const languageNames: Record<LanguageCode, string> = {
  en: "English",
  es: "Español",
  pt: "Português",
  de: "Deutsch",
  it: "Italiano",
  fr: "Français",
  ar: "العربية",
  zh: "中文",
  sv: "Svenska",
  hi: "हिंदी",
  ja: "日本語",
  ru: "Русский",
};

type I18nContextValue = {
  language: LanguageCode;
  setLanguage: (lang: LanguageCode) => void;
  t: (key: string) => string;
  languages: { code: LanguageCode; name: string }[];
};

const I18nContext = createContext<I18nContextValue | null>(null);

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<LanguageCode>("en");

  useEffect(() => {
    const stored = (typeof window !== "undefined" ? localStorage.getItem("hashpo.language") : null) as LanguageCode | null;
    if (stored && dictionaries[stored]) setLanguageState(stored);
  }, []);

  const setLanguage = (lang: LanguageCode) => {
    setLanguageState(lang);
    if (typeof window !== "undefined") localStorage.setItem("hashpo.language", lang);
  };

  const t = (key: string) => dictionaries[language]?.[key] || dictionaries.en[key] || key;

  const value = useMemo(
    () => ({
      language,
      setLanguage,
      t,
      languages: Object.entries(languageNames).map(([code, name]) => ({ code: code as LanguageCode, name })),
    }),
    [language],
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error("useI18n must be used inside I18nProvider");
  return ctx;
}
