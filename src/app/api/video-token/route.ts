export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';
import { createClient } from '@supabase/supabase-js';
import { createHmac, timingSafeEqual } from 'crypto';
import { isDbPaywallEnabled, isValidHttpUrl, isValidYouTubeVideoId, parseSupportedVideoSource } from '@/lib/utils';
import { isAddress } from 'viem';

function getDb() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

function getSecret() {
  return process.env.VIDEO_TOKEN_SECRET || process.env.SUPABASE_SERVICE_ROLE_KEY || '';
}

type TokenPayload = { v: string; k: 'yt' | 'embed'; yt?: string; e?: string; exp: number };

function signToken(payload: TokenPayload): string {
  const secret = getSecret();
  if (!secret) throw new Error('VIDEO_TOKEN_SECRET or SUPABASE_SERVICE_ROLE_KEY required');
  const body = Buffer.from(JSON.stringify(payload), 'utf8').toString('base64url');
  const sig = createHmac('sha256', secret).update(body).digest('base64url');
  return `${body}.${sig}`;
}

function verifySignedToken(token: string): TokenPayload | null {
  const secret = getSecret();
  if (!secret) return null;
  const i = token.indexOf('.');
  if (i <= 0) return null;
  const body = token.slice(0, i);
  const sig = token.slice(i + 1);
  const expected = createHmac('sha256', secret).update(body).digest('base64url');
  try {
    const a = Buffer.from(sig, 'utf8');
    const b = Buffer.from(expected, 'utf8');
    if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  } catch {
    return null;
  }
  try {
    const json = JSON.parse(Buffer.from(body, 'base64url').toString('utf8')) as TokenPayload;
    if (!json.v || (json.k !== 'yt' && json.k !== 'embed') || typeof json.exp !== 'number') return null;
    if (json.k === 'yt' && (!json.yt || !isValidYouTubeVideoId(json.yt))) return null;
    if (json.k === 'embed' && (!json.e || !isValidHttpUrl(json.e))) return null;
    return json;
  } catch {
    return null;
  }
}

async function getSessionUser() {
  const cookieStore = cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get: (n: string) => cookieStore.get(n)?.value,
        set: (n: string, v: string, o: Record<string, unknown>) =>
          cookieStore.set({ name: n, value: v, ...o }),
        remove: (n: string, o: Record<string, unknown>) =>
          cookieStore.set({ name: n, value: '', ...o }),
      },
    }
  );
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) return null;
  return user;
}

/** POST: issues signed token for YouTube embed (does not expose ID in HTML before unlock). */
export async function POST(req: NextRequest) {
  try {
    const user = await getSessionUser();

    const body = await req.json().catch(() => ({}));
    const videoId = typeof body.videoId === 'string' ? body.videoId.trim() : '';
    const siteSlug = typeof body.siteSlug === 'string' ? body.siteSlug.trim().toLowerCase() : '';
    const walletAddressRaw = typeof body.walletAddress === 'string' ? body.walletAddress.trim().toLowerCase() : '';
    const walletAddress = isAddress(walletAddressRaw) ? walletAddressRaw : '';

    if (!videoId) {
      return NextResponse.json({ error: 'videoId is required' }, { status: 400 });
    }

    const db = getDb();
    const { data: video, error: vErr } = await db
      .from('mini_site_videos')
      .select('id, site_id, youtube_video_id, video_url, paywall_enabled, paywall_price')
      .eq('id', videoId)
      .maybeSingle();

    if (vErr) {
      console.error('[video-token]', vErr);
      return NextResponse.json({ error: 'Error loading video' }, { status: 500 });
    }
    if (!video) {
      return NextResponse.json({ error: 'Video not found' }, { status: 404 });
    }

    const { data: site } = await db
      .from('mini_sites')
      .select('id, slug, user_id, published')
      .eq('id', (video as { site_id: string }).site_id)
      .maybeSingle();

    if (!site) {
      return NextResponse.json({ error: 'Site not found' }, { status: 404 });
    }

    const s = site as { slug: string; user_id: string; published: boolean };
    if (siteSlug && s.slug.toLowerCase() !== siteSlug) {
      return NextResponse.json({ error: 'Invalid slug' }, { status: 400 });
    }
    const isOwner = !!user && user.id === s.user_id;
    if (!s.published && !isOwner) {
      return NextResponse.json({ error: 'Unavailable' }, { status: 403 });
    }

    const paywall = isDbPaywallEnabled((video as { paywall_enabled?: unknown }).paywall_enabled);

    // Visitante pode desbloquear via login (paywall_unlocks) OU wallet (paywall_unlock_wallets).
    if (paywall && !isOwner) {
      let unlocked = false;

      if (user) {
        const { data: unlockUser } = await db
          .from('paywall_unlocks' as never)
          .select('id')
          .eq('user_id', user.id)
          .eq('video_id', videoId)
          .gt('expires_at', new Date().toISOString())
          .maybeSingle();
        unlocked = !!unlockUser;
      }

      if (!unlocked && walletAddress) {
        const { data: unlockWallet } = await db
          .from('paywall_unlock_wallets' as never)
          .select('id')
          .eq('wallet_address', walletAddress)
          .eq('video_id', videoId)
          .gt('expires_at', new Date().toISOString())
          .maybeSingle();
        unlocked = !!unlockWallet;
      }

      if (!unlocked) {
        if (!user && !walletAddress) {
          return NextResponse.json({ error: 'Login or wallet required' }, { status: 401 });
        }
        return NextResponse.json({ error: 'Paywall' }, { status: 402 });
      }
    }

    const ytRaw = (video as { youtube_video_id?: string | null }).youtube_video_id;
    const extRaw = (video as { video_url?: string | null }).video_url;
    const yt = typeof ytRaw === 'string' ? ytRaw.trim() : '';
    const ext = typeof extRaw === 'string' ? extRaw.trim() : '';
    if (!isValidYouTubeVideoId(yt) && !ext) {
      return NextResponse.json({ error: 'Invalid video source' }, { status: 400 });
    }

    const exp = Math.floor(Date.now() / 1000) + 3600;
    let token: string;
    if (isValidYouTubeVideoId(yt)) {
      token = signToken({ v: videoId, k: 'yt', yt, exp });
    } else {
      const source = parseSupportedVideoSource(ext);
      if (!source || source.kind !== 'embed') {
        return NextResponse.json({ error: 'Unsupported embed source' }, { status: 400 });
      }
      token = signToken({ v: videoId, k: 'embed', e: source.embedUrl, exp });
    }

    return NextResponse.json({ token });
  } catch (e) {
    console.error('[video-token] POST', e);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}

/** GET: validates token and returns source for iframe (no session required). */
export async function GET(req: NextRequest) {
  const t = req.nextUrl.searchParams.get('t');
  if (!t) {
    return NextResponse.json({ valid: false });
  }
  const payload = verifySignedToken(t);
  if (!payload || payload.exp < Math.floor(Date.now() / 1000)) {
    return NextResponse.json({ valid: false });
  }
  if (payload.k === 'yt') return NextResponse.json({ valid: true, sourceType: 'yt', ytId: payload.yt });
  return NextResponse.json({ valid: true, sourceType: 'embed', embedUrl: payload.e });
}
