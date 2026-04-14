import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import SEO from "@/components/SEO";
import Header from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Crown, Gavel, Timer, DollarSign, Trophy, Tag, ShoppingCart, AtSign } from "lucide-react";

// Só usamos formato /@ (hashpo.com/@slug)
const FORMAT_INFO = { "@": { label: "/@username", badge: "Premium", color: "from-yellow-500 to-amber-600" } };

function useAuctions() {
  return useQuery({
    queryKey: ["subdomain-auctions"],
    queryFn: async () => {
      const { data } = await supabase
        .from("subdomain_auctions")
        .select("*")
        .eq("status", "active")
        .order("slug_length")
        .order("ends_at");
      return data || [];
    },
  });
}

function usePremiumSlugs() {
  return useQuery({
    queryKey: ["premium-slugs-available"],
    queryFn: async () => {
      const { data } = await supabase
        .from("premium_slugs")
        .select("*")
        .eq("sold", false)
        .order("price", { ascending: false });
      return data || [];
    },
  });
}

function usePlaceBid() {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async ({ auctionId, amount }: { auctionId: string; amount: number }) => {
      const { error: bidErr } = await supabase.from("subdomain_bids").insert({ auction_id: auctionId, bidder_id: user!.id, amount });
      if (bidErr) throw bidErr;
      const { error: upErr } = await supabase.from("subdomain_auctions").update({ current_bid: amount, current_bidder_id: user!.id }).eq("id", auctionId);
      if (upErr) throw upErr;
    },
    onSuccess: () => { toast.success("Lance registrado!"); qc.invalidateQueries({ queryKey: ["subdomain-auctions"] }); },
    onError: (err: any) => toast.error(err.message),
  });
}

function useBuyPremiumSlug() {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (slugId: string) => {
      const { error } = await supabase.from("premium_slugs").update({ sold: true, buyer_id: user!.id }).eq("id", slugId).eq("sold", false);
      if (error) throw error;
    },
    onSuccess: () => { toast.success("Nome adquirido! Configure seu Mini Site com este slug."); qc.invalidateQueries({ queryKey: ["premium-slugs-available"] }); },
    onError: (err: any) => toast.error(err.message),
  });
}

function timeLeft(endsAt: string) {
  const diff = new Date(endsAt).getTime() - Date.now();
  if (diff <= 0) return "Encerrado";
  const days = Math.floor(diff / 86400000);
  const hours = Math.floor((diff % 86400000) / 3600000);
  if (days > 0) return `${days}d ${hours}h`;
  const mins = Math.floor((diff % 3600000) / 60000);
  return `${hours}h ${mins}m`;
}

const tierColors: Record<number, string> = {
  1: "bg-gradient-to-r from-yellow-500 to-amber-600 text-white",
  2: "bg-gradient-to-r from-purple-500 to-indigo-600 text-white",
  3: "bg-gradient-to-r from-blue-500 to-blue-700 text-white",
  4: "bg-gradient-to-r from-emerald-500 to-teal-600 text-white",
};

const categoryColors: Record<string, string> = {
  profession: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  tech: "bg-violet-500/10 text-violet-400 border-violet-500/20",
  finance: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  entertainment: "bg-pink-500/10 text-pink-400 border-pink-500/20",
  lifestyle: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  creative: "bg-cyan-500/10 text-cyan-400 border-cyan-500/20",
  media: "bg-red-500/10 text-red-400 border-red-500/20",
  general: "bg-gray-500/10 text-gray-400 border-gray-500/20",
};

const FormatBadge = () => (
  <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full text-white bg-gradient-to-r ${FORMAT_INFO["@"].color}`}>
    <AtSign className="w-2.5 h-2.5" /> {FORMAT_INFO["@"].badge}
  </span>
);

const SubdomainAuction = () => {
  const { user } = useAuth();
  const { data: auctions, isLoading } = useAuctions();
  const { data: premiumSlugs, isLoading: slugsLoading } = usePremiumSlugs();
  const placeBid = usePlaceBid();
  const buySlug = useBuyPremiumSlug();
  const [bidAmounts, setBidAmounts] = useState<Record<string, string>>({});
  const [filterCat, setFilterCat] = useState<string | null>(null);

  const handleBuySlug = (s: any) => {
    if (!user) { toast.error("Faça login primeiro"); return; }
    const url = `hashpo.com/@${s.slug}`;
    if (!confirm(`Comprar "${s.slug}" (${url}) por $${Number(s.price).toLocaleString()}?`)) return;
    buySlug.mutate(s.id);
  };

  const handleBid = (auction: any) => {
    const amount = parseFloat(bidAmounts[auction.id] || "0");
    const minBid = Math.max(auction.min_price, (auction.current_bid || 0) + 10);
    if (!user || amount < minBid) return;
    placeBid.mutate({ auctionId: auction.id, amount });
  };

  const filteredSlugs = filterCat
    ? (premiumSlugs || []).filter((s: any) => s.category === filterCat)
    : premiumSlugs || [];
  const categories = [...new Set((premiumSlugs || []).map((s: any) => s.category))];

  return (
    <div className="min-h-screen bg-background">
      <SEO title="Leilão de Slugs" description="Garanta slugs premium e nomes quentes para seu mini site no HASHPO." />
      <Header />

      {/* Hero */}
      <section className="bg-primary px-6 py-12 text-center">
        <div className="mx-auto max-w-3xl">
          <Crown className="w-10 h-10 text-yellow-400 mx-auto mb-3" />
          <h1 className="text-2xl md:text-4xl font-extrabold text-primary-foreground">Nomes Premium & Leilões</h1>
          <p className="text-sm text-primary-foreground/70 mt-2 max-w-xl mx-auto">
            Garanta nomes como <strong>doctor</strong>, <strong>crypto</strong>, <strong>lawyer</strong>. Seu perfil em <strong>hashpo.com/@seunome</strong>.
          </p>
        </div>
      </section>

      {/* Tabela de preços por tamanho */}
      <section className="px-6 py-6 mx-auto max-w-4xl">
        <h2 className="text-sm font-bold text-muted-foreground uppercase mb-3">Preços por Tamanho do Slug (hashpo.com/@)</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-xs border border-border rounded-xl overflow-hidden">
            <thead>
              <tr className="bg-secondary">
                <th className="py-2 px-4 text-left text-muted-foreground font-bold">Tamanho</th>
                <th className="py-2 px-4 text-center text-yellow-500 font-bold flex items-center justify-center gap-1"><AtSign className="w-3 h-3" /> Preço</th>
              </tr>
            </thead>
            <tbody>
              {[
                { len: "1 letra", base: 2000 },
                { len: "2 letras", base: 1500 },
                { len: "3 letras", base: 1000 },
                { len: "4 letras", base: 500 },
                { len: "5 letras", base: 250 },
                { len: "6 letras", base: 100 },
                { len: "7+ letras", base: 50 },
              ].map((row) => (
                <tr key={row.len} className="border-t border-border hover:bg-muted/30">
                  <td className="py-2 px-4 font-mono text-foreground">{row.len}</td>
                  <td className="py-2 px-4 text-center font-bold text-yellow-500">${row.base.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Nomes Quentes */}
      <section className="px-6 pb-8 mx-auto max-w-4xl">
        <h2 className="text-lg font-extrabold text-foreground mb-4 flex items-center gap-2">
          <Tag className="w-5 h-5 text-yellow-400" /> Nomes Disponíveis
        </h2>

        <div className="flex flex-wrap gap-2 mb-4">
          <button onClick={() => setFilterCat(null)} className={`px-3 py-1 rounded-full text-xs font-bold border transition-colors ${!filterCat ? "bg-primary text-primary-foreground border-primary" : "bg-secondary text-muted-foreground border-border"}`}>
            Todos ({premiumSlugs?.length || 0})
          </button>
          {categories.map(cat => (
            <button key={cat} onClick={() => setFilterCat(filterCat === cat ? null : cat)}
              className={`px-3 py-1 rounded-full text-xs font-bold border transition-colors capitalize ${filterCat === cat ? "bg-primary text-primary-foreground border-primary" : `${categoryColors[cat as string] || "bg-muted text-muted-foreground border-border"}`}`}>
              {cat as string}
            </button>
          ))}
        </div>

        {slugsLoading ? (
          <p className="text-sm text-muted-foreground text-center py-6">Carregando...</p>
        ) : !filteredSlugs.length ? (
          <p className="text-sm text-muted-foreground text-center py-6">Nenhum nome disponível.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {filteredSlugs.map((s: any) => {
              const price = Number(s.price);
              return (
                <Card key={s.id} className="border-border/60 hover:border-primary/40 transition-colors">
                  <CardContent className="p-4 space-y-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-mono font-extrabold text-xl text-foreground">{s.slug}</p>
                        <Badge variant="outline" className={`text-[10px] capitalize mt-1 ${categoryColors[s.category] || ""}`}>{s.category}</Badge>
                      </div>
                      <p className="text-lg font-extrabold text-foreground">${price.toLocaleString()}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <FormatBadge />
                      <p className="text-[10px] font-mono text-muted-foreground">hashpo.com/@{s.slug}</p>
                    </div>
                    {user ? (
                      <Button size="sm" className="w-full" onClick={() => handleBuySlug(s)}>
                        <ShoppingCart className="w-3 h-3 mr-1" /> Comprar por ${price.toLocaleString()}
                      </Button>
                    ) : (
                      <p className="text-[10px] text-muted-foreground text-center">Login para comprar</p>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </section>

      {/* Leilões */}
      <section className="px-6 pb-12 mx-auto max-w-4xl">
        <h2 className="text-lg font-extrabold text-foreground mb-4 flex items-center gap-2">
          <Gavel className="w-5 h-5 text-primary" /> Leilões Ativos
        </h2>

        {isLoading ? (
          <p className="text-sm text-muted-foreground text-center py-10">Carregando leilões...</p>
        ) : !auctions?.length ? (
          <Card><CardContent className="py-10 text-center"><p className="text-sm text-muted-foreground">Nenhum leilão ativo no momento.</p></CardContent></Card>
        ) : (
          <div className="space-y-3">
            {auctions.map((a: any) => {
              const minBid = Math.max(a.min_price, (a.current_bid || 0) + 10);
              const isEnded = new Date(a.ends_at).getTime() <= Date.now();
              const isWinning = user && a.current_bidder_id === user.id;

              return (
                <Card key={a.id} className="border-border/60">
                  <CardContent className="p-4 flex flex-col sm:flex-row items-start sm:items-center gap-4">
                    <div className={`rounded-xl px-4 py-2 text-center min-w-[90px] ${tierColors[a.slug_length] || "bg-muted"}`}>
                      <p className="text-lg font-extrabold font-mono">{a.slug}</p>
                      <p className="text-[10px] opacity-70">{a.slug_length} letra{a.slug_length > 1 ? "s" : ""}</p>
                    </div>

                    <div className="flex-1 min-w-0 space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <FormatBadge />
                        <span className="text-xs font-mono text-muted-foreground">hashpo.com/@{a.slug}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="flex items-center gap-1 text-sm font-bold text-foreground">
                          <DollarSign className="w-3.5 h-3.5 text-yellow-400" />
                          {a.current_bid > 0 ? `$${Number(a.current_bid).toLocaleString()}` : `Min $${Number(a.min_price).toLocaleString()}`}
                        </span>
                        <span className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Timer className="w-3 h-3" />{timeLeft(a.ends_at)}
                        </span>
                        {isWinning && <Badge className="bg-yellow-500 text-white text-[10px]"><Trophy className="w-3 h-3 mr-0.5" /> Seu lance</Badge>}
                      </div>
                    </div>

                    {!isEnded && user && (
                      <div className="flex items-center gap-2">
                        <Input type="number" placeholder={`Min $${minBid}`} className="w-28 text-sm" value={bidAmounts[a.id] || ""} onChange={(e) => setBidAmounts({ ...bidAmounts, [a.id]: e.target.value })} />
                        <Button size="sm" onClick={() => handleBid(a)} disabled={placeBid.isPending || parseFloat(bidAmounts[a.id] || "0") < minBid}>
                          <Gavel className="w-3.5 h-3.5 mr-1" /> Dar Lance
                        </Button>
                      </div>
                    )}
                    {isEnded && <Badge variant="secondary" className="text-xs">Encerrado</Badge>}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </section>

      <footer className="bg-primary text-primary-foreground py-4 px-6">
        <p className="text-[9px] font-mono text-center opacity-70">HASHPO IS A TECH PLATFORM. © 2026 HASHPO</p>
      </footer>
    </div>
  );
};

export default SubdomainAuction;
