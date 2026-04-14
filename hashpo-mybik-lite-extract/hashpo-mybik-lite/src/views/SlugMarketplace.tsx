import { useState, useEffect, useRef } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import Header from "@/components/Header";
import SEO from "@/components/SEO";
import { useAuth } from "@/hooks/useAuth";
import { STRIPE_PRICES } from "@/data/stripeProducts";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle
} from "@/components/ui/alert-dialog";
import { Globe, Crown, ShoppingCart, Tag, Search, DollarSign, Gavel, Timer, FileKey, RefreshCw, AlertTriangle, Calendar, Shield, Send, Zap } from "lucide-react";
import CountdownTimer from "@/components/CountdownTimer";
import { normalizeSlug } from "@/lib/slug";

// ── Constants ─────────────────────────────────────────────────────────────────
const REGISTRATION_FEE = 12.00;

function DirectoryDropsOnMount({ onMount }: { onMount: () => void }) {
  const didRun = useRef(false);
  useEffect(() => {
    if (didRun.current) return;
    didRun.current = true;
    onMount();
  }, [onMount]);
  return null;
}
const RENEWAL_FEE = 12.00;
const PLATFORM_FEE_PCT = 5;

// Detect if slug is "name + surname" (contains space or 2+ capitalized words)
const isFullName = (slug: string): boolean => {
  const parts = slug.trim().split(/[\s._-]+/);
  return parts.length >= 2 && parts.every(p => p.length >= 2);
};

// ── Hooks ────────────────────────────────────────────────────────────────────

function usePremiumSlugs() {
  return useQuery({
    queryKey: ["premium-slugs-market"],
    queryFn: async () => {
      const { data } = await supabase
        .from("premium_slugs")
        .select("*")
        .eq("active", true)
        .eq("sold", false)
        .order("price", { ascending: false });
      return data || [];
    },
  });
}

function useSlugListings() {
  return useQuery({
    queryKey: ["slug-listings"],
    queryFn: async () => {
      const { data } = await supabase
        .from("slug_listings")
        .select("*, mini_sites(slug, site_name, avatar_url, bio)")
        .eq("status", "active")
        .order("created_at", { ascending: false });
      return data || [];
    },
  });
}

function useSlugAuctions() {
  return useQuery({
    queryKey: ["slug-auctions"],
    queryFn: async () => {
      const { data } = await supabase
        .from("slug_auctions")
        .select("*")
        .eq("status", "active")
        .order("ends_at", { ascending: true });
      return (data || []) as any[];
    },
  });
}

function useMySlugListings() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["my-slug-listings", user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("slug_listings")
        .select("*, mini_sites(slug, site_name)")
        .eq("seller_id", user!.id)
        .order("created_at", { ascending: false });
      return data || [];
    },
    enabled: !!user,
  });
}

function useMySites() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["my-sites-for-sale", user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("mini_sites")
        .select("id, slug, site_name")
        .eq("user_id", user!.id);
      return data || [];
    },
    enabled: !!user,
  });
}

function useMyRegistrations() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["my-slug-registrations", user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("slug_registrations")
        .select("*")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false });
      return data || [];
    },
    enabled: !!user,
  });
}

// ── Component ────────────────────────────────────────────────────────────────

const SlugMarketplace = () => {
  const { user } = useAuth();
  const qc = useQueryClient();
  const { data: premiumSlugs } = usePremiumSlugs();
  const { data: userListings } = useSlugListings();
  const { data: auctions } = useSlugAuctions();
  const { data: myListings } = useMySlugListings();
  const { data: mySites } = useMySites();
  const { data: myRegistrations } = useMyRegistrations();
  const [search, setSearch] = useState("");
  const [buyConfirm, setBuyConfirm] = useState<any>(null);
  const [buyType, setBuyType] = useState<"premium" | "user">("premium");
  const [sellSiteId, setSellSiteId] = useState("");
  const [sellPrice, setSellPrice] = useState("");
  const [bidAuction, setBidAuction] = useState<any>(null);
  const [bidAmount, setBidAmount] = useState("");
  const [registerSlug, setRegisterSlug] = useState("");
  const [renewConfirm, setRenewConfirm] = useState<any>(null);
  const [transferSlug, setTransferSlug] = useState("");
  const [transferToEmail, setTransferToEmail] = useState("");
  const [boostSlugListingLoading, setBoostSlugListingLoading] = useState<string | null>(null);
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const success = searchParams.get("boost_success");
    const sessionId = searchParams.get("session_id");
    if (success !== "1" || !sessionId || !user) return;
    (async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        const { data, error } = await supabase.functions.invoke("apply-boost-after-payment", {
          body: { session_id: sessionId },
          headers: session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {},
        });
        if (error) throw error;
        if (data?.error) throw new Error(data.error);
        toast.success("Destaque ativado! Sua listagem está em evidência.");
        qc.invalidateQueries({ queryKey: ["slug-listings"] });
        router.replace(pathname || "/slugs");
      } catch (e: any) {
        toast.error(e?.message ?? "Erro ao aplicar destaque.");
      }
    })();
  }, [searchParams, user, qc, router, pathname]);

  const startSlugListingBoost = async (listingId: string, type: "slug_1_position" | "slug_category_home_7d" | "slug_category_home_daily") => {
    if (!user) return;
    setBoostSlugListingLoading(listingId);
    try {
      const priceId =
        type === "slug_1_position"
          ? STRIPE_PRICES.boost_slug_1_position.price_id
          : type === "slug_category_home_7d"
            ? STRIPE_PRICES.boost_slug_category_home_7d.price_id
            : STRIPE_PRICES.boost_slug_maintenance_daily.price_id;
      const { data, error } = await supabase.functions.invoke("create-checkout", {
        body: {
          price_id: priceId,
          success_path: "/slugs?boost_success=1&session_id={CHECKOUT_SESSION_ID}",
          cancel_path: "/slugs",
          metadata: { boost_slug_listing_id: listingId, boost_type: type },
        },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      if (data?.url) window.location.href = data.url;
    } catch (e: any) {
      toast.error(e?.message ?? "Erro ao abrir checkout.");
    } finally {
      setBoostSlugListingLoading(null);
    }
  };

  const processSlugBoostDrops = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      await supabase.functions.invoke("process-slug-boost-drops", {
        headers: session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {},
      });
      qc.invalidateQueries({ queryKey: ["slug-listings"] });
    } catch (_) {}
  };

  const hasMiniSite = (mySites || []).length > 0;
  const hasSubscription = (mySites || []).some((s: any) => (s as any).monthly_price && (s as any).monthly_price > 0);
  const freeSlugUsed = (myRegistrations || []).some((r: any) => r.is_free_with_plan && r.status === "active");

  // ── Validations ──────────────────────────────────────────────────────────
  const canBuySlug = (): string | null => {
    if (!user) return "Faça login para continuar";
    if (!hasMiniSite) return "Você precisa ter pelo menos 1 mini site para comprar slugs";
    return null;
  };

  const canSellSlug = (slug: string): string | null => {
    if (isFullName(slug)) return "Slugs com nome e sobrenome não podem ser vendidos ou leiloados";
    return null;
  };

  // ── Check if slug is premium or listed for sale ─────────────────────
  const slugCheckClean = normalizeSlug(registerSlug);

  const premiumCheck = useQuery({
    queryKey: ["premium-check", slugCheckClean],
    queryFn: async () => {
      if (!slugCheckClean) return null;
      const { data } = await supabase
        .from("premium_slugs")
        .select("id, slug, price, sold, buyer_id")
        .eq("slug", slugCheckClean)
        .eq("active", true)
        .maybeSingle();
      return data as { id: string; slug: string; price: number; sold: boolean; buyer_id: string | null } | null;
    },
    enabled: slugCheckClean.length >= 1,
  });

  const userListingCheck = useQuery({
    queryKey: ["listing-check", slugCheckClean],
    queryFn: async () => {
      if (!slugCheckClean) return null;
      const { data } = await supabase
        .from("slug_listings")
        .select("id, slug, price, seller_id, site_id, mini_sites(slug, site_name, avatar_url)")
        .eq("slug", slugCheckClean)
        .eq("status", "active")
        .maybeSingle();
      return data;
    },
    enabled: slugCheckClean.length >= 1,
  });

  const isPremiumSlug = premiumCheck.data && !premiumCheck.data.sold;
  const premiumPrice = premiumCheck.data?.price || 0;
  const isUserListed = !!userListingCheck.data;
  const userListedPrice = (userListingCheck.data as any)?.price || 0;

  // Check if user has active mini site (paid or free — at least 1 active mini site)
  const hasActiveMiniSite = hasMiniSite;

  // ── Register new slug ($12/year or premium price) ───────────────────
  const registerNewSlug = useMutation({
    mutationFn: async () => {
      const slugClean = normalizeSlug(registerSlug);
      if (!slugClean || slugClean.length < 1) throw new Error("Slug inválido");
      if (!hasMiniSite) throw new Error("Você precisa ter pelo menos 1 mini site");

      // If it's a premium slug, buy it through the premium flow
      if (isPremiumSlug) {
        const err = canBuySlug();
        if (err) throw new Error(err);

        const { error } = await supabase
          .from("premium_slugs")
          .update({ sold: true, buyer_id: user!.id, sold_at: new Date().toISOString(), sold_to: user!.id } as any)
          .eq("id", premiumCheck.data!.id);
        if (error) throw error;

        const expiresAt = new Date();
        expiresAt.setFullYear(expiresAt.getFullYear() + 1);

        const { data: reg } = await supabase.from("slug_registrations").insert({
          user_id: user!.id,
          slug: slugClean,
          registration_fee: premiumPrice,
          renewal_fee: RENEWAL_FEE,
          slug_type: "premium",
          expires_at: expiresAt.toISOString(),
        } as any).select().single();

        const { data: existingSite } = await supabase.from("mini_sites").select("id").eq("user_id", user!.id).maybeSingle();
        if (existingSite) {
          await supabase.from("mini_sites").update({
            slug: slugClean,
            slug_registration_id: reg?.id,
            slug_expires_at: expiresAt.toISOString(),
          } as any).eq("id", existingSite.id);
        } else {
          await supabase.from("mini_sites").insert({
            user_id: user!.id,
            slug: slugClean,
            published: true,
            slug_registration_id: reg?.id,
            slug_expires_at: expiresAt.toISOString(),
          } as any);
        }
        return;
      }

      const isFree = hasSubscription && !freeSlugUsed && !isFullName(slugClean);
      const fee = isFree ? 0 : REGISTRATION_FEE;

      // Check if slug already taken
      const { data: existing } = await supabase.from("slug_registrations").select("id, status").eq("slug", slugClean).maybeSingle();
      if (existing && existing.status === "active") throw new Error("Este slug já está registrado");

      // Check mini_sites too
      const { data: siteExisting } = await supabase.from("mini_sites").select("id").eq("slug", slugClean).maybeSingle();
      if (siteExisting) throw new Error("Este slug já está em uso por um mini site");

      const expiresAt = new Date();
      expiresAt.setFullYear(expiresAt.getFullYear() + 1);

      const { data: reg, error: regErr } = await supabase.from("slug_registrations").insert({
        user_id: user!.id,
        slug: slugClean,
        registration_fee: fee,
        renewal_fee: RENEWAL_FEE,
        is_free_with_plan: isFree,
        slug_type: isFullName(slugClean) ? "personal_name" : "standard",
        expires_at: expiresAt.toISOString(),
      } as any).select().single();
      if (regErr) throw regErr;

      // Atualizar mini site existente com o novo slug ou criar um
      const { data: existingSite } = await supabase.from("mini_sites").select("id").eq("user_id", user!.id).maybeSingle();
      if (existingSite) {
        const { error: siteErr } = await supabase.from("mini_sites").update({
          slug: slugClean,
          slug_registration_id: reg.id,
          slug_expires_at: expiresAt.toISOString(),
        } as any).eq("id", existingSite.id);
        if (siteErr) throw siteErr;
      } else {
        const { error: siteErr } = await supabase.from("mini_sites").insert({
          user_id: user!.id,
          slug: slugClean,
          published: true,
          slug_registration_id: reg.id,
          slug_expires_at: expiresAt.toISOString(),
        } as any);
        if (siteErr) throw siteErr;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["my-slug-registrations"] });
      qc.invalidateQueries({ queryKey: ["my-sites-for-sale"] });
      qc.invalidateQueries({ queryKey: ["my-mini-site"] });
      qc.invalidateQueries({ queryKey: ["premium-slugs-market"] });
      qc.invalidateQueries({ queryKey: ["premium-check"] });
      const msg = isPremiumSlug
        ? `Slug premium /${registerSlug} comprado por $${premiumPrice.toLocaleString()}!`
        : `Slug /${registerSlug.trim().toLowerCase()} registrado!` +
          (hasSubscription && !freeSlugUsed ? " (grátis com seu plano)" : ` Taxa: $${REGISTRATION_FEE}/ano`);
      toast.success(msg);
      setRegisterSlug("");
    },
    onError: (e: any) => toast.error(e.message),
  });

  // ── Renew slug ($12/year) ──────────────────────────────────────────────
  const renewSlug = useMutation({
    mutationFn: async (reg: any) => {
      const newExpiry = new Date(reg.expires_at);
      newExpiry.setFullYear(newExpiry.getFullYear() + 1);

      const { error } = await supabase.from("slug_registrations").update({
        expires_at: newExpiry.toISOString(),
        renewed_at: new Date().toISOString(),
        status: "active",
        renewal_fee: RENEWAL_FEE,
      } as any).eq("id", reg.id);
      if (error) throw error;

      // Update mini site expiry too
      if (reg.site_id) {
        await supabase.from("mini_sites").update({
          slug_expires_at: newExpiry.toISOString(),
        } as any).eq("id", reg.site_id);
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["my-slug-registrations"] });
      toast.success("Slug renovado por mais 1 ano!");
      setRenewConfirm(null);
    },
    onError: (e: any) => toast.error(e.message),
  });

  // Buy premium slug
  const buyPremium = useMutation({
    mutationFn: async (slug: any) => {
      const err = canBuySlug();
      if (err) throw new Error(err);

      const { error } = await supabase
        .from("premium_slugs")
        .update({ sold: true, buyer_id: user!.id, sold_at: new Date().toISOString(), sold_to: user!.id } as any)
        .eq("id", slug.id);
      if (error) throw error;

      const expiresAt = new Date();
      expiresAt.setFullYear(expiresAt.getFullYear() + 1);

      // Create registration
      const { data: reg } = await supabase.from("slug_registrations").insert({
        user_id: user!.id,
        slug: slug.slug,
        registration_fee: slug.price,
        renewal_fee: RENEWAL_FEE,
        slug_type: "premium",
        expires_at: expiresAt.toISOString(),
      } as any).select().single();

      const { data: existing } = await supabase.from("mini_sites").select("id").eq("user_id", user!.id).maybeSingle();
      if (existing) {
        await supabase.from("mini_sites").update({
           slug: slug.slug,
          slug_registration_id: reg?.id,
          slug_expires_at: expiresAt.toISOString(),
        } as any).eq("id", existing.id);
      } else {
        await supabase.from("mini_sites").insert({
          user_id: user!.id,
          slug: slug.slug,
          published: true,
          slug_registration_id: reg?.id,
          slug_expires_at: expiresAt.toISOString(),
        } as any);
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["premium-slugs-market"] });
      qc.invalidateQueries({ queryKey: ["my-mini-site"] });
      qc.invalidateQueries({ queryKey: ["my-slug-registrations"] });
      toast.success("Slug premium adquirido! Renovação anual: $12/ano.");
      setBuyConfirm(null);
    },
    onError: (e: any) => toast.error(e.message),
  });

  // Buy slug from user (with 5% fee)
  const buyUserSlug = useMutation({
    mutationFn: async (listing: any) => {
      const err = canBuySlug();
      if (err) throw new Error(err);

      const amount = listing.price;
      const feeAmount = amount * (PLATFORM_FEE_PCT / 100);
      const netToSeller = amount - feeAmount;

      const { error: txErr } = await supabase.from("slug_transactions").insert({
        listing_id: listing.id,
        buyer_id: user!.id,
        seller_id: listing.seller_id,
        slug: listing.slug,
        amount,
        platform_fee_pct: PLATFORM_FEE_PCT,
        platform_fee_amount: feeAmount,
        net_to_seller: netToSeller,
        tx_type: "sale",
      });
      if (txErr) throw txErr;

      const { error: updateErr } = await supabase.from("slug_listings").update({ status: "sold", buyer_id: user!.id }).eq("id", listing.id);
      if (updateErr) throw updateErr;
      const { error: siteErr } = await supabase.from("mini_sites").update({ user_id: user!.id }).eq("id", listing.site_id);
      if (siteErr) throw siteErr;

      // Transfer registration
      await supabase.from("slug_registrations").update({ user_id: user!.id } as any).eq("slug", listing.slug);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["slug-listings"] });
      qc.invalidateQueries({ queryKey: ["my-mini-site"] });
      qc.invalidateQueries({ queryKey: ["my-slug-registrations"] });
      toast.success("Slug comprado! Taxa de 5% aplicada. Mini site transferido.");
      setBuyConfirm(null);
    },
    onError: (e: any) => toast.error(e.message),
  });

  // Place bid
  const placeBid = useMutation({
    mutationFn: async () => {
      const err = canBuySlug();
      if (err) throw new Error(err);
      if (!bidAuction || !bidAmount) throw new Error("Dados inválidos");
      const amount = parseFloat(bidAmount);
      const minIncrement = bidAuction.min_increment ?? 10;
      const minBid = bidAuction.current_bid != null
        ? bidAuction.current_bid + minIncrement
        : (bidAuction.starting_price ?? 100);
      if (amount < minBid) throw new Error(`Lance mínimo: $${minBid}${bidAuction.current_bid != null ? ` (atual + $${minIncrement})` : " (lance inicial)"}`);

      const { error: bidErr } = await supabase.from("slug_auction_bids").insert({
        auction_id: bidAuction.id,
        bidder_id: user!.id,
        amount,
      } as any);
      if (bidErr) throw bidErr;

      const { error: updateErr } = await supabase.from("slug_auctions").update({
        current_bid: amount,
        current_bidder_id: user!.id,
      } as any).eq("id", bidAuction.id);
      if (updateErr) throw updateErr;

      const feeAmount = amount * (PLATFORM_FEE_PCT / 100);
      await supabase.from("slug_transactions").insert({
        auction_id: bidAuction.id,
        buyer_id: user!.id,
        seller_id: bidAuction.seller_id || user!.id,
        slug: bidAuction.slug || bidAuction.keyword,
        amount,
        platform_fee_pct: PLATFORM_FEE_PCT,
        platform_fee_amount: feeAmount,
        net_to_seller: amount - feeAmount,
        tx_type: "auction",
      });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["slug-auctions"] });
      toast.success("Lance registrado! Taxa de 5% será aplicada ao vencedor.");
      setBidAuction(null);
      setBidAmount("");
    },
    onError: (e: any) => toast.error(e.message),
  });

  // List slug for sale (validate no full-name)
  const createSlugListing = useMutation({
    mutationFn: async () => {
      if (!sellSiteId || !sellPrice) throw new Error("Selecione um site e defina o preço");
      const site = mySites?.find((s: any) => s.id === sellSiteId);
      if (!site) throw new Error("Site não encontrado");

      const sellErr = canSellSlug(site.slug);
      if (sellErr) throw new Error(sellErr);

      const { error } = await supabase.from("slug_listings").insert({
        seller_id: user!.id,
        site_id: sellSiteId,
        slug: site.slug,
        price: parseFloat(sellPrice),
      });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["slug-listings"] });
      qc.invalidateQueries({ queryKey: ["my-slug-listings"] });
      toast.success("Slug listado para venda! Taxa de 5% será cobrada na venda.");
      setSellSiteId("");
      setSellPrice("");
    },
    onError: (e: any) => toast.error(e.message),
  });

  const cancelListing = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("slug_listings").update({ status: "cancelled" }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["slug-listings"] });
      qc.invalidateQueries({ queryKey: ["my-slug-listings"] });
      toast.success("Listagem cancelada");
    },
  });

  // Direct transfer
  const directTransfer = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("Faça login");
      if (!hasMiniSite) throw new Error("Você precisa ter pelo menos 1 mini site");
      const slugClean = normalizeSlug(transferSlug);
      if (!slugClean) throw new Error("Slug inválido");
      if (!transferToEmail.trim()) throw new Error("Informe o email ou nome do destinatário");

      // Find recipient
      const { data: recipient } = await supabase
        .from("profiles")
        .select("user_id, display_name")
        .ilike("display_name", transferToEmail.trim())
        .maybeSingle();
      if (!recipient) throw new Error("Destinatário não encontrado");
      if (recipient.user_id === user.id) throw new Error("Não pode transferir para si mesmo");

      // Check recipient has mini site
      const { data: recipientSite } = await supabase
        .from("mini_sites")
        .select("id")
        .eq("user_id", recipient.user_id)
        .limit(1)
        .maybeSingle();
      if (!recipientSite) throw new Error("Destinatário precisa ter pelo menos 1 mini site ativo");

      // Verify ownership
      const { data: mySlug } = await supabase
        .from("mini_sites")
        .select("id")
        .eq("slug", slugClean)
        .eq("user_id", user.id)
        .maybeSingle();
      if (!mySlug) throw new Error("Você não possui este slug");

      // Create transfer record
      const { error: txErr } = await supabase.from("slug_transfers" as any).insert({
        slug: slugClean,
        from_user_id: user.id,
        to_user_id: recipient.user_id,
        to_email: transferToEmail.trim(),
        site_id: mySlug.id,
        status: "completed",
        transfer_type: "direct",
        completed_at: new Date().toISOString(),
      });
      if (txErr) throw txErr;

      // Transfer mini site ownership
      const { error: siteErr } = await supabase
        .from("mini_sites")
        .update({ user_id: recipient.user_id })
        .eq("id", mySlug.id);
      if (siteErr) throw siteErr;

      // Transfer registration
      await supabase.from("slug_registrations" as any)
        .update({ user_id: recipient.user_id })
        .eq("slug", slugClean)
        .eq("user_id", user.id);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["my-sites-for-sale"] });
      qc.invalidateQueries({ queryKey: ["my-slug-registrations"] });
      qc.invalidateQueries({ queryKey: ["my-mini-site"] });
      toast.success(`Slug /${transferSlug} transferido com sucesso!`);
      setTransferSlug("");
      setTransferToEmail("");
    },
    onError: (e: any) => toast.error(e.message),
  });

  const filterBySearch = (keyword: string) =>
    !search.trim() || keyword.toLowerCase().includes(search.toLowerCase());

  return (
    <div className="min-h-screen bg-background">
      <SEO title="Slug Marketplace – HASHPO" description="Buy and sell premium subdomains on HASHPO." />
      <Header />
      <div className="max-w-6xl mx-auto p-6 space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <Crown className="w-7 h-7 text-accent" />
            <div>
              <h1 className="text-2xl font-black text-foreground">Slug Marketplace</h1>
              <p className="text-xs text-muted-foreground">Compre, venda e dê lances em subdomínios • Taxa de 5% por transação • Registro anual $12/ano</p>
            </div>
          </div>
          <div className="relative w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar slug..." className="pl-10" />
          </div>
        </div>

        {/* Rules banner */}
        <div className="bg-accent/10 border border-accent/20 rounded-xl p-4 space-y-2">
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-accent" />
            <span className="text-xs font-bold text-foreground">Regras do Marketplace</span>
          </div>
          <ul className="text-[11px] text-muted-foreground space-y-1 pl-6 list-disc">
            <li><strong>Mini Site obrigatório:</strong> É preciso ter pelo menos 1 mini site ativo para possuir slugs.</li>
            <li><strong>Registro:</strong> $12/ano por slug. Renovação anual obrigatória.</li>
            <li><strong>Assinantes:</strong> Planos pagos têm direito a 1 slug gratuito (não-premium).</li>
            <li><strong>Nomes compostos</strong> (nome + sobrenome) não podem ser vendidos ou leiloados.</li>
            <li><strong>Taxa:</strong> 5% sobre cada transação de venda ou leilão (vendedor paga).</li>
            <li><strong>Expiração:</strong> Slugs não renovados ($12/ano) voltam para o mercado.</li>
            <li><strong className="text-destructive">⚠️ Se parar de pagar o mini site, TODOS os slugs são invalidados</strong> — mesmo pagando os $12/ano de cada slug. 1 mini site ativo garante todos os seus slugs.</li>
          </ul>
        </div>

        {!hasMiniSite && user && (
          <div className="bg-destructive/10 border border-destructive/20 rounded-xl p-4 flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-destructive shrink-0" />
            <div>
              <p className="text-xs font-bold text-destructive">Você precisa de um Mini Site ativo</p>
              <p className="text-[10px] text-muted-foreground">Crie e mantenha pelo menos 1 mini site para poder possuir, comprar ou registrar slugs. Sem mini site ativo, todos os slugs são invalidados.</p>
            </div>
          </div>
        )}

        <Tabs defaultValue="register" className="space-y-4">
          <TabsList className="flex-wrap">
            {user && (
              <TabsTrigger value="register" className="flex items-center gap-1.5">
                <FileKey className="w-3.5 h-3.5" /> Registrar Slug
              </TabsTrigger>
            )}
            <TabsTrigger value="premium" className="flex items-center gap-1.5">
              <Crown className="w-3.5 h-3.5" /> Premium
            </TabsTrigger>
            <TabsTrigger value="auctions" className="flex items-center gap-1.5">
              <Gavel className="w-3.5 h-3.5" /> Leilões
              {(auctions || []).length > 0 && (
                <span className="ml-1 bg-accent text-accent-foreground text-[9px] font-bold px-1.5 py-0.5 rounded-full">{(auctions || []).length}</span>
              )}
            </TabsTrigger>
            <TabsTrigger value="users" className="flex items-center gap-1.5">
              <ShoppingCart className="w-3.5 h-3.5" /> De Usuários
            </TabsTrigger>
            <TabsTrigger value="directory" className="flex items-center gap-1.5">
              <Globe className="w-3.5 h-3.5" /> Diretório
            </TabsTrigger>
            {user && (
              <TabsTrigger value="sell" className="flex items-center gap-1.5">
                <Tag className="w-3.5 h-3.5" /> Vender
              </TabsTrigger>
            )}
            {user && (
              <TabsTrigger value="my-slugs" className="flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5" /> Meus Slugs
              </TabsTrigger>
            )}
            {user && (
              <TabsTrigger value="transfer" className="flex items-center gap-1.5">
                <Send className="w-3.5 h-3.5" /> Transferir
              </TabsTrigger>
            )}
          </TabsList>

          {/* ── Register new slug ─────────────────────────────────────────── */}
          {user && (
            <TabsContent value="register">
              <div className="max-w-lg mx-auto bg-card border border-border rounded-xl p-6 space-y-5">
                <div className="flex items-center gap-2">
                  <FileKey className="w-5 h-5 text-accent" />
                  <h2 className="text-sm font-black text-foreground uppercase">Registrar Novo Slug</h2>
                </div>

                <div className="grid grid-cols-2 gap-4 text-center">
                  <div className="bg-accent/10 rounded-xl p-4 border border-accent/20">
                    <p className="text-2xl font-black text-accent">${REGISTRATION_FEE}</p>
                    <p className="text-[10px] text-muted-foreground font-bold">/ano — Registro</p>
                  </div>
                  <div className="bg-primary/10 rounded-xl p-4 border border-primary/20">
                    <p className="text-2xl font-black text-primary">${RENEWAL_FEE}</p>
                    <p className="text-[10px] text-muted-foreground font-bold">/ano — Renovação</p>
                  </div>
                </div>

                {hasSubscription && !freeSlugUsed && (
                  <div className="bg-[hsl(var(--ticker-up))]/10 rounded-lg p-3 flex items-center gap-2 border border-[hsl(var(--ticker-up))]/20">
                    <Crown className="w-4 h-4 text-[hsl(var(--ticker-up))]" />
                    <p className="text-xs text-foreground font-bold">🎁 Você tem direito a 1 slug GRÁTIS com seu plano!</p>
                  </div>
                )}

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-muted-foreground uppercase">Escolha seu slug</label>
                  <div className="flex gap-2">
                    <div className="flex items-center bg-secondary rounded-l-lg px-3 text-xs font-mono text-muted-foreground border border-r-0 border-border">
                      hashpo.com/@
                    </div>
                    <Input
                      value={registerSlug}
                      onChange={e => setRegisterSlug(normalizeSlug(e.target.value))}
                      placeholder="meu-slug"
                      className="rounded-l-none font-mono"
                    />
                  </div>
                  {registerSlug && isFullName(registerSlug) && (
                    <p className="text-[10px] text-muted-foreground mt-1">
                      ℹ️ Slugs com nome composto não podem ser vendidos/leiloados
                    </p>
                  )}
                  {isPremiumSlug && (
                    <div className="bg-accent/10 border border-accent/30 rounded-lg p-3 mt-2 flex items-center gap-2">
                      <Crown className="w-4 h-4 text-accent" />
                      <p className="text-xs font-bold text-foreground">
                        ⭐ Slug Premium — <span className="text-accent">${premiumPrice.toLocaleString()}</span>
                      </p>
                    </div>
                  )}
                  {premiumCheck.data?.sold && (
                    <p className="text-[10px] text-destructive mt-1 font-bold">
                      ❌ Este slug premium já foi vendido
                    </p>
                  )}
                  {isUserListed && !isPremiumSlug && (
                    <div className="bg-primary/10 border border-primary/30 rounded-lg p-3 mt-2 space-y-2">
                      <div className="flex items-center gap-2">
                        <Tag className="w-4 h-4 text-primary" />
                        <p className="text-xs font-bold text-foreground">
                          🏷️ À venda por usuário — <span className="text-primary">${userListedPrice.toLocaleString()}</span> USDC
                        </p>
                      </div>
                      <p className="text-[9px] text-muted-foreground">Taxa de 5% sobre o valor. Vendedor recebe ${(userListedPrice * 0.95).toFixed(2)}.</p>
                      {user && hasActiveMiniSite && (userListingCheck.data as any)?.seller_id !== user.id && (
                        <button
                          onClick={() => { setBuyConfirm(userListingCheck.data); setBuyType("user"); }}
                          className="w-full py-2 bg-primary text-primary-foreground rounded-lg text-xs font-bold hover:bg-primary/90 flex items-center justify-center gap-1.5"
                        >
                          <ShoppingCart className="w-3.5 h-3.5" /> Comprar por ${userListedPrice.toLocaleString()}
                        </button>
                      )}
                      {(userListingCheck.data as any)?.seller_id === user?.id && (
                        <p className="text-[10px] text-muted-foreground text-center">Este é o seu slug à venda</p>
                      )}
                    </div>
                  )}
                </div>

                <button
                  onClick={() => registerNewSlug.mutate()}
                  disabled={!registerSlug || !hasActiveMiniSite || registerNewSlug.isPending || !!premiumCheck.data?.sold || isUserListed}
                  className="w-full py-3 bg-accent text-accent-foreground rounded-lg text-sm font-bold hover:opacity-90 disabled:opacity-40 flex items-center justify-center gap-2"
                >
                  <FileKey className="w-4 h-4" />
                  {isUserListed
                    ? "Slug à venda — use o botão acima"
                    : isPremiumSlug
                    ? `Comprar Slug Premium — $${premiumPrice.toLocaleString()}`
                    : hasSubscription && !freeSlugUsed
                    ? "Registrar Grátis (1° slug do plano)"
                    : `Registrar por $${REGISTRATION_FEE}/ano`}
                </button>

                {!hasMiniSite && (
                  <p className="text-[10px] text-destructive text-center font-bold">⚠️ Crie um mini site primeiro</p>
                )}
              </div>
            </TabsContent>
          )}

          {/* ── Premium slugs ─────────────────────────────────────────────── */}
          <TabsContent value="premium">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {(premiumSlugs || []).filter((s: any) => filterBySearch(s.slug)).map((slug: any) => (
                <div key={slug.id} className="bg-card border border-border rounded-xl p-5 hover:shadow-lg hover:border-accent/30 transition-all">
                  <div className="flex items-center gap-2 mb-3">
                    <Crown className="w-5 h-5 text-accent" />
                    <span className="text-lg font-black text-foreground">/{slug.slug}</span>
                  </div>
                  <p className="text-[10px] text-muted-foreground mb-1">hashpo.com/@{slug.slug}</p>
                  <p className="text-2xl font-black text-accent mb-1">${slug.price.toLocaleString()}</p>
                  <p className="text-[9px] text-muted-foreground mb-4">+ $12/ano renovação</p>
                  {user && hasMiniSite ? (
                    <button onClick={() => { setBuyConfirm(slug); setBuyType("premium"); }}
                      className="w-full py-2.5 bg-accent text-accent-foreground rounded-lg text-xs font-bold hover:opacity-90 transition-opacity flex items-center justify-center gap-1.5">
                      <ShoppingCart className="w-3.5 h-3.5" /> Comprar
                    </button>
                  ) : user && !hasMiniSite ? (
                    <p className="text-[10px] text-destructive text-center font-bold">Crie um mini site primeiro</p>
                  ) : (
                    <p className="text-[10px] text-muted-foreground text-center">Faça login para comprar</p>
                  )}
                </div>
              ))}
              {(premiumSlugs || []).filter((s: any) => filterBySearch(s.slug)).length === 0 && (
                <div className="col-span-full text-center py-12 text-muted-foreground text-sm">Nenhum slug premium disponível</div>
              )}
            </div>
          </TabsContent>

          {/* ── Auctions ──────────────────────────────────────────────────── */}
          <TabsContent value="auctions">
            {!(auctions || []).length ? (
              <div className="text-center py-16 text-muted-foreground text-sm">Nenhum leilão ativo no momento.</div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {(auctions || []).filter((a: any) => filterBySearch(a.slug || a.keyword)).map((auction: any) => {
                  const currentPrice = auction.current_bid || auction.starting_price;
                  const minNext = currentPrice + auction.min_increment;
                  const endsAt = new Date(auction.ends_at);
                  const isExpired = endsAt < new Date();

                  return (
                    <div key={auction.id} className="bg-card border border-border rounded-xl overflow-hidden hover:shadow-lg hover:border-accent/30 transition-all">
                      <div className="bg-accent/10 px-5 py-3 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Gavel className="w-4 h-4 text-accent" />
                          <span className="text-sm font-black text-foreground">/{auction.slug || auction.keyword}</span>
                        </div>
                        <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                          <Timer className="w-3 h-3" />
                          {isExpired ? <span className="text-destructive font-bold">Encerrado</span> : <CountdownTimer expiresAt={auction.ends_at} />}
                        </div>
                      </div>
                      <div className="p-5 space-y-3">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-[10px] text-muted-foreground uppercase font-bold">Lance Atual</p>
                            <p className="text-2xl font-black text-accent">${currentPrice.toLocaleString()}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-[10px] text-muted-foreground uppercase font-bold">Próximo Mín.</p>
                            <p className="text-sm font-mono font-bold text-foreground">${minNext.toLocaleString()}</p>
                          </div>
                        </div>
                        <p className="text-[9px] text-muted-foreground">Taxa de 5% sobre o valor final</p>
                        {auction.current_bidder_id && (
                          <p className="text-[10px] text-muted-foreground">
                            {auction.current_bidder_id === user?.id ? "🏆 Você é o maior lance!" : "Já há lances neste leilão"}
                          </p>
                        )}
                        {user && hasMiniSite && !isExpired ? (
                          <button
                            onClick={() => { setBidAuction(auction); setBidAmount(String(minNext)); }}
                            className="w-full py-2.5 bg-accent text-accent-foreground rounded-lg text-xs font-bold hover:opacity-90 flex items-center justify-center gap-1.5"
                          >
                            <Gavel className="w-3.5 h-3.5" /> Dar Lance
                          </button>
                        ) : !user ? (
                          <p className="text-[10px] text-muted-foreground text-center">Faça login para dar lances</p>
                        ) : !hasMiniSite ? (
                          <p className="text-[10px] text-destructive text-center font-bold">Crie um mini site primeiro</p>
                        ) : null}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </TabsContent>

          {/* ── User listings ─────────────────────────────────────────────── */}
          <TabsContent value="users">
            {!(userListings || []).length ? (
              <div className="text-center py-16 text-muted-foreground text-sm">Nenhum slug à venda por usuários ainda.</div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {(userListings || []).filter((l: any) => filterBySearch(l.slug)).map((listing: any) => {
                  const site = listing.mini_sites;
                  return (
                    <div key={listing.id} className="bg-card border border-border rounded-xl overflow-hidden hover:shadow-lg hover:border-primary/30 transition-all">
                      <div className="p-5">
                        <div className="flex items-center gap-3 mb-3">
                          {site?.avatar_url ? (
                            <img src={site.avatar_url} alt="" className="w-10 h-10 rounded-full object-cover border-2 border-border" />
                          ) : (
                            <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-black">
                              {(site?.site_name || listing.slug)?.[0]?.toUpperCase()}
                            </div>
                          )}
                          <div>
                            <span className="text-sm font-black text-foreground">/{listing.slug}</span>
                            {site?.site_name && <p className="text-[10px] text-muted-foreground">{site.site_name}</p>}
                          </div>
                        </div>
                        {site?.bio && <p className="text-[10px] text-muted-foreground line-clamp-2 mb-3">{site.bio}</p>}
                        <div className="flex items-center justify-between mb-1">
                          <p className="text-xl font-black text-primary">${listing.price}</p>
                          <span className="text-[9px] text-muted-foreground">USDC</span>
                        </div>
                        <p className="text-[9px] text-muted-foreground mb-3">Taxa de 5% na compra</p>
                        {user && hasMiniSite && listing.seller_id !== user.id ? (
                          <button onClick={() => { setBuyConfirm(listing); setBuyType("user"); }}
                            className="w-full py-2.5 bg-primary text-primary-foreground rounded-lg text-xs font-bold hover:bg-primary/90 transition-colors flex items-center justify-center gap-1.5">
                            <ShoppingCart className="w-3.5 h-3.5" /> Comprar por ${listing.price}
                          </button>
                        ) : user && listing.seller_id === user.id ? (
                          <button onClick={() => cancelListing.mutate(listing.id)}
                            className="w-full py-2 bg-destructive/10 text-destructive rounded-lg text-xs font-bold hover:bg-destructive/20">
                            Cancelar Listagem
                          </button>
                        ) : !hasMiniSite && user ? (
                          <p className="text-[10px] text-destructive text-center font-bold">Crie um mini site primeiro</p>
                        ) : (
                          <p className="text-[10px] text-muted-foreground text-center">Faça login para comprar</p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </TabsContent>

          {/* ── Diretório de slugs à venda (com destaque/boost) ───────────────── */}
          <TabsContent value="directory">
            {!(userListings || []).length ? (
              <div className="text-center py-16 text-muted-foreground text-sm">Nenhum slug à venda no diretório. Liste no tab &quot;Vender&quot; e use &quot;Destacar&quot; para aparecer em evidência.</div>
            ) : (
              <>
                <DirectoryDropsOnMount onMount={processSlugBoostDrops} />
                <p className="text-[10px] text-muted-foreground mb-4">
                  Ordem: listagens em destaque primeiro. Destacar: <strong>US$ 1,50</strong> sobe 1 posição (24h); <strong>US$ 1.000</strong> vai para a home da categoria (7 dias); depois <strong>US$ 450/dia</strong> para continuar na home. Se parar de pagar, cai 150 posições.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {[...(userListings || [])]
                    .filter((l: any) => filterBySearch(l.slug))
                    .sort((a: any, b: any) => {
                      const ar = a.boost_rank ?? 0;
                      const br = b.boost_rank ?? 0;
                      if (br !== ar) return br - ar;
                      return new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime();
                    })
                    .map((listing: any) => {
                      const site = listing.mini_sites;
                      const now = new Date();
                      const maintenanceCutoff = new Date(now.getTime() - 24 * 60 * 60 * 1000);
                      const isInHome = listing.boost_home_at && (new Date(listing.boost_home_expires_at || 0) > now || (listing.boost_maintenance_paid_at && new Date(listing.boost_maintenance_paid_at) > maintenanceCutoff));
                      const isBoosted = (listing.boost_rank ?? 0) > 0 && (listing.boost_expires_at && new Date(listing.boost_expires_at) > now || isInHome);
                      const showMaintenanceOption = isInHome && user && listing.seller_id === user.id;
                      return (
                        <div key={listing.id} className={`bg-card border rounded-xl overflow-hidden hover:shadow-lg transition-all ${isBoosted ? "border-accent/50 ring-1 ring-accent/20" : "border-border hover:border-primary/30"}`}>
                          {isBoosted && (
                            <div className="bg-accent/20 text-accent px-3 py-1 text-[10px] font-bold flex items-center gap-1">
                              <Zap className="w-3 h-3" /> {isInHome ? "Home da categoria" : "Destaque"}
                            </div>
                          )}
                          <div className="p-5">
                            <div className="flex items-center gap-3 mb-3">
                              {site?.avatar_url ? (
                                <img src={site.avatar_url} alt="" className="w-10 h-10 rounded-full object-cover border-2 border-border" />
                              ) : (
                                <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-black">
                                  {(site?.site_name || listing.slug)?.[0]?.toUpperCase()}
                                </div>
                              )}
                              <div>
                                <span className="text-sm font-black text-foreground">/{listing.slug}</span>
                                {site?.site_name && <p className="text-[10px] text-muted-foreground">{site.site_name}</p>}
                              </div>
                            </div>
                            <div className="flex items-center justify-between mb-3">
                              <p className="text-xl font-black text-primary">${listing.price}</p>
                              <span className="text-[9px] text-muted-foreground">USDC</span>
                            </div>
                            {user && listing.seller_id === user.id ? (
                              <div className="space-y-1.5">
                                <button
                                  onClick={() => startSlugListingBoost(listing.id, "slug_1_position")}
                                  disabled={boostSlugListingLoading === listing.id}
                                  className="w-full py-2 bg-accent/20 text-accent rounded-lg text-xs font-bold hover:bg-accent/30 flex items-center justify-center gap-1.5 disabled:opacity-50"
                                >
                                  <Zap className="w-3.5 h-3.5" /> US$ 1,50 — sobe 1 posição (24h)
                                </button>
                                <button
                                  onClick={() => startSlugListingBoost(listing.id, "slug_category_home_7d")}
                                  disabled={boostSlugListingLoading === listing.id}
                                  className="w-full py-2 bg-primary/20 text-primary rounded-lg text-xs font-bold hover:bg-primary/30 flex items-center justify-center gap-1.5 disabled:opacity-50"
                                >
                                  <Zap className="w-3.5 h-3.5" /> US$ 1.000 — home da categoria (7 dias)
                                </button>
                                {showMaintenanceOption && (
                                  <button
                                    onClick={() => startSlugListingBoost(listing.id, "slug_category_home_daily")}
                                    disabled={boostSlugListingLoading === listing.id}
                                    className="w-full py-2 bg-amber-500/20 text-amber-600 rounded-lg text-xs font-bold hover:bg-amber-500/30 flex items-center justify-center gap-1.5 disabled:opacity-50"
                                  >
                                    <Zap className="w-3.5 h-3.5" /> US$ 450 — mais 1 dia na home
                                  </button>
                                )}
                              </div>
                            ) : user && hasMiniSite ? (
                              <button onClick={() => { setBuyConfirm(listing); setBuyType("user"); }}
                                className="w-full py-2.5 bg-primary text-primary-foreground rounded-lg text-xs font-bold hover:bg-primary/90 flex items-center justify-center gap-1.5">
                                <ShoppingCart className="w-3.5 h-3.5" /> Comprar
                              </button>
                            ) : null}
                          </div>
                        </div>
                      );
                    })}
                </div>
              </>
            )}
          </TabsContent>

          {/* ── Sell my slug ──────────────────────────────────────────────── */}
          {user && (
            <TabsContent value="sell">
              <div className="max-w-md mx-auto bg-card border border-border rounded-xl p-6 space-y-4">
                <h2 className="text-sm font-black text-foreground flex items-center gap-2">
                  <Tag className="w-4 h-4 text-accent" /> Vender Meu Subdomínio
                </h2>
                <div className="bg-accent/10 rounded-lg p-3 text-[10px] text-muted-foreground space-y-1">
                  <p>⚠️ <strong>Slugs com nome + sobrenome</strong> não podem ser vendidos</p>
                  <p>💰 Taxa de <strong>5%</strong> será cobrada sobre o valor da venda</p>
                  <p>📋 O comprador recebe o mini site e o subdomínio</p>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-muted-foreground uppercase">Selecione o Mini Site</label>
                  <select value={sellSiteId} onChange={e => setSellSiteId(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground text-sm">
                    <option value="">Escolha...</option>
                    {(mySites || []).filter((s: any) => !isFullName(s.slug)).map((s: any) => (
                      <option key={s.id} value={s.id}>/{s.slug} — {s.site_name || "Sem nome"}</option>
                    ))}
                  </select>
                  {sellSiteId && mySites?.find((s: any) => s.id === sellSiteId && isFullName(s.slug)) && (
                    <p className="text-[10px] text-destructive font-bold">❌ Este slug contém nome composto e não pode ser vendido</p>
                  )}
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-muted-foreground uppercase">Preço (USDC)</label>
                  <Input type="number" value={sellPrice} onChange={e => setSellPrice(e.target.value)} placeholder="100" min="1" />
                  {sellPrice && (
                    <p className="text-[10px] text-muted-foreground">
                      Você receberá: <strong className="text-foreground">${(parseFloat(sellPrice) * 0.95).toFixed(2)}</strong> (após 5% de taxa)
                    </p>
                  )}
                </div>
                <button onClick={() => createSlugListing.mutate()} disabled={!sellSiteId || !sellPrice}
                  className="w-full py-2.5 bg-accent text-accent-foreground rounded-lg text-xs font-bold hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-1.5">
                  <DollarSign className="w-3.5 h-3.5" /> Listar para Venda
                </button>
                {(myListings || []).length > 0 && (
                  <div className="space-y-2 pt-4 border-t border-border">
                    <p className="text-[10px] font-bold text-muted-foreground uppercase">Minhas Listagens</p>
                    {(myListings || []).map((l: any) => (
                      <div key={l.id} className="flex items-center justify-between px-3 py-2 bg-secondary/50 rounded-lg">
                        <div>
                          <span className="text-xs font-bold text-foreground">/{l.slug}</span>
                          <span className={`ml-2 text-[9px] font-bold px-1.5 py-0.5 rounded-full ${
                            l.status === "active" ? "bg-green-100 text-green-700" :
                            l.status === "sold" ? "bg-blue-100 text-blue-700" : "bg-gray-100 text-gray-500"
                          }`}>{l.status}</span>
                        </div>
                        <span className="text-xs font-mono font-bold text-foreground">${l.price}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </TabsContent>
          )}

          {/* ── My Slugs (registrations & renewals) ───────────────────────── */}
          {user && (
            <TabsContent value="my-slugs">
              <div className="max-w-2xl mx-auto space-y-4">
                <div className="flex items-center gap-2 mb-2">
                  <Calendar className="w-5 h-5 text-primary" />
                  <h2 className="text-sm font-black text-foreground uppercase">Meus Slugs Registrados</h2>
                </div>

                {!hasActiveMiniSite && (myRegistrations || []).length > 0 && (
                  <div className="bg-destructive/10 border border-destructive/30 rounded-xl p-4 flex items-center gap-3">
                    <AlertTriangle className="w-5 h-5 text-destructive shrink-0" />
                    <div>
                      <p className="text-xs font-bold text-destructive">⚠️ Mini Site inativo — Slugs em risco!</p>
                      <p className="text-[10px] text-muted-foreground">Sem mini site ativo, <strong>TODOS</strong> os seus slugs serão invalidados e voltarão para o HASHPO. Mantenha pelo menos 1 mini site ativo para garantir seus slugs.</p>
                    </div>
                  </div>
                )}

                {!(myRegistrations || []).length ? (
                  <div className="text-center py-12 text-muted-foreground text-sm bg-card border border-border rounded-xl">
                    Você ainda não registrou nenhum slug.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {(myRegistrations || []).map((reg: any) => {
                      const expiresAt = new Date(reg.expires_at);
                      const isExpired = expiresAt < new Date();
                      const daysLeft = Math.ceil((expiresAt.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
                      const isExpiring = daysLeft <= 30 && daysLeft > 0;

                      return (
                        <div key={reg.id} className={`bg-card border rounded-xl p-5 ${isExpired ? "border-destructive/30 bg-destructive/5" : isExpiring ? "border-accent/30" : "border-border"}`}>
                          <div className="flex items-center justify-between flex-wrap gap-3">
                            <div className="flex items-center gap-3">
                              <Globe className="w-5 h-5 text-primary" />
                              <div>
                                <p className="text-sm font-black text-foreground font-mono">/{reg.slug}</p>
                                <div className="flex items-center gap-2 mt-0.5">
                                  {reg.is_free_with_plan && <Badge variant="secondary" className="text-[8px]">Grátis c/ plano</Badge>}
                                  {reg.slug_type === "premium" && <Badge className="text-[8px] bg-accent text-accent-foreground">Premium</Badge>}
                                  {reg.slug_type === "personal_name" && <Badge variant="outline" className="text-[8px]">Nome pessoal</Badge>}
                                </div>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className={`text-xs font-bold ${isExpired ? "text-destructive" : isExpiring ? "text-accent" : "text-muted-foreground"}`}>
                                {isExpired ? "⚠️ EXPIRADO" : isExpiring ? `⏰ ${daysLeft} dias restantes` : `📅 Expira: ${expiresAt.toLocaleDateString()}`}
                              </p>
                              <p className="text-[10px] text-muted-foreground">
                                Registro: ${reg.registration_fee} • Renovação: ${reg.renewal_fee}/ano
                              </p>
                            </div>
                          </div>
                          {(isExpired || isExpiring) && (
                            <button
                              onClick={() => setRenewConfirm(reg)}
                              className="mt-3 w-full py-2.5 bg-primary text-primary-foreground rounded-lg text-xs font-bold hover:bg-primary/90 flex items-center justify-center gap-1.5"
                            >
                              <RefreshCw className="w-3.5 h-3.5" /> Renovar por ${RENEWAL_FEE}/ano
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </TabsContent>
          )}

          {/* ── Transfer Tab ─────────────────────────────────────────── */}
          {user && (
            <TabsContent value="transfer">
              <div className="max-w-lg mx-auto bg-card border border-border rounded-xl p-6 space-y-5">
                <div className="flex items-center gap-2">
                  <Send className="w-5 h-5 text-primary" />
                  <h2 className="text-sm font-black text-foreground uppercase">Transferir Slug</h2>
                </div>
                <p className="text-xs text-muted-foreground">
                  Transfira gratuitamente um slug para outro usuário. O destinatário precisa ter pelo menos 1 mini site ativo.
                </p>

                <div className="space-y-3">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-muted-foreground">Slug para transferir</label>
                    <select
                      value={transferSlug}
                      onChange={e => setTransferSlug(e.target.value)}
                      className="w-full h-10 px-3 bg-secondary text-foreground border border-border rounded-lg text-sm"
                    >
                      <option value="">Selecione um slug...</option>
                      {(mySites || []).map((s: any) => (
                        <option key={s.id} value={s.slug}>/{s.slug} — {s.site_name || "Sem nome"}</option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-muted-foreground">Email ou nome do destinatário</label>
                    <Input
                      value={transferToEmail}
                      onChange={e => setTransferToEmail(e.target.value)}
                      placeholder="nome@email.com ou display name"
                    />
                  </div>

                  <div className="bg-accent/10 rounded-lg p-3 border border-accent/20">
                    <p className="text-[10px] text-muted-foreground">
                      ⚠️ A transferência é <strong>gratuita e irreversível</strong>. O mini site e registro do slug serão transferidos para o destinatário.
                    </p>
                  </div>

                  <button
                    onClick={() => {
                      if (!transferSlug || !transferToEmail.trim()) {
                        toast.error("Preencha todos os campos");
                        return;
                      }
                      if (!confirm(`Transferir /${transferSlug} para ${transferToEmail}? Esta ação é irreversível.`)) return;
                      directTransfer.mutate();
                    }}
                    disabled={directTransfer.isPending || !transferSlug || !transferToEmail.trim()}
                    className="w-full py-3 bg-primary text-primary-foreground rounded-lg text-sm font-bold hover:bg-primary/90 disabled:opacity-40 flex items-center justify-center gap-2"
                  >
                    <Send className="w-4 h-4" />
                    {directTransfer.isPending ? "Transferindo..." : "Transferir Slug"}
                  </button>
                </div>
              </div>
            </TabsContent>
          )}
        </Tabs>
      </div>

      {/* Buy confirmation */}
      <AlertDialog open={!!buyConfirm} onOpenChange={o => !o && setBuyConfirm(null)}>
        <AlertDialogContent className="max-w-sm">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              {buyType === "premium" ? <Crown className="w-5 h-5 text-accent" /> : <ShoppingCart className="w-5 h-5 text-primary" />}
              Confirmar Compra
            </AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-2 text-sm">
                <p>Slug: <strong className="font-mono">/{buyConfirm?.slug}</strong></p>
                <p>Preço: <span className="font-mono font-bold text-primary">${buyConfirm?.price?.toLocaleString()}</span> USDC</p>
                {buyType === "user" && (
                  <p className="text-[10px] text-muted-foreground">Taxa de 5%: ${((buyConfirm?.price || 0) * 0.05).toFixed(2)}</p>
                )}
                <p className="text-[10px] text-muted-foreground">📅 Renovação anual: $12/ano para manter o slug</p>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => buyType === "premium" ? buyPremium.mutate(buyConfirm) : buyUserSlug.mutate(buyConfirm)}
              className="bg-accent text-accent-foreground">
              Comprar por ${buyConfirm?.price?.toLocaleString()}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Bid dialog */}
      <AlertDialog open={!!bidAuction} onOpenChange={o => !o && setBidAuction(null)}>
        <AlertDialogContent className="max-w-sm">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <Gavel className="w-5 h-5 text-accent" /> Dar Lance
            </AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-3 text-sm">
                <p>Slug: <strong className="font-mono">/{bidAuction?.slug || bidAuction?.keyword}</strong></p>
                <p>Lance atual: <span className="font-mono font-bold text-accent">${(bidAuction?.current_bid ?? bidAuction?.starting_price)?.toLocaleString()}</span></p>
                <p className="text-[10px] text-muted-foreground">
                  {bidAuction?.current_bid != null
                    ? `Próximo lance mín.: $${(bidAuction.current_bid + (bidAuction.min_increment ?? 10)).toLocaleString()} (+$${bidAuction.min_increment ?? 10})`
                    : `Lance inicial mín.: $${(bidAuction?.starting_price ?? 100).toLocaleString()}`}. Taxa 5% ao vencer.
                </p>
                <div>
                  <label className="text-[10px] font-bold text-muted-foreground uppercase">Seu Lance ($)</label>
                  <Input type="number" value={bidAmount} onChange={e => setBidAmount(e.target.value)}
                    min={bidAuction?.current_bid != null ? bidAuction.current_bid + (bidAuction.min_increment ?? 10) : (bidAuction?.starting_price ?? 100)}
                    placeholder={String(bidAuction?.current_bid != null ? bidAuction.current_bid + (bidAuction.min_increment ?? 10) : (bidAuction?.starting_price ?? 100))} />
                </div>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={() => placeBid.mutate()} className="bg-accent text-accent-foreground">
              Confirmar Lance ${bidAmount}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Renew dialog */}
      <AlertDialog open={!!renewConfirm} onOpenChange={o => !o && setRenewConfirm(null)}>
        <AlertDialogContent className="max-w-sm">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <RefreshCw className="w-5 h-5 text-primary" /> Renovar Slug
            </AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-2 text-sm">
                <p>Slug: <strong className="font-mono">/{renewConfirm?.slug}</strong></p>
                <p>Taxa de renovação: <span className="font-mono font-bold text-primary">${RENEWAL_FEE}</span>/ano</p>
                <p className="text-[10px] text-muted-foreground">Slugs não renovados voltam para o mercado e podem ser registrados por outros usuários.</p>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={() => renewSlug.mutate(renewConfirm)} className="bg-primary text-primary-foreground">
              Renovar por ${RENEWAL_FEE}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default SlugMarketplace;
