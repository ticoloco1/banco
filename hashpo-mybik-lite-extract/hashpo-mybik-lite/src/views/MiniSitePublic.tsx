"use client";

import { useParams, usePathname, useRouter, useSearchParams } from "next/navigation";
import { usePublicSite, useSiteLinks, useSiteVideos, useBuyNft } from "@/hooks/useMiniSite";
import { useAuth } from "@/hooks/useAuth";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { useProtectedVideo } from "@/hooks/useProtectedVideo";
import {
  ExternalLink, Play, Gem, Lock, ChevronDown, ChevronUp, Globe, Eye, Mail, Phone, RefreshCw, Rss, DollarSign,
  Image, MapPin, Building, Store, ChevronLeft, ChevronRight, Bed, SquareIcon, X, Bath, Car, Ruler, Maximize2, Tag
} from "lucide-react";
import { useSitePhotos, useUserDomains, useUserProperties } from "@/hooks/useMiniSiteExtras";
import { useSiteProperties } from "@/hooks/useProperties";
import { useSiteClassifieds } from "@/hooks/useClassifieds";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle
} from "@/components/ui/alert-dialog";
import NftFlipCard from "@/components/NftFlipCard";
import Feed from "@/components/FeedPost";
import { SOCIAL_NETWORKS } from "@/components/SocialLinkPicker";
import AiChatWidget from "@/components/AiChatWidget";
import SEO from "@/components/SEO";

// ─── Theme maps ───
const THEME_GRADIENTS: Record<string, string> = {
  cosmic: "from-purple-900 via-indigo-900 to-violet-800",
  ocean: "from-blue-900 via-cyan-900 to-teal-800",
  forest: "from-emerald-900 via-green-900 to-teal-900",
  sunset: "from-orange-900 via-amber-900 to-yellow-800",
  midnight: "from-slate-900 via-gray-900 to-zinc-900",
  rose: "from-rose-900 via-pink-900 to-fuchsia-900",
  mint: "from-teal-900 via-emerald-800 to-green-900",
  coral: "from-red-900 via-orange-800 to-amber-900",
  navy: "from-indigo-950 via-blue-900 to-slate-900",
};
const THEME_ACCENTS: Record<string, string> = {
  cosmic: "#a855f7", ocean: "#06b6d4", forest: "#10b981", sunset: "#f59e0b", midnight: "#64748b",
  rose: "#f43f5e", mint: "#14b8a6", coral: "#fb7185", navy: "#818cf8",
};
const BG_STYLE_CLASSES: Record<string, { bg: string; text: string; subtext: string; card: string; border: string; inputBg: string }> = {
  dark:             { bg: "",            text: "text-white",        subtext: "text-white/60",       card: "bg-white/10 border-white/10",      border: "border-white/10",     inputBg: "bg-white/10" },
  glass:            { bg: "",            text: "text-white",        subtext: "text-white/70",       card: "bg-white/10 backdrop-blur-xl border-white/20 shadow-xl shadow-black/10", border: "border-white/20", inputBg: "bg-white/15 backdrop-blur-md" },
  white:            { bg: "bg-white",    text: "text-gray-900",     subtext: "text-gray-500",        card: "bg-gray-50 border-gray-200",       border: "border-gray-200",     inputBg: "bg-gray-100" },
  beige:            { bg: "bg-amber-50", text: "text-amber-900",    subtext: "text-amber-700",       card: "bg-amber-100/50 border-amber-200", border: "border-amber-200",    inputBg: "bg-amber-100" },
  sand:             { bg: "bg-yellow-100", text: "text-yellow-900", subtext: "text-yellow-700",      card: "bg-yellow-50 border-yellow-200",   border: "border-yellow-200",   inputBg: "bg-yellow-50" },
  warm:             { bg: "bg-orange-50", text: "text-orange-900",  subtext: "text-orange-700",      card: "bg-orange-100/50 border-orange-200",border:"border-orange-200",   inputBg: "bg-orange-100" },
  yellow:           { bg: "bg-yellow-50", text: "text-yellow-900",  subtext: "text-yellow-700",      card: "bg-yellow-100/50 border-yellow-200",border:"border-yellow-200",   inputBg: "bg-yellow-100" },
  "pastel-blue":    { bg: "bg-sky-50",    text: "text-sky-900",     subtext: "text-sky-700",         card: "bg-sky-100/50 border-sky-200",     border: "border-sky-200",      inputBg: "bg-sky-100" },
  "pastel-pink":    { bg: "bg-pink-50",   text: "text-pink-900",    subtext: "text-pink-700",        card: "bg-pink-100/50 border-pink-200",   border: "border-pink-200",     inputBg: "bg-pink-100" },
  "pastel-lavender":{ bg: "bg-violet-50", text: "text-violet-900",  subtext: "text-violet-700",      card: "bg-violet-100/50 border-violet-200",border:"border-violet-200",   inputBg: "bg-violet-100" },
  "pastel-mint":    { bg: "bg-teal-50",   text: "text-teal-900",    subtext: "text-teal-700",        card: "bg-teal-100/50 border-teal-200",   border: "border-teal-200",     inputBg: "bg-teal-100" },
  "pastel-rose":    { bg: "bg-rose-50",   text: "text-rose-900",    subtext: "text-rose-700",        card: "bg-rose-100/50 border-rose-200",   border: "border-rose-200",     inputBg: "bg-rose-100" },
  "light-gray":     { bg: "bg-gray-100",  text: "text-gray-800",    subtext: "text-gray-500",        card: "bg-white border-gray-200",         border: "border-gray-200",     inputBg: "bg-white" },
  silver:           { bg: "bg-slate-200", text: "text-slate-800",   subtext: "text-slate-600",       card: "bg-slate-100 border-slate-300",    border: "border-slate-300",    inputBg: "bg-slate-100" },
  "brushed-steel":  { bg: "bg-zinc-300",  text: "text-zinc-900",    subtext: "text-zinc-700",        card: "bg-zinc-200 border-zinc-400",      border: "border-zinc-400",     inputBg: "bg-zinc-200" },
};
const FONT_SIZE_MAP: Record<string, { h1: string; body: string; small: string }> = {
  sm: { h1: "text-xl",   body: "text-xs",   small: "text-[9px]"  },
  md: { h1: "text-3xl",  body: "text-sm",   small: "text-[10px]" },
  lg: { h1: "text-4xl md:text-5xl", body: "text-base", small: "text-xs" },
};
const PHOTO_SIZE_MAP: Record<string, string> = {
  xs: "w-14 h-14 sm:w-16 sm:h-16",
  sm: "w-20 h-20 sm:w-24 sm:h-24",
  md: "w-24 h-24 sm:w-28 sm:h-28",
  lg: "w-32 h-32 sm:w-36 sm:h-36",
  xl: "w-40 h-40 sm:w-44 sm:h-44",
};
const PHOTO_TEXT_SIZE_MAP: Record<string, string> = {
  xs: "text-2xl",
  sm: "text-3xl",
  md: "text-4xl",
  lg: "text-5xl",
  xl: "text-6xl",
};
const THEME_AUTO_PHOTO_SIZE: Record<string, "sm" | "md" | "lg" | "xl"> = {
  cosmic: "lg",
  ocean: "md",
  forest: "md",
  sunset: "xl",
  midnight: "sm",
  rose: "lg",
  mint: "md",
  coral: "lg",
  navy: "md",
};
const THEME_AVATAR_GLOW: Record<string, string> = {
  cosmic: "rgba(168,85,247,0.55)",
  ocean: "rgba(6,182,212,0.5)",
  forest: "rgba(16,185,129,0.5)",
  sunset: "rgba(245,158,11,0.55)",
  midnight: "rgba(100,116,139,0.45)",
  rose: "rgba(244,63,94,0.5)",
  mint: "rgba(20,184,166,0.5)",
  coral: "rgba(251,113,133,0.5)",
  navy: "rgba(129,140,248,0.5)",
};

// ─── Property Carousel ───
const PropertyCarousel = ({ property, bs, fs, themeAccent, textColor, headingColor }: { property: any; bs: any; fs: any; themeAccent: string; textColor?: string; headingColor?: string }) => {
  const [idx, setIdx] = useState(0);
  const [lightbox, setLightbox] = useState(false);
  const [lbIdx, setLbIdx] = useState(0);
  useEffect(() => {
    if (!lightbox) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setLightbox(false); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [lightbox]);
  // Support both old image_urls and new property_photos
  const photos: any[] = property.property_photos?.length > 0
    ? property.property_photos
    : (property.image_urls || []).map((url: string) => ({ url }));
  const images = photos.map((p: any) => p.url || p);
  const prev = (e?: React.MouseEvent) => { e?.stopPropagation(); setIdx(i => (i - 1 + images.length) % images.length); };
  const next = (e?: React.MouseEvent) => { e?.stopPropagation(); setIdx(i => (i + 1) % images.length); };

  const txtStyle = textColor && textColor !== "auto" ? { color: textColor } : {};
  const hdStyle = headingColor && headingColor !== "auto" ? { color: headingColor } : {};

  return (
    <>
      {lightbox && images.length > 0 && (
        <div
          className="fixed inset-0 z-[100] bg-black/95 flex items-center justify-center"
          onClick={() => setLightbox(false)}
          role="dialog"
          aria-label="Galeria em tela cheia"
        >
          <button className="absolute top-4 right-4 text-white/70 p-2 rounded-full bg-white/10 hover:text-white hover:bg-white/20 transition-colors" onClick={() => setLightbox(false)} title="Fechar">✕</button>
          <button className="absolute left-4 top-1/2 -translate-y-1/2 p-3 bg-white/10 rounded-full text-white hover:bg-white/20 transition-colors" onClick={e => { e.stopPropagation(); setLbIdx(i => (i - 1 + images.length) % images.length); }} aria-label="Foto anterior">
            <ChevronLeft className="w-5 h-5" />
          </button>
          <img src={images[lbIdx]} alt={`${property.title} — foto ${lbIdx + 1}`} className="max-h-[85vh] max-w-[90vw] object-contain rounded-xl shadow-2xl" onClick={e => e.stopPropagation()} />
          <button className="absolute right-4 top-1/2 -translate-y-1/2 p-3 bg-white/10 rounded-full text-white hover:bg-white/20 transition-colors" onClick={e => { e.stopPropagation(); setLbIdx(i => (i + 1) % images.length); }} aria-label="Próxima foto">
            <ChevronRight className="w-5 h-5" />
          </button>
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/60 text-white text-sm px-3 py-1.5 rounded-full">{lbIdx + 1} / {images.length}</div>
        </div>
      )}

    <div className={`rounded-xl overflow-hidden border ${bs.card}`}>
      {/* Photo Carousel — 300×300 */}
      {images.length > 0 ? (
        <div className="relative bg-black/20" style={{ height: 300 }}>
          <img
            src={images[idx]}
            alt={property.title}
            className="w-full h-full object-cover cursor-pointer"
            onClick={() => { setLbIdx(idx); setLightbox(true); }}
          />
          <button onClick={() => { setLbIdx(idx); setLightbox(true); }}
            className="absolute top-2 right-2 bg-black/50 text-white rounded-lg p-1.5 hover:bg-black/70 transition-colors"
            title="Expandir (janela em tela cheia)">
            <Maximize2 className="w-4 h-4" />
          </button>
          {images.length > 1 && (
            <>
              <button onClick={prev} className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/50 text-white rounded-full p-1 hover:bg-black/70 transition-colors">
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button onClick={next} className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/50 text-white rounded-full p-1 hover:bg-black/70 transition-colors">
                <ChevronRight className="w-4 h-4" />
              </button>
              <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1">
                {images.map((_: any, i: number) => (
                  <button key={i} onClick={() => setIdx(i)} className={`w-1.5 h-1.5 rounded-full transition-all ${i === idx ? "bg-white scale-125" : "bg-white/50"}`} />
                ))}
              </div>
              <span className="absolute top-2 left-2 bg-black/60 text-white text-[10px] font-bold px-1.5 py-0.5 rounded">
                {idx + 1}/{images.length}
              </span>
            </>
          )}
        </div>
      ) : (
        <div className="bg-black/10 flex items-center justify-center" style={{ height: 300 }}>
          <Building className={`w-10 h-10 ${bs.subtext} opacity-30`} />
        </div>
      )}
      <div className="p-4 space-y-2">
        <p className={`${fs.body} font-bold ${bs.text}`} style={hdStyle}>{property.title}</p>
        {(property.city || property.state) && (
          <p className={`${fs.small} ${bs.subtext} flex items-center gap-1`} style={txtStyle}>
            <MapPin className="w-3 h-3" />{property.city}{property.state ? `, ${property.state}` : ""}
          </p>
        )}
        {property.address && <p className={`${fs.small} ${bs.subtext}`} style={txtStyle}>{property.address}</p>}
        <div className="flex items-center gap-3 flex-wrap">
          {property.bedrooms != null && property.bedrooms > 0 && <span className={`${fs.small} ${bs.subtext} flex items-center gap-1`} style={txtStyle}><Bed className="w-3 h-3" />{property.bedrooms}</span>}
          {property.bathrooms != null && property.bathrooms > 0 && <span className={`${fs.small} ${bs.subtext} flex items-center gap-1`} style={txtStyle}><Bath className="w-3 h-3" />{property.bathrooms}</span>}
          {property.garage != null && property.garage > 0 && <span className={`${fs.small} ${bs.subtext} flex items-center gap-1`} style={txtStyle}><Car className="w-3 h-3" />{property.garage}</span>}
          {(property.area_m2 || property.area_sqm) && <span className={`${fs.small} ${bs.subtext} flex items-center gap-1`} style={txtStyle}><Ruler className="w-3 h-3" />{property.area_m2 || property.area_sqm}m²</span>}
        </div>
        {property.description && <p className={`${fs.small} ${bs.subtext} line-clamp-2`} style={txtStyle}>{property.description}</p>}
        <div className="flex items-center justify-between pt-1">
          <span className="text-sm font-bold" style={{ color: themeAccent }}>
            {property.price ? `R$ ${Number(property.price).toLocaleString("pt-BR")}` : "Consultar"}
          </span>
          {property.contact_link && (
            <a href={property.contact_link} target="_blank" rel="noopener noreferrer"
              className="text-[10px] font-bold px-3 py-1 rounded-lg text-white hover:opacity-90 transition-opacity"
              style={{ backgroundColor: themeAccent }}>
              Contato
            </a>
          )}

        </div>
      </div>
    </div>
    </>
  );
};

const CLASSIFIED_CATEGORY_LABELS: Record<string, string> = { carros: "Carros", motos: "Motos", barcos: "Barcos", outros: "Outros" };

// Classificados (carros, motos, barcos): carrossel de fotos por item — seção separada de Imóveis
const ClassifiedCarousel = ({ item, bs, fs, themeAccent, textColor, headingColor }: { item: any; bs: any; fs: any; themeAccent: string; textColor?: string; headingColor?: string }) => {
  const [idx, setIdx] = useState(0);
  const [lightbox, setLightbox] = useState(false);
  const [lbIdx, setLbIdx] = useState(0);
  const images: string[] = Array.isArray(item?.image_urls) ? item.image_urls : [];
  useEffect(() => {
    if (!lightbox) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setLightbox(false); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [lightbox]);
  const prev = (e?: React.MouseEvent) => { e?.stopPropagation(); setIdx(i => (i - 1 + images.length) % images.length); };
  const next = (e?: React.MouseEvent) => { e?.stopPropagation(); setIdx(i => (i + 1) % images.length); };
  const txtStyle = textColor && textColor !== "auto" ? { color: textColor } : {};
  const hdStyle = headingColor && headingColor !== "auto" ? { color: headingColor } : {};
  const categoryLabel = CLASSIFIED_CATEGORY_LABELS[item?.category] || item?.category || "Outros";

  return (
    <>
      {lightbox && images.length > 0 && (
        <div className="fixed inset-0 z-[100] bg-black/95 flex items-center justify-center" onClick={() => setLightbox(false)} role="dialog" aria-label="Galeria em tela cheia">
          <button className="absolute top-4 right-4 text-white/70 p-2 rounded-full bg-white/10 hover:bg-white/20" onClick={() => setLightbox(false)}>✕</button>
          <button className="absolute left-4 top-1/2 -translate-y-1/2 p-3 bg-white/10 rounded-full text-white hover:bg-white/20" onClick={e => { e.stopPropagation(); setLbIdx(i => (i - 1 + images.length) % images.length); }}><ChevronLeft className="w-5 h-5" /></button>
          <img src={images[lbIdx]} alt={`${item.title} — foto ${lbIdx + 1}`} className="max-h-[85vh] max-w-[90vw] object-contain rounded-xl shadow-2xl" onClick={e => e.stopPropagation()} />
          <button className="absolute right-4 top-1/2 -translate-y-1/2 p-3 bg-white/10 rounded-full text-white hover:bg-white/20" onClick={e => { e.stopPropagation(); setLbIdx(i => (i + 1) % images.length); }}><ChevronRight className="w-5 h-5" /></button>
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/60 text-white text-sm px-3 py-1.5 rounded-full">{lbIdx + 1} / {images.length}</div>
        </div>
      )}
      <div className={`rounded-xl overflow-hidden border ${bs.card}`}>
        {images.length > 0 ? (
          <div className="relative bg-black/20" style={{ height: 300 }}>
            <img src={images[idx]} alt={item.title} className="w-full h-full object-cover cursor-pointer" onClick={() => { setLbIdx(idx); setLightbox(true); }} />
            <button onClick={() => { setLbIdx(idx); setLightbox(true); }} className="absolute top-2 right-2 bg-black/50 text-white rounded-lg p-1.5 hover:bg-black/70" title="Expandir"><Maximize2 className="w-4 h-4" /></button>
            {images.length > 1 && (
              <>
                <button onClick={prev} className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/50 text-white rounded-full p-1 hover:bg-black/70"><ChevronLeft className="w-4 h-4" /></button>
                <button onClick={next} className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/50 text-white rounded-full p-1 hover:bg-black/70"><ChevronRight className="w-4 h-4" /></button>
                <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1">
                  {images.map((_, i) => (
                    <button key={i} onClick={() => setIdx(i)} className={`w-1.5 h-1.5 rounded-full transition-all ${i === idx ? "bg-white scale-125" : "bg-white/50"}`} />
                  ))}
                </div>
                <span className="absolute top-2 left-2 bg-black/60 text-white text-[10px] font-bold px-1.5 py-0.5 rounded">{idx + 1}/{images.length}</span>
              </>
            )}
          </div>
        ) : (
          <div className="bg-black/10 flex items-center justify-center" style={{ height: 300 }}>
            <Car className={`w-10 h-10 ${bs.subtext} opacity-30`} />
          </div>
        )}
        <div className="p-4 space-y-2">
          <p className={`${fs.body} font-bold ${bs.text}`} style={hdStyle}>{item.title}</p>
          <p className={`${fs.small} ${bs.subtext}`} style={txtStyle}>{categoryLabel}</p>
          {item.description && <p className={`${fs.small} ${bs.subtext} line-clamp-2`} style={txtStyle}>{item.description}</p>}
          <p className="text-sm font-bold" style={{ color: themeAccent }}>{item.price ? `R$ ${Number(item.price).toLocaleString("pt-BR")}` : "Consultar"}</p>
        </div>
      </div>
    </>
  );
};

const MiniSitePublic = () => {
  const params = useParams();
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const rawSlug = (params?.slug as string) ?? "";
  const slug = rawSlug.startsWith("@") ? rawSlug.slice(1) : rawSlug;

  // Unificar: /s/slug redireciona para /@slug (só usamos formato /@)
  if (slug && pathname?.startsWith("/s/")) {
    router.replace(`/@${slug}`);
    return null;
  }

  const { data: site, isLoading } = usePublicSite(slug);
  const { data: links } = useSiteLinks(site?.id);
  const { data: videos } = useSiteVideos(site?.id);
  const { user } = useAuth();
  const buyNft = useBuyNft();
  const qc = useQueryClient();
  const { data: photos } = useSitePhotos(site?.id);
  const siteUserId = site?.user_id;
  const showDomains = (site as any)?.show_domains;
  const showProperties = (site as any)?.show_properties;
  const showClassifieds = (site as any)?.show_classifieds;
  const showSlugsForSale = (site as any)?.show_slugs_for_sale;
  const showPhotos = (site as any)?.show_photos;
  const { data: domains } = useUserDomains(showDomains ? siteUserId : undefined);
  const { data: properties } = useSiteProperties(showProperties ? site?.id : undefined);
  const { data: classifieds } = useSiteClassifieds(showClassifieds ? site?.id : undefined);
  const { data: slugListings } = useQuery({
    queryKey: ["site-slug-listings", site?.id],
    queryFn: async () => {
      const { data } = await supabase.from("slug_listings").select("id, slug, price").eq("site_id", site!.id).eq("status", "active");
      return data || [];
    },
    enabled: !!showSlugsForSale && !!site?.id,
  });
  const { fetchProtectedVideo, loading: loadingProtected, clearCache: clearVideoCache } = useProtectedVideo();

  const [cvOpen, setCvOpen] = useState(false);
  const [buyConfirm, setBuyConfirm] = useState<any>(null);
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [protectedIds, setProtectedIds] = useState<Map<string, string>>(new Map());
  const [unlockConfirm, setUnlockConfirm] = useState(false);
  const [siteUnlockConfirm, setSiteUnlockConfirm] = useState(false);
  const [paywallConfirm, setPaywallConfirm] = useState<any>(null);
  const [lightboxPhoto, setLightboxPhoto] = useState<string | null>(null);

  const { data: profile } = useQuery({
    queryKey: ["site-profile", site?.user_id],
    queryFn: async () => {
      const { data } = await supabase.from("profiles").select("*").eq("user_id", site!.user_id).single();
      return data;
    },
    enabled: !!site,
  });

  const { data: contactUnlocked } = useQuery({
    queryKey: ["cv-unlock", user?.id, site?.id],
    queryFn: async () => {
      const { data } = await supabase.from("cv_unlocks").select("id").eq("buyer_id", user!.id).eq("site_id", site!.id).limit(1);
      return (data || []).length > 0;
    },
    enabled: !!user && !!site,
  });

  const { data: siteUnlocked } = useQuery({
    queryKey: ["site-unlock", user?.id, site?.id],
    queryFn: async () => {
      const { data } = await supabase.from("site_unlocks").select("id").eq("buyer_id", user!.id).eq("site_id", site!.id).limit(1);
      return (data || []).length > 0;
    },
    enabled: !!user && !!site,
  });

  const { data: myPurchases } = useQuery({
    queryKey: ["my-nft-access", user?.id, site?.id],
    queryFn: async () => {
      const { data } = await supabase.from("nft_purchases").select("id, video_id, buyer_id, views_allowed, views_used").eq("buyer_id", user!.id);
      return data || [];
    },
    enabled: !!user && !!site,
  });

  const { data: myPaywallUnlocks } = useQuery({
    queryKey: ["my-paywall-unlocks", user?.id, site?.id],
    queryFn: async () => {
      const { data } = await supabase.from("video_paywall_unlocks" as any).select("video_id, expires_at").eq("user_id", user!.id);
      return ((data as any[]) || []).filter((d: any) => !d.expires_at || new Date(d.expires_at) > new Date()).map((d: any) => d.video_id as string);
    },
    enabled: !!user && !!site,
  });

  const unlockContact = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("cv_unlocks").insert({
        buyer_id: user!.id, creator_id: site!.user_id, site_id: site!.id,
        amount_paid: (site as any).contact_price || 20,
        creator_share: ((site as any).contact_price || 20) / 2,
        platform_share: ((site as any).contact_price || 20) / 2,
      });
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["cv-unlock"] }); toast.success("Contact unlocked!"); setUnlockConfirm(false); },
  });

  useEffect(() => {
    const ok = searchParams.get("site_unlock_success");
    const sid = searchParams.get("session_id");
    if (!ok || !sid || !user || !site) return;
    (async () => {
      try {
        const { data, error } = await supabase.functions.invoke("apply-site-unlock-after-payment", { body: { session_id: sid } });
        if (error) throw error;
        if (data?.error) throw new Error(data.error);
        qc.invalidateQueries({ queryKey: ["site-unlock"] });
        toast.success("Site desbloqueado! Acesso liberado.");
        router.replace(pathname?.startsWith("/@") ? pathname.split("?")[0] : `/@${site.slug}`);
      } catch (e: any) {
        toast.error(e?.message ?? "Erro ao confirmar desbloqueio.");
      }
    })();
  }, [searchParams, user, site, qc, router, pathname]);

  useEffect(() => {
    const ok = searchParams.get("video_paywall_success");
    const sid = searchParams.get("session_id");
    const vid = searchParams.get("video_id");
    if (!ok || !sid || !user) return;
    (async () => {
      try {
        const { data, error } = await supabase.functions.invoke("apply-video-paywall-after-payment", {
          body: { session_id: sid },
        });
        if (error) throw error;
        if (data?.error) throw new Error(data.error);
        qc.invalidateQueries({ queryKey: ["my-paywall-unlocks"] });
        if (vid) clearVideoCache(vid);
        toast.success("Pagamento confirmado! Acesso ao vídeo liberado.");
        router.replace(pathname?.split("?")[0] || (site ? `/@${site.slug}` : "/"));
      } catch (e: any) {
        toast.error(e?.message ?? "Erro ao confirmar pagamento do vídeo.");
      }
    })();
  }, [searchParams, user, qc, router, pathname, site, clearVideoCache]);

  if (isLoading) return <div className="min-h-screen bg-background flex items-center justify-center text-muted-foreground text-sm">Loading...</div>;
  if (!site) return <div className="min-h-screen bg-background flex items-center justify-center text-muted-foreground text-sm">Site not found</div>;
  if ((site as any).blocked) return <div className="min-h-screen bg-background flex items-center justify-center text-destructive text-sm font-bold">Este site foi bloqueado pela administração.</div>;

  const fullPaywall = !!(site as any)?.full_paywall;
  const fullPaywallPrice = Number((site as any)?.full_paywall_price) || 0;
  const contentUnlocked = !fullPaywall || !!siteUnlocked;

  const hasNftAccess = (videoId: string) => myPurchases?.some((p: any) => p.video_id === videoId && p.views_used < p.views_allowed);
  const hasPaywallAccess = (videoId: string) => myPaywallUnlocks?.includes(videoId);

  const handleBuy = async () => {
    if (!buyConfirm) return;
    try { await buyNft.mutateAsync(buyConfirm); toast.success("NFT purchased!"); setBuyConfirm(null); }
    catch (e: any) { toast.error(e.message); }
  };

  const handlePaywallBuy = async () => {
    if (!paywallConfirm || !user || !site) return;
    const price = Number((paywallConfirm as any).paywall_price) || 0.15;
    const amount_cents = Math.max(10, Math.round(price * 100));
    try {
      const slugPath = `/@${site.slug}`;
      const { data, error } = await supabase.functions.invoke("create-checkout", {
        body: {
          amount_cents,
          product_name: `HASHPO — vídeo: ${String(paywallConfirm.title || "conteúdo").slice(0, 72)}`,
          success_path: `${slugPath}?video_paywall_success=1&video_id=${paywallConfirm.id}&session_id={CHECKOUT_SESSION_ID}`,
          cancel_path: slugPath,
          metadata: {
            unlock_type: "mini_site_video_paywall",
            video_id: paywallConfirm.id,
            payment_rail: "stripe",
            crypto_ready: "0",
          },
        },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      if (data?.url) {
        setPaywallConfirm(null);
        window.location.href = data.url;
        return;
      }
      throw new Error("Resposta inválida do checkout");
    } catch (e: any) {
      toast.error(e?.message ?? "Erro ao abrir pagamento.");
    }
  };

  const handlePlay = async (video: any) => {
    if (!user) { toast.error("Please sign in first"); return; }
    if (!video.nft_enabled && !(video as any).paywall_enabled) {
      const result = await fetchProtectedVideo(video.id);
      if (result.access && result.youtube_video_id) { setProtectedIds(prev => new Map(prev).set(video.id, result.youtube_video_id!)); setPlayingId(video.id); }
      else toast.error(result.reason || "Cannot play this video");
      return;
    }
    if ((video as any).paywall_enabled) {
      if (hasPaywallAccess(video.id)) {
        const result = await fetchProtectedVideo(video.id);
        if (result.access && result.youtube_video_id) { setProtectedIds(prev => new Map(prev).set(video.id, result.youtube_video_id!)); setPlayingId(video.id); }
        else toast.error(result.reason || "Access denied");
        return;
      }
      setPaywallConfirm(video); return;
    }
    if (video.nft_enabled) {
      if (hasNftAccess(video.id)) {
        const purchase = myPurchases?.find((p: any) => p.video_id === video.id && p.views_used < p.views_allowed);
        if (purchase) await supabase.from("nft_purchases").update({ views_used: purchase.views_used + 1 }).eq("id", purchase.id);
        const result = await fetchProtectedVideo(video.id);
        if (result.access && result.youtube_video_id) { setProtectedIds(prev => new Map(prev).set(video.id, result.youtube_video_id!)); setPlayingId(video.id); }
        else toast.error(result.reason || "Access denied");
      } else { setBuyConfirm(video); }
    }
  };

  const themeGrad = THEME_GRADIENTS[site.theme] || THEME_GRADIENTS.cosmic;
  const themeAccent = THEME_ACCENTS[site.theme] || THEME_ACCENTS.cosmic;
  const colClass =
    site.layout_columns === 1
      ? "grid-cols-1"
      : site.layout_columns === 4
        ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
        : site.layout_columns === 3
          ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"
          : "grid-cols-1 sm:grid-cols-2";
  const initial = profile?.display_name?.[0]?.toUpperCase() || site.site_name?.[0]?.toUpperCase() || "H";
  const siteAny = site as any;
  const advancedConfig = (() => {
    try {
      return JSON.parse((siteAny.custom_css as string) || "{}") as {
        contentLanguage?: string;
        blogEnabled?: boolean;
        feedMode?: "hybrid" | "7d" | "365d" | "dual";
        walletLoginEnabled?: boolean;
        avatarVideoUrl?: string;
        avatarVideoMuted?: boolean;
        blogPages?: Array<{ title?: string; url?: string; summary?: string; content?: string; slug?: string }>;
      };
    } catch {
      return {};
    }
  })();
  const avatarVideoUrl = siteAny.avatar_video_url || advancedConfig.avatarVideoUrl || "";
  const avatarVideoMuted = (siteAny.avatar_video_muted ?? advancedConfig.avatarVideoMuted) !== false;
  const feedMode = siteAny.feed_mode || advancedConfig.feedMode || "hybrid";
  const blogPages = ((siteAny.blog_pages as any[]) || advancedConfig.blogPages || []).filter((p) => (p?.title || p?.url || p?.content));
  const blogEnabled = (siteAny.blog_enabled ?? advancedConfig.blogEnabled) !== false;
  const bgStyleId = siteAny.bg_style || "dark";
  const isDark = bgStyleId === "dark" || bgStyleId === "glass";
  const bs = BG_STYLE_CLASSES[bgStyleId] || BG_STYLE_CLASSES.dark;
  const fs = FONT_SIZE_MAP[siteAny.font_size || "md"] || FONT_SIZE_MAP.md;
  const pShape = siteAny.photo_shape || "round";
  const effectivePhotoSize = siteAny.photo_size === "auto"
    ? (THEME_AUTO_PHOTO_SIZE[site.theme || "cosmic"] || "md")
    : (siteAny.photo_size || "md");
  const avatarGlow = THEME_AVATAR_GLOW[site.theme || "cosmic"] || "rgba(168,85,247,0.45)";
  const photoSizeCls = PHOTO_SIZE_MAP[effectivePhotoSize] || PHOTO_SIZE_MAP.md;
  const photoInitialSizeCls = PHOTO_TEXT_SIZE_MAP[effectivePhotoSize] || PHOTO_TEXT_SIZE_MAP.md;
  const photoRound = pShape === "round" ? "rounded-full" : "rounded-xl";

  // ── Custom text colors ──
  const customTextColor = siteAny.text_color && siteAny.text_color !== "auto" ? siteAny.text_color : undefined;
  const customHeadingColor = siteAny.heading_color && siteAny.heading_color !== "auto" ? siteAny.heading_color : undefined;
  const customLinkColor = siteAny.link_color && siteAny.link_color !== "auto" ? siteAny.link_color : undefined;
  const customBtnText = siteAny.button_text_color && siteAny.button_text_color !== "auto" ? siteAny.button_text_color : undefined;
  const customBtnBg = siteAny.button_bg_color && siteAny.button_bg_color !== "auto" ? siteAny.button_bg_color : undefined;

  const seoTitle = (site.site_name || "Mini Site").trim() || "Mini Site";
  const seoDesc = (siteAny.bio || (profile as any)?.bio || "Mini site profissional no HASHPO — links, vídeos, CV e portfólio.").slice(0, 160);
  const seoCanonical = `https://hashpo.com/@${slug}`;
  const seoImage = siteAny.avatar_url || siteAny.banner_url || undefined;

  return (
    <div className={`min-h-screen ${isDark ? `bg-gradient-to-b ${themeGrad}` : bs.bg}`}>
      <SEO title={seoTitle} description={seoDesc} canonical={seoCanonical} ogImage={seoImage} />

      {/* ─── Lightbox ─── */}
      {lightboxPhoto && (
        <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4" onClick={() => setLightboxPhoto(null)}>
          <button className="absolute top-4 right-4 text-white/70 hover:text-white"><X className="w-6 h-6" /></button>
          <img src={lightboxPhoto} alt="" className="max-w-full max-h-full object-contain rounded-lg" onClick={e => e.stopPropagation()} />
        </div>
      )}

      {/* ─── Dialogs ─── */}
      <AlertDialog open={!!buyConfirm} onOpenChange={o => !o && setBuyConfirm(null)}>
        <AlertDialogContent className="max-w-sm">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2"><Gem className="w-5 h-5 text-primary" /> Purchase Video NFT</AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-2 text-sm">
                <p><strong>{buyConfirm?.title}</strong></p>
                <p>Price: <span className="font-mono font-bold text-primary">${buyConfirm?.nft_price}</span></p>
                <p>You'll get <strong>{buyConfirm?.nft_max_views} view(s)</strong>.</p>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleBuy} className="bg-primary text-primary-foreground">Buy for ${buyConfirm?.nft_price}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={!!paywallConfirm} onOpenChange={o => !o && setPaywallConfirm(null)}>
        <AlertDialogContent className="max-w-sm">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2"><DollarSign className="w-5 h-5 text-accent" /> Unlock Video</AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-2 text-sm">
                <p><strong>{paywallConfirm?.title}</strong></p>
                <p>Price: <span className="font-mono font-bold text-accent">${(paywallConfirm as any)?.paywall_price || 0.15} USDC</span></p>
                <p>Pay once for <strong>12 hours</strong> of access.</p>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
            <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handlePaywallBuy} className="bg-accent text-accent-foreground">Pagar ${(paywallConfirm as any)?.paywall_price || 0.15} (Stripe)</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={unlockConfirm} onOpenChange={setUnlockConfirm}>
        <AlertDialogContent className="max-w-sm">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2"><Lock className="w-5 h-5 text-primary" /> Unlock Contact Info</AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-2 text-sm">
                <p>Unlock this creator's email and phone for <strong>${siteAny.contact_price || 20} USDC</strong>.</p>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => unlockContact.mutate()} className="bg-primary text-primary-foreground">Unlock for ${siteAny.contact_price || 20}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={siteUnlockConfirm} onOpenChange={setSiteUnlockConfirm}>
        <AlertDialogContent className="max-w-sm">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2"><Lock className="w-5 h-5 text-primary" /> Desbloquear site inteiro</AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-2 text-sm">
                <p>Você terá acesso a todo o conteúdo (links, vídeos, CV, fotos, etc.). Comissão 70% criador / 30% plataforma.</p>
                <p>Valor: <strong>${fullPaywallPrice} USD</strong></p>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={async () => {
              if (fullPaywallPrice < 0.5) { toast.error("Preço mínimo não configurado."); return; }
              try {
                const { data, error } = await supabase.functions.invoke("create-checkout", {
                  body: {
                    amount_cents: Math.round(fullPaywallPrice * 100),
                    product_name: "Desbloquear site inteiro",
                    success_path: `/@${site.slug}?site_unlock_success=1&session_id={CHECKOUT_SESSION_ID}`,
                    cancel_path: `/@${site.slug}`,
                    metadata: { site_id: site.id, payment_rail: "stripe", crypto_ready: "0" },
                  },
                });
                if (error) throw error;
                if (data?.error) throw new Error(data.error);
                if (data?.url) { setSiteUnlockConfirm(false); window.location.href = data.url; }
                else throw new Error("Resposta inválida");
              } catch (e: any) { toast.error(e?.message ?? "Erro ao abrir pagamento."); }
            }} className="bg-primary text-primary-foreground">Pagar ${fullPaywallPrice}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* ─── Banner (estilo X.com: foto ou cor) ─── */}
      {((site as any).banner_url || (site as any).banner_color) && (
        <div className="w-full relative" style={{ minHeight: 200 }}>
          {(site as any).banner_url ? (
            (site as any).banner_link ? (
              <a href={(site as any).banner_link} target="_blank" rel="noopener noreferrer" className="block w-full h-full min-h-[200px] max-h-[33vh] sm:max-h-[280px]">
                <img src={(site as any).banner_url} alt="Banner" className="w-full h-full min-h-[200px] max-h-[33vh] sm:max-h-[280px] object-cover" />
              </a>
            ) : (
              <img src={(site as any).banner_url} alt="Banner" className="w-full min-h-[200px] max-h-[33vh] sm:max-h-[280px] object-cover" />
            )
          ) : (
            <div
              className="w-full min-h-[200px] max-h-[33vh] sm:max-h-[280px]"
              style={{ backgroundColor: (site as any).banner_color || "#1d9bf0" }}
            />
          )}
        </div>
      )}

      {/* ─── Header / Profile ─── */}
      <div className={`max-w-3xl mx-auto px-6 text-center space-y-4 ${((site as any).banner_url || (site as any).banner_color) ? "pt-4 pb-8 -mt-16 relative z-10" : "pt-12 pb-8"}`}>
        <div className="mx-auto w-fit group">
          <div
            className={`p-[3px] ${photoRound} bg-gradient-to-br transition-transform duration-300 ease-out group-hover:scale-[1.03]`}
            style={{ backgroundImage: `linear-gradient(135deg, ${themeAccent}, rgba(255,255,255,0.75), ${themeAccent})` }}
          >
            <div
              className={`p-[2px] ${photoRound} bg-black/40 group-hover:bg-black/35 transition-colors`}
              style={{ boxShadow: `0 0 0 1px rgba(255,255,255,0.08), 0 0 24px ${avatarGlow}` }}
            >
              {avatarVideoUrl ? (
                <video
                  src={avatarVideoUrl}
                  className={`${photoSizeCls} ${photoRound} object-cover shadow-xl ring-2 ring-white/10`}
                  style={{ borderColor: themeAccent + "40" }}
                  autoPlay={avatarVideoMuted}
                  loop
                  muted={avatarVideoMuted}
                  controls={!avatarVideoMuted}
                  playsInline
                />
              ) : (site.avatar_url || profile?.avatar_url) ? (
                <img
                  src={site.avatar_url || profile?.avatar_url || ""}
                  alt=""
                  className={`${photoSizeCls} ${photoRound} object-cover shadow-xl ring-2 ring-white/10`}
                  style={{ borderColor: themeAccent + "40" }}
                />
              ) : (
                <div
                  className={`${photoSizeCls} ${photoRound} flex items-center justify-center ${photoInitialSizeCls} font-black shadow-xl ring-2 ring-white/10 text-white`}
                  style={{ backgroundColor: themeAccent }}
                >
                  {initial}
                </div>
              )}
            </div>
          </div>
        </div>

        <h1 className={`${fs.h1} font-black ${bs.text}`} style={customHeadingColor ? { color: customHeadingColor } : undefined}>{site.site_name || profile?.display_name || "My Site"}</h1>

        {/* slug badge */}
        <p className={`${fs.small} ${bs.subtext} font-mono`}>
          hashpo.com/@{site.slug}
        </p>

        {site.bio && <p className={`${fs.body} ${bs.subtext} max-w-md mx-auto leading-relaxed`}>{site.bio}</p>}

        {(site as any).address && (
          <p className={`${fs.body} ${bs.subtext} flex items-center gap-1.5 justify-center`}>
            <MapPin className="w-3.5 h-3.5" /> {(site as any).address}
          </p>
        )}

        {/* ─── Paywall inteiro: CTA para desbloquear (só banner, nome, foto, endereço e bio livres) ─── */}
        {!contentUnlocked && fullPaywall && fullPaywallPrice >= 0.5 && (
          <div className={`mt-6 max-w-md mx-auto rounded-xl p-6 border ${bs.card} text-center`}>
            <p className={`${fs.body} ${bs.subtext} mb-3`}>O restante do conteúdo (links, vídeos, CV, fotos, etc.) está fechado. Desbloqueie pagando uma vez. 70% vai para o criador, 30% para a plataforma.</p>
            <button
              onClick={() => user ? setSiteUnlockConfirm(true) : toast.error("Faça login para desbloquear")}
              className="px-5 py-2.5 rounded-lg text-sm font-bold text-white shadow-lg hover:opacity-90 transition-opacity"
              style={{ backgroundColor: themeAccent }}
            >
              <Lock className="w-3.5 h-3.5 inline mr-1.5" /> Desbloquear site inteiro · ${fullPaywallPrice}
            </button>
          </div>
        )}
      </div>

      {/* ─── Conteúdo pago (só quando não é paywall inteiro ou já desbloqueou) ─── */}
      {contentUnlocked && (
        <>
        {/* ─── CV Section (conteúdo só após pagar) ─── */}
        <div className="max-w-3xl mx-auto px-6 text-center space-y-4 pb-8">
        {site.show_cv && site.cv_content && (
          <div className="max-w-lg mx-auto">
            <button onClick={() => setCvOpen(!cvOpen)} className="flex items-center gap-1.5 mx-auto text-xs font-bold hover:underline" style={{ color: themeAccent }}>
              {cvOpen ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
              {cvOpen ? "Ocultar CV" : "Ver CV / Currículo"}
            </button>
            {cvOpen && (
              <div className={`mt-3 backdrop-blur-sm border rounded-xl p-6 text-left ${fs.body} ${bs.card} ${bs.text}`}>
                {contactUnlocked ? (
                  <>
                    <div className="whitespace-pre-wrap">{site.cv_content}</div>
                    {(siteAny.contact_email || siteAny.contact_phone) && (
                      <div className={`mt-4 pt-4 border-t ${bs.border}`}>
                        <p className={`text-xs font-bold ${bs.subtext} mb-2 flex items-center gap-1.5`}><Lock className="w-3 h-3" /> Contato</p>
                        <div className="space-y-1.5">
                          {siteAny.contact_email && <a href={`mailto:${siteAny.contact_email}`} className={`flex items-center gap-2 text-xs hover:underline ${bs.text}`} style={{ color: themeAccent }}><Mail className="w-3.5 h-3.5" /> {siteAny.contact_email}</a>}
                          {siteAny.contact_phone && <a href={`tel:${siteAny.contact_phone}`} className={`flex items-center gap-2 text-xs hover:underline ${bs.text}`} style={{ color: themeAccent }}><Phone className="w-3.5 h-3.5" /> {siteAny.contact_phone}</a>}
                        </div>
                      </div>
                    )}
                  </>
                ) : (
                  <div className={`${bs.inputBg} rounded-lg p-4 text-center border ${bs.border}`}>
                    <p className={`text-sm ${bs.subtext} mb-3`}>CV e contato bloqueados. Pague para ver o currículo completo e desbloquear o contato.</p>
                    <button
                      onClick={() => user ? setUnlockConfirm(true) : toast.error("Faça login para desbloquear")}
                      className="px-5 py-2.5 rounded-lg text-sm font-bold text-white shadow-lg hover:opacity-90 transition-opacity"
                      style={{ backgroundColor: themeAccent }}
                    >
                      <Lock className="w-3.5 h-3.5 inline mr-1.5" /> Desbloquear CV · ${siteAny.contact_price || 20}
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
        </div>

      {/* ─── Photo Gallery ─── */}
      {showPhotos && photos && photos.length > 0 && (
        <div className="max-w-5xl mx-auto px-6 pb-8">
          <div className="flex items-center gap-2 mb-3">
            <Image className={`w-4 h-4 ${bs.subtext}`} />
            <h2 className={`text-sm font-bold ${bs.text} uppercase tracking-wider`}>Fotos</h2>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {photos.map((p: any) => (
              <button key={p.id} onClick={() => setLightboxPhoto(p.url)} className={`rounded-xl overflow-hidden border ${bs.border} hover:opacity-90 transition-opacity text-left`}>
                <img src={p.url} alt={p.caption || ""} className="w-full aspect-square object-cover" />
                {p.caption && <p className={`p-2 text-[10px] ${bs.subtext}`}>{p.caption}</p>}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ─── Domains for Sale ─── */}
      {showDomains && domains && domains.length > 0 && (
        <div className="max-w-5xl mx-auto px-6 pb-8">
          <div className="flex items-center gap-2 mb-3">
            <Globe className={`w-4 h-4 ${bs.subtext}`} />
            <h2 className={`text-sm font-bold ${bs.text} uppercase tracking-wider`}>Domínios à Venda</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {domains.map((d: any) => (
              <a key={d.id} href={`/domains`} className={`backdrop-blur-sm border rounded-xl p-4 ${bs.card} hover:opacity-80 transition-all block`}>
                <p className={`${fs.body} font-bold font-mono ${bs.text}`}>{d.domain_name}</p>
                <div className="flex items-center justify-between mt-2">
                  <span className={`text-[10px] ${bs.subtext} uppercase`}>{d.domain_type} · {d.tld || ".com"}</span>
                  <span className="text-sm font-bold" style={{ color: themeAccent }}>${d.price}</span>
                </div>
              </a>
            ))}
          </div>
        </div>
      )}

      {/* ─── Imóveis (fotos só aqui, seção separada de classificados) ─── */}
      {showProperties && properties && properties.length > 0 && (
        <div className="max-w-5xl mx-auto px-6 pb-8">
          <div className="flex items-center gap-2 mb-3">
            <Building className={`w-4 h-4 ${bs.subtext}`} />
            <h2 className={`text-sm font-bold ${bs.text} uppercase tracking-wider`}>Imóveis</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {properties.map((p: any) => (
              <PropertyCarousel key={p.id} property={p} bs={bs} fs={fs} themeAccent={themeAccent} textColor={(site as any).text_color} headingColor={(site as any).heading_color} />
            ))}
          </div>
        </div>
      )}

      {/* ─── Classificados (carros, motos, barcos) — fotos nos classificados, seção separada de imóveis ─── */}
      {showClassifieds && classifieds && classifieds.length > 0 && (
        <div className="max-w-5xl mx-auto px-6 pb-8">
          <div className="flex items-center gap-2 mb-3">
            <Car className={`w-4 h-4 ${bs.subtext}`} />
            <h2 className={`text-sm font-bold ${bs.text} uppercase tracking-wider`}>Classificados</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {classifieds.map((c: any) => (
              <ClassifiedCarousel key={c.id} item={c} bs={bs} fs={fs} themeAccent={themeAccent} textColor={(site as any).text_color} headingColor={(site as any).heading_color} />
            ))}
          </div>
        </div>
      )}

      {/* ─── Slugs à venda (opcional) ─── */}
      {showSlugsForSale && slugListings && slugListings.length > 0 && (
        <div className="max-w-3xl mx-auto px-6 pb-8">
          <div className="flex items-center gap-2 mb-3">
            <Tag className={`w-4 h-4 ${bs.subtext}`} />
            <h2 className={`text-sm font-bold ${bs.text} uppercase tracking-wider`}>Slugs à venda</h2>
          </div>
          <div className="flex flex-wrap gap-2">
            {(slugListings as any[]).map((l: any) => (
              <a key={l.id} href="/slugs" target="_blank" rel="noopener noreferrer"
                className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg border ${bs.card} ${bs.text} hover:opacity-90 transition-opacity font-mono text-sm`}>
                <span>@{l.slug}</span>
                <span className={`text-[10px] ${bs.subtext}`}>${Number(l.price).toLocaleString()}</span>
              </a>
            ))}
          </div>
          <p className={`mt-2 text-[10px] ${bs.subtext}`}>Compre no <a href="/slugs" className="underline" style={{ color: themeAccent }}>Marketplace de Slugs</a></p>
        </div>
      )}

      {/* ─── Blog (3 páginas) ─── */}
      {blogEnabled && blogPages.length > 0 && (
        <div className="max-w-5xl mx-auto px-6 pb-8">
          <div className="flex items-center gap-2 mb-3">
            <FileText className={`w-4 h-4 ${bs.subtext}`} />
            <h2 className={`text-sm font-bold ${bs.text} uppercase tracking-wider`}>Blog</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {blogPages.slice(0, 3).map((page, idx) => (
              <a
                key={`blog-page-${idx}`}
                href={page.url || `/@${site.slug}/blog/${page.slug || `pagina-${idx + 1}`}`}
                className={`rounded-xl border p-4 ${bs.card} hover:opacity-90 transition-opacity`}
              >
                <p className={`${fs.body} font-bold ${bs.text} mb-1`}>{page.title || `Página ${idx + 1}`}</p>
                {page.summary && <p className={`${fs.small} ${bs.subtext}`}>{page.summary}</p>}
              </a>
            ))}
          </div>
        </div>
      )}

      {/* ─── Feed ─── */}
      <div className="max-w-3xl mx-auto px-6 pb-8">
        <div className="flex items-center gap-2 mb-3">
          <Rss className={`w-4 h-4 ${bs.subtext}`} />
          <h2 className={`text-sm font-bold ${bs.text} uppercase tracking-wider`}>Feed</h2>
        </div>
        <Feed
          siteId={site.id}
          userId={site.user_id}
          isOwner={user?.id === site.user_id}
          accentColor={themeAccent}
          textColor={customTextColor || undefined}
          feedMode={feedMode}
        />
      </div>

      {/* ─── Links ─── */}
      {links && links.length > 0 && (
        <div className="max-w-md mx-auto px-6 pb-8 space-y-2">
          {links.map((l: any) => {
            const social = SOCIAL_NETWORKS.find(s => s.id === l.icon);
            return (
              <a key={l.id} href={l.url} target="_blank" rel="noopener noreferrer"
                className={`flex items-center justify-between w-full px-5 py-3 backdrop-blur-sm border rounded-xl ${fs.body} font-bold ${bs.card} ${bs.text} hover:opacity-80 transition-all group`}>
                <div className="flex items-center gap-3">
                  {social ? <span style={{ color: social.color }}>{social.icon}</span> : null}
                  <span>{l.title}</span>
                </div>
                <ExternalLink className={`w-4 h-4 ${bs.subtext}`} />
              </a>
            );
          })}
        </div>
      )}

      {/* ─── Videos Grid ─── */}
      {videos && videos.length > 0 && (
        <div className="max-w-5xl mx-auto px-6 pb-16">
          <div className={`grid ${colClass} gap-4`}>
            {videos.map((v: any) => {
              const isPlaying = playingId === v.id;
              const canPlay = !v.nft_enabled || hasNftAccess(v.id);
              const soldOut = v.nft_max_editions && v.nft_editions_sold >= v.nft_max_editions;
              const protectedId = protectedIds.get(v.id) || null;
              if (v.nft_enabled) return <NftFlipCard key={v.id} video={v} canPlay={canPlay} isPlaying={isPlaying} onPlay={() => handlePlay(v)} onBuy={() => setBuyConfirm(v)} soldOut={soldOut} themeAccent={themeAccent} protectedVideoId={protectedId} loadingVideo={loadingProtected && playingId === v.id} />;
              return (
                <div key={v.id} className={`backdrop-blur-sm border rounded-xl overflow-hidden group hover:opacity-90 transition-all ${bs.card}`}>
                  <div className="relative aspect-video bg-black/20">
                    {isPlaying && protectedId ? (
                      <iframe
                        title={v.title}
                        src={`https://www.youtube-nocookie.com/embed/${encodeURIComponent(protectedId)}?autoplay=1&rel=0&modestbranding=1&playsinline=1`}
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
                        allowFullScreen
                        className="w-full h-full border-0"
                        loading="lazy"
                      />
                    ) : (
                      <>
                        {v.preview_url ? <video src={v.preview_url} autoPlay loop muted playsInline className="w-full h-full object-cover" /> : <img src={v.thumbnail_url || "/placeholder.svg"} alt={v.title} className="w-full h-full object-cover" />}
                        <button onClick={() => handlePlay(v)} className="absolute inset-0 flex items-center justify-center bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity">
                          {loadingProtected && playingId === v.id ? <div className="w-12 h-12 border-4 border-white/30 border-t-white rounded-full animate-spin" /> : <Play className="w-12 h-12 text-white fill-white drop-shadow-lg" />}
                        </button>
                      </>
                    )}
                  </div>
                  <div className="p-3">
                    <p className={`${fs.body} font-bold ${bs.text} line-clamp-2`}>{v.title}</p>
                    {(v as any).paywall_enabled && (
                      <span className="text-[10px] font-bold mt-1 inline-flex items-center gap-1" style={{ color: themeAccent }}>
                        <DollarSign className="w-3 h-3" /> {hasPaywallAccess(v.id) ? "Unlocked" : `$${(v as any).paywall_price} to watch`}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      </>)}

      {/* ─── Footer ─── */}
      <div className="text-center pb-8">
        <a href="/" className={`text-[10px] ${bs.subtext} hover:opacity-70 transition-colors flex items-center gap-1 justify-center`}>
          <Globe className="w-3 h-3" /> Powered by HASHPO
        </a>
      </div>

      {(site as any).show_ai_chat !== false && (
        <AiChatWidget
          siteId={site.id}
          siteName={site.site_name || site.slug || "Mini Site"}
          siteContext={`Site: ${site.site_name || site.slug}. Bio: ${site.bio || ""}. ${site.cv_headline ? `Headline: ${site.cv_headline}` : ""}`}
          accentColor={themeAccent}
          agendaEnabled={!!(site as any).agenda_enabled}
          appointmentPrice={Number((site as any).appointment_price) || 0}
        />
      )}
    </div>
  );
};

export default MiniSitePublic;
