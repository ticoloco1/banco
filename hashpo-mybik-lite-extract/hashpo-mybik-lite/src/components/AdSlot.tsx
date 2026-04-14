import { useAdsBySlot, trackAdClick } from "@/hooks/useAds";
import { useEffect, useRef } from "react";

interface Props {
  slot: "billboard" | "sidebar" | "overlay" | "sponsored";
  className?: string;
}

const slotSizes: Record<string, { w: string; h: string }> = {
  billboard: { w: "w-full", h: "h-24" },
  sidebar: { w: "w-full", h: "h-64" },
  overlay: { w: "w-80", h: "h-48" },
  sponsored: { w: "w-32", h: "h-10" },
};

const AdSlot = ({ slot, className = "" }: Props) => {
  const { data: ads } = useAdsBySlot(slot);
  const seen = useRef(false);

  // Pick random ad from available
  const ad = ads && ads.length > 0 ? ads[Math.floor(Math.random() * ads.length)] : null;

  useEffect(() => {
    if (ad && !seen.current) {
      seen.current = true;
      // Track impression (fire-and-forget)
    }
  }, [ad]);

  if (!ad) {
    return (
      <div className={`${slotSizes[slot]?.w} ${slotSizes[slot]?.h} bg-secondary/50 border border-dashed border-border rounded-lg flex items-center justify-center ${className}`}>
        <span className="text-[10px] text-muted-foreground font-mono uppercase">
          Ad Slot — {slot}
        </span>
      </div>
    );
  }

  const handleClick = () => {
    trackAdClick(ad.id);
    if (ad.link_url) window.open(ad.link_url, "_blank");
  };

  return (
    <div
      onClick={handleClick}
      className={`${slotSizes[slot]?.w} ${slotSizes[slot]?.h} rounded-lg overflow-hidden cursor-pointer relative group ${className}`}
    >
      {ad.image_url ? (
        <img src={ad.image_url} alt={ad.title} className="w-full h-full object-cover" />
      ) : (
        <div className="w-full h-full bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center">
          <span className="text-primary-foreground font-bold text-sm">{ad.title}</span>
        </div>
      )}
      <span className="absolute bottom-1 right-1 text-[8px] bg-black/50 text-white px-1 rounded">
        AD
      </span>
    </div>
  );
};

export default AdSlot;
