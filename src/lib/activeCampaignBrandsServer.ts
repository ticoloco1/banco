import { createClient } from '@supabase/supabase-js';

export type ActiveCampaignBrandLogo = {
  id: string;
  title: string;
  logoUrl: string;
  linkUrl: string | null;
};

export async function fetchActiveCampaignBrandLogos(): Promise<ActiveCampaignBrandLogo[]> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return [];
  const db = createClient(url, key);
  const { data, error } = await db
    .from('marketing_campaigns' as any)
    .select('id, title, brand_logo_url, ad_link_url')
    .eq('active', true);
  if (error || !data?.length) return [];
  const rows = data as {
    id: string;
    title?: string;
    brand_logo_url?: string | null;
    ad_link_url?: string | null;
  }[];
  return rows
    .filter((r) => {
      const u = String(r.brand_logo_url || '').trim();
      return /^https?:\/\//i.test(u);
    })
    .map((r) => ({
      id: r.id,
      title: String(r.title || 'Marca'),
      logoUrl: String(r.brand_logo_url || '').trim(),
      linkUrl: typeof r.ad_link_url === 'string' && /^https?:\/\//i.test(r.ad_link_url.trim())
        ? r.ad_link_url.trim()
        : null,
    }));
}
