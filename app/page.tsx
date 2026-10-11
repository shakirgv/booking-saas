"use client";

import Link from "next/link";
import LangSwitch from "@/components/LangSwitch";
import Card from "@/components/Card";
import { useLanguage } from "@/lib/language";

export default function Home() {
  const { t } = useLanguage();

  return (
    <main className="min-h-screen">
      <nav className="mx-auto flex max-w-5xl items-center justify-between p-6">
        <span className="text-xl font-bold text-blue-600">Slotly</span>
        <div className="flex items-center gap-3">
          <LangSwitch />
          <Link
            href="/login"
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            {t.signIn}
          </Link>
        </div>
      </nav>

      <section className="mx-auto max-w-3xl px-6 py-20 text-center">
        <h1 className="text-5xl font-bold tracking-tight text-slate-900">
          {t.heroTitle}
        </h1>
        <p className="mt-6 text-lg text-slate-600">{t.heroText}</p>
        <Link
          href="/login"
          className="mt-8 inline-block rounded-lg bg-blue-600 px-6 py-3 font-medium text-white hover:bg-blue-700"
        >
          {t.getStarted}
        </Link>
      </section>

      <section className="mx-auto grid max-w-5xl gap-4 px-6 md:grid-cols-3">
        {t.features.map((f) => (
          <Card key={f.title} className="p-6">
            <h3 className="text-lg font-bold text-slate-900">{f.title}</h3>
            <p className="mt-2 text-slate-600">{f.text}</p>
          </Card>
        ))}
      </section>

      <section className="mx-auto max-w-3xl px-6 py-20">
        <h2 className="text-center text-3xl font-bold text-slate-900">
          {t.pricing}
        </h2>
        <div className="mt-8 grid gap-4 md:grid-cols-2">
          <Card className="p-6">
            <h3 className="text-xl font-bold">{t.free}</h3>
            <p className="mt-2 text-3xl font-bold">$0</p>
            <p className="mt-4 text-slate-600">{t.freeLimit}</p>
          </Card>
          <Card className="border-2 border-blue-600 p-6">
            <h3 className="text-xl font-bold">{t.pro}</h3>
            <p className="mt-2 text-3xl font-bold">
              $9<span className="text-base text-slate-500">{t.perMonth}</span>
            </p>
            <p className="mt-4 text-slate-600">{t.proLimit}</p>
            <Link
              href="/login"
              className="mt-6 inline-block rounded-lg bg-blue-600 px-6 py-3 font-medium text-white hover:bg-blue-700"
            >
              {t.getPro}
            </Link>
          </Card>
        </div>
      </section>

      <footer className="p-6 text-center text-sm text-slate-500">
        © 2026 Slotly
      </footer>
    </main>
  );
}
