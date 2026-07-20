"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { Lang } from "@/lib/i18n";

interface LangCtx {
  lang: Lang;
  setLang: (l: Lang) => void;
  dir: "ltr" | "rtl";
}

const Ctx = createContext<LangCtx>({ lang: "en", setLang: () => {}, dir: "ltr" });

export function useLang() {
  return useContext(Ctx);
}

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>("en");

  // restore saved preference
  useEffect(() => {
    const saved = typeof window !== "undefined" ? (localStorage.getItem("radd-lang") as Lang | null) : null;
    if (saved === "ar" || saved === "en") setLangState(saved);
  }, []);

  const dir = lang === "ar" ? "rtl" : "ltr";

  // reflect on <html> so RTL applies globally
  useEffect(() => {
    document.documentElement.lang = lang;
    document.documentElement.dir = dir;
  }, [lang, dir]);

  const setLang = (l: Lang) => {
    setLangState(l);
    if (typeof window !== "undefined") localStorage.setItem("radd-lang", l);
  };

  return <Ctx.Provider value={{ lang, setLang, dir }}>{children}</Ctx.Provider>;
}

/** Header pill toggle: EN | AR */
export function LangToggle() {
  const { lang, setLang } = useLang();
  const btn = (l: Lang, label: string) => (
    <button
      onClick={() => setLang(l)}
      style={{
        background: lang === l ? "rgba(255,255,255,0.18)" : "transparent",
        color: lang === l ? "#fff" : "#94a3b8",
        border: "none",
        padding: "5px 12px",
        borderRadius: 7,
        fontSize: 13,
        fontWeight: 600,
        cursor: "pointer",
      }}
    >
      {label}
    </button>
  );
  return (
    <div
      style={{
        display: "flex",
        gap: 2,
        background: "rgba(255,255,255,0.06)",
        border: "1px solid rgba(255,255,255,0.15)",
        borderRadius: 9,
        padding: 2,
      }}
    >
      {btn("en", "EN")}
      {btn("ar", "ع")}
    </div>
  );
}
