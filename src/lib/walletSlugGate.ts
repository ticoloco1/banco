import type { SupabaseClient } from '@supabase/supabase-js';
import { isValidEvmAddress } from '@/lib/slugNftThirdwebMint';

/** Carteira Polygon registada (KYC ou mini-site). */
export async function getUserPolygonWallet(
  db: SupabaseClient,
  userId: string,
): Promise<string | null> {
  const { data: kyc } = await db
    .from('user_kyc_status' as any)
    .select('wallet_address')
    .eq('user_id', userId)
    .maybeSingle();
  const k = String((kyc as { wallet_address?: string | null } | null)?.wallet_address || '').trim();
  if (isValidEvmAddress(k)) return k.toLowerCase();

  const { data: sites } = await db
    .from('mini_sites')
    .select('wallet_address, updated_at')
    .eq('user_id', userId)
    .order('updated_at', { ascending: false })
    .limit(5);
  for (const row of sites || []) {
    const w = String((row as { wallet_address?: string | null }).wallet_address || '').trim();
    if (isValidEvmAddress(w)) return w.toLowerCase();
  }
  return null;
}

export async function userHasRegisteredWallet(db: SupabaseClient, userId: string): Promise<boolean> {
  const w = await getUserPolygonWallet(db, userId);
  return !!w;
}
