"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase";

type Appointment = {
  client_email: string | null;
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

function getGroupLabel(iso: string) {
  const d = new Date(iso);
  const now = new Date();
  const startOfToday = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate(),
  );
  const startOfTomorrow = new Date(startOfToday);
  startOfTomorrow.setDate(startOfTomorrow.getDate() + 1);
  const startOfDayAfter = new Date(startOfToday);
  startOfDayAfter.setDate(startOfDayAfter.getDate() + 2);

  if (d < startOfToday) return "Past";
  if (d < startOfTomorrow) return "Today";
  if (d < startOfDayAfter) return "Tomorrow";
  return "Later";
}

function getWeekDays(offset: number) {
  const today = new Date();
  const day = today.getDay(); // 0 = Sunday, 1 = Monday ...
  const diffToMonday = day === 0 ? -6 : 1 - day;
  const monday = new Date(
    today.getFullYear(),
    today.getMonth(),
    today.getDate() + diffToMonday + offset * 7,
  );
  return Array.from(
    { length: 7 },
    (_, i) =>
      new Date(monday.getFullYear(), monday.getMonth(), monday.getDate() + i),
  );
}

function isSameDay(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
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
  const [weekOffset, setWeekOffset] = useState(0);
  const [clientEmail, setClientEmail] = useState("");

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
      client_email: clientEmail || null,
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
      setClientEmail("");
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
    setClientEmail(a.client_email ?? "");
    setMessage("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function handleCancelEdit() {
    setEditingId(null);
    setClientname("");
    setService("");
    setStartsAt("");
    setNotes("");
    setClientEmail("");
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

  async function handleManage() {
    const supabase = createClient();
    const { data } = await supabase.auth.getSession();
    const token = data.session?.access_token;

    const res = await fetch("/api/portal", {
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

  async function handleRemind(id: string) {
    const supabase = createClient();
    const { data } = await supabase.auth.getSession();
    const token = data.session?.access_token;

    const res = await fetch("/api/remind", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ appointmentId: id }),
    });
    const json = await res.json();
    setMessage(
      json.sent ? "Reminder sent!" : (json.error ?? "Something went wrong"),
    );
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

  const groupOrder = ["Today", "Tomorrow", "Later", "Past"];
  const groups = groupOrder
    .map((label) => ({
      label,
      items: filteredAppointments.filter(
        (a) => getGroupLabel(a.starts_at) === label,
      ),
    }))
    .filter((g) => g.items.length > 0);

  const weekDays = getWeekDays(weekOffset);
  const todayDate = new Date();

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
          {plan === "pro" && (
            <button
              className="rounded border border-gray-600 px-4 py-2 text-sm"
              onClick={handleManage}
            >
              Manage subscription
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
            type="email"
            placeholder="Client email (optional)"
            value={clientEmail}
            onChange={(e) => setClientEmail(e.target.value)}
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
          {editingId && (
            <button
            type="button"
            className="rounded border border-gray-600 px-4 py-2"
            onClick={handleCancelEdit}
            >
              Cancel
            </button>
          )}
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
            <p className="mt-4 text-gray-400">
              No appointments yet. Add your first one.
            </p>
          ) : filteredAppointments.length === 0 ? (
            <p className="mt-4 text-gray-400">No matches found.</p>
          ) : (
            <div className="mt-4 flex flex-col gap-6">
              {groups.map((g) => (
                <div key={g.label}>
                  <h3 className="mb-2 text-sm font-bold uppercase tracking-wide text-gray-400">
                    {g.label} ({g.items.length})
                  </h3>
                  <ul className="flex flex-col gap-3">
                    {g.items.map((a) => (
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
                          {a.client_email && (
                            <p className="text-sm text-gray-400">
                              {a.client_email}
                            </p>
                          )}
                          {a.notes && <p className="mt-1 text-sm">{a.notes}</p>}
                        </div>
                        <div className="flex gap-2">
                          {a.client_email && (
                            <button
                              className="rounded border border-blue-500 px-3 py-1 text-sm"
                              onClick={() => handleRemind(a.id)}
                            >
                              Remind
                            </button>
                          )}
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
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
      <section className="mt-10">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-lg font-bold">
            Week of{" "}
            {weekDays[0].toLocaleDateString("en-GB", {
              day: "numeric",
              month: "short",
            })}
          </h2>
          <div className="flex gap-2">
            <button
              className="rounded border border-gray-600 px-3 py-1 text-sm"
              onClick={() => setWeekOffset(weekOffset - 1)}
            >
              ← Previous
            </button>
            <button
              className="rounded border border-gray-600 px-3 py-1 text-sm"
              onClick={() => setWeekOffset(0)}
            >
              Today
            </button>
            <button
              className="rounded border border-gray-600 px-3 py-1 text-sm"
              onClick={() => setWeekOffset(weekOffset + 1)}
            >
              Next →
            </button>
          </div>
        </div>
        <div className="mt-4 grid gap-3 md:grid-cols-4 lg:grid-cols-7">
          {weekDays.map((day) => {
            const dayAppointments = appointments.filter((a) =>
              isSameDay(new Date(a.starts_at), day),
            );
            const isToday = isSameDay(day, todayDate);

            return (
              <div
                key={day.toISOString()}
                className={`min-h-32 rounded-lg border p-3 ${
                  isToday ? "border-blue-500" : "border-gray-700"
                }`}
              >
                <p className="text-xs font-bold uppercase text-gray-400">
                  {day.toLocaleDateString("en-GB", { weekday: "short" })}
                </p>
                <p className="text-lg font-bold">{day.getDate()}</p>
                <div className="mt-2 flex flex-col gap-2">
                  {dayAppointments.map((a) => (
                    <div
                    key={a.id}
                    className="cursor-pointer rounded bg-gray-800 p-2 text-xs hover:bg-gray-700"
                    onClick={() => handleEdit(a)}
                    >
                      <p className="font-bold text-blue-400">
                        {new Date(a.starts_at).toLocaleTimeString("en-GB", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                      <p>{a.client_name}</p>
                      <p className="text-gray-400">{a.service}</p>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </main>
  );
}
