import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Globe, Trash2, Eye, EyeOff, Search, Ban, CheckCircle, DollarSign } from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";
import { Input } from "@/components/ui/input";

const AdminMiniSites = () => {
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editPrice, setEditPrice] = useState("");

  const { data: sites, isLoading } = useQuery({
    queryKey: ["admin-mini-sites"],
    queryFn: async () => {
      const { data } = await supabase
        .from("mini_sites")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(200);
      return data || [];
    },
  });

  const updateSite = useMutation({
    mutationFn: async ({ id, ...updates }: { id: string } & Record<string, any>) => {
      const { error } = await supabase.from("mini_sites").update(updates).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-mini-sites"] });
      toast.success("Site updated!");
    },
    onError: (e: any) => toast.error(e.message),
  });

  const deleteSite = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("mini_sites").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-mini-sites"] });
      toast.success("Site deleted!");
    },
    onError: (e: any) => toast.error(e.message),
  });

  const handleSavePrice = (id: string) => {
    const price = parseFloat(editPrice);
    if (isNaN(price) || price < 0) { toast.error("Preço inválido"); return; }
    updateSite.mutate({ id, monthly_price: price });
    setEditingId(null);
  };

  const filtered = (sites || []).filter((s: any) =>
    !search || s.site_name?.toLowerCase().includes(search.toLowerCase()) ||
    s.slug?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="border border-border rounded-lg p-4 bg-card space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-2">
          <Globe className="w-4 h-4 text-primary" />
          <h2 className="text-sm font-bold text-card-foreground uppercase">
            Mini-Sites ({filtered.length})
          </h2>
        </div>
        <div className="relative">
          <Search className="w-3.5 h-3.5 absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text" value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search sites..."
            className="pl-8 pr-3 py-1.5 bg-secondary text-foreground text-xs border border-border rounded focus:outline-none focus:ring-1 focus:ring-primary w-48"
          />
        </div>
      </div>

      {isLoading ? (
        <p className="text-xs text-muted-foreground text-center py-6">Loading...</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-border text-left">
                <th className="py-2 px-2 text-muted-foreground font-semibold">Name</th>
                <th className="py-2 px-2 text-muted-foreground font-semibold">Slug</th>
                <th className="py-2 px-2 text-muted-foreground font-semibold">Theme</th>
                <th className="py-2 px-2 text-muted-foreground font-semibold text-center">Preço/mês</th>
                <th className="py-2 px-2 text-muted-foreground font-semibold text-center">CV</th>
                <th className="py-2 px-2 text-muted-foreground font-semibold text-center">Status</th>
                <th className="py-2 px-2 text-muted-foreground font-semibold text-center">Publicado</th>
                <th className="py-2 px-2 text-muted-foreground font-semibold text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((site: any) => (
                <tr key={site.id} className={`border-b border-border/50 hover:bg-muted/50 ${site.blocked ? "opacity-50" : ""}`}>
                  <td className="py-1.5 px-2 font-medium text-foreground max-w-[160px] truncate">
                    {site.site_name || "Untitled"}
                  </td>
                  <td className="py-1.5 px-2 font-mono text-muted-foreground">/@{site.slug}</td>
                  <td className="py-1.5 px-2 text-muted-foreground capitalize">{site.bg_style || site.theme}</td>
                  {/* Price */}
                  <td className="py-1.5 px-2 text-center">
                    {editingId === site.id ? (
                      <div className="flex items-center gap-1 justify-center">
                        <Input
                          type="number" step="0.01" min="0" value={editPrice}
                          onChange={e => setEditPrice(e.target.value)}
                          className="w-20 h-6 text-xs px-1"
                        />
                        <button onClick={() => handleSavePrice(site.id)} className="text-primary text-[10px] font-bold hover:underline">OK</button>
                        <button onClick={() => setEditingId(null)} className="text-muted-foreground text-[10px] hover:underline">X</button>
                      </div>
                    ) : (
                      <button
                        onClick={() => { setEditingId(site.id); setEditPrice(String(site.monthly_price || 0)); }}
                        className="flex items-center gap-1 mx-auto text-foreground hover:text-primary"
                        title="Editar preço"
                      >
                        <DollarSign className="w-3 h-3" />
                        <span className="font-mono">{(site.monthly_price || 0).toFixed(2)}</span>
                      </button>
                    )}
                  </td>
                  <td className="py-1.5 px-2 text-center">
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${site.show_cv ? "bg-primary/20 text-primary" : "bg-muted text-muted-foreground"}`}>
                      {site.show_cv ? "ON" : "OFF"}
                    </span>
                  </td>
                  {/* Blocked status */}
                  <td className="py-1.5 px-2 text-center">
                    <button
                      onClick={() => updateSite.mutate({ id: site.id, blocked: !site.blocked })}
                      className={`p-1 rounded transition-colors ${site.blocked ? "text-destructive" : "text-primary"}`}
                      title={site.blocked ? "Desbloquear" : "Bloquear"}
                    >
                      {site.blocked ? <Ban className="w-4 h-4" /> : <CheckCircle className="w-4 h-4" />}
                    </button>
                  </td>
                  {/* Published */}
                  <td className="py-1.5 px-2 text-center">
                    <button
                      onClick={() => updateSite.mutate({ id: site.id, published: !site.published })}
                      className={`p-1 rounded transition-colors ${site.published ? "text-primary" : "text-muted-foreground"}`}
                      title={site.published ? "Despublicar" : "Publicar"}
                    >
                      {site.published ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                    </button>
                  </td>
                  <td className="py-1.5 px-2 text-center">
                    <div className="flex items-center justify-center gap-1">
                      <Link href={`/@${site.slug}`} className="text-primary hover:text-primary/80" title="Ver">
                        <Eye className="w-3.5 h-3.5" />
                      </Link>
                      <button
                        onClick={() => {
                          if (!confirm(`Deletar site "${site.site_name || site.slug}"?`)) return;
                          deleteSite.mutate(site.id);
                        }}
                        className="text-destructive hover:text-destructive/80" title="Deletar"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default AdminMiniSites;
