'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { Header } from '@/components/layout/Header';
import { useT } from '@/lib/i18n';
import {
  ArrowRight,
  Gem,
  QrCode,
  Shield,
  Sparkles,
  TrendingUp,
  Wallet,
  Building2,
} from 'lucide-react';

const marbleBg = {
  background: `
    radial-gradient(ellipse 90% 55% at 15% 20%, rgba(255,250,245,0.07) 0%, transparent 52%),
    radial-gradient(ellipse 70% 45% at 88% 75%, rgba(201,162,39,0.12) 0%, transparent 48%),
    radial-gradient(ellipse 50% 30% at 50% 100%, rgba(120,100,80,0.15) 0%, transparent 55%),
    linear-gradient(165deg, #080706 0%, #0f0c0a 35%, #12100e 70%, #080706 100%)
  `,
} as const;

const goldLine =
  'linear-gradient(90deg, transparent, rgba(201,162,39,0.45), rgba(255,223,140,0.85), rgba(201,162,39,0.45), transparent)';

export default function EnterprisePage() {
  const T = useT();
  const [budget, setBudget] = useState(500_000);
  const [drops, setDrops] = useState(100_000);
  const [cplGoogle, setCplGoogle] = useState(500);
  const [cplMeta, setCplMeta] = useState(200);

  const calc = useMemo(() => {
    const b = Math.max(1, budget);
    const n = Math.max(1, drops);
    const g = Math.max(1, cplGoogle);
    const m = Math.max(1, cplMeta);
    const effective = b / n;
    return {
      effectiveCpl: effective,
      equivGoogle: Math.floor(b / g),
      equivMeta: Math.floor(b / m),
    };
  }, [budget, drops, cplGoogle, cplMeta]);

  return (
    <div className="min-h-screen text-[#e8e4dc]" style={marbleBg}>
      <Header />

      <main className="relative">
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.35]"
          style={{
            backgroundImage: `repeating-linear-gradient(
              -12deg,
              transparent,
              transparent 120px,
              rgba(255,255,255,0.02) 120px,
              rgba(255,255,255,0.02) 121px
            )`,
          }}
        />

        {/* Hero */}
        <section className="relative max-w-5xl mx-auto px-4 pt-14 pb-20 text-center">
          <p className="text-[11px] font-black tracking-[0.35em] uppercase text-[#c9a227]/90 mb-4">
            {T('ent_hero_kicker')}
          </p>
          <h1
            className="text-4xl sm:text-5xl md:text-6xl font-black leading-[1.08] mb-6"
            style={{
              background: 'linear-gradient(135deg, #fff8e7 0%, #e8c547 38%, #c9a227 55%, #8a7020 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}
          >
            {T('ent_hero_title')}
          </h1>
          <p className="text-base sm:text-lg text-[#b8b0a3] max-w-3xl mx-auto leading-relaxed font-medium">
            {T('ent_hero_sub')}
          </p>
          <div
            className="h-px w-full max-w-md mx-auto mt-10 mb-10"
            style={{ background: goldLine }}
          />
          <div className="flex flex-wrap justify-center gap-4">
            <Link
              href="/dashboard/campanhas"
              className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl font-black text-sm uppercase tracking-wider text-[#1a1508] shadow-lg shadow-amber-900/40 transition hover:brightness-110"
              style={{
                background: 'linear-gradient(135deg, #f0d78c 0%, #c9a227 45%, #a88415 100%)',
              }}
            >
              {T('ent_cta_campaigns')}
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/company/onboarding"
              className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl font-bold text-sm border border-[#c9a227]/50 text-[#f5e6bc] hover:bg-[#c9a227]/10 transition"
            >
              <Building2 className="w-4 h-4 text-[#c9a227]" />
              {T('ent_cta_onboarding')}
            </Link>
          </div>
        </section>

        {/* Pillars */}
        <section className="relative max-w-6xl mx-auto px-4 pb-20">
          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                icon: Wallet,
                title: T('ent_pillar_wallet_title'),
                body: T('ent_pillar_wallet_body'),
              },
              {
                icon: Gem,
                title: T('ent_pillar_nft_title'),
                body: T('ent_pillar_nft_body'),
              },
              {
                icon: Sparkles,
                title: T('ent_pillar_collect_title'),
                body: T('ent_pillar_collect_body'),
              },
            ].map(({ icon: Icon, title, body }) => (
              <div
                key={title}
                className="rounded-2xl p-6 border border-[#2a2620] bg-[#0c0a08]/80 backdrop-blur-sm shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]"
              >
                <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-4 border border-[#c9a227]/30 bg-[#c9a227]/10">
                  <Icon className="w-6 h-6 text-[#e8c547]" />
                </div>
                <h3 className="text-lg font-black text-[#f5e6bc] mb-2">{title}</h3>
                <p className="text-sm text-[#9a9288] leading-relaxed">{body}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Comparison */}
        <section className="relative max-w-4xl mx-auto px-4 pb-20">
          <div className="text-center mb-10">
            <h2 className="text-2xl sm:text-3xl font-black text-[#f5e6bc] mb-2">{T('ent_compare_title')}</h2>
            <p className="text-sm text-[#9a9288] max-w-2xl mx-auto">{T('ent_compare_sub')}</p>
          </div>
          <div className="overflow-x-auto rounded-2xl border border-[#2a2620] bg-[#0c0a08]/90">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#2a2620] text-left text-[#c9a227] text-xs uppercase tracking-wider">
                  <th className="p-4 font-black">{T('ent_compare_col_channel')}</th>
                  <th className="p-4 font-black">{T('ent_compare_col_cpl')}</th>
                  <th className="p-4 font-black">{T('ent_compare_col_certainty')}</th>
                </tr>
              </thead>
              <tbody className="text-[#c4bcb0]">
                <tr className="border-b border-[#1f1c18]">
                  <td className="p-4 font-semibold">{T('ent_row_google')}</td>
                  <td className="p-4 font-mono">~500 USD</td>
                  <td className="p-4 text-[#8a8278]">{T('ent_row_uncertain')}</td>
                </tr>
                <tr className="border-b border-[#1f1c18]">
                  <td className="p-4 font-semibold">{T('ent_row_meta')}</td>
                  <td className="p-4 font-mono">~200 USD</td>
                  <td className="p-4 text-[#8a8278]">{T('ent_row_uncertain')}</td>
                </tr>
                <tr className="bg-[#c9a227]/[0.07]">
                  <td className="p-4 font-black text-[#f5e6bc]">{T('ent_row_tb')}</td>
                  <td className="p-4 font-mono text-[#e8c547]">{T('ent_row_tb_cpl')}</td>
                  <td className="p-4 font-semibold text-[#b8f5c4]">{T('ent_row_tb_delivery')}</td>
                </tr>
              </tbody>
            </table>
          </div>
          <p className="text-[10px] text-[#6a6258] mt-3 text-center">* {T('ent_footer_note')}</p>
        </section>

        {/* Calculator */}
        <section className="relative max-w-4xl mx-auto px-4 pb-24">
          <div
            className="rounded-3xl border border-[#c9a227]/25 p-8 sm:p-10 shadow-[0_0_80px_rgba(201,162,39,0.12)]"
            style={{
              background:
                'linear-gradient(145deg, rgba(18,16,14,0.95) 0%, rgba(10,9,8,0.98) 100%)',
            }}
          >
            <div className="flex items-center gap-3 mb-2">
              <TrendingUp className="w-7 h-7 text-[#c9a227]" />
              <h2 className="text-2xl font-black text-[#f5e6bc]">{T('ent_calc_title')}</h2>
            </div>
            <p className="text-sm text-[#9a9288] mb-8 leading-relaxed">{T('ent_calc_sub')}</p>

            <div className="grid sm:grid-cols-2 gap-6 mb-10">
              <label className="block space-y-2">
                <span className="text-xs font-bold uppercase tracking-wide text-[#c9a227]">
                  {T('ent_calc_budget')}
                </span>
                <input
                  type="number"
                  min={1000}
                  step={1000}
                  value={budget}
                  onChange={(e) => setBudget(Number(e.target.value) || 0)}
                  className="w-full rounded-xl bg-[#1a1612] border border-[#3a342c] px-4 py-3 font-mono text-[#f5e6bc] focus:border-[#c9a227] focus:ring-1 focus:ring-[#c9a227] outline-none"
                />
              </label>
              <label className="block space-y-2">
                <span className="text-xs font-bold uppercase tracking-wide text-[#c9a227]">
                  {T('ent_calc_drops')}
                </span>
                <input
                  type="number"
                  min={100}
                  step={100}
                  value={drops}
                  onChange={(e) => setDrops(Number(e.target.value) || 0)}
                  className="w-full rounded-xl bg-[#1a1612] border border-[#3a342c] px-4 py-3 font-mono text-[#f5e6bc] focus:border-[#c9a227] focus:ring-1 focus:ring-[#c9a227] outline-none"
                />
              </label>
              <label className="block space-y-2">
                <span className="text-xs font-bold uppercase tracking-wide text-[#8a8278]">
                  {T('ent_calc_cpl_google')}
                </span>
                <input
                  type="number"
                  min={1}
                  value={cplGoogle}
                  onChange={(e) => setCplGoogle(Number(e.target.value) || 1)}
                  className="w-full rounded-xl bg-[#1a1612] border border-[#3a342c] px-4 py-3 font-mono text-[#c4bcb0] focus:border-[#c9a227] outline-none"
                />
              </label>
              <label className="block space-y-2">
                <span className="text-xs font-bold uppercase tracking-wide text-[#8a8278]">
                  {T('ent_calc_cpl_meta')}
                </span>
                <input
                  type="number"
                  min={1}
                  value={cplMeta}
                  onChange={(e) => setCplMeta(Number(e.target.value) || 1)}
                  className="w-full rounded-xl bg-[#1a1612] border border-[#3a342c] px-4 py-3 font-mono text-[#c4bcb0] focus:border-[#c9a227] outline-none"
                />
              </label>
            </div>

            <div
              className="h-px w-full mb-8"
              style={{ background: goldLine }}
            />

            <p className="text-center text-xs font-black uppercase tracking-[0.2em] text-[#c9a227] mb-6">
              {T('ent_calc_headline_stats')}
            </p>
            <div className="grid sm:grid-cols-3 gap-4 mb-10 text-center">
              <div className="rounded-xl border border-[#2a2620] bg-[#080706] p-5">
                <p className="text-3xl font-black text-[#e8c547] tabular-nums">{drops.toLocaleString()}</p>
                <p className="text-[11px] text-[#8a8278] mt-1 uppercase tracking-wide">{T('ent_calc_stat_wallets')}</p>
              </div>
              <div className="rounded-xl border border-[#2a2620] bg-[#080706] p-5">
                <p className="text-3xl font-black text-[#e8c547] tabular-nums">{drops.toLocaleString()}</p>
                <p className="text-[11px] text-[#8a8278] mt-1 uppercase tracking-wide">{T('ent_calc_stat_drops')}</p>
              </div>
              <div className="rounded-xl border border-[#c9a227]/40 bg-[#c9a227]/10 p-5">
                <p className="text-3xl font-black text-[#b8f5c4] tabular-nums">100%</p>
                <p className="text-[11px] text-[#8a8278] mt-1 uppercase tracking-wide">{T('ent_calc_stat_delivery')}</p>
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-6 text-sm">
              <div className="rounded-xl border border-[#2a2620] p-5 space-y-2">
                <p className="text-[#c9a227] font-bold">{T('ent_calc_effective_cpl')}</p>
                <p className="text-2xl font-black font-mono text-[#f5e6bc]">
                  US${calc.effectiveCpl.toFixed(2)}
                </p>
              </div>
              <div className="rounded-xl border border-[#2a2620] p-5 space-y-3">
                <p className="text-[#9a9288]">
                  {T('ent_calc_leads_equiv_google')}:{' '}
                  <span className="font-mono font-bold text-[#f5e6bc]">{calc.equivGoogle.toLocaleString()}</span>
                </p>
                <p className="text-[#9a9288]">
                  {T('ent_calc_leads_equiv_meta')}:{' '}
                  <span className="font-mono font-bold text-[#f5e6bc]">{calc.equivMeta.toLocaleString()}</span>
                </p>
              </div>
            </div>
            <p className="text-center text-[11px] text-[#6a6258] mt-8">{T('ent_footer_note')}</p>
          </div>
        </section>

        {/* Stories + utility strip */}
        <section className="relative max-w-5xl mx-auto px-4 pb-28">
          <div className="grid md:grid-cols-2 gap-8 mb-16">
            <div className="rounded-2xl border border-[#2a2620] p-6 bg-[#0c0a08]/60">
              <h3 className="text-lg font-black text-[#f5e6bc] mb-3">{T('ent_story_bmw_title')}</h3>
              <p className="text-sm text-[#9a9288] leading-relaxed">{T('ent_story_bmw_body')}</p>
            </div>
            <div className="rounded-2xl border border-[#2a2620] p-6 bg-[#0c0a08]/60">
              <h3 className="text-lg font-black text-[#f5e6bc] mb-3">{T('ent_story_rolex_title')}</h3>
              <p className="text-sm text-[#9a9288] leading-relaxed">{T('ent_story_rolex_body')}</p>
            </div>
          </div>

          <div className="flex flex-wrap justify-center gap-6 text-center text-xs text-[#8a8278] uppercase tracking-widest">
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-[#c9a227]" />
              <span>KYC</span>
            </div>
            <div className="flex items-center gap-2">
              <QrCode className="w-4 h-4 text-[#c9a227]" />
              <span>QR</span>
            </div>
            <div className="flex items-center gap-2">
              <Wallet className="w-4 h-4 text-[#c9a227]" />
              <span>Polygon</span>
            </div>
            <div className="flex items-center gap-2">
              <Gem className="w-4 h-4 text-[#c9a227]" />
              <span>Mercado secundário</span>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
