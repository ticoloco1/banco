import { useState, useEffect } from "react";
import { Gem, Play, Lock, Eye, RefreshCw, ShoppingCart, TrendingUp, Loader2 } from "lucide-react";

interface NftFlipCardProps {
  video: any;
  canPlay: boolean;
  isPlaying: boolean;
  onPlay: () => void;
  onBuy: () => void;
  soldOut?: boolean;
  themeAccent?: string;
  protectedVideoId?: string | null;
  loadingVideo?: boolean;
}

const NftFlipCard = ({ 
  video, 
  canPlay, 
  isPlaying, 
  onPlay, 
  onBuy, 
  soldOut, 
  themeAccent = "#a855f7",
  protectedVideoId,
  loadingVideo 
}: NftFlipCardProps) => {
  const [flipped, setFlipped] = useState(false);

  // Use protected ID if available, otherwise use thumbnail fallback (won't embed the actual video)
  const thumbnailUrl = video.thumbnail_url || `https://img.youtube.com/vi/${video.youtube_video_id || "default"}/hqdefault.jpg`;

  return (
    <div className="group [perspective:1000px]">
      <div className={`relative transition-transform duration-500 [transform-style:preserve-3d] ${flipped ? "[transform:rotateY(180deg)]" : ""}`}>
        {/* FRONT */}
        <div className="[backface-visibility:hidden] bg-white/10 backdrop-blur-sm border border-white/10 rounded-xl overflow-hidden">
          <div className="relative aspect-video bg-black/20">
            {isPlaying && canPlay && protectedVideoId ? (
              <iframe src={`https://www.youtube.com/embed/${protectedVideoId}?autoplay=1`} allow="autoplay; encrypted-media" allowFullScreen className="w-full h-full" />
            ) : loadingVideo ? (
              <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                <Loader2 className="w-8 h-8 text-white animate-spin" />
              </div>
            ) : (
              <>
                {video.preview_url && !canPlay ? (
                  <video src={video.preview_url} autoPlay loop muted playsInline className="w-full h-full object-cover brightness-75" />
                ) : (
                  <img src={thumbnailUrl} alt={video.title}
                    className={`w-full h-full object-cover ${!canPlay ? "blur-sm brightness-50" : ""}`} />
                )}
                {!canPlay ? (
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
                    <Lock className="w-8 h-8 text-white drop-shadow-lg" />
                    <span className="text-white text-xs font-black drop-shadow-lg tracking-wider">NFT PAYWALL</span>
                    <button onClick={() => setFlipped(true)}
                      className="px-5 py-2 rounded-full text-xs font-bold shadow-lg hover:opacity-90 transition-opacity flex items-center gap-1.5 text-white"
                      style={{ backgroundColor: themeAccent }}>
                      <Gem className="w-3.5 h-3.5" /> View NFT Details
                    </button>
                  </div>
                ) : (
                  <button onClick={onPlay} className="absolute inset-0 flex items-center justify-center bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Play className="w-12 h-12 text-white fill-white drop-shadow-lg" />
                  </button>
                )}
              </>
            )}
          </div>
          <div className="p-3 space-y-1.5">
            <p className="text-sm font-bold text-white line-clamp-2">{video.title}</p>
            <div className="flex items-center gap-2 text-[10px] flex-wrap">
              <span className="flex items-center gap-1 font-bold px-2 py-0.5 rounded-full text-white" style={{ backgroundColor: themeAccent + "30", color: themeAccent }}>
                <Gem className="w-3 h-3" /> ${video.nft_price}
              </span>
              <span className="text-white/50">{video.nft_max_views} view(s)</span>
              {video.nft_max_editions && (
                <span className="text-white/50">{video.nft_editions_sold}/{video.nft_max_editions} sold</span>
              )}
              {canPlay && (
                <span className="font-bold flex items-center gap-0.5" style={{ color: themeAccent }}>
                  <Eye className="w-3 h-3" /> Owned
                </span>
              )}
              {!canPlay && (
                <button onClick={() => setFlipped(true)} className="font-bold hover:underline ml-auto" style={{ color: themeAccent }}>Flip →</button>
              )}
            </div>
          </div>
        </div>

        {/* BACK */}
        <div className="absolute inset-0 [backface-visibility:hidden] [transform:rotateY(180deg)] bg-white/10 backdrop-blur-sm border-2 rounded-xl overflow-hidden flex flex-col" style={{ borderColor: themeAccent + "50" }}>
          <div className="flex-1 p-5 flex flex-col justify-between" style={{ background: `linear-gradient(135deg, ${themeAccent}15, transparent, ${themeAccent}10)` }}>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-black text-white line-clamp-2 flex-1">{video.title}</h3>
                <button onClick={() => setFlipped(false)} className="text-white/50 hover:text-white text-xs font-bold ml-2">✕</button>
              </div>

              {/* Detailed NFT stats */}
              <div className="grid grid-cols-2 gap-2">
                <div className="bg-white/10 rounded-lg p-2 text-center">
                  <p className="text-[10px] text-white/40 uppercase">Price</p>
                  <p className="text-lg font-black" style={{ color: themeAccent }}>${video.nft_price}</p>
                </div>
                <div className="bg-white/10 rounded-lg p-2 text-center">
                  <p className="text-[10px] text-white/40 uppercase">Views</p>
                  <p className="text-lg font-black text-white">{video.nft_max_views}</p>
                </div>
              </div>

              {/* Editions progress */}
              {video.nft_max_editions && (
                <div className="bg-white/10 rounded-lg p-2">
                  <div className="flex justify-between text-[10px]">
                    <span className="text-white/40">Editions</span>
                    <span className="font-bold text-white">{video.nft_editions_sold}/{video.nft_max_editions}</span>
                  </div>
                  <div className="w-full bg-white/10 rounded-full h-1.5 mt-1">
                    <div className="h-1.5 rounded-full transition-all" style={{
                      backgroundColor: themeAccent,
                      width: `${Math.min(100, ((video.nft_editions_sold || 0) / video.nft_max_editions) * 100)}%`
                    }} />
                  </div>
                  <div className="flex justify-between text-[9px] mt-1">
                    <span className="text-white/30">{video.nft_max_editions - (video.nft_editions_sold || 0)} remaining</span>
                    <span className="text-white/30 flex items-center gap-0.5"><TrendingUp className="w-2.5 h-2.5" /> {Math.round(((video.nft_editions_sold || 0) / video.nft_max_editions) * 100)}% sold</span>
                  </div>
                </div>
              )}

              {/* NFT value info */}
              <div className="bg-white/10 rounded-lg p-2 space-y-1">
                <p className="text-[10px] text-white/40 uppercase font-bold">NFT Details</p>
                <div className="grid grid-cols-2 gap-x-3 gap-y-0.5 text-[10px]">
                  <span className="text-white/40">Launched</span>
                  <span className="text-white/70 font-bold">{video.nft_editions_sold || 0} NFTs</span>
                  <span className="text-white/40">Views/NFT</span>
                  <span className="text-white/70 font-bold">{video.nft_max_views}</span>
                  <span className="text-white/40">Mint Price</span>
                  <span className="font-bold" style={{ color: themeAccent }}>${video.nft_price}</span>
                </div>
              </div>

              {video.recharge_enabled && (
                <div className="flex items-center gap-1.5 text-[10px] font-bold px-2 py-1 rounded-full w-fit" style={{ backgroundColor: themeAccent + "20", color: themeAccent }}>
                  <RefreshCw className="w-3 h-3" /> Recharge · ${video.recharge_price}
                </div>
              )}
              {!video.recharge_enabled && (
                <p className="text-[10px] text-white/30 italic">🏆 Collectible — no recharge, limited views</p>
              )}
            </div>

            <div className="pt-3">
              {soldOut ? (
                <div className="w-full py-3 bg-red-500/20 text-red-400 rounded-xl text-center text-xs font-black">SOLD OUT</div>
              ) : (
                <button onClick={onBuy}
                  className="w-full py-3 rounded-xl text-sm font-black hover:opacity-90 transition-opacity flex items-center justify-center gap-2 shadow-lg text-white"
                  style={{ backgroundColor: themeAccent }}>
                  <ShoppingCart className="w-4 h-4" /> Buy NFT · ${video.nft_price}
                </button>
              )}
              <p className="text-[8px] text-white/20 text-center mt-1.5">Minted on Polygon · Proof of ownership</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NftFlipCard;
