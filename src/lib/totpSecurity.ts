import speakeasy from 'speakeasy';
import type { SupabaseClient } from '@supabase/supabase-js';

export function generateTotpSecret(email?: string | null) {
  const secret = speakeasy.generateSecret({
    issuer: 'TrustBank',
    name: email ? `TrustBank (${email})` : 'TrustBank',
    length: 32,
  });
  return {
    base32: secret.base32,
    otpauth_url: secret.otpauth_url || null,
  };
}

export async function getTotpState(db: SupabaseClient, userId: string) {
  const { data } = await db
    .from('user_security_profiles' as any)
    .select('totp_enabled, totp_secret, totp_pending_secret')
    .eq('user_id', userId)
    .maybeSingle();
  const row = (data || {}) as {
    totp_enabled?: boolean;
    totp_secret?: string | null;
    totp_pending_secret?: string | null;
  };
  return {
    enabled: Boolean(row.totp_enabled),
    secret: row.totp_secret || null,
    pendingSecret: row.totp_pending_secret || null,
  };
}

export function verifyTotpCode(secretBase32: string, code: string) {
  return speakeasy.totp.verify({
    secret: secretBase32,
    encoding: 'base32',
    token: code,
    window: 1,
  });
}

export async function requireTotpIfEnabled(db: SupabaseClient, userId: string, code?: string | null) {
  const state = await getTotpState(db, userId);
  if (!state.enabled) return { ok: true as const };
  const token = String(code || '').trim();
  if (!token) return { ok: false as const, status: 403, error: 'totp_required' };
  if (!state.secret || !verifyTotpCode(state.secret, token)) {
    return { ok: false as const, status: 403, error: 'totp_invalid' };
  }
  return { ok: true as const };
}
