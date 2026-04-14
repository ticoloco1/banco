import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { createServerSupabase } from "@/lib/supabase-server";

type BlogPageItem = {
  title?: string;
  url?: string;
  summary?: string;
  content?: string;
  slug?: string;
};

async function getSite(slug: string) {
  const supabase = createServerSupabase();
  const { data } = await supabase
    .from("mini_sites")
    .select("site_name, slug, custom_css, published, blog_pages, blog_enabled, seo_title, seo_description, seo_image_url")
    .eq("slug", slug)
    .eq("published", true)
    .maybeSingle();
  return data as any;
}

function getBlogPage(site: any, page: string) {
  try {
    const parsed = JSON.parse((site?.custom_css as string) || "{}") as {
      blogPages?: BlogPageItem[];
      blogEnabled?: boolean;
    };
    if ((site as any)?.blog_enabled === false || parsed.blogEnabled === false) return null;
    const list = ((site as any)?.blog_pages as BlogPageItem[]) || parsed.blogPages || [];
    return list.find((item, idx) => (item.slug || `pagina-${idx + 1}`) === page) || null;
  } catch {
    return null;
  }
}

function getAdvancedSeo(site: any) {
  try {
    return JSON.parse((site?.custom_css as string) || "{}") as {
      seoTitle?: string;
      seoDescription?: string;
      seoImageUrl?: string;
    };
  } catch {
    return {};
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string; page: string }>;
}): Promise<Metadata> {
  const { slug, page } = await params;
  const site = await getSite(slug);
  if (!site) return { title: "Pagina nao encontrada" };
  const post = getBlogPage(site, page);
  if (!post) return { title: "Pagina nao encontrada" };
  const seo = getAdvancedSeo(site);
  const title = `${post.title || "Blog"} | ${site.site_name || site.slug} | HASHPO`;
  const description = (post.summary || post.content || seo.seoDescription || "").slice(0, 155) || "Pagina de blog do mini-site.";
  const image = (site as any)?.seo_image_url || seo.seoImageUrl || undefined;
  return {
    title,
    description,
    alternates: { canonical: `/@${slug}/blog/${page}` },
    openGraph: {
      title,
      description,
      type: "article",
      url: `https://hashpo.com/@${slug}/blog/${page}`,
      images: image ? [{ url: image }] : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: image ? [image] : undefined,
    },
  };
}

export default async function MiniSiteBlogPage({
  params,
}: {
  params: Promise<{ slug: string; page: string }>;
}) {
  const { slug, page } = await params;
  const site = await getSite(slug);
  if (!site) notFound();
  const post = getBlogPage(site, page);
  if (!post) notFound();

  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="max-w-3xl mx-auto px-6 py-14">
        <Link href={`/@${slug}`} className="text-xs text-primary hover:underline">
          ← Voltar para o mini-site
        </Link>
        <article className="mt-5 rounded-2xl border border-border bg-card p-6 md:p-8">
          <h1 className="text-2xl md:text-3xl font-black mb-2">{post.title || "Blog"}</h1>
          {post.summary && <p className="text-sm text-muted-foreground mb-6">{post.summary}</p>}
          <div className="whitespace-pre-wrap text-sm leading-relaxed">
            {post.content || "Conteudo ainda nao preenchido no editor."}
          </div>
        </article>
      </div>
    </main>
  );
}
