import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { getServerEnv } from "@/lib/env";
import { applySystemCaIfAvailable } from "@/lib/node/system-ca";

let client: SupabaseClient | null = null;

export function getMagsterSupabase(): SupabaseClient {
  applySystemCaIfAvailable();
  const { supabaseUrl, supabaseAnonKey } = getServerEnv();

  if (!client) {
    client = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false,
      },
    });
  }

  return client;
}