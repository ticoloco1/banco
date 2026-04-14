import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";

export type Video = Tables<"videos">;

export function useVideos(category?: string | null) {
  return useQuery({
    queryKey: ["videos", category],
    queryFn: async () => {
      let query = supabase
        .from("videos")
        .select("*")
        .eq("blocked", false)
        .order("boost_rank", { ascending: true })
        .order("featured", { ascending: false })
        .order("revenue", { ascending: false })
        .limit(150);

      if (category) {
        query = query.eq("category", category);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  });
}

export function useVideo(id: string) {
  return useQuery({
    queryKey: ["video", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("videos")
        .select("*")
        .eq("id", id)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });
}
