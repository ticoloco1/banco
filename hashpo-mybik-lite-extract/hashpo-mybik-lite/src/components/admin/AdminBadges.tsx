import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useSettings, useUpdateSettings } from "@/hooks/useSettings";
import { BadgeCheck, User, Building2, DollarSign, Power, Trash2, Search, CheckCircle, XCircle } from "lucide-react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";

const AdminBadges = () => {
  const qc = useQueryClient();
  const { data: settings } = useSettings();
  const updateSettings = useUpdateSettings();
  const [search, setSearch] = useState("");
  const [grantEmail, setGrantEmail] = useState("");
  const [grantType, setGrantType] = useState<"personal" | "company">("personal");
  const [granting, setGranting] = useState(false);

  // Load all badges
  const { data: badges, isLoading } = useQuery({
    queryKey: ["admin-all-badges"],
    queryFn: async () => {
      const { data } = await supabase
        .from("verification_badges" as any)
        .select("*, profiles!verification_badges_user_id_fkey(display_name, avatar_url)")
        .order("created_at", { ascending: false })
        .limit(200);
      return (data as any[]) || [];
    },
  });

  const revokeBadge = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("verification_badges" as any)
        .update({ status: "revoked", revoked_at: new Date().toISOString() } as any)
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-all-badges"] });
      toast.success("Badge revogado!");
    },
    onError: (e: any) => toast.error(e.message),
  });

  const activateBadge = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("verification_badges" as any)
        .update({ status: "active", revoked_at: null } as any)
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-all-badges"] });
      toast.success("Badge ativado!");
    },
    onError: (e: any) => toast.error(e.message),
  });

  const handleGrant = async () => {
    if (!grantEmail.trim()) return;
    setGranting(true);
    try {
      const { data: profile } = await supabase
        .from("profiles")
        .select("user_id, display_name")
        .ilike("display_name", grantEmail.trim())
        .maybeSingle();
      if (!profile) {
        // Try by email lookup
        const { data: authUser } = await supabase
          .from("profiles")
          .select("user_id, display_name")
          .limit(5);
        throw new Error("Usuário não encontrado. Use o nome de exibição exato.");
      }
      // Check existing
      const { data: existing } = await supabase
        .from("verification_badges" as any)
        .select("id")
        .eq("user_id", profile.user_id)
        .maybeSingle();
      if (existing) {
        // Reactivate
        await supabase
          .from("verification_badges" as any)
          .update({ status: "active", badge_type: grantType, revoked_at: null, expires_at: new Date(Date.now() + 365 * 86400000).toISOString() } as any)
          .eq("id", (existing as any).id);
      } else {
        await supabase
          .from("verification_badges" as any)
          .insert({
            user_id: profile.user_id,
            badge_type: grantType,
            status: "active",
            plan_type: "manual",
            price_paid: 0,
            expires_at: new Date(Date.now() + 365 * 86400000).toISOString(),
          } as any);
      }
      toast.success(`Badge ${grantType === "company" ? "Gold (Empresa)" : "Azul (Pessoal)"} concedido para ${profile.display_name}!`);
      setGrantEmail("");
      qc.invalidateQueries({ queryKey: ["admin-all-badges"] });
    } catch (e: any) { toast.error(e.message); }
    setGranting(false);
  };

  const s = settings as any;
  const filtered = (badges || []).filter((b: any) => {
    if (!search) return true;
    const name = b.profiles?.display_name?.toLowerCase() || "";
    return name.includes(search.toLowerCase()) || b.badge_type?.includes(search.toLowerCase());
  });

  const stats = {
    total: (badges || []).length,
    active: (badges || []).filter((b: any) => b.status === "active").length,
    personal: (badges || []).filter((b: any) => b.badge_type === "personal" && b.status === "active").length,
    company: (badges || []).filter((b: any) => b.badge_type === "company" && b.status === "active").length,
    revoked: (badges || []).filter((b: any) => b.status === "revoked").length,
  };

  return (
    <div className="border border-border rounded-lg p-4 bg-card space-y-5">
      <div className="flex items-center gap-2">
        <BadgeCheck className="w-4 h-4 text-[#1D9BF0]" />
        <h2 className="text-sm font-bold text-card-foreground uppercase">Badges de Verificação</h2>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-5 gap-2">
        {[
          { label: "Total", value: stats.total, color: "text-foreground" },
          { label: "Ativos", value: stats.active, color: "text-[hsl(var(--ticker-up))]" },
          { label: "Pessoal 🔵", value: stats.personal, color: "text-[#1D9BF0]" },
          { label: "Empresa 🟡", value: stats.company, color: "text-yellow-500" },
          { label: "Revogados", value: stats.revoked, color: "text-destructive" },
        ].map(stat => (
          <div key={stat.label} className="bg-secondary/50 rounded-lg p-2 text-center">
            <p className={`text-lg font-black ${stat.color}`}>{stat.value}</p>
            <p className="text-[9px] text-muted-foreground">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Price configuration */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Personal */}
        <div className="border border-[#1D9BF0]/30 rounded-xl p-4 space-y-3 bg-[#1D9BF0]/5">
          <div className="flex items-center gap-2">
            <BadgeCheck className="w-5 h-5 text-[#1D9BF0]" fill="#1D9BF0" stroke="white" strokeWidth={1.5} />
            <h3 className="text-xs font-bold text-foreground">Selo Pessoal (Azul)</h3>
            <button
              onClick={() => updateSettings.mutate({ badge_personal_enabled: !(s?.badge_personal_enabled ?? true) } as any)}
              className={`ml-auto px-2 py-1 text-[10px] font-bold rounded-full ${(s?.badge_personal_enabled ?? true) ? "bg-[hsl(var(--ticker-up))] text-white" : "bg-muted text-muted-foreground"}`}
            >
              {(s?.badge_personal_enabled ?? true) ? "Ativo" : "Inativo"}
            </button>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-muted-foreground">Mensal ($)</label>
              <div className="flex gap-1">
                <Input type="number" defaultValue={s?.badge_personal_monthly ?? 8} step="0.01"
                  onBlur={e => updateSettings.mutate({ badge_personal_monthly: parseFloat(e.target.value) } as any)}
                  className="h-8 text-xs" />
              </div>
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-muted-foreground">Anual ($)</label>
              <Input type="number" defaultValue={s?.badge_personal_annual ?? 86.40} step="0.01"
                onBlur={e => updateSettings.mutate({ badge_personal_annual: parseFloat(e.target.value) } as any)}
                className="h-8 text-xs" />
            </div>
          </div>
        </div>

        {/* Company */}
        <div className="border border-yellow-500/30 rounded-xl p-4 space-y-3 bg-yellow-500/5">
          <div className="flex items-center gap-2">
            <BadgeCheck className="w-5 h-5 text-yellow-500" fill="#FFD700" stroke="white" strokeWidth={1.5} />
            <h3 className="text-xs font-bold text-foreground">Selo Empresa (Gold)</h3>
            <button
              onClick={() => updateSettings.mutate({ badge_company_enabled: !(s?.badge_company_enabled ?? true) } as any)}
              className={`ml-auto px-2 py-1 text-[10px] font-bold rounded-full ${(s?.badge_company_enabled ?? true) ? "bg-[hsl(var(--ticker-up))] text-white" : "bg-muted text-muted-foreground"}`}
            >
              {(s?.badge_company_enabled ?? true) ? "Ativo" : "Inativo"}
            </button>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-muted-foreground">Mensal ($)</label>
              <Input type="number" defaultValue={s?.badge_company_monthly ?? 41.67} step="0.01"
                onBlur={e => updateSettings.mutate({ badge_company_monthly: parseFloat(e.target.value) } as any)}
                className="h-8 text-xs" />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-muted-foreground">Anual ($)</label>
              <Input type="number" defaultValue={s?.badge_company_annual ?? 450} step="0.01"
                onBlur={e => updateSettings.mutate({ badge_company_annual: parseFloat(e.target.value) } as any)}
                className="h-8 text-xs" />
            </div>
          </div>
        </div>
      </div>

      {/* Manual grant */}
      <div className="bg-secondary/50 rounded-xl p-4 space-y-3 border border-border">
        <p className="text-[10px] font-bold text-muted-foreground uppercase">Conceder Badge Manualmente</p>
        <div className="flex gap-2 flex-wrap">
          <Input
            value={grantEmail}
            onChange={e => setGrantEmail(e.target.value)}
            placeholder="Nome de exibição do usuário..."
            className="flex-1 min-w-[200px] h-9 text-xs"
          />
          <div className="flex gap-1">
            <button onClick={() => setGrantType("personal")}
              className={`h-9 px-3 text-[10px] font-bold rounded border transition-colors ${grantType === "personal" ? "bg-[#1D9BF0] text-white border-transparent" : "bg-secondary text-muted-foreground border-border"}`}>
              🔵 Pessoal
            </button>
            <button onClick={() => setGrantType("company")}
              className={`h-9 px-3 text-[10px] font-bold rounded border transition-colors ${grantType === "company" ? "bg-yellow-500 text-black border-transparent" : "bg-secondary text-muted-foreground border-border"}`}>
              🟡 Empresa
            </button>
          </div>
          <button onClick={handleGrant} disabled={granting || !grantEmail.trim()}
            className="h-9 px-4 bg-primary text-primary-foreground text-xs font-bold rounded hover:bg-primary/90 disabled:opacity-40">
            {granting ? "Concedendo..." : "Conceder"}
          </button>
        </div>
      </div>

      {/* Badge list */}
      <div className="flex items-center gap-2">
        <Search className="w-3.5 h-3.5 text-muted-foreground" />
        <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar usuário..." className="h-8 text-xs w-48" />
      </div>

      {isLoading ? (
        <p className="text-xs text-muted-foreground text-center py-6">Carregando...</p>
      ) : filtered.length === 0 ? (
        <p className="text-xs text-muted-foreground text-center py-6">Nenhum badge encontrado.</p>
      ) : (
        <div className="space-y-2">
          {filtered.map((badge: any) => {
            const isPersonal = badge.badge_type === "personal";
            const isActive = badge.status === "active";
            return (
              <div key={badge.id} className={`flex items-center gap-3 rounded-xl border px-4 py-3 ${isActive ? "bg-secondary/50 border-border" : "bg-destructive/5 border-destructive/20 opacity-60"}`}>
                <BadgeCheck
                  className="w-5 h-5 shrink-0"
                  style={{ color: isPersonal ? "#1D9BF0" : "#FFD700" }}
                  fill={isPersonal ? "#1D9BF0" : "#FFD700"}
                  stroke="white"
                  strokeWidth={1.5}
                />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-foreground truncate">
                    {badge.profiles?.display_name || badge.user_id?.slice(0, 8)}
                  </p>
                  <div className="flex items-center gap-2 text-[10px] text-muted-foreground flex-wrap">
                    <span>{isPersonal ? "Pessoal" : "Empresa"}</span>
                    <span>·</span>
                    <span className={`font-bold ${isActive ? "text-[hsl(var(--ticker-up))]" : "text-destructive"}`}>
                      {badge.status}
                    </span>
                    {badge.expires_at && <span>· até {new Date(badge.expires_at).toLocaleDateString("pt-BR")}</span>}
                    {badge.price_paid > 0 && <span>· ${badge.price_paid}</span>}
                    {badge.plan_type === "manual" && <span className="bg-primary/10 text-primary px-1 rounded">manual</span>}
                  </div>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  {isActive ? (
                    <button
                      onClick={() => { if (confirm("Revogar badge?")) revokeBadge.mutate(badge.id); }}
                      className="flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded bg-destructive/10 text-destructive hover:bg-destructive/20"
                    >
                      <XCircle className="w-3 h-3" /> Revogar
                    </button>
                  ) : (
                    <button
                      onClick={() => activateBadge.mutate(badge.id)}
                      className="flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded bg-primary/10 text-primary hover:bg-primary/20"
                    >
                      <CheckCircle className="w-3 h-3" /> Ativar
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default AdminBadges;
