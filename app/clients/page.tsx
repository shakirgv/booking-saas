"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase";
import LangSwitch from "@/components/LangSwitch";
import { useLanguage } from "@/lib/language";

type Client = {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
};

const fullInputClass =
  "w-full rounded border border-gray-500 bg-gray-800 p-2 text-white placeholder-gray-400";

export default function ClientsPage() {
  const router = useRouter();
  const { t } = useLanguage();
  const [userId, setUserId] = useState("");
  const [clients, setClients] = useState<Client[]>([]);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [message, setMessage] = useState("");

  async function loadClients() {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("clients")
      .select("*")
      .order("name", { ascending: true });
    if (error) {
      setMessage(error.message);
    } else {
      setClients(data ?? []);
    }
  }

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) {
        router.push("/login");
      } else {
        setUserId(data.user.id);
        loadClients();
      }
    });
  }, [router]);

  function handleCancelEdit() {
    setEditingId(null);
    setName("");
    setPhone("");
    setEmail("");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const supabase = createClient();
    const values = {
      name,
      phone: phone || null,
      email: email || null,
    };

    const { error } = editingId
      ? await supabase.from("clients").update(values).eq("id", editingId)
      : await supabase.from("clients").insert({ ...values, user_id: userId });

    if (error) {
      setMessage(error.message);
    } else {
      setMessage("");
      handleCancelEdit();
      loadClients();
    }
  }

  function handleEdit(c: Client) {
    setEditingId(c.id);
    setName(c.name);
    setPhone(c.phone ?? "");
    setEmail(c.email ?? "");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function handleDelete(id: string) {
    const supabase = createClient();
    const { error } = await supabase.from("clients").delete().eq("id", id);
    if (error) {
      setMessage(error.message);
    } else {
      loadClients();
    }
  }

  return (
    <main className="mx-auto min-h-screen max-w-2xl p-6">
      <div className="flex items-center justify-between">
        <Link href="/dashboard" className="text-sm text-gray-400">
          {t.backDashboard}
        </Link>
        <LangSwitch />
      </div>
      <h1 className="mt-4 text-2xl font-bold">
        {editingId ? t.editClient : t.clients}
      </h1>

      {message && <p className="mt-4 rounded bg-gray-800 p-3 text-sm">{message}</p>}

      <form
        onSubmit={handleSubmit}
        className="mt-6 flex flex-col gap-3 rounded-lg border border-gray-700 p-5"
      >
        <input
          className={fullInputClass}
          placeholder={t.clientName}
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
        <input
          className={fullInputClass}
          type="tel"
          placeholder={t.phone}
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
        />
        <input
          className={fullInputClass}
          type="email"
          placeholder={t.clientEmail}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <button type="submit" className="rounded bg-blue-500 px-4 py-2 font-medium">
          {editingId ? t.save : t.addClient}
        </button>
        {editingId && (
          <button
            type="button"
            className="rounded border border-gray-600 px-4 py-2"
            onClick={handleCancelEdit}
          >
            {t.cancel}
          </button>
        )}
      </form>

      <ul className="mt-6 flex flex-col gap-3">
        {clients.map((c) => (
          <li
            key={c.id}
            className="flex items-center justify-between gap-4 rounded-lg border border-gray-700 p-4"
          >
            <div>
              <p className="font-bold">{c.name}</p>
              {c.phone && <p className="text-sm text-gray-400">{c.phone}</p>}
              {c.email && <p className="text-sm text-gray-400">{c.email}</p>}
            </div>
            <div className="flex gap-2">
              <button
                className="rounded border border-gray-600 px-3 py-1 text-sm"
                onClick={() => handleEdit(c)}
              >
                {t.edit}
              </button>
              <button
                className="rounded bg-red-600 px-3 py-1 text-sm"
                onClick={() => handleDelete(c.id)}
              >
                {t.delete}
              </button>
            </div>
          </li>
        ))}
      </ul>
    </main>
  );
}