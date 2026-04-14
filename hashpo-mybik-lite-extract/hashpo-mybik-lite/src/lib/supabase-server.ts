/**
 * Cliente Supabase para uso em Server Components do Next.js (leitura pública).
 * Não usa sessão/cookies; só anon key para dados públicos (settings, mini_sites, etc.).
 */
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.VITE_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? process.env.VITE_SUPABASE_PUBLISHABLE_KEY;

if (!url || !anonKey) {
  console.warn("Supabase server: missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY (or VITE_* fallback)");
}

export function createServerSupabase() {
  return createClient<Database>(url!, anonKey!);
}
