"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase";

type Appointment = {
  id: string;
  client_name: string;
  service: string;
  starts_at: string;
  notes: string | null;
};

const fullInputClass =
  "w-full rounded border border-gray-500 bg-gray-800 p-2 text-white placeholder-gray-400";

function toLocalInputValue(iso: string) {
  const d = new Date(iso);
  const offsetMs = d.getTimezoneOffset() * 60000;
  return new Date(d.getTime() - offsetMs).toISOString().slice(0, 16);
}

export default function DashboardPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [userId, setUserId] = useState("");
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [clientName, setClientname] = useState("");
  const [service, setService] = useState("");
  const [startsAt, setStartsAt] = useState("");
  const [notes, setNotes] = useState("");
  const [message, setMessage] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [plan, setPlan] = useState("free");
  const [search, setSearch] = useState("");

  async function loadPlan() {
    const supabase = createClient();
    const { data } = await supabase.from("profiles").select("plan").single();
    setPlan(data?.plan ?? "free");
  }

  async function loadAppointments() {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("appointments")
      .select("*")
      .order("starts_at", { ascending: true });
    if (error) {
      setMessage(error.message);
    } else {
      setAppointments(data ?? []);
    }
  }

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) {
        router.push("/login");
      } else {
        setEmail(data.user.email ?? "");
        setUserId(data.user.id);
        loadAppointments();
        loadAppointments();
        loadPlan();
      }
    });
  }, [router]);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    const date = new Date(startsAt);
    if (isNaN(date.getTime())) {
      setMessage("Please choose a valid date and time");
      return;
    }
    const supabase = createClient();
    const values = {
      client_name: clientName,
      service,
      starts_at: date.toISOString(),
      notes: notes || null,
    };

    const { error } = editingId
      ? await supabase.from("appointments").update(values).eq("id", editingId)
      : await supabase
          .from("appointments")
          .insert({ ...values, user_id: userId });

    if (error) {
      setMessage(error.message);
    } else {
      setMessage(editingId ? "Appointment updated!" : "Appointment added!");
      setClientname("");
      setService("");
      setStartsAt("");
      setNotes("");
      setEditingId(null);
      loadAppointments();
    }
  }

  function handleEdit(a: Appointment) {
    setEditingId(a.id);
    setClientname(a.client_name);
    setService(a.service);
    setStartsAt(toLocalInputValue(a.starts_at));
    setNotes(a.notes ?? "");
    setMessage("");
  }

  async function handleDelete(id: string) {
    const supabase = createClient();
    const { error } = await supabase.from("appointments").delete().eq("id", id);
    if (error) {
      setMessage(error.message);
    } else {
      setMessage("Appointment deleted.");
      loadAppointments();
    }
  }

  async function handleUpgrade() {
    const supabase = createClient();
    const { data } = await supabase.auth.getSession();
    const token = data.session?.access_token;

    const res = await fetch("/api/checkout", {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
    });
    const json = await res.json();
    if (json.url) {
      window.location.href = json.url;
    } else {
      setMessage(json.error ?? "Something went wrong");
    }
  }

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
  }

  const filteredAppointments = appointments.filter((a) => {
    const q = search.trim().toLowerCase();
    return (
        a.client_name.toLowerCase().includes(q) ||
        a.service.toLowerCase().includes(q)
    );
  });

  return (
    <main className="mx-auto min-h-screen max-w-5xl p-6">
      <header className="flex flex-wrap items-center justify-between gap-4 border-b border-gray-700 pb-4">
        <div>
          <h1 className="text-2xl font-bold">Slotly</h1>
          <p className="text-sm text-gray-400">{email}</p>
        </div>
        <div className="flex items-center gap-3">
          <span
            className={`rounded-full px-3 py-1 text-sm font-medium ${
              plan === "pro" ? "bg-green-600" : "bg-gray-700"
            }`}
          >
            {plan === "pro" ? "Pro" : "Free"}
          </span>
          {plan !== "pro" && (
            <button
              className="rounded bg-green-600 px-4 py-2 text-sm font-medium"
              onClick={handleUpgrade}
            >
              Upgrade to Pro
            </button>
          )}
          <button
            className="rounded border border-gray-600 px-4 py-2 text-sm"
            onClick={handleSignOut}
          >
            Sign out
          </button>
        </div>
      </header>

      {message && (
        <p className="mt-4 rounded bg-gray-800 p-3 text-sm">{message}</p>
      )}

      <div className="mt-6 grid gap-6 md:grid-cols-3">
        <form
          onSubmit={handleAdd}
          className="flex flex-col gap-3 rounded-lg border border-gray-700 p-5 md:col-span-1"
        >
          <h2 className="text-lg font-bold">
            {editingId ? "Edit appointment" : "New appointment"}
          </h2>
          <input
            className={fullInputClass}
            placeholder="Client name"
            value={clientName}
            onChange={(e) => setClientname(e.target.value)}
            required
          />
          <input
            className={fullInputClass}
            placeholder="Service (e.g. Haircut)"
            value={service}
            onChange={(e) => setService(e.target.value)}
            required
          />
          <input
            className={fullInputClass}
            type="datetime-local"
            value={startsAt}
            onChange={(e) => setStartsAt(e.target.value)}
            required
          />
          <input
            className={fullInputClass}
            placeholder="Notes (optional)"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
          <button
            type="submit"
            className="rounded bg-blue-500 px-4 py-2 font-medium"
          >
            {editingId ? "Save changes" : "Add appointment"}
          </button>
        </form>

        <section className="md:col-span-2">
          <h2 className="text-lg font-bold">
            Appointments ({filteredAppointments.length})
          </h2>
          <input
          className="mt-3 w-full rounded border border-gray-500 bg-gray-800 p-2 text-white placeholder-gray-400"
          placeholder="Search by client or service..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          />
          {appointments.length === 0 ? (
            <p className="mt-4 text-gray-400">No appointments yet. Add your first one.</p>
          ) : filteredAppointments.length === 0 ? (
            <p className="mt-4 text-gray-400">No matches found.</p>
          ) : (
            <ul className="mt-4 flex flex-col gap-3">
                {filteredAppointments.map((a) => (
                <li
                  key={a.id}
                  className="flex items-start justify-between gap-4 rounded-lg border border-gray-700 p-4"
                >
                  <div>
                    <p className="font-bold">{a.client_name}</p>
                    <p className="text-sm text-blue-400">{a.service}</p>
                    <p className="text-sm text-gray-400">
                      {new Date(a.starts_at).toLocaleString()}
                    </p>
                    {a.notes && <p className="mt-1 text-sm">{a.notes}</p>}
                  </div>
                  <div className="flex gap-2">
                    <button
                      className="rounded border border-gray-600 px-3 py-1 text-sm"
                      onClick={() => handleEdit(a)}
                    >
                      Edit
                    </button>
                    <button
                      className="rounded bg-red-600 px-3 py-1 text-sm"
                      onClick={() => handleDelete(a.id)}
                    >
                      Delete
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </main>
  );
}
