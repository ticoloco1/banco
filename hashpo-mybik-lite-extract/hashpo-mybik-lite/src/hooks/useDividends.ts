import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export function useDividendPayouts() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["dividend_payouts", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from("dividend_payouts")
        .select("*, videos(title, ticker, polygon_hash)")
        .eq("holder_id", user.id)
        .order("created_at", { ascending: false })
        .limit(200);
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });
}

export function useWallet() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["wallet", user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data, error } = await supabase
        .from("wallets")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });
}

export function useHoldings() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["holdings", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from("share_holdings")
        .select("*, videos(title, ticker, share_price, revenue, polygon_hash)")
        .eq("holder_id", user.id)
        .gt("quantity", 0)
        .order("acquired_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });
}

export function useWithdrawals() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["withdrawals", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from("withdrawals")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });
}

export function usePaywallUnlock(videoId: string) {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["paywall_unlock", user?.id, videoId],
    queryFn: async () => {
      if (!user) return null;
      const { data } = await supabase
        .from("paywall_unlocks")
        .select("id")
        .eq("user_id", user.id)
        .eq("video_id", videoId)
        .maybeSingle();
      return data;
    },
    enabled: !!user && !!videoId,
  });
}