import { useState } from "react";
import Header from "@/components/Header";
import SEO from "@/components/SEO";
import { useAuth } from "@/hooks/useAuth";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle
} from "@/components/ui/alert-dialog";
import {
  Globe, Search, Plus, ExternalLink, ShieldCheck, Clock, Check, X,
  DollarSign, Tag, Eye, Wallet, CreditCard, ArrowRight, Handshake,
  AlertTriangle, Trash2
} from "lucide-react";

/* ── Hooks ── */

function useDomainListings(search: string, typeFilter: string) {
  return useQuery({
    queryKey: ["domain-listings", search, typeFilter],
    queryFn: async () => {
      let q = supabase
        .from("domain_listings")
        .select("*")
        .eq("status", "active")
        .order("created_at", { ascending: false });
      if (typeFilter !== "all") q = q.eq("domain_type", typeFilter);
      const { data } = await q;
      let results = (data || []) as any[];
      if (search.trim()) {
        const s = search.toLowerCase();
        results = results.filter((d: any) =>
          d.domain_name.toLowerCase().includes(s) || (d.tld || "").toLowerCase().includes(s)
        );
      }
      return results;
    },
  });
}

function useMyListings() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["my-domain-listings", user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("domain_listings")
        .select("*")
        .eq("seller_id", user!.id)
        .order("created_at", { ascending: false });
      return (data || []) as any[];
    },
    enabled: !!user,
  });
}

function useMyEscrows() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["my-escrows", user?.id],
    queryFn: async () => {
      const { data: asBuyer } = await supabase
        .from("domain_escrows")
        .select("*")
        .eq("buyer_id", user!.id)
        .order("created_at", { ascending: false });
      const { data: asSeller } = await supabase
        .from("domain_escrows")
        .select("*")
        .eq("seller_id", user!.id)
        .order("created_at", { ascending: false });
      const all = [...(asBuyer || []), ...(asSeller || [])];
      const unique = Array.from(new Map(all.map((e: any) => [e.id, e])).values());
      return unique.sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()) as any[];
    },
    enabled: !!user,
  });
}

/* ── Helpers ── */

const DOMAIN_CATEGORIES = [
  { value: "general", label: "Geral" },
  { value: "tech", label: "Tech" },
  { value: "finance", label: "Finanças" },
  { value: "crypto", label: "Crypto" },
  { value: "media", label: "Mídia" },
  { value: "brand", label: "Marca" },
  { value: "short", label: "Curto/Premium" },
];

const statusColors: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-700",
  funded: "bg-blue-100 text-blue-700",
  confirmed: "bg-green-100 text-green-700",
  released: "bg-emerald-100 text-emerald-700",
  disputed: "bg-red-100 text-red-700",
  cancelled: "bg-gray-100 text-gray-500",
  active: "bg-green-100 text-green-700",
  sold: "bg-blue-100 text-blue-700",
};

const statusLabels: Record<string, string> = {
  pending: "Aguardando Pagamento",
  funded: "Pago — Aguardando Transferência",
  confirmed: "Ambas Partes Confirmaram",
  released: "Liberado ✅",
  disputed: "Em Disputa",
  cancelled: "Cancelado",
};

/* ── Component ── */

const DomainMarketplace = () => {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const { data: listings } = useDomainListings(search, typeFilter);
  const { data: myListings } = useMyListings();
  const { data: myEscrows } = useMyEscrows();

  // Create listing state
  const [showCreate, setShowCreate] = useState(false);
  const [newDomain, setNewDomain] = useState({ domain_name: "", domain_url: "", domain_type: "web2", tld: "", description: "", price: "", currency: "USDC", accept_crypto: true, accept_stripe: false, registrar: "", category: "general" });

  // Buy / escrow state
  const [buyListing, setBuyListing] = useState<any>(null);
  const [paymentMethod, setPaymentMethod] = useState<"crypto" | "stripe">("crypto");

  // Create listing
  const createListing = useMutation({
    mutationFn: async () => {
      if (!newDomain.domain_name || !newDomain.price) throw new Error("Nome e preço obrigatórios");
      let url = newDomain.domain_url || newDomain.domain_name;
      if (!url.startsWith("http")) url = "https://" + url;
      const tld = newDomain.domain_name.includes(".") ? newDomain.domain_name.split(".").pop() : newDomain.tld;
      const { error } = await supabase.from("domain_listings").insert({
        seller_id: user!.id,
        domain_name: newDomain.domain_name.toLowerCase().trim(),
        domain_url: url,
        domain_type: newDomain.domain_type,
        tld: tld || "",
        description: newDomain.description,
        price: parseFloat(newDomain.price),
        currency: newDomain.currency,
        accept_crypto: newDomain.accept_crypto,
        accept_stripe: newDomain.accept_stripe,
        registrar: newDomain.registrar,
        category: newDomain.category,
      } as any);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["domain-listings"] });
      qc.invalidateQueries({ queryKey: ["my-domain-listings"] });
      toast.success("Domínio listado com sucesso!");
      setShowCreate(false);
      setNewDomain({ domain_name: "", domain_url: "", domain_type: "web2", tld: "", description: "", price: "", currency: "USDC", accept_crypto: true, accept_stripe: false, registrar: "", category: "general" });
    },
    onError: (e: any) => toast.error(e.message),
  });

  // Initiate escrow (buyer clicks "Comprar")
  const initiateEscrow = useMutation({
    mutationFn: async () => {
      if (!buyListing) throw new Error("Nenhum domínio selecionado");
      const platformFee = buyListing.price * 0.05;
      const { error } = await supabase.from("domain_escrows").insert({
        listing_id: buyListing.id,
        buyer_id: user!.id,
        seller_id: buyListing.seller_id,
        domain_name: buyListing.domain_name,
        amount: buyListing.price,
        currency: buyListing.currency,
        payment_method: paymentMethod,
        status: "pending",
        platform_fee_pct: 5,
        platform_fee_amount: platformFee,
        net_to_seller: buyListing.price - platformFee,
      } as any);
      if (error) throw error;
      // Mark listing as in-escrow
      await supabase.from("domain_listings").update({ status: "in_escrow" } as any).eq("id", buyListing.id);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["domain-listings"] });
      qc.invalidateQueries({ queryKey: ["my-escrows"] });
      toast.success("Escrow criado! Realize o pagamento para avançar.");
      setBuyListing(null);
    },
    onError: (e: any) => toast.error(e.message),
  });

  // Confirm (buyer or seller)
  const confirmEscrow = useMutation({
    mutationFn: async ({ escrowId, role }: { escrowId: string; role: "buyer" | "seller" }) => {
      const field = role === "buyer" ? "buyer_confirmed" : "seller_confirmed";
      const { error } = await supabase.from("domain_escrows").update({ [field]: true } as any).eq("id", escrowId);
      if (error) throw error;
      // Check if both confirmed → release
      const { data: esc } = await supabase.from("domain_escrows").select("*").eq("id", escrowId).single();
      if (esc && (esc as any).buyer_confirmed && (esc as any).seller_confirmed) {
        await supabase.from("domain_escrows").update({ status: "released", released_at: new Date().toISOString() } as any).eq("id", escrowId);
        if ((esc as any).listing_id) {
          await supabase.from("domain_listings").update({ status: "sold" } as any).eq("id", (esc as any).listing_id);
        }
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["my-escrows"] });
      qc.invalidateQueries({ queryKey: ["domain-listings"] });
      toast.success("Confirmação registrada!");
    },
    onError: (e: any) => toast.error(e.message),
  });

  // Mark escrow as funded (simulated — in prod would be webhook)
  const markFunded = useMutation({
    mutationFn: async (escrowId: string) => {
      const { error } = await supabase.from("domain_escrows").update({ status: "funded" } as any).eq("id", escrowId);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["my-escrows"] });
      toast.success("Pagamento confirmado! Agora o vendedor deve transferir o domínio.");
    },
  });

  // Delete listing
  const deleteListing = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("domain_listings").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["domain-listings"] });
      qc.invalidateQueries({ queryKey: ["my-domain-listings"] });
      toast.success("Listagem removida!");
    },
  });

  return (
    <div className="min-h-screen bg-background">
      <SEO title="Domain Marketplace – HASHPO" description="Buy and sell web2 and web3 domains with built-in escrow." />
      <Header />

      <div className="max-w-7xl mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <Globe className="w-7 h-7 text-primary" />
            <div>
              <h1 className="text-2xl font-black text-foreground">Domain Marketplace</h1>
              <p className="text-xs text-muted-foreground">Compre e venda domínios Web2 e Web3 com escrow seguro</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="relative w-56">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar domínio..." className="pl-10" />
            </div>
            {user && (
              <button onClick={() => setShowCreate(!showCreate)}
                className="flex items-center gap-1.5 bg-primary text-primary-foreground px-4 py-2 rounded-lg text-xs font-bold hover:bg-primary/90">
                <Plus className="w-3.5 h-3.5" /> Listar Domínio
              </button>
            )}
          </div>
        </div>

        {/* Type filter */}
        <div className="flex gap-2">
          {[{ v: "all", l: "Todos" }, { v: "web2", l: "Web2 (.com, .net...)" }, { v: "web3", l: "Web3 (.eth, .crypto...)" }].map(f => (
            <button key={f.v} onClick={() => setTypeFilter(f.v)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${typeFilter === f.v ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground hover:bg-muted"}`}>
              {f.l}
            </button>
          ))}
        </div>

        {/* Create form */}
        {showCreate && user && (
          <div className="bg-card border border-border rounded-xl p-6 space-y-4">
            <h2 className="text-sm font-black text-foreground flex items-center gap-2">
              <Plus className="w-4 h-4 text-primary" /> Listar Novo Domínio
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-muted-foreground uppercase">Nome do Domínio *</label>
                <Input value={newDomain.domain_name} onChange={e => setNewDomain(p => ({ ...p, domain_name: e.target.value }))} placeholder="exemplo.com ou meudominio.eth" />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-muted-foreground uppercase">URL do Domínio (redirect)</label>
                <Input value={newDomain.domain_url} onChange={e => setNewDomain(p => ({ ...p, domain_url: e.target.value }))} placeholder="https://exemplo.com" />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-muted-foreground uppercase">Tipo</label>
                <select value={newDomain.domain_type} onChange={e => setNewDomain(p => ({ ...p, domain_type: e.target.value }))}
                  className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground text-sm">
                  <option value="web2">Web2 (.com, .net, .org...)</option>
                  <option value="web3">Web3 (.eth, .crypto, .sol...)</option>
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-muted-foreground uppercase">Preço *</label>
                <Input type="number" value={newDomain.price} onChange={e => setNewDomain(p => ({ ...p, price: e.target.value }))} placeholder="500" />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-muted-foreground uppercase">Moeda</label>
                <select value={newDomain.currency} onChange={e => setNewDomain(p => ({ ...p, currency: e.target.value }))}
                  className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground text-sm">
                  <option value="USDC">USDC</option>
                  <option value="MATIC">MATIC</option>
                  <option value="USD">USD (Stripe)</option>
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-muted-foreground uppercase">Categoria</label>
                <select value={newDomain.category} onChange={e => setNewDomain(p => ({ ...p, category: e.target.value }))}
                  className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground text-sm">
                  {DOMAIN_CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-muted-foreground uppercase">Registrador</label>
                <Input value={newDomain.registrar} onChange={e => setNewDomain(p => ({ ...p, registrar: e.target.value }))} placeholder="GoDaddy, Namecheap, ENS..." />
              </div>
              <div className="space-y-1 md:col-span-2">
                <label className="text-[10px] font-bold text-muted-foreground uppercase">Descrição</label>
                <textarea value={newDomain.description} onChange={e => setNewDomain(p => ({ ...p, description: e.target.value }))}
                  className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground text-sm resize-y h-16"
                  placeholder="Descreva o domínio, histórico, tráfego, etc." />
              </div>
            </div>
            <div className="flex items-center gap-6">
              <label className="flex items-center gap-2 text-xs text-foreground">
                <input type="checkbox" checked={newDomain.accept_crypto} onChange={e => setNewDomain(p => ({ ...p, accept_crypto: e.target.checked }))} className="rounded" />
                <Wallet className="w-3.5 h-3.5" /> Aceitar Crypto (USDC/MATIC)
              </label>
              <label className="flex items-center gap-2 text-xs text-foreground">
                <input type="checkbox" checked={newDomain.accept_stripe} onChange={e => setNewDomain(p => ({ ...p, accept_stripe: e.target.checked }))} className="rounded" />
                <CreditCard className="w-3.5 h-3.5" /> Aceitar Stripe
              </label>
            </div>
            <div className="flex gap-3">
              <button onClick={() => createListing.mutate()} disabled={createListing.isPending || !newDomain.domain_name || !newDomain.price}
                className="flex items-center gap-1.5 bg-primary text-primary-foreground px-5 py-2.5 rounded-lg text-xs font-bold hover:bg-primary/90 disabled:opacity-50">
                <Plus className="w-3.5 h-3.5" /> Publicar Listagem
              </button>
              <button onClick={() => setShowCreate(false)} className="px-4 py-2 text-xs font-bold text-muted-foreground hover:text-foreground">Cancelar</button>
            </div>
          </div>
        )}

        <Tabs defaultValue="browse" className="space-y-4">
          <TabsList className="flex-wrap">
            <TabsTrigger value="browse" className="flex items-center gap-1.5"><Globe className="w-3.5 h-3.5" /> Explorar</TabsTrigger>
            {user && (
              <>
                <TabsTrigger value="my-listings" className="flex items-center gap-1.5"><Tag className="w-3.5 h-3.5" /> Meus Domínios</TabsTrigger>
                <TabsTrigger value="escrows" className="flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5" /> Escrow
                  {(myEscrows || []).filter((e: any) => !["released", "cancelled"].includes(e.status)).length > 0 && (
                    <span className="ml-1 bg-accent text-accent-foreground text-[9px] font-bold px-1.5 py-0.5 rounded-full">
                      {(myEscrows || []).filter((e: any) => !["released", "cancelled"].includes(e.status)).length}
                    </span>
                  )}
                </TabsTrigger>
              </>
            )}
          </TabsList>

          {/* Browse domains */}
          <TabsContent value="browse">
            {!(listings || []).length ? (
              <div className="text-center py-16 text-muted-foreground text-sm">
                Nenhum domínio disponível. {user ? "Seja o primeiro a listar!" : "Faça login para listar domínios."}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {(listings || []).map((d: any) => (
                  <DomainCard key={d.id} domain={d} user={user} onBuy={() => setBuyListing(d)} />
                ))}
              </div>
            )}
          </TabsContent>

          {/* My listings */}
          {user && (
            <TabsContent value="my-listings">
              {!(myListings || []).length ? (
                <div className="text-center py-16 text-muted-foreground text-sm">Você não possui domínios listados.</div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {(myListings || []).map((d: any) => (
                    <div key={d.id} className="bg-card border border-border rounded-xl p-5 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-black text-foreground">{d.domain_name}</span>
                        <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${statusColors[d.status] || "bg-gray-100 text-gray-500"}`}>{d.status}</span>
                      </div>
                      <p className="text-lg font-black text-primary">${d.price} <span className="text-[10px] text-muted-foreground font-normal">{d.currency}</span></p>
                      <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                        <Eye className="w-3 h-3" /> {d.views} views
                        <span className="px-1.5 py-0.5 bg-secondary rounded text-[9px] font-bold">{d.domain_type}</span>
                      </div>
                      <div className="flex gap-2">
                        <a href={d.domain_url} target="_blank" rel="noopener noreferrer"
                          className="flex items-center gap-1 text-[10px] text-primary hover:underline">
                          <ExternalLink className="w-3 h-3" /> Visitar
                        </a>
                        {d.status === "active" && (
                          <button onClick={() => { if (confirm("Remover listagem?")) deleteListing.mutate(d.id); }}
                            className="flex items-center gap-1 text-[10px] text-destructive hover:underline">
                            <Trash2 className="w-3 h-3" /> Remover
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>
          )}

          {/* Escrow */}
          {user && (
            <TabsContent value="escrows">
              {!(myEscrows || []).length ? (
                <div className="text-center py-16 text-muted-foreground text-sm">Nenhuma transação de escrow.</div>
              ) : (
                <div className="space-y-4">
                  {(myEscrows || []).map((esc: any) => {
                    const isBuyer = esc.buyer_id === user.id;
                    const isSeller = esc.seller_id === user.id;
                    return (
                      <div key={esc.id} className="bg-card border border-border rounded-xl p-5 space-y-3">
                        <div className="flex items-center justify-between flex-wrap gap-2">
                          <div className="flex items-center gap-3">
                            <ShieldCheck className="w-5 h-5 text-primary" />
                            <div>
                              <span className="text-sm font-black text-foreground">{esc.domain_name}</span>
                              <p className="text-[10px] text-muted-foreground">
                                {isBuyer ? "Você é o comprador" : "Você é o vendedor"} · {esc.payment_method === "crypto" ? "Crypto" : "Stripe"}
                              </p>
                            </div>
                          </div>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${statusColors[esc.status] || "bg-gray-100 text-gray-500"}`}>
                            {statusLabels[esc.status] || esc.status}
                          </span>
                        </div>

                        <div className="grid grid-cols-3 gap-4 text-center">
                          <div>
                            <p className="text-[10px] text-muted-foreground uppercase font-bold">Valor Total</p>
                            <p className="text-lg font-black text-foreground">${esc.amount}</p>
                          </div>
                          <div>
                            <p className="text-[10px] text-muted-foreground uppercase font-bold">Taxa Plataforma</p>
                            <p className="text-sm font-bold text-muted-foreground">${esc.platform_fee_amount} ({esc.platform_fee_pct}%)</p>
                          </div>
                          <div>
                            <p className="text-[10px] text-muted-foreground uppercase font-bold">Recebe Vendedor</p>
                            <p className="text-lg font-black text-primary">${esc.net_to_seller}</p>
                          </div>
                        </div>

                        {/* Escrow steps */}
                        <div className="flex items-center gap-2 py-2">
                          <Step done={esc.status !== "pending"} label="Pagamento" />
                          <div className="flex-1 h-px bg-border" />
                          <Step done={esc.seller_confirmed} label="Vendedor Confirma" />
                          <div className="flex-1 h-px bg-border" />
                          <Step done={esc.buyer_confirmed} label="Comprador Confirma" />
                          <div className="flex-1 h-px bg-border" />
                          <Step done={esc.status === "released"} label="Liberado" />
                        </div>

                        {/* Actions */}
                        <div className="flex gap-2 flex-wrap">
                          {esc.status === "pending" && isBuyer && (
                            <button onClick={() => markFunded.mutate(esc.id)}
                              className="flex items-center gap-1 bg-primary text-primary-foreground px-4 py-2 rounded-lg text-xs font-bold hover:bg-primary/90">
                              <DollarSign className="w-3.5 h-3.5" /> Confirmar Pagamento
                            </button>
                          )}
                          {esc.status === "funded" && isSeller && !esc.seller_confirmed && (
                            <button onClick={() => confirmEscrow.mutate({ escrowId: esc.id, role: "seller" })}
                              className="flex items-center gap-1 bg-accent text-accent-foreground px-4 py-2 rounded-lg text-xs font-bold hover:opacity-90">
                              <Check className="w-3.5 h-3.5" /> Confirmar Transferência do Domínio
                            </button>
                          )}
                          {esc.status === "funded" && isBuyer && esc.seller_confirmed && !esc.buyer_confirmed && (
                            <button onClick={() => confirmEscrow.mutate({ escrowId: esc.id, role: "buyer" })}
                              className="flex items-center gap-1 bg-accent text-accent-foreground px-4 py-2 rounded-lg text-xs font-bold hover:opacity-90">
                              <Check className="w-3.5 h-3.5" /> Confirmar Recebimento do Domínio
                            </button>
                          )}
                          {esc.status === "released" && (
                            <p className="text-xs text-muted-foreground flex items-center gap-1">
                              <Check className="w-3.5 h-3.5 text-[hsl(var(--ticker-up))]" /> Transação concluída em {new Date(esc.released_at).toLocaleDateString()}
                            </p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </TabsContent>
          )}
        </Tabs>
      </div>

      {/* Buy dialog */}
      <AlertDialog open={!!buyListing} onOpenChange={o => !o && setBuyListing(null)}>
        <AlertDialogContent className="max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <Handshake className="w-5 h-5 text-primary" /> Comprar Domínio
            </AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-4 text-sm">
                <div className="bg-secondary/50 rounded-lg p-4">
                  <p className="font-mono font-black text-foreground text-lg">{buyListing?.domain_name}</p>
                  <p className="text-[10px] text-muted-foreground mt-1">
                    {buyListing?.domain_type === "web3" ? "Domínio Web3" : "Domínio Web2"} · {buyListing?.registrar || "N/A"}
                  </p>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Preço:</span>
                  <span className="font-mono font-black text-primary text-xl">${buyListing?.price} {buyListing?.currency}</span>
                </div>
                <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                  <span>Taxa plataforma (5%):</span>
                  <span>${((buyListing?.price || 0) * 0.05).toFixed(2)}</span>
                </div>

                <div className="space-y-2">
                  <p className="text-[10px] font-bold text-muted-foreground uppercase">Método de Pagamento</p>
                  <div className="flex gap-2">
                    {buyListing?.accept_crypto && (
                      <button onClick={() => setPaymentMethod("crypto")}
                        className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold transition-colors ${paymentMethod === "crypto" ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground"}`}>
                        <Wallet className="w-3.5 h-3.5" /> Crypto (USDC/MATIC)
                      </button>
                    )}
                    {buyListing?.accept_stripe && (
                      <button onClick={() => setPaymentMethod("stripe")}
                        className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold transition-colors ${paymentMethod === "stripe" ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground"}`}>
                        <CreditCard className="w-3.5 h-3.5" /> Stripe
                      </button>
                    )}
                  </div>
                </div>

                <div className="bg-accent/10 rounded-lg p-3 text-[10px] text-muted-foreground space-y-1">
                  <p className="font-bold text-foreground flex items-center gap-1"><ShieldCheck className="w-3 h-3 text-primary" /> Como funciona o Escrow:</p>
                  <p>1. Você paga → fundos ficam em custódia</p>
                  <p>2. Vendedor transfere o domínio para você</p>
                  <p>3. Vendedor confirma a transferência</p>
                  <p>4. Você confirma o recebimento</p>
                  <p>5. Fundos são liberados automaticamente ao vendedor</p>
                </div>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={() => initiateEscrow.mutate()} className="bg-primary text-primary-foreground">
              <ShieldCheck className="w-3.5 h-3.5 mr-1" /> Iniciar Escrow ${buyListing?.price}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

/* ── Sub-components ── */

const DomainCard = ({ domain, user, onBuy }: { domain: any; user: any; onBuy: () => void }) => (
  <div className="bg-card border border-border rounded-xl overflow-hidden hover:shadow-lg hover:border-primary/30 transition-all group">
    <div className={`px-4 py-2 flex items-center justify-between ${domain.domain_type === "web3" ? "bg-accent/10" : "bg-primary/5"}`}>
      <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${domain.domain_type === "web3" ? "bg-accent/20 text-accent" : "bg-primary/20 text-primary"}`}>
        {domain.domain_type === "web3" ? "WEB3" : "WEB2"}
      </span>
      {domain.tld && <span className="text-[10px] font-mono text-muted-foreground">.{domain.tld}</span>}
    </div>
    <div className="p-5 space-y-3">
      <a href={domain.domain_url} target="_blank" rel="noopener noreferrer"
        className="text-lg font-black text-foreground hover:text-primary transition-colors flex items-center gap-1.5 group-hover:underline">
        {domain.domain_name}
        <ExternalLink className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity" />
      </a>
      {domain.description && <p className="text-[10px] text-muted-foreground line-clamp-2">{domain.description}</p>}
      <div className="flex items-center justify-between">
        <p className="text-xl font-black text-primary">${domain.price.toLocaleString()} <span className="text-[10px] font-normal text-muted-foreground">{domain.currency}</span></p>
      </div>
      <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
        {domain.accept_crypto && <span className="flex items-center gap-0.5"><Wallet className="w-3 h-3" /> Crypto</span>}
        {domain.accept_stripe && <span className="flex items-center gap-0.5"><CreditCard className="w-3 h-3" /> Stripe</span>}
        {domain.registrar && <span>· {domain.registrar}</span>}
      </div>
      {user && domain.seller_id !== user.id ? (
        <button onClick={onBuy}
          className="w-full py-2.5 bg-primary text-primary-foreground rounded-lg text-xs font-bold hover:bg-primary/90 transition-colors flex items-center justify-center gap-1.5">
          <Handshake className="w-3.5 h-3.5" /> Comprar com Escrow
        </button>
      ) : !user ? (
        <p className="text-[10px] text-muted-foreground text-center">Faça login para comprar</p>
      ) : (
        <p className="text-[10px] text-muted-foreground text-center italic">Seu domínio</p>
      )}
    </div>
  </div>
);

const Step = ({ done, label }: { done: boolean; label: string }) => (
  <div className="flex flex-col items-center gap-1">
    <div className={`w-6 h-6 rounded-full flex items-center justify-center ${done ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground"}`}>
      {done ? <Check className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
    </div>
    <span className="text-[8px] text-muted-foreground text-center leading-tight max-w-16">{label}</span>
  </div>
);

export default DomainMarketplace;
