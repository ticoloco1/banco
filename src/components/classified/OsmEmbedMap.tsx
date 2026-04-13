'use client';

type Props = {
  lat: number;
  lng: number;
  className?: string;
};

/** Mapa estático (embed OSM) para detalhe do anúncio — sem Leaflet, leve. */
export function OsmEmbedMap({ lat, lng, className }: Props) {
  const d = 0.025;
  const bbox = `${lng - d},${lat - d},${lng + d},${lat + d}`;
  const src = `https://www.openstreetmap.org/export/embed.html?bbox=${encodeURIComponent(bbox)}&layer=mapnik&marker=${encodeURIComponent(`${lat},${lng}`)}`;

  return (
    <iframe
      title="Mapa"
      className={className || 'w-full h-[200px] rounded-xl border border-slate-200 dark:border-slate-700'}
      src={src}
      loading="lazy"
    />
  );
}
