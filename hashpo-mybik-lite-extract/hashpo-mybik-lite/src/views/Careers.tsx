import { useState } from "react";
import SEO from "@/components/SEO";
import Header from "@/components/Header";
import { useAuth } from "@/hooks/useAuth";
import { useSettings } from "@/hooks/useSettings";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Search, MapPin, Lock, Mail, Phone, Briefcase, ChevronDown, ChevronUp, Eye,
  Building2, Crown, Zap
} from "lucide-react";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle
} from "@/components/ui/alert-dialog";

const Careers = () => {
  const { user } = useAuth();
  const { data: settings } = useSettings();
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [unlockTarget, setUnlockTarget] = useState<any>(null);
  const [showCompanyPlan, setShowCompanyPlan] = useState(false);
  const [companyName, setCompanyName] = useState("");
  const [companyEmail, setCompanyEmail] = useState("");

  const cvUnlockPrice = Number((settings as any)?.cv_unlock_price ?? 20);
  const companyPlanPrice = Number((settings as any)?.cv_directory_monthly_usd ?? 199);
  const companyPlanUnlocks = Number((settings as any)?.cv_directory_monthly_opens ?? 15);
  const cvCreatorPct = Number((settings as any)?.cv_creator_pct ?? 50) / 100;
  const cvPlatformPct = Number((settings as any)?.cv_platform_pct ?? 50) / 100;

  // Fetch sites with CVs - no profiles join (use mini_sites fields directly)
  const { data: sites, isLoading } = useQuery({
    queryKey: ["careers-sites", search],
    queryFn: async () => {
      let q = supabase
        .from("mini_sites")
        .select("*")
        .eq("published", true)
        .eq("show_cv", true)
        .eq("blocked", false);
      if (search.trim()) {
        q = q.or(`site_name.ilike.%${search}%,cv_headline.ilike.%${search}%,cv_location.ilike.%${search}%`);
      }
      const { data } = await q
        .order("boost_rank", { ascending: false })
        .order("updated_at", { ascending: false })
        .limit(50);
      return data || [];
    },
  });

  const { data: myUnlocks } = useQuery({
    queryKey: ["my-cv-unlocks", user?.id],
    queryFn: async () => {
      const { data } = await supabase.from("cv_unlocks").select("site_id").eq("buyer_id", user!.id);
      return (data || []).map((u: any) => u.site_id);
    },
    enabled: !!user,
  });

  const { data: mySubscription } = useQuery({
    queryKey: ["my-company-sub", user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("company_subscriptions")
        .select("*")
        .eq("user_id", user!.id)
        .eq("status", "active")
        .gte("expires_at", new Date().toISOString())
        .maybeSingle();
      return data;
    },
    enabled: !!user,
  });

  // Count unlocks used this month (for subscription)
  const { data: unlocksUsedCount } = useQuery({
    queryKey: ["cv-unlocks-count", user?.id],
    queryFn: async () => {
      const now = new Date();
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      const { count } = await supabase
        .from("cv_unlocks")
        .select("id", { count: "exact", head: true })
        .eq("buyer_id", user!.id)
        .gte("created_at", monthStart.toISOString());
      return count || 0;
    },
    enabled: !!user && !!mySubscription,
  });

  const hasActiveSub = !!mySubscription;
  const unlocksRemaining = hasActiveSub ? Math.max(0, companyPlanUnlocks - (unlocksUsedCount || 0)) : 0;

  const unlockContact = useMutation({
    mutationFn: async (site: any) => {
      const isFreeUnlock = hasActiveSub && unlocksRemaining > 0;
      const price = isFreeUnlock ? 0 : (site.contact_price || cvUnlockPrice);
      const { error } = await supabase.from("cv_unlocks").insert({
        buyer_id: user!.id,
        creator_id: site.user_id,
        site_id: site.id,
        amount_paid: price,
        creator_share: Math.round(price * cvCreatorPct * 100) / 100,
        platform_share: Math.round(price * cvPlatformPct * 100) / 100,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["my-cv-unlocks"] });
      qc.invalidateQueries({ queryKey: ["cv-unlocks-count"] });
      toast.success("Contato desbloqueado!");
      setUnlockTarget(null);
    },
    onError: (e: any) => toast.error(e.message),
  });

  const subscribePlan = useMutation({
    mutationFn: async () => {
      if (!companyName.trim()) throw new Error("Nome da empresa obrigatório");
      const { error } = await supabase.from("company_subscriptions").insert({
        user_id: user!.id,
        company_name: companyName.trim(),
        company_email: companyEmail.trim() || null,
        plan_price: companyPlanPrice,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["my-company-sub"] });
      toast.success(`Plano empresa ativado! ${companyPlanUnlocks} desbloqueios inclusos.`);
      setShowCompanyPlan(false);
      setCompanyName("");
      setCompanyEmail("");
    },
    onError: (e: any) => toast.error(e.message),
  });

  const isUnlocked = (siteId: string) => myUnlocks?.includes(siteId);

  const isBoosted = (site: any) =>
    site.boost_rank > 0 && site.boost_expires_at && new Date(site.boost_expires_at) > new Date();

  return (
    <div className="min-h-screen bg-background">
      <SEO title="Vagas e Diretório Profissional — HASHPO" description="Vagas de emprego e diretório de profissionais verificados. Desbloqueie contatos, acesse CVs e contrate talentos no HASHPO." />
      <Header />

      {/* Unlock Dialog */}
      <AlertDialog open={!!unlockTarget} onOpenChange={o => !o && setUnlockTarget(null)}>
        <AlertDialogContent className="max-w-sm">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2"><Lock className="w-5 h-5 text-primary" /> Desbloquear Contato</AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-2 text-sm">
                <p>Desbloquear contato de <strong>{unlockTarget?.site_name || "este profissional"}</strong>.</p>
                {hasActiveSub && unlocksRemaining > 0 ? (
                  <p className="text-accent font-bold">✅ Grátis com seu plano empresa ({unlocksRemaining} restantes)</p>
                ) : (
                  <p>Preço: <span className="font-mono font-bold text-primary">${unlockTarget?.contact_price || cvUnlockPrice} USDC</span></p>
                )}
                <p className="text-[10px] text-muted-foreground">
                  Split: {Math.round(cvCreatorPct * 100)}% profissional / {Math.round(cvPlatformPct * 100)}% plataforma.
                </p>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={() => unlockContact.mutate(unlockTarget)} className="bg-primary text-primary-foreground">
              {hasActiveSub && unlocksRemaining > 0
                ? "Desbloquear (grátis)"
                : `Desbloquear por $${unlockTarget?.contact_price || cvUnlockPrice}`}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Company Plan Dialog */}
      <AlertDialog open={showCompanyPlan} onOpenChange={setShowCompanyPlan}>
        <AlertDialogContent className="max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2"><Building2 className="w-5 h-5 text-accent" /> Plano Empresa</AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-3 text-sm">
                <div className="bg-accent/10 border border-accent/20 rounded-lg p-4 text-center">
                  <p className="text-3xl font-black text-accent">${companyPlanPrice}<span className="text-sm font-normal text-muted-foreground">/mês</span></p>
                  <p className="text-xs text-foreground font-bold mt-1">{companyPlanUnlocks} desbloqueios de CV inclusos</p>
                  <p className="text-[10px] text-muted-foreground">Após o pacote, volta cobrança normal por abertura.</p>
                </div>
                <div className="space-y-2">
                  <Input value={companyName} onChange={e => setCompanyName(e.target.value)} placeholder="Nome da empresa *" />
                  <Input value={companyEmail} onChange={e => setCompanyEmail(e.target.value)} placeholder="Email corporativo (opcional)" />
                </div>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={() => subscribePlan.mutate()} className="bg-accent text-accent-foreground">
              Assinar por ${companyPlanPrice}/mês
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <div className="max-w-6xl mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div className="space-y-2">
            <h1 className="text-2xl font-black text-foreground flex items-center gap-2">
              <Briefcase className="w-6 h-6 text-primary" /> Diretório Profissional
            </h1>
            <p className="text-sm text-muted-foreground">Navegue CVs de profissionais. Desbloqueie contatos para contratar talentos.</p>
          </div>
          <div className="flex items-center gap-3">
            {user && !hasActiveSub && (
              <button
                onClick={() => setShowCompanyPlan(true)}
                className="flex items-center gap-2 px-4 py-2 bg-accent text-accent-foreground text-xs font-bold rounded-lg hover:opacity-90"
              >
                <Building2 className="w-4 h-4" /> Plano Empresa ${companyPlanPrice}/mês
              </button>
            )}
            {hasActiveSub && (
              <Badge className="bg-accent/10 text-accent border-accent/30 gap-1.5 py-1.5 px-3">
                <Building2 className="w-3.5 h-3.5" />
                Plano Empresa • {unlocksRemaining}/{companyPlanUnlocks} restantes
              </Badge>
            )}
          </div>
        </div>

        {/* Search */}
        <div className="relative max-w-lg">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Buscar por nome, headline ou localização..."
            className="pl-10"
          />
        </div>

        {/* Cards Grid */}
        {isLoading ? (
          <div className="text-center py-10 text-muted-foreground text-sm">Carregando profissionais...</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {(sites || []).map((site: any) => {
              const isExpanded = expandedId === site.id;
              const unlocked = isUnlocked(site.id);
              const skills = site.cv_skills || [];
              const experience = site.cv_experience || [];
              const boosted = isBoosted(site);

              return (
                <div key={site.id} className={`bg-card border rounded-xl overflow-hidden hover:shadow-lg transition-shadow ${boosted ? "border-accent ring-1 ring-accent/30" : "border-border"}`}>
                  {/* Card Header */}
                  <div className="p-5 space-y-3">
                    <div className="flex items-start gap-3">
                      {site.avatar_url ? (
                        <img src={site.avatar_url} alt="" className="w-14 h-14 rounded-full object-cover border-2 border-border" />
                      ) : (
                        <div className="w-14 h-14 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-black text-xl">
                          {(site.site_name || site.slug || "?")?.[0]?.toUpperCase()}
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <h3 className="text-sm font-black text-foreground truncate">{site.site_name || site.slug}</h3>
                          {boosted && <Zap className="w-3.5 h-3.5 text-accent shrink-0" />}
                        </div>
                        {site.cv_headline && <p className="text-xs text-primary font-bold truncate">{site.cv_headline}</p>}
                        {site.cv_location && (
                          <p className="text-[10px] text-muted-foreground flex items-center gap-1 mt-0.5">
                            <MapPin className="w-3 h-3" /> {site.cv_location}
                          </p>
                        )}
                      </div>
                    </div>

                    {site.bio && <p className="text-xs text-muted-foreground line-clamp-2">{site.bio}</p>}

                    {/* Skills */}
                    {skills.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {skills.slice(0, 5).map((s: string, i: number) => (
                          <span key={i} className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-primary/10 text-primary">{s}</span>
                        ))}
                        {skills.length > 5 && <span className="text-[10px] text-muted-foreground">+{skills.length - 5}</span>}
                      </div>
                    )}

                    {/* Expandable CV */}
                    <button
                      onClick={() => setExpandedId(isExpanded ? null : site.id)}
                      className="flex items-center gap-1 text-xs text-primary font-bold hover:underline"
                    >
                      {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                      {isExpanded ? "Esconder detalhes" : "Ver CV"}
                    </button>

                    {isExpanded && (
                      <div className="space-y-3 pt-2 border-t border-border animate-in slide-in-from-top-2">
                        {site.cv_content && (
                          <div>
                            <p className="text-[10px] font-bold text-muted-foreground uppercase mb-1">Sobre</p>
                            <p className="text-xs text-foreground whitespace-pre-wrap">{site.cv_content}</p>
                          </div>
                        )}
                        {experience.length > 0 && (
                          <div>
                            <p className="text-[10px] font-bold text-muted-foreground uppercase mb-1">Experiência</p>
                            {experience.map((exp: any, i: number) => (
                              <div key={i} className="mb-2">
                                <p className="text-xs font-bold text-foreground">{exp.title}</p>
                                <p className="text-[10px] text-primary">{exp.company} · {exp.period}</p>
                                {exp.description && <p className="text-[10px] text-muted-foreground mt-0.5">{exp.description}</p>}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Contact Footer */}
                  <div className="bg-secondary/50 border-t border-border px-5 py-3 flex items-center justify-between">
                    {unlocked ? (
                      <div className="flex items-center gap-3 text-xs">
                        {site.contact_email && (
                          <a href={`mailto:${site.contact_email}`} className="flex items-center gap-1 text-primary hover:underline">
                            <Mail className="w-3 h-3" /> {site.contact_email}
                          </a>
                        )}
                        {site.contact_phone && (
                          <a href={`tel:${site.contact_phone}`} className="flex items-center gap-1 text-primary hover:underline">
                            <Phone className="w-3 h-3" /> {site.contact_phone}
                          </a>
                        )}
                      </div>
                    ) : (
                      <button
                        onClick={() => user ? setUnlockTarget(site) : toast.error("Faça login primeiro")}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-primary text-primary-foreground text-xs font-bold rounded-lg hover:bg-primary/90"
                      >
                        <Lock className="w-3 h-3" />
                        {hasActiveSub && unlocksRemaining > 0
                          ? "Desbloquear (grátis)"
                          : `Desbloquear · $${site.contact_price || cvUnlockPrice}`}
                      </button>
                    )}
                    <a href={`/@${site.slug}`} className="flex items-center gap-1 text-[10px] text-muted-foreground hover:text-primary">
                      <Eye className="w-3 h-3" /> Perfil
                    </a>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {sites && sites.length === 0 && !isLoading && (
          <div className="text-center py-16 text-muted-foreground">
            <Briefcase className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p className="text-sm">Nenhum profissional encontrado. Tente outra busca.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Careers;
