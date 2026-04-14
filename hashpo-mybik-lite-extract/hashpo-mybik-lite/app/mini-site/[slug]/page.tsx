import { Suspense } from "react";
import type { Metadata } from "next";
import MiniSitePublic from "@/views/MiniSitePublic";
import { createServerSupabase } from "@/lib/supabase-server";

/** Atualiza metadados periodicamente após publicação/edição. */
export const revalidate = 120;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const supabase = createServerSupabase();

  const { data: site } = await supabase
    .from("mini_sites")
    .select("slug, site_name, bio, avatar_url, cv_headline, cv_location, custom_css, seo_title, seo_description, seo_image_url")
    .eq("slug", slug)
    .eq("published", true)
    .maybeSingle();

  const advanced = (() => {
    try {
      return JSON.parse((site?.custom_css as string) || "{}") as {
        seoTitle?: string;
        seoDescription?: string;
        seoImageUrl?: string;
      };
    } catch {
      return {};
    }
  })();

  const title = site?.seo_title || advanced.seoTitle || (site?.site_name
    ? `${site.site_name} | HASHPO`
    : `${slug} | HASHPO mini site`);
  const description = (site?.seo_description || advanced.seoDescription || [site?.cv_headline, site?.bio, site?.cv_location]
    .filter(Boolean)
    .join(" • ")
    .slice(0, 155) ||
    "Mini site público com links, feed, currículo e conteúdo premium.");
  const seoImage = site?.seo_image_url || advanced.seoImageUrl || site?.avatar_url || undefined;

  const keywords = [slug, site?.site_name, site?.cv_headline, "mini site", "link in bio", "HASHPO"]
    .filter((k): k is string => typeof k === "string" && k.length > 0);

  return {
    title,
    description,
    keywords: keywords.length ? keywords : undefined,
    robots: site
      ? { index: true, follow: true, googleBot: { index: true, follow: true } }
      : { index: false, follow: false },
    openGraph: {
      title,
      description,
      type: "profile",
      url: `https://hashpo.com/@${slug}`,
      images: seoImage ? [{ url: seoImage }] : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: seoImage ? [seoImage] : undefined,
    },
    alternates: {
      canonical: `/@${slug}`,
    },
  };
}

export default function MiniSiteSlugPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-background flex items-center justify-center text-muted-foreground text-sm">Carregando...</div>}>
      <MiniSitePublic />
    </Suspense>
  );
}
