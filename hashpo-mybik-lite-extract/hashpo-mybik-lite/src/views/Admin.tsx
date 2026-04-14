import { useState, useEffect, useMemo, useCallback, lazy, Suspense } from "react";
import SEO from "@/components/SEO";
import Header from "@/components/Header";

// Lazy-loaded admin tabs with error boundaries
const AdminTradingFees = lazy(() => import("@/components/admin/AdminTradingFees").catch(() => ({ default: () => <ErrorTab name="Trading Fees" /> })));
const AdminIndexDerivatives = lazy(() => import("@/components/admin/AdminIndexDerivatives").catch(() => ({ default: () => <ErrorTab name="Index & Derivatives" /> })));
const AdminBranding = lazy(() => import("@/components/admin/AdminBranding").catch(() => ({ default: () => <ErrorTab name="Branding" /> })));
const AdminRevenueSplits = lazy(() => import("@/components/admin/AdminRevenueSplits").catch(() => ({ default: () => <ErrorTab name="Revenue Splits" /> })));
const AdminMiniSites = lazy(() => import("@/components/admin/AdminMiniSites").catch(() => ({ default: () => <ErrorTab name="Mini-Sites" /> })));
const AdminApiKeys = lazy(() => import("@/components/admin/AdminApiKeys").catch(() => ({ default: () => <ErrorTab name="API Keys" /> })));
const AdminCopyright = lazy(() => import("@/components/admin/AdminCopyright").catch(() => ({ default: () => <ErrorTab name="Copyright" /> })));
const AdminPremiumSlugs = lazy(() => import("@/components/admin/AdminPremiumSlugs").catch(() => ({ default: () => <ErrorTab name="Premium Slugs" /> })));

import { useAuth } from "@/hooks/useAuth";
import { useSettings, useUpdateSettings } from "@/hooks/useSettings";
import { useAdminVideos, useUpdateVideo } from "@/hooks/useAdminVideos";
import { useAdminReports, useResolveReport, useFlaggedVideos } from "@/hooks/useAdminReports";
import { categories } from "@/data/mockDatabase";
import { useJackpotPool } from "@/hooks/useBoosts";
import { useAllAds } from "@/hooks/useAds";
import {
  Star, Ban, BarChart3, DollarSign, Percent, Lock, ShieldAlert, Coins,
  Flag, AlertTriangle, CheckCircle, Trash2, Eye, UserPlus, UserX, Shield,
  Palette, Activity, Users, TrendingUp, Video, Megaphone, Edit3, Gift, Grid3X3, Globe,
  Zap, Trophy, Wallet, Flame, Brain, Power, Megaphone as MegaphoneIcon, Image, Key, Crown, ChevronDown
} from "lucide-react";
import { Navigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

// Error fallback component for broken tabs
const ErrorTab = ({ name }: { name: string }) => (
  <div className="border border-destructive/30 rounded-lg p-6 bg-destructive/5 text-center space-y-2">
    <AlertTriangle className="w-6 h-6 text-destructive mx-auto" />
    <p className="text-sm font-bold text-destructive">Erro ao carregar "{name}"</p>
    <p className="text-xs text-muted-foreground">Este componente não pôde ser carregado. Verifique o console para detalhes.</p>
  </div>
);

// Loading fallback for Suspense
const TabLoading = () => (
  <div className="flex items-center justify-center py-12 text-muted-foreground text-sm gap-2">
    <div className="w-4 h-4 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
    Carregando...
  </div>
);

const Admin = () => {
  const { user, isAdmin, loading: authLoading } = useAuth();
  const { data: settings, isLoading: settingsLoading } = useSettings();
  const updateSettings = useUpdateSettings();
  const [categoryFilter, setCategoryFilter] = useState<string | null>(null);
  const { data: videos, isLoading: videosLoading } = useAdminVideos(categoryFilter);
  const updateVideo = useUpdateVideo();
  const { data: reports } = useAdminReports();
  const resolveReport = useResolveReport();
  const { data: flaggedVideos } = useFlaggedVideos();
  const [newAdminEmail, setNewAdminEmail] = useState("");
  const [addingAdmin, setAddingAdmin] = useState(false);
  const [admins, setAdmins] = useState<any[]>([]);
  const [adminsLoading, setAdminsLoading] = useState(false);
  const jackpotPool = useJackpotPool();
  const [triggeringJackpot, setTriggeringJackpot] = useState(false);
  const [boostRace, setBoostRace] = useState<any[]>([]);
  const [boostRaceLoading, setBoostRaceLoading] = useState(false);
  const [masterWallet, setMasterWallet] = useState<{ totalPlatform: number; totalBoosts: number; totalTickets: number } | null>(null);
  const [aiSettings, setAiSettings] = useState<any>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const { data: allAds } = useAllAds();
  const [activeTab, setActiveTab] = useState("analytics");

  const [winnerCount, setWinnerCount] = useState(1);
  const [winnerPcts, setWinnerPcts] = useState<number[]>([100, 0, 0, 0, 0, 0, 0, 0, 0, 0]);
  const [analytics, setAnalytics] = useState<{
    totalRevenue: number; totalVideos: number; totalUsers: number;
    featuredCount: number; blockedCount: number; avgPrice: number;
    topCategories: { name: string; count: number; revenue: number }[];
  } | null>(null);
  const [editingVideoId, setEditingVideoId] = useState<string | null>(null);
  const [editPaywall, setEditPaywall] = useState(0);
  const [editSharePrice, setEditSharePrice] = useState(0);
  const [broadcastMsg, setBroadcastMsg] = useState("");

  const loadAdmins = async () => {
    setAdminsLoading(true);
    const { data } = await supabase.from("user_roles" as any).select("*").eq("role", "admin");
    if (data) {
      const enriched = await Promise.all((data as any[]).map(async (r: any) => {
        const { data: profile } = await supabase.from("profiles").select("display_name").eq("user_id", r.user_id).single();
        return { ...r, display_name: profile?.display_name || r.user_id };
      }));
      setAdmins(enriched);
    }
    setAdminsLoading(false);
  };

  const loadAnalytics = async () => {
    const { data: allVideos } = await supabase.from("videos").select("*");
    const { data: profiles } = await supabase.from("profiles").select("id");
    if (allVideos) {
      const totalRevenue = allVideos.reduce((s, v) => s + (v.revenue || 0), 0);
      const avgPrice = allVideos.length > 0 ? allVideos.reduce((s, v) => s + (v.share_price || 0), 0) / allVideos.length : 0;
      const featuredCount = allVideos.filter(v => v.featured).length;
      const blockedCount = allVideos.filter(v => v.blocked).length;
      const catMap = new Map<string, { count: number; revenue: number }>();
      allVideos.forEach(v => {
        const e = catMap.get(v.category) || { count: 0, revenue: 0 };
        e.count++; e.revenue += v.revenue || 0;
        catMap.set(v.category, e);
      });
      const topCategories = Array.from(catMap.entries()).map(([name, d]) => ({ name, ...d })).sort((a, b) => b.revenue - a.revenue);
      setAnalytics({ totalRevenue, totalVideos: allVideos.length, totalUsers: profiles?.length || 0, featuredCount, blockedCount, avgPrice, topCategories });
    }
  };

  const handleAddAdmin = async () => {
    if (!newAdminEmail.trim()) return;
    setAddingAdmin(true);
    try {
      const { data: profiles } = await supabase.from("profiles").select("user_id, display_name").ilike("display_name", newAdminEmail.trim());
      const profile = profiles?.[0];
      if (!profile) { toast.error("User not found. They must sign up first."); return; }
      const { error } = await supabase.from("user_roles" as any).insert({ user_id: profile.user_id, role: "admin" } as any);
      if (error) { toast.error(error.message); return; }
      toast.success(`Admin added: ${profile.display_name}`);
      setNewAdminEmail(""); loadAdmins();
    } catch (e: any) { toast.error(e.message); } finally { setAddingAdmin(false); }
  };

  const handleRemoveAdmin = async (roleId: string, userId: string) => {
    if (userId === user?.id) { toast.error("You cannot remove yourself."); return; }
    if (!confirm("Remove admin access?")) return;
    await supabase.from("user_roles" as any).delete().eq("id", roleId);
    toast.success("Admin removed."); loadAdmins();
  };

  const handleEditVideoPrice = (video: any) => {
    setEditingVideoId(video.id); setEditPaywall(video.paywall_price); setEditSharePrice(video.share_price);
  };

  const handleSaveVideoPrice = async () => {
    if (!editingVideoId) return;
    const { error } = await supabase.from("videos").update({ paywall_price: editPaywall, share_price: editSharePrice } as any).eq("id", editingVideoId);
    if (error) toast.error(error.message); else toast.success("Prices updated!");
    setEditingVideoId(null);
  };

  const handleTriggerJackpot = async () => {
    if (!jackpotPool || jackpotPool.total_amount <= 0) { toast.error("Jackpot pool is empty!"); return; }
    const totalPct = winnerPcts.slice(0, winnerCount).reduce((s, p) => s + p, 0);
    if (Math.abs(totalPct - 100) > 0.01) { toast.error(`Winner percentages must total 100%. Current: ${totalPct}%`); return; }
    if (!confirm(`Draw jackpot of $${jackpotPool.total_amount.toFixed(2)} USDC among ${winnerCount} winner(s)?`)) return;
    setTriggeringJackpot(true);
    try {
      const { data: tickets } = await supabase.from("boost_tickets" as any).select("*").eq("drawn", false);
      if (!tickets || tickets.length === 0) { toast.error("No active tickets to draw!"); return; }
      const winAmount = jackpotPool.total_amount;
      const shuffled = [...tickets].sort(() => Math.random() - 0.5);
      const winners = shuffled.slice(0, Math.min(winnerCount, shuffled.length));
      for (let i = 0; i < winners.length; i++) {
        const winner = winners[i] as any;
        const amount = winAmount * (winnerPcts[i] / 100);
        const { data: wallet } = await supabase.from("wallets").select("balance").eq("user_id", winner.user_id).maybeSingle();
        if (wallet) { await supabase.from("wallets").update({ balance: wallet.balance + amount }).eq("user_id", winner.user_id); }
        else { await supabase.from("wallets").insert({ user_id: winner.user_id, balance: amount }); }
        await supabase.from("boost_tickets" as any).update({ won: true } as any).eq("id", winner.id);
      }
      await supabase.from("boost_tickets" as any).update({ drawn: true } as any).eq("drawn", false);
      await supabase.from("jackpot_pool" as any).update({ total_amount: 0, last_winner_id: (winners[0] as any).user_id, last_winner_amount: winAmount, last_drawn_at: new Date().toISOString() } as any).eq("id", 1);
      toast.success(`🎉 Jackpot drawn! $${winAmount.toFixed(2)} split among ${winners.length} winner(s)`);
    } catch (err: any) { toast.error(err.message || "Jackpot draw failed"); } finally { setTriggeringJackpot(false); }
  };

  const loadBoostRace = async () => {
    setBoostRaceLoading(true);
    const { data } = await supabase.from("videos").select("id, title, ticker, boost_count, thumbnail_url").gt("boost_count", 0).order("boost_count", { ascending: false }).limit(20);
    setBoostRace(data || []); setBoostRaceLoading(false);
  };

  const loadMasterWallet = async () => {
    const { data: boosts } = await supabase.from("boosts" as any).select("to_platform");
    const totalPlatform = (boosts || []).reduce((s: number, b: any) => s + Number(b.to_platform || 0), 0);
    const totalBoosts = (boosts || []).length;
    const { count: totalTickets } = await supabase.from("boost_tickets" as any).select("*", { count: "exact", head: true }).eq("drawn", false);
    setMasterWallet({ totalPlatform, totalBoosts, totalTickets: totalTickets || 0 });
  };

  const loadAiSettings = async () => {
    setAiLoading(true);
    const { data } = await supabase.from("ai_brain_settings" as any).select("*").eq("id", 1).single();
    if (data) setAiSettings(data); setAiLoading(false);
  };

  const updateAiSetting = async (key: string, value: any) => {
    await supabase.from("ai_brain_settings" as any).update({ [key]: value } as any).eq("id", 1);
    setAiSettings((prev: any) => prev ? { ...prev, [key]: value } : prev);
    toast.success(`AI setting updated: ${key}`);
  };

  const handleBroadcast = () => {
    if (!broadcastMsg.trim()) return;
    const broadcasts = JSON.parse(localStorage.getItem("admin_broadcasts") || "[]");
    broadcasts.unshift({ message: broadcastMsg, date: new Date().toISOString(), by: user?.email });
    localStorage.setItem("admin_broadcasts", JSON.stringify(broadcasts.slice(0, 50)));
    toast.success("Broadcast sent!"); setBroadcastMsg("");
  };

  const handleDeleteVideo = async (id: string) => {
    if (!confirm("Permanently delete this video?")) return;
    const { error } = await supabase.from("videos").delete().eq("id", id);
    if (error) toast.error(error.message); else toast.success("Video deleted.");
  };

  const handleClearReview = async (id: string) => {
    await supabase.from("videos").update({ under_review: false, report_count: 0 } as any).eq("id", id);
    toast.success("Review cleared.");
  };

  if (authLoading || settingsLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="flex items-center justify-center py-20 gap-2 text-muted-foreground text-sm">
          <div className="w-4 h-4 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
          Carregando painel...
        </div>
      </div>
    );
  }

  if (!user || !isAdmin) return <Navigate to="/" replace />;

  const pendingReports = (reports || []).filter((r: any) => !r.reviewed);

  // Tab groups for mobile collapsible menu
  const TAB_GROUPS = [
    {
      label: "Principal", tabs: [
        { value: "analytics", label: "Analytics", icon: <Activity className="w-3.5 h-3.5" />, onClick: loadAnalytics },
        { value: "settings", label: "Settings", icon: null },
        { value: "content", label: "Conteúdo", icon: <Video className="w-3.5 h-3.5" /> },
        { value: "admins", label: "Admins", icon: <Shield className="w-3.5 h-3.5" />, onClick: loadAdmins },
      ]
    },
    {
      label: "Moderação", tabs: [
        { value: "reports", label: `Reports${pendingReports.length > 0 ? ` (${pendingReports.length})` : ""}`, icon: <Flag className="w-3.5 h-3.5" /> },
        { value: "flagged", label: "Flagged", icon: <AlertTriangle className="w-3.5 h-3.5" /> },
        { value: "broadcast", label: "Broadcast", icon: <Megaphone className="w-3.5 h-3.5" /> },
        { value: "aibrain", label: "AI Brain", icon: <Brain className="w-3.5 h-3.5" />, onClick: loadAiSettings },
        { value: "copyright", label: "Copyright", icon: <ShieldAlert className="w-3.5 h-3.5" /> },
      ]
    },
    {
      label: "Finanças", tabs: [
        { value: "jackpot", label: "Jackpot", icon: <Zap className="w-3.5 h-3.5" />, onClick: loadMasterWallet },
        { value: "boostrace", label: "Boost Race", icon: <Flame className="w-3.5 h-3.5" />, onClick: loadBoostRace },
        { value: "masterwallet", label: "Wallet", icon: <Wallet className="w-3.5 h-3.5" />, onClick: loadMasterWallet },
        { value: "tradingfees", label: "Trading Fees", icon: <DollarSign className="w-3.5 h-3.5" /> },
        { value: "splits", label: "Revenue Splits", icon: <Percent className="w-3.5 h-3.5" /> },
        { value: "indexderivatives", label: "Index & Derivatives", icon: <TrendingUp className="w-3.5 h-3.5" /> },
      ]
    },
    {
      label: "Plataforma", tabs: [
        { value: "visual", label: "Visual", icon: <Palette className="w-3.5 h-3.5" /> },
        { value: "branding", label: "Branding", icon: <Palette className="w-3.5 h-3.5" /> },
        { value: "minisites", label: "Mini-Sites", icon: <Globe className="w-3.5 h-3.5" /> },
        { value: "premiumslugs", label: "Slugs Premium", icon: <Crown className="w-3.5 h-3.5" /> },
        { value: "apikeys", label: "API Keys", icon: <Key className="w-3.5 h-3.5" /> },
        { value: "adnetwork", label: "Ad Network", icon: <Image className="w-3.5 h-3.5" /> },
      ]
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      <SEO title="Governance" description="HASHPO platform governance and admin controls." noIndex />
      <Header />

      <div className="max-w-7xl mx-auto p-4 md:p-6 space-y-6">
        <div className="flex items-center gap-2">
          <ShieldAlert className="w-5 h-5 text-primary" />
          <h1 className="text-lg font-extrabold text-foreground uppercase tracking-wide">Master Admin Panel</h1>
          {pendingReports.length > 0 && (
            <span className="bg-destructive text-destructive-foreground text-[10px] font-bold px-2 py-0.5 rounded-full">
              {pendingReports.length} Reports
            </span>
          )}
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          {/* Desktop: grouped tab headers */}
          <div className="hidden md:block space-y-1">
            {TAB_GROUPS.map(group => (
              <div key={group.label} className="flex items-center gap-1 flex-wrap">
                <span className="text-[9px] font-bold text-muted-foreground uppercase w-16 shrink-0">{group.label}</span>
                <div className="flex flex-wrap gap-1">
                  {group.tabs.map(tab => (
                    <button
                      key={tab.value}
                      onClick={() => { setActiveTab(tab.value); tab.onClick?.(); }}
                      className={`flex items-center gap-1 text-[10px] font-bold px-2.5 py-1.5 rounded transition-colors ${
                        activeTab === tab.value
                          ? "bg-primary text-primary-foreground"
                          : "bg-secondary text-secondary-foreground hover:bg-muted"
                      }`}
                    >
                      {tab.icon}{tab.label}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Mobile: select dropdown */}
          <div className="md:hidden">
            <select
              value={activeTab}
              onChange={e => {
                const val = e.target.value;
                setActiveTab(val);
                const allTabs = TAB_GROUPS.flatMap(g => g.tabs);
                allTabs.find(t => t.value === val)?.onClick?.();
              }}
              className="w-full bg-secondary text-foreground border border-border rounded-lg px-3 py-2 text-sm font-medium"
            >
              {TAB_GROUPS.map(group => (
                <optgroup key={group.label} label={group.label}>
                  {group.tabs.map(tab => (
                    <option key={tab.value} value={tab.value}>{tab.label}</option>
                  ))}
                </optgroup>
              ))}
            </select>
          </div>

          {/* ─── ANALYTICS TAB ─── */}
          <TabsContent value="analytics">
            {!analytics ? (
              <div className="text-center py-10 text-muted-foreground text-sm">
                <button onClick={loadAnalytics} className="bg-primary text-primary-foreground px-4 py-2 rounded text-xs font-bold hover:bg-primary/90">
                  Carregar Analytics
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
                  <StatCard icon={<DollarSign className="w-4 h-4" />} label="Total Revenue" value={`$${analytics.totalRevenue.toLocaleString('en', { minimumFractionDigits: 2 })}`} />
                  <StatCard icon={<Video className="w-4 h-4" />} label="Total Videos" value={analytics.totalVideos.toString()} />
                  <StatCard icon={<Users className="w-4 h-4" />} label="Total Users" value={analytics.totalUsers.toString()} />
                  <StatCard icon={<Star className="w-4 h-4" />} label="Featured" value={analytics.featuredCount.toString()} />
                  <StatCard icon={<Ban className="w-4 h-4" />} label="Blocked" value={analytics.blockedCount.toString()} />
                  <StatCard icon={<TrendingUp className="w-4 h-4" />} label="Avg Price" value={`$${analytics.avgPrice.toFixed(2)}`} />
                </div>
                <div className="border border-border rounded-lg p-4 bg-card">
                  <h3 className="text-sm font-bold text-card-foreground uppercase mb-3">Revenue by Category</h3>
                  <div className="space-y-2">
                    {analytics.topCategories.map(cat => {
                      const maxRev = analytics.topCategories[0]?.revenue || 1;
                      return (
                        <div key={cat.name} className="flex items-center gap-3">
                          <span className="text-xs font-mono text-muted-foreground w-24 capitalize truncate">{cat.name}</span>
                          <div className="flex-1 bg-secondary rounded-full h-4 overflow-hidden">
                            <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${(cat.revenue / maxRev) * 100}%` }} />
                          </div>
                          <span className="text-xs font-mono font-bold text-foreground w-20 text-right">${cat.revenue.toLocaleString('en', { minimumFractionDigits: 0 })}</span>
                          <span className="text-[10px] text-muted-foreground w-12 text-right">{cat.count} vids</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}
          </TabsContent>

          {/* ─── SETTINGS TAB ─── */}
          <TabsContent value="settings">
            {settings && (
              <div className="space-y-4">
                <div className={`border-2 rounded-lg p-4 flex items-center justify-between ${(settings as any).trading_paused ? "border-destructive bg-destructive/5" : "border-accent bg-accent/5"}`}>
                  <div className="flex items-center gap-3">
                    <Power className={`w-6 h-6 ${(settings as any).trading_paused ? "text-destructive" : "text-accent"}`} />
                    <div>
                      <h3 className="text-sm font-black text-foreground uppercase">{(settings as any).trading_paused ? "⚠️ TRADING PAUSED" : "✅ TRADING ACTIVE"}</h3>
                      <p className="text-[10px] text-muted-foreground">Kill-switch for all buy/sell operations.</p>
                    </div>
                  </div>
                  <button onClick={() => updateSettings.mutate({ trading_paused: !(settings as any).trading_paused } as any)}
                    className={`px-6 py-3 rounded-full font-black text-sm transition-colors ${(settings as any).trading_paused ? "bg-accent text-accent-foreground hover:opacity-90" : "bg-destructive text-destructive-foreground hover:opacity-90"}`}>
                    {(settings as any).trading_paused ? "RESUME TRADING" : "PAUSE ALL TRADING"}
                  </button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <SettingsCard icon={<DollarSign className="w-4 h-4 text-primary" />} title="Hosting Fees (Annual)">
                    <SettingsInput label="Embed External ($)" defaultValue={settings.listing_fee_internal} onSave={(v) => updateSettings.mutate({ listing_fee_internal: v })} />
                    <SettingsInput label="Upload HASHPO ($)" defaultValue={settings.listing_fee_gateway} onSave={(v) => updateSettings.mutate({ listing_fee_gateway: v })} />
                    <SettingsInput label="Upload + Preview ($)" defaultValue={settings.annual_plan_price} onSave={(v) => updateSettings.mutate({ annual_plan_price: v })} />
                    <SettingsInput label="Mini Site Monthly ($)" defaultValue={(settings as any).platform_monthly_subscription_usd || 26.9} onSave={(v) => updateSettings.mutate({ platform_monthly_subscription_usd: v } as any)} />
                  </SettingsCard>
                  <SettingsCard icon={<Percent className="w-4 h-4 text-primary" />} title="Commissions">
                    <SettingsInput label="Paywall (%)" defaultValue={settings.commission_paywall} onSave={(v) => updateSettings.mutate({ commission_paywall: v })} />
                    <SettingsInput label="Ads (%)" defaultValue={settings.commission_ads} onSave={(v) => updateSettings.mutate({ commission_ads: v })} />
                    <SettingsInput label="Shares (%)" defaultValue={settings.commission_shares} onSave={(v) => updateSettings.mutate({ commission_shares: v })} />
                  </SettingsCard>
                  <SettingsCard icon={<BarChart3 className="w-4 h-4 text-primary" />} title="Valuation">
                    <SettingsInput label="Multiplier (x)" defaultValue={settings.valuation_multiplier} onSave={(v) => updateSettings.mutate({ valuation_multiplier: v })} />
                    <p className="text-[10px] text-muted-foreground">Revenue × {settings.valuation_multiplier} = Fair Valuation</p>
                  </SettingsCard>
                </div>
              </div>
            )}
          </TabsContent>

          {/* ─── VISUAL TAB ─── */}
          <TabsContent value="visual">
            {settings && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <SettingsCard icon={<Palette className="w-4 h-4 text-primary" />} title="Theme Colors (HSL)">
                  <SettingsInputText label="Primary Color (HSL)" defaultValue={(settings as any).primary_color || "222 100% 20%"} onSave={(v) => updateSettings.mutate({ primary_color: v } as any)} />
                  <SettingsInputText label="Accent Color (HSL)" defaultValue={(settings as any).accent_color || "51 100% 50%"} onSave={(v) => updateSettings.mutate({ accent_color: v } as any)} />
                  <p className="text-[10px] text-muted-foreground">Format: H S% L% (e.g. 222 100% 20%)</p>
                </SettingsCard>
                <SettingsCard icon={<Grid3X3 className="w-4 h-4 text-primary" />} title="Layout & Animation">
                  <SettingsInput label="Grid Columns (Home)" defaultValue={(settings as any).grid_columns || 4} onSave={(v) => updateSettings.mutate({ grid_columns: v } as any)} />
                  <SettingsInput label="Ticker Speed (seconds)" defaultValue={(settings as any).ticker_speed || 30} onSave={(v) => updateSettings.mutate({ ticker_speed: v } as any)} />
                  <SettingsInputText label="Hero Title Text" defaultValue={(settings as any).hero_text || "Content Exchange Board"} onSave={(v) => updateSettings.mutate({ hero_text: v } as any)} />
                  <SettingsInputText label="Footer Text" defaultValue={(settings as any).footer_text || ""} onSave={(v) => updateSettings.mutate({ footer_text: v } as any)} />
                </SettingsCard>
              </div>
            )}
          </TabsContent>

          {/* ─── CONTENT TAB ─── */}
          <TabsContent value="content">
            <div className="border border-border rounded-lg p-4 space-y-3 bg-card">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <h2 className="text-sm font-bold text-card-foreground uppercase">Content Management</h2>
                <div className="flex gap-2 overflow-x-auto scrollbar-hide">
                  <button onClick={() => setCategoryFilter(null)} className={`text-[10px] font-bold px-2 py-1 rounded transition-colors ${!categoryFilter ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground hover:bg-muted"}`}>All</button>
                  {categories.map((cat) => (
                    <button key={cat.id} onClick={() => setCategoryFilter(cat.id)} className={`text-[10px] font-bold px-2 py-1 rounded whitespace-nowrap transition-colors ${categoryFilter === cat.id ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground hover:bg-muted"}`}>{cat.name}</button>
                  ))}
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-border text-left">
                      <th className="py-2 px-2 text-muted-foreground font-semibold">Title</th>
                      <th className="py-2 px-2 text-muted-foreground font-semibold">Category</th>
                      <th className="py-2 px-2 text-muted-foreground font-semibold">Ticker</th>
                      <th className="py-2 px-2 text-muted-foreground font-semibold">Paywall</th>
                      <th className="py-2 px-2 text-muted-foreground font-semibold">Share $</th>
                      <th className="py-2 px-2 text-muted-foreground font-semibold text-center">Featured</th>
                      <th className="py-2 px-2 text-muted-foreground font-semibold text-center">Blocked</th>
                      <th className="py-2 px-2 text-muted-foreground font-semibold text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {videosLoading ? (
                      <tr><td colSpan={8} className="py-4 text-center text-muted-foreground">Loading...</td></tr>
                    ) : (videos || []).slice(0, 100).map((video) => (
                      <tr key={video.id} className={`border-b border-border/50 hover:bg-muted/50 ${(video as any).under_review ? "bg-destructive/5" : ""}`}>
                        <td className="py-1.5 px-2 font-medium text-foreground max-w-[180px] truncate">
                          {(video as any).under_review && <AlertTriangle className="w-3 h-3 text-destructive inline mr-1" />}
                          {video.title}
                        </td>
                        <td className="py-1.5 px-2 text-muted-foreground capitalize">{video.category}</td>
                        <td className="py-1.5 px-2"><span className="ticker-badge">{video.ticker}</span></td>
                        <td className="py-1.5 px-2 font-mono">
                          {editingVideoId === video.id ? (
                            <input type="number" value={editPaywall} onChange={e => setEditPaywall(parseFloat(e.target.value) || 0)} className="w-16 bg-secondary border border-border rounded px-1 py-0.5 text-xs" />
                          ) : <span className={video.paywall_price === 0 ? "text-primary font-bold" : ""}>{video.paywall_price === 0 ? "FREE" : `$${video.paywall_price.toFixed(2)}`}</span>}
                        </td>
                        <td className="py-1.5 px-2 font-mono">
                          {editingVideoId === video.id ? (
                            <input type="number" value={editSharePrice} onChange={e => setEditSharePrice(parseFloat(e.target.value) || 0)} className="w-16 bg-secondary border border-border rounded px-1 py-0.5 text-xs" />
                          ) : `$${video.share_price.toFixed(2)}`}
                        </td>
                        <td className="py-1.5 px-2 text-center">
                          <button onClick={() => updateVideo.mutate({ id: video.id, featured: !video.featured })} className={`p-1 rounded ${video.featured ? "text-primary" : "text-muted-foreground hover:text-foreground"}`}>
                            <Star className={`w-4 h-4 ${video.featured ? "fill-primary" : ""}`} />
                          </button>
                        </td>
                        <td className="py-1.5 px-2 text-center">
                          <button onClick={() => updateVideo.mutate({ id: video.id, blocked: !video.blocked })} className={`p-1 rounded ${video.blocked ? "text-destructive" : "text-muted-foreground hover:text-foreground"}`}>
                            <Ban className="w-4 h-4" />
                          </button>
                        </td>
                        <td className="py-1.5 px-2 text-center">
                          <div className="flex items-center justify-center gap-1">
                            {editingVideoId === video.id ? (
                              <>
                                <button onClick={handleSaveVideoPrice} className="text-primary hover:text-primary/80 text-[10px] font-bold">Save</button>
                                <button onClick={() => setEditingVideoId(null)} className="text-muted-foreground text-[10px]">Cancel</button>
                              </>
                            ) : (
                              <>
                                <button onClick={() => handleEditVideoPrice(video)} className="text-primary hover:text-primary/80" title="Edit prices"><Edit3 className="w-3.5 h-3.5" /></button>
                                <button onClick={() => { supabase.from("videos").update({ paywall_price: 0, share_price: 0 } as any).eq("id", video.id).then(({error}) => error ? toast.error(error.message) : toast.success("Set FREE!")); }} className="text-accent-foreground hover:opacity-80" title="Set FREE"><Gift className="w-3.5 h-3.5" /></button>
                                <Link to={`/video/${video.id}`} className="text-primary hover:underline"><Eye className="w-3.5 h-3.5" /></Link>
                                <button onClick={() => handleDeleteVideo(video.id)} className="text-destructive hover:text-destructive/80"><Trash2 className="w-3.5 h-3.5" /></button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </TabsContent>

          {/* ─── REPORTS TAB ─── */}
          <TabsContent value="reports">
            <div className="border border-border rounded-lg p-4 bg-card space-y-3">
              <h2 className="text-sm font-bold text-card-foreground uppercase flex items-center gap-2"><Flag className="w-4 h-4 text-destructive" />Video Reports ({(reports || []).length})</h2>
              {(reports || []).length === 0 ? <p className="text-xs text-muted-foreground py-4 text-center">No reports yet.</p> : (
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead><tr className="border-b border-border text-left"><th className="py-2 px-2 text-muted-foreground font-semibold">Video ID</th><th className="py-2 px-2 text-muted-foreground font-semibold">Reason</th><th className="py-2 px-2 text-muted-foreground font-semibold">Date</th><th className="py-2 px-2 text-muted-foreground font-semibold text-center">Status</th><th className="py-2 px-2 text-muted-foreground font-semibold text-center">Action</th></tr></thead>
                    <tbody>{(reports || []).map((r: any) => (<tr key={r.id} className={`border-b border-border/50 ${!r.reviewed ? "bg-destructive/5" : ""}`}><td className="py-1.5 px-2 font-mono text-[10px] max-w-[120px] truncate"><Link to={`/video/${r.video_id}`} className="text-primary hover:underline">{r.video_id?.slice(0, 8)}...</Link></td><td className="py-1.5 px-2 text-foreground">{r.reason}</td><td className="py-1.5 px-2 text-muted-foreground">{new Date(r.created_at).toLocaleDateString()}</td><td className="py-1.5 px-2 text-center"><span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${r.reviewed ? "bg-primary/10 text-primary" : "bg-destructive/10 text-destructive"}`}>{r.reviewed ? "RESOLVED" : "PENDING"}</span></td><td className="py-1.5 px-2 text-center">{!r.reviewed && <button onClick={() => resolveReport.mutate({ id: r.id, reviewed: true })} className="text-primary hover:text-primary/80"><CheckCircle className="w-4 h-4" /></button>}</td></tr>))}</tbody>
                  </table>
                </div>
              )}
            </div>
          </TabsContent>

          {/* ─── FLAGGED TAB ─── */}
          <TabsContent value="flagged">
            <div className="border border-border rounded-lg p-4 bg-card space-y-3">
              <h2 className="text-sm font-bold text-card-foreground uppercase flex items-center gap-2"><AlertTriangle className="w-4 h-4 text-destructive" />Videos Under Review ({(flaggedVideos || []).length})</h2>
              {(flaggedVideos || []).length === 0 ? <p className="text-xs text-muted-foreground py-4 text-center">No flagged videos.</p> : (
                <div className="space-y-3">{(flaggedVideos || []).map((v: any) => (<div key={v.id} className="flex items-center justify-between bg-destructive/5 rounded-lg p-3 border border-destructive/20"><div className="flex items-center gap-3"><div className="w-16 h-9 rounded bg-muted overflow-hidden shrink-0">{v.thumbnail_url && <img src={v.thumbnail_url} alt="" className="w-full h-full object-cover" />}</div><div><p className="text-xs font-bold text-foreground">{v.title}</p><p className="text-[10px] text-destructive font-mono">{v.report_count} reports</p></div></div><div className="flex items-center gap-2"><Link to={`/video/${v.id}`} className="text-[10px] text-primary hover:underline">View</Link><button onClick={() => updateVideo.mutate({ id: v.id, blocked: true })} className="text-[10px] bg-destructive text-destructive-foreground px-2 py-1 rounded font-bold">Block</button><button onClick={() => handleClearReview(v.id)} className="text-[10px] bg-primary text-primary-foreground px-2 py-1 rounded font-bold">Clear</button></div></div>))}</div>
              )}
            </div>
          </TabsContent>

          {/* ─── BROADCAST TAB ─── */}
          <TabsContent value="broadcast">
            <div className="border border-border rounded-lg p-4 bg-card space-y-4">
              <h2 className="text-sm font-bold text-card-foreground uppercase flex items-center gap-2"><Megaphone className="w-4 h-4 text-primary" />Broadcast Message</h2>
              <textarea value={broadcastMsg} onChange={e => setBroadcastMsg(e.target.value)} placeholder="Type your broadcast message..." className="w-full bg-secondary text-foreground text-sm border border-border rounded px-3 py-2 min-h-[80px] focus:outline-none focus:ring-1 focus:ring-primary" />
              <button onClick={handleBroadcast} disabled={!broadcastMsg.trim()} className="bg-primary text-primary-foreground px-4 py-2 rounded text-xs font-bold hover:bg-primary/90 disabled:opacity-50">Send Broadcast</button>
              <div className="border-t border-border pt-3">
                <h3 className="text-xs font-bold text-muted-foreground uppercase mb-2">Recent Broadcasts</h3>
                {JSON.parse(localStorage.getItem("admin_broadcasts") || "[]").slice(0, 5).map((b: any, i: number) => (<div key={i} className="bg-secondary/50 rounded p-2 mb-2"><p className="text-xs text-foreground">{b.message}</p><p className="text-[10px] text-muted-foreground mt-1">{new Date(b.date).toLocaleString()} — {b.by}</p></div>))}
              </div>
            </div>
          </TabsContent>

          {/* ─── ADMINS TAB ─── */}
          <TabsContent value="admins">
            <div className="border border-border rounded-lg p-4 bg-card space-y-4">
              <h2 className="text-sm font-bold text-card-foreground uppercase flex items-center gap-2"><Shield className="w-4 h-4 text-primary" />Admin Users</h2>
              <div className="flex gap-2">
                <input type="email" value={newAdminEmail} onChange={(e) => setNewAdminEmail(e.target.value)} placeholder="Email of user to add as admin..." className="flex-1 bg-secondary text-foreground text-sm border border-border rounded px-3 py-2 focus:outline-none focus:ring-1 focus:ring-primary" />
                <button onClick={handleAddAdmin} disabled={addingAdmin || !newAdminEmail.trim()} className="flex items-center gap-1.5 bg-primary text-primary-foreground px-4 py-2 rounded text-xs font-bold hover:bg-primary/90 disabled:opacity-50"><UserPlus className="w-3.5 h-3.5" />Add Admin</button>
              </div>
              {adminsLoading ? <p className="text-xs text-muted-foreground py-4 text-center">Loading...</p> : admins.length === 0 ? <p className="text-xs text-muted-foreground py-4 text-center">Click this tab to load admin list.</p> : (
                <div className="space-y-2">{admins.map((a: any) => (<div key={a.id} className="flex items-center justify-between bg-secondary/50 rounded-lg px-4 py-3"><div><p className="text-xs font-bold text-foreground">{a.display_name}</p><p className="text-[10px] font-mono text-muted-foreground">{a.user_id}</p></div><button onClick={() => handleRemoveAdmin(a.id, a.user_id)} className="text-destructive hover:text-destructive/80 disabled:opacity-50" disabled={a.user_id === user?.id}><UserX className="w-4 h-4" /></button></div>))}</div>
              )}
            </div>
          </TabsContent>

          {/* ─── JACKPOT TAB ─── */}
          <TabsContent value="jackpot">
            <div className="border border-border rounded-lg p-6 bg-card text-center space-y-4">
              <p className="text-4xl font-mono font-extrabold text-[hsl(var(--ticker-up))]">${(jackpotPool?.total_amount ?? 0).toFixed(2)} <span className="text-sm text-muted-foreground">USDC</span></p>
              <div className="border-t border-border pt-4 text-left max-w-md mx-auto space-y-3">
                <label className="block"><span className="text-[10px] text-muted-foreground">Number of Winners (1–10)</span>
                  <input type="number" min={1} max={10} value={winnerCount} onChange={(e) => setWinnerCount(Math.max(1, Math.min(10, parseInt(e.target.value) || 1)))} className="mt-1 w-full bg-secondary text-foreground text-sm font-mono border border-border rounded px-3 py-2 focus:outline-none focus:ring-1 focus:ring-primary" />
                </label>
                {Array.from({ length: winnerCount }).map((_, i) => (<div key={i} className="flex items-center gap-2"><span className="text-xs font-bold text-muted-foreground w-16">#{i + 1}</span><input type="number" min={0} max={100} step={0.1} value={winnerPcts[i]} onChange={(e) => { const next = [...winnerPcts]; next[i] = parseFloat(e.target.value) || 0; setWinnerPcts(next); }} className="flex-1 bg-secondary text-foreground text-sm font-mono border border-border rounded px-3 py-1.5" /><span className="text-xs text-muted-foreground">%</span></div>))}
                <p className={`text-[10px] font-mono ${Math.abs(winnerPcts.slice(0, winnerCount).reduce((s, p) => s + p, 0) - 100) < 0.01 ? "text-[hsl(var(--ticker-up))]" : "text-destructive"}`}>Total: {winnerPcts.slice(0, winnerCount).reduce((s, p) => s + p, 0).toFixed(1)}%</p>
              </div>
              <button onClick={handleTriggerJackpot} disabled={triggeringJackpot || (jackpotPool?.total_amount ?? 0) <= 0} className="px-8 py-3 bg-[hsl(var(--ticker-up))] text-white font-bold text-sm rounded-lg hover:opacity-90 disabled:opacity-40">{triggeringJackpot ? "Drawing..." : "🎰 TRIGGER JACKPOT DRAW"}</button>
            </div>
          </TabsContent>

          {/* ─── BOOST RACE TAB ─── */}
          <TabsContent value="boostrace">
            <div className="border border-border rounded-lg p-4 bg-card space-y-3">
              <h2 className="text-sm font-bold text-card-foreground uppercase flex items-center gap-2"><Flame className="w-4 h-4 text-destructive" />Boost Race — Top 20</h2>
              {boostRaceLoading ? <p className="text-xs text-muted-foreground py-4 text-center">Loading...</p> : boostRace.length === 0 ? <p className="text-xs text-muted-foreground py-4 text-center">No boosts yet.</p> : (
                <div className="space-y-2">{boostRace.map((v: any, i: number) => (<div key={v.id} className="flex items-center gap-3 bg-secondary/50 rounded-lg px-4 py-3"><span className={`text-lg font-extrabold font-mono w-8 text-center ${i < 3 ? "text-[hsl(var(--gold))]" : "text-muted-foreground"}`}>{i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : `#${i + 1}`}</span><div className="flex-1 min-w-0"><p className="text-xs font-bold text-foreground truncate">{v.title}</p></div><div className="text-right"><p className="text-sm font-extrabold font-mono text-[hsl(var(--ticker-up))]">{v.boost_count}</p><p className="text-[10px] text-muted-foreground">boosts</p></div></div>))}</div>
              )}
            </div>
          </TabsContent>

          {/* ─── MASTER WALLET TAB ─── */}
          <TabsContent value="masterwallet">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="border border-border rounded-lg p-4 bg-card text-center"><p className="text-2xl font-mono font-extrabold text-[hsl(var(--gold))]">${(masterWallet?.totalPlatform ?? 0).toFixed(2)}</p><p className="text-[10px] text-muted-foreground uppercase">Platform Revenue</p></div>
              <div className="border border-border rounded-lg p-4 bg-card text-center"><p className="text-2xl font-mono font-extrabold text-foreground">{masterWallet?.totalBoosts ?? 0}</p><p className="text-[10px] text-muted-foreground uppercase">Total Boosts</p></div>
              <div className="border border-border rounded-lg p-4 bg-card text-center"><p className="text-2xl font-mono font-extrabold text-foreground">{masterWallet?.totalTickets ?? 0}</p><p className="text-[10px] text-muted-foreground uppercase">Active Tickets</p></div>
            </div>
          </TabsContent>

          {/* ─── AI BRAIN TAB ─── */}
          <TabsContent value="aibrain">
            <div className="border border-border rounded-lg p-4 bg-card space-y-4">
              <h2 className="text-sm font-bold text-card-foreground uppercase flex items-center gap-2"><Brain className="w-4 h-4 text-primary" />AI Models</h2>
              <p className="text-[10px] text-muted-foreground">
                O assistente IA aparece no site principal e em todos os mini sites. Ative <strong>DeepSeek</strong> e configure o secret <code className="bg-muted px-1 rounded">DEEPSEEK_API_KEY</code> no Supabase (Edge Function secrets) para usar sua API DeepSeek como assistente em toda a plataforma.
              </p>
              {aiLoading || !aiSettings ? <p className="text-xs text-muted-foreground py-4 text-center">Clique na aba para carregar...</p> : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {[
                    { key: "gemini_enabled", label: "Google Gemini", desc: "Fast, multimodal" },
                    { key: "chatgpt_enabled", label: "OpenAI ChatGPT", desc: "Advanced reasoning" },
                    { key: "claude_enabled", label: "Anthropic Claude", desc: "Safety-focused" },
                    { key: "deepseek_enabled", label: "DeepSeek", desc: "Cost-effective" },
                  ].map((model) => (
                    <div key={model.key} className="flex items-center justify-between bg-secondary/50 rounded-lg px-4 py-3">
                      <div><p className="text-xs font-bold text-foreground">{model.label}</p><p className="text-[10px] text-muted-foreground">{model.desc}</p></div>
                      <button onClick={() => updateAiSetting(model.key, !aiSettings[model.key])} className={`px-3 py-1 text-[10px] font-bold rounded-full transition-colors ${aiSettings[model.key] ? "bg-[hsl(var(--ticker-up))] text-white" : "bg-muted text-muted-foreground"}`}>{aiSettings[model.key] ? "ON" : "OFF"}</button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </TabsContent>

          {/* ─── AD NETWORK TAB ─── */}
          <TabsContent value="adnetwork">
            <div className="border border-border rounded-lg p-4 bg-card space-y-4">
              <h2 className="text-sm font-bold text-card-foreground uppercase">Ad Campaigns ({(allAds || []).length})</h2>
              {(allAds || []).length === 0 ? <p className="text-xs text-muted-foreground py-4 text-center">No ad campaigns yet.</p> : (
                <div className="overflow-x-auto"><table className="w-full text-xs"><thead><tr className="border-b border-border text-left"><th className="py-2 px-2 text-muted-foreground font-semibold">Title</th><th className="py-2 px-2 text-muted-foreground font-semibold">Slot</th><th className="py-2 px-2 text-muted-foreground font-semibold">Budget</th><th className="py-2 px-2 text-muted-foreground font-semibold">CTR</th><th className="py-2 px-2 text-muted-foreground font-semibold text-center">Status</th></tr></thead><tbody>{(allAds || []).map((ad: any) => (<tr key={ad.id} className="border-b border-border/50 hover:bg-muted/50"><td className="py-1.5 px-2 font-medium text-foreground">{ad.title}</td><td className="py-1.5 px-2 text-muted-foreground capitalize">{ad.slot_type}</td><td className="py-1.5 px-2 font-mono">${Number(ad.budget).toFixed(2)}</td><td className="py-1.5 px-2 font-mono">{ad.impressions > 0 ? ((ad.clicks / ad.impressions) * 100).toFixed(1) : "0.0"}%</td><td className="py-1.5 px-2 text-center"><span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${ad.active ? "bg-[hsl(var(--ticker-up))]/20 text-[hsl(var(--ticker-up))]" : "bg-muted text-muted-foreground"}`}>{ad.active ? "ACTIVE" : "PAUSED"}</span></td></tr>))}</tbody></table></div>
              )}
            </div>
          </TabsContent>

          {/* ─── LAZY-LOADED TABS — com Suspense para evitar tela branca ─── */}
          <TabsContent value="tradingfees">
            <Suspense fallback={<TabLoading />}><AdminTradingFees /></Suspense>
          </TabsContent>
          <TabsContent value="indexderivatives">
            <Suspense fallback={<TabLoading />}><AdminIndexDerivatives /></Suspense>
          </TabsContent>
          <TabsContent value="branding">
            <Suspense fallback={<TabLoading />}><AdminBranding /></Suspense>
          </TabsContent>
          <TabsContent value="splits">
            <Suspense fallback={<TabLoading />}><AdminRevenueSplits /></Suspense>
          </TabsContent>
          <TabsContent value="minisites">
            <Suspense fallback={<TabLoading />}><AdminMiniSites /></Suspense>
          </TabsContent>
          <TabsContent value="premiumslugs">
            <Suspense fallback={<TabLoading />}><AdminPremiumSlugs /></Suspense>
          </TabsContent>
          <TabsContent value="copyright">
            <Suspense fallback={<TabLoading />}><AdminCopyright /></Suspense>
          </TabsContent>
          <TabsContent value="apikeys">
            <Suspense fallback={<TabLoading />}><AdminApiKeys /></Suspense>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

const StatCard = ({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) => (
  <div className="border border-border rounded-lg p-3 bg-card text-center space-y-1">
    <div className="flex items-center justify-center text-primary">{icon}</div>
    <p className="text-lg font-bold font-mono text-foreground">{value}</p>
    <p className="text-[10px] text-muted-foreground uppercase">{label}</p>
  </div>
);

const SettingsCard = ({ icon, title, children }: { icon: React.ReactNode; title: string; children: React.ReactNode }) => (
  <div className="border border-border rounded-lg p-4 space-y-3 bg-card">
    <div className="flex items-center gap-2">{icon}<h2 className="text-sm font-bold text-card-foreground uppercase">{title}</h2></div>
    <div className="space-y-2">{children}</div>
  </div>
);

const SettingsInput = ({ label, defaultValue, onSave }: { label: string; defaultValue: number; onSave: (v: number) => void }) => {
  const [value, setValue] = useState(String(defaultValue));
  useEffect(() => { setValue(String(defaultValue)); }, [defaultValue]);
  return (
    <label className="block"><span className="text-xs text-muted-foreground">{label}</span>
      <div className="flex gap-2 mt-1">
        <input type="number" value={value} onChange={(e) => setValue(e.target.value)} className="flex-1 bg-secondary text-foreground text-sm font-mono border border-border rounded px-3 py-2 focus:outline-none focus:ring-1 focus:ring-primary" />
        <button onClick={() => onSave(parseFloat(value) || 0)} className="bg-primary text-primary-foreground px-3 py-1 rounded text-xs font-bold hover:bg-primary/90">Save</button>
      </div>
    </label>
  );
};

const SettingsInputText = ({ label, defaultValue, onSave }: { label: string; defaultValue: string; onSave: (v: string) => void }) => {
  const [value, setValue] = useState(defaultValue);
  useEffect(() => { setValue(defaultValue); }, [defaultValue]);
  return (
    <label className="block"><span className="text-xs text-muted-foreground">{label}</span>
      <div className="flex gap-2 mt-1">
        <input type="text" value={value} onChange={(e) => setValue(e.target.value)} className="flex-1 bg-secondary text-foreground text-sm border border-border rounded px-3 py-2 focus:outline-none focus:ring-1 focus:ring-primary" />
        <button onClick={() => onSave(value)} className="bg-primary text-primary-foreground px-3 py-1 rounded text-xs font-bold hover:bg-primary/90">Save</button>
      </div>
    </label>
  );
};

export default Admin;
