"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import Link from "next/link";
import LangSwitch from "@/components/LangSwitch";
import { useLanguage } from "@/lib/language";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const router = useRouter();
  const { t } = useLanguage();

  async function handleSignUp() {
    const supabase = createClient();
    const { error } = await supabase.auth.signUp({ email, password });
    setMessage(error ? error.message : t.signedUp);
  }

  async function handleSignIn() {
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) {
      setMessage(error.message);
    } else {
      router.push("/dashboard");
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center p-6">
      <div className="w-full max-w-sm rounded-lg border border-gray-700 p-8">
        <div className="flex items-center justify-between">
          <Link href="/" className="text-sm text-gray-400">
            {t.backHome}
          </Link>
          <LangSwitch />
        </div>
        <h1 className="mt-4 text-2xl font-bold">{t.welcome}</h1>
        <p className="mt-1 text-sm text-gray-400">
          {t.welcomeSub}
        </p>
        <div className="mt-6 flex flex-col gap-3">
          <input
            className="w-full rounded border border-gray-500 bg-gray-800 p-2 text-white placeholder-gray-400"
            type="email"
            placeholder={t.email}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <input
            className="w-full rounded border border-gray-500 bg-gray-800 p-2 text-white placeholder-gray-400"
            type="password"
            placeholder={t.password}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <button
            className="w-full rounded bg-blue-500 px-4 py-2 font-medium"
            onClick={handleSignIn}
          >
            {t.signIn}
          </button>
          <button
            className="w-full rounded border border-gray-600 px-4 py-2"
            onClick={handleSignUp}
          >
            	{t.signUp}
          </button>
        </div>
        <p className="mt-4 text-sm text-red-400">{message}</p>
      </div>
    </main>
  );
}
