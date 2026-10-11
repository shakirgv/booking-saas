"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { translations, type Lang } from "@/lib/translations";

type LanguageContextType = {
  lang: Lang;
  t: (typeof translations)[Lang];
  changeLang: (next: Lang) => void;
};

const LanguageContext = createContext<LanguageContextType | null>(null);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLang] = useState<Lang>("en");

  useEffect(() => {
    try {
      const saved = localStorage.getItem("lang");
      if (saved === "en" || saved === "az") setLang(saved);
    } catch {}
  }, []);

  function changeLang(next: Lang) {
    setLang(next);
    try {
      localStorage.setItem("lang", next);
    } catch {}
  }

  return (
    <LanguageContext.Provider value={{ lang, t: translations[lang], changeLang }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error("useLanguage must be used inside LanguageProvider");
  return ctx;
}