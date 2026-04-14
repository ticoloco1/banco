import { Heart, Zap, UserPlus, UserCheck } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useLikeVideo, useUserLikes, useIsFollowing, useToggleFollow } from "@/hooks/useSocial";
import { useBoostVideo } from "@/hooks/useBoosts";
import { toast } from "sonner";

interface Props {
  videoId: string;
  creatorId: string | null;
  boostCount?: number;
}

const VideoActions = ({ videoId, creatorId, boostCount = 0 }: Props) => {
  const { user } = useAuth();
  const { data: likedVideos } = useUserLikes();
  const { data: isFollowing } = useIsFollowing(creatorId);
  const likeMutation = useLikeVideo();
  const followMutation = useToggleFollow();
  const boostMutation = useBoostVideo();

  const isLiked = likedVideos?.includes(videoId) ?? false;

  const handleLike = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!user) return toast.error("Connect wallet to like");
    likeMutation.mutate({ videoId, isLiked });
  };

  const handleFollow = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!user || !creatorId) return toast.error("Connect wallet to follow");
    followMutation.mutate({ creatorId, isFollowing: isFollowing ?? false });
  };

  const handleBoost = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!user) return toast.error("Connect wallet to boost");
    boostMutation.mutate(
      { videoId, userId: user.id, amount: 0.5 },
      {
        onSuccess: () => toast.success("🚀 Boosted! 0.50 USDC"),
        onError: (err) => toast.error(err.message),
      }
    );
  };

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={handleLike}
        className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
          isLiked ? "bg-destructive/10 text-destructive" : "bg-secondary text-muted-foreground hover:text-destructive"
        }`}
      >
        <Heart className={`w-4 h-4 ${isLiked ? "fill-current" : ""}`} />
      </button>

      <button
        onClick={handleBoost}
        disabled={boostMutation.isPending}
        className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold font-mono bg-black text-[#39FF14] hover:bg-black/80 transition-colors"
      >
        <Zap className="w-4 h-4" />
        {boostCount > 0 && <span>{boostCount}</span>}
      </button>

      {creatorId && user?.id !== creatorId && (
        <button
          onClick={handleFollow}
          className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
            isFollowing ? "bg-primary/10 text-primary" : "bg-secondary text-muted-foreground hover:text-primary"
          }`}
        >
          {isFollowing ? <UserCheck className="w-4 h-4" /> : <UserPlus className="w-4 h-4" />}
        </button>
      )}
    </div>
  );
};

export default VideoActions;
