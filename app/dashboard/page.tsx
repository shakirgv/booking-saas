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

const inputClass = "w-72 rounded border border-gray-500 bg-gray-800 p-2 text-white placeholder-gray-400";

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
            client_name: clientName, service,
            starts_at: date.toISOString(),
            notes: notes || null,
        };
        
        const { error } = editingId
        ? await supabase.from("appointments").update(values).eq("id", editingId)
        : await supabase.from("appointments").insert({ ...values, user_id: userId });

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
    if (json.url){
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

return (
    <main className="flex min-h-screen flex-col items-center gap-6 p-8">
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p>Signed in as {email}</p>

        <form onSubmit={handleAdd} className="flex flex-col gap-3">
            <input
            className={inputClass}
            placeholder="Client Name"
            value={clientName}
            onChange={(e) => setClientname(e.target.value)}
            required
            />
            <input 
            className={inputClass}
            placeholder="Service (e.g. Haircut)"
            value={service}
            onChange={(e) => setService(e.target.value)}
            required
            />
            <input
  className={inputClass}
  type="datetime-local"
  value={startsAt}
  onChange={(e) => setStartsAt(e.target.value)}
  required
/>

            <input 
            className={inputClass}
            placeholder="Notes (optional)"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
        />
        <button type="submit" className="rounded bg-blue-500 px-4 py-2">
        <button type="submit" className="rounded bg-blue-500 px-4 py-2">
            {editingId ? "Save changes" : "Add appointment"}
        </button>
        </button>
        </form>

        <p>{message}</p>

        <ul className="flex w-full max-w-md flex-col gap-2">
            {appointments.map((a) =>(
                <li key={a.id} className="rounded border border-gray-600 p-3">
                    <p className="font-bold">{a.client_name} - {a.service}</p>
                    <p className="text-sm text-gray-400">
                        {new Date(a.starts_at).toLocaleString()}
                    </p>
                    {a.notes && <p className="text-sm">{a.notes}</p>}
                    <button
                    className="mt-2 mr-2 rounded bg-gray-600 px-3 py-1 text-sm"
                    onClick={() => handleEdit(a)}>
                    Edit
                    </button>
                    <button 
                    className="mt-2 rounded bg-red-600 px-3 py-1 text-sm"
                    onClick={() => handleDelete(a.id)}> 
                    Delete 
                    </button>
                </li>
            ))}
        </ul>

            <button className="rounded bg-green-600 px-4 py-2" onClick={handleUpgrade}>
                Upgrade to Pro
            </button>

        <button className="rounded bg-gray-600 px-4 py-2" onClick={handleSignOut}>
            Sign out
        </button>
    </main>
    );
}