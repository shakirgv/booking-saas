"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase";
import LangSwitch from "@/components/LangSwitch";
import { useLanguage } from "@/lib/language";

type Service = {
  id: string;
  name: string;
  duration_minutes: number;
  price: number | null;
};


const fullInputClass =
  "w-full rounded border border-gray-500 bg-gray-800 p-2 text-white placeholder-gray-400";

export default function ServicesPage() {
  const router = useRouter();
  const [userId, setUserId] = useState("");
  const [services, setServices] = useState<Service[]>([]);
  const [name, setName] = useState("");
  const [duration, setDuration] = useState("");
  const [price, setPrice] = useState("");
  const [message, setMessage] = useState("");
  const { t } = useLanguage();
  const [editingId, setEditingId] = useState<string | null>(null);

  async function loadServices() {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("services")
      .select("*")
      .order("name", { ascending: true });
    if (error) {
      setMessage(error.message);
    } else {
      setServices(data ?? []);
    }
  }

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) {
        router.push("/login");
      } else {
        setUserId(data.user.id);
        loadServices();
      }
    });
  }, [router]);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    const supabase = createClient();
    const values = {
      name,
      duration_minutes: Number(duration),
      price: price ? Number(price) : null,
    };

    const { error } = editingId
      ? await supabase.from("services").update(values).eq("id", editingId)
      : await supabase.from("services").insert({ ...values, user_id: userId });

    if (error) {
      setMessage(error.message);
    } else {
      setMessage("");
      handleCancelEdit();
      loadServices();
    }
  }

  function handleEdit(s: Service) {
    setEditingId(s.id);
    setName(s.name);
    setDuration(String(s.duration_minutes));
    setPrice(s.price !== null ? String(s.price) : "");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function handleCancelEdit() {
    setEditingId(null);
    setName("");
    setDuration("30");
    setPrice("");
  }

  async function handleDelete(id: string) {
    const supabase = createClient();
    const { error } = await supabase.from("services").delete().eq("id", id);
    if (error) {
      setMessage(error.message);
    } else {
      loadServices();
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
        {editingId ? t.editService : t.services}
      </h1>

      {message && (
        <p className="mt-4 rounded bg-gray-800 p-3 text-sm">{message}</p>
      )}

      <form
        onSubmit={handleAdd}
        className="mt-6 flex flex-col gap-3 rounded-lg border border-gray-700 p-5"
      >
        <input
          className={fullInputClass}
          placeholder={t.serviceName}
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
        <input
          className={fullInputClass}
          type="number"
          min="5"
          step="5"
          placeholder={t.duration}
          value={duration}
          onChange={(e) => setDuration(e.target.value)}
          required
        />
        <input
          className={fullInputClass}
          type="number"
          min="0"
          step="0.01"
          placeholder={t.price}
          value={price}
          onChange={(e) => setPrice(e.target.value)}
        />
        <button
          type="submit"
          className="rounded bg-blue-500 px-4 py-2 font-medium"
        >
          {editingId ? t.saveService : t.addService}
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
        {services.map((s) => (
          <li
            key={s.id}
            className="flex items-center justify-between rounded-lg border border-gray-700 p-4"
          >
            <div>
              <p className="font-bold">{s.name}</p>
              <p className="text-sm text-gray-400">
                {s.duration_minutes} {t.min}
                {s.price !== null ? ` · ${s.price}` : ""}
              </p>
            </div>
            <div className="flex gap-2">
              <button
                className="rounded border border-gray-600 px-3 py-1 text-sm"
                onClick={() => handleEdit(s)}
              >
                {t.edit}
              </button>
              <button
                className="rounded bg-red-600 px-3 py-1 text-sm"
                onClick={() => handleDelete(s.id)}
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
