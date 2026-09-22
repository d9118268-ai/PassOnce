import { createServerClient } from "@supabase/ssr";
import { createClient as createSupabaseJsClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";

// Used from Server Components, Route Handlers (app/api/**/route.ts), and
// Server Actions — anywhere that needs to read the logged-in user's session
// from cookies. Still uses the publishable key: Supabase resolves the
// user's identity from their session cookie/JWT, not from this key.
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // setAll is called from a Server Component sometimes, where
            // cookies can't be written — safe to ignore if middleware
            // is also refreshing the session (see middleware.ts).
          }
        },
      },
    }
  );
}

// For trusted server-only operations that must bypass RLS entirely
// (e.g. admin scripts). NEVER import this into anything that runs in the
// browser — the secret key grants full access to every table.
export function createAdminClient() {
  return createSupabaseJsClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SECRET_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}