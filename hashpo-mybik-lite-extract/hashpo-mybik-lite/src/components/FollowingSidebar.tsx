import { useFollowing } from "@/hooks/useSocial";
import { useAuth } from "@/hooks/useAuth";
import { Users } from "lucide-react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

const FollowingSidebar = () => {
  const { user } = useAuth();
  const { data: following } = useFollowing();

  const followingIds = following?.map((f: any) => f.following_id) ?? [];

  const { data: profiles } = useQuery({
    queryKey: ["following_profiles", followingIds],
    queryFn: async () => {
      if (followingIds.length === 0) return [];
      const { data } = await supabase
        .from("profiles")
        .select("user_id, display_name, avatar_url, wallet_address")
        .in("user_id", followingIds);
      return data ?? [];
    },
    enabled: followingIds.length > 0,
  });

  if (!user) {
    return (
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Users className="w-4 h-4 text-muted-foreground" />
          <h2 className="text-xs font-extrabold text-foreground uppercase tracking-wider font-mono">
            Following
          </h2>
        </div>
        <p className="text-[10px] text-muted-foreground">Connect wallet to follow creators</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Users className="w-4 h-4 text-primary" />
        <h2 className="text-xs font-extrabold text-foreground uppercase tracking-wider font-mono">
          Following
        </h2>
        <span className="text-[9px] font-mono text-muted-foreground">({followingIds.length})</span>
      </div>

      {followingIds.length === 0 ? (
        <p className="text-[10px] text-muted-foreground">Follow creators to see them here</p>
      ) : (
        <div className="space-y-1.5">
          {profiles?.map((p) => (
            <Link
              key={p.user_id}
              to={`/channel?creator=${p.user_id}`}
              className="flex items-center gap-2 p-1.5 rounded-md hover:bg-secondary transition-colors"
            >
              <div className="w-7 h-7 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-[10px] font-bold flex-shrink-0 overflow-hidden">
                {p.avatar_url ? (
                  <img src={p.avatar_url} className="w-full h-full object-cover" />
                ) : (
                  (p.display_name?.[0] ?? "?").toUpperCase()
                )}
              </div>
              <div className="min-w-0">
                <p className="text-[11px] font-bold text-foreground truncate">{p.display_name || "Anon"}</p>
                {p.wallet_address && (
                  <p className="text-[8px] font-mono text-muted-foreground truncate">
                    {p.wallet_address.slice(0, 6)}...{p.wallet_address.slice(-4)}
                  </p>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};

export default FollowingSidebar;
