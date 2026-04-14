"use client";

import { useState, useEffect, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import Header from "@/components/Header";
import { useAuth } from "@/hooks/useAuth";
import Link from "next/link";
import {
  useMySite, useSiteLinks, useSiteVideos, useUpsertSite,
  useAddSiteLink, useDeleteSiteLink, useAddSiteVideo, useDeleteSiteVideo, useUpdateSiteVideo
} from "@/hooks/useMiniSite";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import CvEditor from "@/components/CvEditor";
import {
  Globe, Link2, Plus, Trash2, Eye, Upload, Camera, Car,
  LayoutGrid, Columns2, Columns3, Save, Youtube, ShieldCheck, Gem, RefreshCw,
  Palette, Lock, Layers, DollarSign, Image, MapPin, Building, Store, Shield, MessageCircle
} from "lucide-react";
import SocialLinkPicker, { SOCIAL_NETWORKS } from "@/components/SocialLinkPicker";
import { useSitePhotos, useAddSitePhoto, useDeleteSitePhoto, useUserDomains, useUserProperties } from "@/hooks/useMiniSiteExtras";
import TemplatePickerGrid from "@/components/TemplatePickerGrid";
import { getTemplate, type MiniSiteTemplate } from "@/data/miniSiteTemplates";
import { useMyCollections, useLaunchCollection } from "@/hooks/useCollections";
import PropertyEditor from "@/components/PropertyEditor";
import ClassifiedEditor from "@/components/ClassifiedEditor";
import UserSlugManager from "@/components/UserSlugManager";
import { Home as HomeIcon, Tag, Copy } from "lucide-react";
import { STRIPE_PRICES } from "@/data/stripeProducts";
import { normalizeSlug } from "@/lib/slug";
import { Button } from "@/components/ui/button";
import WalletButton from "@/components/WalletButton";
import { useSettings } from "@/hooks/useSettings";

const VIEW_TIERS = [
  { value: 1, label: "1 view" },
  { value: 5, label: "5 views" },
  { value: 20, label: "20 views" },
];

const THEMES = [
  { id: "cosmic", label: "Cosmic", colors: "from-purple-900 via-indigo-900 to-violet-800", accent: "#a855f7" },
  { id: "ocean", label: "Ocean", colors: "from-blue-900 via-cyan-900 to-teal-800", accent: "#06b6d4" },
  { id: "forest", label: "Forest", colors: "from-emerald-900 via-green-900 to-teal-900", accent: "#10b981" },
  { id: "sunset", label: "Sunset", colors: "from-orange-900 via-amber-900 to-yellow-800", accent: "#f59e0b" },
  { id: "midnight", label: "Midnight", colors: "from-slate-900 via-gray-900 to-zinc-900", accent: "#64748b" },
  { id: "rose", label: "Rose", colors: "from-rose-900 via-pink-900 to-fuchsia-900", accent: "#f43f5e" },
  { id: "mint", label: "Mint", colors: "from-teal-900 via-emerald-800 to-green-900", accent: "#14b8a6" },
  { id: "coral", label: "Coral", colors: "from-red-900 via-orange-800 to-amber-900", accent: "#fb7185" },
  { id: "navy", label: "Navy", colors: "from-indigo-950 via-blue-900 to-slate-900", accent: "#818cf8" },
];

const BG_STYLES = [
  { id: "dark", label: "Escuro", preview: "bg-gray-900", textColor: "text-white" },
  { id: "glass", label: "Vidro (Apple)", preview: "bg-gradient-to-br from-white/20 to-white/5 backdrop-blur", textColor: "text-white" },
  { id: "white", label: "Branco", preview: "bg-white", textColor: "text-gray-900" },
  { id: "beige", label: "Bege", preview: "bg-amber-50", textColor: "text-amber-900" },
  { id: "sand", label: "Areia", preview: "bg-yellow-100", textColor: "text-yellow-900" },
  { id: "warm", label: "Calor", preview: "bg-orange-50", textColor: "text-orange-900" },
  { id: "yellow", label: "Amarelo", preview: "bg-yellow-50", textColor: "text-yellow-900" },
  { id: "pastel-blue", label: "Azul Claro", preview: "bg-sky-50", textColor: "text-sky-900" },
  { id: "pastel-pink", label: "Rosa", preview: "bg-pink-50", textColor: "text-pink-900" },
  { id: "pastel-lavender", label: "Lavanda", preview: "bg-violet-50", textColor: "text-violet-900" },
  { id: "pastel-mint", label: "Menta", preview: "bg-teal-50", textColor: "text-teal-900" },
  { id: "pastel-rose", label: "Rosa Claro", preview: "bg-rose-50", textColor: "text-rose-900" },
  { id: "light-gray", label: "Cinza Claro", preview: "bg-gray-100", textColor: "text-gray-800" },
  { id: "silver", label: "Prata", preview: "bg-slate-200", textColor: "text-slate-800" },
  { id: "brushed-steel", label: "Aço Escovado", preview: "bg-zinc-300", textColor: "text-zinc-900" },
];

const FONT_SIZES = [
  { id: "sm", label: "Pequena" },
  { id: "md", label: "Média" },
  { id: "lg", label: "Grande" },
];

const PHOTO_SHAPES = [
  { id: "round", label: "Redonda" },
  { id: "square", label: "Quadrada" },
];

const PHOTO_SIZES = [
  { id: "auto", label: "Auto (tema)" },
  { id: "xs", label: "Mini" },
  { id: "sm", label: "Pequena" },
  { id: "md", label: "Média" },
  { id: "lg", label: "Grande" },
  { id: "xl", label: "Gigante" },
];

const CONTENT_LANGUAGES = [
  { code: "en", label: "English (base)" },
  { code: "es", label: "Español" },
  { code: "pt", label: "Português" },
  { code: "de", label: "Deutsch" },
  { code: "it", label: "Italiano" },
  { code: "fr", label: "Français" },
  { code: "ar", label: "العربية" },
  { code: "zh", label: "中文" },
  { code: "sv", label: "Svenska" },
  { code: "hi", label: "हिंदी" },
  { code: "ja", label: "日本語" },
  { code: "ru", label: "Русский" },
] as const;

type BlogPageItem = {
  title: string;
  url: string;
  summary: string;
  content: string;
  slug: string;
};

type MiniSiteAdvancedConfig = {
  contentLanguage: string;
  blogEnabled: boolean;
  feedMode: "hybrid" | "7d" | "365d" | "dual";
  walletLoginEnabled: boolean;
  avatarVideoUrl: string;
  avatarVideoMuted: boolean;
  blogPages: BlogPageItem[];
  seoTitle: string;
  seoDescription: string;
  seoImageUrl: string;
};

const getThemeClasses = (themeId: string) => {
  const theme = THEMES.find(t => t.id === themeId) || THEMES[0];
  return theme;
};

// ── Directory Panel (profissões: corretor vs domínios separados) ──
import { PROFESSION_CATEGORIES } from "@/data/professions";

function DirectoryPanel({ siteId, accentColor }: { siteId: string; accentColor: string }) {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [boostAmount, setBoostAmount] = useState("5");
  const [category, setCategory] = useState("geral");
  const [description, setDescription] = useState("");

  const { data: listing } = useQuery({
    queryKey: ["directory-listing", siteId],
    queryFn: async () => {
      const { data } = await supabase.from("mini_site_directory" as any).select("*").eq("site_id", siteId).maybeSingle();
      return data as any;
    },
    enabled: !!siteId,
  });

  const upsertListing = useMutation({
    mutationFn: async (vals: any) => {
      if (listing) {
        const { error } = await supabase.from("mini_site_directory" as any).update(vals).eq("id", listing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("mini_site_directory" as any).insert({ site_id: siteId, user_id: user!.id, ...vals } as any);
        if (error) throw error;
      }
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["directory-listing", siteId] }); toast.success("Configuração salva!"); },
    onError: (e: any) => toast.error(e.message),
  });

  const handleBoost = async () => {
    const amount = parseFloat(boostAmount);
    if (!amount || amount <= 0) { toast.error("Valor inválido"); return; }
    const boostExpiry = new Date(Date.now() + 7 * 86400000).toISOString(); // 7 days per boost
    await upsertListing.mutateAsync({ boost_amount: (listing?.boost_amount || 0) + amount, boost_expires_at: boostExpiry, listed: true });
    toast.success(`Destaque de $${amount} aplicado! Visibilidade por 7 dias.`);
  };

  const isListed = listing?.listed ?? false;
  const isBoosted = listing?.boost_expires_at && new Date(listing.boost_expires_at) > new Date();

  useEffect(() => {
    if (listing?.category) setCategory(listing.category);
  }, [listing?.category]);

  return (
    <div className="space-y-3">
      {/* Toggle listing */}
      <div className="flex items-center justify-between bg-secondary/50 rounded-xl px-4 py-3">
        <div>
          <p className="text-xs font-bold text-foreground">Listado no Diretório</p>
          <p className="text-[10px] text-muted-foreground">Aparece em hashpo.com/professionais (por profissão)</p>
        </div>
        <button
          onClick={() => upsertListing.mutate({ listed: !isListed, category, description })}
          className={`px-4 py-2 text-xs font-bold rounded-full transition-colors ${isListed ? "bg-[hsl(var(--ticker-up))] text-white" : "bg-secondary text-muted-foreground border border-border"}`}
        >
          {isListed ? "✓ Listado" : "Listar"}
        </button>
      </div>

      {isListed && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-muted-foreground">Categoria</label>
              <select value={category} onChange={e => setCategory(e.target.value)}
                className="w-full h-9 px-2 text-xs bg-background border border-border rounded text-foreground">
                {PROFESSION_CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-muted-foreground">Descrição curta</label>
              <input value={description} onChange={e => setDescription(e.target.value)} placeholder="Sobre seu site..."
                className="w-full h-9 px-2 text-xs bg-background border border-border rounded text-foreground" />
            </div>
          </div>
          <button onClick={() => upsertListing.mutate({ category, description })}
            className="text-xs font-bold px-4 py-2 rounded-lg bg-secondary text-foreground hover:bg-muted">
            Salvar info
          </button>

          {/* Boost */}
          <div className="border border-border rounded-xl p-3 space-y-2 bg-card">
            <div className="flex items-center gap-2">
              <span className="text-sm">🚀</span>
              <p className="text-xs font-bold text-foreground">Destacar no diretório</p>
              {isBoosted && (
                <span className="text-[9px] font-bold bg-yellow-500/20 text-yellow-500 px-1.5 py-0.5 rounded-full">
                  Em destaque até {new Date(listing.boost_expires_at!).toLocaleDateString("pt-BR")}
                </span>
              )}
            </div>
            <p className="text-[10px] text-muted-foreground">Cada dólar = 7 dias de destaque no topo do diretório.</p>
            <div className="flex gap-2 items-center">
              <span className="text-xs text-muted-foreground">$</span>
              <input type="number" value={boostAmount} onChange={e => setBoostAmount(e.target.value)} min="1" step="1"
                className="w-20 h-8 px-2 text-xs bg-secondary border border-border rounded text-foreground" />
              <button onClick={handleBoost} disabled={upsertListing.isPending}
                className="h-8 px-4 text-xs font-bold rounded-lg text-white hover:opacity-90"
                style={{ backgroundColor: accentColor }}>
                🚀 Destacar
              </button>
            </div>
            <p className="text-[9px] text-muted-foreground italic">Total investido em destaque: ${listing?.boost_amount || 0}</p>
          </div>
        </>
      )}
    </div>
  );
}

const MiniSiteEditor = () => {
  const { user, loading } = useAuth();
  const allowEditorWithoutLogin = process.env.NEXT_PUBLIC_EDITOR_NO_AUTH === "1";
  const { data: site, isLoading } = useMySite();
  const { data: links } = useSiteLinks(site?.id);
  const { data: videos } = useSiteVideos(site?.id);
  const upsertSite = useUpsertSite();
  const addLink = useAddSiteLink();
  const deleteLink = useDeleteSiteLink();
  const addVideo = useAddSiteVideo();
  const deleteVideo = useDeleteSiteVideo();
  const updateVideo = useUpdateSiteVideo();
  const { data: myCollections } = useMyCollections();
  const launchCollection = useLaunchCollection();
  const { data: photos } = useSitePhotos(site?.id);
  const addPhoto = useAddSitePhoto();
  const deletePhoto = useDeleteSitePhoto();
  const { data: userDomains } = useUserDomains(user?.id);
  const { data: userProperties } = useUserProperties(user?.id);
  const { data: settings } = useSettings();

  const [siteName, setSiteName] = useState("");
  const [slug, setSlug] = useState("");
  const [slugMode, setSlugMode] = useState<"@" | "s">("@");
  const [bio, setBio] = useState("");
  const [layoutCols, setLayoutCols] = useState(2);
  const [showCv, setShowCv] = useState(false);
  const [cvContent, setCvContent] = useState("");
  const [selectedTheme, setSelectedTheme] = useState("cosmic");
  const [templateId, setTemplateId] = useState("blank");
  const [contactEmail, setContactEmail] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [contactPrice, setContactPrice] = useState("20");
  const [cvHeadline, setCvHeadline] = useState("");
  const [cvLocation, setCvLocation] = useState("");
  const [cvSkills, setCvSkills] = useState<string[]>([]);
  const [cvExperience, setCvExperience] = useState<any[]>([]);
  const [cvEducation, setCvEducation] = useState<any[]>([]);
  const [avatarUrl, setAvatarUrl] = useState("");
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [bgStyle, setBgStyle] = useState("dark");
  const [address, setAddress] = useState("");
  const [showDomains, setShowDomains] = useState(false);
  const [showProperties, setShowProperties] = useState(false);
  const [showClassifieds, setShowClassifieds] = useState(false);
  const [showSlugsForSale, setShowSlugsForSale] = useState(false);
  const [showPhotos, setShowPhotos] = useState(false);
  const [showAiChat, setShowAiChat] = useState(true);
  const [fullPaywall, setFullPaywall] = useState(false);
  const [fullPaywallPrice, setFullPaywallPrice] = useState("9.99");
  const [agendaEnabled, setAgendaEnabled] = useState(false);
  const [appointmentPrice, setAppointmentPrice] = useState("0");
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [fontSize, setFontSize] = useState("md");
  const [photoShape, setPhotoShape] = useState("round");
  const [photoSize, setPhotoSize] = useState("md");
  const [published, setPublished] = useState(true);
  const [previewOrigin, setPreviewOrigin] = useState("");
  const [contentLanguage, setContentLanguage] = useState("en");
  const [blogEnabled, setBlogEnabled] = useState(true);
  const [feedMode, setFeedMode] = useState<"hybrid" | "7d" | "365d" | "dual">("hybrid");
  const [walletLoginEnabled, setWalletLoginEnabled] = useState(true);
  const [avatarVideoUrl, setAvatarVideoUrl] = useState("");
  const [avatarVideoMuted, setAvatarVideoMuted] = useState(true);
  const [uploadingAvatarVideo, setUploadingAvatarVideo] = useState(false);
  const [seoTitle, setSeoTitle] = useState("");
  const [seoDescription, setSeoDescription] = useState("");
  const [seoImageUrl, setSeoImageUrl] = useState("");
  const [seoImagePreviewUrl, setSeoImagePreviewUrl] = useState("");
  const [uploadingSeoImage, setUploadingSeoImage] = useState(false);
  const [blogPages, setBlogPages] = useState<BlogPageItem[]>([
    { title: "", url: "", summary: "", content: "", slug: "pagina-1" },
    { title: "", url: "", summary: "", content: "", slug: "pagina-2" },
    { title: "", url: "", summary: "", content: "", slug: "pagina-3" },
  ]);

  // ── NEW: Text color customization ──
  const [textColor, setTextColor] = useState("auto");
  const [headingColor, setHeadingColor] = useState("auto");
  const [linkColor, setLinkColor] = useState("auto");
  const [buttonTextColor, setButtonTextColor] = useState("auto");
  const [buttonBgColor, setButtonBgColor] = useState("auto");

  // ── NEW: Active tab for editor sections ──
  const [editorTab, setEditorTab] = useState<"design" | "content" | "properties" | "slugs">("design");

  const [linkTitle, setLinkTitle] = useState("");
  const [linkUrl, setLinkUrl] = useState("");

  const [ytUrl, setYtUrl] = useState("");
  const [videoTitle, setVideoTitle] = useState("");
  const [nftEnabled, setNftEnabled] = useState(false);
  const [nftPrice, setNftPrice] = useState("1.00");
  const [nftMaxViews, setNftMaxViews] = useState("1");
  const [nftMaxEditions, setNftMaxEditions] = useState("");
  const [rechargeEnabled, setRechargeEnabled] = useState(false);
  const [rechargePrice, setRechargePrice] = useState("0.50");
  const [previewFile, setPreviewFile] = useState<File | null>(null);
  const [paywallEnabled, setPaywallEnabled] = useState(false);
  const [paywallPrice, setPaywallPrice] = useState("0.15");
  const [extraSpaceCheckoutLoading, setExtraSpaceCheckoutLoading] = useState(false);
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const qc = useQueryClient();

  useEffect(() => {
    setPreviewOrigin(typeof window !== "undefined" ? window.location.origin : "");
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const saved = window.localStorage.getItem("hashpo.editor.zico");
    if (!saved) return;
    try {
      const parsed = JSON.parse(saved) as {
        contentLanguage?: string;
        blogEnabled?: boolean;
        feedMode?: "hybrid" | "7d" | "365d" | "dual";
        walletLoginEnabled?: boolean;
        avatarVideoUrl?: string;
        avatarVideoMuted?: boolean;
        blogPages?: BlogPageItem[];
        seoTitle?: string;
        seoDescription?: string;
        seoImageUrl?: string;
      };
      if (parsed.contentLanguage) setContentLanguage(parsed.contentLanguage);
      if (typeof parsed.blogEnabled === "boolean") setBlogEnabled(parsed.blogEnabled);
      if (parsed.feedMode) setFeedMode(parsed.feedMode);
      if (typeof parsed.walletLoginEnabled === "boolean") setWalletLoginEnabled(parsed.walletLoginEnabled);
      if (typeof parsed.avatarVideoUrl === "string") setAvatarVideoUrl(parsed.avatarVideoUrl);
      if (typeof parsed.avatarVideoMuted === "boolean") setAvatarVideoMuted(parsed.avatarVideoMuted);
      if (typeof parsed.seoTitle === "string") setSeoTitle(parsed.seoTitle);
      if (typeof parsed.seoDescription === "string") setSeoDescription(parsed.seoDescription);
      if (typeof parsed.seoImageUrl === "string") setSeoImageUrl(parsed.seoImageUrl);
      if (Array.isArray(parsed.blogPages) && parsed.blogPages.length) {
        const normalized = [...parsed.blogPages, { title: "", url: "", summary: "", content: "", slug: "pagina-1" }, { title: "", url: "", summary: "", content: "", slug: "pagina-2" }]
          .slice(0, 3)
          .map((item, idx) => ({
            title: item?.title || "",
            url: item?.url || "",
            summary: item?.summary || "",
            content: item?.content || "",
            slug: item?.slug || `pagina-${idx + 1}`,
          }));
        setBlogPages(normalized);
      }
    } catch {
      // ignore invalid local editor preferences
    }
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(
      "hashpo.editor.zico",
      JSON.stringify({ contentLanguage, blogEnabled, feedMode, walletLoginEnabled, avatarVideoUrl, avatarVideoMuted, blogPages, seoTitle, seoDescription, seoImageUrl }),
    );
  }, [contentLanguage, blogEnabled, feedMode, walletLoginEnabled, avatarVideoUrl, avatarVideoMuted, blogPages, seoTitle, seoDescription, seoImageUrl]);

  const effectiveExtraProperty = useMemo(() => {
    const s = site as any;
    if (!s) return 0;
    const n = s.extra_property_spaces ?? 0;
    const exp = s.extra_property_spaces_expires_at;
    if (!n) return 0;
    if (exp && new Date(exp) > new Date()) return n;
    return 0;
  }, [site]);

  const effectiveExtraClassified = useMemo(() => {
    const s = site as any;
    if (!s) return 0;
    const n = s.extra_classified_spaces ?? 0;
    const exp = s.extra_classified_spaces_expires_at;
    if (!n) return 0;
    if (exp && new Date(exp) > new Date()) return n;
    return 0;
  }, [site]);

  const startExtraSpaceCheckout = async (type: "property" | "classified") => {
    if (!site?.id || !user) return;
    const classifiedMonthlyUsd = Number((settings as any)?.classified_listing_monthly_usd ?? 2);
    const priceId = type === "property" ? STRIPE_PRICES.extra_property_space.price_id : undefined;
    setExtraSpaceCheckoutLoading(true);
    try {
      const checkoutBody =
        type === "classified"
          ? {
              mode: "subscription",
              amount_cents: Math.max(50, Math.round(classifiedMonthlyUsd * 100)),
              product_name: "Classified extra slot (monthly)",
              success_path: "/site/edit?extra_space_success=1&session_id={CHECKOUT_SESSION_ID}",
              cancel_path: "/site/edit",
              metadata: { extra_site_id: site.id, extra_type: type, billing_cycle: "monthly" },
            }
          : {
              price_id: priceId,
              success_path: "/site/edit?extra_space_success=1&session_id={CHECKOUT_SESSION_ID}",
              cancel_path: "/site/edit",
              metadata: { extra_site_id: site.id, extra_type: type },
            };
      const { data, error } = await supabase.functions.invoke("create-checkout", {
        body: checkoutBody,
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      if (data?.url) {
        window.location.href = data.url;
        return;
      }
      throw new Error("Resposta inválida do checkout");
    } catch (e: any) {
      toast.error(e?.message ?? "Erro ao abrir pagamento de espaço extra.");
      setExtraSpaceCheckoutLoading(false);
    }
  };

  useEffect(() => {
    const sessionId = searchParams.get("session_id");
    const ok = searchParams.get("extra_space_success");
    if (!ok || !sessionId || !user) return;
    (async () => {
      try {
        const { data, error } = await supabase.functions.invoke("apply-extra-space-after-payment", {
          body: { session_id: sessionId },
        });
        if (error) throw error;
        if (data?.error) throw new Error(data.error);
        toast.success("Pagamento confirmado! +1 espaço por 30 dias.");
        qc.invalidateQueries({ queryKey: ["my-mini-site"] });
      } catch (e: any) {
        toast.error(e?.message ?? "Erro ao ativar espaço extra.");
      }
      router.replace(pathname || "/site/edit");
    })();
  }, [searchParams, user, qc, router, pathname]);

  useEffect(() => {
    if (!site?.id || !user) return;
    void supabase.functions
      .invoke("sync-extra-space-subscriptions", { body: { site_id: site.id } })
      .then(({ error }) => {
        if (!error) qc.invalidateQueries({ queryKey: ["my-mini-site"] });
      });
  }, [site?.id, user, qc]);

  useEffect(() => {
    if (site) {
      setSiteName(site.site_name || "");
      setSlug(site.slug || "");
      setBio(site.bio || "");
      setLayoutCols(site.layout_columns || 2);
      setShowCv(site.show_cv || false);
      setCvContent(site.cv_content || "");
      setSelectedTheme(site.theme || "cosmic");
      setTemplateId((site as any).template_id || "blank");
      setContactEmail((site as any).contact_email || "");
      setContactPhone((site as any).contact_phone || "");
      setContactPrice(String((site as any).contact_price ?? 20));
      setCvHeadline((site as any).cv_headline || "");
      setCvLocation((site as any).cv_location || "");
      setCvSkills((site as any).cv_skills || []);
      setCvExperience((site as any).cv_experience || []);
      setCvEducation((site as any).cv_education || []);
      setAvatarUrl(site.avatar_url || "");
      setBgStyle((site as any).bg_style || "dark");
      setFontSize((site as any).font_size || "md");
      setPhotoShape((site as any).photo_shape || "round");
      setPhotoSize((site as any).photo_size || "md");
      setAddress((site as any).address || "");
      setShowDomains((site as any).show_domains || false);
      setShowProperties((site as any).show_properties || false);
      setShowClassifieds((site as any).show_classifieds || false);
      setShowSlugsForSale((site as any).show_slugs_for_sale || false);
      setShowPhotos((site as any).show_photos || false);
      setShowAiChat((site as any).show_ai_chat !== false);
      setFullPaywall((site as any).full_paywall || false);
      setFullPaywallPrice(String((site as any).full_paywall_price ?? 9.99));
      setAgendaEnabled((site as any).agenda_enabled || false);
      setAppointmentPrice(String((site as any).appointment_price ?? 0));
      // NEW: text colors
      setTextColor((site as any).text_color || "auto");
      setHeadingColor((site as any).heading_color || "auto");
      setLinkColor((site as any).link_color || "auto");
      setButtonTextColor((site as any).button_text_color || "auto");
      setButtonBgColor((site as any).button_bg_color || "auto");
      setPublished((site as any).published !== false);
      setContentLanguage((site as any).content_language || "en");
      setBlogEnabled((site as any).blog_enabled ?? true);
      setFeedMode((site as any).feed_mode || "hybrid");
      setWalletLoginEnabled((site as any).wallet_login_enabled ?? true);
      setAvatarVideoUrl((site as any).avatar_video_url || "");
      setAvatarVideoMuted((site as any).avatar_video_muted ?? true);
      setSeoTitle((site as any).seo_title || "");
      setSeoDescription((site as any).seo_description || "");
      setSeoImageUrl((site as any).seo_image_url || "");
      if (Array.isArray((site as any).blog_pages) && (site as any).blog_pages.length) {
        const dbPages = (site as any).blog_pages as BlogPageItem[];
        const normalizedDb = [...dbPages, { title: "", url: "", summary: "", content: "", slug: "pagina-1" }, { title: "", url: "", summary: "", content: "", slug: "pagina-2" }]
          .slice(0, 3)
          .map((item, idx) => ({
            title: item?.title || "",
            url: item?.url || "",
            summary: item?.summary || "",
            content: item?.content || "",
            slug: item?.slug || `pagina-${idx + 1}`,
          }));
        setBlogPages(normalizedDb);
      }
      try {
        const parsed = JSON.parse(((site as any).custom_css as string) || "{}") as Partial<MiniSiteAdvancedConfig>;
        if (parsed.contentLanguage) setContentLanguage(parsed.contentLanguage);
        if (typeof parsed.blogEnabled === "boolean") setBlogEnabled(parsed.blogEnabled);
        if (parsed.feedMode) setFeedMode(parsed.feedMode);
        if (typeof parsed.walletLoginEnabled === "boolean") setWalletLoginEnabled(parsed.walletLoginEnabled);
        if (typeof parsed.avatarVideoUrl === "string") setAvatarVideoUrl(parsed.avatarVideoUrl);
        if (typeof parsed.avatarVideoMuted === "boolean") setAvatarVideoMuted(parsed.avatarVideoMuted);
        if (typeof parsed.seoTitle === "string") setSeoTitle(parsed.seoTitle);
        if (typeof parsed.seoDescription === "string") setSeoDescription(parsed.seoDescription);
        if (typeof parsed.seoImageUrl === "string") setSeoImageUrl(parsed.seoImageUrl);
        if (Array.isArray(parsed.blogPages) && parsed.blogPages.length) {
          const normalized = [...parsed.blogPages, { title: "", url: "", summary: "", content: "", slug: "pagina-1" }, { title: "", url: "", summary: "", content: "", slug: "pagina-2" }]
            .slice(0, 3)
            .map((item, idx) => ({
              title: item?.title || "",
              url: item?.url || "",
              summary: item?.summary || "",
              content: item?.content || "",
              slug: item?.slug || `pagina-${idx + 1}`,
            }));
          setBlogPages(normalized);
        }
      } catch {
        // keep defaults when custom config is absent/invalid
      }
    }
  }, [site]);

  if (loading || isLoading) return <div className="min-h-screen bg-background"><Header /><div className="flex items-center justify-center py-20 text-muted-foreground text-sm">Loading...</div></div>;
  if (!user && !allowEditorWithoutLogin) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="max-w-xl mx-auto px-6 py-20 text-center">
          <h1 className="text-2xl font-black text-foreground mb-2">Entrar para abrir o editor</h1>
          <p className="text-sm text-muted-foreground mb-6">
            Detectamos instabilidade de sessão. Use o login e volte para o editor sem loop.
          </p>
          <Link
            href="/auth?redirect=/site/edit"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-black text-sm bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            Ir para login
          </Link>
        </div>
      </div>
    );
  }

  const handleSaveSite = async () => {
    if (!user) {
      toast.error("Faça login para salvar alterações.");
      return;
    }
    try {
      const rawAvatar = avatarUrl?.trim() || "";
      let safeAvatar: string | null = rawAvatar ? rawAvatar.split("?")[0] : null;
      if (safeAvatar?.startsWith("blob:") || safeAvatar?.startsWith("data:")) {
        safeAvatar = (site as any)?.avatar_url ?? null;
        toast.message("Use apenas fotos enviadas ao Storage (sem preview blob).");
      }
      await upsertSite.mutateAsync({
        content_language: contentLanguage,
        blog_enabled: blogEnabled,
        feed_mode: feedMode,
        wallet_login_enabled: walletLoginEnabled,
        avatar_video_url: avatarVideoUrl || null,
        avatar_video_muted: avatarVideoMuted,
        blog_pages: blogPages,
        seo_title: seoTitle || null,
        seo_description: seoDescription || null,
        seo_image_url: seoImageUrl || null,
        custom_css: JSON.stringify({
          contentLanguage,
          blogEnabled,
          feedMode,
          walletLoginEnabled,
          avatarVideoUrl,
          avatarVideoMuted,
          blogPages,
          seoTitle,
          seoDescription,
          seoImageUrl,
        } satisfies MiniSiteAdvancedConfig),
        site_name: siteName,
        slug: slug || user.email?.split("@")[0],
        bio,
        layout_columns: layoutCols,
        show_cv: showCv,
        cv_content: cvContent,
        theme: selectedTheme,
        template_id: templateId,
        contact_email: contactEmail,
        contact_phone: contactPhone,
        contact_price: parseFloat(contactPrice) || 20,
        cv_headline: cvHeadline,
        cv_location: cvLocation,
        cv_skills: cvSkills,
        cv_experience: cvExperience,
        cv_education: cvEducation,
        avatar_url: safeAvatar || null,
        bg_style: bgStyle,
        font_size: fontSize,
        photo_shape: photoShape,
        photo_size: photoSize,
        address,
        show_domains: showDomains,
        show_properties: showProperties,
        show_classifieds: showClassifieds,
        show_slugs_for_sale: showSlugsForSale,
        show_photos: showPhotos,
        show_ai_chat: showAiChat,
        full_paywall: fullPaywall,
        full_paywall_price: parseFloat(fullPaywallPrice) || 0,
        agenda_enabled: agendaEnabled,
        appointment_price: parseFloat(appointmentPrice) || 0,
        // NEW: color customization
        text_color: textColor,
        heading_color: headingColor,
        link_color: linkColor,
        button_text_color: buttonTextColor,
        button_bg_color: buttonBgColor,
        published,
      });
      toast.success(published ? "Salvo e no ar!" : "Salvo (mini site oculto do público).");
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  const handleAvatarUpload = async (file: File) => {
    setUploadingAvatar(true);
    try {
      if (!file.type.startsWith("image/")) {
        toast.error("Envie apenas uma imagem.");
        return;
      }
      const ext = file.name.split(".").pop() || "jpg";
      const path = `${user!.id}/avatar.${ext}`;
      const { error } = await supabase.storage.from("platform-assets").upload(path, file, { upsert: true });
      if (error) throw error;
      const { data } = supabase.storage.from("platform-assets").getPublicUrl(path);
      const stableUrl = data.publicUrl;
      setAvatarUrl(`${stableUrl}?t=${Date.now()}`);
      if (site?.id) {
        const { error: dbErr } = await supabase.from("mini_sites").update({ avatar_url: stableUrl }).eq("id", site.id);
        if (dbErr) throw dbErr;
        qc.invalidateQueries({ queryKey: ["my-mini-site"] });
      }
      toast.success("Avatar salvo no Supabase Storage!");
    } catch (e: any) { toast.error(e.message); }
    setUploadingAvatar(false);
  };

  const handleAvatarVideoUpload = async (file: File) => {
    if (!user) return;
    setUploadingAvatarVideo(true);
    try {
      if (!file.type.startsWith("video/")) {
        toast.error("Envie um arquivo de video.");
        return;
      }
      const durationSeconds = await new Promise<number>((resolve, reject) => {
        const el = document.createElement("video");
        const objectUrl = URL.createObjectURL(file);
        el.preload = "metadata";
        el.onloadedmetadata = () => {
          URL.revokeObjectURL(objectUrl);
          resolve(el.duration || 0);
        };
        el.onerror = () => {
          URL.revokeObjectURL(objectUrl);
          reject(new Error("Nao foi possivel ler o video."));
        };
        el.src = objectUrl;
      });
      if (durationSeconds > 20) {
        toast.error(`Video com ${durationSeconds.toFixed(1)}s. O limite e 20s.`);
        return;
      }
      const ext = file.name.split(".").pop() || "mp4";
      const path = `${user.id}/avatar-video.${ext}`;
      const { error } = await supabase.storage.from("platform-assets").upload(path, file, { upsert: true });
      if (error) throw error;
      const { data } = supabase.storage.from("platform-assets").getPublicUrl(path);
      setAvatarVideoUrl(data.publicUrl);
      toast.success("Avatar em video atualizado.");
    } catch (e: any) {
      toast.error(e?.message ?? "Falha ao enviar video.");
    } finally {
      setUploadingAvatarVideo(false);
    }
  };

  const handleSeoImagePreview = (file: File) => {
    const localPreview = URL.createObjectURL(file);
    setSeoImagePreviewUrl(localPreview);
  };

  const handleSeoImageUpload = async (file: File) => {
    if (!user) return;
    setUploadingSeoImage(true);
    try {
      if (!file.type.startsWith("image/")) {
        toast.error("Envie uma imagem para SEO.");
        return;
      }
      const ext = file.name.split(".").pop() || "jpg";
      const path = `${user.id}/seo-card.${ext}`;
      const { error } = await supabase.storage.from("platform-assets").upload(path, file, { upsert: true });
      if (error) throw error;
      const { data } = supabase.storage.from("platform-assets").getPublicUrl(path);
      setSeoImageUrl(data.publicUrl);
      toast.success("Imagem SEO enviada.");
    } catch (e: any) {
      toast.error(e?.message ?? "Falha ao enviar imagem SEO.");
    } finally {
      setUploadingSeoImage(false);
    }
  };

  const extractYouTubeId = (raw: string): string | null => {
    const url = raw.trim();
    const match = url.match(
      /(?:youtu\.be\/|youtube\.com\/(?:m\.)?(?:watch\?(?:[^#]*&)?v=|embed\/|shorts\/|live\/))([\w-]{11})/,
    );
    if (match?.[1]) return match[1];
    if (/^[\w-]{11}$/.test(url)) return url;
    return null;
  };

  const uploadPreview = async (file: File, ytId: string): Promise<string | null> => {
    const ext = file.name.split(".").pop();
    const path = `${user!.id}/${ytId}-preview.${ext}`;
    const { error } = await supabase.storage.from("video-previews").upload(path, file, { upsert: true });
    if (error) { toast.error("Preview upload failed: " + error.message); return null; }
    const { data } = supabase.storage.from("video-previews").getPublicUrl(path);
    return data.publicUrl;
  };

  const handleAddVideo = async () => {
    if (!site?.id || !ytUrl) return;
    const ytId = extractYouTubeId(ytUrl);
    if (!ytId) {
      toast.error("Cole uma URL válida do YouTube ou o ID de 11 caracteres.");
      return;
    }
    let previewUrl: string | undefined;
    if (previewFile) { const url = await uploadPreview(previewFile, ytId); if (url) previewUrl = url; }
    try {
      await addVideo.mutateAsync({
        site_id: site.id, youtube_video_id: ytId, title: videoTitle || `Video ${ytId}`,
        thumbnail_url: `https://img.youtube.com/vi/${ytId}/hqdefault.jpg`,
        nft_enabled: nftEnabled, nft_price: nftEnabled ? (parseFloat(nftPrice) || 1) : 0,
        nft_max_views: parseInt(nftMaxViews) || 1,
        nft_max_editions: nftMaxEditions ? parseInt(nftMaxEditions) : undefined,
        preview_url: previewUrl, recharge_enabled: rechargeEnabled,
        recharge_price: rechargeEnabled ? (parseFloat(rechargePrice) || 0) : 0,
        view_tier: parseInt(nftMaxViews) || 1,
        paywall_enabled: paywallEnabled,
        paywall_price: paywallEnabled ? (parseFloat(paywallPrice) || 0.15) : 0,
      });
      setYtUrl(""); setVideoTitle(""); setNftEnabled(false); setNftPrice("1.00");
      setNftMaxViews("1"); setNftMaxEditions(""); setPreviewFile(null);
      setRechargeEnabled(false); setRechargePrice("0.50");
      setPaywallEnabled(false); setPaywallPrice("0.15");
      toast.success("Video added!");
    } catch (e: any) { toast.error(e.message); }
  };

  const handleAddLink = async (title?: string, url?: string, icon?: string) => {
    const t = title || linkTitle;
    const u = url || linkUrl;
    if (!site?.id || !t || !u) return;
    try {
      await addLink.mutateAsync({ site_id: site.id, title: t, url: u, icon: icon || "link" });
      if (!title) { setLinkTitle(""); setLinkUrl(""); }
      toast.success("Link added!");
    } catch (e: any) { toast.error(e.message); }
  };

  const handleGoogleSignIn = async () => {
    const redirectTo = `${typeof window !== "undefined" ? window.location.origin : ""}/site/edit`;
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo,
        queryParams: { prompt: "select_account", access_type: "offline" },
      },
    });
    if (error) {
      toast.error(error.message || "Google sign-in failed");
      return;
    }
    toast.success("Redirecionando para Google...");
  };

  const publicUrl = previewOrigin ? `${previewOrigin}/@${slug || "preview"}` : "";
  const blogPreviewSlug = (blogPages[0]?.slug || "pagina-1").trim() || "pagina-1";
  const blogPreviewUrl = previewOrigin ? `${previewOrigin}/@${slug || "preview"}/blog/${blogPreviewSlug}` : "";
  const currentTheme = getThemeClasses(selectedTheme);

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="max-w-6xl mx-auto p-6">
        {/* Title */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <Globe className="w-6 h-6 text-primary" />
            <h1 className="text-2xl font-black text-foreground">Mini-Site Editor</h1>
          </div>
          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            {publicUrl ? (
              <a href={publicUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-xs text-primary hover:underline">
                <Eye className="w-3.5 h-3.5" /> Preview
              </a>
            ) : (
              <span className="flex items-center gap-1.5 text-xs text-muted-foreground"><Eye className="w-3.5 h-3.5" /> Preview</span>
            )}
            <Link href="/marketplace" className="flex items-center gap-1.5 text-xs text-accent hover:underline">
              <Gem className="w-3.5 h-3.5" /> Marketplace
            </Link>
            <div className="flex items-center gap-2 rounded-lg border border-border bg-secondary/60 px-2 py-1.5">
              <Switch id="mini-site-published" checked={published} onCheckedChange={setPublished} />
              <label htmlFor="mini-site-published" className="text-[10px] font-bold text-foreground cursor-pointer leading-tight">
                No ar<br /><span className="font-normal text-muted-foreground">(público / Google)</span>
              </label>
            </div>
            <button type="button" onClick={handleSaveSite} className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground font-bold text-xs rounded-lg hover:bg-primary/90">
              <Save className="w-4 h-4" /> Salvar
            </button>
          </div>
        </div>

        {/* Template Picker */}
        <div className="bg-card border border-border rounded-xl p-6 space-y-4 mb-6">
          <h2 className="text-sm font-bold text-primary uppercase tracking-wider flex items-center gap-2">
            <Layers className="w-4 h-4" /> Escolha um Template
          </h2>
          <TemplatePickerGrid
            selectedId={templateId}
            onSelect={(tpl: MiniSiteTemplate) => {
              setTemplateId(tpl.id);
              setSelectedTheme(tpl.theme);
              setLayoutCols(tpl.layoutColumns);
              setShowCv(tpl.showCv);
              toast.success(`Template "${tpl.name}" aplicado!`);
            }}
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          {/* Left: Editor panels */}
          <div className="lg:col-span-3 space-y-6">
            {/* Profile */}
            <div className="bg-card border border-border rounded-xl p-6 space-y-4">
              <h2 className="text-sm font-bold text-primary uppercase tracking-wider flex items-center gap-2">
                <LayoutGrid className="w-4 h-4" /> Perfil
              </h2>
              <div className="space-y-2">
                <label className="text-xs font-bold text-muted-foreground">Username (URL do seu Mini-Site)</label>

                {/* Input do slug com preview da URL */}
                <div className="flex items-center gap-1 bg-secondary border border-border rounded-lg px-3 py-1.5 focus-within:ring-1 focus-within:ring-primary">
                  <span className="text-xs text-muted-foreground whitespace-nowrap font-mono shrink-0">
                    hashpo.com/@
                  </span>
                  <input
                    value={slug}
                    onChange={e => setSlug(normalizeSlug(e.target.value))}
                    placeholder="seunome"
                    className="flex-1 bg-transparent text-xs font-mono text-foreground outline-none placeholder:text-muted-foreground/50"
                  />
                </div>

                {/* Status do slug: seu slug atual vs disponível */}
                {slug.length >= 2 && (
                  <p className="text-[10px] text-muted-foreground">
                    {site?.slug === slug ? (
                      <span className="text-primary font-medium">✓ Este é o slug do seu site</span>
                    ) : (
                      <span>Formato: letras, números e hífen. Para garantir este slug, <Link href="/slugs" className="text-primary hover:underline">registre ou compre no marketplace</Link>.</span>
                    )}
                  </p>
                )}
                {/* Preview clicável */}
                {slug && (
                  <a
                    href={publicUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 text-[10px] text-primary hover:underline font-mono"
                  >
                    <Eye className="w-3 h-3" />
                    {publicUrl}
                  </a>
                )}
              </div>
              {/* Avatar Upload */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-muted-foreground flex items-center gap-1"><Camera className="w-3 h-3" /> Profile Photo</label>
                <div className="flex items-center gap-3">
                  {avatarUrl ? (
                    <img src={avatarUrl} alt="avatar" className="w-14 h-14 rounded-full object-cover border-2 border-primary" />
                  ) : (
                    <div className="w-14 h-14 rounded-full bg-muted flex items-center justify-center text-2xl font-black text-muted-foreground border-2 border-border">
                      {siteName?.[0]?.toUpperCase() || "?"}
                    </div>
                  )}
                  <div>
                    <Input type="file" accept="image/*" onChange={e => { const f = e.target.files?.[0]; if (f) handleAvatarUpload(f); }} className="text-xs w-48" disabled={uploadingAvatar} />
                    {uploadingAvatar && <p className="text-[10px] text-accent animate-pulse">Uploading...</p>}
                  </div>
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-muted-foreground">Avatar em video (max 20s)</label>
                <div className="flex items-center gap-3">
                  {avatarVideoUrl ? (
                    <video
                      src={avatarVideoUrl}
                      className="w-20 h-20 rounded-xl object-cover border border-primary/40"
                      autoPlay={avatarVideoMuted}
                      loop
                      muted={avatarVideoMuted}
                      controls={!avatarVideoMuted}
                      playsInline
                    />
                  ) : (
                    <div className="w-20 h-20 rounded-xl bg-muted border border-border flex items-center justify-center text-[10px] text-muted-foreground">
                      sem video
                    </div>
                  )}
                  <div className="space-y-2">
                    <Input
                      type="file"
                      accept="video/*"
                      onChange={e => { const f = e.target.files?.[0]; if (f) handleAvatarVideoUpload(f); }}
                      className="text-xs w-56"
                      disabled={uploadingAvatarVideo}
                    />
                    <label className="flex items-center gap-2 text-[11px] text-muted-foreground">
                      <input type="checkbox" checked={avatarVideoMuted} onChange={(e) => setAvatarVideoMuted(e.target.checked)} />
                      Reproduzir sem som (autoplay)
                    </label>
                  </div>
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-muted-foreground">Display Name</label>
                <Input value={siteName} onChange={e => setSiteName(e.target.value)} placeholder="Seu Nome" />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-muted-foreground">Bio</label>
                <Textarea value={bio} onChange={e => setBio(e.target.value)} placeholder="Tell us about yourself..." rows={3} />
              </div>
            </div>

            <div className="bg-card border border-border rounded-xl p-6 space-y-3">
              <h2 className="text-sm font-bold text-primary uppercase tracking-wider">Brand identity & wildcard domain</h2>
              <p className="text-[11px] text-muted-foreground">
                This is the central place to update name and address for your active site identity.
                Your wildcard URL can use <code className="bg-secondary px-1 rounded">{slug || "yourslug"}.hashpo.com</code>.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div className="rounded-lg border border-border bg-secondary/40 px-3 py-2">
                  <p className="text-[10px] uppercase text-muted-foreground font-bold mb-1">Current display name</p>
                  <p className="text-xs font-semibold text-foreground break-all">{siteName || "—"}</p>
                </div>
                <div className="rounded-lg border border-border bg-secondary/40 px-3 py-2">
                  <p className="text-[10px] uppercase text-muted-foreground font-bold mb-1">Current address</p>
                  <p className="text-xs font-semibold text-foreground break-all">{address || "—"}</p>
                </div>
                <div className="rounded-lg border border-border bg-secondary/40 px-3 py-2">
                  <p className="text-[10px] uppercase text-muted-foreground font-bold mb-1">Wildcard URL</p>
                  <p className="text-xs font-mono text-primary break-all">https://{slug || "yourslug"}.hashpo.com</p>
                </div>
                <div className="rounded-lg border border-border bg-secondary/40 px-3 py-2">
                  <p className="text-[10px] uppercase text-muted-foreground font-bold mb-1">Fallback URL</p>
                  <p className="text-xs font-mono text-primary break-all">https://hashpo.com/@{slug || "yourslug"}</p>
                </div>
              </div>
            </div>

            {/* Theme */}
            <div className="bg-card border border-border rounded-xl p-6 space-y-4">
              <h2 className="text-sm font-bold text-primary uppercase tracking-wider flex items-center gap-2">
                <Palette className="w-4 h-4" /> Tema de Cor
              </h2>
              <div className="flex gap-3">
                {THEMES.map(theme => (
                  <button
                    key={theme.id}
                    onClick={() => setSelectedTheme(theme.id)}
                    className={`relative flex flex-col items-center gap-1.5 transition-all ${selectedTheme === theme.id ? "scale-105" : "opacity-70 hover:opacity-100"}`}
                  >
                    <div className={`w-16 h-16 rounded-xl bg-gradient-to-br ${theme.colors} border-2 ${selectedTheme === theme.id ? "border-primary ring-2 ring-primary/30" : "border-border"} flex items-center justify-center`}>
                      {selectedTheme === theme.id && <span className="text-white text-lg">✓</span>}
                    </div>
                    <span className="text-[10px] font-bold text-foreground">{theme.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Background Style */}
            <div className="bg-card border border-border rounded-xl p-6 space-y-4">
              <h2 className="text-sm font-bold text-primary uppercase tracking-wider flex items-center gap-2">
                <Palette className="w-4 h-4" /> Fundo do Site
              </h2>
              <div className="flex flex-wrap gap-3">
                {BG_STYLES.map(bg => (
                  <button
                    key={bg.id}
                    onClick={() => setBgStyle(bg.id)}
                    className={`relative flex flex-col items-center gap-1.5 transition-all ${bgStyle === bg.id ? "scale-105" : "opacity-70 hover:opacity-100"}`}
                  >
                    <div className={`w-14 h-14 rounded-xl ${bg.preview} border-2 ${bgStyle === bg.id ? "border-primary ring-2 ring-primary/30" : "border-border"} flex items-center justify-center shadow-sm`}>
                      {bgStyle === bg.id && <span className={`text-lg ${bg.id === "dark" ? "text-white" : "text-gray-800"}`}>✓</span>}
                    </div>
                    <span className="text-[10px] font-bold text-foreground">{bg.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Font Size */}
            <div className="bg-card border border-border rounded-xl p-6 space-y-4">
              <h2 className="text-sm font-bold text-primary uppercase tracking-wider">Tamanho da Fonte</h2>
              <div className="flex gap-2">
                {FONT_SIZES.map(fs => (
                  <button key={fs.id} onClick={() => setFontSize(fs.id)}
                    className={`px-4 py-2 rounded-lg text-xs font-bold border transition-all ${fontSize === fs.id ? "bg-primary text-primary-foreground border-primary" : "bg-secondary text-muted-foreground border-border hover:border-primary/50"}`}>
                    {fs.id === "sm" ? "A" : fs.id === "md" ? "A+" : "A++"} {fs.label}
                  </button>
                ))}
              </div>
            </div>

            {/* ── NEW: Text Color Customization ── */}
            <div className="bg-card border border-border rounded-xl p-6 space-y-4">
              <h2 className="text-sm font-bold text-primary uppercase tracking-wider flex items-center gap-2">
                <Palette className="w-4 h-4" /> Cores do Texto
              </h2>
              <p className="text-[10px] text-muted-foreground">
                Essencial para fundos claros (branco, bege, etc.) onde o texto automático pode ficar invisível.
                Use <code className="bg-secondary px-1 rounded">auto</code> para cor automática ou escolha uma cor.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {[
                  { label: "Texto principal", value: textColor, set: setTextColor, hint: "Parágrafos, bio, descrições" },
                  { label: "Títulos / Headings", value: headingColor, set: setHeadingColor, hint: "Nome, cabeçalhos" },
                  { label: "Links", value: linkColor, set: setLinkColor, hint: "Links sociais e navegação" },
                  { label: "Texto dos Botões", value: buttonTextColor, set: setButtonTextColor, hint: "Label dos botões" },
                  { label: "Fundo dos Botões", value: buttonBgColor, set: setButtonBgColor, hint: "Background dos botões" },
                ].map(({ label, value, set, hint }) => (
                  <div key={label} className="space-y-1.5">
                    <label className="text-[10px] font-bold text-muted-foreground">{label}</label>
                    <p className="text-[9px] text-muted-foreground/70 italic">{hint}</p>
                    <div className="flex gap-2 items-center">
                      <button
                        onClick={() => set("auto")}
                        className={`px-2 py-1.5 text-[10px] font-bold rounded border transition-colors ${value === "auto" ? "bg-primary text-primary-foreground border-primary" : "bg-secondary text-muted-foreground border-border"}`}
                      >
                        Auto
                      </button>
                      <div className="flex items-center gap-2 flex-1">
                        <input
                          type="color"
                          value={value === "auto" ? "#ffffff" : value}
                          onChange={e => set(e.target.value)}
                          className="w-10 h-8 rounded border border-border cursor-pointer bg-transparent"
                        />
                        <input
                          type="text"
                          value={value === "auto" ? "" : value}
                          onChange={e => set(e.target.value || "auto")}
                          placeholder="#ffffff ou auto"
                          className="flex-1 h-8 px-2 text-xs bg-secondary text-foreground border border-border rounded font-mono"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Preview strip */}
              <div className="rounded-lg p-3 border border-border" style={{
                backgroundColor: bgStyle === "dark" ? "#0f0f0f" : bgStyle === "white" ? "#ffffff" : bgStyle === "beige" ? "#fdf8f0" : "#f5f5f5"
              }}>
                <h4 className="font-bold text-sm mb-1" style={{ color: headingColor === "auto" ? undefined : headingColor }}>
                  Título de Exemplo
                </h4>
                <p className="text-xs mb-2" style={{ color: textColor === "auto" ? undefined : textColor }}>
                  Texto do mini-site aparece assim.
                </p>
                <div className="flex gap-2">
                  <a href="#" className="text-xs underline" style={{ color: linkColor === "auto" ? undefined : linkColor }}>Link</a>
                  <button className="text-xs px-2 py-1 rounded font-bold" style={{
                    color: buttonTextColor === "auto" ? undefined : buttonTextColor,
                    backgroundColor: buttonBgColor === "auto" ? undefined : buttonBgColor,
                    border: "1px solid rgba(255,255,255,0.2)",
                  }}>
                    Botão
                  </button>
                </div>
              </div>
            </div>

            {/* Photo Shape & Size */}
            <div className="bg-card border border-border rounded-xl p-6 space-y-4">
              <h2 className="text-sm font-bold text-primary uppercase tracking-wider flex items-center gap-2">
                <Camera className="w-4 h-4" /> Formato da Foto
              </h2>
              <div className="space-y-3">
                <div>
                  <label className="text-xs font-bold text-muted-foreground mb-2 block">Formato</label>
                  <div className="flex gap-2">
                    {PHOTO_SHAPES.map(ps => (
                      <button key={ps.id} onClick={() => setPhotoShape(ps.id)}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold border transition-all ${photoShape === ps.id ? "bg-primary text-primary-foreground border-primary" : "bg-secondary text-muted-foreground border-border hover:border-primary/50"}`}>
                        <div className={`w-5 h-5 bg-muted-foreground/30 ${ps.id === "round" ? "rounded-full" : "rounded-sm"}`} />
                        {ps.label}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="text-xs font-bold text-muted-foreground mb-2 block">Tamanho</label>
                  <div className="flex gap-2">
                    {PHOTO_SIZES.map(ps => (
                      <button key={ps.id} onClick={() => setPhotoSize(ps.id)}
                        className={`px-4 py-2 rounded-lg text-xs font-bold border transition-all ${photoSize === ps.id ? "bg-primary text-primary-foreground border-primary" : "bg-secondary text-muted-foreground border-border hover:border-primary/50"}`}>
                        {ps.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Layout */}
            <div className="bg-card border border-border rounded-xl p-6 space-y-4">
              <h2 className="text-sm font-bold text-muted-foreground uppercase tracking-wider">Video Layout</h2>
              <div className="flex gap-2 flex-wrap">
                {[1, 2, 3, 4].map(n => (
                  <button key={n} onClick={() => setLayoutCols(n)}
                    className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold border transition-all ${layoutCols === n ? "bg-primary text-primary-foreground border-primary" : "bg-secondary text-muted-foreground border-border hover:border-primary/50"}`}>
                    {n >= 3 ? <Columns3 className="w-4 h-4" /> : <Columns2 className="w-4 h-4" />}
                    {n} {n === 1 ? "Column" : "Columns"}
                  </button>
                ))}
              </div>
            </div>

            {/* CV & Contact */}
            <div className="bg-card border border-border rounded-xl p-6 space-y-4">
              <h2 className="text-sm font-bold text-primary uppercase tracking-wider flex items-center gap-2">
                <Lock className="w-4 h-4" /> CV / Resume & Contact
              </h2>
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-muted-foreground">Show Expandable CV</label>
                <Switch checked={showCv} onCheckedChange={setShowCv} />
              </div>
              {showCv && (
                <CvEditor
                  cvContent={cvContent} setCvContent={setCvContent}
                  cvHeadline={cvHeadline} setCvHeadline={setCvHeadline}
                  cvLocation={cvLocation} setCvLocation={setCvLocation}
                  cvSkills={cvSkills} setCvSkills={setCvSkills}
                  cvExperience={cvExperience} setCvExperience={setCvExperience}
                  cvEducation={cvEducation} setCvEducation={setCvEducation}
                  contactEmail={contactEmail} setContactEmail={setContactEmail}
                  contactPhone={contactPhone} setContactPhone={setContactPhone}
                  contactPrice={contactPrice} setContactPrice={setContactPrice}
                />
              )}
            </div>

            {/* Vídeos / NFT — recolhido por padrão para foco em links + perfil */}
            <details className="bg-card border border-border rounded-xl p-6 space-y-4 group">
              <summary className="flex cursor-pointer select-none list-none items-center gap-2 text-sm font-bold text-foreground uppercase tracking-wider [&::-webkit-details-marker]:hidden">
                <Youtube className="w-4 h-4 text-destructive shrink-0" />
                Vídeos &amp; paywall
                <span className="text-[10px] font-normal normal-case text-muted-foreground">(opcional)</span>
              </summary>
              <div className="mt-4 space-y-4">
              <div className="bg-secondary/50 border border-border rounded-lg p-4 space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-muted-foreground uppercase">YouTube URL or ID</label>
                    <Input value={ytUrl} onChange={e => setYtUrl(e.target.value)} placeholder="https://youtube.com/watch?v=..." />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-muted-foreground uppercase">Title</label>
                    <Input value={videoTitle} onChange={e => setVideoTitle(e.target.value)} placeholder="Video title" />
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-muted-foreground uppercase flex items-center gap-1"><Upload className="w-3 h-3" /> Preview Clip (optional)</label>
                  <Input type="file" accept="video/*,.gif" onChange={e => setPreviewFile(e.target.files?.[0] || null)} className="text-xs" />
                  {previewFile && <p className="text-[10px] text-accent">{previewFile.name}</p>}
                </div>
                {/* Video Paywall (pay to watch, no NFT) */}
                <div className="flex items-center gap-3">
                  <Switch checked={paywallEnabled} onCheckedChange={c => { setPaywallEnabled(c); if (c) setNftEnabled(false); }} />
                  <span className="text-xs font-bold text-foreground flex items-center gap-1"><DollarSign className="w-3.5 h-3.5 text-accent" /> Video Paywall (pay to watch)</span>
                </div>
                {paywallEnabled && (
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-muted-foreground uppercase">Price (USDC)</label>
                    <Input type="number" value={paywallPrice} onChange={e => setPaywallPrice(e.target.value)} min="0.10" step="0.01" className="w-32" />
                    <p className="text-[10px] text-muted-foreground italic">Access lasts 12 hours. Min $0.10 embed / $0.60 bunny.net. 60% Creator / 40% Platform.</p>
                  </div>
                )}
                {/* NFT Paywall (ownership + limited views) */}
                <div className="flex items-center gap-3">
                  <Switch checked={nftEnabled} onCheckedChange={c => { setNftEnabled(c); if (c) setPaywallEnabled(false); }} />
                  <span className="text-xs font-bold text-foreground flex items-center gap-1"><Gem className="w-3.5 h-3.5 text-primary" /> NFT Paywall (ownership + limited views)</span>
                </div>
                {nftEnabled && (
                  <>
                    <div className="grid grid-cols-3 gap-3">
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-muted-foreground uppercase">Price (USDC)</label>
                        <Input type="number" value={nftPrice} onChange={e => setNftPrice(e.target.value)} min="0" step="0.01" />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-muted-foreground uppercase">View Tier</label>
                        <div className="flex gap-1">
                          {VIEW_TIERS.map(t => (
                            <button key={t.value} onClick={() => setNftMaxViews(String(t.value))}
                              className={`flex-1 px-2 py-1.5 rounded text-[10px] font-bold border transition-all ${nftMaxViews === String(t.value) ? "bg-primary text-primary-foreground border-primary" : "bg-secondary text-muted-foreground border-border hover:border-primary/50"}`}>
                              {t.label}
                            </button>
                          ))}
                        </div>
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-muted-foreground uppercase">Max Editions (∞ = blank)</label>
                        <Input type="number" value={nftMaxEditions} onChange={e => setNftMaxEditions(e.target.value)} min="1" />
                      </div>
                    </div>
                    <div className="flex items-center gap-3 pt-1">
                      <Switch checked={rechargeEnabled} onCheckedChange={setRechargeEnabled} />
                      <span className="text-xs font-bold text-foreground flex items-center gap-1"><RefreshCw className="w-3.5 h-3.5 text-accent" /> Allow Recharge</span>
                      {rechargeEnabled && (
                        <div className="flex items-center gap-1">
                          <label className="text-[10px] font-bold text-muted-foreground">Price:</label>
                          <Input type="number" value={rechargePrice} onChange={e => setRechargePrice(e.target.value)} min="0" step="0.01" className="w-24 h-7 text-xs" />
                          <span className="text-[10px] text-muted-foreground">USDC</span>
                        </div>
                      )}
                    </div>
                    {!rechargeEnabled && <p className="text-[10px] text-muted-foreground italic">Without recharge, NFT becomes collectible after views run out.</p>}
                  </>
                )}
                <button onClick={handleAddVideo} disabled={!ytUrl || !site?.id} className="flex items-center gap-1.5 px-4 py-2 bg-primary text-primary-foreground font-bold text-xs rounded-lg hover:bg-primary/90 disabled:opacity-50">
                  <Plus className="w-4 h-4" /> Add Video
                </button>
              </div>
              {(videos || []).length > 0 && (
                <div className="space-y-2">
                  {(videos || []).map((v: any) => (
                    <div key={v.id} className="flex items-center gap-3 bg-secondary/30 rounded-lg p-3 border border-border">
                      <img src={v.thumbnail_url || "/placeholder.svg"} alt="" className="w-20 h-12 rounded object-cover" />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold text-foreground truncate">{v.title}</p>
                        <div className="flex items-center gap-2 flex-wrap">
                          {v.nft_enabled && <span className="text-[10px] text-primary font-bold">NFT · ${v.nft_price} · {v.nft_max_views} view(s) · {v.nft_editions_sold || 0}{v.nft_max_editions ? `/${v.nft_max_editions}` : ""} sold</span>}
                          {(v as any).paywall_enabled && <span className="text-[10px] text-accent font-bold flex items-center gap-0.5"><DollarSign className="w-2.5 h-2.5" /> Paywall ${(v as any).paywall_price}</span>}
                          {v.recharge_enabled && <span className="text-[10px] text-accent font-bold flex items-center gap-0.5"><RefreshCw className="w-2.5 h-2.5" /> ${v.recharge_price}</span>}
                          {!v.nft_enabled && !(v as any).paywall_enabled && <span className="text-[10px] text-muted-foreground">Free</span>}
                          {(v as any).youtube_verified_at && (
                            <span className="text-[10px] text-primary font-bold flex items-center gap-0.5"><ShieldCheck className="w-2.5 h-2.5" /> YouTube OK</span>
                          )}
                        </div>
                        {(v as any).youtube_verification_code && (
                          <div className="mt-2 space-y-1 rounded-md border border-border bg-secondary/40 p-2">
                            <p className="text-[9px] text-muted-foreground leading-snug">
                              Coloque na <strong className="text-foreground">descrição ou links</strong> do vídeo no YouTube:{" "}
                              <code className="break-all text-[8px] bg-background px-1 py-0.5 rounded">
                                {previewOrigin ? `${previewOrigin}/verify/${(v as any).youtube_verification_code}` : `/verify/${(v as any).youtube_verification_code}`}
                              </code>{" "}
                              ou o texto <code className="text-[8px] bg-background px-1 rounded">hashpo-verify-{(v as any).youtube_verification_code}</code>
                            </p>
                            <div className="flex flex-wrap gap-1">
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                className="h-7 text-[10px]"
                                onClick={() => {
                                  const u = previewOrigin ? `${previewOrigin}/verify/${(v as any).youtube_verification_code}` : "";
                                  if (u) navigator.clipboard.writeText(u).then(() => toast.success("Link copiado")).catch(() => toast.error("Não foi possível copiar"));
                                }}
                              >
                                <Copy className="w-3 h-3 mr-1" /> Copiar link
                              </Button>
                              <Button
                                type="button"
                                variant="secondary"
                                size="sm"
                                className="h-7 text-[10px]"
                                onClick={async () => {
                                  try {
                                    const { data, error } = await supabase.functions.invoke("verify-mini-site-youtube", {
                                      body: { code: (v as any).youtube_verification_code },
                                    });
                                    if (error) throw error;
                                    if ((data as any)?.error) throw new Error((data as any).error);
                                    if ((data as any)?.verified) toast.success("Canal/descrição verificados!");
                                    else if ((data as any)?.already) toast.success("Já estava verificado.");
                                    else toast.message((data as any)?.hint || "Ainda não encontramos o texto na página do vídeo.");
                                    qc.invalidateQueries({ queryKey: ["site-videos", site?.id] });
                                  } catch (e: any) {
                                    toast.error(e?.message ?? "Falha na verificação");
                                  }
                                }}
                              >
                                Verificar agora
                              </Button>
                            </div>
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-1.5">
                        {/* Launch Collection Button */}
                        {v.nft_enabled && site?.id && !myCollections?.some((c: any) => c.video_id === v.id) && (
                          <button
                            onClick={() => {
                              if (!confirm(`Launch NFT Collection for "${v.title}"?\n\nFee: $300 (deducted from wallet)\nEditions: ${v.nft_max_editions || "1,000,000"}\nPrice: $${v.nft_price}/NFT\nSplit: 70% Creator / 30% Platform`)) return;
                              launchCollection.mutate({
                                video_id: v.id,
                                site_id: site.id,
                                title: v.title,
                                max_editions: v.nft_max_editions || 1000000,
                                price_per_nft: v.nft_price,
                                view_tier: v.nft_max_views,
                                recharge_enabled: v.recharge_enabled,
                                recharge_price: v.recharge_price,
                                thumbnail_url: v.thumbnail_url,
                              });
                            }}
                            disabled={launchCollection.isPending}
                            className="px-2 py-1.5 bg-primary/10 text-primary rounded text-[10px] font-bold hover:bg-primary/20 transition-colors flex items-center gap-1 whitespace-nowrap"
                            title="Launch NFT Collection ($300)"
                          >
                            🚀 Launch
                          </button>
                        )}
                        {myCollections?.some((c: any) => c.video_id === v.id) && (
                          <Link href="/marketplace" className="px-2 py-1.5 bg-accent/10 text-accent rounded text-[10px] font-bold flex items-center gap-1 whitespace-nowrap">
                            ✅ Live
                          </Link>
                        )}
                        <button onClick={() => deleteVideo.mutateAsync(v.id)} className="text-destructive hover:text-destructive/80"><Trash2 className="w-4 h-4" /></button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              {!site && <p className="text-xs text-muted-foreground italic">Save your site first, then add videos.</p>}
              </div>
            </details>

            {/* Links */}
            <div className="bg-card border border-border rounded-xl p-6 space-y-4">
              <h2 className="text-sm font-bold text-foreground uppercase tracking-wider flex items-center gap-2"><Link2 className="w-4 h-4 text-primary" /> Links & Social</h2>
              <SocialLinkPicker onAdd={(title, url, icon) => handleAddLink(title, url, icon)} disabled={!site?.id} />
              <div className="border-t border-border pt-3">
                <p className="text-[10px] font-bold text-muted-foreground uppercase mb-2">Custom Link</p>
                <div className="flex gap-2">
                  <Input value={linkTitle} onChange={e => setLinkTitle(e.target.value)} placeholder="Link title" className="flex-1" />
                  <Input value={linkUrl} onChange={e => setLinkUrl(e.target.value)} placeholder="https://..." className="flex-1" />
                  <button onClick={() => handleAddLink()} disabled={!linkTitle || !linkUrl || !site?.id} className="px-4 py-2 bg-primary text-primary-foreground font-bold text-xs rounded-lg hover:bg-primary/90 disabled:opacity-50"><Plus className="w-4 h-4" /></button>
                </div>
              </div>
              {(links || []).map((l: any) => {
                const social = SOCIAL_NETWORKS.find(s => s.id === l.icon);
                return (
                  <div key={l.id} className="flex items-center justify-between bg-secondary/30 rounded-lg px-4 py-2 border border-border">
                    <div className="flex items-center gap-2">
                      {social ? <span style={{ color: social.color }}>{social.icon}</span> : <Link2 className="w-4 h-4 text-muted-foreground" />}
                      <div><p className="text-xs font-bold text-foreground">{l.title}</p><p className="text-[10px] text-muted-foreground truncate">{l.url}</p></div>
                    </div>
                    <button onClick={() => deleteLink.mutateAsync(l.id)} className="text-destructive hover:text-destructive/80"><Trash2 className="w-3.5 h-3.5" /></button>
                  </div>
                );
              })}
            </div>

            <details className="rounded-xl border border-dashed border-border/80 bg-muted/15 p-3 space-y-3">
              <summary className="cursor-pointer select-none list-none text-sm font-bold text-foreground px-1 py-2 [&::-webkit-details-marker]:hidden">
                Imóveis, classificados e domínios <span className="text-xs font-normal text-muted-foreground">(opcional)</span>
              </summary>
              <div className="space-y-4 pt-2">
            {/* ── Profissão: Corretor de imóveis (separado de domínios) ── */}
            <div className="bg-card border border-border rounded-xl p-6 space-y-4">
              <div className="flex items-center gap-2 pb-2 border-b border-border">
                <div className="p-2 rounded-lg bg-emerald-500/10">
                  <Building className="w-5 h-5 text-emerald-600" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-primary uppercase tracking-wider">Corretor de imóveis</h2>
                  <p className="text-[10px] text-muted-foreground">Exiba seus imóveis no seu mini site. Seção separada de venda de domínios.</p>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-muted-foreground">Mostrar seção Imóveis no site</label>
                <Switch checked={showProperties} onCheckedChange={setShowProperties} />
              </div>
              {showProperties && (
                <p className="text-[10px] text-muted-foreground italic">
                  {(userProperties || []).length} imóvel(is) ativos serão exibidos. Adicione e gerencie abaixo.
                </p>
              )}
              {site?.id ? (
                <PropertyEditor
                  siteId={site.id}
                  extraSpaces={effectiveExtraProperty}
                  onRequestMoreSpaces={extraSpaceCheckoutLoading ? undefined : () => startExtraSpaceCheckout("property")}
                />
              ) : (
                <p className="text-xs text-muted-foreground italic">Salve seu mini-site primeiro para gerenciar imóveis.</p>
              )}
            </div>

            {/* ── Classificados (carros, motos, barcos) — fotos nos classificados, separado de imóveis ── */}
            <div className="bg-card border border-border rounded-xl p-6 space-y-4">
              <div className="flex items-center gap-2 pb-2 border-b border-border">
                <div className="p-2 rounded-lg bg-amber-500/10">
                  <Car className="w-5 h-5 text-amber-600" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-primary uppercase tracking-wider">Classificados</h2>
                  <p className="text-[10px] text-muted-foreground">Carros, motos, barcos etc. com fotos. 10 espaços grátis; depois preço mensal por anúncio (admin).</p>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-muted-foreground">Mostrar seção Classificados no site</label>
                <Switch checked={showClassifieds} onCheckedChange={setShowClassifieds} />
              </div>
              {showClassifieds && site?.id && (
                <ClassifiedEditor
                  siteId={site.id}
                  extraSpaces={effectiveExtraClassified}
                  extraSpacePriceUsd={Number((settings as any)?.classified_listing_monthly_usd ?? 2)}
                  onRequestMoreSpaces={extraSpaceCheckoutLoading ? undefined : () => startExtraSpaceCheckout("classified")}
                />
              )}
              {showClassifieds && !site?.id && <p className="text-xs text-muted-foreground italic">Salve seu mini-site primeiro para gerenciar classificados.</p>}
            </div>

            {/* ── Profissão: Venda de domínios (separado de imóveis) ── */}
            <div className="bg-card border border-border rounded-xl p-6 space-y-4">
              <div className="flex items-center gap-2 pb-2 border-b border-border">
                <div className="p-2 rounded-lg bg-sky-500/10">
                  <Globe className="w-5 h-5 text-sky-600" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-primary uppercase tracking-wider">Venda de domínios</h2>
                  <p className="text-[10px] text-muted-foreground">Exiba seus domínios à venda no mini site. Seção separada de imóveis.</p>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-muted-foreground">Mostrar seção Domínios à venda no site</label>
                <Switch checked={showDomains} onCheckedChange={setShowDomains} />
              </div>
              {showDomains && (
                <p className="text-[10px] text-muted-foreground italic">
                  {(userDomains || []).length} domínio(s) ativos serão exibidos. <a href="/domains" className="text-primary hover:underline">Gerenciar domínios →</a>
                </p>
              )}
            </div>
              </div>
            </details>

            {/* ── NEW: Slug Management ── */}
            <div className="bg-card border border-border rounded-xl p-6 space-y-4">
              <h2 className="text-sm font-bold text-primary uppercase tracking-wider flex items-center gap-2">
                <Tag className="w-4 h-4" /> Meus Slugs
              </h2>
              <div className="flex items-center justify-between rounded-lg border border-border bg-secondary/30 px-3 py-2">
                <label className="text-xs font-bold text-muted-foreground">Exibir slugs à venda no meu mini site</label>
                <Switch checked={showSlugsForSale} onCheckedChange={setShowSlugsForSale} />
              </div>
              <UserSlugManager />
            </div>

            {/* ZicoBank fusion controls */}
            <div className="bg-card border border-border rounded-xl p-6 space-y-4">
              <h2 className="text-sm font-bold text-primary uppercase tracking-wider flex items-center gap-2">
                <Store className="w-4 h-4" /> ZicoBank Pro no Editor
              </h2>
              <p className="text-[11px] text-muted-foreground">
                Painel para combinar blog, slugs, feed 7/365 dias, idiomas e login wallet no estilo HASHPO.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="rounded-lg border border-border bg-secondary/30 p-3 space-y-1">
                  <p className="text-[10px] uppercase font-bold text-muted-foreground">Blog integrado</p>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-foreground">Ativar bloco blog</span>
                    <Switch checked={blogEnabled} onCheckedChange={setBlogEnabled} />
                  </div>
                  <Link href="/blog" className="text-[10px] text-primary hover:underline">Abrir /blog</Link>
                </div>

                <div className="rounded-lg border border-border bg-secondary/30 p-3 space-y-1">
                  <p className="text-[10px] uppercase font-bold text-muted-foreground">Feed 7d + 365d</p>
                  <label className="text-xs font-semibold text-foreground block">Modo de feed</label>
                  <select
                    value={feedMode}
                    onChange={(e) => setFeedMode(e.target.value as "hybrid" | "7d" | "365d" | "dual")}
                    className="w-full h-9 px-2 text-xs bg-background border border-border rounded text-foreground"
                  >
                    <option value="hybrid">Híbrido (7d + fixado 365d)</option>
                    <option value="7d">Somente 7 dias</option>
                    <option value="365d">Somente 365 dias</option>
                    <option value="dual">Duas janelas (7d e 365d lado a lado)</option>
                  </select>
                  <p className="text-[10px] text-muted-foreground">No feed atual: post normal expira em 7 dias e fixado dura 365 dias.</p>
                </div>
              </div>

              <div className="rounded-lg border border-border bg-secondary/30 p-3 space-y-2">
                <p className="text-[10px] uppercase font-bold text-muted-foreground">Blog 3 paginas</p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                  {blogPages.map((page, idx) => (
                    <div key={`blog-page-${idx}`} className="space-y-1">
                      <input
                        value={page.title}
                        onChange={(e) => {
                          const next = [...blogPages];
                          next[idx] = { ...next[idx], title: e.target.value };
                          setBlogPages(next);
                        }}
                        placeholder={`Titulo ${idx + 1}`}
                        className="w-full h-8 px-2 text-xs bg-background border border-border rounded text-foreground"
                      />
                      <input
                        value={page.slug}
                        onChange={(e) => {
                          const next = [...blogPages];
                          const normalized = e.target.value
                            .toLowerCase()
                            .trim()
                            .replace(/[^a-z0-9-]/g, "-")
                            .replace(/-+/g, "-")
                            .replace(/^-|-$/g, "") || `pagina-${idx + 1}`;
                          next[idx] = { ...next[idx], slug: normalized };
                          setBlogPages(next);
                        }}
                        placeholder={`pagina-${idx + 1}`}
                        className="w-full h-8 px-2 text-xs bg-background border border-border rounded text-foreground font-mono"
                      />
                      <input
                        value={page.url}
                        onChange={(e) => {
                          const next = [...blogPages];
                          next[idx] = { ...next[idx], url: e.target.value };
                          setBlogPages(next);
                        }}
                        placeholder="URL da pagina"
                        className="w-full h-8 px-2 text-xs bg-background border border-border rounded text-foreground"
                      />
                      <input
                        value={page.summary}
                        onChange={(e) => {
                          const next = [...blogPages];
                          next[idx] = { ...next[idx], summary: e.target.value };
                          setBlogPages(next);
                        }}
                        placeholder="Resumo curto"
                        className="w-full h-8 px-2 text-xs bg-background border border-border rounded text-foreground"
                      />
                      <textarea
                        value={page.content}
                        onChange={(e) => {
                          const next = [...blogPages];
                          next[idx] = { ...next[idx], content: e.target.value };
                          setBlogPages(next);
                        }}
                        placeholder="Conteudo completo da pagina"
                        className="w-full min-h-[100px] px-2 py-1.5 text-xs bg-background border border-border rounded text-foreground resize-y"
                      />
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-lg border border-border bg-secondary/30 p-3 space-y-3">
                <p className="text-[10px] uppercase font-bold text-muted-foreground">SEO por pagina (Google/Card)</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  <input
                    value={seoTitle}
                    onChange={(e) => setSeoTitle(e.target.value)}
                    placeholder="Titulo SEO"
                    className="w-full h-8 px-2 text-xs bg-background border border-border rounded text-foreground"
                  />
                  <input
                    value={seoDescription}
                    onChange={(e) => setSeoDescription(e.target.value)}
                    placeholder="Descricao SEO"
                    className="w-full h-8 px-2 text-xs bg-background border border-border rounded text-foreground"
                  />
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <Input
                    type="file"
                    accept="image/*"
                    className="text-xs w-72"
                    disabled={uploadingSeoImage}
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (!f) return;
                      handleSeoImagePreview(f);
                      void handleSeoImageUpload(f);
                    }}
                  />
                  <p className="text-[10px] text-muted-foreground">Preview antes de indexar e compartilhar.</p>
                </div>
                <div className="rounded-xl border border-border bg-background overflow-hidden max-w-[520px]">
                  {(seoImagePreviewUrl || seoImageUrl) ? (
                    <img src={seoImagePreviewUrl || seoImageUrl} alt="SEO preview" className="w-full h-36 object-cover" />
                  ) : (
                    <div className="w-full h-36 bg-muted flex items-center justify-center text-[11px] text-muted-foreground">Imagem do card SEO</div>
                  )}
                  <div className="p-3">
                    <p className="text-sm font-bold text-foreground line-clamp-2">{seoTitle || siteName || "Titulo da pagina"}</p>
                    <p className="text-xs text-muted-foreground line-clamp-2 mt-1">
                      {seoDescription || bio || "Descricao que o Google e redes sociais podem exibir no card."}
                    </p>
                    <p className="text-[10px] text-primary mt-1 font-mono">https://hashpo.com/@{slug || "seuslug"}</p>
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <a
                    href={`https://cards-dev.twitter.com/validator?url=${encodeURIComponent(publicUrl || "https://hashpo.com")}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-[11px] font-bold bg-secondary text-foreground border border-border hover:bg-muted transition-colors"
                  >
                    Testar no X/Twitter
                  </a>
                  <a
                    href={`https://www.linkedin.com/post-inspector/inspect/${encodeURIComponent(publicUrl || "https://hashpo.com")}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-[11px] font-bold bg-secondary text-foreground border border-border hover:bg-muted transition-colors"
                  >
                    Testar no LinkedIn
                  </a>
                  <a
                    href={`https://developers.facebook.com/tools/debug/?q=${encodeURIComponent(publicUrl || "https://hashpo.com")}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-[11px] font-bold bg-secondary text-foreground border border-border hover:bg-muted transition-colors"
                  >
                    Testar no Facebook
                  </a>
                  <a
                    href={`https://cards-dev.twitter.com/validator?url=${encodeURIComponent(blogPreviewUrl || publicUrl || "https://hashpo.com")}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-[11px] font-bold bg-primary/10 text-primary border border-primary/30 hover:bg-primary/20 transition-colors"
                  >
                    Testar blog (página 1)
                  </a>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="rounded-lg border border-border bg-secondary/30 p-3 space-y-2">
                  <p className="text-[10px] uppercase font-bold text-muted-foreground">i18n com 12 idiomas</p>
                  <label className="text-xs font-semibold text-foreground block">Idioma base de conteúdo</label>
                  <select
                    value={contentLanguage}
                    onChange={(e) => setContentLanguage(e.target.value)}
                    className="w-full h-9 px-2 text-xs bg-background border border-border rounded text-foreground"
                  >
                    {CONTENT_LANGUAGES.map((lang) => (
                      <option key={lang.code} value={lang.code}>
                        {lang.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="rounded-lg border border-border bg-secondary/30 p-3 space-y-2">
                  <p className="text-[10px] uppercase font-bold text-muted-foreground">Wallet Login</p>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-foreground">Exibir opção wallet</span>
                    <Switch checked={walletLoginEnabled} onCheckedChange={setWalletLoginEnabled} />
                  </div>
                  {walletLoginEnabled ? <WalletButton /> : <p className="text-[10px] text-muted-foreground">Wallet login desativado neste editor.</p>}
                </div>
              </div>
            </div>

            {/* Address / Location */}
            <div className="bg-card border border-border rounded-xl p-6 space-y-4">
              <h2 className="text-sm font-bold text-primary uppercase tracking-wider flex items-center gap-2">
                <MapPin className="w-4 h-4" /> Endereço / Localização
              </h2>
              <Input value={address} onChange={e => setAddress(e.target.value)} placeholder="Cidade, Estado, País" />
            </div>

            {/* Photos Gallery */}
            <div className="bg-card border border-border rounded-xl p-6 space-y-4">
              <h2 className="text-sm font-bold text-primary uppercase tracking-wider flex items-center gap-2">
                <Image className="w-4 h-4" /> Galeria de Fotos
              </h2>
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-muted-foreground">Mostrar galeria no site</label>
                <Switch checked={showPhotos} onCheckedChange={setShowPhotos} />
              </div>
              {showPhotos && (
                <>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-muted-foreground uppercase flex items-center gap-1"><Upload className="w-3 h-3" /> Upload Foto</label>
                    <Input type="file" accept="image/*" disabled={uploadingPhoto || !site?.id} className="text-xs" onChange={async (e) => {
                      const f = e.target.files?.[0];
                      if (!f || !site?.id) return;
                      setUploadingPhoto(true);
                      try {
                        const ext = f.name.split(".").pop();
                        const path = `${user!.id}/photos/${Date.now()}.${ext}`;
                        const { error } = await supabase.storage.from("platform-assets").upload(path, f, { upsert: true });
                        if (error) throw error;
                        const { data } = supabase.storage.from("platform-assets").getPublicUrl(path);
                        await addPhoto.mutateAsync({ site_id: site.id, url: data.publicUrl });
                        toast.success("Foto adicionada!");
                      } catch (err: any) { toast.error(err.message); }
                      setUploadingPhoto(false);
                    }} />
                    {uploadingPhoto && <p className="text-[10px] text-accent animate-pulse">Uploading...</p>}
                  </div>
                  {(photos || []).length > 0 && (
                    <div className="grid grid-cols-3 gap-2">
                      {(photos || []).map((p: any) => (
                        <div key={p.id} className="relative group">
                          <img src={p.url} alt={p.caption || ""} className="w-full aspect-square object-cover rounded-lg border border-border" />
                          <button onClick={() => deletePhoto.mutateAsync(p.id)} className="absolute top-1 right-1 p-1 bg-destructive/80 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>

            <details className="rounded-xl border border-dashed border-border/80 bg-muted/15 p-3 space-y-3">
              <summary className="cursor-pointer select-none list-none text-sm font-bold text-foreground px-1 py-2 [&::-webkit-details-marker]:hidden">
                Paywall do site inteiro e assistente IA <span className="text-xs font-normal text-muted-foreground">(opcional)</span>
              </summary>
              <div className="space-y-4 pt-2">
            {/* Paywall inteiro: site fechado, só banner/nome/foto/endereço/bio livres */}
            <div className="bg-card border border-border rounded-xl p-6 space-y-4">
              <h2 className="text-sm font-bold text-primary uppercase tracking-wider flex items-center gap-2">
                <Lock className="w-4 h-4" /> Paywall inteiro
              </h2>
              <div className="flex items-center justify-between gap-4">
                <div className="flex-1">
                  <p className="text-xs font-bold text-foreground">Fechar o mini site: só banner, nome, foto, endereço e bio ficam livres</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">Quem quiser ver links, vídeos, CV, fotos etc. paga para desbloquear. Comissão 70% criador / 30% plataforma.</p>
                </div>
                <Switch checked={fullPaywall} onCheckedChange={setFullPaywall} />
              </div>
              {fullPaywall && (
                <div className="pt-2 border-t border-border">
                  <label className="text-[10px] font-bold text-muted-foreground uppercase block mb-1">Preço para desbloquear (USD)</label>
                  <Input type="number" min="0.5" step="0.01" value={fullPaywallPrice} onChange={e => setFullPaywallPrice(e.target.value)} className="max-w-[120px]" placeholder="9.99" />
                </div>
              )}
            </div>

            {/* Assistente IA (robô de chat) */}
            <div className="bg-card border border-border rounded-xl p-6 space-y-4">
              <h2 className="text-sm font-bold text-primary uppercase tracking-wider flex items-center gap-2">
                <MessageCircle className="w-4 h-4" /> Assistente IA
              </h2>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-foreground">Mostrar janela do robô (chat) no mini site</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">Quem usar paga: $5 = 1.000 interações ou $50 = 10.000. Cobrança na hora.</p>
                </div>
                <Switch checked={showAiChat} onCheckedChange={setShowAiChat} />
              </div>
              {/* Modo agenda: advogados, médicos, professores */}
              <div className="pt-4 border-t border-border space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-bold text-foreground">Modo agenda (advogados, médicos, professores)</p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">A IA pergunta o que a pessoa deseja, explica o que você oferece e o visitante pode solicitar agendamento. Comissão 10% em cobranças no site.</p>
                  </div>
                  <Switch checked={agendaEnabled} onCheckedChange={setAgendaEnabled} />
                </div>
                {agendaEnabled && (
                  <div>
                    <label className="text-[10px] font-bold text-muted-foreground uppercase block mb-1">Preço para confirmar agendamento (USD, 0 = grátis)</label>
                    <Input type="number" min="0" step="0.01" value={appointmentPrice} onChange={e => setAppointmentPrice(e.target.value)} className="max-w-[120px]" placeholder="0" />
                  </div>
                )}
              </div>
            </div>
              </div>
            </details>

            {/* ── Banner do Mini-Site (estilo X.com: foto ou cor) ── */}
            <div className="bg-card border border-border rounded-xl p-6 space-y-4">
              <h2 className="text-sm font-bold text-primary uppercase tracking-wider flex items-center gap-2">
                <Image className="w-4 h-4" /> Banner do Mini-Site
              </h2>
              <p className="text-[10px] text-muted-foreground">No topo do site, igual ao X (Twitter): use uma foto ou uma cor de fundo.</p>
              <div className="space-y-4">
                {/* Opção: Foto */}
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-muted-foreground uppercase flex items-center gap-1"><Upload className="w-3 h-3" /> Banner com foto</label>
                  <Input type="file" accept="image/*" disabled={!site?.id} className="text-xs"
                    onChange={async (e) => {
                      const f = e.target.files?.[0];
                      if (!f || !site?.id) return;
                      try {
                        const ext = f.name.split(".").pop();
                        const path = `${user!.id}/banner/${Date.now()}.${ext}`;
                        const { error } = await supabase.storage.from("platform-assets").upload(path, f, { upsert: true });
                        if (error) throw error;
                        const { data } = supabase.storage.from("platform-assets").getPublicUrl(path);
                        await upsertSite.mutateAsync({ banner_url: data.publicUrl, banner_color: null } as any);
                        toast.success("Banner atualizado!");
                      } catch (err: any) { toast.error(err.message); }
                      e.target.value = "";
                    }}
                  />
                  {(site as any)?.banner_url && (
                    <div className="relative rounded-xl overflow-hidden border border-border">
                      <img src={(site as any).banner_url} alt="Banner" className="w-full h-24 object-cover" />
                      <button
                        onClick={() => upsertSite.mutateAsync({ banner_url: null } as any)}
                        className="absolute top-2 right-2 p-1 bg-destructive/80 text-white rounded-full hover:bg-destructive"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  )}
                </div>
                {/* Opção: Cor */}
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-muted-foreground uppercase flex items-center gap-1"><Palette className="w-3 h-3" /> Banner com cor</label>
                  <div className="flex flex-wrap items-center gap-2">
                    {["#1d9bf0", "#7c3aed", "#059669", "#dc2626", "#ea580c", "#ca8a04", "#4f46e5", "#0d9488", "#be185d", "#1e293b"].map((hex) => (
                      <button
                        key={hex}
                        type="button"
                        className={`w-8 h-8 rounded-full border-2 transition-all ${(site as any)?.banner_color === hex && !(site as any)?.banner_url ? "border-primary ring-2 ring-primary/30" : "border-border hover:border-primary/50"}`}
                        style={{ backgroundColor: hex }}
                        onClick={() => upsertSite.mutateAsync({ banner_color: hex, banner_url: null } as any)}
                        title={hex}
                      />
                    ))}
                    <div className="flex items-center gap-1">
                      <input
                        type="color"
                        value={(site as any)?.banner_color && !(site as any)?.banner_url ? (site as any).banner_color : "#1d9bf0"}
                        onChange={(e) => upsertSite.mutateAsync({ banner_color: e.target.value, banner_url: null } as any)}
                        className="w-9 h-9 rounded border border-border cursor-pointer"
                      />
                      <span className="text-[10px] text-muted-foreground">Cor livre</span>
                    </div>
                    {(site as any)?.banner_color && !(site as any)?.banner_url && (
                      <button type="button" onClick={() => upsertSite.mutateAsync({ banner_color: null } as any)} className="text-[10px] text-muted-foreground hover:underline">Remover cor</button>
                    )}
                  </div>
                </div>
                {/* Link do banner (quando for foto) */}
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-muted-foreground">Link do Banner (opcional, só para foto)</label>
                  <Input
                    defaultValue={(site as any)?.banner_link || ""}
                    onBlur={e => upsertSite.mutateAsync({ banner_link: e.target.value || null } as any)}
                    placeholder="https://..."
                    className="text-xs"
                  />
                </div>
              </div>
            </div>

            {/* ── Diretório + Destaque ── */}
            <div className="bg-card border border-border rounded-xl p-6 space-y-4">
              <h2 className="text-sm font-bold text-primary uppercase tracking-wider flex items-center gap-2">
                <Globe className="w-4 h-4" /> Diretório HASHPO
              </h2>
              <p className="text-[10px] text-muted-foreground">
                Liste seu mini-site no diretório público para ser descoberto. Use destaque para mais visibilidade.
              </p>
              {site?.id && <DirectoryPanel siteId={site.id} accentColor={getThemeClasses(selectedTheme).accent} />}
              {!site?.id && <p className="text-xs text-muted-foreground italic">Salve seu mini-site primeiro.</p>}
            </div>

            {/* Google Auth — login com Google para confirmar conta e, no futuro, verificar canal YouTube */}
            <div className="bg-card border border-border rounded-xl p-6 space-y-3">
              <h2 className="text-sm font-bold text-foreground uppercase tracking-wider flex items-center gap-2"><ShieldCheck className="w-4 h-4 text-accent" /> Conta Google</h2>
              <p className="text-xs text-muted-foreground">Entre com Google para confirmar sua identidade. Vídeos com paywall devem ser adicionados apenas pelo Mini-Site (aqui).</p>
              {user ? (
                <div className="flex items-center gap-2 px-3 py-2 bg-primary/10 border border-primary/20 rounded-lg">
                  <span className="text-xs font-bold text-foreground">Conectado como {user.email ?? "usuário"}</span>
                  {user.app_metadata?.provider === "google" && (
                    <span className="text-[10px] bg-accent/20 text-accent font-bold px-1.5 py-0.5 rounded">Google</span>
                  )}
                </div>
              ) : (
                <button type="button" onClick={handleGoogleSignIn} className="flex items-center gap-2 px-4 py-2 bg-foreground text-background font-bold text-xs rounded-lg hover:opacity-90">
                  <svg className="w-4 h-4" viewBox="0 0 24 24"><path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"/><path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
                  Entrar com Google
                </button>
              )}
            </div>
          </div>

          {/* Right: Live Preview */}
          <div className="lg:col-span-2">
            <div className="sticky top-6 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-foreground">Preview</h3>
                <span className="text-[10px] bg-primary/10 text-primary font-bold px-2 py-0.5 rounded-full">
                  Tema: {currentTheme.label}
                </span>
              </div>
              <div className={`bg-gradient-to-br ${currentTheme.colors} rounded-2xl overflow-hidden border border-border/20 shadow-xl`}>
                {((site as any)?.banner_url || (site as any)?.banner_color) && (
                  <div className="w-full h-20 shrink-0">
                    {(site as any)?.banner_url ? (
                      <img src={(site as any).banner_url} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full" style={{ backgroundColor: (site as any)?.banner_color || "#1d9bf0" }} />
                    )}
                  </div>
                )}
                <div className="p-6 w-full max-w-[650px] h-[550px] overflow-y-auto">
                {/* Avatar + nome */}
                <div className="flex flex-col items-center text-center space-y-3 mb-6 -mt-8 relative z-10">
                  {avatarVideoUrl ? (
                    <video
                      src={avatarVideoUrl}
                      className="w-20 h-20 rounded-full object-cover border-2 border-white/40 shadow-lg"
                      autoPlay={avatarVideoMuted}
                      loop
                      muted={avatarVideoMuted}
                      controls={!avatarVideoMuted}
                      playsInline
                    />
                  ) : avatarUrl ? (
                    <img src={avatarUrl} alt="" className="w-20 h-20 rounded-full object-cover border-2 border-white/40 shadow-lg" />
                  ) : (
                    <div className="w-20 h-20 rounded-full flex items-center justify-center text-3xl font-black text-white/90 border-2 border-white/20 shadow-lg" style={{ backgroundColor: currentTheme.accent }}>
                      {siteName?.[0]?.toUpperCase() || "?"}
                    </div>
                  )}
                  <h4 className="text-lg font-black text-white drop-shadow-sm">{siteName || "Seu Nome"}</h4>
                  {bio && <p className="text-xs text-white/70 max-w-[220px] leading-relaxed">{bio}</p>}
                </div>

                {/* Links preview */}
                <div className="space-y-2 mb-4">
                  {(links || []).slice(0, 3).map((l: any) => (
                    <div key={l.id} className="flex items-center gap-2 px-3 py-2 bg-white/10 rounded-lg border border-white/10">
                      <Link2 className="w-3 h-3 text-white/50" />
                      <span className="text-xs text-white/80">{l.title}</span>
                    </div>
                  ))}
                  {(!links || links.length === 0) && ["Instagram", "Twitter", "YouTube"].map(name => (
                    <div key={name} className="flex items-center gap-2 px-3 py-2 bg-white/10 rounded-lg border border-white/10">
                      <Link2 className="w-3 h-3 text-white/30" />
                      <span className="text-xs text-white/40">{name}</span>
                    </div>
                  ))}
                </div>

                {/* Videos preview */}
                {(videos || []).length > 0 && (
                  <div className={`grid gap-2 ${layoutCols === 1 ? "grid-cols-1" : layoutCols === 4 ? "grid-cols-4" : layoutCols === 3 ? "grid-cols-3" : "grid-cols-2"}`}>
                    {(videos || []).slice(0, 4).map((v: any) => (
                      <div key={v.id} className="bg-white/10 rounded-lg overflow-hidden border border-white/10">
                        <img src={v.thumbnail_url || "/placeholder.svg"} alt="" className="w-full aspect-video object-cover" />
                        <div className="p-1.5">
                          <p className="text-[9px] text-white/80 font-bold truncate">{v.title}</p>
                          {v.nft_enabled && (
                            <span className="text-[8px] font-bold" style={{ color: currentTheme.accent }}>${v.nft_price}</span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* CV preview */}
                {showCv && (
                  <div className="mt-4 bg-white/5 rounded-lg p-3 border border-white/10">
                    <p className="text-[10px] text-white/50 font-bold mb-1">📄 CV / Resume</p>
                    <p className="text-[9px] text-white/40 line-clamp-2">{cvContent || "Your experience..."}</p>
                    {contactEmail && (
                      <div className="mt-2 flex items-center gap-1">
                        <Lock className="w-3 h-3 text-white/30" />
                        <span className="text-[9px] text-white/30">Contact locked · ${contactPrice} to unlock</span>
                      </div>
                    )}
                  </div>
                )}

                <p className="text-[8px] text-white/20 text-center mt-6">hashpo.com</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MiniSiteEditor;
