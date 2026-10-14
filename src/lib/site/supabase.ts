import { createClient } from "@supabase/supabase-js";

// Use placeholder values during build when env vars aren't set yet
const url = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://placeholder.supabase.co";
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "placeholder-service-key";
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "placeholder-anon-key";

/** Server-side client (service role — full access, use in API routes only) */
export const supabaseAdmin = createClient(url, serviceKey);

/** Client-side client (anon key — limited access, safe for browser) */
export const supabaseClient = createClient(url, anonKey);
