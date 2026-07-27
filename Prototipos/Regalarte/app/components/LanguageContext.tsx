"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";

export type Language = "es" | "en";

interface LanguageContextType {
  lang: Language;
  setLang: (lang: Language) => void;
  toggleLang: () => void;
  t: <T>(es: T, en: T) => T;
}

const LanguageContext = createContext<LanguageContextType>({
  lang: "es",
  setLang: () => {},
  toggleLang: () => {},
  t: (es) => es,
});

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  // La página siempre está predeterminada en español
  const [lang, setLangState] = useState<Language>("es");

  useEffect(() => {
    try {
      const saved = localStorage.getItem("regalarte:lang:v1") as Language;
      if (saved === "en" || saved === "es") {
        setLangState(saved);
      }
    } catch {}
  }, []);

  const setLang = useCallback((newLang: Language) => {
    setLangState(newLang);
    try {
      localStorage.setItem("regalarte:lang:v1", newLang);
    } catch {}
  }, []);

  const toggleLang = useCallback(() => {
    setLangState((prev) => {
      const next = prev === "es" ? "en" : "es";
      try {
        localStorage.setItem("regalarte:lang:v1", next);
      } catch {}
      return next;
    });
  }, []);

  const t = useCallback(<T,>(es: T, en: T): T => {
    return lang === "en" ? en : es;
  }, [lang]);

  return (
    <LanguageContext.Provider value={{ lang, setLang, toggleLang, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  return useContext(LanguageContext);
}
