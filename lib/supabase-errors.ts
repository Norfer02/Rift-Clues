export const missingSupabaseEnvErrorMessage =
  "Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY. Add both variables in Vercel before using rooms.";

export const blockedClientSupabaseWriteErrorMessage =
  "Direct Supabase writes from the browser are blocked. Use Next.js API routes for mutations instead.";
