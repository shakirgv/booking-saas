"use client";

import Button from "@/components/Button";
import { useLanguage } from "@/lib/language";

export default function LangSwitch() {
  const { lang, changeLang } = useLanguage();

  return (
    <Button
      variant="secondary"
      className="px-3 py-1"
      onClick={() => changeLang(lang === "en" ? "az" : "en")}
    >
      {lang === "en" ? "AZ" : "EN"}
    </Button>
  );
}