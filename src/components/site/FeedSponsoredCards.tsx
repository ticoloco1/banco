'use client';

import { useEffect, useState } from 'react';
import type { FeedSponsoredCard } from '@/lib/feedSponsoredServer';

type Props = {
  siteSlug: string;
  accentColor: string;
  textColor: string;
  textMuted: string;
  borderColor: string;
  bgCard: string;
  radius: number;
};

export function FeedSponsoredCards({
  siteSlug,
  accentColor,
  textColor,
  textMuted,
  borderColor,
  bgCard,
  radius,
}: Props) {
  const [items, setItems] = useState<FeedSponsoredCard[]>([]);

  useEffect(() => {
    if (!siteSlug) return;
    void fetch(`/api/public/feed-sponsored-posts?slug=${encodeURIComponent(siteSlug)}`, { cache: 'no-store' })
      .then((r) => r.json())
      .then((j) => {
        if (Array.isArray(j.items)) setItems(j.items.slice(0, 2));
      })
      .catch(() => setItems([]));
  }, [siteSlug]);

  if (items.length === 0) return null;

  return (
    <div style={{ marginBottom: 14, display: 'flex', flexDirection: 'column', gap: 10 }}>
      {items.map((ad) => (
        <div
          key={ad.id}
          style={{
            padding: 14,
            borderRadius: Math.max(8, radius - 4),
            border: `1.5px solid ${accentColor}55`,
            background: `linear-gradient(135deg, ${accentColor}12, ${bgCard})`,
          }}
        >
          <p style={{ margin: '0 0 6px', fontSize: 10, fontWeight: 800, color: accentColor, letterSpacing: '0.06em' }}>
            PATROCINADO
          </p>
          {ad.imageUrl ? (
            <div style={{ marginBottom: 10, borderRadius: 8, overflow: 'hidden', maxHeight: 140 }}>
              <img src={ad.imageUrl} alt="" style={{ width: '100%', height: 'auto', objectFit: 'cover', display: 'block' }} />
            </div>
          ) : null}
          <p style={{ margin: '0 0 6px', fontSize: 15, fontWeight: 800, color: textColor }}>{ad.title}</p>
          {ad.body ? (
            <p style={{ margin: '0 0 10px', fontSize: 13, color: textMuted, lineHeight: 1.55 }}>{ad.body}</p>
          ) : null}
          {ad.ctaUrl && ad.ctaLabel ? (
            <a
              href={ad.ctaUrl}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: 'inline-block',
                padding: '8px 14px',
                borderRadius: 999,
                background: accentColor,
                color: '#0a0a0a',
                fontWeight: 800,
                fontSize: 12,
                textDecoration: 'none',
              }}
            >
              {ad.ctaLabel}
            </a>
          ) : null}
        </div>
      ))}
    </div>
  );
}
