import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();

export const missingSupabaseEnvErrorMessage =
  "Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY. Add both variables in Vercel before using rooms.";

let supabaseClient: SupabaseClient | null = null;

function getConfiguredSupabaseClient() {
  if (!supabaseUrl || !supabaseAnonKey) {
    console.error(missingSupabaseEnvErrorMessage, {
      hasSupabaseUrl: Boolean(supabaseUrl),
      hasSupabaseAnonKey: Boolean(supabaseAnonKey),
    });
    throw new Error(missingSupabaseEnvErrorMessage);
  }

  if (!supabaseClient) {
    supabaseClient = createClient(supabaseUrl, supabaseAnonKey);
  }

  return supabaseClient;
}

export function getSupabase() {
  return getConfiguredSupabaseClient();
}

export const supabase = new Proxy({} as SupabaseClient, {
  get(_target, property) {
    const client = getConfiguredSupabaseClient();
    const value = client[property as keyof SupabaseClient];

    if (typeof value === "function") {
      return value.bind(client);
    }

    return value;
  },
});
