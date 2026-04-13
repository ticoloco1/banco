'use client';

import { useEffect, useRef } from 'react';
import type { FeaturedPartnerAsset } from '@/lib/featuredPartnerNftsServer';
import { ImageIcon } from 'lucide-react';

type Props = {
  siteSlug: string;
  items: FeaturedPartnerAsset[];
  accentColor: string;
  textColor: string;
  textMuted: string;
  borderColor: string;
  bgCard: string;
  radius: number;
  title?: string;
};

export function FeaturedAssets({
  siteSlug,
  items,
  accentColor,
  textColor,
  textMuted,
  borderColor,
  bgCard,
  radius,
  title = 'Marcas parceiras',
}: Props) {
  const ackSent = useRef(false);

  useEffect(() => {
    if (!siteSlug || ackSent.current) return;
    ackSent.current = true;
    void fetch('/api/public/partner-nft-ack', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ slug: siteSlug }),
    }).catch(() => {
      ackSent.current = false;
    });
  }, [siteSlug]);

  const slots: (FeaturedPartnerAsset | null)[] = [0, 1, 2].map((i) => items[i] ?? null);

  return (
    <section
      style={{
        marginBottom: 28,
        padding: 16,
        borderRadius: radius,
        border: `1.5px solid ${borderColor}`,
        background: bgCard,
      }}
      aria-label={title}
    >
      <h2 style={{ margin: '0 0 12px', fontSize: 14, fontWeight: 800, color: textColor, letterSpacing: '0.02em' }}>
        {title}
      </h2>
      <p style={{ margin: '0 0 14px', fontSize: 11, color: textMuted, lineHeight: 1.5 }}>
        Os teus últimos NFTs de campanhas e marcas. Esta secção não pode ser removida do mini-site.
      </p>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
          gap: 10,
        }}
      >
        {slots.map((asset, idx) => (
          <div
            key={asset?.key || `empty_${idx}`}
            style={{
              borderRadius: Math.max(8, radius - 4),
              border: `1px solid ${borderColor}`,
              overflow: 'hidden',
              background: asset ? 'rgba(0,0,0,0.12)' : 'transparent',
              minHeight: 112,
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            {asset ? (
              <>
                <div
                  style={{
                    aspectRatio: '1 / 1',
                    maxHeight: 96,
                    background: `linear-gradient(145deg, ${accentColor}22, transparent)`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    overflow: 'hidden',
                  }}
                >
                  {asset.imageUrl ? (
                    <img src={asset.imageUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    <ImageIcon style={{ width: 28, height: 28, color: accentColor, opacity: 0.85 }} aria-hidden />
                  )}
                </div>
                <div style={{ padding: '8px 8px 10px', flex: 1 }}>
                  <p style={{ margin: 0, fontSize: 11, fontWeight: 800, color: textColor, lineHeight: 1.35 }}>{asset.title}</p>
                  {asset.subtitle ? (
                    <p style={{ margin: '4px 0 0', fontSize: 10, color: textMuted }}>{asset.subtitle}</p>
                  ) : null}
                  {asset.href ? (
                    <a
                      href={asset.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        marginTop: 6,
                        display: 'inline-block',
                        fontSize: 10,
                        fontWeight: 700,
                        color: accentColor,
                        textDecoration: 'none',
                      }}
                    >
                      Ver oferta →
                    </a>
                  ) : null}
                </div>
              </>
            ) : (
              <div
                style={{
                  flex: 1,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: 12,
                  borderStyle: 'dashed',
                  borderWidth: 1,
                  borderColor,
                  borderRadius: Math.max(8, radius - 4),
                  color: textMuted,
                  fontSize: 10,
                  fontWeight: 700,
                  textAlign: 'center',
                }}
              >
                Slot parceiro
              </div>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}
