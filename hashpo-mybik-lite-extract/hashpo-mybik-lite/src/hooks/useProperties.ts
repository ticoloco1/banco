import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

/**
 * Fetch property listings for a mini site (by site_id).
 * Used on the public mini site page to show the "Imóveis" section.
 */
export function useSiteProperties(siteId: string | undefined) {
  return useQuery({
    queryKey: ["site-properties", siteId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("property_listings")
        .select("*")
        .eq("site_id", siteId!)
        .eq("status", "active")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as any[];
    },
    enabled: !!siteId,
  });
}

/** All properties for a site (editor), any status */
export function useSitePropertiesForEditor(siteId: string | undefined) {
  return useQuery({
    queryKey: ["site-properties-editor", siteId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("property_listings")
        .select("*")
        .eq("site_id", siteId!)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as any[];
    },
    enabled: !!siteId,
  });
}

export type PropertyListingInsert = {
  site_id: string;
  user_id: string;
  title: string;
  description?: string | null;
  location?: string | null;
  price: number;
  currency?: string;
  property_type: string;
  bedrooms?: number | null;
  bathrooms?: number | null;
  area_sqm?: number | null;
  image_urls?: string[] | null;
  status?: string;
};

export function useAddProperty() {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (values: Omit<PropertyListingInsert, "user_id">) => {
      const { error } = await supabase.from("property_listings").insert({
        ...values,
        user_id: user!.id,
        status: values.status ?? "active",
        currency: values.currency ?? "BRL",
      });
      if (error) throw error;
    },
    onSuccess: (_, v) => {
      qc.invalidateQueries({ queryKey: ["site-properties", v.site_id] });
      qc.invalidateQueries({ queryKey: ["site-properties-editor", v.site_id] });
    },
  });
}

export function useUpdateProperty() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, site_id, ...values }: { id: string; site_id: string } & Record<string, unknown>) => {
      const { error } = await supabase.from("property_listings").update(values).eq("id", id);
      if (error) throw error;
    },
    onSuccess: (_, v) => {
      qc.invalidateQueries({ queryKey: ["site-properties", v.site_id] });
      qc.invalidateQueries({ queryKey: ["site-properties-editor", v.site_id] });
    },
  });
}

export function useDeleteProperty() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, site_id }: { id: string; site_id: string }) => {
      const { error } = await supabase.from("property_listings").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: (_, v) => {
      qc.invalidateQueries({ queryKey: ["site-properties", v.site_id] });
      qc.invalidateQueries({ queryKey: ["site-properties-editor", v.site_id] });
    },
  });
}
