import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useEffect, useState } from "react";

// Boost tiers available
export const BOOST_TIERS = [0.5, 1, 5, 10, 20, 50, 100, 500, 1000];

// Cost per ranking position
export const COST_PER_POSITION = 1.5;

// Home page threshold (top 150)
export const HOME_THRESHOLD = 150;

// Direct-to-home cost
export const DIRECT_HOME_COST = 1000;

// Maintenance cost per day
export const MAINTENANCE_COST_PER_DAY = 100;

// Home duration in days
export const HOME_DURATION_DAYS = 7;

// Positions dropped after expiry
export const DROP_POSITIONS = 150;

export function useJackpotPool() {
  const [pool, setPool] = useState<{ total_amount: number; last_winner_amount: number | null; last_drawn_at: string | null } | null>(null);

  useEffect(() => {
    supabase
      .from("jackpot_pool")
      .select("*")
      .eq("id", 1)
      .single()
      .then(({ data }) => {
        if (data) setPool(data as any);
      });

    const channel = supabase
      .channel("jackpot-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "jackpot_pool" }, (payload) => {
        setPool(payload.new as any);
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  return pool;
}

export function useBoostVideo() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ videoId, userId, amount }: { videoId: string; userId: string; amount: number }) => {
      // Check wallet balance
      const { data: wallet } = await supabase
        .from("wallets")
        .select("balance")
        .eq("user_id", userId)
        .maybeSingle();

      const balance = wallet?.balance ?? 0;
      if (balance < amount) {
        throw new Error(`Insufficient USDC balance. Need $${amount.toFixed(2)}.`);
      }

      // Debit wallet
      await supabase.from("wallets").update({ balance: balance - amount }).eq("user_id", userId);

      // Get video current boost data
      const { data: video } = await supabase
        .from("videos")
        .select("creator_id, boost_count, boost_total_spent")
        .eq("id", videoId)
        .single();

      const currentSpent = (video as any)?.boost_total_spent ?? 0;
      const newTotalSpent = currentSpent + amount;

      // Split: 35% pool, 15% creator, 50% platform
      const toPool = amount * 0.35;
      const toCreator = amount * 0.15;
      const toPlatform = amount * 0.50;

      // Insert boost record
      const { data: boost, error } = await supabase
        .from("boosts")
        .insert({
          user_id: userId,
          video_id: videoId,
          amount,
          to_pool: toPool,
          to_creator: toCreator,
          to_platform: toPlatform,
        })
        .select()
        .single();
      if (error) throw error;

      // Insert boost ticket
      await supabase.from("boost_tickets").insert({
        user_id: userId,
        boost_id: boost.id,
        video_id: videoId,
      });

      // Calculate new rank: each $1.50 = 1 position up
      const positionsEarned = Math.floor(newTotalSpent / COST_PER_POSITION);
      const newRank = Math.max(1, 999999 - positionsEarned);

      // Check if direct-to-home ($1000 boost)
      const isDirectHome = amount >= DIRECT_HOME_COST;
      const isInHome = newRank <= HOME_THRESHOLD || isDirectHome;

      const updateData: any = {
        boost_count: ((video as any)?.boost_count ?? 0) + 1,
        boost_total_spent: newTotalSpent,
        boost_rank: isDirectHome ? 1 : newRank,
      };

      if (isInHome && !(video as any)?.boost_home_at) {
        updateData.boost_home_at = new Date().toISOString();
        updateData.boost_home_expires_at = new Date(Date.now() + HOME_DURATION_DAYS * 86400000).toISOString();
      }

      await supabase.from("videos").update(updateData).eq("id", videoId);

      // Credit creator wallet (15%)
      if (video?.creator_id) {
        const { data: creatorWallet } = await supabase
          .from("wallets")
          .select("balance")
          .eq("user_id", video.creator_id)
          .maybeSingle();

        if (creatorWallet) {
          await supabase.from("wallets").update({ balance: creatorWallet.balance + toCreator }).eq("user_id", video.creator_id);
        } else {
          await supabase.from("wallets").insert({ user_id: video.creator_id, balance: toCreator });
        }
      }

      // Update jackpot pool (35%)
      const { data: pool } = await supabase.from("jackpot_pool").select("total_amount").eq("id", 1).single();
      await supabase.from("jackpot_pool").update({ total_amount: ((pool as any)?.total_amount ?? 0) + toPool } as any).eq("id", 1);

      return { boost, newRank, isInHome };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["videos"] });
      queryClient.invalidateQueries({ queryKey: ["wallet"] });
    },
  });
}

export function useVideoBoostCount(videoId: string) {
  return useQuery({
    queryKey: ["boost_count", videoId],
    queryFn: async () => {
      const { count } = await supabase
        .from("boosts")
        .select("*", { count: "exact", head: true })
        .eq("video_id", videoId);
      return count ?? 0;
    },
  });
}

export function useVideoBoostProgress(videoId: string) {
  return useQuery({
    queryKey: ["boost_progress", videoId],
    queryFn: async () => {
      const { data } = await supabase
        .from("videos")
        .select("boost_total_spent, boost_rank, boost_home_at, boost_home_expires_at")
        .eq("id", videoId)
        .single();

      const totalSpent = (data as any)?.boost_total_spent ?? 0;
      const rank = (data as any)?.boost_rank ?? 999999;
      const costToHome = HOME_THRESHOLD * COST_PER_POSITION; // $225 to reach home
      const progress = Math.min(100, (totalSpent / costToHome) * 100);
      const isInHome = rank <= HOME_THRESHOLD;
      const homeExpiresAt = (data as any)?.boost_home_expires_at;
      const remaining = costToHome - totalSpent;

      return { totalSpent, rank, progress, isInHome, homeExpiresAt, remaining: Math.max(0, remaining), costToHome };
    },
    enabled: !!videoId,
  });
}
