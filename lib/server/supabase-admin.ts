import "server-only";

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();

export const missingSupabaseServiceRoleErrorMessage =
  "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY. Add both variables before using secure lobby routes.";

let supabaseAdminClient: SupabaseClient | null = null;

function getConfiguredSupabaseAdminClient() {
  if (!supabaseUrl || !supabaseServiceRoleKey) {
    console.error(missingSupabaseServiceRoleErrorMessage, {
      hasSupabaseUrl: Boolean(supabaseUrl),
      hasSupabaseServiceRoleKey: Boolean(supabaseServiceRoleKey),
    });
    throw new Error(missingSupabaseServiceRoleErrorMessage);
  }

  if (!supabaseAdminClient) {
    supabaseAdminClient = createClient(supabaseUrl, supabaseServiceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });
  }

  return supabaseAdminClient;
}

export function getSupabaseAdmin() {
  return getConfiguredSupabaseAdminClient();
}
