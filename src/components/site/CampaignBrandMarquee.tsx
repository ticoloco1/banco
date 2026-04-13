'use client';

import { useEffect, useState } from 'react';

type Logo = { id: string; title: string; logoUrl: string; linkUrl: string | null };

export function CampaignBrandMarquee() {
  const [items, setItems] = useState<Logo[]>([]);

  useEffect(() => {
    void fetch('/api/public/active-campaign-logos', { cache: 'no-store' })
      .then((r) => r.json())
      .then((j) => {
        if (Array.isArray(j.items)) setItems(j.items);
      })
      .catch(() => setItems([]));
  }, []);

  if (items.length === 0) return null;

  const repeated = [...items, ...items, ...items];

  return (
    <div
      className="overflow-hidden border-b border-white/10"
      style={{
        background: 'linear-gradient(90deg,#0c0c12,#12121c,#0c0c12)',
        height: 48,
      }}
      aria-label="Marcas com campanhas ativas"
    >
      <div
        className="flex items-center h-full gap-10"
        style={{
          animation: 'brandMarquee 45s linear infinite',
          width: 'max-content',
        }}
      >
        {repeated.map((it, i) => {
          const inner = (
            <span className="inline-flex items-center gap-2 shrink-0" title={it.title}>
              <img
                src={it.logoUrl}
                alt=""
                className="h-8 w-auto max-w-[120px] object-contain opacity-90 hover:opacity-100 transition-opacity"
                loading="lazy"
              />
              <span className="text-[10px] font-bold text-white/35 uppercase tracking-wider hidden sm:inline">
                {it.title.slice(0, 24)}
                {it.title.length > 24 ? '…' : ''}
              </span>
            </span>
          );
          return it.linkUrl ? (
            <a
              key={`${it.id}_${i}`}
              href={it.linkUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="shrink-0"
            >
              {inner}
            </a>
          ) : (
            <span key={`${it.id}_${i}`} className="shrink-0">
              {inner}
            </span>
          );
        })}
      </div>
      <style>{`
        @keyframes brandMarquee {
          0% { transform: translateX(0); }
          100% { transform: translateX(-33.333%); }
        }
      `}</style>
    </div>
  );
}
