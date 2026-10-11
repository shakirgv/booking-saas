"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase";
import { useLanguage } from "@/lib/language";
import Navbar from "@/components/Navbar";
import Button from "@/components/Button";
import Input from "@/components/Input";
import Card from "@/components/Card";

type Client = {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
};

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
    if (error) setMessage(error.message);
    else setClients(data ?? []);
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
    if (error) setMessage(error.message);
    else loadClients();
  }

  return (
    <>
      <Navbar />
      <main className="mx-auto max-w-2xl p-6">
        <h1 className="text-2xl font-bold">
          {editingId ? t.editClient : t.clients}
        </h1>

        {message && (
          <p className="mt-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            {message}
          </p>
        )}

        <Card className="mt-6 p-5">
          <form onSubmit={handleSubmit} className="flex flex-col gap-3">
            <Input
              placeholder={t.clientName}
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
            <Input
              type="tel"
              placeholder={t.phone}
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
            <Input
              type="email"
              placeholder={t.clientEmail}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
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
              <Button type="submit">{editingId ? t.save : t.addClient}</Button>
            </div>
          </form>
        </Card>

        <ul className="mt-6 flex flex-col gap-3">
          {clients.map((c) => (
            <li key={c.id}>
              <Card className="flex items-center justify-between gap-4 p-4">
                <div>
                  <p className="font-bold">{c.name}</p>
                  {c.phone && (
                    <p className="text-sm text-slate-500">{c.phone}</p>
                  )}
                  {c.email && (
                    <p className="text-sm text-slate-500">{c.email}</p>
                  )}
                </div>
                <div className="flex gap-2">
                  <Button variant="secondary" onClick={() => handleEdit(c)}>
                    {t.edit}
                  </Button>
                  <Button variant="danger" onClick={() => handleDelete(c.id)}>
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
