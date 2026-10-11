"use client";

import { useLanguage } from "@/lib/language";

export default function LangSwitch() {
  const { lang, changeLang } = useLanguage();

  return (
    <button
      className="rounded border border-gray-600 px-3 py-1 text-sm"
      onClick={() => changeLang(lang === "en" ? "az" : "en")}
    >
      {lang === "en" ? "AZ" : "EN"}
    </button>
  );
}