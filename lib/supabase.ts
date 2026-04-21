import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import {
  blockedClientSupabaseWriteErrorMessage,
  missingSupabaseEnvErrorMessage,
} from "@/lib/supabase-errors";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();
const blockedMutationMethods = new Set(["insert", "update", "upsert", "delete"]);

let supabaseClient: SupabaseClient | null = null;

function isBrowser() {
  return typeof window !== "undefined";
}

function wrapQueryBuilderForClientWrites<TValue>(value: TValue): TValue {
  if (!isBrowser() || !value || typeof value !== "object") {
    return value;
  }

  return new Proxy(value, {
    get(target, property, receiver) {
      const innerValue = Reflect.get(target, property, receiver);

      if (
        typeof property === "string" &&
        blockedMutationMethods.has(property) &&
        typeof innerValue === "function"
      ) {
        return () => {
          throw new Error(blockedClientSupabaseWriteErrorMessage);
        };
      }

      return innerValue;
    },
  });
}

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

    if (property === "from" && typeof value === "function") {
      return (...args: unknown[]) => {
        const queryBuilder = (value as (...innerArgs: unknown[]) => unknown).apply(
          client,
          args,
        );
        return wrapQueryBuilderForClientWrites(queryBuilder);
      };
    }

    if (typeof value === "function") {
      return value.bind(client);
    }

    return value;
  },
});
