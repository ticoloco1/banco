import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export function useAdminReports() {
  return useQuery({
    queryKey: ["admin-reports"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("video_reports" as any)
        .select("*")
        .order("created_at", { ascending: false })
        .limit(100);
      if (error) throw error;
      return data as any[];
    },
  });
}

export function useResolveReport() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, reviewed }: { id: string; reviewed: boolean }) => {
      const { error } = await supabase
        .from("video_reports" as any)
        .update({ reviewed, reviewed_at: new Date().toISOString() } as any)
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-reports"] }),
  });
}

export function useFlaggedVideos() {
  return useQuery({
    queryKey: ["flagged-videos"],
    queryFn: async () => {
      const { data, error } = await (supabase
        .from("videos")
        .select("*") as any)
        .eq("under_review", true)
        .order("report_count", { ascending: false });
      if (error) throw error;
      return data;
    },
  });
}
