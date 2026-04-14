import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import Header from "@/components/Header";
import Link from "next/link";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { Globe, Zap, Search, Building, Tag } from "lucide-react";
import { Input } from "@/components/ui/input";
import { BadgeCheck } from "lucide-react";
import SEO from "@/components/SEO";
import { DIRECTORY_FILTER_CATEGORIES, getProfessionLabel } from "@/data/professions";

export default function MiniSiteDirectory() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const categoryFromUrl = searchParams.get("category") || "todos";
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState(categoryFromUrl);

  useEffect(() => {
    if (DIRECTORY_FILTER_CATEGORIES.includes(categoryFromUrl)) setCategory(categoryFromUrl);
  }, [categoryFromUrl]);

  const setCategoryAndUrl = (c: string) => {
    setCategory(c);
    if (c === "todos") router.replace("/professionais");
    else router.replace("/professionais?category=" + encodeURIComponent(c));
  };

  const { data: listings, isLoading } = useQuery({
    queryKey: ["public-directory", category],
    queryFn: async () => {
      let q = supabase
        .from("mini_site_directory" as any)
        .select(`
          *,
          mini_sites!mini_site_directory_site_id_fkey(
            id, site_name, avatar_url, bio, theme, slug,
            verification_badges!verification_badges_user_id_fkey(badge_type, status)
          )
        `)
        .eq("listed", true)
        .order("boost_amount", { ascending: false })
        .order("created_at", { ascending: false })
        .limit(100);
      if (category !== "todos") q = q.eq("category", category);
      const { data } = await q;
      return (data as any[]) || [];
    },
  });

  const filtered = (listings || []).filter((l: any) => {
    if (!search) return true;
    const name = l.mini_sites?.site_name?.toLowerCase() || "";
    const desc = l.description?.toLowerCase() || "";
    return name.includes(search.toLowerCase()) || desc.includes(search.toLowerCase());
  });

  return (
    <>
      <SEO title="Profissionais e Mini-Sites | HASHPO" description="Diretório de profissionais por profissão: corretores de imóveis, venda de domínios e mais. Mini-sites verificados HASHPO." />
      <div className="min-h-screen bg-background">
        <Header />

        <div className="max-w-5xl mx-auto px-4 py-10 space-y-8">
          {/* Hero */}
          <div className="text-center space-y-2">
            <div className="flex items-center justify-center gap-2">
              <Tag className="w-6 h-6 text-primary" />
              <h1 className="text-2xl font-black text-foreground">Diretório por profissão</h1>
            </div>
            <p className="text-sm text-muted-foreground">Corretores de imóveis, venda de domínios e outros profissionais</p>
          </div>

          {/* Profissões / Filtros */}
          <div className="flex flex-col gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar por nome ou descrição..."
                className="pl-9" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <Tag className="w-3 h-3" /> Profissões e categorias
              </p>
              <div className="flex gap-1.5 flex-wrap">
                {DIRECTORY_FILTER_CATEGORIES.map(c => (
                  <button key={c} onClick={() => setCategoryAndUrl(c)}
                    className={`px-3 py-1.5 text-xs font-bold rounded-full border transition-colors ${category === c ? "bg-primary text-primary-foreground border-transparent" : "bg-secondary text-muted-foreground border-border hover:border-primary/40"}`}>
                    {c === "todos" ? "Todos" : getProfessionLabel(c)}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Grid */}
          {isLoading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="h-40 rounded-2xl bg-secondary animate-pulse" />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-20 text-muted-foreground">
              <Globe className="w-10 h-10 mx-auto mb-3 opacity-20" />
              <p className="text-sm">Nenhum mini-site encontrado.</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {filtered.map((listing: any) => {
                const site = listing.mini_sites;
                if (!site) return null;
                const isBoosted = listing.boost_expires_at && new Date(listing.boost_expires_at) > new Date();
                const boostAmount = listing.boost_amount || 0;
                const badge = (site.verification_badges || []).find((b: any) => b.status === "active");
                const slug = site.slug;

                return (
                  <Link key={listing.id} href={`/@${slug || site.id}`}
                    className={`group relative rounded-2xl overflow-hidden border transition-all hover:scale-[1.02] hover:shadow-lg ${isBoosted ? "border-yellow-500/50 shadow-[0_0_12px_rgba(234,179,8,0.2)]" : "border-border"}`}>

                    {/* Badge destaque */}
                    {isBoosted && (
                      <div className="absolute top-2 left-2 z-10 flex items-center gap-1 px-2 py-0.5 bg-yellow-500 text-black text-[9px] font-black rounded-full shadow">
                        <Zap className="w-2.5 h-2.5" /> BOOST
                      </div>
                    )}

                    {/* Verification badge */}
                    {badge && (
                      <div className="absolute top-2 right-2 z-10">
                        <BadgeCheck
                          className="w-5 h-5"
                          style={{ color: badge.badge_type === "company" ? "#FFD700" : "#1D9BF0" }}
                          fill={badge.badge_type === "company" ? "#FFD700" : "#1D9BF0"}
                          stroke="white"
                          strokeWidth={1.5}
                        />
                      </div>
                    )}

                    {/* Card content */}
                    <div className="bg-card p-4 space-y-3 h-full">
                      {site.avatar_url ? (
                        <img src={site.avatar_url} alt="" className="w-14 h-14 rounded-full mx-auto object-cover border-2 border-border" />
                      ) : (
                        <div className="w-14 h-14 rounded-full mx-auto bg-primary/20 flex items-center justify-center text-xl font-black text-primary">
                          {(site.site_name || "?")[0].toUpperCase()}
                        </div>
                      )}
                      <div className="text-center space-y-1">
                        <p className="text-xs font-bold text-foreground truncate">{site.site_name || "Mini-Site"}</p>
                        {listing.category && listing.category !== "geral" && (
                          <span className="text-[9px] text-muted-foreground bg-secondary px-1.5 py-0.5 rounded-full">
                            {getProfessionLabel(listing.category)}
                          </span>
                        )}
                        {listing.description && (
                          <p className="text-[10px] text-muted-foreground line-clamp-2 leading-relaxed">{listing.description}</p>
                        )}
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}

          <p className="text-center text-[10px] text-muted-foreground">
            {filtered.length} mini-site{filtered.length !== 1 ? "s" : ""} listado{filtered.length !== 1 ? "s" : ""} · Sites com 🚀 destaque aparecem primeiro
          </p>
        </div>
      </div>
    </>
  );
}
