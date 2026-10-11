"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase";
import { useLanguage } from "@/lib/language";
import LangSwitch from "@/components/LangSwitch";
import Button from "@/components/Button";

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { t } = useLanguage();

  const links = [
    { href: "/dashboard", label: t.navDashboard },
    { href: "/services", label: t.services },
    { href: "/clients", label: t.clients },
  ];

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
  }

    return (
    <header className="border-b border-slate-200 bg-white">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-2 px-4 py-3 sm:px-6">
        <div className="flex min-w-0 items-center gap-3 sm:gap-6">
          <span className="text-xl font-bold text-blue-600">Slotly</span>
          <nav className="flex gap-1 overflow-x-auto">
            {links.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className={`whitespace-nowrap rounded-lg px-2 py-1.5 text-sm font-medium sm:px-3 ${
                  pathname === l.href
                    ? "bg-blue-50 text-blue-700"
                    : "text-slate-600 hover:bg-slate-100"
                }`}
              >
                {l.label}
              </Link>
            ))}
          </nav>
        </div>
        <div className="flex shrink-0 items-center gap-1 sm:gap-2">
          <LangSwitch />
          <Button variant="ghost" className="px-2 sm:px-4" onClick={handleSignOut}>
            <span className="hidden sm:inline">{t.signOut}</span>
            <span className="sm:hidden">⎋</span>
          </Button>
        </div>
      </div>
    </header>
  );
}