import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Eye, EyeOff, Save, Plus, Trash2, Key } from "lucide-react";

interface ApiKeyRow {
  id: string;
  service_name: string;
  service_label: string;
  api_key: string;
  extra_fields: Record<string, string>;
  updated_at: string;
}

const GROUPS: Record<string, string[]> = {
  "DeepSeek (Design / Impressão sob demanda)": ["deepseek_api_key"],
  "Bunny.net (Video Hosting & CDN)": ["bunny_api_key", "bunny_storage_key", "bunny_cdn_hostname", "bunny_library_id"],
  "ACRCloud (Music Recognition & Anti-Piracy)": ["acr_cloud_host", "acr_cloud_access_key", "acr_cloud_access_secret"],
  "AWS (Content Moderation & Rekognition)": ["aws_access_key_id", "aws_secret_access_key", "aws_region"],
  "Arweave (Decentralized Storage)": ["arweave_wallet_key", "arweave_gateway_url"],
  "Cloudflare (CDN & Security)": ["cloudflare_api_token", "cloudflare_zone_id", "cloudflare_account_id"],
  "CDN": ["cdn_custom_domain"],
  "Polygon (Blockchain)": ["polygon_rpc_url", "polygon_private_key"],
  "WalletConnect": ["walletconnect_project_id"],
  "Email (SMTP)": ["smtp_host", "smtp_port", "smtp_user", "smtp_pass"],
};

export default function AdminApiKeys() {
  const [keys, setKeys] = useState<ApiKeyRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [visible, setVisible] = useState<Record<string, boolean>>({});
  const [edits, setEdits] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState<string | null>(null);
  const [newService, setNewService] = useState({ name: "", label: "" });

  const load = async () => {
    setLoading(true);
    const { data } = await supabase.from("platform_api_keys" as any).select("*").order("service_label");
    setKeys((data as any as ApiKeyRow[]) || []);
    const initial: Record<string, string> = {};
    (data || []).forEach((k: any) => { initial[k.id] = k.api_key; });
    setEdits(initial);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const handleSave = async (row: ApiKeyRow) => {
    setSaving(row.id);
    const { error } = await supabase
      .from("platform_api_keys" as any)
      .update({ api_key: edits[row.id] || "", updated_at: new Date().toISOString() } as any)
      .eq("id", row.id);
    if (error) toast.error(error.message);
    else toast.success(`${row.service_label} saved`);
    setSaving(null);
  };

  const handleAdd = async () => {
    if (!newService.name.trim() || !newService.label.trim()) return;
    const { error } = await supabase
      .from("platform_api_keys" as any)
      .insert({ service_name: newService.name.trim(), service_label: newService.label.trim() } as any);
    if (error) toast.error(error.message);
    else { toast.success("Service added"); setNewService({ name: "", label: "" }); load(); }
  };

  const handleDelete = async (row: ApiKeyRow) => {
    if (!confirm(`Delete ${row.service_label}?`)) return;
    await supabase.from("platform_api_keys" as any).delete().eq("id", row.id);
    toast.success("Deleted");
    load();
  };

  if (loading) return <div className="text-center py-10 text-muted-foreground text-sm">Loading API keys...</div>;

  const grouped = Object.entries(GROUPS).map(([group, serviceNames]) => ({
    group,
    items: keys.filter(k => serviceNames.includes(k.service_name)),
  }));
  const ungrouped = keys.filter(k => !Object.values(GROUPS).flat().includes(k.service_name));

  const renderRow = (row: ApiKeyRow) => (
    <div key={row.id} className="flex items-center gap-2 py-2">
      <span className="text-xs text-muted-foreground w-48 shrink-0 truncate">{row.service_label}</span>
      <div className="flex-1 relative">
        <Input
          type={visible[row.id] ? "text" : "password"}
          value={edits[row.id] ?? ""}
          onChange={e => setEdits(prev => ({ ...prev, [row.id]: e.target.value }))}
          placeholder="Enter key..."
          className="pr-10 text-xs font-mono"
        />
        <button
          onClick={() => setVisible(prev => ({ ...prev, [row.id]: !prev[row.id] }))}
          className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
        >
          {visible[row.id] ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
        </button>
      </div>
      <Button size="sm" variant="outline" disabled={saving === row.id} onClick={() => handleSave(row)}>
        <Save className="w-3 h-3" />
      </Button>
      <Button size="sm" variant="ghost" onClick={() => handleDelete(row)}>
        <Trash2 className="w-3 h-3 text-destructive" />
      </Button>
    </div>
  );

  return (
    <div className="space-y-6">
      {grouped.map(({ group, items }) =>
        items.length > 0 && (
          <div key={group} className="border border-border rounded-lg p-4 bg-card">
            <h3 className="text-sm font-bold text-card-foreground uppercase mb-3 flex items-center gap-2">
              <Key className="w-4 h-4 text-primary" />
              {group}
            </h3>
            <div className="divide-y divide-border">{items.map(renderRow)}</div>
          </div>
        )
      )}

      {ungrouped.length > 0 && (
        <div className="border border-border rounded-lg p-4 bg-card">
          <h3 className="text-sm font-bold text-card-foreground uppercase mb-3">Custom Services</h3>
          <div className="divide-y divide-border">{ungrouped.map(renderRow)}</div>
        </div>
      )}

      <div className="border border-border rounded-lg p-4 bg-card">
        <h3 className="text-sm font-bold text-card-foreground uppercase mb-3 flex items-center gap-2">
          <Plus className="w-4 h-4 text-primary" />Add Custom Service
        </h3>
        <div className="flex gap-2">
          <Input placeholder="service_key_name" value={newService.name} onChange={e => setNewService(s => ({ ...s, name: e.target.value }))} className="text-xs font-mono" />
          <Input placeholder="Display Label" value={newService.label} onChange={e => setNewService(s => ({ ...s, label: e.target.value }))} className="text-xs" />
          <Button size="sm" onClick={handleAdd}><Plus className="w-3 h-3 mr-1" />Add</Button>
        </div>
      </div>
    </div>
  );
}
