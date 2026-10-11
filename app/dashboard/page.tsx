"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase";

export default function DashboardPage() {
    const router = useRouter();
    const [email, setEmail] = useState("");

    useEffect(() => {
        const supabase = createClient();
        supabase.auth.getUser().then(({ data }) => {
            if (!data.user) {
                router.push("/login");
            } else {
                setEmail(data.user.email ?? " ");
            }
        });
}, [router]);

async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
}

return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4">
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p>Signed in as {email}</p>
        <button className="rounded bg-gray-600 px-4 py-2" onClick={handleSignOut}>
        Sign out
        </button>
    </main>
);
}