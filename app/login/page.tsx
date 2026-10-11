"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import Link from "next/link";
import LangSwitch from "@/components/LangSwitch";
import { useLanguage } from "@/lib/language";
import Button from "@/components/Button";
import Input from "@/components/Input";
import Card from "@/components/Card";

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
      <Card className="w-full max-w-sm p-8">
        <div className="flex items-center justify-between">
          <Link
            href="/"
            className="text-sm text-slate-500 hover:text-slate-700"
          >
            {t.backHome}
          </Link>
          <LangSwitch />
        </div>
        <h1 className="mt-6 text-2xl font-bold text-slate-900">{t.welcome}</h1>
        <p className="mt-1 text-sm text-slate-500">{t.welcomeSub}</p>

        <div className="mt-6 flex flex-col gap-3">
          <Input
            type="email"
            placeholder={t.email}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <Input
            type="password"
            placeholder={t.password}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <Button onClick={handleSignIn}>{t.signIn}</Button>
          <Button variant="secondary" onClick={handleSignUp}>
            {t.signUp}
          </Button>
        </div>
        {message && <p className="mt-4 text-sm text-red-600">{message}</p>}
      </Card>
    </main>
  );
}
