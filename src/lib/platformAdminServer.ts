import { createClient } from '@supabase/supabase-js';

/**
 * Dono da plataforma (governance) — alinhar com governance/page OWNER_EMAIL + user_roles.
 */
export async function isPlatformAdminUser(user: { id: string; email?: string | null }): Promise<boolean> {
  const owner = process.env.PLATFORM_OWNER_EMAIL?.trim().toLowerCase();
  const em = user.email?.trim().toLowerCase();
  if (owner && em && em === owner) return true;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const sr = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !sr) return false;

  const db = createClient(url, sr);
  const { data } = await (db as any)
    .from('user_roles')
    .select('role')
    .eq('user_id', user.id)
    .eq('role', 'admin')
    .maybeSingle();
  return !!(data as { role?: string } | null)?.role;
}
