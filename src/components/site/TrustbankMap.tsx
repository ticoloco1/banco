'use client';

import { useMemo } from 'react';

export type TrustbankMapSlot = {
  id: string;
  slug: string;
  isPremium?: boolean;
  isYours?: boolean;
  salePrice?: number;
  /** Linha original do mercado para o callback de compra */
  raw?: Record<string, unknown>;
};

type Props = {
  slots: TrustbankMapSlot[];
  cols?: number;
  onPurchase?: (raw: Record<string, unknown>) => void;
  className?: string;
  labels?: { buy: string; empty: string; legendPremium: string; legendYours: string; legendFree: string };
};

/** Mapa isométrico “metaverso”: grelha com terrenos, premium dourado e CTA comprar. */
export function TrustbankMap({
  slots,
  cols = 20,
  onPurchase,
  className = '',
  labels = {
    buy: 'COMPRAR',
    empty: 'Livre',
    legendPremium: 'Premium',
    legendYours: 'Teu',
    legendFree: 'Disponível',
  },
}: Props) {
  const gridStyle = useMemo(
    () => ({
      display: 'grid' as const,
      gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`,
      gap: '3px',
    }),
    [cols],
  );

  return (
    <div className={`relative overflow-hidden rounded-2xl border border-cyan-500/25 bg-[#030712] p-3 sm:p-4 ${className}`}>
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.12]"
        style={{
          backgroundImage:
            'linear-gradient(90deg, rgba(34,211,238,0.25) 1px, transparent 1px), linear-gradient(rgba(34,211,238,0.2) 1px, transparent 1px)',
          backgroundSize: '24px 24px',
        }}
      />
      <div className="relative mb-3 flex flex-wrap items-center gap-3 text-[10px] font-bold uppercase tracking-wider text-zinc-400">
        <span className="inline-flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-sm bg-gradient-to-br from-amber-400 to-amber-900 shadow-[0_0_8px_rgba(251,191,36,0.6)]" />
          {labels.legendPremium}
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-sm bg-violet-500/80 shadow-[0_0_6px_rgba(139,92,246,0.5)]" />
          {labels.legendYours}
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-sm border border-zinc-600 bg-zinc-900/80" />
          {labels.legendFree}
        </span>
      </div>

      <div
        className="relative mx-auto max-w-full [perspective:1400px]"
        style={{ transformStyle: 'preserve-3d' as const }}
      >
        <div
          className="origin-center transition-transform duration-500 ease-out"
          style={{
            transform: 'rotateX(58deg) rotateZ(-32deg) scale(0.92)',
            transformStyle: 'preserve-3d' as const,
          }}
        >
          <div style={gridStyle} className="rounded-lg border border-white/5 bg-black/40 p-1 shadow-[0_0_40px_rgba(6,182,212,0.15)]">
            {slots.map((slot) => {
              const hasPlot = Boolean(slot.slug);
              const premium = slot.isPremium === true;
              const yours = slot.isYours === true;

              return (
                <button
                  key={slot.id}
                  type="button"
                  disabled={!hasPlot || !slot.raw || yours}
                  onClick={() => {
                    if (slot.raw && onPurchase) onPurchase(slot.raw);
                  }}
                  title={hasPlot ? slot.slug : labels.empty}
                  className={`
                    group relative aspect-square min-h-0 overflow-hidden rounded-md border text-left transition-all duration-300
                    ${premium ? 'border-amber-500/50 bg-gradient-to-br from-amber-600/90 to-amber-950 shadow-[0_0_12px_rgba(251,191,36,0.35)]' : ''}
                    ${!premium && hasPlot ? 'border-violet-500/30 bg-gradient-to-br from-violet-950/80 to-zinc-950' : ''}
                    ${!hasPlot ? 'cursor-default border-zinc-800/80 bg-zinc-950/60' : 'cursor-pointer hover:z-10 hover:scale-[1.08] hover:border-cyan-400/50 hover:shadow-[0_0_14px_rgba(34,211,238,0.25)]'}
                    ${yours ? 'ring-1 ring-violet-400/60' : ''}
                  `}
                >
                  {hasPlot && (
                    <span
                      className={`absolute inset-0 flex items-center justify-center px-0.5 text-center font-mono text-[7px] font-black uppercase leading-tight sm:text-[8px] ${
                        premium ? 'text-amber-100' : 'text-zinc-200'
                      } opacity-70 group-hover:opacity-100`}
                    >
                      {slot.slug.length > 5 ? `${slot.slug.slice(0, 4)}…` : slot.slug}
                    </span>
                  )}
                  {hasPlot && !yours && slot.raw && onPurchase && (
                    <span className="absolute bottom-0 left-0 right-0 translate-y-full bg-emerald-500/90 py-0.5 text-center text-[6px] font-black text-white transition-transform group-hover:translate-y-0 sm:text-[7px]">
                      {labels.buy}
                    </span>
                  )}
                  {yours && (
                    <span className="absolute bottom-0.5 left-0 right-0 text-center text-[6px] font-bold text-violet-200">★</span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
