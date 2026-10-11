"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase";
import { useLanguage } from "@/lib/language";
import Navbar from "@/components/Navbar";
import Button from "@/components/Button";
import Input from "@/components/Input";
import Select from "@/components/Select";
import Card from "@/components/Card";

type Appointment = {
  id: string;
  client_name: string;
  service: string;
  starts_at: string;
  ends_at: string | null;
  client_id: string | null;
  client_email: string | null;
  notes: string | null;
};

type Service = { id: string; name: string; duration_minutes: number };
type Client = { id: string; name: string; email: string | null };

function pad(n: number) {
  return String(n).padStart(2, "0");
}

// One date format everywhere: 12.10.2026 14:30
function formatDateTime(d: Date) {
  return `${pad(d.getDate())}.${pad(d.getMonth() + 1)}.${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function formatTime(d: Date) {
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

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
  const day = today.getDay();
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
  const { t } = useLanguage();

  const [email, setEmail] = useState("");
  const [userId, setUserId] = useState("");
  const [plan, setPlan] = useState("free");
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [clients, setClients] = useState<Client[]>([]);

  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [clientId, setClientId] = useState("");
  const [clientName, setClientName] = useState("");
  const [clientEmail, setClientEmail] = useState("");
  const [service, setService] = useState("");
  const [startsAt, setStartsAt] = useState("");
  const [notes, setNotes] = useState("");

  const [search, setSearch] = useState("");
  const [weekOffset, setWeekOffset] = useState(0);
  const [message, setMessage] = useState("");

  async function loadAppointments() {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("appointments")
      .select("*")
      .order("starts_at", { ascending: true });
    if (error) setMessage(error.message);
    else setAppointments(data ?? []);
  }

  async function loadPlan() {
    const supabase = createClient();
    const { data } = await supabase.from("profiles").select("plan").single();
    setPlan(data?.plan ?? "free");
  }

  async function loadServices() {
    const supabase = createClient();
    const { data } = await supabase
      .from("services")
      .select("id, name, duration_minutes")
      .order("name", { ascending: true });
    setServices(data ?? []);
  }

  async function loadClients() {
    const supabase = createClient();
    const { data } = await supabase
      .from("clients")
      .select("id, name, email")
      .order("name", { ascending: true });
    setClients(data ?? []);
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
        loadPlan();
        loadServices();
        loadClients();
      }
    });
  }, [router]);

  function resetForm() {
    setEditingId(null);
    setClientId("");
    setClientName("");
    setClientEmail("");
    setService("");
    setStartsAt("");
    setNotes("");
  }

  function openNew() {
    resetForm();
    setMessage("");
    setOpen(true);
  }

  function closeModal() {
    setOpen(false);
    resetForm();
  }

  function handleSelectClient(id: string) {
    setClientId(id);
    const match = clients.find((c) => c.id === id);
    if (match) {
      setClientName(match.name);
      setClientEmail(match.email ?? "");
    }
  }

  function computeEnd(startIso: string, serviceName: string) {
    const match = services.find((s) => s.name === serviceName);
    const minutes = match ? match.duration_minutes : 30;
    return new Date(new Date(startIso).getTime() + minutes * 60000);
  }

  function endTimeFor(a: Appointment) {
    const match = services.find((s) => s.name === a.service);
    if (!match) return "";
    const end = new Date(
      new Date(a.starts_at).getTime() + match.duration_minutes * 60000,
    );
    return formatTime(end);
  }

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    const date = new Date(startsAt);
    if (isNaN(date.getTime())) {
      setMessage(t.invalidDate);
      return;
    }
    const supabase = createClient();
    const newEnd = computeEnd(date.toISOString(), service);
    const overlaps = appointments.some(
      (a) =>
        a.id !== editingId &&
        new Date(a.starts_at) < newEnd &&
        new Date(a.ends_at ?? a.starts_at) > date,
    );
    if (overlaps) {
      setMessage(t.overlap);
      return;
    }

    const values = {
      client_name: clientName,
      service,
      starts_at: date.toISOString(),
      ends_at: newEnd.toISOString(),
      notes: notes || null,
      client_id: clientId || null,
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
      setMessage(editingId ? t.updated : t.added);
      closeModal();
      loadAppointments();
    }
  }

  function handleEdit(a: Appointment) {
    setEditingId(a.id);
    setClientId(a.client_id ?? "");
    setClientName(a.client_name);
    setClientEmail(a.client_email ?? "");
    setService(a.service);
    setStartsAt(toLocalInputValue(a.starts_at));
    setNotes(a.notes ?? "");
    setMessage("");
    setOpen(true);
  }

  async function handleDelete(id: string) {
    const supabase = createClient();
    const { error } = await supabase.from("appointments").delete().eq("id", id);
    if (error) {
      setMessage(error.message);
    } else {
      setMessage(t.deleted);
      loadAppointments();
    }
  }

  async function callApi(path: string, body?: object) {
    const supabase = createClient();
    const { data } = await supabase.auth.getSession();
    const token = data.session?.access_token;
    const res = await fetch(path, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: body ? JSON.stringify(body) : undefined,
    });
    return res.json();
  }

  async function handleUpgrade() {
    const json = await callApi("/api/checkout");
    if (json.url) window.location.href = json.url;
    else setMessage(json.error ?? t.error);
  }

  async function handleManage() {
    const json = await callApi("/api/portal");
    if (json.url) window.location.href = json.url;
    else setMessage(json.error ?? t.error);
  }

  async function handleRemind(id: string) {
    const json = await callApi("/api/remind", { appointmentId: id });
    setMessage(json.sent ? t.reminderSent : (json.error ?? t.error));
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
    <>
      <Navbar />
      <main className="mx-auto max-w-6xl p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold">{t.navDashboard}</h1>
            <p className="text-sm text-slate-500">{email}</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={`rounded-full px-3 py-1 text-xs font-bold ${
                plan === "pro"
                  ? "bg-green-100 text-green-700"
                  : "bg-slate-200 text-slate-600"
              }`}
            >
              {plan === "pro" ? t.pro : t.free}
            </span>
            {plan === "pro" ? (
              <Button variant="secondary" onClick={handleManage}>
                {t.manage}
              </Button>
            ) : (
              <Button variant="secondary" onClick={handleUpgrade}>
                {t.upgrade}
              </Button>
            )}
            <Button onClick={openNew}>+ {t.newAppointment}</Button>
          </div>
        </div>

        {message && (
          <p className="mt-4 rounded-lg border border-blue-200 bg-blue-50 p-3 text-sm text-blue-800">
            {message}
          </p>
        )}

        <Card className="mt-6 p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-lg font-bold">
              {t.weekOf} {pad(weekDays[0].getDate())}.
              {pad(weekDays[0].getMonth() + 1)}
            </h2>
            <div className="flex gap-2">
              <Button
                variant="secondary"
                onClick={() => setWeekOffset(weekOffset - 1)}
              >
                {t.previous}
              </Button>
              <Button variant="secondary" onClick={() => setWeekOffset(0)}>
                {t.today}
              </Button>
              <Button
                variant="secondary"
                onClick={() => setWeekOffset(weekOffset + 1)}
              >
                {t.next}
              </Button>
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
                  className={`min-h-36 rounded-lg border p-2 ${
                    isToday
                      ? "border-blue-500 bg-blue-50/50"
                      : "border-slate-200"
                  }`}
                >
                  <p className="text-xs font-bold uppercase text-slate-500">
                    {t.days[(day.getDay() + 6) % 7]}
                  </p>
                  <p className="text-lg font-bold">{day.getDate()}</p>
                  <div className="mt-2 flex flex-col gap-2">
                    {dayAppointments.map((a) => (
                      <div
                        key={a.id}
                        className="cursor-pointer rounded-md bg-blue-600 p-2 text-xs text-white hover:bg-blue-700"
                        onClick={() => handleEdit(a)}
                      >
                        <p className="font-bold">
                          {formatTime(new Date(a.starts_at))}
                          {endTimeFor(a) && `–${endTimeFor(a)}`}
                        </p>
                        <p>{a.client_name}</p>
                        <p className="text-blue-100">{a.service}</p>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </Card>

        <Card className="mt-6 p-5">
          <h2 className="text-lg font-bold">
            {t.appointments} ({filteredAppointments.length})
          </h2>
          <Input
            className="mt-3"
            placeholder={t.search}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />

          {appointments.length === 0 ? (
            <p className="mt-4 text-slate-500">{t.empty}</p>
          ) : filteredAppointments.length === 0 ? (
            <p className="mt-4 text-slate-500">{t.noMatches}</p>
          ) : (
            <div className="mt-4 flex flex-col gap-6">
              {groups.map((g) => (
                <div key={g.label}>
                  <h3 className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-500">
                    {t.groups[g.label as keyof typeof t.groups]} (
                    {g.items.length})
                  </h3>
                  <ul className="flex flex-col gap-2">
                    {g.items.map((a) => (
                      <li
                        key={a.id}
                        className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-slate-200 p-3"
                      >
                        <div>
                          <p className="font-bold">{a.client_name}</p>
                          <p className="text-sm text-blue-600">{a.service}</p>
                          <p className="text-sm text-slate-500">
                            {formatDateTime(new Date(a.starts_at))}
                            {endTimeFor(a) && ` – ${endTimeFor(a)}`}
                          </p>
                          {a.client_email && (
                            <p className="text-sm text-slate-500">
                              {a.client_email}
                            </p>
                          )}
                          {a.notes && <p className="mt-1 text-sm">{a.notes}</p>}
                        </div>
                        <div className="flex gap-2">
                          {a.client_email && (
                            <Button
                              variant="secondary"
                              onClick={() => handleRemind(a.id)}
                            >
                              {t.remind}
                            </Button>
                          )}
                          <Button
                            variant="secondary"
                            onClick={() => handleEdit(a)}
                          >
                            {t.edit}
                          </Button>
                          <Button
                            variant="danger"
                            onClick={() => handleDelete(a.id)}
                          >
                            {t.delete}
                          </Button>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          )}
        </Card>
      </main>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4"
          onClick={closeModal}
        >
          <Card
            className="w-full max-w-md p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-lg font-bold">
              {editingId ? t.editAppointment : t.newAppointment}
            </h2>
            {message && <p className="mt-3 text-sm text-red-600">{message}</p>}
            <form onSubmit={handleAdd} className="mt-4 flex flex-col gap-3">
              <Select
                value={clientId}
                onChange={(e) => handleSelectClient(e.target.value)}
              >
                <option value="">{t.selectClient}</option>
                {clients.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </Select>
              <Input
                placeholder={t.clientName}
                value={clientName}
                onChange={(e) => setClientName(e.target.value)}
                required
              />
              <Select
                value={service}
                onChange={(e) => setService(e.target.value)}
                required
              >
                <option value="">{t.selectService}</option>
                {services.map((s) => (
                  <option key={s.id} value={s.name}>
                    {s.name} ({s.duration_minutes} {t.min})
                  </option>
                ))}
              </Select>
              {services.length === 0 && (
                <p className="text-xs text-slate-500">{t.noServices}</p>
              )}
              <Input
                type="datetime-local"
                value={startsAt}
                onChange={(e) => setStartsAt(e.target.value)}
                required
              />
              <Input
                type="email"
                placeholder={t.clientEmail}
                value={clientEmail}
                onChange={(e) => setClientEmail(e.target.value)}
              />
              <Input
                placeholder={t.notes}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
              <div className="mt-2 flex justify-end gap-2">
                <Button type="button" variant="secondary" onClick={closeModal}>
                  {t.cancel}
                </Button>
                <Button type="submit">{editingId ? t.save : t.add}</Button>
              </div>
            </form>
          </Card>
        </div>
      )}
    </>
  );
}
