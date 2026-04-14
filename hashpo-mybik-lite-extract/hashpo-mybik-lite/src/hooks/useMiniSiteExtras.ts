import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

// ─── Photos ───
export function useSitePhotos(siteId: string | undefined) {
  return useQuery({
    queryKey: ["site-photos", siteId],
    queryFn: async () => {
      const { data } = await supabase
        .from("mini_site_photos")
        .select("*")
        .eq("site_id", siteId!)
        .order("sort_order");
      return data || [];
    },
    enabled: !!siteId,
  });
}

export function useAddSitePhoto() {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (values: { site_id: string; url: string; caption?: string }) => {
      const { error } = await supabase
        .from("mini_site_photos")
        .insert({ ...values, user_id: user!.id });
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["site-photos"] }),
  });
}

export function useDeleteSitePhoto() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("mini_site_photos").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["site-photos"] }),
  });
}

// ─── User's Domain Listings ───
export function useUserDomains(userId: string | undefined) {
  return useQuery({
    queryKey: ["user-domains", userId],
    queryFn: async () => {
      const { data } = await supabase
        .from("domain_listings")
        .select("*")
        .eq("seller_id", userId!)
        .eq("status", "active")
        .order("created_at", { ascending: false });
      return data || [];
    },
    enabled: !!userId,
  });
}

// ─── User's Property Listings ───
export function useUserProperties(userId: string | undefined) {
  return useQuery({
    queryKey: ["user-properties", userId],
    queryFn: async () => {
      const { data } = await supabase
        .from("property_listings" as any)
        .select("*")
        .eq("seller_id", userId!)
        .eq("status", "active")
        .order("created_at", { ascending: false });
      return (data as any[]) || [];
    },
    enabled: !!userId,
  });
}
