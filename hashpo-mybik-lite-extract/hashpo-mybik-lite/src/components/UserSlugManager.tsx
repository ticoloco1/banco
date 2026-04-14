import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useMySite } from "@/hooks/useMiniSite";
import { Link2, ExternalLink, Check, Calendar } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

export default function UserSlugManager() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const { data: site } = useMySite();
  const { data: registrations = [], isLoading } = useQuery({
    queryKey: ["my-slug-registrations", user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("slug_registrations")
        .select("*")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false });
      return data || [];
    },
    enabled: !!user?.id,
  });

  const useSlugOnSite = useMutation({
    mutationFn: async (slug: string) => {
      const { data: mySite } = await supabase
        .from("mini_sites")
        .select("id")
        .eq("user_id", user!.id)
        .maybeSingle();
      if (!mySite) throw new Error("Salve seu mini site antes de trocar o slug.");
      const { data: taken } = await supabase.from("mini_sites").select("id, user_id").eq("slug", slug).maybeSingle();
      if (taken && taken.id !== mySite.id) {
        throw new Error("Este slug já está em uso por outro mini site. Não é possível sobrescrever.");
      }
      const reg = (registrations as any[]).find((r) => r.slug === slug && r.status === "active");
      if (!reg) throw new Error("Você não possui este slug ou ele expirou.");
      const { error } = await supabase
        .from("mini_sites")
        .update({
          slug,
          slug_registration_id: reg.id,
          slug_expires_at: reg.expires_at || null,
        } as any)
        .eq("id", mySite.id);
      if (error) throw error;
    },
    onSuccess: (slug) => {
      qc.invalidateQueries({ queryKey: ["my-mini-site"] });
      qc.invalidateQueries({ queryKey: ["my-slug-registrations"] });
      toast.success(`Seu site agora usa hashpo.com/@${slug}`);
    },
    onError: (e: any) => toast.error(e?.message ?? "Erro ao aplicar slug"),
  });

  const active = (registrations as any[]).filter((r) => r.status === "active");
  const currentSlug = (site as any)?.slug;

  if (isLoading) return <p className="text-xs text-muted-foreground">Carregando…</p>;

  return (
    <div className="space-y-3">
      {active.length === 0 ? (
        <p className="text-xs text-muted-foreground">
          Você ainda não possui slugs registrados. Seu mini site usa o slug atual. Para um slug personalizado (ex: /@seunome), compre ou registre no marketplace.
        </p>
      ) : (
        <ul className="space-y-2">
          {(active as any[]).map((r) => {
            const isCurrent = currentSlug === r.slug;
            const expiresAt = r.expires_at ? new Date(r.expires_at) : null;
            const isExpired = expiresAt && expiresAt < new Date();
            return (
              <li key={r.id} className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border px-3 py-2 text-sm">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="font-mono font-medium">{r.slug}</span>
                  {isCurrent && (
                    <span className="text-[10px] font-bold text-primary flex items-center gap-0.5">
                      <Check className="w-3 h-3" /> em uso
                    </span>
                  )}
                  {expiresAt && !isExpired && (
                    <span className="text-[10px] text-muted-foreground flex items-center gap-0.5" title="Renovação">
                      <Calendar className="w-3 h-3" /> {expiresAt.toLocaleDateString("pt-BR")}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  {!isCurrent && site?.id && (
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      className="text-xs h-7"
                      onClick={() => useSlugOnSite.mutate(r.slug)}
                      disabled={useSlugOnSite.isPending}
                    >
                      Usar no meu site
                    </Button>
                  )}
                  <a
                    href={`${window.location.origin}/@${r.slug}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-primary hover:underline text-xs"
                  >
                    Abrir <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </li>
            );
          })}
        </ul>
      )}
      <Link
        href="/slugs"
        className="inline-flex items-center gap-1.5 text-xs font-medium text-primary hover:underline"
      >
        <Link2 className="w-3.5 h-3.5" /> Comprar ou registrar slugs no Marketplace
      </Link>
    </div>
  );
}
