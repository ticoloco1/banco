import { useParams, Link } from "react-router-dom";
import SEO from "@/components/SEO";
import { useMemo } from "react";
import Header from "@/components/Header";
import AssetCard from "@/components/AssetCard";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useCollections } from "@/hooks/useCollections";
import { ArrowLeft, User, Video, Users } from "lucide-react";

const CreatorProfile = () => {
  const { id } = useParams<{ id: string }>();

  const { data: profile, isLoading: profileLoading } = useQuery({
    queryKey: ["creator-profile", id],
    queryFn: async () => {
      const { data } = await supabase.from("profiles").select("*").eq("user_id", id!).single();
      return data;
    },
    enabled: !!id,
  });

  const { data: videos } = useQuery({
    queryKey: ["creator-videos", id],
    queryFn: async () => {
      const { data } = await supabase.from("videos").select("*").eq("creator_id", id!).eq("blocked", false).order("created_at", { ascending: false });
      return data || [];
    },
    enabled: !!id,
  });

  const { data: followerCount } = useQuery({
    queryKey: ["creator-followers", id],
    queryFn: async () => {
      const { count } = await supabase.from("follows").select("*", { count: "exact", head: true }).eq("following_id", id!);
      return count || 0;
    },
    enabled: !!id,
  });

  const { data: collections } = useCollections();
  const nftMap = useMemo(() => {
    const map = new Map<string, any>();
    (collections || []).forEach((c: any) => {
      if (c.video_id) map.set(c.video_id, c);
    });
    return map;
  }, [collections]);

  if (profileLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="flex items-center justify-center py-20 text-muted-foreground text-sm">Loading...</div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="flex items-center justify-center py-20 text-muted-foreground text-sm">Creator not found</div>
      </div>
    );
  }

  const initial = profile.display_name?.[0]?.toUpperCase() || "C";

  return (
    <div className="min-h-screen bg-background">
      <SEO title={`${profile.display_name || "Creator"} Profile`} description={`View ${profile.display_name || "this creator"}'s content portfolio and shares on HASHPO.`} />
      <Header />
      <div className="max-w-5xl mx-auto p-6 space-y-6">
        <Link to="/" className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Exchange
        </Link>

        {/* Profile Header */}
        <div className="bg-card border border-border rounded-lg p-6 flex items-center gap-6">
          {profile.avatar_url ? (
            <img src={profile.avatar_url} alt="" className="w-20 h-20 rounded-full object-cover border-2 border-primary" />
          ) : (
            <div className="w-20 h-20 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-2xl font-bold">
              {initial}
            </div>
          )}
          <div className="space-y-2">
            <h1 className="text-xl font-extrabold text-foreground">{profile.display_name || "Creator"}</h1>
            {profile.wallet_address && (
              <p className="text-xs font-mono text-muted-foreground">
                {profile.wallet_address.slice(0, 8)}...{profile.wallet_address.slice(-6)}
              </p>
            )}
            <div className="flex items-center gap-4 text-xs">
              <span className="flex items-center gap-1 text-muted-foreground">
                <Video className="w-3.5 h-3.5" /> {(videos || []).length} videos
              </span>
              <span className="flex items-center gap-1 text-muted-foreground">
                <Users className="w-3.5 h-3.5" /> {followerCount} followers
              </span>
            </div>
            {profile.kyc_verified && (
              <span className="inline-flex items-center gap-1 text-[10px] bg-[hsl(var(--ticker-up))]/20 text-[hsl(var(--ticker-up))] px-2 py-0.5 rounded font-bold">
                ✓ KYC Verified
              </span>
            )}
          </div>
        </div>

        {/* Videos Grid */}
        <div className="space-y-3">
          <h2 className="text-sm font-bold text-foreground uppercase flex items-center gap-2">
            <Video className="w-4 h-4 text-primary" />
            Published Content ({(videos || []).length})
          </h2>
          {(videos || []).length === 0 ? (
            <p className="text-xs text-muted-foreground py-8 text-center">No videos published yet.</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {(videos || []).map((video: any) => (
                <AssetCard key={video.id} video={video} nftCollection={nftMap.get(video.id)} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CreatorProfile;
