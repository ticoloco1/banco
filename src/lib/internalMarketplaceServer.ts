import type { SupabaseClient } from '@supabase/supabase-js';

export const INTERNAL_MARKET_POOL_KEY = 'internal_market_admin_pool_usdc';

export async function readInternalAdminPoolUsd(db: SupabaseClient): Promise<number> {
  const { data } = await db
    .from('platform_settings' as any)
    .select('value')
    .eq('key', INTERNAL_MARKET_POOL_KEY)
    .maybeSingle();
  const n = Number(String((data as { value?: string } | null)?.value || '0'));
  return Number.isFinite(n) && n >= 0 ? n : 0;
}

export async function writeInternalAdminPoolUsd(db: SupabaseClient, usd: number): Promise<void> {
  await db.from('platform_settings' as any).upsert(
    { key: INTERNAL_MARKET_POOL_KEY, value: usd.toFixed(2), updated_at: new Date().toISOString() },
    { onConflict: 'key' },
  );
}

export async function readInternalBalance(db: SupabaseClient, userId: string): Promise<number> {
  const { data } = await db
    .from('user_internal_usdc_balance' as any)
    .select('balance_usdc')
    .eq('user_id', userId)
    .maybeSingle();
  const n = Number((data as { balance_usdc?: number | string } | null)?.balance_usdc ?? 0);
  return Number.isFinite(n) && n >= 0 ? n : 0;
}

export async function adjustInternalBalance(
  db: SupabaseClient,
  userId: string,
  delta: number,
  kind: string,
  refId: string | null,
  meta: Record<string, unknown> = {},
): Promise<number> {
  const cur = await readInternalBalance(db, userId);
  const next = Number((cur + delta).toFixed(2));
  if (next < -1e-9) throw new Error('insufficient_internal_balance');
  await db.from('user_internal_usdc_balance' as any).upsert(
    { user_id: userId, balance_usdc: next, updated_at: new Date().toISOString() },
    { onConflict: 'user_id' },
  );
  await db.from('user_internal_usdc_ledger' as any).insert({
    user_id: userId,
    amount_usdc: delta,
    kind,
    ref_id: refId,
    meta,
  });
  return next;
}
