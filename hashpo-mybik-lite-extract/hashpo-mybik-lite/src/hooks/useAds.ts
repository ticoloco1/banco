import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export function useAdsBySlot(slotType: string) {
  return useQuery({
    queryKey: ["ads", slotType],
    queryFn: async () => {
      const { data } = await supabase
        .from("ad_campaigns" as any)
        .select("*")
        .eq("slot_type", slotType)
        .eq("active", true)
        .order("created_at", { ascending: false })
        .limit(5);
      return (data || []) as any[];
    },
  });
}

export function useAllAds() {
  return useQuery({
    queryKey: ["ads", "all"],
    queryFn: async () => {
      const { data } = await supabase
        .from("ad_campaigns" as any)
        .select("*")
        .order("created_at", { ascending: false });
      return (data || []) as any[];
    },
  });
}

export async function trackAdImpression(adId: string) {
  await supabase
    .from("ad_campaigns" as any)
    .update({ impressions: undefined } as any) // will use RPC later
    .eq("id", adId);
}

export async function trackAdClick(adId: string) {
  // Simple increment - in production use RPC
  const { data } = await supabase.from("ad_campaigns" as any).select("clicks").eq("id", adId).single();
  if (data) {
    await supabase.from("ad_campaigns" as any).update({ clicks: (data as any).clicks + 1 } as any).eq("id", adId);
  }
}
