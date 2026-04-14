import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { TablesUpdate } from "@/integrations/supabase/types";

export function useAdminVideos(category?: string | null) {
  return useQuery({
    queryKey: ["admin-videos", category],
    queryFn: async () => {
      let query = supabase
        .from("videos")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(150);
      if (category) query = query.eq("category", category);
      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  });
}

export function useUpdateVideo() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: TablesUpdate<"videos"> & { id: string }) => {
      const { error } = await supabase.from("videos").update(updates).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-videos"] });
      qc.invalidateQueries({ queryKey: ["videos"] });
    },
  });
}
