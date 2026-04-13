import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import type { MiniSite } from '@/hooks/useSite';

export type FeaturedPartnerAsset = {
  key: string;
  title: string;
  subtitle?: string;
  imageUrl?: string | null;
  href?: string | null;
};

type RawItem = FeaturedPartnerAsset & { sortAt: number };

function parseOrderKeys(raw: unknown): string[] | null {
  if (!raw) return null;
  if (Array.isArray(raw)) {
    const keys = raw.map((x) => String(x).trim()).filter(Boolean);
    return keys.length ? keys : null;
  }
  return null;
}

function applyOrder(items: RawItem[], orderKeys: string[] | null): RawItem[] {
  const map = new Map(items.map((i) => [i.key, i]));
  if (!orderKeys?.length) {
    return [...items].sort((a, b) => b.sortAt - a.sortAt);
  }
  const out: RawItem[] = [];
  const used = new Set<string>();
  for (const k of orderKeys) {
    const it = map.get(k);
    if (it && !used.has(k)) {
      out.push(it);
      used.add(k);
    }
  }
  const rest = [...items].filter((i) => !used.has(i.key)).sort((a, b) => b.sortAt - a.sortAt);
  out.push(...rest);
  return out;
}

export async function fetchRawPartnerItemsForUser(
  db: SupabaseClient,
  userId: string,
): Promise<RawItem[]> {
  const out: RawItem[] = [];

  const { data: leads } = await db
    .from('campaign_leads' as any)
    .select('id, delivered_at, created_at, delivery_status, campaign_id')
    .eq('user_id', userId)
    .in('delivery_status', ['sent', 'delivered'])
    .order('delivered_at', { ascending: false, nullsFirst: false })
    .limit(25);

  const campaignIds = [...new Set((leads || []).map((l: any) => l.campaign_id).filter(Boolean))];
  const campMap = new Map<string, { title?: string; ad_video_url?: string | null; ad_link_url?: string | null }>();
  if (campaignIds.length) {
    const { data: camps } = await db
      .from('marketing_campaigns' as any)
      .select('id, title, ad_video_url, ad_link_url')
      .in('id', campaignIds);
    for (const c of camps || []) {
      const row = c as { id: string; title?: string; ad_video_url?: string | null; ad_link_url?: string | null };
      campMap.set(row.id, row);
    }
  }

  for (const l of leads || []) {
    const row = l as {
      id: string;
      delivered_at?: string | null;
      created_at?: string;
      campaign_id: string;
    };
    const camp = campMap.get(row.campaign_id);
    const title = String(camp?.title || 'Campanha parceira');
    const sortAt = new Date(row.delivered_at || row.created_at || 0).getTime();
    const img =
      typeof camp?.ad_video_url === 'string' && /^https?:\/\//i.test(camp.ad_video_url.trim())
        ? camp.ad_video_url.trim()
        : null;
    out.push({
      key: `lead:${row.id}`,
      title,
      subtitle: 'NFT de marca',
      imageUrl: img,
      href: typeof camp?.ad_link_url === 'string' ? camp.ad_link_url : null,
      sortAt,
    });
  }

  const { data: nfts } = await db
    .from('nft_secondary_listings' as any)
    .select('id, nft_name, nft_image, updated_at, original_ad_link_url, brand_logo_url')
    .eq('buyer_user_id', userId)
    .eq('status', 'sold')
    .order('updated_at', { ascending: false })
    .limit(25);

  for (const n of nfts || []) {
    const row = n as {
      id: string;
      nft_name?: string | null;
      nft_image?: string | null;
      updated_at?: string;
      original_ad_link_url?: string | null;
      brand_logo_url?: string | null;
    };
    const sortAt = new Date(row.updated_at || 0).getTime();
    out.push({
      key: `nft:${row.id}`,
      title: String(row.nft_name || 'NFT parceiro'),
      subtitle: 'Marketplace',
      imageUrl: row.nft_image || row.brand_logo_url || null,
      href: row.original_ad_link_url || null,
      sortAt,
    });
  }

  return out;
}

export function orderFeaturedAssets(
  raw: RawItem[],
  orderJson: unknown,
  max = 3,
): FeaturedPartnerAsset[] {
  const keys = parseOrderKeys(orderJson);
  const ordered = applyOrder(raw, keys);
  return ordered.slice(0, max).map(({ sortAt: _s, ...rest }) => rest);
}

export async function fetchFeaturedPartnerAssetsForPublishedSlug(
  slug: string,
): Promise<FeaturedPartnerAsset[]> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return [];
  const db = createClient(url, key);
  const normalized = String(slug || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, '');
  if (!normalized) return [];

  const { data: site } = await db
    .from('mini_sites')
    .select('user_id, published, featured_partner_assets_order')
    .eq('slug', normalized)
    .eq('published', true)
    .maybeSingle();
  if (!site) return [];

  const s = site as MiniSite & { featured_partner_assets_order?: unknown };
  const raw = await fetchRawPartnerItemsForUser(db, s.user_id);
  return orderFeaturedAssets(raw, (s as any).featured_partner_assets_order, 3);
}

/** Grid 3×3 na página /s/[slug]/assets — mesma fonte de dados, até 9 itens. */
export async function fetchPartnerNftGridForPublishedSlug(
  slug: string,
  max = 9,
): Promise<FeaturedPartnerAsset[]> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return [];
  const db = createClient(url, key);
  const normalized = String(slug || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, '');
  if (!normalized) return [];

  const { data: site } = await db
    .from('mini_sites')
    .select('user_id, published, featured_partner_assets_order')
    .eq('slug', normalized)
    .eq('published', true)
    .maybeSingle();
  if (!site) return [];

  const raw = await fetchRawPartnerItemsForUser(db, (site as { user_id: string }).user_id);
  return orderFeaturedAssets(raw, (site as any).featured_partner_assets_order, max);
}
