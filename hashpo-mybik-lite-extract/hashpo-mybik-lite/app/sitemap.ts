import type { MetadataRoute } from "next";
import { createServerSupabase } from "@/lib/supabase-server";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = "https://hashpo.com";
  const now = new Date();
  const staticRoutes: MetadataRoute.Sitemap = [
    { url: base, lastModified: now, changeFrequency: "daily", priority: 1 },
    { url: `${base}/how-it-works`, lastModified: now, changeFrequency: "weekly", priority: 0.8 },
    { url: `${base}/directory`, lastModified: now, changeFrequency: "daily", priority: 0.8 },
    { url: `${base}/professionais`, lastModified: now, changeFrequency: "daily", priority: 0.8 },
    { url: `${base}/slugs`, lastModified: now, changeFrequency: "hourly", priority: 0.9 },
    { url: `${base}/careers`, lastModified: now, changeFrequency: "daily", priority: 0.7 },
    { url: `${base}/cv`, lastModified: now, changeFrequency: "daily", priority: 0.7 },
    { url: `${base}/classificados`, lastModified: now, changeFrequency: "daily", priority: 0.7 },
    { url: `${base}/carros`, lastModified: now, changeFrequency: "daily", priority: 0.6 },
    { url: `${base}/imoveis`, lastModified: now, changeFrequency: "daily", priority: 0.6 },
  ];

  try {
    const supabase = createServerSupabase();
    const { data: miniSites } = await supabase
      .from("mini_sites")
      .select("slug, updated_at, custom_css, blog_enabled, blog_pages")
      .eq("published", true)
      .order("updated_at", { ascending: false })
      .limit(1000);

    const siteRoutes: MetadataRoute.Sitemap = (miniSites || [])
      .filter((row) => !!row.slug)
      .map((row) => ({
        url: `${base}/@${row.slug}`,
        lastModified: row.updated_at ? new Date(row.updated_at) : now,
        changeFrequency: "daily",
        priority: 0.7,
      }));

    const blogRoutes: MetadataRoute.Sitemap = (miniSites || []).flatMap((row) => {
      if (!row?.slug) return [];
      try {
        const parsed = JSON.parse((row.custom_css as string) || "{}") as {
          blogEnabled?: boolean;
          blogPages?: Array<{ title?: string; slug?: string; content?: string; summary?: string }>;
        };
        if (row.blog_enabled === false || parsed.blogEnabled === false) return [];
        const pages = (row.blog_pages as Array<{ title?: string; slug?: string; content?: string; summary?: string }> | null) || parsed.blogPages || [];
        return pages
          .filter((page, idx) => !!(page?.title || page?.content || page?.summary))
          .map((page, idx) => ({
            url: `${base}/@${row.slug}/blog/${page.slug || `pagina-${idx + 1}`}`,
            lastModified: row.updated_at ? new Date(row.updated_at) : now,
            changeFrequency: "weekly" as const,
            priority: 0.6,
          }));
      } catch {
        return [];
      }
    });

    return [...staticRoutes, ...siteRoutes, ...blogRoutes];
  } catch {
    return staticRoutes;
  }
}
