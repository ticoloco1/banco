"use client";

import { useState } from "react";
import SEO from "@/components/SEO";
import Header from "@/components/Header";
import { useAuth } from "@/hooks/useAuth";
import { useCreatorVideos, usePublishVideo, useIssueShares } from "@/hooks/useCreatorVideos";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSettings } from "@/hooks/useSettings";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Lock, ArrowLeft, Eye, TrendingUp, AlertTriangle, Video, Shield, Camera, ImagePlus, Pencil } from "lucide-react";
import { toast } from "sonner";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle
} from "@/components/ui/alert-dialog";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Input } from "@/components/ui/input";

const statusColors: Record<string, string> = {
  draft: "bg-muted text-muted-foreground",
  live: "bg-primary/10 text-primary",
  locked: "bg-destructive/10 text-destructive",
};

const statusLabels: Record<string, string> = {
  draft: "DRAFT",
  live: "LIVE",
  locked: "LOCKED",
};

/* ─── Channel Banner + Profile Header ─── */
const ChannelHeader = ({ user }: { user: any }) => {
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState(false);
  const [displayName, setDisplayName] = useState("");

  const { data: profile } = useQuery({
    queryKey: ["my-profile", user.id],
    queryFn: async () => {
      const { data } = await supabase.from("profiles").select("*").eq("user_id", user.id).single();
      return data;
    },
  });

  const { data: followerCount } = useQuery({
    queryKey: ["my-followers", user.id],
    queryFn: async () => {
      const { count } = await supabase.from("follows").select("*", { count: "exact", head: true }).eq("following_id", user.id);
      return count || 0;
    },
  });

  const updateProfile = useMutation({
    mutationFn: async (updates: Record<string, any>) => {
      const { error } = await supabase.from("profiles").update(updates).eq("user_id", user.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["my-profile"] });
      toast.success("Profile updated!");
    },
  });

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Apenas imagens.");
      return;
    }
    try {
      const ext = file.name.split(".").pop() || "jpg";
      const path = `${user.id}/profile/avatar.${ext}`;
      const { error: upErr } = await supabase.storage.from("platform-assets").upload(path, file, { upsert: true });
      if (upErr) throw upErr;
      const { data } = supabase.storage.from("platform-assets").getPublicUrl(path);
      updateProfile.mutate({ avatar_url: data.publicUrl });
      toast.success("Avatar enviado ao Storage.");
    } catch (err: any) {
      toast.error(err?.message ?? "Falha no upload.");
    }
    e.target.value = "";
  };

  const handleBannerUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Apenas imagens.");
      return;
    }
    try {
      const ext = file.name.split(".").pop() || "jpg";
      const path = `${user.id}/profile/banner.${ext}`;
      const { error: upErr } = await supabase.storage.from("platform-assets").upload(path, file, { upsert: true });
      if (upErr) throw upErr;
      const { data } = supabase.storage.from("platform-assets").getPublicUrl(path);
      updateProfile.mutate({ banner_url: data.publicUrl });
      toast.success("Banner enviado ao Storage.");
    } catch (err: any) {
      toast.error(err?.message ?? "Falha no upload.");
    }
    e.target.value = "";
  };

  const handleSaveName = () => {
    if (displayName.trim()) {
      updateProfile.mutate({ display_name: displayName.trim() });
    }
    setEditing(false);
  };

  const initial = profile?.display_name?.[0]?.toUpperCase() || "C";

  return (
    <div className="bg-card border-b border-border">
      {/* Banner */}
      <div className="relative h-36 sm:h-48 bg-gradient-to-r from-primary/30 via-primary/10 to-accent/20 overflow-hidden group">
        {(profile as any)?.banner_url && (
          <img src={(profile as any).banner_url} alt="" className="w-full h-full object-cover" />
        )}
        <label className="absolute bottom-3 right-3 bg-background/80 backdrop-blur-sm border border-border rounded-full p-2 cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity">
          <ImagePlus className="w-4 h-4 text-foreground" />
          <input type="file" accept="image/*" className="hidden" onChange={handleBannerUpload} />
        </label>
      </div>

      {/* Profile Info */}
      <div className="max-w-5xl mx-auto px-6 -mt-12 pb-4">
        <div className="flex items-end gap-4">
          {/* Avatar */}
          <div className="relative group shrink-0">
            {profile?.avatar_url ? (
              <img src={profile.avatar_url} alt="" className="w-24 h-24 rounded-full object-cover border-4 border-background shadow-lg" />
            ) : (
              <div className="w-24 h-24 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-3xl font-bold border-4 border-background shadow-lg">
                {initial}
              </div>
            )}
            <label className="absolute bottom-0 right-0 bg-background border border-border rounded-full p-1.5 cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity shadow-sm">
              <Camera className="w-3.5 h-3.5 text-foreground" />
              <input type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} />
            </label>
          </div>

          {/* Name + Stats */}
          <div className="flex-1 min-w-0 pb-1">
            <div className="flex items-center gap-2">
              {editing ? (
                <div className="flex items-center gap-2">
                  <Input
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    className="h-8 text-sm w-48"
                    placeholder="Channel name"
                    autoFocus
                    onKeyDown={(e) => e.key === "Enter" && handleSaveName()}
                  />
                  <button onClick={handleSaveName} className="text-xs text-primary font-bold">Save</button>
                  <button onClick={() => setEditing(false)} className="text-xs text-muted-foreground">Cancel</button>
                </div>
              ) : (
                <>
                  <h1 className="text-xl font-extrabold text-foreground truncate">
                    {profile?.display_name || "My Channel"}
                  </h1>
                  <button
                    onClick={() => { setDisplayName(profile?.display_name || ""); setEditing(true); }}
                    className="text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
                </>
              )}
            </div>
            <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
              <span className="font-mono">{user.email}</span>
              <span>•</span>
              <span>{followerCount} followers</span>
              {profile?.kyc_verified && (
                <>
                  <span>•</span>
                  <span className="text-[hsl(var(--ticker-up))] font-bold">✓ Verified</span>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

/* ─── Video Table ─── */
const Channel = () => {
  const router = useRouter();
  const { user, loading } = useAuth();
  const { data: videos, isLoading } = useCreatorVideos();
  const { data: settings } = useSettings();
  const publishMutation = usePublishVideo();
  const issueSharesMutation = useIssueShares();
  const [shareConfirmId, setShareConfirmId] = useState<string | null>(null);
  const [shareConfirmVideo, setShareConfirmVideo] = useState<any>(null);

  const multiplier = settings?.valuation_multiplier ?? 50;

  if (loading) return <div className="min-h-screen bg-background"><Header /><div className="flex items-center justify-center py-20 text-muted-foreground text-sm">Loading...</div></div>;
  if (!user) {
    router.replace("/auth");
    return null;
  }

  const handlePublish = async (id: string) => {
    try {
      await publishMutation.mutateAsync(id);
      toast.success("Video is now LIVE!");
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  const handleIssueShares = async () => {
    if (!shareConfirmId) return;
    try {
      await issueSharesMutation.mutateAsync(shareConfirmId);
      toast.success("Shares issued! Video is now LOCKED and immutable on Polygon.");
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setShareConfirmId(null);
      setShareConfirmVideo(null);
    }
  };

  const openShareConfirm = (video: any) => {
    setShareConfirmId(video.id);
    setShareConfirmVideo(video);
  };

  return (
    <div className="min-h-screen bg-background">
      <SEO title="My Channel" description="Manage your creator channel on HASHPO — view your content, shares and analytics." noIndex />
      <Header />

      {/* YouTube-style Channel Header */}
      <ChannelHeader user={user} />

      <AlertDialog open={!!shareConfirmId} onOpenChange={(o) => !o && setShareConfirmId(null)}>
        <AlertDialogContent className="max-w-lg">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="w-5 h-5" />
              ⚠️ Issue Shares — IRREVERSIBLE ACTION
            </AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-3 text-sm">
                <p className="font-bold text-destructive">
                  Issuing shares is irreversible. This video will become permanent and immutable.
                  You will permanently retain locked equity and cannot fully exit this asset.
                </p>
                {shareConfirmVideo && (
                  <div className="bg-secondary rounded-lg p-3 space-y-1 text-xs">
                    <p><strong>Title:</strong> {shareConfirmVideo.title}</p>
                    <p><strong>Ticker:</strong> <span className="font-mono">{shareConfirmVideo.ticker}</span></p>
                    <p><strong>Estimated Valuation:</strong> <span className="font-mono text-primary">${(shareConfirmVideo.revenue * multiplier).toLocaleString("en-US", { minimumFractionDigits: 2 })}</span></p>
                  </div>
                )}
                <div className="bg-secondary rounded-lg p-3 space-y-1 text-xs">
                  <p className="font-bold text-foreground">Share Distribution (Fixed & Immutable):</p>
                  <p>• <strong>Total Supply:</strong> 1,000 shares</p>
                  <p>• <strong>Market Float:</strong> 600 shares (60%) — tradable</p>
                  <p>• <strong>Creator Locked Equity:</strong> 350 shares (35%) — <span className="text-destructive font-bold">NON-TRANSFERABLE, cannot be sold or burned</span></p>
                  <p>• <strong>Platform Reserve (HASHPO):</strong> 50 shares (5%) — permanent</p>
                </div>
                <p className="text-xs font-bold">Once shares are issued:</p>
                <ul className="text-xs list-disc ml-4 space-y-1">
                  <li>Video metadata becomes <strong>permanently locked on Polygon</strong></li>
                  <li>You <strong>cannot edit, delete, replace, or unlist</strong> the video</li>
                  <li>You may only sell up to <strong>600 shares</strong> (market float)</li>
                  <li>Your 35% locked equity ensures permanent economic exposure</li>
                  <li>No annual fee after issuance — video can <strong>never be removed</strong></li>
                  <li>Distributing the full video free externally to harm paywall is prohibited</li>
                </ul>
                <p className="text-[10px] text-destructive font-semibold">
                  ⚠️ Issuing shares early may undervalue your video. This action cannot be undone.
                </p>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel — Keep as LIVE</AlertDialogCancel>
            <AlertDialogAction onClick={handleIssueShares} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              I Understand — Issue Shares Permanently
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <div className="max-w-5xl mx-auto p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Video className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-extrabold text-foreground uppercase tracking-wide">Channel Content</h2>
          </div>
          <Link href="/studio" className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground font-bold text-xs rounded-md hover:bg-primary/90 transition-colors">
            + Upload Video
          </Link>
        </div>

        {isLoading ? (
          <div className="text-center py-10 text-muted-foreground text-sm">Loading your videos...</div>
        ) : !videos?.length ? (
          <div className="text-center py-20 space-y-3">
            <Video className="w-12 h-12 text-muted-foreground mx-auto" />
            <p className="text-sm text-muted-foreground">No videos yet. Start uploading!</p>
            <Link href="/studio" className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground font-bold text-xs rounded-md">
              Upload First Video
            </Link>
          </div>
        ) : (
          <div className="bg-card border border-border rounded-lg overflow-hidden">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-border bg-secondary/50">
                  <th className="text-left px-4 py-3 font-bold text-muted-foreground uppercase tracking-wider">Video</th>
                  <th className="text-left px-4 py-3 font-bold text-muted-foreground uppercase tracking-wider">Status</th>
                  <th className="text-right px-4 py-3 font-bold text-muted-foreground uppercase tracking-wider">Valuation</th>
                  <th className="text-right px-4 py-3 font-bold text-muted-foreground uppercase tracking-wider">Revenue</th>
                  <th className="text-center px-4 py-3 font-bold text-muted-foreground uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody>
                {videos.map((v: any) => {
                  const status = v.status || (v.shares_issued ? "locked" : "draft");
                  const valuation = v.revenue * multiplier;
                  return (
                    <tr key={v.id} className="border-b border-border last:border-0 hover:bg-secondary/30 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-16 h-9 rounded bg-muted overflow-hidden shrink-0">
                            {v.thumbnail_url && <img src={v.thumbnail_url} alt="" className="w-full h-full object-cover" />}
                          </div>
                          <div>
                            <p className="font-bold text-foreground line-clamp-1">{v.title}</p>
                            <p className="text-[10px] text-muted-foreground font-mono">{v.ticker}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <Tooltip>
                          <TooltipTrigger>
                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold ${statusColors[status] || statusColors.draft}`}>
                              {status === "locked" && <Lock className="w-3 h-3" />}
                              {statusLabels[status] || "DRAFT"}
                            </span>
                          </TooltipTrigger>
                          <TooltipContent>
                            {status === "draft" && "Not published yet. Publish to go LIVE."}
                            {status === "live" && "Video is live. You can issue shares to enter the market."}
                            {status === "locked" && "Permanently immutable. Shares issued on Polygon."}
                          </TooltipContent>
                        </Tooltip>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Tooltip>
                          <TooltipTrigger>
                            <span className="font-mono font-bold text-primary">${valuation.toLocaleString("en-US", { minimumFractionDigits: 2 })}</span>
                          </TooltipTrigger>
                          <TooltipContent className="max-w-xs">
                            <p className="text-xs">Automatic valuation = Revenue × {multiplier}x multiplier.</p>
                          </TooltipContent>
                        </Tooltip>
                        {status !== "locked" && <p className="text-[9px] text-muted-foreground italic">Shadow valuation</p>}
                      </td>
                      <td className="px-4 py-3 text-right font-mono text-foreground">${v.revenue.toFixed(2)}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-center gap-2">
                          {status === "draft" && (
                            <button onClick={() => handlePublish(v.id)} className="px-3 py-1 bg-primary text-primary-foreground font-bold text-[10px] rounded hover:bg-primary/90 transition-colors">
                              Publish
                            </button>
                          )}
                          {status === "live" && (
                            <button onClick={() => openShareConfirm(v)} className="px-3 py-1 bg-foreground text-background font-bold text-[10px] rounded hover:opacity-90 transition-opacity">
                              Issue Shares
                            </button>
                          )}
                          {status === "locked" && (
                            <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                              <Shield className="w-3 h-3" /> Immutable
                            </span>
                          )}
                          <Link href={`/video/${v.id}`} className="text-[10px] text-primary hover:underline flex items-center gap-0.5">
                            <Eye className="w-3 h-3" /> View
                          </Link>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default Channel;
