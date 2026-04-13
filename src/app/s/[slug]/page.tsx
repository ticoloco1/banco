import { fetchPublishedMiniSiteForSsr } from '@/lib/miniSitePublicServer';
import { fetchFeaturedPartnerAssetsForPublishedSlug } from '@/lib/featuredPartnerNftsServer';
import SitePageClient from './SitePageClient';

/** HTML público com ISR para reduzir hits no Supabase. */
export const revalidate = 300;

export default async function MiniSitePage({ params }: { params: { slug: string } }) {
  const slug = params.slug || '';
  const [ssrSite, featuredPartnerAssets] = await Promise.all([
    fetchPublishedMiniSiteForSsr(slug),
    fetchFeaturedPartnerAssetsForPublishedSlug(slug),
  ]);
  return (
    <SitePageClient slug={slug} ssrSite={ssrSite} featuredPartnerAssets={featuredPartnerAssets} />
  );
}
