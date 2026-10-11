"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase";
import { useLanguage } from "@/lib/language";
import Navbar from "@/components/Navbar";
import Button from "@/components/Button";
import Input from "@/components/Input";
import Card from "@/components/Card";

type Service = {
  id: string;
  name: string;
  duration_minutes: number;
  price: number | null;
};

export default function ServicesPage() {
  const router = useRouter();
  const { t } = useLanguage();
  const [userId, setUserId] = useState("");
  const [services, setServices] = useState<Service[]>([]);
  const [name, setName] = useState("");
  const [duration, setDuration] = useState("30");
  const [price, setPrice] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [message, setMessage] = useState("");

  async function loadServices() {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("services")
      .select("*")
      .order("name", { ascending: true });
    if (error) setMessage(error.message);
    else setServices(data ?? []);
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

  function handleCancelEdit() {
    setEditingId(null);
    setName("");
    setDuration("30");
    setPrice("");
  }

  async function handleSubmit(e: React.FormEvent) {
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

  async function handleDelete(id: string) {
    const supabase = createClient();
    const { error } = await supabase.from("services").delete().eq("id", id);
    if (error) setMessage(error.message);
    else loadServices();
  }

  return (
    <>
      <Navbar />
      <main className="mx-auto max-w-2xl p-6">
        <h1 className="text-2xl font-bold">
          {editingId ? t.editService : t.services}
        </h1>

        {message && (
          <p className="mt-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            {message}
          </p>
        )}

        <Card className="mt-6 p-5">
          <form onSubmit={handleSubmit} className="flex flex-col gap-3">
            <Input
              placeholder={t.serviceName}
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
            <Input
              type="number"
              min="5"
              step="5"
              placeholder={t.duration}
              value={duration}
              onChange={(e) => setDuration(e.target.value)}
              required
            />
            <Input
              type="number"
              min="0"
              step="0.01"
              placeholder={t.price}
              value={price}
              onChange={(e) => setPrice(e.target.value)}
            />
            <div className="flex justify-end gap-2">
              {editingId && (
                <Button
                  type="button"
                  variant="secondary"
                  onClick={handleCancelEdit}
                >
                  {t.cancel}
                </Button>
              )}
              <Button type="submit">
                {editingId ? t.saveService : t.addService}
              </Button>
            </div>
          </form>
        </Card>

        <ul className="mt-6 flex flex-col gap-3">
          {services.map((s) => (
            <li key={s.id}>
              <Card className="flex items-center justify-between gap-4 p-4">
                <div>
                  <p className="font-bold">{s.name}</p>
                  <p className="text-sm text-slate-500">
                    {s.duration_minutes} {t.min}
                    {s.price !== null ? ` · ${s.price}` : ""}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button variant="secondary" onClick={() => handleEdit(s)}>
                    {t.edit}
                  </Button>
                  <Button variant="danger" onClick={() => handleDelete(s.id)}>
                    {t.delete}
                  </Button>
                </div>
              </Card>
            </li>
          ))}
        </ul>
      </main>
    </>
  );
}
