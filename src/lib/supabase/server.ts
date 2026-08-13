import "server-only";
import { createClient } from "@supabase/supabase-js";

// Server-only Supabase client using the service role key. This must never be
// imported from a client component — the service role key bypasses RLS and
// grants full database + storage access.
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !serviceKey) {
  throw new Error(
    "Missing Supabase env vars: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set."
  );
}

export const supabaseAdmin = createClient(url, serviceKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

export const STORAGE_BUCKET = "design-inspirations";
