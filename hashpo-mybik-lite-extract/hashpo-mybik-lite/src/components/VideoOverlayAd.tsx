import { useAdsBySlot, trackAdClick } from "@/hooks/useAds";

interface Props {
  className?: string;
}

const VideoOverlayAd = ({ className = "" }: Props) => {
  const { data: ads } = useAdsBySlot("overlay");
  const ad = ads && ads.length > 0 ? ads[Math.floor(Math.random() * ads.length)] : null;

  if (!ad) return null;

  const handleClick = () => {
    trackAdClick(ad.id);
    if (ad.link_url) window.open(ad.link_url, "_blank");
  };

  return (
    <div
      onClick={handleClick}
      className={`absolute bottom-0 left-0 right-0 h-10 bg-black/70 flex items-center justify-between px-3 cursor-pointer hover:bg-black/80 transition-colors z-10 ${className}`}
    >
      <div className="flex items-center gap-2">
        {ad.image_url && <img src={ad.image_url} alt="" className="h-7 w-7 rounded object-cover" />}
        <span className="text-white text-xs font-bold truncate">{ad.title}</span>
      </div>
      <span className="text-[8px] text-white/60 shrink-0">AD</span>
    </div>
  );
};

export default VideoOverlayAd;
