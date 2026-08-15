import "server-only";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";

/**
 * Bypasses RLS with the service role key. Only for trusted server code
 * (route handlers) that already authorized the caller itself — never
 * expose this client or its key to the browser.
 */
export function createAdminClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}
