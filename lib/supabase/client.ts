import { createClient } from "@supabase/supabase-js";
import { Database } from "./types";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Next.js caches `fetch()` GETs by default; supabase-js queries go through
// fetch, so without this every read can be served stale. Force no-store.
const noStoreFetch: typeof fetch = (input, init) =>
  fetch(input, { ...init, cache: "no-store" });

/**
 * Anon (public) client — respects RLS, so it only ever sees `published = true`
 * rows. Safe to use anywhere, including the browser. Used by the public site.
 */
export function getPublicClient() {
  return createClient<Database>(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: { persistSession: false },
    global: { fetch: noStoreFetch },
  });
}

/**
 * Service-role client — bypasses RLS. SERVER-ONLY (sync route, admin routes).
 * Never import this into client components.
 */
export function getServiceClient() {
  if (!SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error(
      "SUPABASE_SERVICE_ROLE_KEY is not set — required for admin/sync operations."
    );
  }
  return createClient<Database>(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { fetch: noStoreFetch },
  });
}
