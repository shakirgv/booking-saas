"use client";

import Link from "next/link";
import LangSwitch from "@/components/LangSwitch";
import { useLanguage } from "@/lib/language";

export default function Home() {
  const { t } = useLanguage();

  return (
    <main className="min-h-screen">
      <nav className="mx-auto flex max-w-5xl items-center justify-between p-6">
        <span className="text-xl font-bold">Slotly</span>
        <div className="flex items-center gap-3">
          <LangSwitch />
          <Link
            href="/login"
            className="rounded bg-blue-500 px-4 py-2 text-sm font-medium"
          >
            {t.signIn}
          </Link>
        </div>
      </nav>

      <section className="mx-auto max-w-3xl px-6 py-20 text-center">
        <h1 className="text-5xl font-bold">{t.heroTitle}</h1>
        <p className="mt-6 text-lg text-gray-400">{t.heroText}</p>
        <Link
          href="/login"
          className="mt-8 inline-block rounded bg-blue-500 px-6 py-3 font-medium"
        >
          {t.getStarted}
        </Link>
      </section>

      <section className="mx-auto grid max-w-5xl gap-4 px-6 md:grid-cols-3">
        {t.features.map((f) => (
          <div key={f.title} className="rounded border border-gray-700 p-6">
            <h3 className="text-lg font-bold">{f.title}</h3>
            <p className="mt-2 text-gray-400">{f.text}</p>
          </div>
        ))}
      </section>

      <section className="mx-auto max-w-3xl px-6 py-20">
        <h2 className="text-center text-3xl font-bold">{t.pricing}</h2>
        <div className="mt-8 grid gap-4 md:grid-cols-2">
          <div className="rounded border border-gray-700 p-6">
            <h3 className="text-xl font-bold">{t.free}</h3>
            <p className="mt-2 text-3xl font-bold">$0</p>
            <p className="mt-4 text-gray-400">{t.freeLimit}</p>
          </div>
          <div className="rounded border border-blue-500 p-6">
            <h3 className="text-xl font-bold">{t.pro}</h3>
            <p className="mt-2 text-3xl font-bold">
              $9<span className="text-base text-gray-400">{t.perMonth}</span>
            </p>
            <p className="mt-4 text-gray-400">{t.proLimit}</p>
            <Link
              href="/login"
              className="mt-6 inline-block rounded bg-blue-500 px-6 py-3 font-medium"
            >
              {t.getPro}
            </Link>
          </div>
        </div>
      </section>

      <footer className="p-6 text-center text-sm text-gray-500">
        © 2026 Slotly
      </footer>
    </main>
  );
}