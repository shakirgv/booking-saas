import { createBrowserClient } from "@supabase/ssr";

// Creates a client we use to talk to Supabase from the browser
export function createClient() {
    return createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!
    );
}