import { useState } from "react";
import { Link } from "react-router-dom";
import { categories } from "@/data/mockDatabase";
import { useSettings } from "@/hooks/useSettings";
import type { Video } from "@/hooks/useVideos";
import {
  Play, TrendingUp, TrendingDown, Minus, BarChart3, Home,
  Gem, Eye, RefreshCw, Layers, ShoppingCart, ArrowLeftRight
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useVideoBoostProgress, HOME_THRESHOLD } from "@/hooks/useBoosts";
import { Progress } from "@/components/ui/progress";
import BoostPanel from "@/components/BoostPanel";

interface AssetCardProps {
  video: Video;
  nftCollection?: any; // matched nft_collections row
}

const AssetCard = ({ video, nftCollection }: AssetCardProps) => {
  const { data: settings } = useSettings();
  const { user } = useAuth();
  const { data: boostProgress } = useVideoBoostProgress(video.id);
  const [backMode, setBackMode] = useState<"token" | "nft">(nftCollection ? "nft" : "token");

  const multiplier = settings?.valuation_multiplier ?? 50;
  const fairValuation = video.revenue * multiplier;
  const category = categories.find((c) => c.id === video.category);
  const boostCount = video.boost_count ?? 0;

  const change24h = ((video.share_price - 1) / 1) * 100;
  const trend = change24h > 2 ? "up" : change24h < -2 ? "down" : "flat";
  const borderColor = backMode === "token"
    ? (trend === "up" ? "border-accent" : trend === "down" ? "border-destructive" : "border-primary")
    : "border-[hsl(270,70%,55%)]";

  const col = nftCollection;
  const hasBothModes = !!col && video.shares_issued;

  return (
    <div className={`group ${video.blocked ? "opacity-40 pointer-events-none" : ""}`} style={{ perspective: "1200px" }}>
      <div className="relative w-full transition-transform duration-500 [transform-style:preserve-3d] group-hover:[transform:rotateY(180deg)]">
        {/* ═══ FRONT — VIDEO ═══ */}
        <div className="[backface-visibility:hidden] bg-card rounded-2xl overflow-hidden shadow-[var(--card-shadow)] hover:shadow-[var(--card-shadow-strong)] transition-shadow">
          <Link to={`/video/${video.id}`} className="block">
            <div className="relative aspect-video bg-muted overflow-hidden rounded-t-2xl">
              <img src={video.thumbnail_url || "/placeholder.svg"} alt={video.title} className="w-full h-full object-cover" loading="lazy" />
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-16 h-16 rounded-full bg-foreground/70 flex items-center justify-center backdrop-blur-sm transition-transform group-hover:scale-110">
                  <Play className="w-7 h-7 text-primary-foreground fill-primary-foreground ml-1" />
                </div>
              </div>
              <div className="absolute bottom-2 right-2 bg-foreground/80 text-primary-foreground text-xs font-extrabold px-2 py-0.5 rounded-lg font-mono">12:45</div>
              {boostProgress?.isInHome && (
                <div className="absolute top-2 left-2 bg-accent text-accent-foreground text-[10px] font-black px-2 py-1 rounded-full flex items-center gap-1">
                  <Home className="w-3 h-3" /> #{boostProgress.rank}
                </div>
              )}
              {/* NFT badge */}
              {col && (
                <div className="absolute top-2 right-2 bg-[hsl(270,70%,55%)] text-white text-[10px] font-black px-2 py-1 rounded-full flex items-center gap-1">
                  <Gem className="w-3 h-3" /> NFT
                </div>
              )}
            </div>
            <div className="p-4 space-y-2">
              <h3 className="text-lg font-extrabold text-foreground leading-tight line-clamp-2">{video.title}</h3>
              <div className="flex items-center gap-2">
                {category && <img src={category.avatar} alt={category.name} className="w-6 h-6 rounded-full object-cover" />}
                <span className="text-sm font-bold text-muted-foreground">{category?.name || video.category}</span>
                <span className="text-sm text-muted-foreground font-bold">•</span>
                <span className="text-sm text-muted-foreground font-bold">{video.like_count} views</span>
              </div>
              {!video.shares_issued && !col && (
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded-full font-bold">
                    Shadow Val: ~${fairValuation.toLocaleString("en-US", { maximumFractionDigits: 0 })}
                  </span>
                </div>
              )}
            </div>
          </Link>

          {/* ═══ BOOST SECTION ═══ */}
          <div className="px-4 pb-4 space-y-2" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center gap-2">
              <Home className="w-3.5 h-3.5 text-accent flex-shrink-0" />
              <div className="flex-1">
                <Progress value={boostProgress?.progress ?? 0} className="h-3" />
              </div>
              <span className="text-[10px] font-mono font-black text-muted-foreground whitespace-nowrap">
                {boostProgress?.isInHome ? "🏠 HOME" : `$${(boostProgress?.remaining ?? 225).toFixed(0)} left`}
              </span>
            </div>
            <div className="text-center text-[9px] text-muted-foreground font-mono">
              ${(boostProgress?.totalSpent ?? 0).toFixed(2)} boosted • Rank #{boostProgress?.rank ?? "—"} • {boostCount} boosts
            </div>
            <BoostPanel videoId={video.id} compact />
          </div>
        </div>

        {/* ═══ BACK ═══ */}
        <div className={`[backface-visibility:hidden] [transform:rotateY(180deg)] absolute inset-0 bg-card rounded-2xl overflow-hidden border-2 ${borderColor} shadow-[var(--card-shadow-strong)] flex flex-col`}>
          {/* Mode toggle */}
          {hasBothModes && (
            <div className="flex items-center justify-center gap-1 pt-3 px-5" onClick={(e) => e.stopPropagation()}>
              <button
                onClick={(e) => { e.preventDefault(); e.stopPropagation(); setBackMode("token"); }}
                className={`flex items-center gap-1 px-3 py-1 rounded-full text-[10px] font-black transition-colors ${backMode === "token" ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground hover:text-foreground"}`}
              >
                <BarChart3 className="w-3 h-3" /> TOKEN
              </button>
              <button
                onClick={(e) => { e.preventDefault(); e.stopPropagation(); setBackMode("nft"); }}
                className={`flex items-center gap-1 px-3 py-1 rounded-full text-[10px] font-black transition-colors ${backMode === "nft" ? "bg-[hsl(270,70%,55%)] text-white" : "bg-secondary text-muted-foreground hover:text-foreground"}`}
              >
                <Gem className="w-3 h-3" /> NFT
              </button>
            </div>
          )}

          {backMode === "token" ? (
            /* ─── TOKEN / SHARES PANEL ─── */
            <Link to={`/video/${video.id}`} className="flex flex-col h-full p-5">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className="text-2xl font-black font-mono text-foreground tracking-tight">{video.ticker}</span>
                  <BarChart3 className="w-5 h-5 text-muted-foreground" />
                </div>
                <div className="flex items-center gap-1.5">
                  {video.dex_mode && <span className="bg-accent text-accent-foreground text-[10px] font-black px-2 py-1 rounded-full">DEX</span>}
                  {video.featured && <span className="bg-accent text-accent-foreground text-[10px] font-black px-2 py-1 rounded-full">★ PREMIUM</span>}
                  {!video.shares_issued && <span className="bg-primary/10 text-primary text-[10px] font-black px-2 py-1 rounded-full">PRE-IPO</span>}
                </div>
              </div>

              <div className="space-y-2.5 flex-1">
                {video.shares_issued ? (
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-extrabold text-muted-foreground uppercase tracking-wider">Price</span>
                    <div className="flex items-center gap-2">
                      {trend === "up" ? <TrendingUp className="w-5 h-5 text-accent" /> : trend === "down" ? <TrendingDown className="w-5 h-5 text-destructive" /> : <Minus className="w-5 h-5 text-primary" />}
                      <span className={`text-3xl font-black font-mono ${trend === "up" ? "text-accent" : trend === "down" ? "text-destructive" : "text-primary"}`}>
                        ${video.share_price.toFixed(2)}
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-extrabold text-muted-foreground uppercase tracking-wider">Est. Value</span>
                    <span className="text-2xl font-black font-mono text-primary">~${fairValuation.toLocaleString("en-US", { maximumFractionDigits: 0 })}</span>
                  </div>
                )}
                {video.shares_issued && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-extrabold text-muted-foreground uppercase tracking-wider">24h</span>
                    <span className={`text-lg font-black font-mono ${change24h >= 0 ? "text-accent" : "text-destructive"}`}>{change24h >= 0 ? "+" : ""}{change24h.toFixed(1)}%</span>
                  </div>
                )}
                <div className="flex items-center justify-between">
                  <span className="text-sm font-extrabold text-muted-foreground uppercase tracking-wider">Fair Val.</span>
                  <span className="font-mono font-black text-foreground text-base">${fairValuation.toLocaleString("en-US", { maximumFractionDigits: 0 })}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-extrabold text-muted-foreground uppercase tracking-wider">Revenue</span>
                  <span className="font-mono font-black text-foreground text-base">${video.revenue.toLocaleString("en-US", { minimumFractionDigits: 2 })}</span>
                </div>
              </div>

              <div className="flex items-center gap-2 mt-3 pt-3 border-t border-border" onClick={(e) => e.preventDefault()}>
                {video.shares_issued ? (
                  <>
                    <button className="flex-1 bg-accent text-accent-foreground py-3.5 rounded-full text-base font-black tracking-wide hover:opacity-90 transition-opacity" onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}>Buy</button>
                    <button className="flex-1 bg-destructive text-destructive-foreground py-3.5 rounded-full text-base font-black tracking-wide hover:opacity-90 transition-opacity" onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}>Sell</button>
                  </>
                ) : (
                  <div className="flex-1 text-center py-3 rounded-full bg-primary/10 text-primary text-sm font-black">Shares not yet issued</div>
                )}
              </div>
            </Link>
          ) : (
            /* ─── NFT COLLECTION PANEL ─── */
            <Link to="/marketplace" className="flex flex-col h-full p-5">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Gem className="w-5 h-5 text-[hsl(270,70%,55%)]" />
                  <span className="text-lg font-black text-foreground line-clamp-1">{col?.title || video.title}</span>
                </div>
                <span className="bg-[hsl(270,70%,55%)]/10 text-[hsl(270,70%,55%)] text-[10px] font-black px-2 py-1 rounded-full">
                  {col?.status?.toUpperCase() || "ACTIVE"}
                </span>
              </div>

              {col ? (
                <div className="space-y-2.5 flex-1">
                  {/* Price */}
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-extrabold text-muted-foreground uppercase tracking-wider">Mint Price</span>
                    <span className="text-3xl font-black font-mono text-[hsl(270,70%,55%)]">${Number(col.price_per_nft).toFixed(2)}</span>
                  </div>

                  {/* Editions */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-extrabold text-muted-foreground uppercase tracking-wider">Editions</span>
                      <span className="font-mono font-black text-foreground text-base">
                        {(col.editions_minted || 0).toLocaleString()} / {(col.max_editions || 0).toLocaleString()}
                      </span>
                    </div>
                    <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full bg-[hsl(270,70%,55%)] transition-all"
                        style={{ width: `${Math.min(100, ((col.editions_minted || 0) / (col.max_editions || 1)) * 100)}%` }}
                      />
                    </div>
                    <div className="flex justify-between text-[9px] text-muted-foreground font-mono">
                      <span>{Math.round(((col.editions_minted || 0) / (col.max_editions || 1)) * 100)}% sold</span>
                      <span>{((col.max_editions || 0) - (col.editions_minted || 0)).toLocaleString()} remaining</span>
                    </div>
                  </div>

                  {/* Stats grid */}
                  <div className="grid grid-cols-2 gap-2">
                    <div className="bg-secondary rounded-lg p-2 text-center">
                      <p className="text-[9px] text-muted-foreground uppercase font-bold">Views/NFT</p>
                      <p className="text-lg font-black text-foreground">{col.view_tier || 1}</p>
                    </div>
                    <div className="bg-secondary rounded-lg p-2 text-center">
                      <p className="text-[9px] text-muted-foreground uppercase font-bold">Revenue</p>
                      <p className="text-sm font-black text-accent font-mono">
                        ${((col.editions_minted || 0) * Number(col.price_per_nft)).toFixed(2)}
                      </p>
                    </div>
                  </div>

                  {/* Recharge & Split */}
                  <div className="flex items-center justify-between text-[10px]">
                    {col.recharge_enabled ? (
                      <span className="flex items-center gap-1 text-accent font-bold">
                        <RefreshCw className="w-3 h-3" /> Recharge ${col.recharge_price}
                      </span>
                    ) : (
                      <span className="text-muted-foreground">🏆 Collectible only</span>
                    )}
                    <span className="font-mono text-muted-foreground">
                      Split {col.creator_pct}/{col.platform_pct}
                    </span>
                  </div>

                  {/* On-chain */}
                  {col.polygon_hash && (
                    <div className="text-[8px] font-mono text-muted-foreground truncate">
                      🔷 {col.polygon_hash}
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex-1 flex items-center justify-center">
                  <p className="text-sm text-muted-foreground font-bold">No NFT collection launched</p>
                </div>
              )}

              <div className="mt-3 pt-3 border-t border-border" onClick={(e) => e.preventDefault()}>
                {col && (col.max_editions - (col.editions_minted || 0)) > 0 ? (
                  <button
                    className="w-full py-3.5 rounded-full text-base font-black tracking-wide hover:opacity-90 transition-opacity flex items-center justify-center gap-2 text-white bg-[hsl(270,70%,55%)]"
                    onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}
                  >
                    <ShoppingCart className="w-4 h-4" /> Mint NFT · ${Number(col.price_per_nft).toFixed(2)}
                  </button>
                ) : col ? (
                  <div className="w-full text-center py-3 rounded-full bg-destructive/10 text-destructive text-sm font-black">SOLD OUT 🔥</div>
                ) : (
                  <div className="w-full text-center py-3 rounded-full bg-muted text-muted-foreground text-sm font-black">No Collection</div>
                )}
              </div>
            </Link>
          )}

          <p className="text-[7px] text-muted-foreground text-center pb-2 px-3 leading-tight font-mono font-bold">
            HIGH RISK ASSET • HASHPO IS A TECH PLATFORM
          </p>
        </div>
      </div>
    </div>
  );
};

export default AssetCard;
