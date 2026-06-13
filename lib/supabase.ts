import "server-only";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/**
 * Server-side Supabase client using the service-role key. This bypasses Row
 * Level Security, so it must NEVER be imported into client components — the
 * "server-only" guard above turns any such import into a build error.
 *
 * The client is created lazily so that simply importing this module (e.g. during
 * `next build` graph analysis) doesn't throw when env vars are absent; the error
 * only surfaces when a query is actually attempted.
 */
let client: SupabaseClient | null = null;

export function supabase(): SupabaseClient {
  if (client) return client;

  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error(
      "Supabase env missing: set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY"
    );
  }

  client = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  return client;
}
