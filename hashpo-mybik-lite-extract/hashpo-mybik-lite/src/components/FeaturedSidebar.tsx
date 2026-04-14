import { Link } from "react-router-dom";
import { Star, TrendingUp } from "lucide-react";
import type { Video } from "@/hooks/useVideos";

interface Props {
  videos: Video[];
}

const FeaturedSidebar = ({ videos }: Props) => {
  const featured = videos.filter((v) => v.featured && !v.blocked).slice(0, 8);

  if (featured.length === 0) return null;

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Star className="w-4 h-4 text-accent" />
        <h2 className="text-xs font-extrabold text-foreground uppercase tracking-wider font-mono">
          Featured
        </h2>
      </div>

      <div className="space-y-2">
        {featured.map((v) => (
          <Link
            key={v.id}
            to={`/video/${v.id}`}
            className="flex gap-2 p-2 rounded-lg bg-card border border-border hover:border-primary/30 transition-colors group"
          >
            <div className="w-20 h-12 rounded overflow-hidden flex-shrink-0 bg-secondary">
              {v.thumbnail_url && (
                <img src={v.thumbnail_url} alt={v.title} className="w-full h-full object-cover" loading="lazy" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[11px] font-bold text-foreground line-clamp-2 leading-tight">
                {v.title}
              </p>
              <div className="flex items-center gap-1 mt-1">
                <span className="text-[9px] font-mono font-bold text-primary">{v.ticker}</span>
                <TrendingUp className="w-2.5 h-2.5 text-[#00C853]" />
                <span className="text-[9px] font-mono text-[#00C853] font-bold">
                  ${v.share_price.toFixed(2)}
                </span>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
};

export default FeaturedSidebar;
