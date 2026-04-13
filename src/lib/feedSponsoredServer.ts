import { createClient, type SupabaseClient } from '@supabase/supabase-js';

export type FeedSponsoredCard = {
  id: string;
  title: string;
  body: string | null;
  imageUrl: string | null;
  ctaLabel: string | null;
  ctaUrl: string | null;
  campaignId: string;
};

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

/** Campanhas nas quais o dono do site tem NFT entregue (leads) ou comprou NFT secundário com campaign_id nos metadados. */
async function campaignIdsForOwnerNfts(db: SupabaseClient, ownerUserId: string): Promise<string[]> {
  const set = new Set<string>();
  const { data: leads } = await db
    .from('campaign_leads' as any)
    .select('campaign_id')
    .eq('user_id', ownerUserId)
    .in('delivery_status', ['sent', 'delivered']);
  for (const l of leads || []) {
    const id = String((l as { campaign_id?: string }).campaign_id || '').trim();
    if (id) set.add(id);
  }
  const { data: sold } = await db
    .from('nft_secondary_listings' as any)
    .select('nft_metadata')
    .eq('buyer_user_id', ownerUserId)
    .eq('status', 'sold')
    .limit(80);
  for (const row of sold || []) {
    const meta = (row as { nft_metadata?: Record<string, unknown> }).nft_metadata || {};
    const cid = String(meta.campaign_id || meta.campaignId || '').trim();
    if (UUID_RE.test(cid)) set.add(cid);
  }
  return [...set];
}

/** Até 2 anúncios ativos para campanhas cujo NFT o utilizador recebeu. */
export async function fetchFeedSponsoredForSiteOwner(
  db: SupabaseClient,
  ownerUserId: string,
  limit = 2,
): Promise<FeedSponsoredCard[]> {
  const campaignIds = await campaignIdsForOwnerNfts(db, ownerUserId);
  if (!campaignIds.length) return [];

  const { data: ads } = await db
    .from('campaign_ads' as any)
    .select('id, campaign_id, title, body, image_url, cta_label, cta_url, active, sort_order')
    .in('campaign_id', campaignIds)
    .eq('active', true)
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: true })
    .limit(Math.max(limit, 2) * 4);

  const list = (ads || []) as {
    id: string;
    campaign_id: string;
    title?: string;
    body?: string | null;
    image_url?: string | null;
    cta_label?: string | null;
    cta_url?: string | null;
  }[];

  const seen = new Set<string>();
  const out: FeedSponsoredCard[] = [];
  for (const a of list) {
    if (out.length >= limit) break;
    if (seen.has(a.id)) continue;
    seen.add(a.id);
    out.push({
      id: a.id,
      campaignId: a.campaign_id,
      title: String(a.title || 'Patrocinado'),
      body: a.body ?? null,
      imageUrl: a.image_url ?? null,
      ctaLabel: a.cta_label ?? null,
      ctaUrl: a.cta_url ?? null,
    });
  }
  return out.slice(0, limit);
}

export async function fetchFeedSponsoredForPublishedSlug(
  slug: string,
  limit = 2,
): Promise<FeedSponsoredCard[]> {
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
    .select('user_id, published')
    .eq('slug', normalized)
    .eq('published', true)
    .maybeSingle();
  if (!site) return [];

  return fetchFeedSponsoredForSiteOwner(db, (site as { user_id: string }).user_id, limit);
}
