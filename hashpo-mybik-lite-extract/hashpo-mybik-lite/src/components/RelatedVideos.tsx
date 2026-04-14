import { Link } from "react-router-dom";
import { useVideos, type Video } from "@/hooks/useVideos";

interface Props {
  currentVideo: Video;
}

const RelatedVideos = ({ currentVideo }: Props) => {
  const { data: videos } = useVideos(null);

  const related = (videos || [])
    .filter((v) => v.id !== currentVideo.id && !v.blocked)
    .sort((a, b) => {
      // Prioritize same category
      const aMatch = a.category === currentVideo.category ? 1 : 0;
      const bMatch = b.category === currentVideo.category ? 1 : 0;
      if (aMatch !== bMatch) return bMatch - aMatch;
      return b.revenue - a.revenue;
    })
    .slice(0, 20);

  if (related.length === 0) return null;

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-bold text-foreground">Related Videos</h3>
      <div className="space-y-2">
        {related.map((v) => (
          <Link
            key={v.id}
            to={`/video/${v.id}`}
            className="flex gap-2 group hover:bg-muted/50 rounded-lg p-1.5 transition-colors"
          >
            <div className="w-40 h-[90px] rounded-lg overflow-hidden flex-shrink-0 bg-muted">
              {v.thumbnail_url && (
                <img
                  src={v.thumbnail_url}
                  alt={v.title}
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
              )}
            </div>
            <div className="flex-1 min-w-0 py-0.5">
              <p className="text-xs font-semibold text-foreground line-clamp-2 leading-snug">
                {v.title}
              </p>
              <p className="text-[10px] text-muted-foreground mt-1 capitalize">
                {v.category}
              </p>
              <div className="flex items-center gap-1.5 mt-1">
                <span className="text-[10px] font-mono font-bold text-primary">
                  {v.ticker}
                </span>
                <span className="text-[10px] font-mono text-muted-foreground">
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

export default RelatedVideos;
