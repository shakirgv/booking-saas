"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase";
import { useRouter } from "next/navigation";

export default function LoginPage() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [message, setMessage] = useState("");
    const router = useRouter();

    async function handleSignUp() {
        const supabase = createClient();
        const { error } = await supabase.auth.signUp({ email, password });
        setMessage(error ? error.message : "Signed up successfully!");
    }

    async function handleSignIn() {
        const supabase = createClient();
        const { error } = await supabase.auth.signInWithPassword({ email, password});
        if (error) {
            setMessage(error.message);
        } else {
            router.push("/dashboard");
        }
    }

    return (
        <main className="flex min-h-screen flex-col items-center justify-center gap-4">
            <h1 className="text-3x1 font-bold">Login</h1>
            <input
            className="w-72 rounded border border-gray-500 bg-gray-800 p-2 text-white placeholder-gray-400"
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            />
            <input
            className="w-72 rounded border border-gray-500 bg-gray-800 p-2 text-white placeholder-gray-400"
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            />
            <div className="flex gap-2">
                <button className="rounded bg-blue-500 px-4 py-2" onClick={handleSignIn}>
                    Sign in
                </button>
                <button className="rounded bg-gray-600 px-4 py-2" onClick={handleSignUp}>
                    Sign up
                </button>
            </div>
            <p>{message}</p>
        </main>
    );
}