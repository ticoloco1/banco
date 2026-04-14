import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

export function useCollections() {
  return useQuery({
    queryKey: ["nft-collections"],
    queryFn: async () => {
      const { data } = await supabase
        .from("nft_collections" as any)
        .select("*, mini_site_videos(title, thumbnail_url, youtube_video_id)")
        .eq("status", "active")
        .order("launched_at", { ascending: false });
      return (data as any[]) || [];
    },
  });
}

export function useMyCollections() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["my-collections", user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("nft_collections" as any)
        .select("*, mini_site_videos(title, thumbnail_url, youtube_video_id)")
        .eq("creator_id", user!.id)
        .order("created_at", { ascending: false });
      return (data as any[]) || [];
    },
    enabled: !!user,
  });
}

export function useLaunchCollection() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (params: {
      video_id: string;
      site_id: string;
      title: string;
      description?: string;
      max_editions?: number;
      price_per_nft?: number;
      view_tier?: number;
      recharge_enabled?: boolean;
      recharge_price?: number;
      thumbnail_url?: string;
    }) => {
      const { data, error } = await supabase.functions.invoke("launch-collection", {
        body: params,
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      return data;
    },
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ["nft-collections"] });
      qc.invalidateQueries({ queryKey: ["my-collections"] });
      qc.invalidateQueries({ queryKey: ["site-videos"] });
      toast.success(`🚀 Collection launched! TX: ${data.polygon_hash?.slice(0, 10)}...`);
    },
    onError: (e: any) => toast.error(e.message),
  });
}

export function useBuyCollectionNft() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (params: { collection_id: string; quantity: number }) => {
      const { data, error } = await supabase.functions.invoke("buy-collection-nft", {
        body: params,
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      return data;
    },
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ["nft-collections"] });
      qc.invalidateQueries({ queryKey: ["my-nfts"] });
      toast.success(`Minted ${data.quantity} NFT(s)! TX: ${data.polygon_hash?.slice(0, 10)}...`);
    },
    onError: (e: any) => toast.error(e.message),
  });
}
