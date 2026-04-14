import { VideoSlot as VideoSlotType } from "@/data/mockDatabase";
import { TrendingUp, TrendingDown, Star, Ban } from "lucide-react";
import { useStore } from "@/store/useStore";

interface VideoGridProps {
  videos: VideoSlotType[];
}

const VideoGrid = ({ videos }: VideoGridProps) => {
  const settings = useStore((s) => s.settings);

  return (
    <div className="grid grid-cols-5 border-t border-l border-grid-border">
      {videos.map((video) => (
        <div
          key={video.id}
          className={`grid-slot border-r border-b p-2.5 min-h-[100px] flex flex-col justify-between transition-colors relative ${
            video.blocked ? "opacity-40" : ""
          }`}
        >
          {video.featured && (
            <Star className="absolute top-1.5 right-1.5 w-3.5 h-3.5 text-primary fill-primary" />
          )}
          {video.blocked && (
            <Ban className="absolute top-1.5 right-1.5 w-3.5 h-3.5 text-destructive" />
          )}

          <div className="flex flex-col gap-0.5">
            <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide truncate">
              {video.category}
            </span>
            <span className="text-xs font-semibold text-foreground leading-tight line-clamp-2">
              {video.title}
            </span>
            <span className="text-[10px] text-muted-foreground truncate">
              {video.creator}
            </span>
          </div>

          <div className="flex items-center justify-between mt-1.5">
            <span className="ticker-badge">{video.ticker}</span>
            <div className="flex items-center gap-0.5">
              {video.sharePrice > 25 ? (
                <TrendingUp className="w-3 h-3 text-primary" />
              ) : (
                <TrendingDown className="w-3 h-3 text-destructive" />
              )}
              <span className="text-xs font-mono font-bold text-foreground">
                ${video.sharePrice.toFixed(2)}
              </span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default VideoGrid;
