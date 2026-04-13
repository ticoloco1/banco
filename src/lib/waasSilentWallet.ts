import type { SupabaseClient } from '@supabase/supabase-js';
import { generatePrivateKey, privateKeyToAccount } from 'viem/accounts';
import { encryptHexPrivateKey } from '@/lib/internalWalletCrypto';

export type SilentWalletResult =
  | { ok: true; walletAddress: string; provider: 'privy' | 'custodial_viem' }
  | { ok: false; reason: 'already_has_wallet' | 'skipped_no_provider' | 'error'; detail?: string };

type PrivyProvisionOk = { walletAddress: string; privyUserId: string };

/**
 * Privy WaaS: cria utilizador com embedded wallet.
 * Env: PRIVY_APP_ID, PRIVY_APP_SECRET
 * @see https://docs.privy.io/reference/api/create-a-user
 */
async function tryPrivyProvision(googleSubject: string | null, _email: string | null): Promise<PrivyProvisionOk | null> {
  const appId = (process.env.PRIVY_APP_ID || '').trim();
  const secret = (process.env.PRIVY_APP_SECRET || '').trim();
  if (!appId || !secret || !googleSubject) return null;

  const basic = Buffer.from(`${appId}:${secret}`).toString('base64');
  const body = {
    create_embedded_wallet: true,
    linked_accounts: [{ type: 'google_oauth', subject: googleSubject }],
  };

  try {
    const res = await fetch('https://api.privy.io/v1/users', {
      method: 'POST',
      headers: {
        Authorization: `Basic ${basic}`,
        'Content-Type': 'application/json',
        'privy-app-id': appId,
      },
      body: JSON.stringify(body),
    });
    const json = (await res.json().catch(() => ({}))) as Record<string, unknown>;
    if (!res.ok) {
      console.warn('[silent-wallet] Privy API error', res.status, json);
      return null;
    }
    const id = String(json.id || json.user_id || '').trim();
    const wallets = (json.wallets || json.embedded_wallets || []) as { address?: string }[];
    const addr = String(wallets[0]?.address || '').trim().toLowerCase();
    if (!/^0x[a-f0-9]{40}$/.test(addr)) {
      console.warn('[silent-wallet] Privy response missing wallet', json);
      return null;
    }
    return { walletAddress: addr, privyUserId: id || googleSubject };
  } catch (e) {
    console.warn('[silent-wallet] Privy fetch failed', e);
    return null;
  }
}

async function syncWalletToKycIfEmpty(db: SupabaseClient, userId: string, address: string) {
  const { data: kyc } = await db.from('user_kyc_status' as any).select('*').eq('user_id', userId).maybeSingle();
  const cur = String((kyc as { wallet_address?: string } | null)?.wallet_address || '').trim();
  if (/^0x[a-f0-9]{40}$/i.test(cur)) return;
  const row = kyc as Record<string, unknown> | null;
  await db.from('user_kyc_status' as any).upsert(
    {
      user_id: userId,
      wallet_address: address.toLowerCase(),
      kyc_verified: Boolean(row?.kyc_verified),
      full_name: row?.full_name ?? null,
      city: row?.city ?? null,
      email: row?.email ?? null,
      consent_nft_ads: Boolean(row?.consent_nft_ads),
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'user_id' },
  );
}

/**
 * Após login Google (Supabase): garante wallet se o utilizador ainda não tem endereço Polygon registado.
 * Ordem: Privy (se env) → custodial viem (se SILENT_WALLET_FALLBACK_CUSTODIAL=1 e WALLET_MASTER_SECRET).
 */
export async function ensureSilentWalletOnGoogleLogin(
  db: SupabaseClient,
  params: { userId: string; email: string | null; googleSubject: string | null },
): Promise<SilentWalletResult> {
  const { userId, email, googleSubject } = params;

  const { data: sw } = await db
    .from('user_silent_wallets' as any)
    .select('wallet_address, provider')
    .eq('user_id', userId)
    .maybeSingle();
  if (sw && /^0x[a-f0-9]{40}$/i.test(String((sw as { wallet_address?: string }).wallet_address || ''))) {
    const p = (sw as { provider?: string }).provider === 'privy' ? 'privy' : 'custodial_viem';
    return {
      ok: true,
      walletAddress: String((sw as { wallet_address: string }).wallet_address).toLowerCase(),
      provider: p,
    };
  }

  const { data: kyc } = await db.from('user_kyc_status' as any).select('wallet_address').eq('user_id', userId).maybeSingle();
  if (/^0x[a-f0-9]{40}$/i.test(String((kyc as { wallet_address?: string } | null)?.wallet_address || ''))) {
    return { ok: false, reason: 'already_has_wallet' };
  }

  const privy = await tryPrivyProvision(googleSubject, email);
  if (privy) {
    await db.from('user_silent_wallets' as any).upsert(
      {
        user_id: userId,
        wallet_address: privy.walletAddress,
        provider: 'privy',
        privy_user_id: privy.privyUserId,
        encrypted_private_key: null,
        enc_iv: null,
        enc_auth_tag: null,
        enc_salt: null,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'user_id' },
    );
    await syncWalletToKycIfEmpty(db, userId, privy.walletAddress);
    return { ok: true, walletAddress: privy.walletAddress, provider: 'privy' };
  }

  const allowCustodial = process.env.SILENT_WALLET_FALLBACK_CUSTODIAL === '1';
  const master = (process.env.WALLET_MASTER_SECRET || '').trim();
  if (!allowCustodial || master.length < 32) {
    console.warn(
      '[silent-wallet] Configure PRIVY_APP_ID + PRIVY_APP_SECRET, ou SILENT_WALLET_FALLBACK_CUSTODIAL=1 com WALLET_MASTER_SECRET (min 32 chars).',
    );
    return { ok: false, reason: 'skipped_no_provider' };
  }

  try {
    const pk = generatePrivateKey();
    const acc = privateKeyToAccount(pk);
    const address = acc.address.toLowerCase();
    const enc = encryptHexPrivateKey(pk, userId, master);
    await db.from('user_silent_wallets' as any).upsert(
      {
        user_id: userId,
        wallet_address: address,
        provider: 'custodial_viem',
        privy_user_id: null,
        encrypted_private_key: enc.ciphertextB64,
        enc_iv: enc.ivB64,
        enc_auth_tag: enc.authTagB64,
        enc_salt: enc.saltB64,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'user_id' },
    );
    await syncWalletToKycIfEmpty(db, userId, address);
    return { ok: true, walletAddress: address, provider: 'custodial_viem' };
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'unknown';
    console.error('[silent-wallet] custodial provision failed', e);
    return { ok: false, reason: 'error', detail: msg };
  }
}
