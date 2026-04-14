import { useState } from "react";
import SEO from "@/components/SEO";
import Header from "@/components/Header";
import { useAuth } from "@/hooks/useAuth";
import { Navigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Image, Plus, Trash2 } from "lucide-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";

const Advertiser = () => {
  const { user, loading } = useAuth();
  const queryClient = useQueryClient();
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({
    title: "", slot_type: "sidebar", image_url: "", link_url: "", budget: "50", cpm: "5",
  });

  const { data: campaigns, isLoading } = useQuery({
    queryKey: ["my-ads"],
    queryFn: async () => {
      const userId = (await supabase.auth.getUser()).data.user?.id;
      if (!userId) return [];
      const { data } = await supabase
        .from("ad_campaigns" as any)
        .select("*")
        .eq("advertiser_id", userId)
        .order("created_at", { ascending: false });
      return (data || []) as any[];
    },
    enabled: !!user,
  });

  const handleCreate = async () => {
    if (!form.title.trim()) { toast.error("Title required"); return; }
    setCreating(true);
    try {
      const userId = (await supabase.auth.getUser()).data.user!.id;
      const { error } = await supabase.from("ad_campaigns" as any).insert({
        advertiser_id: userId,
        title: form.title,
        slot_type: form.slot_type,
        image_url: form.image_url || null,
        link_url: form.link_url || null,
        budget: parseFloat(form.budget) || 50,
        cpm: parseFloat(form.cpm) || 5,
      } as any);
      if (error) throw error;
      toast.success("Campaign created!");
      setForm({ title: "", slot_type: "sidebar", image_url: "", link_url: "", budget: "50", cpm: "5" });
      queryClient.invalidateQueries({ queryKey: ["my-ads"] });
    } catch (err: any) {
      toast.error(err.message || "Failed to create campaign");
    } finally {
      setCreating(false);
    }
  };

  const handleToggle = async (id: string, active: boolean) => {
    await supabase.from("ad_campaigns" as any).update({ active: !active } as any).eq("id", id);
    queryClient.invalidateQueries({ queryKey: ["my-ads"] });
    toast.success(active ? "Campaign paused" : "Campaign activated");
  };

  if (loading) return <div className="min-h-screen bg-background"><Header /><div className="flex items-center justify-center py-20 text-muted-foreground text-sm">Loading...</div></div>;
  if (!user) return <Navigate to="/auth" replace />;

  return (
    <div className="min-h-screen bg-background">
      <SEO title="Advertiser Dashboard" description="Manage your ad campaigns on HASHPO. Target creator audiences with CPM-based ad slots." noIndex />
      <Header />
      <div className="max-w-5xl mx-auto p-6 space-y-6">
        <div className="flex items-center gap-2">
          <Image className="w-5 h-5 text-primary" />
          <h1 className="text-lg font-extrabold text-foreground uppercase tracking-wide">Ad Manager</h1>
        </div>

        {/* Create Campaign */}
        <div className="bg-card border border-border rounded-lg p-4 space-y-4">
          <h2 className="text-sm font-bold text-card-foreground uppercase flex items-center gap-2">
            <Plus className="w-4 h-4 text-primary" /> New Campaign
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold text-muted-foreground uppercase">Title</label>
              <input type="text" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })}
                className="w-full mt-1 px-3 py-2 bg-secondary border border-border rounded-md text-sm text-foreground" placeholder="Campaign name" />
            </div>
            <div>
              <label className="text-xs font-bold text-muted-foreground uppercase">Slot Type</label>
              <select value={form.slot_type} onChange={(e) => setForm({ ...form, slot_type: e.target.value })}
                className="w-full mt-1 px-3 py-2 bg-secondary border border-border rounded-md text-sm text-foreground">
                <option value="billboard">Billboard (Home Top)</option>
                <option value="sidebar">Sidebar (300x250)</option>
                <option value="overlay">Player Overlay</option>
                <option value="sponsored">Sponsored Logo</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-bold text-muted-foreground uppercase">Image URL</label>
              <input type="url" value={form.image_url} onChange={(e) => setForm({ ...form, image_url: e.target.value })}
                className="w-full mt-1 px-3 py-2 bg-secondary border border-border rounded-md text-sm text-foreground" placeholder="https://..." />
            </div>
            <div>
              <label className="text-xs font-bold text-muted-foreground uppercase">Click URL</label>
              <input type="url" value={form.link_url} onChange={(e) => setForm({ ...form, link_url: e.target.value })}
                className="w-full mt-1 px-3 py-2 bg-secondary border border-border rounded-md text-sm text-foreground" placeholder="https://..." />
            </div>
            <div>
              <label className="text-xs font-bold text-muted-foreground uppercase">Budget (USDC)</label>
              <input type="number" value={form.budget} onChange={(e) => setForm({ ...form, budget: e.target.value })}
                className="w-full mt-1 px-3 py-2 bg-secondary border border-border rounded-md text-sm font-mono text-foreground" />
            </div>
            <div>
              <label className="text-xs font-bold text-muted-foreground uppercase">CPM ($/1000 views)</label>
              <input type="number" value={form.cpm} onChange={(e) => setForm({ ...form, cpm: e.target.value })}
                className="w-full mt-1 px-3 py-2 bg-secondary border border-border rounded-md text-sm font-mono text-foreground" />
            </div>
          </div>
          <button onClick={handleCreate} disabled={creating}
            className="bg-primary text-primary-foreground px-4 py-2 rounded-md text-xs font-bold hover:bg-primary/90 disabled:opacity-50">
            {creating ? "Creating..." : "Create Campaign"}
          </button>
        </div>

        {/* Campaigns List */}
        <div className="bg-card border border-border rounded-lg p-4 space-y-3">
          <h2 className="text-sm font-bold text-card-foreground uppercase">My Campaigns ({(campaigns || []).length})</h2>
          {isLoading ? (
            <p className="text-xs text-muted-foreground py-4 text-center">Loading...</p>
          ) : (campaigns || []).length === 0 ? (
            <p className="text-xs text-muted-foreground py-4 text-center">No campaigns yet. Create your first ad above.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-border text-left">
                    <th className="py-2 px-2 text-muted-foreground font-semibold">Title</th>
                    <th className="py-2 px-2 text-muted-foreground font-semibold">Slot</th>
                    <th className="py-2 px-2 text-muted-foreground font-semibold">Budget</th>
                    <th className="py-2 px-2 text-muted-foreground font-semibold">Impressions</th>
                    <th className="py-2 px-2 text-muted-foreground font-semibold">Clicks</th>
                    <th className="py-2 px-2 text-muted-foreground font-semibold text-center">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {(campaigns || []).map((ad: any) => (
                    <tr key={ad.id} className="border-b border-border/50 hover:bg-muted/50">
                      <td className="py-1.5 px-2 font-medium text-foreground">{ad.title}</td>
                      <td className="py-1.5 px-2 text-muted-foreground capitalize">{ad.slot_type}</td>
                      <td className="py-1.5 px-2 font-mono">${Number(ad.budget).toFixed(2)}</td>
                      <td className="py-1.5 px-2 font-mono">{ad.impressions}</td>
                      <td className="py-1.5 px-2 font-mono">{ad.clicks}</td>
                      <td className="py-1.5 px-2 text-center">
                        <button onClick={() => handleToggle(ad.id, ad.active)}
                          className={`text-[10px] font-bold px-2 py-0.5 rounded ${ad.active ? "bg-[hsl(var(--ticker-up))]/20 text-[hsl(var(--ticker-up))]" : "bg-muted text-muted-foreground"}`}>
                          {ad.active ? "ACTIVE" : "PAUSED"}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Advertiser;
