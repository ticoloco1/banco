import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

/** Listagem global de classificados (páginas /classificados, /carros, /imoveis) */
export function useGlobalClassifieds(category?: string) {
  return useQuery({
    queryKey: ["global-classifieds", category],
    queryFn: async () => {
      let q = supabase
        .from("classified_listings")
        .select("*")
        .eq("status", "active");
      if (category) {
        q = q.eq("category", category);
      }
      const { data, error } = await q.order("created_at", { ascending: false }).limit(100);
      if (error) throw error;
      return (data ?? []) as any[];
    },
  });
}

/** Um classificado por ID (página de detalhe) */
export function useClassifiedById(id: string | undefined) {
  return useQuery({
    queryKey: ["classified", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("classified_listings")
        .select("*")
        .eq("id", id!)
        .single();
      if (error) throw error;
      return data as any;
    },
    enabled: !!id,
  });
}

/** Classificados (carros, motos, barcos) para a página pública do mini site */
export function useSiteClassifieds(siteId: string | undefined) {
  return useQuery({
    queryKey: ["site-classifieds", siteId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("classified_listings")
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

/** Todos os classificados do site (editor) */
export function useSiteClassifiedsForEditor(siteId: string | undefined) {
  return useQuery({
    queryKey: ["site-classifieds-editor", siteId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("classified_listings")
        .select("*")
        .eq("site_id", siteId!)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as any[];
    },
    enabled: !!siteId,
  });
}

export type ClassifiedInsert = {
  site_id: string;
  user_id: string;
  title: string;
  description?: string | null;
  category: string;
  subcategory?: string | null;
  price: number;
  currency?: string;
  image_urls?: string[] | null;
  status?: string;
  tipo_anuncio?: string | null;
  contact_phone?: string | null;
  contact_whatsapp?: string | null;
  contact_email?: string | null;
  pais?: string | null;
  estado?: string | null;
  cidade?: string | null;
  details?: Record<string, unknown> | null;
};

export function useAddClassified() {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (values: Omit<ClassifiedInsert, "user_id">) => {
      const { error } = await supabase.from("classified_listings").insert({
        ...values,
        user_id: user!.id,
        status: values.status ?? "active",
        currency: values.currency ?? "BRL",
      });
      if (error) throw error;
    },
    onSuccess: (_, v) => {
      qc.invalidateQueries({ queryKey: ["site-classifieds", v.site_id] });
      qc.invalidateQueries({ queryKey: ["site-classifieds-editor", v.site_id] });
      qc.invalidateQueries({ queryKey: ["global-classifieds"] });
    },
  });
}

export function useUpdateClassified() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, site_id, ...values }: { id: string; site_id: string } & Record<string, unknown>) => {
      const { error } = await supabase.from("classified_listings").update(values).eq("id", id);
      if (error) throw error;
    },
    onSuccess: (_, v) => {
      qc.invalidateQueries({ queryKey: ["site-classifieds", v.site_id] });
      qc.invalidateQueries({ queryKey: ["site-classifieds-editor", v.site_id] });
      qc.invalidateQueries({ queryKey: ["global-classifieds"] });
      qc.invalidateQueries({ queryKey: ["classified", v.id] });
    },
  });
}

export function useDeleteClassified() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, site_id }: { id: string; site_id: string }) => {
      const { error } = await supabase.from("classified_listings").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: (_, v) => {
      qc.invalidateQueries({ queryKey: ["site-classifieds", v.site_id] });
      qc.invalidateQueries({ queryKey: ["site-classifieds-editor", v.site_id] });
      qc.invalidateQueries({ queryKey: ["global-classifieds"] });
      qc.invalidateQueries({ queryKey: ["classified", v.id] });
    },
  });
}
