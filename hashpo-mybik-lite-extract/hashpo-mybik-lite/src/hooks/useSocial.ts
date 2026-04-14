import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export function useFollowing() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["following", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from("follows" as any)
        .select("following_id, created_at")
        .eq("follower_id", user.id);
      if (error) throw error;
      return (data as any[]) ?? [];
    },
    enabled: !!user,
  });
}

export function useIsFollowing(creatorId: string | null) {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["is_following", user?.id, creatorId],
    queryFn: async () => {
      if (!user || !creatorId) return false;
      const { data } = await supabase
        .from("follows" as any)
        .select("id")
        .eq("follower_id", user.id)
        .eq("following_id", creatorId)
        .maybeSingle();
      return !!data;
    },
    enabled: !!user && !!creatorId,
  });
}

export function useToggleFollow() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ creatorId, isFollowing }: { creatorId: string; isFollowing: boolean }) => {
      if (!user) throw new Error("Must be logged in");
      if (isFollowing) {
        await supabase
          .from("follows" as any)
          .delete()
          .eq("follower_id", user.id)
          .eq("following_id", creatorId);
      } else {
        await supabase.from("follows" as any).insert({
          follower_id: user.id,
          following_id: creatorId,
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["following"] });
      queryClient.invalidateQueries({ queryKey: ["is_following"] });
    },
  });
}

export function useLikeVideo() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ videoId, isLiked }: { videoId: string; isLiked: boolean }) => {
      if (!user) throw new Error("Must be logged in");
      if (isLiked) {
        await supabase
          .from("likes" as any)
          .delete()
          .eq("user_id", user.id)
          .eq("video_id", videoId);
      } else {
        await supabase.from("likes" as any).insert({
          user_id: user.id,
          video_id: videoId,
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user_likes"] });
      queryClient.invalidateQueries({ queryKey: ["videos"] });
    },
  });
}

export function useUserLikes() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["user_likes", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data } = await supabase
        .from("likes" as any)
        .select("video_id")
        .eq("user_id", user.id);
      return ((data as any[]) ?? []).map((l: any) => l.video_id as string);
    },
    enabled: !!user,
  });
}

export function useCategories() {
  return useQuery({
    queryKey: ["categories"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("categories" as any)
        .select("*")
        .eq("active", true)
        .order("sort_order");
      if (error) throw error;
      return (data as any[]) ?? [];
    },
  });
}
