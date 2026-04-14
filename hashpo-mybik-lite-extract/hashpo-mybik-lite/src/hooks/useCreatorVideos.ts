import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export function useCreatorVideos() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["creator-videos", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("videos")
        .select("*")
        .eq("creator_id", user!.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });
}

export function usePublishVideo() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (videoId: string) => {
      const { error } = await supabase
        .from("videos")
        .update({ status: "live" } as any)
        .eq("id", videoId);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["creator-videos"] }),
  });
}

export function useIssueShares() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (videoId: string) => {
      const hash = `0x${Array.from(crypto.getRandomValues(new Uint8Array(20))).map(b => b.toString(16).padStart(2, '0')).join('')}`;
      const { error } = await supabase
        .from("videos")
        .update({
          shares_issued: true,
          status: "locked" as any,
          polygon_hash: hash,
          exchange_active: true,
        } as any)
        .eq("id", videoId);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["creator-videos"] });
      qc.invalidateQueries({ queryKey: ["videos"] });
    },
  });
}
