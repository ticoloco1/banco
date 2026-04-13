import { unstable_cache } from 'next/cache';
import { createClient } from '@supabase/supabase-js';
import type { MiniSite } from '@/hooks/useSite'; // type-only — mesmo shape que mini_sites

function normalizeSlug(slug: string): string {
  return String(slug || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, '');
}

async function fetchPublishedMiniSiteRaw(slug: string): Promise<MiniSite | null> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  const supabase = createClient(url, key);
  const { data, error } = await supabase
    .from('mini_sites')
    .select('*')
    .eq('slug', slug)
    .eq('published', true)
    .maybeSingle();
  if (error || !data) return null;
  return data as MiniSite;
}

/** Cache público (ISR) para reduzir leituras ao Supabase em visitantes. */
export async function fetchPublishedMiniSiteForSsr(slug: string): Promise<MiniSite | null> {
  const s = normalizeSlug(slug);
  if (!s) return null;
  const cached = unstable_cache(
    async () => fetchPublishedMiniSiteRaw(s),
    ['mini-site-public', s],
    { revalidate: 300, tags: [`mini-site:${s}`] },
  );
  return cached();
}
