import { createServerClient } from '@supabase/ssr';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import { sanitizeAppRedirect } from '@/lib/sanitizeAppRedirect';
import { ensureSilentWalletOnGoogleLogin } from '@/lib/waasSilentWallet';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');
  const oauthError = searchParams.get('error');
  if (oauthError) {
    const authUrl = new URL('/auth', request.url);
    authUrl.searchParams.set('error', oauthError);
    const desc = searchParams.get('error_description');
    if (desc) authUrl.searchParams.set('error_description', desc);
    return NextResponse.redirect(authUrl);
  }
  if (code) {
    const cookieStore = cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { cookies: { get: (n: string) => cookieStore.get(n)?.value, set: (n: string, v: string, o: any) => cookieStore.set({ name: n, value: v, ...o }), remove: (n: string, o: any) => cookieStore.set({ name: n, value: '', ...o }) } }
    );
    const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
    if (exchangeError) {
      const authUrl = new URL('/auth', request.url);
      authUrl.searchParams.set('error', 'oauth_exchange_failed');
      authUrl.searchParams.set('error_description', exchangeError.message);
      return NextResponse.redirect(authUrl);
    }
    const { data } = await supabase.auth.getUser();
    const user = data.user;
    if (user && process.env.SUPABASE_SERVICE_ROLE_KEY) {
      const provider = String(user.app_metadata?.provider ?? '');
      const identities = Array.isArray(user.identities) ? user.identities : [];
      const googleIdentity = identities.find((it: any) => it?.provider === 'google');
      const googleId =
        typeof googleIdentity?.id === 'string'
          ? googleIdentity.id
          : typeof user.user_metadata?.sub === 'string'
            ? user.user_metadata.sub
            : null;
      const emailVerified = Boolean(user.email_confirmed_at);
      const profilePicture =
        typeof user.user_metadata?.avatar_url === 'string' ? user.user_metadata.avatar_url : null;
      try {
        const admin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY);
        await admin.from('user_auth_profiles').upsert(
          {
            user_id: user.id,
            provider,
            google_id: googleId,
            email_verified: emailVerified,
            profile_picture: profilePicture,
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'user_id' },
        );
      } catch (e) {
        console.error('[auth/callback] user_auth_profiles upsert failed', e);
      }
      try {
        if (googleId || provider === 'google') {
          await ensureSilentWalletOnGoogleLogin(admin, {
            userId: user.id,
            email: typeof user.email === 'string' ? user.email : null,
            googleSubject: googleId,
          });
        }
      } catch (e) {
        console.error('[auth/callback] silent wallet provision failed', e);
      }
    }
  }
  const redirectTo = sanitizeAppRedirect(searchParams.get('next'), '/editor');
  return NextResponse.redirect(new URL(redirectTo, request.url));
}
