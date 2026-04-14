import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { normalizeSlug } from "@/lib/slug";

const MINI_SITE_ALLOWED_FIELDS = new Set([
  "site_name",
  "slug",
  "bio",
  "layout_columns",
  "show_cv",
  "cv_content",
  "theme",
  "template_id",
  "contact_email",
  "contact_phone",
  "contact_price",
  "cv_headline",
  "cv_location",
  "cv_skills",
  "cv_experience",
  "cv_education",
  "avatar_url",
  "bg_style",
  "font_size",
  "photo_shape",
  "photo_size",
  "address",
  "show_domains",
  "show_properties",
  "show_classifieds",
  "show_slugs_for_sale",
  "show_photos",
  "show_ai_chat",
  "full_paywall",
  "full_paywall_price",
  "agenda_enabled",
  "appointment_price",
  "text_color",
  "heading_color",
  "link_color",
  "button_text_color",
  "button_bg_color",
  "published",
  "banner_url",
  "banner_color",
  "banner_link",
  "mystic_lottery_premium_price_usd",
  "custom_css",
  "content_language",
  "blog_enabled",
  "feed_mode",
  "wallet_login_enabled",
  "avatar_video_url",
  "avatar_video_muted",
  "blog_pages",
  "seo_title",
  "seo_description",
  "seo_image_url",
]);

function sanitizeMiniSiteValues(values: Record<string, any>) {
  return Object.fromEntries(
    Object.entries(values).filter(([key, value]) => MINI_SITE_ALLOWED_FIELDS.has(key) && value !== undefined),
  );
}

function randomYoutubeVerifyCode(): string {
  const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
  const arr = new Uint8Array(12);
  crypto.getRandomValues(arr);
  let out = "";
  for (let i = 0; i < 8; i++) out += chars[arr[i]! % chars.length];
  return out;
}

export function useMySite() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["my-mini-site", user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("mini_sites")
        .select("*")
        .eq("user_id", user!.id)
        .maybeSingle();
      return data;
    },
    enabled: !!user,
    staleTime: 45_000,
  });
}

export function usePublicSite(slug: string) {
  return useQuery({
    queryKey: ["public-site", slug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("mini_sites")
        .select("*")
        .eq("slug", slug)
        .eq("published", true)
        .maybeSingle();
      if (error) throw error;
      return data ?? null;
    },
    enabled: !!slug,
    staleTime: 30_000,
  });
}

export function useSiteLinks(siteId: string | undefined) {
  return useQuery({
    queryKey: ["site-links", siteId],
    queryFn: async () => {
      const { data } = await supabase
        .from("mini_site_links")
        .select("*")
        .eq("site_id", siteId!)
        .order("sort_order");
      return data || [];
    },
    enabled: !!siteId,
  });
}

export function useSiteVideos(siteId: string | undefined) {
  return useQuery({
    queryKey: ["site-videos", siteId],
    queryFn: async () => {
      const { data } = await supabase
        .from("mini_site_videos")
        .select("id, site_id, user_id, title, description, thumbnail_url, preview_url, sort_order, nft_enabled, nft_price, nft_max_views, nft_max_editions, nft_editions_sold, recharge_enabled, recharge_price, view_tier, paywall_enabled, paywall_price, created_at, youtube_verification_code, youtube_verified_at")
        .eq("site_id", siteId!)
        .order("sort_order");
      return data || [];
    },
    enabled: !!siteId,
  });
}

export function useUpsertSite() {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (values: Record<string, any>) => {
      if (!user) throw new Error("Please sign in before saving your mini site.");
      const base = normalizeSlug(String(values.slug ?? user!.email?.split("@")[0] ?? "user"));
      let nextSlug = base || "user";
      const safeValues = sanitizeMiniSiteValues(values);

      const { data: existing } = await supabase
        .from("mini_sites")
        .select("id, slug")
        .eq("user_id", user!.id)
        .maybeSingle();

      if (existing) {
        if (nextSlug !== existing.slug) {
          const { data: taken } = await supabase
            .from("mini_sites")
            .select("id")
            .eq("slug", nextSlug)
            .maybeSingle();
          if (taken && taken.id !== existing.id) {
            const { data: reg } = await supabase
              .from("slug_registrations")
              .select("id")
              .eq("slug", nextSlug)
              .eq("user_id", user!.id)
              .eq("status", "active")
              .maybeSingle();
            if (!reg) {
              throw new Error(
                "Este slug já está em uso. Escolha outro ou use um slug que você comprou em /slugs.",
              );
            }
          }
        }
        const { error } = await supabase
          .from("mini_sites")
          .update({ ...safeValues, slug: nextSlug })
          .eq("id", existing.id);
        if (error) throw error;
        return existing.id;
      }

      let candidate = nextSlug;
      for (let attempt = 0; attempt < 24; attempt++) {
        const { data: clash } = await supabase.from("mini_sites").select("id").eq("slug", candidate).maybeSingle();
        if (!clash) break;
        candidate = `${nextSlug}-${Math.floor(1000 + Math.random() * 8999)}`;
      }
      const { data, error } = await supabase
        .from("mini_sites")
        .insert({ ...safeValues, user_id: user!.id, slug: candidate })
        .select("id")
        .single();
      if (error) throw error;
      return data.id;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["my-mini-site"] }),
  });
}

export function useAddSiteLink() {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (values: { site_id: string; title: string; url: string; icon?: string }) => {
      const { error } = await supabase
        .from("mini_site_links")
        .insert({ ...values, user_id: user!.id });
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["site-links"] }),
  });
}

export function useDeleteSiteLink() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("mini_site_links").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["site-links"] }),
  });
}

export function useAddSiteVideo() {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (values: {
      site_id: string;
      youtube_video_id: string;
      title: string;
      thumbnail_url?: string;
      nft_enabled?: boolean;
      nft_price?: number;
      nft_max_views?: number;
      nft_max_editions?: number;
      preview_url?: string;
      recharge_price?: number;
      recharge_enabled?: boolean;
      view_tier?: number;
      paywall_enabled?: boolean;
      paywall_price?: number;
    }) => {
      const { youtube_video_id, ...rest } = values;
      let verificationCode = randomYoutubeVerifyCode();
      for (let i = 0; i < 5; i++) {
        const { data: video, error } = await supabase
          .from("mini_site_videos")
          .insert({
            ...rest,
            user_id: user!.id,
            youtube_video_id,
            youtube_verification_code: verificationCode,
          })
          .select("id")
          .single();
        if (!error && video) {
          const { error: privateErr } = await supabase
            .from("private_video_urls")
            .insert({ video_id: video.id, youtube_video_id });
          if (privateErr) {
            await supabase.from("mini_site_videos").delete().eq("id", video.id);
            throw new Error(privateErr.message || "Falha ao guardar ID do YouTube.");
          }
          return;
        }
        if (error?.code === "23505" || /duplicate|unique/i.test(error?.message ?? "")) {
          verificationCode = randomYoutubeVerifyCode();
          continue;
        }
        throw error;
      }
      throw new Error("Não foi possível gerar código de verificação único.");
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["site-videos"] }),
  });
}

export function useDeleteSiteVideo() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("mini_site_videos").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["site-videos"] }),
  });
}

export function useUpdateSiteVideo() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...values }: { id: string } & Record<string, any>) => {
      const { error } = await supabase.from("mini_site_videos").update(values).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["site-videos"] }),
  });
}

export function useBuyNft() {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (video: any) => {
      const hash = `0x${Array.from(crypto.getRandomValues(new Uint8Array(20))).map(b => b.toString(16).padStart(2, '0')).join('')}`;
      const { error } = await supabase.from("nft_purchases").insert({
        video_id: video.id,
        buyer_id: user!.id,
        seller_id: video.user_id,
        price_paid: video.nft_price,
        views_allowed: video.nft_max_views,
        polygon_hash: hash,
      });
      if (error) throw error;
      await supabase
        .from("mini_site_videos")
        .update({ nft_editions_sold: (video.nft_editions_sold || 0) + 1 })
        .eq("id", video.id);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["site-videos"] });
      qc.invalidateQueries({ queryKey: ["my-nfts"] });
    },
  });
}

export function useBuyNftFromListing() {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (listing: any) => {
      // Transfer NFT ownership
      const { error: updateErr } = await supabase
        .from("nft_purchases")
        .update({
          buyer_id: user!.id,
          original_buyer_id: listing.seller_id,
          is_resale: true,
          price_paid: listing.price,
        })
        .eq("id", listing.nft_purchase_id);
      if (updateErr) throw updateErr;

      // Mark listing as sold
      const { error: listErr } = await supabase
        .from("nft_listings")
        .update({ status: "sold" })
        .eq("id", listing.id);
      if (listErr) throw listErr;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["nft-listings"] });
      qc.invalidateQueries({ queryKey: ["my-nfts"] });
    },
  });
}

export function useCreateListing() {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (values: { nft_purchase_id: string; video_id: string; price: number }) => {
      const { error } = await supabase.from("nft_listings").insert({
        ...values,
        seller_id: user!.id,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["nft-listings"] });
      qc.invalidateQueries({ queryKey: ["my-nfts"] });
    },
  });
}

export function useCancelListing() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("nft_listings")
        .update({ status: "cancelled" })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["nft-listings"] }),
  });
}

export function useRechargeNft() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ purchaseId, extraViews }: { purchaseId: string; extraViews: number }) => {
      const { data: purchase } = await supabase
        .from("nft_purchases")
        .select("views_allowed")
        .eq("id", purchaseId)
        .single();
      if (!purchase) throw new Error("NFT not found");

      const { error } = await supabase
        .from("nft_purchases")
        .update({ views_allowed: purchase.views_allowed + extraViews })
        .eq("id", purchaseId);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["my-nfts"] }),
  });
}

export function useMyNfts() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["my-nfts", user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("nft_purchases")
        .select("*, mini_site_videos(*)")
        .eq("buyer_id", user!.id);
      return data || [];
    },
    enabled: !!user,
  });
}

export function useNftListings(videoId?: string) {
  return useQuery({
    queryKey: ["nft-listings", videoId],
    queryFn: async () => {
      let q = supabase
        .from("nft_listings")
        .select("*, mini_site_videos(title, thumbnail_url, youtube_video_id, nft_max_views, recharge_enabled, recharge_price)")
        .eq("status", "active")
        .order("created_at", { ascending: false });
      if (videoId) q = q.eq("video_id", videoId);
      const { data } = await q;
      return data || [];
    },
  });
}

export function useAllNftListings() {
  return useQuery({
    queryKey: ["nft-listings-all"],
    queryFn: async () => {
      const { data } = await supabase
        .from("nft_listings")
        .select("*, mini_site_videos(title, thumbnail_url, youtube_video_id, nft_max_views, nft_price, recharge_enabled, recharge_price, user_id)")
        .eq("status", "active")
        .order("created_at", { ascending: false });
      return data || [];
    },
  });
}
