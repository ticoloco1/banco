import { useState } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Search, MapPin, Briefcase, BrainCircuit, FileText } from "lucide-react";
import { Input } from "@/components/ui/input";

const DirectorySection = () => {
  const [search, setSearch] = useState("");

  const { data: sites, isLoading } = useQuery({
    queryKey: ["directory-sites", search],
    queryFn: async () => {
      let q = supabase
        .from("mini_sites")
        .select("id, slug, site_name, bio, avatar_url, cv_headline, cv_location, show_cv, user_id")
        .eq("published", true)
        .eq("show_cv", true);
      if (search.trim()) {
        q = q.or(`site_name.ilike.%${search}%,cv_headline.ilike.%${search}%,cv_location.ilike.%${search}%,bio.ilike.%${search}%`);
      }
      const { data } = await q.order("updated_at", { ascending: false }).limit(50);
      return data || [];
    },
  });

  return (
    <section className="py-16 px-6">
      <div className="max-w-7xl mx-auto">
        <div className="grid lg:grid-cols-[1fr_320px] gap-6 mb-8">
          <div>
            <h2 className="text-2xl md:text-3xl font-black text-foreground">Diretório de profissionais com CV no mini site</h2>
            <p className="text-sm text-muted-foreground mt-2 max-w-3xl">
              Empresas podem procurar perfis públicos, comparar headlines, localizar candidatos e depois usar IA barata para filtrar melhor os nomes.
            </p>
          </div>
          <div className="rounded-2xl border border-border bg-card p-4">
            <div className="flex items-center gap-2 text-sm font-black text-foreground mb-2"><BrainCircuit className="w-4 h-4 text-primary" /> IA para triagem</div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Você pode ligar DeepSeek depois para sugerir candidatos por skill, cidade e área. Faz sentido e tem custo baixo para começar.
            </p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <div className="relative flex-1 sm:w-80">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar profissão, skill ou cidade"
                className="pl-10"
              />
            </div>
            <Link
              href="/site/edit"
              className="inline-flex items-center gap-2 bg-accent text-accent-foreground px-4 py-2 rounded-lg font-bold text-sm hover:opacity-90 transition-opacity whitespace-nowrap"
            >
              <FileText className="w-4 h-4" /> Criar meu CV
            </Link>
          </div>
        </div>

        {isLoading ? (
          <p className="text-sm text-muted-foreground py-10 text-center">Carregando diretório...</p>
        ) : (sites || []).length === 0 ? (
          <div className="text-center py-16 bg-card border border-border rounded-xl">
            <Briefcase className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-lg font-bold text-foreground mb-2">Ainda não há currículos publicados</p>
            <p className="text-sm text-muted-foreground mb-6">Os primeiros perfis podem ganhar vantagem de indexação e presença.</p>
            <Link
              href="/site/edit"
              className="inline-flex items-center gap-2 bg-accent text-accent-foreground px-5 py-2.5 rounded-lg font-bold text-sm hover:opacity-90"
            >
              Criar agora
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {(sites || []).map((site) => (
              <Link key={site.id} href={`/mini-site/${site.slug}`} className="rounded-2xl border border-border bg-card p-4 hover:shadow-md transition-shadow">
                <div className="flex items-start gap-3">
                  <div className="w-14 h-14 rounded-2xl bg-muted overflow-hidden shrink-0">
                    {site.avatar_url ? <img src={site.avatar_url} alt={site.site_name || site.slug} className="w-full h-full object-cover" /> : null}
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="font-black text-foreground truncate">{site.site_name || site.slug}</h3>
                    <p className="text-xs text-primary font-semibold mt-1 truncate">{site.cv_headline || "Perfil profissional"}</p>
                    {site.cv_location ? (
                      <div className="flex items-center gap-1 mt-2 text-xs text-muted-foreground"><MapPin className="w-3.5 h-3.5" /> {site.cv_location}</div>
                    ) : null}
                    {site.bio ? <p className="text-xs text-muted-foreground mt-3 line-clamp-3">{site.bio}</p> : null}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </section>
  );
};

export default DirectorySection;
