import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useBoostVideo, BOOST_TIERS, useVideoBoostProgress, HOME_THRESHOLD, COST_PER_POSITION } from "@/hooks/useBoosts";
import { Rocket, Home, Zap, TrendingUp } from "lucide-react";
import { toast } from "sonner";
import { Progress } from "@/components/ui/progress";

interface BoostPanelProps {
  videoId: string;
  videoTitle?: string;
  compact?: boolean;
}

const BoostPanel = ({ videoId, videoTitle, compact = false }: BoostPanelProps) => {
  const { user } = useAuth();
  const boostMutation = useBoostVideo();
  const { data: progress } = useVideoBoostProgress(videoId);
  const [selectedTier, setSelectedTier] = useState<number | null>(null);

  const handleBoost = (amount: number) => {
    if (!user) return toast.error("Sign in to boost");
    boostMutation.mutate(
      { videoId, userId: user.id, amount },
      {
        onSuccess: (result) => {
          if (result.isInHome) {
            toast.success(`🏠 Video is now on the HOME PAGE! Rank #${result.newRank}`);
          } else {
            toast.success(`🚀 Boosted $${amount.toFixed(2)}! New rank: #${result.newRank}`);
          }
          setSelectedTier(null);
        },
        onError: (err) => toast.error(err.message),
      }
    );
  };

  if (compact) {
    return (
      <div className="space-y-2">
        {/* Progress bar */}
        <div className="flex items-center gap-2">
          <Home className="w-3.5 h-3.5 text-accent" />
          <div className="flex-1">
            <Progress value={progress?.progress ?? 0} className="h-2.5" />
          </div>
          <span className="text-[10px] font-mono font-black text-muted-foreground">
            {progress?.isInHome ? "🏠 HOME" : `$${(progress?.remaining ?? 0).toFixed(0)} left`}
          </span>
        </div>
        {/* Compact tier buttons */}
        <div className="grid grid-cols-3 gap-1.5">
          {BOOST_TIERS.slice(0, 6).map((tier) => (
            <button
              key={tier}
              onClick={() => handleBoost(tier)}
              disabled={boostMutation.isPending}
              className={`py-2 rounded-xl text-xs font-black transition-all hover:scale-105 active:scale-95 disabled:opacity-50 ${
                tier >= 1000
                  ? "bg-accent text-accent-foreground col-span-3"
                  : "bg-secondary text-foreground hover:bg-primary hover:text-primary-foreground"
              }`}
            >
              ${tier >= 1000 ? "1,000 🏠" : tier}
            </button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-2">
        <Rocket className="w-5 h-5 text-accent" />
        <h3 className="text-sm font-black text-foreground uppercase">Boost to Home Page</h3>
      </div>

      {/* Progress to home */}
      <div className="bg-secondary rounded-2xl p-4 space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-muted-foreground">Progress to Home</span>
          <span className="text-xs font-black font-mono text-foreground">
            Rank #{progress?.rank ?? "—"}
          </span>
        </div>
        <Progress value={progress?.progress ?? 0} className="h-4" />
        <div className="flex items-center justify-between text-[10px] font-mono">
          <span className="text-muted-foreground">
            ${(progress?.totalSpent ?? 0).toFixed(2)} spent
          </span>
          {progress?.isInHome ? (
            <span className="text-accent font-black flex items-center gap-1">
              <Home className="w-3 h-3" /> ON HOME PAGE
            </span>
          ) : (
            <span className="text-primary font-bold">
              ${(progress?.remaining ?? 0).toFixed(2)} to top {HOME_THRESHOLD}
            </span>
          )}
        </div>
        <p className="text-[9px] text-muted-foreground">
          Each ${COST_PER_POSITION.toFixed(2)} moves 1 position up • Anyone can boost
        </p>
      </div>

      {/* Tier grid */}
      <div className="grid grid-cols-3 gap-2">
        {BOOST_TIERS.map((tier) => {
          const positions = Math.floor(tier / COST_PER_POSITION);
          const isDirectHome = tier >= 1000;
          return (
            <button
              key={tier}
              onClick={() => handleBoost(tier)}
              disabled={boostMutation.isPending}
              className={`relative py-3.5 rounded-2xl font-black transition-all hover:scale-105 active:scale-95 disabled:opacity-50 ${
                isDirectHome
                  ? "col-span-3 bg-accent text-accent-foreground text-lg"
                  : tier >= 100
                    ? "bg-primary text-primary-foreground text-sm"
                    : "bg-secondary text-foreground hover:bg-primary hover:text-primary-foreground text-sm"
              }`}
              style={isDirectHome ? { boxShadow: "0 6px 20px hsl(155 70% 43% / 0.35)" } : undefined}
            >
              <span className="block">${tier >= 1000 ? "1,000" : tier}</span>
              <span className="block text-[9px] font-bold opacity-70">
                {isDirectHome ? "🏠 DIRECT TO HOME • 7 days" : `+${positions} positions`}
              </span>
            </button>
          );
        })}
      </div>

      {/* Info */}
      {progress?.isInHome && progress.homeExpiresAt && (
        <div className="bg-accent/10 border border-accent/30 rounded-xl p-3 text-xs">
          <div className="flex items-center gap-1.5 font-black text-accent">
            <Zap className="w-3.5 h-3.5" />
            On Home Page
          </div>
          <p className="text-muted-foreground mt-1">
            Expires: {new Date(progress.homeExpiresAt).toLocaleDateString()} •
            Pay $100/day to maintain after expiry
          </p>
        </div>
      )}
    </div>
  );
};

export default BoostPanel;
