import { cookies } from 'next/headers';
import { redirect, notFound } from 'next/navigation';
import { createServerClient } from '@supabase/ssr';
import { Header } from '@/components/layout/Header';
import { MiniSiteStatsClient } from '@/components/stats/MiniSiteStatsClient';
import { countByField, countClickKeys } from '@/lib/analytics/trafficAggregates';
import type { SessionRow } from '@/components/stats/MiniSiteStatsClient';

export const dynamic = 'force-dynamic';

function createSupabaseServer() {
  const cookieStore = cookies();
  return createServerClient(
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
    },
  );
}

export default async function MiniSiteStatsPage({ params }: { params: { slug: string } }) {
  const raw = (params.slug || '').trim().toLowerCase();
  const slug = raw.replace(/[^a-z0-9-]/g, '');
  if (!slug) notFound();

  const supabase = createSupabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect(`/auth?redirect=${encodeURIComponent(`/stats/${slug}`)}`);
  }

  const { data: site } = await supabase
    .from('mini_sites')
    .select('id, slug, site_name')
    .eq('slug', slug)
    .maybeSingle();

  if (!site) notFound();

  const siteId = (site as { id: string }).id;
  const siteName = String((site as { site_name?: string | null }).site_name || slug);

  const { data: sessions } = await supabase
    .from('traffic_sessions' as never)
    .select(
      'id, city, region, entry_path, exit_path, duration_seconds, opened_checkout, started_at',
    )
    .eq('site_id', siteId)
    .eq('scope', 'minisite')
    .order('started_at', { ascending: false })
    .limit(2500);

  const { data: clicks } = await supabase
    .from('traffic_clicks' as never)
    .select('click_key')
    .eq('site_id', siteId)
    .order('created_at', { ascending: false })
    .limit(8000);

  const sessRows = (sessions || []) as Record<string, unknown>[];
  const topCities = countByField(sessRows, 'city', 'Desconhecida', 5);
  const topRegions = countByField(sessRows, 'region', 'Desconhecida', 5);
  const clickSummary = countClickKeys((clicks || []) as { click_key?: string | null }[]);

  const recentSessions: SessionRow[] = (sessions || []).slice(0, 40).map((r) => {
    const row = r as Record<string, unknown>;
    return {
      id: String(row.id),
      city: (row.city as string) || null,
      region: (row.region as string) || null,
      entry_path: (row.entry_path as string) || null,
      exit_path: (row.exit_path as string) || null,
      duration_seconds: typeof row.duration_seconds === 'number' ? row.duration_seconds : 0,
      opened_checkout: row.opened_checkout === true,
      started_at: (row.started_at as string) || null,
    };
  });

  return (
    <>
      <Header />
      <MiniSiteStatsClient
        slug={slug}
        siteName={siteName}
        topCities={topCities}
        topRegions={topRegions}
        clicks={clickSummary}
        recentSessions={recentSessions}
      />
    </>
  );
}
