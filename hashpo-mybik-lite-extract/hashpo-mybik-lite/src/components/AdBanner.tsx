import { useAdsBySlot, trackAdClick } from "@/hooks/useAds";
import { useEffect, useRef } from "react";

interface Props {
  size: "728x90" | "300x250";
  className?: string;
}

const sizeMap = {
  "728x90": { w: "max-w-[728px] w-full", h: "h-[90px]" },
  "300x250": { w: "w-[300px]", h: "h-[250px]" },
};

const slotMap = { "728x90": "billboard", "300x250": "sidebar" };

const AdBanner = ({ size, className = "" }: Props) => {
  const slot = slotMap[size];
  const { data: ads } = useAdsBySlot(slot);
  const seen = useRef(false);
  const ad = ads && ads.length > 0 ? ads[Math.floor(Math.random() * ads.length)] : null;

  useEffect(() => {
    if (ad && !seen.current) seen.current = true;
  }, [ad]);

  const s = sizeMap[size];

  if (!ad) {
    return (
      <div className={`${s.w} ${s.h} bg-secondary/30 border border-dashed border-border rounded-lg flex items-center justify-center mx-auto ${className}`}>
        <span className="text-[10px] text-muted-foreground font-mono uppercase">Ad {size}</span>
      </div>
    );
  }

  const handleClick = () => {
    trackAdClick(ad.id);
    if (ad.link_url) window.open(ad.link_url, "_blank");
  };

  return (
    <div onClick={handleClick} className={`${s.w} ${s.h} rounded-lg overflow-hidden cursor-pointer relative mx-auto group ${className}`}>
      {ad.image_url ? (
        <img src={ad.image_url} alt={ad.title} className="w-full h-full object-cover" />
      ) : (
        <div className="w-full h-full bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center">
          <span className="text-primary-foreground font-bold text-sm">{ad.title}</span>
        </div>
      )}
      <span className="absolute bottom-1 right-1 text-[8px] bg-black/50 text-white px-1 rounded">AD</span>
    </div>
  );
};

export default AdBanner;
