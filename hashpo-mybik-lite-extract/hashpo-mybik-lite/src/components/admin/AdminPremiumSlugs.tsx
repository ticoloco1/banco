import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Crown, Trash2, Plus, DollarSign, Search, Tag, Upload, Power, Send, Filter, AtSign, Gavel, Timer, Calendar } from "lucide-react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { normalizeSlug } from "@/lib/slug";

const CATEGORIES = ["profession", "tech", "finance", "entertainment", "lifestyle", "creative", "media", "general"];
const LENGTH_FILTERS = [
  { label: "Todas", value: 0 },
  { label: "1", value: 1 }, { label: "2", value: 2 }, { label: "3", value: 3 },
  { label: "4", value: 4 }, { label: "5", value: 5 }, { label: "6", value: 6 }, { label: "7+", value: 7 },
];

// Só usamos formato /@ (hashpo.com/@slug)
const DEFAULT_PRICES: Record<number, number> = {
  1: 2000, 2: 1500, 3: 1000, 4: 500, 5: 250, 6: 100, 7: 50,
};

const FmtBadge = () => (
  <span className="inline-flex items-center gap-0.5 text-[9px] font-bold px-1.5 py-0.5 rounded-full text-white bg-gradient-to-r from-yellow-500 to-amber-600">
    <AtSign className="w-2 h-2" /> /@
  </span>
);

const AdminPremiumSlugs = () => {
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [lengthFilter, setLengthFilter] = useState(0);

  // ── Add single slug ──
  const [newSlug, setNewSlug] = useState("");
  const [newCategory, setNewCategory] = useState("general");
  const [newPrice, setNewPrice] = useState("500");

  // ── Bulk ──
  const [bulkMode, setBulkMode] = useState(false);
  const [bulkText, setBulkText] = useState("");
  const [bulkCategory, setBulkCategory] = useState("general");

  // ── Edit/Transfer ──
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editPrice, setEditPrice] = useState("");
  const [transferSlugId, setTransferSlugId] = useState<string | null>(null);
  const [transferEmail, setTransferEmail] = useState("");
  // ── Seleção em massa e preço em lote ──
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkPriceValue, setBulkPriceValue] = useState("");

  // ── Auction ──
  const [auctionMode, setAuctionMode] = useState(false);
  const [auctionSlug, setAuctionSlug] = useState("");
  const [auctionMinPrice, setAuctionMinPrice] = useState("100");
  const [auctionMinIncrement, setAuctionMinIncrement] = useState("10");
  const [auctionDays, setAuctionDays] = useState("7");

  const { data: slugs, isLoading } = useQuery({
    queryKey: ["admin-premium-slugs"],
    queryFn: async () => {
      const { data } = await supabase.from("premium_slugs").select("*").order("category").order("price", { ascending: false });
      return data || [];
    },
  });

  const { user } = useAuth();
  const { data: auctions } = useQuery({
    queryKey: ["admin-slug-auctions"],
    queryFn: async () => {
      const { data } = await supabase.from("slug_auctions").select("*").order("created_at", { ascending: false }).limit(20);
      return data || [];
    },
  });

  // Adiciona slug(s) no banco — um registro por formato selecionado
  const addSlug = useMutation({
    mutationFn: async (items: { slug: string; category: string; price: number; slug_format: string }[]) => {
      const rows = items.map(i => ({ slug: i.slug, keyword: i.slug, category: i.category, price: i.price, slug_format: i.slug_format }));
      const { error } = await supabase.from("premium_slugs").insert(rows);
      if (error) throw error;
    },
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ["admin-premium-slugs"] });
      toast.success(`${vars.length} entrada(s) adicionada(s)!`);
      setNewSlug(""); setNewPrice("500");
    },
    onError: (e: any) => toast.error(e.message),
  });

  const bulkAdd = useMutation({
    mutationFn: async (items: { slug: string; category: string; price: number; slug_format: string }[]) => {
      if (items.length === 0) return { added: 0, skipped: 0 };
      const slugs = items.map(i => i.slug);
      const { data: existing } = await supabase.from("premium_slugs").select("slug").in("slug", slugs);
      const existingSet = new Set((existing || []).map((r: any) => r.slug));
      const toInsert = items.filter(i => !existingSet.has(i.slug));
      if (toInsert.length === 0) {
        return { added: 0, skipped: items.length };
      }
      const rows = toInsert.map(i => ({ slug: i.slug, keyword: i.slug, category: i.category, price: i.price, slug_format: i.slug_format }));
      const { error } = await supabase.from("premium_slugs").insert(rows);
      if (error) throw error;
      return { added: toInsert.length, skipped: items.length - toInsert.length };
    },
    onSuccess: (result: { added: number; skipped: number }, vars) => {
      qc.invalidateQueries({ queryKey: ["admin-premium-slugs"] });
      const msg = result.skipped > 0
        ? `${result.added} slug(s) adicionado(s). ${result.skipped} já existiam e foram ignorados.`
        : `${result.added} slug(s) importado(s)!`;
      toast.success(msg);
      setBulkText("");
    },
    onError: (e: any) => toast.error(e.message),
  });

  const updateSlug = useMutation({
    mutationFn: async ({ id, ...updates }: { id: string } & Record<string, any>) => {
      const { error } = await supabase.from("premium_slugs").update(updates).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin-premium-slugs"] }); toast.success("Atualizado!"); setEditingId(null); },
    onError: (e: any) => toast.error(e.message),
  });

  const deleteSlug = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("premium_slugs").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin-premium-slugs"] }); toast.success("Removido!"); setSelectedIds(s => new Set()); },
    onError: (e: any) => toast.error(e.message),
  });

  const bulkUpdatePrice = useMutation({
    mutationFn: async ({ ids, price }: { ids: string[]; price: number }) => {
      if (ids.length === 0) return;
      const { error } = await supabase.from("premium_slugs").update({ price }).in("id", ids);
      if (error) throw error;
    },
    onSuccess: (_, { ids }) => {
      qc.invalidateQueries({ queryKey: ["admin-premium-slugs"] });
      toast.success(`Preço atualizado para ${ids.length} slug(s).`);
      setSelectedIds(new Set());
      setBulkPriceValue("");
    },
    onError: (e: any) => toast.error(e.message),
  });

  const applyLengthPrice = (length: number) => {
    const price = DEFAULT_PRICES[length] ?? 50;
    const ids = (slugs || []).filter((s: any) => (s.slug?.length ?? 0) === length).map((s: any) => s.id);
    if (ids.length === 0) { toast.info(`Nenhum slug com ${length} letra(s).`); return; }
    bulkUpdatePrice.mutate({ ids, price });
  };

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => { const n = new Set(prev); if (n.has(id)) n.delete(id); else n.add(id); return n; });
  };
  const toggleSelectAll = () => {
    const filtered = (slugs || []).filter((s: any) => s.active && !s.sold);
    if (selectedIds.size >= filtered.length) setSelectedIds(new Set());
    else setSelectedIds(new Set(filtered.map((s: any) => s.id)));
  };
  const setPriceForSelected = () => {
    const price = parseFloat(bulkPriceValue);
    if (selectedIds.size === 0) { toast.error("Selecione um ou mais slugs."); return; }
    if (isNaN(price) || price < 0) { toast.error("Preço inválido."); return; }
    bulkUpdatePrice.mutate({ ids: Array.from(selectedIds), price });
  };

  const transferSlug = useMutation({
    mutationFn: async ({ slugId, email }: { slugId: string; email: string }) => {
      const { data: profile } = await supabase.from("profiles").select("user_id").ilike("display_name", email.trim()).maybeSingle();
      if (!profile) throw new Error("Usuário não encontrado");
      const { error } = await supabase.from("premium_slugs").update({ sold: true, buyer_id: profile.user_id, sold_at: new Date().toISOString() } as any).eq("id", slugId);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin-premium-slugs"] }); toast.success("Slug transferido!"); setTransferSlugId(null); setTransferEmail(""); },
    onError: (e: any) => toast.error(e.message),
  });

  const createAuction = useMutation({
    mutationFn: async () => {
      const s = normalizeSlug(auctionSlug);
      if (!s) throw new Error("Slug inválido");
      const startingPrice = parseFloat(auctionMinPrice) || 100;
      const minIncrement = parseFloat(auctionMinIncrement) || 10;
      if (minIncrement <= 0) throw new Error("Incremento mínimo do lance deve ser maior que zero");
      const endsAt = new Date(Date.now() + Math.max(1, parseInt(auctionDays) || 7) * 86400000).toISOString();
      const { error } = await supabase.from("slug_auctions").insert({
        keyword: s,
        starting_price: startingPrice,
        min_increment: minIncrement,
        current_bid: null,
        current_bidder_id: null,
        status: "active",
        ends_at: endsAt,
        seller_id: user?.id ?? null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-slug-auctions"] });
      qc.invalidateQueries({ queryKey: ["slug-auctions"] });
      toast.success("Leilão criado! Aparece no Marketplace de Slugs.");
      setAuctionSlug("");
    },
    onError: (e: any) => toast.error(e.message),
  });

  const handleAdd = () => {
    const s = newSlug.trim().toLowerCase().replace(/[^a-z0-9-]/g, "");
    if (!s) return;
    const price = parseFloat(newPrice) || DEFAULT_PRICES[s.length] || 50;
    addSlug.mutate([{ slug: s, category: newCategory, price, slug_format: "@" }]);
  };

  const handleSlugChange = (val: string) => {
    setNewSlug(val);
    const clean = val.trim().toLowerCase().replace(/[^a-z0-9-]/g, "");
    if (clean.length > 0 && clean.length <= 7) {
      setNewPrice(String(DEFAULT_PRICES[Math.min(clean.length, 7)] || 50));
    }
  };

  const handleBulkAdd = () => {
    const lines = bulkText.split("\n").map(l => l.trim()).filter(Boolean);
    const seen = new Set<string>();
    const items: any[] = [];
    for (const line of lines) {
      const parts = line.split(/[:\t,;]+/).map(p => p.trim());
      const slug = normalizeSlug(parts[0] || "");
      if (!slug || seen.has(slug)) continue;
      seen.add(slug);
      const basePrice = parts[1] ? parseFloat(parts[1]) : (DEFAULT_PRICES[Math.min(slug.length, 7)] || 50);
      items.push({ slug, category: bulkCategory, price: isNaN(basePrice) ? 50 : basePrice, slug_format: "@" });
    }
    if (items.length === 0) { toast.error("Nenhum slug válido encontrado"); return; }
    bulkAdd.mutate(items);
  };

  const filtered = (slugs || []).filter((s: any) => {
    const matchSearch = !search || s.slug.includes(search.toLowerCase()) || s.category?.includes(search.toLowerCase());
    const matchLength = lengthFilter === 0 || (lengthFilter === 7 ? s.slug.length >= 7 : s.slug.length === lengthFilter);
    return matchSearch && matchLength;
  });

  const stats = {
    total: (slugs || []).length,
    active: (slugs || []).filter((s: any) => s.active && !s.sold).length,
    sold: (slugs || []).filter((s: any) => s.sold).length,
  };

  const categoryGroups = CATEGORIES.map(cat => ({
    category: cat,
    items: filtered.filter((s: any) => s.category === cat),
  })).filter(g => g.items.length > 0);

  return (
    <div className="border border-border rounded-lg p-4 bg-card space-y-4">

      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-2">
          <Crown className="w-4 h-4 text-yellow-400" />
          <h2 className="text-sm font-bold text-card-foreground uppercase">Slugs Premium ({filtered.length})</h2>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <button onClick={() => { setBulkMode(!bulkMode); setAuctionMode(false); }}
            className={`flex items-center gap-1 text-xs font-bold px-3 py-1.5 rounded border transition-colors ${bulkMode ? "bg-accent text-accent-foreground border-accent" : "bg-secondary text-muted-foreground border-border hover:border-primary"}`}>
            <Upload className="w-3 h-3" /> Em Massa
          </button>
          <button onClick={() => { setAuctionMode(!auctionMode); setBulkMode(false); }}
            className={`flex items-center gap-1 text-xs font-bold px-3 py-1.5 rounded border transition-colors ${auctionMode ? "bg-primary text-primary-foreground border-primary" : "bg-secondary text-muted-foreground border-border hover:border-primary"}`}>
            <Gavel className="w-3 h-3" /> Criar Leilão
          </button>
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar slugs..."
              className="pl-8 pr-3 py-1.5 bg-secondary text-foreground text-xs border border-border rounded focus:outline-none focus:ring-1 focus:ring-primary w-48" />
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-2">
        <div className="bg-secondary/50 rounded-lg p-2 text-center"><p className="text-lg font-black text-foreground">{stats.total}</p><p className="text-[9px] text-muted-foreground font-bold">Total</p></div>
        <div className="bg-primary/10 rounded-lg p-2 text-center"><p className="text-lg font-black text-primary">{stats.active}</p><p className="text-[9px] text-muted-foreground font-bold">Ativos</p></div>
        <div className="bg-destructive/10 rounded-lg p-2 text-center"><p className="text-lg font-black text-destructive">{stats.sold}</p><p className="text-[9px] text-muted-foreground font-bold">Vendidos</p></div>
      </div>

      {/* Filtro por tamanho */}
      <div className="flex items-center gap-1.5 flex-wrap">
        <Filter className="w-3 h-3 text-muted-foreground" />
        <span className="text-[10px] font-bold text-muted-foreground mr-1">Letras:</span>
        {LENGTH_FILTERS.map(f => (
          <button key={f.value} onClick={() => setLengthFilter(f.value)}
            className={`px-2 py-0.5 text-[10px] font-bold rounded transition-colors ${lengthFilter === f.value ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground hover:text-foreground"}`}>
            {f.label}
          </button>
        ))}
      </div>

      {/* Preço em lote: selecionados + 1L–6L */}
      <div className="flex flex-wrap items-center gap-3 p-3 bg-muted/40 rounded-lg border border-border">
        <span className="text-[10px] font-bold text-muted-foreground">Preço em lote:</span>
        <label className="flex items-center gap-1.5 text-xs cursor-pointer">
          <input type="checkbox" checked={selectedIds.size === (slugs || []).filter((s: any) => s.active && !s.sold).length && selectedIds.size > 0} onChange={toggleSelectAll} className="rounded border-border" />
          Selecionar todos (ativos)
        </label>
        <div className="flex items-center gap-1.5">
          <Input type="number" value={bulkPriceValue} onChange={e => setBulkPriceValue(e.target.value)} placeholder="Preço $" className="w-20 h-7 text-xs" />
          <button onClick={setPriceForSelected} disabled={!selectedIds.size || bulkUpdatePrice.isPending} className="h-7 px-2 text-[10px] font-bold bg-primary text-primary-foreground rounded hover:bg-primary/90 disabled:opacity-40">Aplicar aos selecionados</button>
        </div>
        <span className="text-[10px] text-muted-foreground">ou</span>
        <div className="flex flex-wrap gap-1">
          {[1, 2, 3, 4, 5, 6].map(len => (
            <button key={len} onClick={() => applyLengthPrice(len)} disabled={bulkUpdatePrice.isPending}
              className="px-2 py-1 text-[10px] font-bold rounded bg-secondary hover:bg-primary hover:text-primary-foreground disabled:opacity-40">
              {len}L ${DEFAULT_PRICES[len] ?? 50}
            </button>
          ))}
        </div>
      </div>

      {/* Tabela de preços padrão (só /@) */}
      <div className="bg-muted/30 rounded-lg p-3 border border-border">
        <p className="text-[10px] font-bold text-muted-foreground mb-2">PREÇOS PADRÃO (hashpo.com/@)</p>
        <div className="flex flex-wrap gap-2">
          {Object.entries(DEFAULT_PRICES).map(([len, base]) => (
            <div key={len} className="bg-secondary rounded px-2 py-1 text-center space-y-0.5">
              <p className="text-[10px] font-bold text-foreground">{len}L</p>
              <p className="text-[10px] font-mono text-yellow-500">${base}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── Criar Leilão ── */}
      {auctionMode && (
        <div className="p-4 bg-primary/10 rounded-lg border border-primary/20 space-y-3">
          <div className="flex items-center gap-2"><Gavel className="w-4 h-4 text-primary" /><span className="text-xs font-bold text-foreground">Criar Leilão de Slug (aparece no Marketplace)</span></div>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-muted-foreground">Slug</label>
              <Input value={auctionSlug} onChange={e => setAuctionSlug(normalizeSlug(e.target.value))} placeholder="crypto" className="h-8 text-xs" />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-muted-foreground">Lance mín. ($)</label>
              <Input type="number" min={0} step={1} value={auctionMinPrice} onChange={e => setAuctionMinPrice(e.target.value)} className="h-8 text-xs" placeholder="100" />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-muted-foreground">Incremento mín. ($)</label>
              <Input type="number" min={1} step={1} value={auctionMinIncrement} onChange={e => setAuctionMinIncrement(e.target.value)} className="h-8 text-xs" placeholder="10" />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-muted-foreground">Duração (dias)</label>
              <Input type="number" min={1} value={auctionDays} onChange={e => setAuctionDays(e.target.value)} className="h-8 text-xs" />
            </div>
          </div>
          {auctionSlug && (
            <p className="text-[10px] font-mono text-muted-foreground">
              hashpo.com/@{normalizeSlug(auctionSlug) || auctionSlug} · Lance mín.: ${auctionMinPrice} · Incremento: ${auctionMinIncrement} · {auctionDays} dias
            </p>
          )}
          <button onClick={() => createAuction.mutate()} disabled={createAuction.isPending || !normalizeSlug(auctionSlug)}
            className="h-8 px-4 bg-primary text-primary-foreground text-xs font-bold rounded hover:bg-primary/90 disabled:opacity-40 flex items-center gap-1">
            <Gavel className="w-3 h-3" /> Criar Leilão
          </button>

          {/* Leilões recentes (slug_auctions) */}
          {(auctions || []).length > 0 && (
            <div className="mt-2 space-y-1.5">
              <p className="text-[10px] font-bold text-muted-foreground uppercase">Leilões Recentes</p>
              {(auctions as any[]).slice(0, 5).map((a: any) => (
                <div key={a.id} className="flex items-center justify-between bg-secondary/50 rounded px-3 py-1.5 text-xs">
                  <div className="flex items-center gap-2">
                    <FmtBadge />
                    <span className="font-mono font-bold text-foreground">{a.keyword || a.slug}</span>
                  </div>
                  <div className="flex items-center gap-3 text-muted-foreground">
                    <span className="font-mono">${a.current_bid ?? a.starting_price}</span>
                    <span className="text-[9px]">+${a.min_increment ?? 10}/lance</span>
                    <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold ${a.status === "active" ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"}`}>{a.status}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Importação em massa ── */}
      {bulkMode && (
        <div className="p-4 bg-accent/10 rounded-lg border border-accent/20 space-y-3">
          <div className="flex items-center gap-2"><Upload className="w-4 h-4 text-accent" /><span className="text-xs font-bold text-foreground">Importação em Massa</span></div>
          <p className="text-[10px] text-muted-foreground">Um slug por linha. Formato: <code className="bg-secondary px-1 rounded">slug:preço_base</code> ou apenas <code className="bg-secondary px-1 rounded">slug</code>. Todos como hashpo.com/@</p>

          <div className="flex gap-2 items-end">
            <div className="flex-1 space-y-1">
              <Textarea value={bulkText} onChange={e => setBulkText(e.target.value)}
                placeholder={"doctor:2000\nlawyer:1500\ncrypto:1800\ndesigner\nphotographer:600"} rows={6} className="text-xs font-mono" />
            </div>
            <div className="space-y-2">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-muted-foreground">Categoria</label>
                <select value={bulkCategory} onChange={e => setBulkCategory(e.target.value)} className="h-8 px-2 text-xs bg-secondary text-foreground border border-border rounded w-full">
                  {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <button onClick={handleBulkAdd} disabled={bulkAdd.isPending || !bulkText.trim()}
                className="w-full h-8 px-3 bg-accent text-accent-foreground text-xs font-bold rounded hover:opacity-90 disabled:opacity-40 flex items-center justify-center gap-1">
                <Plus className="w-3 h-3" /> Importar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Adicionar slug individual ── */}
      <div className="p-3 bg-muted/50 rounded-lg border border-border space-y-2">
        <p className="text-[10px] font-bold text-muted-foreground uppercase">Adicionar Slug (hashpo.com/@)</p>
        <div className="flex flex-wrap items-end gap-2">
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-muted-foreground">Slug</label>
            <Input value={newSlug} onChange={e => handleSlugChange(e.target.value)} placeholder="doctor" className="w-28 h-8 text-xs" />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-muted-foreground">Categoria</label>
            <select value={newCategory} onChange={e => setNewCategory(e.target.value)} className="h-8 px-2 text-xs bg-secondary text-foreground border border-border rounded">
              {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-yellow-500 flex items-center gap-0.5"><AtSign className="w-2.5 h-2.5" /> Preço ($)</label>
            <Input type="number" value={newPrice} onChange={e => setNewPrice(e.target.value)} className="w-24 h-8 text-xs" />
          </div>
          <button onClick={handleAdd} disabled={addSlug.isPending || !newSlug.trim()}
            className="h-8 px-3 bg-primary text-primary-foreground text-xs font-bold rounded hover:bg-primary/90 disabled:opacity-40 flex items-center gap-1">
            <Plus className="w-3 h-3" /> Adicionar
          </button>
        </div>
      </div>

      {/* ── Lista de slugs ── */}
      {isLoading ? (
        <p className="text-xs text-muted-foreground text-center py-6">Carregando...</p>
      ) : (
        <div className="space-y-4">
          {categoryGroups.map(({ category, items }) => (
            <div key={category}>
              <div className="flex items-center gap-2 mb-2">
                <Tag className="w-3 h-3 text-primary" />
                <h3 className="text-xs font-bold text-primary uppercase">{category}</h3>
                <span className="text-[10px] text-muted-foreground">({items.length})</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                {items.map((s: any) => (
                    <div key={s.id} className={`flex items-center justify-between gap-2 p-2.5 rounded-lg border ${!s.active ? "bg-muted/20 border-border/30 opacity-50" : s.sold ? "bg-muted/30 border-border/50 opacity-60" : "bg-secondary/50 border-border"}`}>
                      <div className="flex items-center gap-1.5 min-w-0 flex-1">
                        {!s.sold && (
                          <input type="checkbox" checked={selectedIds.has(s.id)} onChange={() => toggleSelect(s.id)} className="rounded border-border shrink-0" />
                        )}
                        <FmtBadge />
                        <span className="font-mono font-bold text-sm text-foreground truncate">{s.slug}</span>
                        {s.sold && <span className="text-[9px] font-bold text-destructive bg-destructive/10 px-1.5 py-0.5 rounded">VENDIDO</span>}
                        {!s.active && <span className="text-[9px] font-bold text-muted-foreground bg-muted px-1.5 py-0.5 rounded">INATIVO</span>}
                      </div>

                      <div className="flex items-center gap-1 shrink-0">
                        {/* Transfer */}
                        {transferSlugId === s.id ? (
                          <div className="flex items-center gap-1">
                            <Input value={transferEmail} onChange={e => setTransferEmail(e.target.value)} placeholder="email/nome" className="w-24 h-6 text-[10px] px-1" />
                            <button onClick={() => transferSlug.mutate({ slugId: s.id, email: transferEmail })} className="text-primary text-[10px] font-bold" disabled={transferSlug.isPending}><Send className="w-3 h-3" /></button>
                            <button onClick={() => setTransferSlugId(null)} className="text-muted-foreground text-[10px]">X</button>
                          </div>
                        ) : (
                          <button onClick={() => { setTransferSlugId(s.id); setTransferEmail(""); }} className="text-muted-foreground hover:text-primary p-0.5" title="Transferir"><Send className="w-3 h-3" /></button>
                        )}

                        <button onClick={() => updateSlug.mutate({ id: s.id, active: !s.active })} className={`p-0.5 ${s.active ? "text-primary" : "text-muted-foreground"}`} title={s.active ? "Desativar" : "Ativar"}><Power className="w-3 h-3" /></button>

                        {editingId === s.id ? (
                          <>
                            <Input type="number" value={editPrice} onChange={e => setEditPrice(e.target.value)} className="w-16 h-6 text-xs px-1" />
                            <button onClick={() => updateSlug.mutate({ id: s.id, price: parseFloat(editPrice) || 100 })} className="text-primary text-[10px] font-bold">OK</button>
                            <button onClick={() => setEditingId(null)} className="text-muted-foreground text-[10px]">X</button>
                          </>
                        ) : (
                          <>
                            <button onClick={() => { setEditingId(s.id); setEditPrice(String(s.price)); }} className="flex items-center gap-0.5 text-xs font-mono text-foreground hover:text-primary">
                              <DollarSign className="w-3 h-3" />{s.price}
                            </button>
                            <button onClick={() => { if (confirm(`Deletar "${s.slug}" (hashpo.com/@${s.slug})?`)) deleteSlug.mutate(s.id); }} className="text-destructive hover:text-destructive/80 p-0.5"><Trash2 className="w-3 h-3" /></button>
                          </>
                        )}
                      </div>
                    </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AdminPremiumSlugs;
