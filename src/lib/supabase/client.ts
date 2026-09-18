import { createBrowserClient } from "@supabase/ssr";

// Used from client components ("use client" files like the registration
// form, login form, and dashboard). Safe to expose in the browser — the
// publishable key only ever grants what your RLS policies allow.
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!
  );
}